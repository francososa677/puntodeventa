const sequelize = require('../database/connection');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Caja = require('./Caja');
const MedioPago = require('./MedioPago');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const Promocion = require('./Promocion');
const PromocionProducto = require('./PromocionProducto');
const MovimientoStock = require('./MovimientoStock');
const Auditoria = require('./Auditoria');
const Devolucion = require('./Devolucion');
const DetalleDevolucion = require('./DetalleDevolucion');

// Associations

// Caja
Caja.belongsTo(Usuario, { foreignKey: 'usuario_apertura_id', as: 'usuarioApertura' });
Caja.belongsTo(Usuario, { foreignKey: 'usuario_cierre_id', as: 'usuarioCierre' });
Caja.hasMany(Venta, { foreignKey: 'caja_id', as: 'ventas' });

// Venta
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Venta.belongsTo(Caja, { foreignKey: 'caja_id', as: 'caja' });
Venta.belongsTo(MedioPago, { foreignKey: 'medio_pago_id', as: 'medioPago' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });
Venta.hasMany(Devolucion, { foreignKey: 'venta_id', as: 'devoluciones' });

// DetalleVenta
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
DetalleVenta.belongsTo(Promocion, { foreignKey: 'promocion_id', as: 'promocion' });

// Promocion & PromocionProducto
Promocion.hasMany(PromocionProducto, { foreignKey: 'promocion_id', as: 'componentes' });
PromocionProducto.belongsTo(Promocion, { foreignKey: 'promocion_id', as: 'promocion' });
PromocionProducto.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// MovimientoStock
MovimientoStock.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
MovimientoStock.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Auditoria
Auditoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Devolucion & DetalleDevolucion
Devolucion.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
Devolucion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Devolucion.hasMany(DetalleDevolucion, { foreignKey: 'devolucion_id', as: 'detalles' });

DetalleDevolucion.belongsTo(Devolucion, { foreignKey: 'devolucion_id', as: 'devolucion' });
DetalleDevolucion.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
DetalleDevolucion.belongsTo(Promocion, { foreignKey: 'promocion_id', as: 'promocion' });

module.exports = {
  sequelize,
  Usuario,
  Producto,
  Caja,
  MedioPago,
  Venta,
  DetalleVenta,
  Promocion,
  PromocionProducto,
  MovimientoStock,
  Auditoria,
  Devolucion,
  DetalleDevolucion
};
