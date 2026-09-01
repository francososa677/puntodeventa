import React, { useState, useEffect } from 'react';
import { Scale, X, Check } from 'lucide-react';

export default function PesableModal({ producto, initialQtyKg = null, onConfirm, onClose }) {
  const precioKg = parseFloat(producto.precio);
  
  const [cantidadKg, setCantidadKg] = useState(() => {
    return initialQtyKg ? initialQtyKg.toString() : '0.250';
  });
  const [importe, setImporte] = useState(() => {
    const initKg = initialQtyKg || 0.250;
    return (initKg * precioKg).toFixed(2);
  });

  const handleKgChange = (val) => {
    setCantidadKg(val);
    const kg = parseFloat(val);
    if (!isNaN(kg) && kg > 0) {
      const calcImporte = (kg * precioKg).toFixed(2);
      setImporte(calcImporte);
    } else {
      setImporte('0.00');
    }
  };

  const handleImporteChange = (val) => {
    setImporte(val);
    const imp = parseFloat(val);
    if (!isNaN(imp) && imp > 0 && precioKg > 0) {
      const calcKg = (imp / precioKg).toFixed(3);
      setCantidadKg(calcKg);
    } else {
      setCantidadKg('0.000');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const kg = parseFloat(cantidadKg);
    if (isNaN(kg) || kg <= 0) return;
    onConfirm(kg);
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase bg-sky-950 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-medium">
              Producto Pesable
            </span>
            <h2 className="text-base font-semibold text-zinc-100 mt-1">{producto.nombre}</h2>
            <p className="text-xs text-zinc-400 font-mono">
              Precio por kg: <span className="text-emerald-400 font-bold">${precioKg.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
            
            {/* Importe ($) */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Importe ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={importe}
                onChange={(e) => handleImporteChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-emerald-400 font-mono text-lg font-bold input-focus"
              />
            </div>

            {/* Cantidad (kg) */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Cantidad (kg)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={cantidadKg}
                onChange={(e) => handleKgChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-sky-300 font-mono text-lg font-bold input-focus"
              />
            </div>

          </div>

          <div className="text-[11px] text-zinc-500 text-center font-mono">
            Subtotal calculado: ${parseFloat(importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ({cantidadKg} kg)
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
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>Agregar a Venta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
