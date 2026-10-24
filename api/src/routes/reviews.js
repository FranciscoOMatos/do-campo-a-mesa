const router = require('express').Router();
const { Types } = require('mongoose');

const Review = require('../models/Review');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');
const porFazer = require('./_naoImplementado');

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

// POST /api/reviews
// Comprador, apenas após encomenda entregue -> 201
router.post(
  '/',
  auth('comprador'),
  porFazer('Criar avaliação')
);

// POST /api/reviews/:id/denuncia
// Utilizador autenticado -> 204
router.post(
  '/:id/denuncia',
  auth(),
  porFazer('Denunciar avaliação')
);

module.exports = router;