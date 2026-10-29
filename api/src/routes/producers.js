// Páginas públicas dos produtores
const router = require('express').Router();
const { Types } = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const auth = require('../middleware/auth');
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

// PATCH /api/producers/me
// Permite ao produtor editar os dados
// da sua própria página pública.
router.patch(
  '/me',
  auth('produtor'),
  a(async (req, res) => {
    const {
      nomeExploracao,
      descricao,
      localidade,
      localizacao
    } = req.body;

    const alteracoes = {};

    if (nomeExploracao !== undefined) {
      const valor =
        String(nomeExploracao).trim();

      if (!valor) {
        throw erro(
          400,
          'O nome da exploração é obrigatório'
        );
      }

      alteracoes[
        'produtor.nomeExploracao'
      ] = valor;
    }

    if (descricao !== undefined) {
      const valor =
        String(descricao).trim();

      if (valor.length > 1000) {
        throw erro(
          400,
          'A descrição não pode ultrapassar 1000 caracteres'
        );
      }

      alteracoes[
        'produtor.descricao'
      ] = valor;
    }

    if (localidade !== undefined) {
      const valor =
        String(localidade).trim();

      if (!valor) {
        throw erro(
          400,
          'A localidade é obrigatória'
        );
      }

      alteracoes[
        'produtor.localidade'
      ] = valor;
    }

    if (localizacao !== undefined) {
      const lat =
        Number(localizacao?.lat);

      const lng =
        Number(localizacao?.lng);

      if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
      ) {
        throw erro(
          400,
          'A latitude tem de estar entre -90 e 90'
        );
      }

      if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        throw erro(
          400,
          'A longitude tem de estar entre -180 e 180'
        );
      }

      alteracoes[
        'produtor.localizacao'
      ] = {
        lat,
        lng
      };
    }

    if (
      Object.keys(alteracoes).length === 0
    ) {
      throw erro(
        400,
        'Não foram enviados dados para atualizar'
      );
    }

    const produtor =
      await User.findOneAndUpdate(
        {
          _id: req.user.id,
          papel: 'produtor'
        },
        {
          $set: alteracoes
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

// GET /api/producers/me/stats
// Indicadores do painel do produtor autenticado.
router.get(
  '/me/stats',
  auth('produtor'),
  a(async (req, res) => {
    const produtorId =
      new Types.ObjectId(req.user.id);

    const [
      totalEncomendas,
      porTratar,
      emProcessamento,
      entregues,
      resumoVendas,
      resumoAvaliacoes,
      leiloesAtivos,
      totalProdutos,
      produtosStockBaixo
    ] = await Promise.all([
      Order.countDocuments({
        produtor: produtorId
      }),

      Order.countDocuments({
        produtor: produtorId,
        estado: 'pendente'
      }),

      Order.countDocuments({
        produtor: produtorId,
        estado: {
          $in: [
            'confirmada',
            'pronta'
          ]
        }
      }),

      Order.countDocuments({
        produtor: produtorId,
        estado: 'entregue'
      }),

      Order.aggregate([
        {
          $match: {
            produtor: produtorId,
            estado: 'entregue'
          }
        },
        {
          $unwind: '$linhas'
        },
        {
          $group: {
            _id: null,
            valor: {
              $sum: {
                $multiply: [
                  '$linhas.precoUnit',
                  '$linhas.quantidade'
                ]
              }
            }
          }
        }
      ]),

      Review.aggregate([
        {
          $match: {
            produtor: produtorId,
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
      ]),

      Auction.countDocuments({
        produtor: produtorId,
        estado: 'ativo'
      }),

      Product.countDocuments({
        produtor: produtorId
      }),

      Product
        .find({
          produtor: produtorId,
          stock: {
            $lte: 5
          }
        })
        .select(
          'nome stock unidade preco'
        )
        .sort({
          stock: 1,
          nome: 1
        })
        .lean()
    ]);

    const vendas =
      resumoVendas[0];

    const avaliacoes =
      resumoAvaliacoes[0];

    res.json({
      encomendas: {
        total: totalEncomendas,
        porTratar,
        emProcessamento,
        entregues
      },

      vendas: {
        encomendasEntregues:
          entregues,

        valorTotal:
          Math.round(
            (vendas?.valor ?? 0) * 100
          ) / 100
      },

      avaliacoes: {
        media:
          avaliacoes?.media ?? null,

        total:
          avaliacoes?.total ?? 0
      },

      leiloesAtivos,

      produtos: {
        total: totalProdutos,

        stockBaixo:
          produtosStockBaixo.length,

        alertasStock:
          produtosStockBaixo
      }
    });
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