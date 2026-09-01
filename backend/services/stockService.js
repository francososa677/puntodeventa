const { Producto, MovimientoStock, Usuario, sequelize } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');
const { Op } = require('sequelize');

async function ingresoStock(productoId, cantidad, usuarioId) {
  const cant = parseFloat(cantidad);
  if (isNaN(cant) || cant <= 0) {
    const err = new Error('La cantidad ingresada debe ser un número positivo');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(productoId, { transaction: t });
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }

    if (producto.tipo_venta === 'UNITARIO' && !Number.isInteger(cant)) {
      const err = new Error('Los productos unitarios no aceptan cantidades fraccionarias');
      err.status = 400;
      throw err;
    }

    producto.stock_actual = parseFloat(producto.stock_actual) + cant;
    producto.updated_at = new Date();
    await producto.save({ transaction: t });

    await MovimientoStock.create({
      producto_id: producto.id,
      usuario_id: usuarioId,
      tipo: 'INGRESO',
      cantidad: cant,
      fecha: new Date()
    }, { transaction: t });

    await registrarAuditoria(
      usuarioId,
      'INGRESO_STOCK',
      'STOCK',
      `Ingreso de stock en ${producto.nombre}: +${cant} ${producto.tipo_venta === 'PESABLE' ? 'kg' : 'unidades'}`,
      t
    );

    await t.commit();
    return producto;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function ajusteStock(productoId, nuevoStock, usuarioId) {
  const stockNuevo = parseFloat(nuevoStock);
  if (isNaN(stockNuevo) || stockNuevo < 0) {
    const err = new Error('El nuevo stock no puede ser negativo');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(productoId, { transaction: t });
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }

    if (producto.tipo_venta === 'UNITARIO' && !Number.isInteger(stockNuevo)) {
      const err = new Error('Los productos unitarios no aceptan cantidades fraccionarias');
      err.status = 400;
      throw err;
    }

    const stockAnterior = parseFloat(producto.stock_actual);
    const diferencia = stockNuevo - stockAnterior;

    producto.stock_actual = stockNuevo;
    producto.updated_at = new Date();
    await producto.save({ transaction: t });

    await MovimientoStock.create({
      producto_id: producto.id,
      usuario_id: usuarioId,
      tipo: 'AJUSTE',
      cantidad: diferencia,
      fecha: new Date()
    }, { transaction: t });

    await registrarAuditoria(
      usuarioId,
      'AJUSTE_STOCK',
      'STOCK',
      `Ajuste de stock en ${producto.nombre}: de ${stockAnterior} a ${stockNuevo}`,
      t
    );

    await t.commit();
    return producto;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getMovimientos(filtros = {}) {
  const where = {};
  if (filtros.producto_id) where.producto_id = filtros.producto_id;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.fechaInicio || filtros.fechaFin) {
    where.fecha = {};
    if (filtros.fechaInicio) where.fecha[Op.gte] = new Date(filtros.fechaInicio);
    if (filtros.fechaFin) where.fecha[Op.lte] = new Date(filtros.fechaFin);
  }

  return await MovimientoStock.findAll({
    where,
    include: [
      { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo_barras', 'tipo_venta'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'username'] }
    ],
    order: [['fecha', 'DESC']],
    limit: filtros.limit ? parseInt(filtros.limit) : 200
  });
}

module.exports = {
  ingresoStock,
  ajusteStock,
  getMovimientos
};
