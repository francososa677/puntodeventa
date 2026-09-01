const { MedioPago } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function getAllMediosPago(solamenteActivos = false) {
  const where = solamenteActivos ? { activo: true } : {};
  return await MedioPago.findAll({
    where,
    order: [['id', 'ASC']]
  });
}

async function toggleMedioPago(id, activo, adminUserId) {
  const medio = await MedioPago.findByPk(id);
  if (!medio) {
    const err = new Error('Medio de pago no encontrado');
    err.status = 404;
    err.code = 'MEDIO_PAGO_NOT_FOUND';
    throw err;
  }

  if (!activo) {
    // Check how many active payment methods exist
    const activeCount = await MedioPago.count({ where: { activo: true } });
    if (activeCount <= 1 && medio.activo) {
      const err = new Error('No se puede desactivar el último medio de pago activo');
      err.status = 400;
      err.code = 'LAST_ACTIVE_PAYMENT_METHOD';
      throw err;
    }
  }

  medio.activo = activo;
  await medio.save();

  const accion = activo ? 'ACTIVAR_MEDIO_PAGO' : 'DESACTIVAR_MEDIO_PAGO';
  await registrarAuditoria(
    adminUserId,
    accion,
    'MEDIO_PAGO',
    `${activo ? 'Activado' : 'Desactivado'} medio de pago: ${medio.nombre}`
  );

  return medio;
}

module.exports = {
  getAllMediosPago,
  toggleMedioPago
};
