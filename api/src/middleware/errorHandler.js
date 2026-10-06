// Tratamento centralizado de erros
module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.name === 'ValidationError') {
    const detalhes = Object.fromEntries(
      Object.entries(err.errors).map(([campo, erro]) => [
        campo,
        erro.message
      ])
    );

    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      erro: 'Identificador ou valor inválido'
    });
  }

  // Ex.: email já registado
  if (err.code === 11000) {
    return res.status(409).json({
      erro: 'Já existe um registo com esses dados'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      erro: err.message
    });
  }

  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    erro: status >= 500
      ? 'Erro interno'
      : err.message
  });
};