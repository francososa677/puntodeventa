const { Producto, Promocion, sequelize } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');
const { Op } = require('sequelize');

async function getAllProductos(query = {}) {
  const where = {};
  if (query.activo !== undefined) {
    where.activo = query.activo === 'true' || query.activo === true;
  }
  if (query.tipo_venta) {
    where.tipo_venta = query.tipo_venta;
  }
  if (query.search) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { codigo_barras: { [Op.like]: `%${query.search}%` } }
    ];
  }

  const { DetalleVenta, Configuracion } = require('../models');

  const limit = query.limit ? parseInt(query.limit) : 500;

  const productos = await Producto.findAll({
    where,
    raw: true,
    limit: limit > 0 ? limit : 500
  });

  const config = await Configuracion.findOne({ where: { clave: 'stock_maximo_default' } });
  const defaultMax = config ? (parseFloat(config.valor) || 100) : 100;

  try {
    const ventasStats = await DetalleVenta.findAll({
      attributes: [
        'producto_id',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'ventas_totales']
      ],
      where: { producto_id: { [Op.ne]: null } },
      group: ['producto_id'],
      raw: true
    });

    const salesMap = {};
    ventasStats.forEach(v => {
      if (v.producto_id) {
        salesMap[v.producto_id] = parseFloat(v.ventas_totales) || 0;
      }
    });

    const result = productos.map(p => ({
      ...p,
      stock_maximo: p.stock_maximo !== null && p.stock_maximo !== undefined ? parseFloat(p.stock_maximo) : defaultMax,
      ventas_totales: salesMap[p.id] || 0
    }));

    if (query.orderBy === 'popular' || !query.orderBy) {
      result.sort((a, b) => b.ventas_totales - a.ventas_totales || a.nombre.localeCompare(b.nombre));
    } else {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result;
  } catch (err) {
    const result = productos.map(p => ({
      ...p,
      stock_maximo: p.stock_maximo !== null && p.stock_maximo !== undefined ? parseFloat(p.stock_maximo) : defaultMax
    }));
    return result;
  }
}

async function getProductoByCodigoBarras(codigo_barras) {
  return await Producto.findOne({ where: { codigo_barras, activo: true } });
}

async function createProducto(data, adminUserId) {
  if (!data.codigo_barras || !data.nombre || data.precio === undefined) {
    const error = new Error('Código de barras, nombre y precio son requeridos');
    error.status = 400;
    error.code = 'INVALID_PRODUCT_DATA';
    throw error;
  }

  const existingProd = await Producto.findOne({ where: { codigo_barras: data.codigo_barras } });
  if (existingProd) {
    const error = new Error('El código de barras ya pertenece a otro producto');
    error.status = 400;
    error.code = 'BARCODE_EXISTS';
    throw error;
  }

  const existingPromo = await Promocion.findOne({ where: { codigo_barras: data.codigo_barras } });
  if (existingPromo) {
    const error = new Error('El código de barras ya pertenece a una promoción');
    error.status = 400;
    error.code = 'BARCODE_EXISTS_PROMO';
    throw error;
  }

  const producto = await Producto.create({
    codigo_barras: data.codigo_barras,
    nombre: data.nombre,
    tipo_venta: data.tipo_venta || 'UNITARIO',
    precio: data.precio,
    stock_actual: data.stock_actual !== undefined ? data.stock_actual : 0,
    stock_minimo: data.stock_minimo !== undefined ? data.stock_minimo : 0,
    stock_maximo: data.stock_maximo !== undefined ? data.stock_maximo : 100,
    activo: data.activo !== undefined ? data.activo : true
  });

  if (adminUserId) {
    await registrarAuditoria(
      adminUserId,
      'CREAR_PRODUCTO',
      'PRODUCTO',
      `Producto creado: ${producto.nombre} (Cód: ${producto.codigo_barras})`
    );
  }

  return producto;
}

