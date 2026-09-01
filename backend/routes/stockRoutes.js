const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/movimientos', stockController.getMovimientos);

// Stock adjustments require ADMIN role
router.post('/ingreso', requireAdmin, stockController.ingreso);
router.post('/ajuste', requireAdmin, stockController.ajuste);

module.exports = router;
