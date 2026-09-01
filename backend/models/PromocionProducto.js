const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PromocionProducto = sequelize.define('PromocionProducto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  promocion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  }
}, {
  tableName: 'promocion_productos'
});

module.exports = PromocionProducto;
