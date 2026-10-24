const Auction = require('../models/Auction');
const Order = require('../models/Order');

const INTERVALO_MS = 2000;

const sala = (leilaoId) =>
  `leilao:${leilaoId}`;

async function abrirAgendados(io) {
  const agora = new Date();

  const lista = await Auction
    .find({
      estado: 'agendado',
      iniciaEm: {
        $lte: agora
      }
    })
    .select('_id');

  for (const { _id } of lista) {
    const leilao =
      await Auction.findOneAndUpdate(
        {
          _id,
          estado: 'agendado'
        },
        {
          $set: {
            estado: 'ativo'
          }
        },
        {
          new: true
        }
      );

    if (!leilao) {
      continue;
    }

    io
      .to(sala(leilao._id))
      .emit('aberto', {
        id: leilao._id
      });
  }
}

async function fecharExpirados(io) {
  const agora = new Date();

  const lista = await Auction
    .find({
      estado: 'ativo',
      terminaEm: {
        $lte: agora
      }
    })
    .select('_id');

  for (const { _id } of lista) {
    const leilao =
      await Auction.findOneAndUpdate(
        {
          _id,
          estado: 'ativo'
        },
        {
          $set: {
            estado: 'terminado'
          }
        },
        {
          new: true
        }
      );

    if (!leilao) {
      continue;
    }

    const vencedor =
      leilao.licitacaoAtual?.comprador;

    const valorFinal =
      leilao.licitacaoAtual?.valor ??
      leilao.precoBase;

    let encomenda = null;

    if (vencedor) {
      encomenda = await Order.create({
        comprador: vencedor,
        produtor: leilao.produtor,

        linhas: [
          {
            ...(leilao.produto
              ? {
                  produto: leilao.produto
                }
              : {}),

            nome:
              `Lote: ${leilao.lote}`,

            precoUnit: valorFinal,
            unidade: 'lote',
            quantidade: 1
          }
        ],

        estado: 'confirmada',

        entrega: {
          tipo: 'levantamento'
        },

        origem: 'leilao',
        leilao: leilao._id
      });

      await Auction.updateOne(
        {
          _id: leilao._id
        },
        {
          $set: {
            encomenda:
              encomenda._id
          }
        }
      );

      io
        .to(
          `user:${String(vencedor)}`
        )
        .emit(
          'leilao-ganho',
          {
            id: leilao._id,
            lote: leilao.lote,
            valor: valorFinal,
            encomenda:
              encomenda._id
          }
        );
    }

    io
      .to(sala(leilao._id))
      .emit(
        'terminado',
        {
          id: leilao._id,
          vencedor:
            vencedor ?? null,
          valor: valorFinal,
          encomenda:
            encomenda?._id ?? null
        }
      );

    io
      .to(
        `user:${String(
          leilao.produtor
        )}`
      )
      .emit(
        'leilao-terminado',
        {
          id: leilao._id,
          lote: leilao.lote,
          valor: valorFinal,
          vencedor:
            vencedor ?? null,
          encomenda:
            encomenda?._id ?? null
        }
      );
  }
}

function iniciarCicloLeiloes(io) {
  let aExecutar = false;

  const executar = async () => {
    if (aExecutar) {
      return;
    }

    aExecutar = true;

    try {
      await abrirAgendados(io);
      await fecharExpirados(io);
    }
    catch (err) {
      console.error(
        'Erro no ciclo dos leilões:',
        err
      );
    }
    finally {
      aExecutar = false;
    }
  };

  executar();

  return setInterval(
    executar,
    INTERVALO_MS
  );
}

module.exports = {
  iniciarCicloLeiloes,
  abrirAgendados,
  fecharExpirados
};