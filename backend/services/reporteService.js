const {
  Venta,
  DetalleVenta,
  Devolucion,
  DetalleDevolucion,
  Producto,
  Promocion,
  PromocionProducto,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

async function obtenerReportes(fechaInicio, fechaFin) {
  const whereVenta = {};
  const whereDevolucion = {};

  if (fechaInicio || fechaFin) {
    whereVenta.fecha = {};
    whereDevolucion.fecha = {};
    if (fechaInicio) {
      whereVenta.fecha[Op.gte] = new Date(fechaInicio);
      whereDevolucion.fecha[Op.gte] = new Date(fechaInicio);
    }
    if (fechaFin) {
      whereVenta.fecha[Op.lte] = new Date(fechaFin);
      whereDevolucion.fecha[Op.lte] = new Date(fechaFin);
    }
  }

  // 1. Obtener todas las ventas del período
  const ventas = await Venta.findAll({
    where: whereVenta,
    include: [{
      model: DetalleVenta,
      as: 'detalles',
      include: [
        { model: Producto, as: 'producto' },
        { model: Promocion, as: 'promocion' }
      ]
    }]
  });

  // 2. Obtener todas las devoluciones del período
  const devoluciones = await Devolucion.findAll({
    where: whereDevolucion,
    include: [{
      model: DetalleDevolucion,
      as: 'detalles'
    }]
  });

  // Mapear ventas por producto/promoción (bruto)
  const productosStats = {}; // { prodId: { id, nombre, tipo, unidadesVendidas, ingresoBruto, unidadesDevueltas, ingresoDevuelto, unidadesNetas, ingresoNeto, stockActual } }

  for (const v of ventas) {
    for (const d of v.detalles) {
      if (d.producto_id && d.producto) {
        const pId = d.producto_id;
        if (!productosStats[pId]) {
          productosStats[pId] = {
            id: pId,
            nombre: d.producto.nombre,
            tipo_venta: d.producto.tipo_venta,
            stock_actual: parseFloat(d.producto.stock_actual),
            unidadesVendidas: 0,
            ingresoBruto: 0,
            unidadesDevueltas: 0,
            ingresoDevuelto: 0,
            unidadesNetas: 0,
            ingresoNeto: 0
          };
        }
        productosStats[pId].unidadesVendidas += parseFloat(d.cantidad);
        productosStats[pId].ingresoBruto += parseFloat(d.subtotal);
      }
    }
  }

  // Restar devoluciones
  for (const dev of devoluciones) {
    for (const d of dev.detalles) {
      if (d.producto_id && productosStats[d.producto_id]) {
        productosStats[d.producto_id].unidadesDevueltas += parseFloat(d.cantidad);
        productosStats[d.producto_id].ingresoDevuelto += parseFloat(d.subtotal);
      }
    }
  }

  // Calcular valores netos
  const listaProductosStats = Object.values(productosStats).map(p => {
    p.unidadesNetas = Math.max(0, p.unidadesVendidas - p.unidadesDevueltas);
    p.ingresoNeto = Math.max(0, p.ingresoBruto - p.ingresoDevuelto);
    p.unidadesNetas = Math.round(p.unidadesNetas * 1000) / 1000;
    p.ingresoNeto = Math.round(p.ingresoNeto * 100) / 100;
    return p;
  });

  // KPIs
  // Top 10 más vendidos (neto)
  const top10MasVendidos = [...listaProductosStats]
    .sort((a, b) => b.unidadesNetas - a.unidadesNetas)
    .slice(0, 10);

  // Top 10 menos vendidos (neto)
  const top10MenosVendidos = [...listaProductosStats]
    .sort((a, b) => a.unidadesNetas - b.unidadesNetas)
    .slice(0, 10);

  // Ingreso total neto del catálogo
  const ingresoTotalCatalogo = listaProductosStats.reduce((acc, p) => acc + p.ingresoNeto, 0);

  // Rotación de inventario (Ventas netas unidades / (Stock Actual + Ventas netas unidades))
  const rotacionInventario = listaProductosStats.map(p => {
    const stock = p.stock_actual;
    const ventasNetas = p.unidadesNetas;
    const totalDisponibles = stock + ventasNetas;
    const rotacion = totalDisponibles > 0 ? (ventasNetas / totalDisponibles) * 100 : 0;
    return {
      id: p.id,
      nombre: p.nombre,
      rotacionPorcentaje: Math.round(rotacion * 100) / 100,
      ventasNetas,
      stockActual: stock
    };
  }).sort((a, b) => b.rotacionPorcentaje - a.rotacionPorcentaje);

  // Distribución por día de la semana y rango horario
  const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const porDiaSemana = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const porHorario = { Manana: 0, Tarde: 0, Noche: 0 }; // Mañana: 6-12, Tarde: 12-19, Noche: 19-24

  let totalVentasContadas = 0;
  let totalItemsVendidosCount = 0;

  for (const v of ventas) {
    const f = new Date(v.fecha);
    const dia = f.getDay();
    const hora = f.getHours();

    const montoVenta = parseFloat(v.total);
    porDiaSemana[dia] += montoVenta;

    if (hora >= 6 && hora < 12) porHorario.Manana += montoVenta;
    else if (hora >= 12 && hora < 19) porHorario.Tarde += montoVenta;
    else porHorario.Noche += montoVenta;

    totalVentasContadas++;
    if (v.detalles) {
      totalItemsVendidosCount += v.detalles.reduce((acc, det) => acc + parseFloat(det.cantidad), 0);
    }
  }

  // Ajustar montos por día de la semana netos de devoluciones
  const totalDevolucionesMonto = devoluciones.reduce((acc, d) => acc + parseFloat(d.total), 0);

  const diasFormatted = Object.keys(porDiaSemana).map(d => ({
    dia: diasSemanaNombres[d],
    monto: Math.round(porDiaSemana[d] * 100) / 100
  }));

  const totalHorarios = (porHorario.Manana + porHorario.Tarde + porHorario.Noche) || 1;
  const distribucionHorario = {
    Manana: Math.round((porHorario.Manana / totalHorarios) * 100),
    Tarde: Math.round((porHorario.Tarde / totalHorarios) * 100),
    Noche: Math.round((porHorario.Noche / totalHorarios) * 100)
  };

  const promedioProductosPorVenta = totalVentasContadas > 0
    ? Math.round((totalItemsVendidosCount / totalVentasContadas) * 100) / 100
    : 0;

  // Comparaciones Semana y Mes
  const ahora = new Date();
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hace14Dias = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000);

  const ventasSemanaActual = await Venta.sum('total', { where: { fecha: { [Op.gte]: hace7Dias } } }) || 0;
  const ventasSemanaAnterior = await Venta.sum('total', { where: { fecha: { [Op.gte]: hace14Dias, [Op.lt]: hace7Dias } } }) || 0;

  const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const hace60Dias = new Date(ahora.getTime() - 60 * 24 * 60 * 60 * 1000);

  const ventasMesActual = await Venta.sum('total', { where: { fecha: { [Op.gte]: hace30Dias } } }) || 0;
  const ventasMesAnterior = await Venta.sum('total', { where: { fecha: { [Op.gte]: hace60Dias, [Op.lt]: hace30Dias } } }) || 0;

  return {
    top10MasVendidos,
    top10MenosVendidos,
    ingresosPorProducto: listaProductosStats,
    ingresoTotalCatalogo: Math.round(ingresoTotalCatalogo * 100) / 100,
    rotacionInventario,
    diasSemana: diasFormatted,
    distribucionHorario,
    promedioProductosPorVenta,
    comparativaSemana: {
      semanaActual: ventasSemanaActual,
      semanaAnterior: ventasSemanaAnterior,
      diferenciaPorcentaje: ventasSemanaAnterior > 0 ? Math.round(((ventasSemanaActual - ventasSemanaAnterior) / ventasSemanaAnterior) * 100) : 0
    },
    comparativaMes: {
      mesActual: ventasMesActual,
      mesAnterior: ventasMesAnterior,
      diferenciaPorcentaje: ventasMesAnterior > 0 ? Math.round(((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100) : 0
    }
  };
}

module.exports = {
  obtenerReportes
};
