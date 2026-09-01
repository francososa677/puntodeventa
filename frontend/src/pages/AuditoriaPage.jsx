import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Filter, Search } from 'lucide-react';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [modulo, setModulo] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarLogs = async () => {
    try {
      setLoading(true);
      const url = modulo ? `/auditoria?modulo=${modulo}` : '/auditoria';
      const res = await api.get(url);
      if (res.data.success) setLogs(res.data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, [modulo]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Registro de Auditoría de Sistema</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Bitácora inalterable de operaciones críticas e intervenciones</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={modulo}
            onChange={(e) => setModulo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-100 text-xs font-mono input-focus"
          >
            <option value="">Todos los módulos</option>
            <option value="VENTA">VENTA</option>
            <option value="STOCK">STOCK</option>
            <option value="CAJA">CAJA</option>
            <option value="DEVOLUCION">DEVOLUCION</option>
            <option value="USUARIOS">USUARIOS</option>
            <option value="PRODUCTO">PRODUCTO</option>
            <option value="MEDIO_PAGO">MEDIO_PAGO</option>
            <option value="AUTH">AUTH</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
              <tr>
                <th className="p-3.5">Fecha / Hora</th>
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5">Módulo</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5">Detalle / Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">
                    No hay registros de auditoría para mostrar.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 font-bold text-zinc-200">
                      {log.usuario?.nombre || 'Sistema'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="p-3.5 text-purple-400 font-bold">
                      {log.accion}
                    </td>
                    <td className="p-3.5 text-zinc-300 font-sans">
                      {log.detalle}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
