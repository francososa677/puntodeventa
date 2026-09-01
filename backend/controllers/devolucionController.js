const devolucionService = require('../services/devolucionService');

async function registrar(req, res, next) {
  try {
    const result = await devolucionService.registrarDevolucion(req.body, req.usuario.id);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const devoluciones = await devolucionService.getDevoluciones(req.query);
    return res.json({ success: true, devoluciones });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registrar,
  getAll
};
