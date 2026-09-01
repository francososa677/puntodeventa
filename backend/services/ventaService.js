const {
  sequelize,
  Venta,
  DetalleVenta,
  Producto,
  Promocion,
  PromocionProducto,
  Caja,
  MedioPago,
  MovimientoStock,
  Usuario
} = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function registrarVenta({ medioPagoId, items }, usuarioId) {
  // Validaciones iniciales (Paso 1)
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('La venta debe contener al menos un ítem');
    err.status = 400;
    err.code = 'ITEMS_REQUIRED';
    throw err;
  }

  // Verificar medio de pago activo
  const medioPago = await MedioPago.findByPk(medioPagoId);
  if (!medioPago || !medioPago.activo) {
    const err = new Error('Medio de pago inválido o inactivo');
    err.status = 400;
    err.code = 'MEDIO_PAGO_INVALIDO';
    throw err;
  }

  // Iniciar transacción (Paso 2)
  const t = await sequelize.transaction();

  try {
    // Verificar caja abierta (Backend la determina directamente)
    const cajaAbierta = await Caja.findOne({ where: { estado: 'ABIERTA' }, transaction: t });
    if (!cajaAbierta) {
      const err = new Error('Debe abrir una caja antes de poder registrar ventas');
      err.status = 400;
      err.code = 'CAJA_NO_ABIERTA';
      throw err;
    }

    let totalVenta = 0;
    const detallesToCreate = [];
    const stockUpdates = []; // Array of { producto, newStock, cantidadRestada }
    const movimientosToCreate = []; // Array of { producto_id, cantidad }

    // Procesar cada ítem enviado por el frontend (Pasos 3, 4, 5)
    for (const item of items) {
      if (item.tipo === 'PRODUCTO' || item.tipo === 'PRODUCTO_PESABLE') {
        const prodId = item.productoId;
        const cant = parseFloat(item.cantidad);

        if (isNaN(cant) || cant <= 0) {
          const err = new Error('Cantidad inválida en uno de los productos');
          err.status = 400;
          throw err;
        }

        const producto = await Producto.findByPk(prodId, { transaction: t });
        if (!producto || !producto.activo) {
          const err = new Error(`El producto ID ${prodId} no existe o está inactivo`);
          err.status = 400;
          throw err;
        }

        if (producto.tipo_venta === 'UNITARIO' && !Number.isInteger(cant)) {
          const err = new Error(`El producto ${producto.nombre} es unitario y no acepta cantidad fraccionaria`);
          err.status = 400;
          throw err;
        }

        const stockActual = parseFloat(producto.stock_actual);
        if (stockActual < cant) {
          const err = new Error(`Stock insuficiente para el producto: ${producto.nombre}`);
          err.status = 400;
          err.code = 'STOCK_INSUFICIENTE';
          err.details = {
            producto: producto.nombre,
            stockDisponible: stockActual,
            cantidadSolicitada: cant
          };
          throw err;
        }

        const precioUnitario = parseFloat(producto.precio);
        const subtotal = Math.round(precioUnitario * cant * 100) / 100;
        totalVenta += subtotal;

        detallesToCreate.push({
          producto_id: producto.id,
          promocion_id: null,
          cantidad: cant,
          precio_unitario: precioUnitario,
          subtotal
        });

        stockUpdates.push({
          producto,
          newStock: stockActual - cant
        });

        movimientosToCreate.push({
          producto_id: producto.id,
          cantidad: -cant
        });

      } else if (item.tipo === 'PROMOCION') {
        const promoId = item.promocionId;
        const cantCombos = parseFloat(item.cantidad);

        if (isNaN(cantCombos) || cantCombos <= 0 || !Number.isInteger(cantCombos)) {
          const err = new Error('La cantidad de promociones debe ser un entero positivo');
          err.status = 400;
          throw err;
        }

        const promo = await Promocion.findByPk(promoId, {
          include: [{
            model: PromocionProducto,
            as: 'componentes',
            include: [{ model: Producto, as: 'producto' }]
          }],
          transaction: t
        });

        if (!promo || !promo.activa) {
          const err = new Error(`La promoción ID ${promoId} no existe o está inactiva`);
          err.status = 400;
          err.code = 'PROMOCION_INACTIVA';
          err.details = { promocion: promo ? promo.nombre : promoId };
          throw err;
        }

        // Check stock of EACH component product
        for (const comp of promo.componentes) {
          const prodComp = comp.producto;
          const cantComponenteRequerida = parseFloat(comp.cantidad) * cantCombos;
          const stockActualComp = parseFloat(prodComp.stock_actual);

          if (stockActualComp < cantComponenteRequerida) {
            const err = new Error(`Stock insuficiente para el componente '${prodComp.nombre}' de la promoción '${promo.nombre}'`);
            err.status = 400;
            err.code = 'STOCK_INSUFICIENTE';
            err.details = {
              producto: `${prodComp.nombre} (componente de ${promo.nombre})`,
              stockDisponible: stockActualComp,
              cantidadSolicitada: cantComponenteRequerida
            };
            throw err;
          }

          stockUpdates.push({
            producto: prodComp,
            newStock: stockActualComp - cantComponenteRequerida
          });

          // Regla fundamental: Movimiento de stock INDIVIDUAL por componente
          movimientosToCreate.push({
            producto_id: prodComp.id,
            cantidad: -cantComponenteRequerida
          });
        }

        const precioPromocional = parseFloat(promo.precio_promocional);
        const subtotal = Math.round(precioPromocional * cantCombos * 100) / 100;
        totalVenta += subtotal;

        detallesToCreate.push({
          producto_id: null,
          promocion_id: promo.id,
          cantidad: cantCombos,
          precio_unitario: precioPromocional,
          subtotal
        });
      }
    }

    totalVenta = Math.round(totalVenta * 100) / 100;

    // Paso 6 — Crear la Venta
    const nuevaVenta = await Venta.create({
      usuario_id: usuarioId,
      caja_id: cajaAbierta.id,
      medio_pago_id: medioPago.id,
      fecha: new Date(),
      total: totalVenta
    }, { transaction: t });

    // Paso 7 — Crear Detalles de Venta
    for (const d of detallesToCreate) {
      await DetalleVenta.create({
        venta_id: nuevaVenta.id,
        ...d
      }, { transaction: t });
    }

    // Paso 8 — Actualizar stock de productos
    for (const su of stockUpdates) {
      su.producto.stock_actual = su.newStock;
      su.producto.updated_at = new Date();
      await su.producto.save({ transaction: t });
    }

    // Paso 9 — Crear Movimientos de Stock
    for (const m of movimientosToCreate) {
      await MovimientoStock.create({
        producto_id: m.producto_id,
        usuario_id: usuarioId,
        tipo: 'VENTA',
        cantidad: m.cantidad,
        fecha: new Date()
      }, { transaction: t });
    }

    // Paso 10 — Auditoría
    await registrarAuditoria(
      usuarioId,
      'REGISTRAR_VENTA',
      'VENTA',
      `Venta registrada #${nuevaVenta.id} por un total de $${totalVenta} en ${medioPago.nombre} (Caja #${cajaAbierta.id})`,
      t
    );

    // Paso 11 — Commit
    await t.commit();

    return {
      success: true,
      ventaId: nuevaVenta.id,
      total: totalVenta,
      cajaId: cajaAbierta.id,
      medioPago: medioPago.nombre
    };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getVentas(filtros = {}) {
  const where = {};
  if (filtros.caja_id) where.caja_id = filtros.caja_id;
  if (filtros.usuario_id) where.usuario_id = filtros.usuario_id;

  return await Venta.findAll({
    where,
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'username'] },
      { model: MedioPago, as: 'medioPago', attributes: ['id', 'nombre', 'es_efectivo'] },
      { model: Caja, as: 'caja', attributes: ['id', 'fecha_apertura', 'estado'] },
      {
        model: DetalleVenta,
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

async function getVentaById(id) {
  const venta = await Venta.findByPk(id, {
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'username'] },
      { model: MedioPago, as: 'medioPago', attributes: ['id', 'nombre', 'es_efectivo'] },
      { model: Caja, as: 'caja', attributes: ['id', 'fecha_apertura', 'estado'] },
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [
          { model: Producto, as: 'producto' },
          { model: Promocion, as: 'promocion' }
        ]
      }
    ]
  });

  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }

  return venta;
}

module.exports = {
  registrarVenta,
  getVentas,
  getVentaById
};
