const reporteService = require('../services/reporteService');
const excelService = require('../services/excelService');

async function getReportes(req, res, next) {
  try {
    const reportes = await reporteService.obtenerReportes(req.query.fechaInicio, req.query.fechaFin);
    return res.json({ success: true, reportes });
  } catch (error) {
    next(error);
  }
}

async function exportarExcel(req, res, next) {
  try {
    await excelService.exportarReportesExcel(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReportes,
  exportarExcel
};
