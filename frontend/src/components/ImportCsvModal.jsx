import React, { useState } from 'react';
import api from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';

export default function ImportCsvModal({ onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleCsvTemplate = `codigo_barras,nombre,precio,stock_actual,stock_minimo,stock_maximo,tipo_venta
7790895000997,Coca Cola 1.5L,2200,50,10,100,UNITARIO
7790040000010,Chocolinas 250g,1100,40,5,80,UNITARIO
201,Queso Muzzarella,7900,12.5,2,30,PESABLE`;

  const parseCsvContent = (content) => {
    setErrorMsg('');
    setSuccessMsg('');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedData([]);
      return;
    }

    const items = [];
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('codigo') || firstLine.includes('nombre') || firstLine.includes('precio');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) continue;

      const code = parts[0];
      const nombre = parts[1];
      const precio = parseFloat(parts[2]) || 0;
      const stock_actual = parseFloat(parts[3]) || 0;
      const stock_minimo = parseFloat(parts[4]) || 0;
      const stock_maximo = parseFloat(parts[5]) || 100;
      const tipo_venta = (parts[6] || '').toUpperCase() === 'PESABLE' ? 'PESABLE' : 'UNITARIO';

      if (code && nombre) {
        items.push({
          codigo_barras: code,
          nombre,
          precio,
          stock_actual,
          stock_minimo,
          stock_maximo,
          tipo_venta
        });
      }
    }

    setParsedData(items);
  };

  const handleTextChange = (text) => {
    setCsvText(text);
    parseCsvContent(text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvText(sampleCsvTemplate);
    parseCsvContent(sampleCsvTemplate);
  };

  const handleSubmitImport = async () => {
    if (parsedData.length === 0) {
      setErrorMsg('No hay productos válidos para importar en el texto/archivo CSV');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.post('/productos/importar', parsedData);

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al importar productos masivamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">Importación Masiva de Productos (CSV)</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Seleccionar archivo CSV (.csv o .txt)
              </label>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>

            {/* Load Sample Button */}
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cargar Plantilla de Ejemplo</span>
              </button>
            </div>
          </div>

          {/* Textarea for CSV */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              O pegar contenido CSV directo (Columnas: codigo_barras, nombre, precio, stock_actual, stock_minimo, stock_maximo, tipo_venta)
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="codigo_barras,nombre,precio,stock_actual,stock_minimo,stock_maximo,tipo_venta..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 input-focus"
            />
          </div>

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Vista Previa de Productos Detectados ({parsedData.length}):
                </span>
              </div>
              <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="p-2">Código</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Stock</th>
                      <th className="p-2">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {parsedData.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/40">
                        <td className="p-2 font-mono text-zinc-400">{item.codigo_barras}</td>
                        <td className="p-2 font-semibold text-zinc-200">{item.nombre}</td>
                        <td className="p-2 text-right font-mono text-emerald-400">${item.precio}</td>
                        <td className="p-2 text-right font-mono text-zinc-300">{item.stock_actual}</td>
                        <td className="p-2 text-zinc-400 font-mono text-[10px]">{item.tipo_venta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={loading || parsedData.length === 0}
            className="btn-primary px-6 py-2 text-xs font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Importando...' : `Importar ${parsedData.length} Productos`}
          </button>
        </div>

      </div>
    </div>
  );
}
