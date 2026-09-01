const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Promocion = sequelize.define('Promocion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codigo_barras: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  precio_promocional: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  activa: {
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
  tableName: 'promociones'
});

module.exports = Promocion;
