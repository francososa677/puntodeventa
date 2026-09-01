import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function ReportesPage() {
  const [reportes, setReportes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarReportes = async () => {
    try {
      setLoading(true);
      let query = '';
      if (fechaInicio) query += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) query += `fechaFin=${fechaFin}`;

      const res = await api.get(`/reportes?${query}`);
      if (res.data.success) {
        setReportes(res.data.reportes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const handleExportarExcel = () => {
    window.open('/api/reportes/exportar/excel', '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-zinc-400 font-mono text-xs">
        Cargando reportes y analíticas...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header & Date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Reportes y Analíticas de Venta</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Métricas netas descontando devoluciones y anulaciones</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent text-zinc-200 outline-none"
            />
            <span className="text-zinc-600">a</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-transparent text-zinc-200 outline-none"
            />
            <button
              onClick={cargarReportes}
              className="ml-1 text-emerald-400 font-semibold hover:underline"
            >
              Filtrar
            </button>
          </div>

          <button
            onClick={handleExportarExcel}
            className="btn-primary py-2 text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar a Excel</span>
          </button>
        </div>
      </div>

      {/* Overview Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Catalog Revenue */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Ingreso Neto Total</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              ${reportes?.ingresoTotalCatalogo?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Avg items per sale */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Prom. Productos / Venta</span>
            <span className="text-xl font-bold font-mono text-zinc-100 mt-1 block">
              {reportes?.promedioProductosPorVenta} uds
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">vs. Semana Anterior</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-zinc-100">
                ${reportes?.comparativaSemana?.semanaActual?.toLocaleString('es-AR')}
              </span>
              <span className={`text-xs font-bold font-mono flex items-center ${
                reportes?.comparativaSemana?.diferenciaPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {reportes?.comparativaSemana?.diferenciaPorcentaje >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {reportes?.comparativaSemana?.diferenciaPorcentaje}%
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">vs. Mes Anterior</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-zinc-100">
                ${reportes?.comparativaMes?.mesActual?.toLocaleString('es-AR')}
              </span>
              <span className={`text-xs font-bold font-mono flex items-center ${
                reportes?.comparativaMes?.diferenciaPorcentaje >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {reportes?.comparativaMes?.diferenciaPorcentaje >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {reportes?.comparativaMes?.diferenciaPorcentaje}%
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top 10 Mas Vendidos & Menos Vendidos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top 10 Mas Vendidos */}
          <div className="glass-panel rounded-2xl p-5 border border-zinc-800 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Top 10 Productos Más Vendidos (Unidades Netas)</span>
            </h2>

            <div className="space-y-2">
              {reportes?.top10MasVendidos?.map((item, idx) => (
                <div key={item.id} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-zinc-200">{item.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-bold">{item.unidadesNetas} {item.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}</span>
                    <span className="text-zinc-400 w-20 text-right">${item.ingresoNeto.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Menos Vendidos */}
          <div className="glass-panel rounded-2xl p-5 border border-zinc-800 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Top 10 Productos Menos Vendidos (Baja Rotación)</span>
            </h2>

            <div className="space-y-2">
              {reportes?.top10MenosVendidos?.map((item, idx) => (
                <div key={item.id} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-zinc-200">{item.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-bold">{item.unidadesNetas} {item.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}</span>
                    <span className="text-zinc-400 w-20 text-right">${item.ingresoNeto.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Schedule & Weekday Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Horarios Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-zinc-800 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Distribución por Rango Horario</span>
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Mañana (06:00 - 11:59)</span>
                  <span className="text-sky-400 font-bold">{reportes?.distribucionHorario?.Manana}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${reportes?.distribucionHorario?.Manana}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Tarde (12:00 - 18:59)</span>
                  <span className="text-emerald-400 font-bold">{reportes?.distribucionHorario?.Tarde}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${reportes?.distribucionHorario?.Tarde}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Noche (19:00 - 23:59)</span>
                  <span className="text-purple-400 font-bold">{reportes?.distribucionHorario?.Noche}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${reportes?.distribucionHorario?.Noche}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Dias de la Semana */}
          <div className="glass-panel rounded-2xl p-5 border border-zinc-800 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Ventas por Día de la Semana</span>
            </h2>

            <div className="space-y-2 font-mono text-xs">
              {reportes?.diasSemana?.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-300">{d.dia}</span>
                  <span className="text-emerald-400 font-bold">${d.monto.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
