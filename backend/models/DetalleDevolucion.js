const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const DetalleDevolucion = sequelize.define('DetalleDevolucion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  devolucion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  promocion_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'detalle_devoluciones'
});

module.exports = DetalleDevolucion;
