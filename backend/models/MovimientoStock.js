const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const MovimientoStock = sequelize.define('MovimientoStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('INGRESO', 'VENTA', 'AJUSTE', 'DEVOLUCION'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'movimientos_stock'
});

module.exports = MovimientoStock;
