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

  return await Producto.findAll({
    where,
    order: [['nombre', 'ASC']]
  });
}

async function getProductoByCodigoBarras(codigo) {
  return await Producto.findOne({ where: { codigo_barras: codigo, activo: true } });
}

async function createProducto(data, adminUserId) {
  const { codigo_barras, nombre, tipo_venta, precio, stock_actual, stock_minimo } = data;

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

module.exports = {
  getAllProductos,
  getProductoByCodigoBarras,
  createProducto,
  updateProducto
};
