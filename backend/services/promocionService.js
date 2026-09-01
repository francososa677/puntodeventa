const { Promocion, PromocionProducto, Producto, sequelize } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function getAllPromociones(query = {}) {
  const where = {};
  if (query.activa !== undefined) {
    where.activa = query.activa === 'true' || query.activa === true;
  }
  if (query.search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { codigo_barras: { [Op.like]: `%${query.search}%` } }
    ];
  }

  return await Promocion.findAll({
    where,
    include: [{
      model: PromocionProducto,
      as: 'componentes',
      include: [{ model: Producto, as: 'producto' }]
    }],
    order: [['nombre', 'ASC']]
  });
}

async function getPromocionByCodigoBarras(codigo) {
  return await Promocion.findOne({
    where: { codigo_barras: codigo, activa: true },
    include: [{
      model: PromocionProducto,
      as: 'componentes',
      include: [{ model: Producto, as: 'producto' }]
    }]
  });
}

async function createPromocion(data, adminUserId) {
  const { nombre, codigo_barras, precio_promocional, componentes } = data;

  if (!componentes || !Array.isArray(componentes) || componentes.length === 0) {
    const err = new Error('Una promoción debe incluir al menos un producto componente');
    err.status = 400;
    err.code = 'PROMO_NO_COMPONENTS';
    throw err;
  }

  // Cross uniqueness validation
  const existingProducto = await Producto.findOne({ where: { codigo_barras } });
  if (existingProducto) {
    const err = new Error('El código de barras ya pertenece a un producto');
    err.status = 400;
    err.code = 'BARCODE_EXISTS_PRODUCT';
    throw err;
  }

  const existingPromo = await Promocion.findOne({ where: { codigo_barras } });
  if (existingPromo) {
    const err = new Error('El código de barras ya pertenece a otra promoción');
    err.status = 400;
    err.code = 'BARCODE_EXISTS';
    throw err;
  }

  // Validate components are all UNITARIO products
  for (const comp of componentes) {
    const prod = await Producto.findByPk(comp.producto_id);
    if (!prod) {
      const err = new Error(`El producto componente ID ${comp.producto_id} no existe`);
      err.status = 400;
      throw err;
    }
    if (prod.tipo_venta !== 'UNITARIO') {
      const err = new Error(`El producto ${prod.nombre} es pesable. Solo se permiten productos UNITARIO en promociones`);
      err.status = 400;
      err.code = 'PROMO_PESABLE_NOT_ALLOWED';
      throw err;
    }
  }

  const t = await sequelize.transaction();
  try {
    const nuevaPromo = await Promocion.create({
      nombre,
      codigo_barras,
      precio_promocional,
      activa: true
    }, { transaction: t });

    for (const comp of componentes) {
      await PromocionProducto.create({
        promocion_id: nuevaPromo.id,
        producto_id: comp.producto_id,
        cantidad: comp.cantidad
      }, { transaction: t });
    }

    await registrarAuditoria(
      adminUserId,
      'CREAR_PROMOCION',
      'PROMOCION',
      `Promoción creada: ${nuevaPromo.nombre} ($${nuevaPromo.precio_promocional})`,
      t
    );

    await t.commit();

    return await Promocion.findByPk(nuevaPromo.id, {
      include: [{
        model: PromocionProducto,
        as: 'componentes',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function updatePromocion(id, data, adminUserId) {
  const promo = await Promocion.findByPk(id);
  if (!promo) {
    const err = new Error('Promoción no encontrada');
    err.status = 404;
    err.code = 'PROMO_NOT_FOUND';
    throw err;
  }

  if (data.codigo_barras && data.codigo_barras !== promo.codigo_barras) {
    const existingProducto = await Producto.findOne({ where: { codigo_barras: data.codigo_barras } });
    if (existingProducto) {
      const err = new Error('El código de barras pertenece a un producto');
      err.status = 400;
      throw err;
    }
    const existingPromo = await Promocion.findOne({ where: { codigo_barras: data.codigo_barras } });
    if (existingPromo) {
      const err = new Error('El código de barras pertenece a otra promoción');
      err.status = 400;
      throw err;
    }
    promo.codigo_barras = data.codigo_barras;
  }

  if (data.nombre) promo.nombre = data.nombre;
  if (data.precio_promocional !== undefined) promo.precio_promocional = data.precio_promocional;
  if (data.activa !== undefined) promo.activa = data.activa;

  const t = await sequelize.transaction();
  try {
    promo.updated_at = new Date();
    await promo.save({ transaction: t });

    if (data.componentes && Array.isArray(data.componentes)) {
      await PromocionProducto.destroy({ where: { promocion_id: id }, transaction: t });
      for (const comp of data.componentes) {
        const prod = await Producto.findByPk(comp.producto_id);
        if (!prod || prod.tipo_venta !== 'UNITARIO') {
          const err = new Error(`El producto ${prod ? prod.nombre : comp.producto_id} no es de tipo UNITARIO`);
          err.status = 400;
          throw err;
        }
        await PromocionProducto.create({
          promocion_id: id,
          producto_id: comp.producto_id,
          cantidad: comp.cantidad
        }, { transaction: t });
      }
    }

    await registrarAuditoria(
      adminUserId,
      'MODIFICAR_PROMOCION',
      'PROMOCION',
      `Promoción modificada: ${promo.nombre}`,
      t
    );

    await t.commit();

    return await Promocion.findByPk(id, {
      include: [{
        model: PromocionProducto,
        as: 'componentes',
        include: [{ model: Producto, as: 'producto' }]
      }]
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

module.exports = {
  getAllPromociones,
  getPromocionByCodigoBarras,
  createPromocion,
  updatePromocion
};
