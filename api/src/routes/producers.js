// Páginas públicas dos produtores
const router = require('express').Router();

const User = require('../models/User');
const a = require('../utils/async');
const porFazer = require('./_naoImplementado');

const escaparRegex = (texto) =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      produtores.map((utilizador) => ({
        id: utilizador._id,
        nome: utilizador.nome,
        produtor: utilizador.produtor
      }))
    );
  })
);

// GET /api/producers/:id
// 200 { produtor, produtos, avaliacaoMedia }
router.get(
  '/:id',
  porFazer(
    'Página pública do produtor'
  )
);

module.exports = router;