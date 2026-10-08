// Envolve handlers assíncronos para que os erros
// cheguem ao errorHandler.
module.exports = (fn) =>
  (req, res, next) =>
    Promise.resolve(
      fn(req, res, next)
    ).catch(next);