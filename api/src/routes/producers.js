// Páginas públicas dos produtores
const router = require('express').Router();
const { Types } = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const a = require('../utils/async');
const erro = require('../utils/erro');

const escaparRegex = (texto) =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const perfilPublico = (utilizador) => ({
  id: utilizador._id,
  nome: utilizador.nome,
  produtor: {
    nomeExploracao:
      utilizador.produtor?.nomeExploracao,
    descricao:
      utilizador.produtor?.descricao || '',
    localidade:
      utilizador.produtor?.localidade,
    localizacao:
      utilizador.produtor?.localizacao
  }
});

// GET /api/producers?localidade=
// Lista apenas produtores validados.
router.get(
  '/',
  a(async (req, res) => {
    const {
      localidade
    } = req.query;

    const filtro = {
      papel: 'produtor',
      'produtor.validado': true
    };

    if (
      typeof localidade === 'string' &&
      localidade.trim()
    ) {
      filtro['produtor.localidade'] = {
        $regex: escaparRegex(
          localidade.trim()
        ),
        $options: 'i'
      };
    }

    const produtores = await User
      .find(filtro)
      .select(
        'nome produtor'
      )
      .sort({
        'produtor.nomeExploracao': 1,
        nome: 1
      });

    res.json(
      produtores.map(perfilPublico)
    );
  })
);

// GET /api/producers/:id
// Página pública de um produtor validado.
router.get(
  '/:id',
  a(async (req, res) => {
    const {
      id
    } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      throw erro(
        404,
        'Produtor não encontrado'
      );
    }

    const produtor = await User
      .findOne({
        _id: id,
        papel: 'produtor',
        'produtor.validado': true
      })
      .select(
        'nome produtor'
      )
      .lean();

    if (!produtor) {
      throw erro(
        404,
        'Produtor não encontrado'
      );
    }

    const [
      produtos,
      resumoAvaliacoes
    ] = await Promise.all([
      Product
        .find({
          produtor: produtor._id,
          stock: {
            $gt: 0
          }
        })
        .sort({
          nome: 1
        })
        .lean(),

      Review.aggregate([
        {
          $match: {
            produtor: produtor._id,
            visivel: true
          }
        },
        {
          $group: {
            _id: null,
            media: {
              $avg: '$classificacao'
            },
            total: {
              $sum: 1
            }
          }
        }
      ])
    ]);

    const resumo =
      resumoAvaliacoes[0];

    res.json({
      produtor: perfilPublico(produtor),
      produtos,
      avaliacaoMedia:
        resumo?.media ?? null,
      totalAvaliacoes:
        resumo?.total ?? 0
    });
  })
);

module.exports = router;