const medioPagoService = require('../services/medioPagoService');

async function getAll(req, res, next) {
  try {
    const solamenteActivos = req.query.activos === 'true';
    const medios = await medioPagoService.getAllMediosPago(solamenteActivos);
    return res.json({ success: true, medios });
  } catch (error) {
    next(error);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const { activo } = req.body;
    if (activo === undefined) {
      return res.status(400).json({ success: false, message: 'El campo activo es requerido' });
    }
    const medio = await medioPagoService.toggleMedioPago(req.params.id, activo, req.usuario.id);
    return res.json({ success: true, medio });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  toggleActivo
};
