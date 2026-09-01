import React, { useState } from 'react';
import api from '../services/api';
import { Upload, CheckCircle2, AlertCircle, Download, X, HelpCircle, Loader2 } from 'lucide-react';

export default function ImportCsvModal({ onClose, onSuccess }) {
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleCsvTemplate = `codigo_barras,nombre,precio,stock_actual,stock_minimo,stock_maximo,tipo_venta
7790895000997,Coca Cola 1.5L,2200,50,10,100,UNITARIO
7790040000010,Chocolinas 250g,1100,40,5,80,UNITARIO
201,Queso Muzzarella,7900,12.5,2,30,PESABLE`;

  const parseCsvContent = (content) => {
    setErrorMsg('');
    setSuccessMsg('');
    setProgressMsg('');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedData([]);
      return;
    }

    // Detect delimiter (, or ; or \t)
    const sampleLine = lines[0];
    let delimiter = ',';
    if (sampleLine.includes(';') && !sampleLine.includes(',')) delimiter = ';';
    else if (sampleLine.includes('\t')) delimiter = '\t';

    const parseLine = (line) => line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

    const firstRow = parseLine(lines[0]);
    const lowerFirstRow = firstRow.map(c => c.toLowerCase());

    // Flexible Header Column Finder
    const findIndex = (keywords) => {
      return lowerFirstRow.findIndex(col => keywords.some(kw => col.includes(kw)));
    };

    const codeIdx = findIndex(['codigo', 'barras', 'ean', 'barcode', 'sku', 'code']);
    const nameIdx = findIndex(['nombre', 'descripcion', 'producto', 'item', 'title', 'name']);
    const priceIdx = findIndex(['precio', 'monto', 'costo', 'price', 'val']);
    const stockIdx = findIndex(['stock_actual', 'stock', 'cantidad', 'cant', 'qty']);
    const minIdx = findIndex(['minimo', 'min']);
    const maxIdx = findIndex(['maximo', 'max']);
    const tipoIdx = findIndex(['tipo', 'unidad', 'venta', 'type']);

    const hasHeader = codeIdx !== -1 || nameIdx !== -1 || priceIdx !== -1;
    const startIdx = hasHeader ? 1 : 0;

    const items = [];

    for (let i = startIdx; i < lines.length; i++) {
      const parts = parseLine(lines[i]);
      if (parts.length < 2) continue;

      let code = '';
      let nombre = '';
      let precio = 0;
      let stock_actual = 0;
      let stock_minimo = 0;
      let stock_maximo = 100;
      let tipo_venta = 'UNITARIO';

      if (hasHeader) {
        code = codeIdx !== -1 ? parts[codeIdx] : parts[0];
        nombre = nameIdx !== -1 ? parts[nameIdx] : parts[1];
        precio = priceIdx !== -1 ? parseFloat(parts[priceIdx]) || 0 : (parseFloat(parts[2]) || 0);
        stock_actual = stockIdx !== -1 ? parseFloat(parts[stockIdx]) || 0 : (parseFloat(parts[3]) || 0);
        stock_minimo = minIdx !== -1 ? parseFloat(parts[minIdx]) || 0 : (parseFloat(parts[4]) || 0);
        stock_maximo = maxIdx !== -1 ? parseFloat(parts[maxIdx]) || 100 : (parseFloat(parts[5]) || 100);
        
        const rawTipo = tipoIdx !== -1 ? parts[tipoIdx] : (parts[6] || '');
        tipo_venta = (rawTipo || '').toUpperCase().includes('PES') || (rawTipo || '').toUpperCase().includes('KILO') ? 'PESABLE' : 'UNITARIO';
      } else {
        code = parts[0];
        nombre = parts[1];
        precio = parseFloat(parts[2]) || 0;
        stock_actual = parseFloat(parts[3]) || 0;
        stock_minimo = parseFloat(parts[4]) || 0;
        stock_maximo = parseFloat(parts[5]) || 100;
        tipo_venta = (parts[6] || '').toUpperCase().includes('PES') ? 'PESABLE' : 'UNITARIO';
      }

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
      setProgressMsg('');

      const CHUNK_SIZE = 1000;
      let totalCreados = 0;
      let totalActualizados = 0;

      for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
        const chunk = parsedData.slice(i, i + CHUNK_SIZE);
        const currentCount = Math.min(i + CHUNK_SIZE, parsedData.length);
        setProgressMsg(`Procesando ${currentCount.toLocaleString()} de ${parsedData.length.toLocaleString()} productos...`);

        const res = await api.post('/productos/importar', chunk);
        if (res.data.data) {
          totalCreados += res.data.data.creados || 0;
          totalActualizados += res.data.data.actualizados || 0;
        }
      }

      setSuccessMsg(`¡Importación completada con éxito! ${totalCreados} creados, ${totalActualizados} actualizados.`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al importar productos masivamente');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">Importación Masiva de Productos (CSV / Excel)</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-zinc-500 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <HelpCircle className="w-4 h-4" />
              <span>Detección Flexible de Archivos:</span>
            </div>
            <p className="text-zinc-400">
              Soporta separadores por coma (<code className="text-emerald-400">,</code>), punto y coma (<code className="text-emerald-400">;</code>) o tabulaciones. Detecta automáticamente nombres de columnas como <em>código, nombre, precio, stock</em> en cualquier orden.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {progressMsg && (
            <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl flex items-center gap-2 text-indigo-300 text-xs animate-pulse">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-indigo-400" />
              <span>{progressMsg}</span>
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
                Seleccionar archivo CSV o TXT
              </label>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Load Sample Button */}
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={loading}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cargar Ejemplo Básicos</span>
              </button>
            </div>
          </div>

          {/* Textarea for CSV */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              O pegar contenido CSV directo:
            </label>
            <textarea
              rows={5}
              value={csvText}
              disabled={loading}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="codigo_barras,nombre,precio,stock_actual..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 input-focus disabled:opacity-50"
            />
          </div>

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Vista Previa de Productos Detectados ({parsedData.length.toLocaleString()}):
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
            disabled={loading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={loading || parsedData.length === 0}
            className="btn-primary px-6 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>{loading ? 'Procesando...' : `Importar ${parsedData.length.toLocaleString()} Productos`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
