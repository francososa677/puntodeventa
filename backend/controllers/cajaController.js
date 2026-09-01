const cajaService = require('../services/cajaService');

async function getEstadoActual(req, res, next) {
  try {
    const estado = await cajaService.getEstadoCajaActual();
    return res.json({ success: true, ...estado });
  } catch (error) {
    next(error);
  }
}

async function abrir(req, res, next) {
  try {
    const { montoInicial } = req.body;
    if (montoInicial === undefined || isNaN(parseFloat(montoInicial))) {
      return res.status(400).json({ success: false, message: 'El monto inicial es obligatorio y debe ser numérico' });
    }
    const caja = await cajaService.abrirCaja(montoInicial, req.usuario.id);
    return res.status(201).json({ success: true, caja });
  } catch (error) {
    next(error);
  }
}

async function cerrar(req, res, next) {
  try {
    const { montoDeclarado, observaciones } = req.body;
    if (montoDeclarado === undefined || isNaN(parseFloat(montoDeclarado))) {
      return res.status(400).json({ success: false, message: 'El monto declarado es obligatorio' });
    }
    const caja = await cajaService.cerrarCaja(montoDeclarado, observaciones, req.usuario.id);
    return res.json({ success: true, caja });
  } catch (error) {
    next(error);
  }
}

async function getHistorial(req, res, next) {
  try {
    const cajas = await cajaService.getHistorialCajas(req.query.limit);
    return res.json({ success: true, cajas });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEstadoActual,
  abrir,
  cerrar,
  getHistorial
};
