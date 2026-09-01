const {
  sequelize,
  Devolucion,
  DetalleDevolucion,
  Venta,
  DetalleVenta,
  Producto,
  Promocion,
  PromocionProducto,
  MovimientoStock,
  Usuario
} = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function registrarDevolucion({ ventaId, items, motivo }, adminUserId) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Debe especificar al menos un ítem a devolver');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();

  try {
    const venta = await Venta.findByPk(ventaId, {
      include: [
        { model: DetalleVenta, as: 'detalles' },
        {
          model: Devolucion,
          as: 'devoluciones',
          include: [{ model: DetalleDevolucion, as: 'detalles' }]
        }
      ],
      transaction: t
    });

    if (!venta) {
      const err = new Error('Venta no encontrada');
      err.status = 404;
      throw err;
    }

    // Map existing refund totals per line item
    const yaDevueltoPorProducto = {};
    const yaDevueltoPorPromocion = {};

    if (venta.devoluciones && venta.devoluciones.length > 0) {
      for (const dev of venta.devoluciones) {
        for (const det of dev.detalles) {
          if (det.producto_id) {
            yaDevueltoPorProducto[det.producto_id] = (yaDevueltoPorProducto[det.producto_id] || 0) + parseFloat(det.cantidad);
          }
          if (det.promocion_id) {
            yaDevueltoPorPromocion[det.promocion_id] = (yaDevueltoPorPromocion[det.promocion_id] || 0) + parseFloat(det.cantidad);
          }
        }
      }
    }

    let totalDevolucion = 0;
    const detallesToCreate = [];
    const stockRestores = []; // Array of { producto, addQty }
    const movimientosToCreate = []; // Array of { producto_id, cantidad }

    let totalLineasOriginales = venta.detalles.length;
    let lineasCompletamenteDevueltas = 0;

    for (const itemDev of items) {
      const cantDev = parseFloat(itemDev.cantidad);
      if (isNaN(cantDev) || cantDev <= 0) continue;

      if (itemDev.productoId) {
        const detalleOrig = venta.detalles.find(d => d.producto_id === itemDev.productoId);
        if (!detalleOrig) {
          const err = new Error(`El producto ID ${itemDev.productoId} no pertenecía a la venta original`);
          err.status = 400;
          throw err;
        }

        const cantOriginal = parseFloat(detalleOrig.cantidad);
        const yaDev = yaDevueltoPorProducto[itemDev.productoId] || 0;
        const disponible = cantOriginal - yaDev;

        if (cantDev > disponible + 0.0001) {
          const err = new Error(`No se puede devolver ${cantDev}: solo quedan ${disponible} disponibles para devolver en esta línea`);
          err.status = 400;
          throw err;
        }

        const precioHistorico = parseFloat(detalleOrig.precio_unitario);
        const subtotalDev = Math.round(precioHistorico * cantDev * 100) / 100;
        totalDevolucion += subtotalDev;

        detallesToCreate.push({
          producto_id: itemDev.productoId,
          promocion_id: null,
          cantidad: cantDev,
          precio_unitario: precioHistorico,
          subtotal: subtotalDev
        });

        const prod = await Producto.findByPk(itemDev.productoId, { transaction: t });
        stockRestores.push({ producto: prod, addQty: cantDev });

        movimientosToCreate.push({
          producto_id: itemDev.productoId,
          cantidad: cantDev // Cantidad positiva para devolución
        });

        if (Math.abs(yaDev + cantDev - cantOriginal) < 0.001) {
          lineasCompletamenteDevueltas++;
        }

      } else if (itemDev.promocionId) {
        const detalleOrig = venta.detalles.find(d => d.promocion_id === itemDev.promocionId);
        if (!detalleOrig) {
          const err = new Error(`La promoción ID ${itemDev.promocionId} no pertenecía a la venta original`);
          err.status = 400;
          throw err;
        }

        const cantOriginal = parseFloat(detalleOrig.cantidad);
        const yaDev = yaDevueltoPorPromocion[itemDev.promocionId] || 0;
        const disponible = cantOriginal - yaDev;

        if (cantDev > disponible + 0.0001) {
          const err = new Error(`No se puede devolver ${cantDev} combos: solo quedan ${disponible} disponibles para devolver`);
          err.status = 400;
          throw err;
        }

        const promo = await Promocion.findByPk(itemDev.promocionId, {
          include: [{
            model: PromocionProducto,
            as: 'componentes',
            include: [{ model: Producto, as: 'producto' }]
          }],
          transaction: t
        });

        // Restore stock of EACH component product
        for (const comp of promo.componentes) {
          const addCompQty = parseFloat(comp.cantidad) * cantDev;
          stockRestores.push({ producto: comp.producto, addQty: addCompQty });
          movimientosToCreate.push({
            producto_id: comp.producto.id,
            cantidad: addCompQty
          });
        }

        const precioHistorico = parseFloat(detalleOrig.precio_unitario);
        const subtotalDev = Math.round(precioHistorico * cantDev * 100) / 100;
        totalDevolucion += subtotalDev;

        detallesToCreate.push({
          producto_id: null,
          promocion_id: itemDev.promocionId,
          cantidad: cantDev,
          precio_unitario: precioHistorico,
          subtotal: subtotalDev
        });

        if (Math.abs(yaDev + cantDev - cantOriginal) < 0.001) {
          lineasCompletamenteDevueltas++;
        }
      }
    }

    totalDevolucion = Math.round(totalDevolucion * 100) / 100;

    const nuevaDevolucion = await Devolucion.create({
      venta_id: venta.id,
      usuario_id: adminUserId,
      fecha: new Date(),
      motivo: motivo || 'Sin motivo especificado',
      total: totalDevolucion
    }, { transaction: t });

    for (const d of detallesToCreate) {
      await DetalleDevolucion.create({
        devolucion_id: nuevaDevolucion.id,
        ...d
      }, { transaction: t });
    }

    // Reponer stock
    for (const sr of stockRestores) {
      sr.producto.stock_actual = parseFloat(sr.producto.stock_actual) + sr.addQty;
      sr.producto.updated_at = new Date();
      await sr.producto.save({ transaction: t });
    }

    // Registrar movimientos de stock
    for (const m of movimientosToCreate) {
      await MovimientoStock.create({
        producto_id: m.producto_id,
        usuario_id: adminUserId,
        tipo: 'DEVOLUCION',
        cantidad: m.cantidad,
        fecha: new Date()
      }, { transaction: t });
    }

    const esAnulacionTotal = (lineasCompletamenteDevueltas === totalLineasOriginales);
    const tipoDetalle = esAnulacionTotal ? 'ANULACIÓN TOTAL' : 'DEVOLUCIÓN PARCIAL';

    await registrarAuditoria(
      adminUserId,
      'REGISTRAR_DEVOLUCION',
      'DEVOLUCION',
      `Registrada ${tipoDetalle} para Venta #${venta.id}. Monto devuelto: $${totalDevolucion}. Motivo: ${motivo || 'N/A'}`,
      t
    );

    await t.commit();

    return {
      success: true,
      devolucionId: nuevaDevolucion.id,
      ventaId: venta.id,
      totalDevuelto: totalDevolucion,
      esAnulacionTotal
    };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getDevoluciones(filtros = {}) {
  const where = {};
  if (filtros.venta_id) where.venta_id = filtros.venta_id;

  return await Devolucion.findAll({
    where,
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'username'] },
      { model: Venta, as: 'venta' },
      {
        model: DetalleDevolucion,
        as: 'detalles',
        include: [
          { model: Producto, as: 'producto' },
          { model: Promocion, as: 'promocion' }
        ]
      }
    ],
    order: [['fecha', 'DESC']],
    limit: filtros.limit ? parseInt(filtros.limit) : 100
  });
}

module.exports = {
  registrarDevolucion,
  getDevoluciones
};
