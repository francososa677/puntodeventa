import React, { useState } from 'react';
import { useCaja } from '../context/CajaContext';
import { Vault, X, AlertCircle } from 'lucide-react';

export default function AbrirCajaModal({ onClose }) {
  const { abrirCaja } = useCaja();
  const [montoInicial, setMontoInicial] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(montoInicial);
    if (isNaN(val) || val < 0) {
      setError('Ingrese un monto inicial válido (0 o mayor)');
      return;
    }

    try {
      setLoading(true);
      await abrirCaja(val);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Vault className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Apertura de Caja</h2>
            <p className="text-xs text-zinc-400">Ingrese el efectivo inicial para iniciar el turno</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Monto Inicial en Efectivo ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              autoFocus
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 font-mono text-lg input-focus"
              placeholder="0.00"
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
              {loading ? 'Abriendo...' : 'Confirmar Apertura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
