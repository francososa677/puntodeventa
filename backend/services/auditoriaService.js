const { Auditoria, Usuario } = require('../models');

async function registrarAuditoria(usuarioId, accion, entidad, detalle = null, transaction = null) {
  const options = transaction ? { transaction } : {};
  await Auditoria.create({
    usuario_id: usuarioId,
    accion,
    entidad,
    detalle: typeof detalle === 'object' ? JSON.stringify(detalle) : detalle,
    fecha: new Date()
  }, options);
}

async function obtenerAuditoria(filtros = {}) {
  const where = {};
  if (filtros.usuario_id) where.usuario_id = filtros.usuario_id;
  if (filtros.accion) where.accion = filtros.accion;

  const logs = await Auditoria.findAll({
    where,
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'username', 'rol'] }],
    order: [['fecha', 'DESC']],
    limit: filtros.limit ? parseInt(filtros.limit) : 200
  });

  return logs;
}

module.exports = {
  registrarAuditoria,
  obtenerAuditoria
};
