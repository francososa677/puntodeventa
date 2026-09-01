const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

// Both ADMIN and EMPLEADO can open and close cash register
router.get('/estado', cajaController.getEstadoActual);
router.post('/aperturar', cajaController.abrir);
router.post('/cerrar', cajaController.cerrar);
router.get('/historial', cajaController.getHistorial);

module.exports = router;
