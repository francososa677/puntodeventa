const express = require('express');
const router = express.Router();
const medioPagoController = require('../controllers/medioPagoController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/', medioPagoController.getAll);

// Admin only configuration
router.put('/:id/toggle', requireAdmin, medioPagoController.toggleActivo);

module.exports = router;
