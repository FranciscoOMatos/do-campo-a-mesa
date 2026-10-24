// Passo 7: leilões em tempo real
// Eventos do cliente: 'entrar' (leilaoId), 'sair' (leilaoId),
// 'licitar' ({ leilaoId, valor })
// Eventos do servidor: 'estado', 'presenca', 'nova-licitacao',
// 'recusada' (mensagem)

const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

const sala = (leilaoId) =>
  `leilao:${leilaoId}`;

const cent = (valor) =>
  Math.round(
    (Number(valor) + Number.EPSILON) * 100
  ) / 100;

function emitirPresenca(io, leilaoId) {
  const n =
    io.sockets.adapter.rooms.get(
      sala(leilaoId)
    )?.size ?? 0;

  io
    .to(sala(leilaoId))
    .emit('presenca', n);
}

module.exports = (io, socket) => {
  socket.on(
    'entrar',
    async (leilaoId) => {
      try {
        if (
          !mongoose.isValidObjectId(
            leilaoId
          )
        ) {
          socket.emit(
            'recusada',
            'Leilão inválido'
          );
          return;
        }

        const leilao = await Auction
          .findById(leilaoId)
          .populate(
            'produtor',
            'nome produtor.localidade'
          )
          .populate(
            'produto',
            'nome imagemUrl unidade'
          );

        if (!leilao) {
          socket.emit(
            'recusada',
            'Leilão não encontrado'
          );
          return;
        }

        const licitacoes = await Bid
          .find({
            leilao: leilaoId
          })
          .sort({
            createdAt: -1
          })
          .limit(20);

        socket.join(
          sala(leilaoId)
        );

        emitirPresenca(
          io,
          leilaoId
        );

        socket.emit(
          'estado',
          {
            agora: new Date(),
            leilao,
            licitacoes
          }
        );
      }
      catch (err) {
        console.error(
          'Erro ao entrar no leilão:',
          err
        );

        socket.emit(
          'recusada',
          'Não foi possível entrar no leilão'
        );
      }
    }
  );

  socket.on(
    'sair',
    (leilaoId) => {
      socket.leave(
        sala(leilaoId)
      );

      emitirPresenca(
        io,
        leilaoId
      );
    }
  );

socket.on(
    'licitar',
    async (
      {
        leilaoId,
        valor
      } = {},
      responder = () => {}
    ) => {
      const recusar = (mensagem) => {
        socket.emit(
          'recusada',
          mensagem
        );

        responder({
          ok: false,
          erro: mensagem
        });
      };

      try {
        if (
          socket.user.papel !==
          'comprador'
        ) {
          recusar(
            'Apenas compradores podem licitar'
          );
          return;
        }

        if (
          !mongoose.isValidObjectId(
            leilaoId
          )
        ) {
          recusar(
            'Leilão inválido'
          );
          return;
        }

        const valorLicitacao =
          cent(valor);

        if (
          !Number.isFinite(
            valorLicitacao
          ) ||
          valorLicitacao <= 0
        ) {
          recusar(
            'Valor de licitação inválido'
          );
          return;
        }

        const base = await Auction
          .findById(leilaoId)
          .select(
            'incremento'
          );

        if (!base) {
          recusar(
            'Leilão não encontrado'
          );
          return;
        }

        const agora =
          new Date();

        const limiteAnterior =
          cent(
            valorLicitacao -
            base.incremento
          );

        const leilao =
          await Auction
            .findOneAndUpdate(
              {
                _id: leilaoId,
                estado: 'ativo',
                terminaEm: {
                  $gt: agora
                },
                'licitacaoAtual.valor': {
                  $lte:
                    limiteAnterior
                }
              },
              {
                $set: {
                  licitacaoAtual: {
                    valor:
                      valorLicitacao,
                    comprador:
                      socket.user.id,
                    nome:
                      socket.user.nome,
                    em: agora
                  }
                },
                $inc: {
                  numLicitacoes: 1
                }
              },
              {
                new: true,
                runValidators: true
              }
            );

        if (!leilao) {
          const atual =
            await Auction
              .findById(
                leilaoId
              )
              .select(
                'estado terminaEm licitacaoAtual incremento'
              );

          if (!atual) {
            recusar(
              'Leilão não encontrado'
            );
            return;
          }

          if (
            atual.estado !==
              'ativo' ||
            atual.terminaEm <= agora
          ) {
            recusar(
              'O leilão não está ativo'
            );
            return;
          }

          const minimo =
            cent(
              atual
                .licitacaoAtual
                .valor +
              atual.incremento
            );

          recusar(
            `Licitação mínima: ${minimo.toFixed(2)} €`
          );

          return;
        }

        const bid =
          await Bid.create({
            leilao:
              leilaoId,
            comprador:
              socket.user.id,
            nome:
              socket.user.nome,
            valor:
              valorLicitacao
          });

        const dadosBid = {
          _id:
            bid._id,
          valor:
            bid.valor,
          comprador:
            socket.user.id,
          nome:
            socket.user.nome,
          createdAt:
            bid.createdAt,
          numLicitacoes:
            leilao.numLicitacoes
        };

        io
          .to(
            sala(leilaoId)
          )
          .emit(
            'nova-licitacao',
            dadosBid
          );

        responder({
          ok: true,
          valor:
            valorLicitacao
        });
      }
      catch (err) {
        console.error(
          'Erro ao licitar:',
          err
        );

        recusar(
          'Não foi possível registar a licitação'
        );
      }
    }
  );

  // Atualizar a presença quando o utilizador
  // fecha a página.
  socket.on(
    'disconnecting',
    () => {
      for (
        const nomeSala
        of socket.rooms
      ) {
        if (
          nomeSala.startsWith(
            'leilao:'
          )
        ) {
          const leilaoId =
            nomeSala.slice(
              'leilao:'.length
            );

          setImmediate(() =>
            emitirPresenca(
              io,
              leilaoId
            )
          );
        }
      }
    }
  );

  // O ciclo automático que abre e fecha
  // leilões será implementado separadamente.
};