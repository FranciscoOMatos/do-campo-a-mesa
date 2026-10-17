// Painel do administrador
const router = require('express').Router();

const User = require('../models/User');
const auth = require('../middleware/auth');
const porFazer = require('./_naoImplementado');
const a = require('../utils/async');
const erro = require('../utils/erro');

router.use(auth('admin'));

// GET /api/admin/estatisticas
// -> 200 { utilizadores, produtores, encomendasHoje, leiloesAtivos }
router.get(
  '/estatisticas',
  porFazer('Estatísticas globais')
);

// GET /api/admin/produtores/pendentes
// Apenas produtores que ainda aguardam decisão.
router.get(
  '/produtores/pendentes',
  a(async (req, res) => {
    const produtores = await User
      .find({
        papel: 'produtor',
        'produtor.validado': false,

        $or: [
          {
            'produtor.estadoValidacao':
              'pendente'
          },
          {
            'produtor.estadoValidacao': {
              $exists: false
            }
          }
        ]
      })
      .sort({
        createdAt: 1
      });

    res.json(
      produtores.map(
        (produtor) =>
          produtor.publico()
      )
    );
  })
);

// PATCH /api/admin/produtores/:id/validacao
// Body: { aprovado: true | false }
router.patch(
  '/produtores/:id/validacao',
  a(async (req, res) => {
    const {
      aprovado
    } = req.body;

    if (
      typeof aprovado !==
      'boolean'
    ) {
      throw erro(
        400,
        'O campo aprovado tem de ser booleano'
      );
    }

    const produtor =
      await User.findOneAndUpdate(
        {
          _id: req.params.id,
          papel: 'produtor'
        },
        {
          $set: {
            'produtor.validado':
              aprovado,

            'produtor.estadoValidacao':
              aprovado
                ? 'aprovado'
                : 'rejeitado'
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!produtor) {
      throw erro(
        404,
        'Produtor não encontrado'
      );
    }

    res.json(
      produtor.publico()
    );
  })
);

// GET /api/admin/reviews/denunciadas
router.get(
  '/reviews/denunciadas',
  porFazer(
    'Avaliações denunciadas'
  )
);

// PATCH /api/admin/reviews/:id
// Body: { visivel: false }
router.patch(
  '/reviews/:id',
  porFazer(
    'Moderar avaliação'
  )
);

module.exports = router;
