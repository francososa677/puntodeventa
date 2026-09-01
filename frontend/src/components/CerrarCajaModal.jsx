import React, { useState, useEffect } from 'react';
import { useCaja } from '../context/CajaContext';
import { Vault, X, AlertCircle, Calculator, CheckCircle2 } from 'lucide-react';

export default function CerrarCajaModal({ onClose }) {
  const { estadoCaja, cerrarCaja } = useCaja();
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const esperado = estadoCaja?.montoEsperadoEfectivo || 0;
  const declaradoNum = parseFloat(montoDeclarado) || 0;
  const diferencia = declaradoNum - esperado;

  useEffect(() => {
    if (estadoCaja?.montoEsperadoEfectivo !== undefined) {
      setMontoDeclarado(estadoCaja.montoEsperadoEfectivo.toString());
    }
  }, [estadoCaja]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(montoDeclarado);
    if (isNaN(val) || val < 0) {
      setError('Ingrese un monto declarado válido');
      return;
    }

    try {
      setLoading(true);
      await cerrarCaja(val, observaciones);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Cierre de Caja (Arqueo)</h2>
            <p className="text-xs text-zinc-400">Verifique los montos del turno actual</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumen del cálculo del sistema */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-2 mb-4 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Monto Inicial:</span>
            <span>${estadoCaja?.montoInicial?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>(+) Ventas Efectivo:</span>
            <span>+${estadoCaja?.totalEfectivoVentas?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
          {estadoCaja?.totalEfectivoDevoluciones > 0 && (
            <div className="flex justify-between text-rose-400">
              <span>(-) Devoluciones Efectivo:</span>
              <span>-${estadoCaja?.totalEfectivoDevoluciones?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold text-zinc-100 text-sm">
            <span>Monto Esperado en Efectivo:</span>
            <span>${esperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>

          {estadoCaja?.totalOtrosVentas > 0 && (
            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
              <span>* Ventas Tarjeta/Transferencia (Informativo): ${estadoCaja?.totalOtrosVentas?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Efectivo Declarado (Conteo físico) ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              autoFocus
              value={montoDeclarado}
              onChange={(e) => setMontoDeclarado(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 font-mono text-lg input-focus"
            />
          </div>

          {/* Arqueo diferencia visual indicator */}
          <div className={`p-3 rounded-lg border flex items-center justify-between font-mono text-xs ${
            diferencia === 0
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : diferencia > 0
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            <span className="font-sans font-medium">Diferencia de Arqueo:</span>
            <span className="font-bold text-sm">
              {diferencia > 0 ? `+$${diferencia.toFixed(2)} (Sobrante)` : diferencia < 0 ? `-$${Math.abs(diferencia).toFixed(2)} (Faltante)` : '$0.00 (Cuadrado)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Justificación de faltante/sobrante o billetes estropeados..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs input-focus resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