async function updateProducto(id, data, adminUserId) {
  const producto = await Producto.findByPk(id);
  if (!producto) {
    const error = new Error('Producto no encontrado');
    error.status = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  let cambioPrecio = false;
  let precioAnterior = producto.precio;
  let nuevoPrecio = data.precio;

  if (data.precio !== undefined && parseFloat(data.precio) !== parseFloat(producto.precio)) {
    cambioPrecio = true;
  }

  if (data.codigo_barras && data.codigo_barras !== producto.codigo_barras) {
    const existingProd = await Producto.findOne({ where: { codigo_barras: data.codigo_barras } });
    if (existingProd && existingProd.id !== producto.id) {
      const err = new Error('El código de barras ya pertenece a otro producto');
      err.status = 400;
      err.code = 'BARCODE_EXISTS';
      throw err;
    }
    const existingPromo = await Promocion.findOne({ where: { codigo_barras: data.codigo_barras } });
    if (existingPromo) {
      const err = new Error('El código de barras ya pertenece a una promoción');
      err.status = 400;
      err.code = 'BARCODE_EXISTS_PROMO';
      throw err;
    }
    producto.codigo_barras = data.codigo_barras;
  }

  if (data.nombre) producto.nombre = data.nombre;
  if (data.tipo_venta) producto.tipo_venta = data.tipo_venta;
  if (data.precio !== undefined) producto.precio = data.precio;
  if (data.stock_minimo !== undefined) producto.stock_minimo = data.stock_minimo;
  if (data.stock_maximo !== undefined) producto.stock_maximo = data.stock_maximo;
  if (data.activo !== undefined) producto.activo = data.activo;

  producto.updated_at = new Date();
  await producto.save();

  if (cambioPrecio) {
    await registrarAuditoria(
      adminUserId,
      'CAMBIAR_PRECIO',
      'PRODUCTO',
      `Cambio de precio en ${producto.nombre}: de $${precioAnterior} a $${nuevoPrecio}`
    );
  } else {
    await registrarAuditoria(
      adminUserId,
      'MODIFICAR_PRODUCTO',
      'PRODUCTO',
      `Producto modificado: ${producto.nombre}`
    );
  }

  return producto;
}

async function importarProductosMasivo(items = [], adminUserId) {
  let creados = 0;
  let actualizados = 0;

  for (const item of items) {
    if (!item.codigo_barras || !item.nombre) continue;

    const code = String(item.codigo_barras).trim();
    const [prod, created] = await Producto.findOrCreate({
      where: { codigo_barras: code },
      defaults: {
        codigo_barras: code,
        nombre: String(item.nombre).trim(),
        tipo_venta: item.tipo_venta === 'PESABLE' ? 'PESABLE' : 'UNITARIO',
        precio: parseFloat(item.precio) || 0,
        stock_actual: parseFloat(item.stock_actual) || 0,
        stock_minimo: parseFloat(item.stock_minimo) || 0,
        stock_maximo: parseFloat(item.stock_maximo) || 100,
        activo: true
      }
    });

    if (!created) {
      prod.nombre = String(item.nombre).trim();
      if (item.precio !== undefined) prod.precio = parseFloat(item.precio) || 0;
      if (item.stock_actual !== undefined) prod.stock_actual = parseFloat(item.stock_actual) || 0;
      if (item.stock_minimo !== undefined) prod.stock_minimo = parseFloat(item.stock_minimo) || 0;
      if (item.stock_maximo !== undefined) prod.stock_maximo = parseFloat(item.stock_maximo) || 100;
      if (item.tipo_venta) prod.tipo_venta = item.tipo_venta === 'PESABLE' ? 'PESABLE' : 'UNITARIO';
      prod.activo = true;
      await prod.save();
      actualizados++;
    } else {
      creados++;
    }
  }

  if (adminUserId) {
    await registrarAuditoria(
      adminUserId,
      'IMPORTACION_MASIVA',
      'PRODUCTO',
      `Importación masiva: ${creados} creados, ${actualizados} actualizados`
    );
  }

  return { creados, actualizados, total: items.length };
}

module.exports = {
  getAllProductos,
  getProductoByCodigoBarras,
  createProducto,
  updateProducto,
  importarProductosMasivo
};
