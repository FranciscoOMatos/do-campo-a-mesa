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
    async ({
      leilaoId,
      valor
    }) => {
      // TODO:
      // validar e gravar a licitação
      // numa única operação atómica.
      void leilaoId;
      void valor;

      socket.emit(
        'recusada',
        'Licitação ainda não implementada'
      );
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