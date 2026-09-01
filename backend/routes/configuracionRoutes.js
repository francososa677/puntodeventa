const express = require('express');
const router = express.Router();
const { Configuracion } = require('../models');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// GET /api/configuracion
router.get('/', authenticateToken, async (req, res) => {
  try {
    const configs = await Configuracion.findAll();
    const result = {};
    configs.forEach(c => {
      result[c.clave] = c.valor;
    });

    if (!result.stock_maximo_default) {
      result.stock_maximo_default = "100";
    }

    res.json({ success: true, configuracion: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/configuracion
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { stock_maximo_default } = req.body;

    if (stock_maximo_default !== undefined) {
      const [config] = await Configuracion.findOrCreate({
        where: { clave: 'stock_maximo_default' },
        defaults: { valor: stock_maximo_default.toString() }
      });
      config.valor = stock_maximo_default.toString();
      await config.save();
    }

    const configs = await Configuracion.findAll();
    const result = {};
    configs.forEach(c => {
      result[c.clave] = c.valor;
    });

    res.json({ success: true, configuracion: result, message: 'Configuración actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
