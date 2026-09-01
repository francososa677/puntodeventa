const auditoriaService = require('../services/auditoriaService');

async function getAuditoria(req, res, next) {
  try {
    const logs = await auditoriaService.obtenerAuditoria(req.query);
    return res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditoria
};
