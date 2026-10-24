const router = require('express').Router();
const { Types } = require('mongoose');

const Review = require('../models/Review');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');
const Order = require('../models/Order');

// GET /api/reviews/minhas
// Lista as avaliações do comprador autenticado.
router.get(
  '/minhas',
  auth('comprador'),
  a(async (req, res) => {
    const avaliacoes = await Review
      .find({
        autor: req.user.id
      })
      .select(
        '_id encomenda produto classificacao comentario visivel createdAt'
      )
      .sort({
        createdAt: -1
      });

    res.json(avaliacoes);
  })
);

// GET /api/reviews?produtor=&produto=
// Lista apenas avaliações visíveis.
router.get(
  '/',
  a(async (req, res) => {
    const {
      produtor,
      produto
    } = req.query;

    const filtro = {
      visivel: true
    };

    if (produtor) {
      if (!Types.ObjectId.isValid(produtor)) {
        throw erro(
          400,
          'Produtor inválido'
        );
      }

      filtro.produtor = produtor;
    }

    if (produto) {
      if (!Types.ObjectId.isValid(produto)) {
        throw erro(
          400,
          'Produto inválido'
        );
      }

      filtro.produto = produto;
    }

    const avaliacoes = await Review
      .find(filtro)
      .sort({
        createdAt: -1
      })
      .populate(
        'autor',
        'nome'
      )
      .populate(
        'produtor',
        'nome produtor.nomeExploracao produtor.localidade'
      )
      .populate(
        'produto',
        'nome categoria preco unidade'
      );

    res.json(avaliacoes);
  })
);

router.post(
  '/',
  auth('comprador'),
  a(async (req, res) => {
    const {
      encomenda,
      produto,
      classificacao,
      comentario
    } = req.body;

    if (!encomenda) {
      throw erro(
        400,
        'A encomenda é obrigatória'
      );
    }

    if (
      !Types.ObjectId.isValid(
        encomenda
      )
    ) {
      throw erro(
        400,
        'Encomenda inválida'
      );
    }

    const valorClassificacao =
      Number(classificacao);

    if (
      !Number.isInteger(
        valorClassificacao
      ) ||
      valorClassificacao < 1 ||
      valorClassificacao > 5
    ) {
      throw erro(
        400,
        'A classificação deve ser um número inteiro entre 1 e 5'
      );
    }

    const produtoId =
      produto || null;

    if (
      produtoId &&
      !Types.ObjectId.isValid(
        produtoId
      )
    ) {
      throw erro(
        400,
        'Produto inválido'
      );
    }

    const encomendaEncontrada =
      await Order.findOne({
        _id: encomenda,
        comprador: req.user.id
      });

    if (!encomendaEncontrada) {
      throw erro(
        404,
        'Encomenda não encontrada'
      );
    }

    if (
      encomendaEncontrada.estado !==
      'entregue'
    ) {
      throw erro(
        403,
        'Só pode avaliar uma encomenda entregue'
      );
    }

    if (produtoId) {
      const produtoPertence =
        encomendaEncontrada.linhas.some(
          (linha) =>
            linha.produto &&
            linha.produto.toString() ===
              produtoId
        );

      if (!produtoPertence) {
        throw erro(
          400,
          'O produto não pertence à encomenda'
        );
      }
    }

    const existente =
      await Review.findOne({
        autor: req.user.id,
        encomenda:
          encomendaEncontrada._id,
        produto: produtoId
      });

    if (existente) {
      throw erro(
        409,
        'Esta encomenda já foi avaliada'
      );
    }

    let avaliacao;

    try {
      avaliacao =
        await Review.create({
          autor: req.user.id,
          produtor:
            encomendaEncontrada.produtor,
          produto: produtoId,
          encomenda:
            encomendaEncontrada._id,
          classificacao:
            valorClassificacao,
          comentario:
            typeof comentario ===
              'string'
              ? comentario.trim()
              : ''
        });
    } catch (err) {
      if (err?.code === 11000) {
        throw erro(
          409,
          'Esta encomenda já foi avaliada'
        );
      }

      throw err;
    }

    await avaliacao.populate([
      {
        path: 'autor',
        select: 'nome'
      },
      {
        path: 'produtor',
        select:
          'nome produtor.nomeExploracao produtor.localidade'
      },
      {
        path: 'produto',
        select:
          'nome categoria preco unidade'
      }
    ]);

    res
      .status(201)
      .location(
        `/api/reviews/${avaliacao._id}`
      )
      .json(avaliacao);
  })
);

router.post(
  '/:id/denuncia',
  auth(),
  a(async (req, res) => {
    const {
      id
    } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw erro(
        400,
        'Avaliação inválida'
      );
    }

    const avaliacao =
      await Review.findOneAndUpdate(
        {
          _id: id,
          visivel: true
        },
        {
          $inc: {
            denuncias: 1
          }
        },
        {
          new: true
        }
      );

    if (!avaliacao) {
      throw erro(
        404,
        'Avaliação não encontrada'
      );
    }

    res.status(204).end();
  })
);

module.exports = router;