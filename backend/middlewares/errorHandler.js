function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Ocurrió un error inesperado en el servidor'
  });
}

module.exports = errorHandler;
