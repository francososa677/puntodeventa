const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Caja = sequelize.define('Caja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_apertura_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  monto_inicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  usuario_cierre_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true
  },
  monto_esperado_efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  monto_declarado_efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  diferencia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ABIERTA', 'CERRADA'),
    allowNull: false,
    defaultValue: 'ABIERTA'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cajas'
});

module.exports = Caja;
