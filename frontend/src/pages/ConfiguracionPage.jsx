import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, CreditCard, CheckCircle, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ConfiguracionPage() {
  const [mediosPago, setMediosPago] = useState([]);
  const [stockMaximoDefault, setStockMaximoDefault] = useState('100');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resMedios, resConfig] = await Promise.all([
        api.get('/medios-pago'),
        api.get('/configuracion')
      ]);

      if (resMedios.data.success) {
        setMediosPago(resMedios.data.medios);
      }
      if (resConfig.data.success && resConfig.data.configuracion) {
        setStockMaximoDefault(resConfig.data.configuracion.stock_maximo_default || '100');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleToggle = async (id, currentEstado) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/medios-pago/${id}/toggle`, { activo: !currentEstado });
      cargarDatos();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar medio de pago');
    }
  };

  const handleSaveStockConfig = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put('/configuracion', {
        stock_maximo_default: parseFloat(stockMaximoDefault)
      });
      if (res.data.success) {
        setSuccessMsg('Valor predeterminado del 100% de stock actualizado con éxito.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar configuración');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Configuración del Sistema (Stockio)</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Parámetros generales, stock e integración de cobro (Solo Administradores)</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section: Medios de Pago */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Medios de Pago Habilitados</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Configure los medios de pago aceptados en la pantalla de cobro. Debe haber al menos un medio activo.
        </p>

        <div className="divide-y divide-zinc-800/80">
          {mediosPago.map(mp => (
            <div key={mp.id} className="py-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <span>{mp.nombre}</span>
                  {mp.es_efectivo && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      Afecta Arqueo Efectivo
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  ID: #{mp.id}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-medium ${mp.activo ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {mp.activo ? 'Habilitado' : 'Deshabilitado'}
                </span>
                <button
                  onClick={() => handleToggle(mp.id, mp.activo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mp.activo
                      ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300'
                      : 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {mp.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Stock Capacity Configuration */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Parámetros de Stock y Capacidad Visual (100%)</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Defina el valor numérico predeterminado que representa el <strong className="text-zinc-200">100% de la barra visual de stock</strong> para todos los productos que no tengan un valor personalizado.
        </p>

        <form onSubmit={handleSaveStockConfig} className="flex flex-col sm:flex-row items-end gap-3 pt-2">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Valor Predeterminado (100% Stock)
            </label>
            <input
              type="number"
              min="1"
              required
              value={stockMaximoDefault}
              onChange={(e) => setStockMaximoDefault(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 text-sm font-mono input-focus"
              placeholder="Ej: 100"
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto h-[42px] px-6">
            Guardar Configuración
          </button>
        </form>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-mono text-zinc-300 mt-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Nivel Verde (&gt; 50% de la capacidad): Stock Óptimo</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Nivel Amarillo (20% a 50%): Stock Medio</span>
          </div>
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Nivel Rojo (&lt; 20% o debajo de Stock Mínimo): Stock Crítico / Reposición URGENTE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
