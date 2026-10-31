// Leilões (a parte REST; as licitações em direto são feitas por Socket.io)
const router = require('express').Router();
const auth = require('../middleware/auth');
const Auction = require('../models/Auction');
const a = require('../utils/async');
const erro = require('../utils/erro');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const produtorValidado = require(
  '../middleware/produtorValidado'
);

// GET /api/auctions?estado=ativo
// -> 200 [leilões]
router.get(
  '/',
  a(async (req, res) => {
    const { estado } = req.query;

    const estadosValidos = [
      'agendado',
      'ativo',
      'terminado'
    ];

    if (
      estado &&
      !estadosValidos.includes(estado)
    ) {
      throw erro(
        400,
        'Estado de leilão inválido'
      );
    }

    const filtro = estado
      ? { estado }
      : {};

    const leiloes = await Auction
      .find(filtro)
      .sort({
        iniciaEm: 1
      })
      .populate(
        'produtor',
        'nome produtor.nomeExploracao produtor.localidade'
      )
      .populate(
        'produto',
        'nome imagemUrl unidade'
      );

    res.json(leiloes);
  })
);

// GET /api/auctions/:id
// -> 200 { leilao, licitacoes }
router.get(
  '/:id',
  a(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw erro(
        400,
        'Identificador de leilão inválido'
      );
    }

    const leilao = await Auction
      .findById(id)
      .populate(
        'produtor',
        'nome produtor.nomeExploracao produtor.localidade'
      )
      .populate(
        'produto',
        'nome descricao imagemUrl unidade'
      );

    if (!leilao) {
      throw erro(
        404,
        'Leilão não encontrado'
      );
    }

    const licitacoes = await Bid
      .find({
        leilao: id
      })
      .sort({
        createdAt: -1
      })
      .limit(20);

    res.json({
      leilao,
      licitacoes
    });
  })
);

// POST /api/auctions
// Produtor validado -> 201
router.post(
  '/',
  auth('produtor'),
  produtorValidado,
  a(async (req, res) => {
    const {
      produto,
      lote,
      descricao,
      quantidade,
      precoBase,
      incremento,
      iniciaEm,
      duracaoMinutos
    } = req.body;

    if (!lote || !String(lote).trim()) {
      throw erro(
        400,
        'O lote é obrigatório'
      );
    }

    const preco = Number(precoBase);
    const incrementoMinimo =
      Number(incremento);

    const duracao =
      Number(duracaoMinutos);

    if (
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      throw erro(
        400,
        'O preço base tem de ser um número igual ou superior a zero'
      );
    }

    if (
      !Number.isFinite(incrementoMinimo) ||
      incrementoMinimo < 0.01
    ) {
      throw erro(
        400,
        'O incremento tem de ser igual ou superior a 0,01'
      );
    }

    if (
      !Number.isFinite(duracao) ||
      duracao <= 0
    ) {
      throw erro(
        400,
        'A duração tem de ser superior a zero'
      );
    }

    const inicio = iniciaEm
      ? new Date(iniciaEm)
      : new Date();

    if (
      Number.isNaN(inicio.getTime())
    ) {
      throw erro(
        400,
        'Data de início inválida'
      );
    }

    const fim = new Date(
      inicio.getTime() +
        duracao * 60 * 1000
    );

    const agora = new Date();

    if (fim <= agora) {
      throw erro(
        400,
        'O leilão tem de terminar no futuro'
      );
    }

    let produtoValido;

    if (produto) {
      if (
        !mongoose.isValidObjectId(
          produto
        )
      ) {
        throw erro(
          400,
          'Identificador de produto inválido'
        );
      }

      produtoValido =
        await Product.findOne({
          _id: produto,
          produtor: req.user.id
        });

      if (!produtoValido) {
        throw erro(
          404,
          'Produto não encontrado'
        );
      }
    }

    const estado =
      inicio > agora
        ? 'agendado'
        : 'ativo';

    const leilao =
      await Auction.create({
        produtor: req.user.id,

        ...(produtoValido
          ? {
              produto:
                produtoValido._id
            }
          : {}),

        lote: String(lote).trim(),

        descricao: descricao
          ? String(descricao).trim()
          : '',

        quantidade: quantidade
          ? String(quantidade).trim()
          : '',

        precoBase: preco,
        incremento: incrementoMinimo,

        licitacaoAtual: {
          valor: preco
        },

        iniciaEm: inicio,
        terminaEm: fim,
        estado
      });

        if (estado === 'ativo') {
      const io =
        req.app.get('io');

      io
        .to('admins')
        .emit(
          'admin-leilao-atualizado',
          {
            tipo: 'aberto',
            id: String(
              leilao._id
            )
          }
        );
    }

    res
      .status(201)
      .location(
        `/api/auctions/${leilao._id}`
      )
      .json(leilao);
  })
);

// GET /api/auctions/:id/bids
// -> 200 [licitações]
router.get(
  '/:id/bids',
  a(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw erro(
        400,
        'Identificador de leilão inválido'
      );
    }

    const existe = await Auction.exists({
      _id: id
    });

    if (!existe) {
      throw erro(
        404,
        'Leilão não encontrado'
      );
    }

    const licitacoes = await Bid
      .find({
        leilao: id
      })
      .sort({
        createdAt: -1
      })
      .populate(
        'comprador',
        'nome'
      );

    res.json(licitacoes);
  })
);

module.exports = router;
