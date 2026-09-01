const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  accion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entidad: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detalle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'auditoria'
});

module.exports = Auditoria;
