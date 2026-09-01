import React, { useState } from 'react';
import api from '../services/api';
import { PackagePlus, X, AlertCircle } from 'lucide-react';

export default function QuickCreateProductModal({ scannedBarcode, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    codigo_barras: scannedBarcode || '',
    nombre: '',
    tipo_venta: 'UNITARIO',
    precio: '',
    stock_actual: '100',
    stock_minimo: '5',
    stock_maximo: '100'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.nombre.trim()) {
      setErrorMsg('Debe ingresar el nombre del producto');
      return;
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      setErrorMsg('Debe ingresar un precio válido');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock_actual: parseFloat(formData.stock_actual) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        stock_maximo: parseFloat(formData.stock_maximo) || 100
      };

      const res = await api.post('/productos', payload);
      if (res.data.success) {
        onSuccess(res.data.producto);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al registrar producto rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">Registrar Producto No Encontrado</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium">
            ⚡ Se escaneó un código sin registrar. Complétalo rápido para agregarlo inmediatamente a la venta activa.
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Código de Barras</label>
              <input
                type="text"
                required
                value={formData.codigo_barras}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 input-focus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo de Venta</label>
              <select
                value={formData.tipo_venta}
                onChange={(e) => setFormData({ ...formData, tipo_venta: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-100 input-focus"
              >
                <option value="UNITARIO">Por Unidad (Unitario)</option>
                <option value="PESABLE">Por Kilo (Pesable)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              required
              placeholder="Ej. Coca Cola 2.25L, Queso Cremoso..."
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 input-focus"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Precio ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 input-focus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Stock Inicial</label>
              <input
                type="number"
                step="0.001"
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 input-focus"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2 text-xs font-semibold rounded-xl"
            >
              {loading ? 'Guardando...' : 'Guardar y Agregar a la Venta'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
