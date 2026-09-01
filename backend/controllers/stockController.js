const stockService = require('../services/stockService');

async function ingreso(req, res, next) {
  try {
    const { productoId, cantidad } = req.body;
    const producto = await stockService.ingresoStock(productoId, cantidad, req.usuario.id);
    return res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
}

async function ajuste(req, res, next) {
  try {
    const { productoId, nuevoStock } = req.body;
    const producto = await stockService.ajusteStock(productoId, nuevoStock, req.usuario.id);
    return res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
}

async function getMovimientos(req, res, next) {
  try {
    const movimientos = await stockService.getMovimientos(req.query);
    return res.json({ success: true, movimientos });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ingreso,
  ajuste,
  getMovimientos
};
