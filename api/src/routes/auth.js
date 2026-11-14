// Registo, login e sessão do utilizador
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const auth = require('../middleware/auth');

function erro(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function emitirToken(utilizador) {
  return jwt.sign(
    {
      id: utilizador._id.toString(),
      papel: utilizador.papel,
      nome: utilizador.nome
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    }
  );
}

// POST /api/auth/registo
router.post('/registo', async (req, res, next) => {
  try {
    const {
      nome,
      email,
      password,
      papel = 'comprador',
      produtor
    } = req.body;

    if (!nome || !email || !password) {
      throw erro(
        400,
        'Nome, email e password são obrigatórios'
      );
    }

    if (String(password).length < 8) {
      throw erro(
        400,
        'A password deve ter pelo menos 8 caracteres'
      );
    }

    // Um utilizador nunca pode registar-se como administrador.
    if (!['comprador', 'produtor'].includes(papel)) {
      throw erro(
        400,
        'Tipo de conta inválido'
      );
    }

    if (
      papel === 'produtor' &&
      (!produtor?.nomeExploracao || !produtor?.localidade)
    ) {
      throw erro(
        400,
        'Nome da exploração e localidade são obrigatórios para produtores'
      );
    }

    const passwordHash = await bcrypt.hash(
      String(password),
      12
    );

    const dadosUtilizador = {
      nome: String(nome).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      papel
    };

    if (papel === 'produtor') {
      let coordenadas;

      if (produtor.localizacao !== undefined) {
        const { lat, lng } = produtor.localizacao || {};

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          throw erro(
            400,
            'Coordenadas da exploração inválidas'
          );
        }

        coordenadas = { lat, lng };
      }

      dadosUtilizador.produtor = {
        nomeExploracao: String(produtor.nomeExploracao).trim(),
        localidade: String(produtor.localidade).trim(),
        descricao: produtor.descricao
          ? String(produtor.descricao).trim()
          : '',
        ...(coordenadas
          ? { localizacao: coordenadas }
          : {}),
        validado: false
      };
    }

    const utilizador = await User.create(dadosUtilizador);

    const token = emitirToken(utilizador);

    return res.status(201).json({
      token,
      utilizador: utilizador.publico()
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const utilizador = await User
      .findOne({
        email: String(email || '')
          .trim()
          .toLowerCase()
      })
      .select('+passwordHash');

    const passwordCorreta =
      utilizador &&
      await bcrypt.compare(
        String(password || ''),
        utilizador.passwordHash
      );

    if (!utilizador || !passwordCorreta) {
      throw erro(
        401,
        'Credenciais inválidas'
      );
    }

    return res.json({
      token: emitirToken(utilizador),
      utilizador: utilizador.publico()
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/eu
router.get('/eu', auth(), async (req, res, next) => {
  try {
    const utilizador = await User.findById(req.user.id);

    if (!utilizador) {
      throw erro(
        401,
        'Sessão inválida'
      );
    }

    return res.json(utilizador.publico());
  } catch (err) {
    return next(err);
  }
});

module.exports = router;