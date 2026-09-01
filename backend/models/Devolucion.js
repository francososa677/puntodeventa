const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Devolucion = sequelize.define('Devolucion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  venta_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'devoluciones'
});

module.exports = Devolucion;
