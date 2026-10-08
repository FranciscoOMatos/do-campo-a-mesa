// Encomendas
const router = require('express').Router();

const Product = require('../models/Product');
const Order = require('../models/Order');

const auth = require('../middleware/auth');
const a = require('../utils/async');
const erro = require('../utils/erro');

const porFazer = require('./_naoImplementado');

async function reporStock(reservas) {
  await Promise.all(
    reservas.map(({ id, quantidade }) =>
      Product.updateOne(
        { _id: id },
        {
          $inc: {
            stock: quantidade
          }
        }
      )
    )
  );
}

// POST /api/orders (comprador) -> 201
router.post(
  '/',
  auth('comprador'),
  a(async (req, res) => {
    const {
      linhas,
      entrega = {}
    } = req.body;

    if (!Array.isArray(linhas) || linhas.length === 0) {
      throw erro(
        400,
        'A encomenda tem de ter pelo menos uma linha'
      );
    }

    const tipoEntrega =
      entrega.tipo || 'levantamento';

    if (
      !['levantamento', 'entrega'].includes(tipoEntrega)
    ) {
      throw erro(
        400,
        'Tipo de entrega inválido'
      );
    }

    if (
      tipoEntrega === 'entrega' &&
      !String(entrega.morada || '').trim()
    ) {
      throw erro(
        400,
        'A morada é obrigatória para entrega'
      );
    }

    // Junta quantidades caso o mesmo produto
    // apareça mais do que uma vez no pedido.
    const quantidades = new Map();

    for (const linha of linhas) {
      const produtoId = linha?.produto;
      const quantidade = Number(linha?.quantidade);

      if (
        !produtoId ||
        !Number.isInteger(quantidade) ||
        quantidade < 1
      ) {
        throw erro(
          400,
          'Linhas da encomenda inválidas'
        );
      }

      quantidades.set(
        String(produtoId),
        (quantidades.get(String(produtoId)) || 0) +
          quantidade
      );
    }

    const reservas = [];
    const porProdutor = new Map();

    try {
      for (const [produtoId, quantidade] of quantidades) {
        /*
         * A condição stock >= quantidade e o $inc
         * acontecem na mesma operação no MongoDB.
         *
         * Isto evita que dois compradores vendam
         * simultaneamente mais stock do que existe.
         */
        const produto =
          await Product.findOneAndUpdate(
            {
              _id: produtoId,
              stock: {
                $gte: quantidade
              }
            },
            {
              $inc: {
                stock: -quantidade
              }
            },
            {
              new: true
            }
          );

        if (!produto) {
          const existente = await Product
            .findById(produtoId)
            .select('nome');

          throw erro(
            409,
            existente
              ? `Stock insuficiente: ${existente.nome}`
              : 'Produto não encontrado'
          );
        }

        reservas.push({
          id: produto._id,
          quantidade
        });

        const produtorId =
          produto.produtor.toString();

        if (!porProdutor.has(produtorId)) {
          porProdutor.set(produtorId, []);
        }

        porProdutor.get(produtorId).push({
          produto: produto._id,
          nome: produto.nome,
          precoUnit: produto.preco,
          unidade: produto.unidade,
          quantidade
        });
      }

      const encomendas = await Order.create(
        [...porProdutor].map(
          ([produtor, linhasProdutor]) => ({
            comprador: req.user.id,
            produtor,

            linhas: linhasProdutor,

            entrega: {
              tipo: tipoEntrega,

              morada:
                tipoEntrega === 'entrega'
                  ? String(entrega.morada).trim()
                  : undefined
            },

            origem: 'loja'
          })
        )
      );

      // Mais tarde, no passo de Socket.IO,
      // o produtor recebe esta notificação.
      const io = req.app.get('io');

      encomendas.forEach((encomenda) => {
        io
          ?.to(`user:${encomenda.produtor}`)
          .emit('nova-encomenda', {
            id: encomenda._id,
            total: encomenda.total
          });
      });

      return res.status(201).json(encomendas);
    } catch (err) {
      await reporStock(reservas);
      throw err;
    }
  })
);

// GET /api/orders
router.get(
  '/',
  auth(),
  porFazer('Listar encomendas do utilizador')
);

// GET /api/orders/:id
router.get(
  '/:id',
  auth(),
  porFazer('Detalhe da encomenda')
);

// PATCH /api/orders/:id/estado
router.patch(
  '/:id/estado',
  auth('produtor'),
  porFazer('Mudar estado da encomenda')
);

module.exports = router;