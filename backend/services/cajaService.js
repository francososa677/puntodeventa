const { Caja, Venta, Devolucion, MedioPago, Usuario, sequelize } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function getCajaAbierta() {
  return await Caja.findOne({
    where: { estado: 'ABIERTA' },
    include: [{ model: Usuario, as: 'usuarioApertura', attributes: ['id', 'nombre', 'username'] }]
  });
}

async function getEstadoCajaActual() {
  const caja = await getCajaAbierta();
  if (!caja) {
    return { cajaAbierta: false, caja: null };
  }

  // Calculate current accumulated cash totals for the open box
  const ventas = await Venta.findAll({
    where: { caja_id: caja.id },
    include: [{ model: MedioPago, as: 'medioPago' }]
  });

  const devoluciones = await Devolucion.findAll({
    include: [{
      model: Venta,
      as: 'venta',
      where: { caja_id: caja.id },
      include: [{ model: MedioPago, as: 'medioPago' }]
    }]
  });

  let totalEfectivoVentas = 0;
  let totalOtrosVentas = 0;
  const ventasPorMedio = {};

  for (const v of ventas) {
    const medioNombre = v.medioPago ? v.medioPago.nombre : 'Desconocido';
    const esEfectivo = v.medioPago ? v.medioPago.es_efectivo : false;
    const monto = parseFloat(v.total);

    ventasPorMedio[medioNombre] = (ventasPorMedio[medioNombre] || 0) + monto;

    if (esEfectivo) {
      totalEfectivoVentas += monto;
    } else {
      totalOtrosVentas += monto;
    }
  }

  let totalEfectivoDevoluciones = 0;
  for (const d of devoluciones) {
    const esEfectivo = d.venta && d.venta.medioPago ? d.venta.medioPago.es_efectivo : false;
    if (esEfectivo) {
      totalEfectivoDevoluciones += parseFloat(d.total);
    }
  }

  const montoInicial = parseFloat(caja.monto_inicial);
  const montoEsperadoEfectivo = montoInicial + totalEfectivoVentas - totalEfectivoDevoluciones;

  return {
    cajaAbierta: true,
    caja,
    montoInicial,
    totalEfectivoVentas,
    totalEfectivoDevoluciones,
    totalOtrosVentas,
    montoEsperadoEfectivo,
    ventasPorMedio,
    cantidadVentas: ventas.length
  };
}

async function abrirCaja(montoInicial, usuarioId) {
  const cajaExistente = await getCajaAbierta();
  if (cajaExistente) {
    const err = new Error('Ya existe una caja abierta en el sistema');
    err.status = 400;
    err.code = 'CAJA_ALREADY_OPEN';
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    const nuevaCaja = await Caja.create({
      usuario_apertura_id: usuarioId,
      fecha_apertura: new Date(),
      monto_inicial: parseFloat(montoInicial),
      estado: 'ABIERTA'
    }, { transaction: t });

    await registrarAuditoria(
      usuarioId,
      'ABRIR_CAJA',
      'CAJA',
      `Apertura de caja ID #${nuevaCaja.id} con monto inicial $${montoInicial}`,
      t
    );

    await t.commit();
    return await getCajaAbierta();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function cerrarCaja(montoDeclarado, observaciones, usuarioId) {
  const caja = await getCajaAbierta();
  if (!caja) {
    const err = new Error('No hay ninguna caja abierta para cerrar');
    err.status = 400;
    err.code = 'NO_OPEN_CAJA';
    throw err;
  }

  const estadoActual = await getEstadoCajaActual();
  const montoEsperado = estadoActual.montoEsperadoEfectivo;
  const montoDecl = parseFloat(montoDeclarado);
  const diferencia = montoDecl - montoEsperado;

  const t = await sequelize.transaction();
  try {
    caja.usuario_cierre_id = usuarioId;
    caja.fecha_cierre = new Date();
    caja.monto_esperado_efectivo = montoEsperado;
    caja.monto_declarado_efectivo = montoDecl;
    caja.diferencia = diferencia;
    caja.estado = 'CERRADA';
    caja.observaciones = observaciones || null;

    await caja.save({ transaction: t });

    await registrarAuditoria(
      usuarioId,
      'CERRAR_CAJA',
      'CAJA',
      `Cierre de caja ID #${caja.id}. Esperado: $${montoEsperado}, Declarado: $${montoDecl}, Diferencia: $${diferencia}`,
      t
    );

    await t.commit();

    return await Caja.findByPk(caja.id, {
      include: [
        { model: Usuario, as: 'usuarioApertura', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuarioCierre', attributes: ['id', 'nombre'] }
      ]
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getHistorialCajas(limit = 50) {
  return await Caja.findAll({
    include: [
      { model: Usuario, as: 'usuarioApertura', attributes: ['id', 'nombre', 'username'] },
      { model: Usuario, as: 'usuarioCierre', attributes: ['id', 'nombre', 'username'] }
    ],
    order: [['fecha_apertura', 'DESC']],
    limit
  });
}

module.exports = {
  getCajaAbierta,
  getEstadoCajaActual,
  abrirCaja,
  cerrarCaja,
  getHistorialCajas
};
