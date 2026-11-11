// Ponto de entrada: servidor HTTP partilhado
// pela API REST e pelo Socket.io.

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { ligarBD } = require('./config/db');
const registarSockets = require('./sockets');

const {
  iniciarCicloLeiloes
} = require('./services/cicloLeiloes');

const PORT =
  process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET não está definida (ver .env.example)'
    );
  }

  await ligarBD();

  const server =
    http.createServer(app);

  const io = new Server(
    server,
    {
      cors: {
        origin:
          process.env.CLIENT_URL ||
          '*'
      }
    }
  );

  // Disponibiliza o io às rotas REST,
  // para poderem emitir notificações.
  app.set('io', io);

  registarSockets(io);

  // Abre os leilões agendados e
  // fecha automaticamente os expirados.
  iniciarCicloLeiloes(io);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`API iniciada na porta ${PORT}`);
    console.log('Swagger disponível em /api-docs');
  });
}

iniciar().catch((err) => {
  console.error(
    'Erro ao iniciar o servidor:',
    err
  );

  process.exit(1);
});
