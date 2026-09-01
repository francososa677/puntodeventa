const ExcelJS = require('exceljs');
const { Venta, DetalleVenta, Devolucion, DetalleDevolucion, Caja, Producto, MedioPago, Usuario } = require('../models');

async function exportarReportesExcel(res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema POS Almacén';
  workbook.created = new Date();

  // Hoja 1: Ventas
  const sheetVentas = workbook.addWorksheet('Ventas');
  sheetVentas.columns = [
    { header: 'ID Venta', key: 'id', width: 10 },
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Caja ID', key: 'caja_id', width: 10 },
    { header: 'Medio de Pago', key: 'medio_pago', width: 18 },
    { header: 'Total ($)', key: 'total', width: 15 }
  ];

  const ventas = await Venta.findAll({
    include: [
      { model: Usuario, as: 'usuario', attributes: ['nombre'] },
      { model: MedioPago, as: 'medioPago', attributes: ['nombre'] }
    ],
    order: [['fecha', 'DESC']]
  });

  ventas.forEach(v => {
    sheetVentas.addRow({
      id: v.id,
      fecha: new Date(v.fecha).toLocaleString('es-AR'),
      usuario: v.usuario ? v.usuario.nombre : 'N/A',
      caja_id: v.caja_id,
      medio_pago: v.medioPago ? v.medioPago.nombre : 'N/A',
      total: parseFloat(v.total)
    });
  });

  // Hoja 2: Devoluciones y Anulaciones
  const sheetDevoluciones = workbook.addWorksheet('Devoluciones');
  sheetDevoluciones.columns = [
    { header: 'ID Devolución', key: 'id', width: 15 },
    { header: 'Venta ID', key: 'venta_id', width: 12 },
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Autorizado Por', key: 'usuario', width: 20 },
    { header: 'Motivo', key: 'motivo', width: 30 },
    { header: 'Monto Devuelto ($)', key: 'total', width: 18 }
  ];

  const devoluciones = await Devolucion.findAll({
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
    order: [['fecha', 'DESC']]
  });

  devoluciones.forEach(d => {
    sheetDevoluciones.addRow({
      id: d.id,
      venta_id: d.venta_id,
      fecha: new Date(d.fecha).toLocaleString('es-AR'),
      usuario: d.usuario ? d.usuario.nombre : 'N/A',
      motivo: d.motivo || 'N/A',
      total: parseFloat(d.total)
    });
  });

  // Hoja 3: Cierres de Caja (Arqueo)
  const sheetCajas = workbook.addWorksheet('Arqueos de Caja');
  sheetCajas.columns = [
    { header: 'Caja ID', key: 'id', width: 10 },
    { header: 'Apertura', key: 'fecha_apertura', width: 20 },
    { header: 'Cierre', key: 'fecha_cierre', width: 20 },
    { header: 'Monto Inicial ($)', key: 'monto_inicial', width: 18 },
    { header: 'Esperado Efectivo ($)', key: 'monto_esperado', width: 22 },
    { header: 'Declarado Efectivo ($)', key: 'monto_declarado', width: 22 },
    { header: 'Diferencia ($)', key: 'diferencia', width: 15 },
    { header: 'Estado', key: 'estado', width: 12 }
  ];

  const cajas = await Caja.findAll({ order: [['fecha_apertura', 'DESC']] });

  cajas.forEach(c => {
    sheetCajas.addRow({
      id: c.id,
      fecha_apertura: new Date(c.fecha_apertura).toLocaleString('es-AR'),
      fecha_cierre: c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString('es-AR') : 'Abierta',
      monto_inicial: parseFloat(c.monto_inicial),
      monto_esperado: c.monto_esperado_efectivo ? parseFloat(c.monto_esperado_efectivo) : 0,
      monto_declarado: c.monto_declarado_efectivo ? parseFloat(c.monto_declarado_efectivo) : 0,
      diferencia: c.diferencia ? parseFloat(c.diferencia) : 0,
      estado: c.estado
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Sistema_POS.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  exportarReportesExcel
};
