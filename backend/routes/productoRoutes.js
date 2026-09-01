const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/', productoController.getAll);
router.get('/codigo/:codigo', productoController.getByCodigo);

// Administrative actions require ADMIN role
router.post('/', requireAdmin, productoController.create);
router.put('/:id', requireAdmin, productoController.update);

module.exports = router;
