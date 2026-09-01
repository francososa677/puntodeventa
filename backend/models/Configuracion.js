const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Configuracion = sequelize.define('Configuracion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clave: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'configuraciones',
  timestamps: false
});

module.exports = Configuracion;
