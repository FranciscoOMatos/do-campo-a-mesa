// Painel do administrador
const router = require('express').Router();

const User = require('../models/User');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Review = require('../models/Review');
const ReviewDenuncia = require('../models/ReviewDenuncia');
const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

router.use(auth('admin'));

// GET /api/admin/estatisticas
// -> 200 { utilizadores, produtores, encomendasHoje, leiloesAtivos }
router.get(
  '/estatisticas',
  a(async (req, res) => {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const inicioAmanha = new Date(inicioHoje);
    inicioAmanha.setDate(
      inicioAmanha.getDate() + 1
    );

    const [
      utilizadores,
      produtores,
      encomendasHoje,
      leiloesAtivos
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        papel: 'produtor'
      }),

      Order.countDocuments({
        createdAt: {
          $gte: inicioHoje,
          $lt: inicioAmanha
        }
      }),

      Auction.countDocuments({
        estado: 'ativo'
      })
    ]);

    res.json({
      utilizadores,
      produtores,
      encomendasHoje,
      leiloesAtivos
    });
  })
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
    a(async (req, res) => {
      const reviews = await Review
        .find({
          denuncias: {
            $gt: 0
          }
        })
        .sort({
          denuncias: -1,
          createdAt: -1
        })
        .populate(
          'autor',
          'nome email'
        )
        .populate(
          'produtor',
          'nome produtor.nomeExploracao'
        )
        .populate(
          'produto',
          'nome'
        );

      const ids = reviews.map(
        (review) => review._id
      );

      const denuncias = await ReviewDenuncia
        .find({
          avaliacao: {
            $in: ids
          }
        })
        .select(
          'avaliacao autor motivo descricao createdAt'
        )
        .populate(
          'autor',
          'nome'
        )
        .sort({
          createdAt: -1
        })
        .lean();

      const denunciasPorReview = new Map();

      for (const denuncia of denuncias) {
        const id = String(denuncia.avaliacao);

        if (!denunciasPorReview.has(id)) {
          denunciasPorReview.set(id, []);
        }

        denunciasPorReview.get(id).push(denuncia);
      }

      const resultado = reviews.map((review) => ({
        ...review.toObject(),
        detalhesDenuncias:
          denunciasPorReview.get(String(review._id)) || []
      }));

      res.json(resultado);
    })
  );


// PATCH /api/admin/reviews/:id
// Body: { visivel: true | false }
router.patch(
  '/reviews/:id',
  a(async (req, res) => {
    const {
      visivel
    } = req.body;

    if (
      typeof visivel !==
      'boolean'
    ) {
      throw erro(
        400,
        'O campo visivel tem de ser booleano'
      );
    }

    const review =
      await Review.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            visivel
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!review) {
      throw erro(
        404,
        'Avaliação não encontrada'
      );
    }

    res.json(review);
  })
);

module.exports = router;
