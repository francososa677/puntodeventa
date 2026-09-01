import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { RotateCcw, Search, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function DevolucionesPage() {
  const [ventaIdInput, setVentaIdInput] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [itemsDevolucion, setItemsDevolucion] = useState({}); // { detailId: cantDevolver }
  const [motivo, setMotivo] = useState('');

  const [devolucionesRecientes, setDevolucionesRecientes] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const cargarDevolucionesRecientes = async () => {
    try {
      const res = await api.get('/devoluciones');
      if (res.data.success) setDevolucionesRecientes(res.data.devoluciones);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDevolucionesRecientes();
  }, []);

  const handleBuscarVenta = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setVentaSeleccionada(null);
    setItemsDevolucion({});

    if (!ventaIdInput.trim()) return;

    try {
      setLoading(true);
      const res = await api.get(`/ventas/${ventaIdInput.trim()}`);
      if (res.data.success && res.data.venta) {
        setVentaSeleccionada(res.data.venta);
        // Initialize default return qtys to 0
        const initial = {};
        res.data.venta.detalles.forEach(d => {
          initial[d.id] = 0;
        });
        setItemsDevolucion(initial);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Venta no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarDevolucion = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const itemsPayload = [];
    ventaSeleccionada.detalles.forEach(d => {
      const cant = parseFloat(itemsDevolucion[d.id]) || 0;
      if (cant > 0) {
        if (d.producto_id) {
          itemsPayload.push({ productoId: d.producto_id, cantidad: cant });
        } else if (d.promocion_id) {
          itemsPayload.push({ promocionId: d.promocion_id, cantidad: cant });
        }
      }
    });

    if (itemsPayload.length === 0) {
      setErrorMsg('Seleccione al menos un ítem con cantidad mayor a 0 para devolver');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/devoluciones', {
        ventaId: ventaSeleccionada.id,
        items: itemsPayload,
        motivo
      });

      if (res.data.success) {
        setSuccessMsg(`Devolución #${res.data.devolucionId} procesada exitosamente. Total devuelto: $${res.data.totalDevuelto}`);
        setVentaSeleccionada(null);
        setVentaIdInput('');
        cargarDevolucionesRecientes();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-400" />
          <span>Devoluciones y Anulaciones de Venta</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Reversión de transacciones y reposición de stock (Solo Administradores)</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Buscar Venta */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
        <form onSubmit={handleBuscarVenta} className="flex gap-3 max-w-md">
          <input
            type="number"
            value={ventaIdInput}
            onChange={(e) => setVentaIdInput(e.target.value)}
            placeholder="Ingrese ID de Venta (Ej: 1)"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs font-mono input-focus"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            <Search className="w-4 h-4" />
            <span>Buscar Venta</span>
          </button>
        </form>

        {/* Detalle de venta para devolver */}
        {ventaSeleccionada && (
          <form onSubmit={handleConfirmarDevolucion} className="pt-4 border-t border-zinc-800 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-xs">
              <div>
                <span className="text-zinc-400">Venta ID:</span> <span className="font-bold text-zinc-100">#{ventaSeleccionada.id}</span>
                <span className="ml-4 text-zinc-400">Fecha:</span> <span>{new Date(ventaSeleccionada.fecha).toLocaleString('es-AR')}</span>
              </div>
              <div>
                <span className="text-zinc-400">Total Original:</span> <span className="font-bold text-emerald-400">${parseFloat(ventaSeleccionada.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Seleccione Cantidades a Devolver:</span>
              <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
                {ventaSeleccionada.detalles?.map(det => {
                  const nombre = det.producto ? det.producto.nombre : det.promocion ? det.promocion.nombre : 'Ítem';
                  const cantOrig = parseFloat(det.cantidad);
                  return (
                    <div key={det.id} className="p-3 flex items-center justify-between gap-4 font-mono text-xs">
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-200">{nombre}</div>
                        <div className="text-[11px] text-zinc-500">
                          Original: {cantOrig} uds/kg x ${parseFloat(det.precio_unitario).toFixed(2)} = ${parseFloat(det.subtotal).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-zinc-400">Devolver:</label>
                        <input
                          type="number"
                          step={det.producto && det.producto.tipo_venta === 'PESABLE' ? "0.001" : "1"}
                          min="0"
                          max={cantOrig}
                          value={itemsDevolucion[det.id] || 0}
                          onChange={(e) => setItemsDevolucion({ ...itemsDevolucion, [det.id]: e.target.value })}
                          className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-emerald-400 font-bold input-focus"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo de la Devolución</label>
              <input
                type="text"
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Producto fallado, error en cobranza, cambio de opinión..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs input-focus"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setVentaSeleccionada(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary bg-amber-600 hover:bg-amber-500">
                <RotateCcw className="w-4 h-4" />
                <span>Confirmar Devolución</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historial Devoluciones */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 font-semibold text-xs text-zinc-300 uppercase tracking-wider">
          Historial Reciente de Devoluciones
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
              <tr>
                <th className="p-3.5">ID Dev</th>
                <th className="p-3.5">Venta ID</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Autorizado Por</th>
                <th className="p-3.5">Motivo</th>
                <th className="p-3.5 text-right">Monto Devuelto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {devolucionesRecientes.map(dev => (
                <tr key={dev.id} className="hover:bg-zinc-800/40">
                  <td className="p-3.5 text-amber-400 font-bold">#{dev.id}</td>
                  <td className="p-3.5">#{dev.venta_id}</td>
                  <td className="p-3.5 text-zinc-400">{new Date(dev.fecha).toLocaleString('es-AR')}</td>
                  <td className="p-3.5 text-zinc-200">{dev.usuario?.nombre}</td>
                  <td className="p-3.5 text-zinc-400 font-sans">{dev.motivo}</td>
                  <td className="p-3.5 text-right font-bold text-rose-400">${parseFloat(dev.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
