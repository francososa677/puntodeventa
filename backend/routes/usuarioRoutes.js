const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', usuarioController.getAll);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);

module.exports = router;
