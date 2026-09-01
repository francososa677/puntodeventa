import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  Edit2,
  TrendingUp,
  Sliders,
  Sparkles,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Tag,
  Scale,
  Upload
} from 'lucide-react';
import ImportCsvModal from '../components/ImportCsvModal';

export default function StockPage() {
  const { isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'promociones' | 'movimientos'
  const [productos, setProductos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState('INGRESO'); // 'INGRESO' | 'AJUSTE'
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [stockInputValue, setStockInputValue] = useState('');

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Form states for Product
  const [formDataProd, setFormDataProd] = useState({
    codigo_barras: '',
    nombre: '',
    tipo_venta: 'UNITARIO',
    precio: '',
    stock_actual: '',
    stock_minimo: '',
    stock_maximo: '100'
  });

  // Form states for Promo
  const [formDataPromo, setFormDataPromo] = useState({
    nombre: '',
    codigo_barras: '',
    precio_promocional: '',
    componentes: [{ producto_id: '', cantidad: 1 }]
  });

  const [errorMsg, setErrorMsg] = useState('');

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos');
      if (res.data.success) setProductos(res.data.productos);
    } catch (e) {
      console.error(e);
    }
  };

  const cargarPromociones = async () => {
    try {
      const res = await api.get('/promociones');
      if (res.data.success) setPromociones(res.data.promociones);
    } catch (e) {
      console.error(e);
    }
  };

  const cargarMovimientos = async () => {
    try {
      const res = await api.get('/stock/movimientos');
      if (res.data.success) setMovimientos(res.data.movimientos);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([cargarProductos(), cargarPromociones(), cargarMovimientos()])
      .finally(() => setLoading(false));
  }, []);

  const handleOpenProductModal = (prod = null) => {
    setErrorMsg('');
    if (prod) {
      setEditingProduct(prod);
      setFormDataProd({
        codigo_barras: prod.codigo_barras,
        nombre: prod.nombre,
        tipo_venta: prod.tipo_venta,
        precio: prod.precio.toString(),
        stock_actual: prod.stock_actual.toString(),
        stock_minimo: prod.stock_minimo.toString(),
        stock_maximo: (prod.stock_maximo || 100).toString()
      });
    } else {
      setEditingProduct(null);
      setFormDataProd({
        codigo_barras: '',
        nombre: '',
        tipo_venta: 'UNITARIO',
        precio: '',
        stock_actual: '0',
        stock_minimo: '0',
        stock_maximo: '100'
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingProduct) {
        await api.put(`/productos/${editingProduct.id}`, formDataProd);
      } else {
        await api.post('/productos', formDataProd);
      }
      setShowProductModal(false);
      cargarProductos();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar el producto');
    }
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (stockModalType === 'INGRESO') {
        await api.post('/stock/ingreso', {
          productoId: selectedProductForStock.id,
          cantidad: parseFloat(stockInputValue)
        });
      } else {
        await api.post('/stock/ajuste', {
          productoId: selectedProductForStock.id,
          nuevoStock: parseFloat(stockInputValue)
        });
      }
      setShowStockModal(false);
      cargarProductos();
      cargarMovimientos();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar movimiento de stock');
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingPromo) {
        await api.put(`/promociones/${editingPromo.id}`, formDataPromo);
      } else {
        await api.post('/promociones', formDataPromo);
      }
      setShowPromoModal(false);
      cargarPromociones();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar la promoción');
    }
  };

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_barras.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Gestión de Stock y Catálogo</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Administre productos, promociones e historial de existencias</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('productos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'productos'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('promociones')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'promociones'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Promociones (Combos)
          </button>
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'movimientos'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Movimientos
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCTOS */}
      {activeTab === 'productos' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-zinc-100 text-xs input-focus"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(true)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Importar CSV / Masivo</span>
                </button>

                <button
                  onClick={() => handleOpenProductModal()}
                  className="btn-primary w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">Código</th>
                    <th className="p-3.5">Nombre</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5 text-right">Precio</th>
                    <th className="p-3.5 text-right">Stock Actual</th>
                    <th className="p-3.5 text-right">Stock Mínimo</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredProductos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">
                        No hay productos registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredProductos.map(prod => {
                      const stockBajo = parseFloat(prod.stock_actual) <= parseFloat(prod.stock_minimo);
                      return (
                        <tr key={prod.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-zinc-400 font-semibold">{prod.codigo_barras}</td>
                          <td className="p-3.5 font-medium text-zinc-100">{prod.nombre}</td>
                          <td className="p-3.5">
                            {prod.tipo_venta === 'PESABLE' ? (
                              <span className="inline-flex items-center gap-1 bg-sky-950/80 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono text-[10px]">
                                <Scale className="w-3 h-3" /> PESABLE (kg)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                                UNITARIO
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                            ${parseFloat(prod.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            {prod.tipo_venta === 'PESABLE' && <span className="text-[10px] text-zinc-500 font-normal"> /kg</span>}
                          </td>
                          <td className={`p-3.5 text-right font-mono font-bold ${stockBajo ? 'text-rose-400' : 'text-zinc-200'}`}>
                            <div className="flex items-center justify-end gap-1.5">
                              {stockBajo && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" title="Stock por debajo del mínimo" />}
                              <span>{parseFloat(prod.stock_actual)} {prod.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono text-zinc-400">
                            {parseFloat(prod.stock_minimo)} {prod.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedProductForStock(prod);
                                      setStockModalType('INGRESO');
                                      setStockInputValue('');
                                      setShowStockModal(true);
                                    }}
                                    className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors"
                                    title="Ingreso de Stock"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedProductForStock(prod);
                                      setStockModalType('AJUSTE');
                                      setStockInputValue(prod.stock_actual.toString());
                                      setShowStockModal(true);
                                    }}
                                    className="p-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-500/30 text-amber-300 rounded-lg transition-colors"
                                    title="Ajuste de Stock"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleOpenProductModal(prod)}
                                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                                    title="Editar Producto"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PROMOCIONES (Section 12.2) */}
      {activeTab === 'promociones' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400">Combos de productos unitarios vendidos bajo un código de barras propio.</p>
            {isAdmin && (
              <button
                onClick={() => {
                  setErrorMsg('');
                  setEditingPromo(null);
                  setFormDataPromo({
                    nombre: '',
                    codigo_barras: '',
                    precio_promocional: '',
                    componentes: [{ producto_id: productos[0]?.id || '', cantidad: 1 }]
                  });
                  setShowPromoModal(true);
                }}
                className="btn-primary"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nueva Promoción</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promociones.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-xs">
                No hay promociones configuradas.
              </div>
            ) : (
              promociones.map(promo => (
                <div key={promo.id} className="glass-panel rounded-xl p-4 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-medium">
                        Promo Combo
                      </span>
                      <h3 className="text-sm font-bold text-zinc-100 mt-1">{promo.nombre}</h3>
                      <p className="text-xs font-mono text-zinc-400">Cód: {promo.codigo_barras}</p>
                    </div>
                    <div className="text-right font-mono text-lg font-bold text-emerald-400">
                      ${parseFloat(promo.precio_promocional).toFixed(2)}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-2 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Componentes:</span>
                    {promo.componentes?.map((c, i) => (
                      <div key={i} className="text-xs text-zinc-300 flex justify-between font-mono">
                        <span>• {c.producto?.nombre || 'Producto'}</span>
                        <span className="text-zinc-500">x{c.cantidad} uds</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MOVIMIENTOS */}
      {activeTab === 'movimientos' && (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Producto</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-right">Cantidad</th>
                  <th className="p-3.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {movimientos.map(mov => (
                  <tr key={mov.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-zinc-400">{new Date(mov.fecha).toLocaleString('es-AR')}</td>
                    <td className="p-3.5 font-medium text-zinc-100">{mov.producto?.nombre}</td>
                    <td className="p-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        mov.tipo === 'VENTA' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        mov.tipo === 'INGRESO' ? 'bg-sky-950 text-sky-400 border border-sky-500/30' :
                        mov.tipo === 'DEVOLUCION' ? 'bg-purple-950 text-purple-400 border border-purple-500/30' :
                        'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      {parseFloat(mov.cantidad) > 0 ? `+${parseFloat(mov.cantidad)}` : parseFloat(mov.cantidad)}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{mov.usuario?.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Producto */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-zinc-100 mb-4">
              {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Venta</label>
                <select
                  value={formDataProd.tipo_venta}
                  onChange={(e) => setFormDataProd({ ...formDataProd, tipo_venta: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                >
                  <option value="UNITARIO">UNITARIO (Por unidad)</option>
                  <option value="PESABLE">PESABLE (Por kilogramo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Código de Barras / Interno corto
                </label>
                <input
                  type="text"
                  required
                  value={formDataProd.codigo_barras}
                  onChange={(e) => setFormDataProd({ ...formDataProd, codigo_barras: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-mono input-focus"
                  placeholder={formDataProd.tipo_venta === 'PESABLE' ? "Ej: 20 (Código corto mostrador)" : "7791234567890"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={formDataProd.nombre}
                  onChange={(e) => setFormDataProd({ ...formDataProd, nombre: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    {formDataProd.tipo_venta === 'PESABLE' ? 'Precio ($/kg)' : 'Precio ($/ud)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formDataProd.precio}
                    onChange={(e) => setFormDataProd({ ...formDataProd, precio: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    step={formDataProd.tipo_venta === 'PESABLE' ? "0.001" : "1"}
                    required
                    value={formDataProd.stock_actual}
                    onChange={(e) => setFormDataProd({ ...formDataProd, stock_actual: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    step={formDataProd.tipo_venta === 'PESABLE' ? "0.001" : "1"}
                    required
                    value={formDataProd.stock_minimo}
                    onChange={(e) => setFormDataProd({ ...formDataProd, stock_minimo: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1" title="Capacidad total para la barra de nivel 100%">
                    Stock Máx. (Capacidad 100%)
                  </label>
                  <input
                    type="number"
                    step={formDataProd.tipo_venta === 'PESABLE' ? "0.001" : "1"}
                    required
                    value={formDataProd.stock_maximo}
                    onChange={(e) => setFormDataProd({ ...formDataProd, stock_maximo: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus"
                    placeholder="100 por defecto"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ingreso/Ajuste Stock */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-zinc-100 mb-2">
              {stockModalType === 'INGRESO' ? 'Ingreso de Stock' : 'Ajuste de Stock'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mb-4">{selectedProductForStock.nombre}</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  {stockModalType === 'INGRESO'
                    ? `Cantidad a Ingresar (${selectedProductForStock.tipo_venta === 'PESABLE' ? 'kg' : 'unidades'})`
                    : `Nuevo Stock Total (${selectedProductForStock.tipo_venta === 'PESABLE' ? 'kg' : 'unidades'})`}
                </label>
                <input
                  type="number"
                  step={selectedProductForStock.tipo_venta === 'PESABLE' ? "0.001" : "1"}
                  required
                  autoFocus
                  value={stockInputValue}
                  onChange={(e) => setStockInputValue(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 font-mono text-lg input-focus"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Promoción */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-zinc-100 mb-4">Nueva Promoción (Combo)</h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre de la Promoción</label>
                <input
                  type="text"
                  required
                  value={formDataPromo.nombre}
                  onChange={(e) => setFormDataPromo({ ...formDataPromo, nombre: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                  placeholder="Ej: Combo Merienda"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Código de Barras Propio</label>
                <input
                  type="text"
                  required
                  value={formDataPromo.codigo_barras}
                  onChange={(e) => setFormDataPromo({ ...formDataPromo, codigo_barras: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-mono input-focus"
                  placeholder="Ej: 999000111"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Precio Promocional ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formDataPromo.precio_promocional}
                  onChange={(e) => setFormDataPromo({ ...formDataPromo, precio_promocional: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus"
                />
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <span className="text-xs font-semibold text-zinc-300 block mb-2">Productos Componentes (Solo Unitarios):</span>
                {formDataPromo.componentes.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={comp.producto_id}
                      onChange={(e) => {
                        const updated = [...formDataPromo.componentes];
                        updated[idx].producto_id = e.target.value;
                        setFormDataPromo({ ...formDataPromo, componentes: updated });
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-100 text-xs"
                    >
                      <option value="">Seleccione producto...</option>
                      {productos.filter(p => p.tipo_venta === 'UNITARIO').map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={comp.cantidad}
                      onChange={(e) => {
                        const updated = [...formDataPromo.componentes];
                        updated[idx].cantidad = parseInt(e.target.value) || 1;
                        setFormDataPromo({ ...formDataPromo, componentes: updated });
                      }}
                      className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-100 text-xs font-mono"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormDataPromo({
                    ...formDataPromo,
                    componentes: [...formDataPromo.componentes, { producto_id: '', cantidad: 1 }]
                  })}
                  className="text-xs text-emerald-400 hover:underline mt-1"
                >
                  + Agregar otro componente
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowPromoModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Promoción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportCsvModal && (
        <ImportCsvModal
          onClose={() => setShowImportCsvModal(false)}
          onSuccess={cargarProductos}
        />
      )}

    </div>
  );
}
