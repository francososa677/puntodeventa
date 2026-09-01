const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', reporteController.getReportes);
router.get('/exportar/excel', reporteController.exportarExcel);

module.exports = router;
