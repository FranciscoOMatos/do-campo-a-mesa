// Leilões (a parte REST; as licitações em direto são feitas por Socket.io)
const router = require('express').Router();
const auth = require('../middleware/auth');
const porFazer = require('./_naoImplementado');
const Auction = require('../models/Auction');
const a = require('../utils/async');
const erro = require('../utils/erro');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');

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

// POST /api/auctions  (produtor)  -> 201
// TODO: definir licitacaoAtual.valor = precoBase e terminaEm = iniciaEm + duração
router.post('/', auth('produtor'), porFazer('Criar leilão'));

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
