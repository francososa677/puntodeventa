const express = require('express');
const router = express.Router();
const promocionController = require('../controllers/promocionController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/', promocionController.getAll);
router.get('/codigo/:codigo', promocionController.getByCodigo);

// Administrative actions require ADMIN role
router.post('/', requireAdmin, promocionController.create);
router.put('/:id', requireAdmin, promocionController.update);

module.exports = router;
