const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_barras: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo_venta: {
    type: DataTypes.ENUM('UNITARIO', 'PESABLE'),
    allowNull: false,
    defaultValue: 'UNITARIO'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_actual: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  },
  stock_minimo: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'productos'
});

module.exports = Producto;
