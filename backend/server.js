const express = require('express');
const cors = require('cors');
const path = require('path');

const { sequelize } = require('./models');
const seed = require('./database/seed');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const promocionRoutes = require('./routes/promocionRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const medioPagoRoutes = require('./routes/medioPagoRoutes');
const stockRoutes = require('./routes/stockRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const devolucionRoutes = require('./routes/devolucionRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/promociones', promocionRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/medios-pago', medioPagoRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/devoluciones', devolucionRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Servir frontend compilado en producción
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Servidor Backend en ejecución (Frontend no compilado en /dist aún).');
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Inicializar DB y servidor
async function startServer() {
  try {
    await sequelize.sync({ force: false });
    console.log('✔ Base de datos SQLite sincronizada correctamente');

    await seed();

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 Servidor POS iniciado en http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

startServer();
