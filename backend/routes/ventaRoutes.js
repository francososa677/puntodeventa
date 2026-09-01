const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.post('/', ventaController.registrar);
router.get('/', ventaController.getAll);
router.get('/:id', ventaController.getById);

module.exports = router;
