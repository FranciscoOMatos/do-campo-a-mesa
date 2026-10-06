const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const utilizador = await User.findById(req.user.id);

    if (!utilizador?.produtor?.validado) {
      return res.status(403).json({
        erro: 'Conta de produtor a aguardar validação do administrador'
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};