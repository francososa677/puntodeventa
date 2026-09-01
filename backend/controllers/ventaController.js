const ventaService = require('../services/ventaService');

async function registrar(req, res, next) {
  try {
    const result = await ventaService.registrarVenta(req.body, req.usuario.id);
    return res.status(201).json(result);
  } catch (error) {
    if (error.code === 'CAJA_NO_ABIERTA' || error.code === 'MEDIO_PAGO_INVALIDO' || error.code === 'STOCK_INSUFICIENTE' || error.code === 'PROMOCION_INACTIVA') {
      return res.status(400).json({
        success: false,
        error: error.code,
        message: error.message,
        ...(error.details || {})
      });
    }
    next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const ventas = await ventaService.getVentas(req.query);
    return res.json({ success: true, ventas });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const venta = await ventaService.getVentaById(req.params.id);
    return res.json({ success: true, venta });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registrar,
  getAll,
  getById
};
