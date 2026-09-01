const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const MedioPago = sequelize.define('MedioPago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  es_efectivo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'medios_pago'
});

module.exports = MedioPago;
