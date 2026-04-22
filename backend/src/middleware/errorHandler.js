const logger = require('../shared/utils/logger');

function errorHandler(err, req, res, next) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referência inválida' });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
