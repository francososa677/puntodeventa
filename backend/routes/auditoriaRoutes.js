const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', auditoriaController.getAuditoria);

module.exports = router;
