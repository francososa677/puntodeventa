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

  const productos = await Producto.findAll({ where, raw: true });
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
    result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return result;
  }
}

async function getProductoByCodigoBarras(codigo) {
  return await Producto.findOne({ where: { codigo_barras: codigo, activo: true } });
}

async function createProducto(data, adminUserId) {
  const { codigo_barras, nombre, tipo_venta, precio, stock_actual, stock_minimo, stock_maximo } = data;

  // Validar unicidad cruzada con Producto y Promoción
  const existingProducto = await Producto.findOne({ where: { codigo_barras } });
  if (existingProducto) {
    const err = new Error('El código de barras ya pertenece a otro producto');
    err.status = 400;
    err.code = 'BARCODE_EXISTS';
    throw err;
  }

  const existingPromo = await Promocion.findOne({ where: { codigo_barras } });
  if (existingPromo) {
    const err = new Error('El código de barras ya pertenece a una promoción registrada');
    err.status = 400;
    err.code = 'BARCODE_EXISTS_PROMO';
    throw err;
  }

  const nuevo = await Producto.create({
    codigo_barras,
    nombre,
    tipo_venta: tipo_venta || 'UNITARIO',
    precio,
    stock_actual: stock_actual || 0,
    stock_minimo: stock_minimo || 0,
    stock_maximo: stock_maximo !== undefined && stock_maximo !== null ? stock_maximo : 100,
    activo: true
  });

  await registrarAuditoria(
    adminUserId,
    'CREAR_PRODUCTO',
    'PRODUCTO',
    `Producto creado: ${nuevo.nombre} (${nuevo.codigo_barras}) - Tipo: ${nuevo.tipo_venta} - Precio: $${nuevo.precio}`
  );

  return nuevo;
}

async function updateProducto(id, data, adminUserId) {
  const producto = await Producto.findByPk(id);
  if (!producto) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  const precioAnterior = parseFloat(producto.precio);
  const nuevoPrecio = data.precio !== undefined ? parseFloat(data.precio) : precioAnterior;
  const cambioPrecio = nuevoPrecio !== precioAnterior;

  if (data.codigo_barras && data.codigo_barras !== producto.codigo_barras) {
    const existingProducto = await Producto.findOne({ where: { codigo_barras: data.codigo_barras } });
    if (existingProducto) {
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
