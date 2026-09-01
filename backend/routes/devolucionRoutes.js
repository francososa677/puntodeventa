const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);

// Refunds allow both EMPLEADO and ADMIN roles
router.post('/', devolucionController.registrar);
router.get('/', devolucionController.getAll);

module.exports = router;
