const promocionService = require('../services/promocionService');

async function getAll(req, res, next) {
  try {
    const promociones = await promocionService.getAllPromociones(req.query);
    return res.json({ success: true, promociones });
  } catch (error) {
    next(error);
  }
}

async function getByCodigo(req, res, next) {
  try {
    const promocion = await promocionService.getPromocionByCodigoBarras(req.params.codigo);
    if (!promocion) {
      return res.status(404).json({ success: false, error: 'PROMO_NOT_FOUND', message: 'Promoción no encontrada' });
    }
    return res.json({ success: true, promocion });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const promocion = await promocionService.createPromocion(req.body, req.usuario.id);
    return res.status(201).json({ success: true, promocion });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const promocion = await promocionService.updatePromocion(req.params.id, req.body, req.usuario.id);
    return res.json({ success: true, promocion });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getByCodigo,
  create,
  update
};
