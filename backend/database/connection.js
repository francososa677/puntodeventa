const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'puntoventa.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log for debugging SQL queries if needed
  define: {
    timestamps: false,
    underscored: true
  }
});

module.exports = sequelize;
