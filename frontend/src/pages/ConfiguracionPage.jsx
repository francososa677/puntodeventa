import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, CreditCard, CheckCircle, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ConfiguracionPage() {
  const [mediosPago, setMediosPago] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarMediosPago = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medios-pago');
      if (res.data.success) {
        setMediosPago(res.data.medios);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMediosPago();
  }, []);

  const handleToggle = async (id, currentEstado) => {
    setErrorMsg('');
    try {
      await api.put(`/medios-pago/${id}/toggle`, { activo: !currentEstado });
      cargarMediosPago();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar medio de pago');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Configuración del Sistema</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Parámetros generales y medios de pago (Solo Administradores)</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
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
    </div>
  );
}
