import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useCaja } from '../context/CajaContext';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Scale,
  Sparkles,
  ShoppingBag,
  Vault
} from 'lucide-react';
import PesableModal from '../components/PesableModal';
import TicketModal from '../components/TicketModal';
import AbrirCajaModal from '../components/AbrirCajaModal';
import QuickCreateProductModal from '../components/QuickCreateProductModal';

export default function VentasPage() {
  const { cajaAbierta, estadoCaja } = useCaja();

  const [searchTerm, setSearchTerm] = useState('');
  const [allCatalogItems, setAllCatalogItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [selectedMedioPagoId, setSelectedMedioPagoId] = useState('');

  const [pesableProductToEdit, setPesableProductToEdit] = useState(null);
  const [pesableInitialQty, setPesableInitialQty] = useState(null);
  const [ticketResult, setTicketResult] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState(null);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);

  const searchInputRef = useRef(null);

  // Load Active Payment Methods
  useEffect(() => {
    api.get('/medios-pago?activos=true')
      .then(res => {
        if (res.data.success) {
          setMediosPago(res.data.medios);
          if (res.data.medios.length > 0) {
            setSelectedMedioPagoId(res.data.medios[0].id.toString());
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Load full catalog (products ordered by popularity + promotions)
  const cargarCatalogoCompleto = async () => {
    try {
      const [resProd, resPromo] = await Promise.all([
        api.get('/productos?activo=true&orderBy=popular'),
        api.get('/promociones?activa=true')
      ]);

      const prods = resProd.data.success ? resProd.data.productos.map(p => ({ ...p, isPromo: false })) : [];
      const promos = resPromo.data.success ? resPromo.data.promociones.map(p => ({
        id: `promo_${p.id}`,
        realPromoId: p.id,
        nombre: `[PROMO] ${p.nombre}`,
        codigo_barras: p.codigo_barras,
        precio: parseFloat(p.precio_promocional),
        stock_actual: 'Combo',
        tipo_venta: 'COMBO',
        isPromo: true,
        rawPromo: p
      })) : [];

      setAllCatalogItems([...prods, ...promos]);
    } catch (e) {
      console.error('Error cargando catálogo:', e);
    }
  };

  useEffect(() => {
    cargarCatalogoCompleto();
  }, [ticketResult]);

  // Compute displayed filtered items
  const displayedItems = searchTerm.trim()
    ? allCatalogItems.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo_barras.includes(searchTerm.trim())
      )
    : allCatalogItems;

  // Reset selectedIndex when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Keep search input focused for barcode reader scanner
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [cartItems, ticketResult]);

  // Handle arrow key navigation in catalog grid
  const handleKeyDown = (e) => {
    if (displayedItems.length === 0) return;

    const cols = 3;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % displayedItems.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + displayedItems.length) % displayedItems.length);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + cols < displayedItems.length ? prev + cols : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - cols >= 0 ? prev - cols : prev));
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  };

  const addSearchResultToCart = (item) => {
    if (item.isPromo) {
      addPromocionToCart(item.rawPromo);
    } else {
      addProductoToCart(item);
    }
  };

  // Handle direct barcode scanner Enter key press or search button submit
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Fast-checkout: If search input is empty when Enter is pressed, trigger checkout
    if (!searchTerm.trim()) {
      if (cartItems.length > 0 && !loadingCheckout && !ticketResult) {
        handleCheckout();
      }
      return;
    }

    const code = searchTerm.trim();

    try {
      // 1. If instant search results exist in state, check for exact barcode match first
      let selectedItem = displayedItems.find(p => p.codigo_barras === code);
      
      // 2. If no exact barcode match, pick currently highlighted item in grid (selectedIndex)
      if (!selectedItem && displayedItems.length > 0) {
        const validIdx = selectedIndex >= 0 && selectedIndex < displayedItems.length ? selectedIndex : 0;
        selectedItem = displayedItems[validIdx];
      }

      if (selectedItem) {
        addSearchResultToCart(selectedItem);
        setSearchTerm('');
        setSelectedIndex(0);
        return;
      }

      // 3. If grid was empty, query backend search endpoint directly
      const resProd = await api.get(`/productos?search=${encodeURIComponent(code)}&activo=true`);
      if (resProd.data.success && resProd.data.productos.length > 0) {
        const exactMatch = resProd.data.productos.find(p => p.codigo_barras === code);
        const prodToAdd = exactMatch || resProd.data.productos[0];
        addProductoToCart(prodToAdd);
        setSearchTerm('');
        setSelectedIndex(0);
        return;
      }

      // 4. Check promotions search
      const resPromo = await api.get(`/promociones?search=${encodeURIComponent(code)}&activa=true`);
      if (resPromo.data.success && resPromo.data.promociones.length > 0) {
        const exactPromo = resPromo.data.promociones.find(p => p.codigo_barras === code);
        const promoToAdd = exactPromo || resPromo.data.promociones[0];
        addPromocionToCart(promoToAdd);
        setSearchTerm('');
        setSelectedIndex(0);
        return;
      }

      setErrorMsg(`El código de barras "${code}" no está registrado.`);
      setUnregisteredBarcode(code);
    } catch (err) {
      setErrorMsg(`Error al buscar producto: ${err.message}`);
    }
  };

  const addProductoToCart = (producto, customQtyKg = null) => {
    if (producto.tipo_venta === 'PESABLE' && customQtyKg === null) {
      // Open modal to calculate Importe ↔ kg
      setPesableProductToEdit(producto);
      setPesableInitialQty(null);
      return;
    }

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.productoId === producto.id && item.tipo !== 'PROMOCION');
      if (existingIdx >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const addedQty = producto.tipo_venta === 'PESABLE' ? customQtyKg : 1;
            const newQty = producto.tipo_venta === 'PESABLE'
              ? Math.round((item.cantidad + addedQty) * 1000) / 1000
              : item.cantidad + 1;
            return { ...item, cantidad: newQty };
          }
          return item;
        });
      } else {
        return [
          ...prev,
          {
            tipo: producto.tipo_venta === 'PESABLE' ? 'PRODUCTO_PESABLE' : 'PRODUCTO',
            productoId: producto.id,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio),
            cantidad: producto.tipo_venta === 'PESABLE' ? customQtyKg : 1,
            tipo_venta: producto.tipo_venta,
            stock_actual: parseFloat(producto.stock_actual)
          }
        ];
      }
    });

    setSearchTerm('');
  };

  const addPromocionToCart = (promocion) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.tipo === 'PROMOCION' && item.promocionId === promocion.id);
      if (existingIdx >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            return { ...item, cantidad: item.cantidad + 1 };
          }
          return item;
        });
      } else {
        return [
          ...prev,
          {
            tipo: 'PROMOCION',
            promocionId: promocion.id,
            nombre: `[PROMO] ${promocion.nombre}`,
            precio: parseFloat(promocion.precio_promocional),
            cantidad: 1,
            componentes: promocion.componentes
          }
        ];
      }
    });

    setSearchTerm('');
  };

  const updateQuantity = (index, delta) => {
    setCartItems(prev => {
      const item = prev[index];
      if (!item) return prev;

      if (item.tipo_venta === 'PESABLE') {
        // Re-open Pesable modal
        setPesableProductToEdit({ id: item.productoId, nombre: item.nombre, precio: item.precio, tipo_venta: 'PESABLE' });
        setPesableInitialQty(item.cantidad);
        return prev;
      } else {
        const newQty = item.cantidad + delta;
        if (newQty <= 0) {
          return prev.filter((_, i) => i !== index);
        } else {
          return prev.map((it, i) => i === index ? { ...it, cantidad: newQty } : it);
        }
      }
    });
  };

  const removeItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  };

  const handleCheckout = async () => {
    setErrorMsg('');

    if (!cajaAbierta) {
      setErrorMsg('Debe abrir una caja antes de cobrar.');
      setShowAbrirCajaModal(true);
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Agregue al menos un producto al carrito');
      return;
    }

    if (!selectedMedioPagoId) {
      setErrorMsg('Seleccione un medio de pago');
      return;
    }

    const payload = {
      medioPagoId: parseInt(selectedMedioPagoId),
      items: cartItems.map(item => {
        if (item.tipo === 'PRODUCTO' || item.tipo === 'PRODUCTO_PESABLE') {
          return {
            tipo: item.tipo,
            productoId: item.productoId,
            cantidad: item.cantidad
          };
        } else {
          return {
            tipo: 'PROMOCION',
            promocionId: item.promocionId,
            cantidad: item.cantidad
          };
        }
      })
    };

    try {
      setLoadingCheckout(true);
      const res = await api.post('/ventas', payload);
      if (res.data.success) {
        setTicketResult(res.data);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && data.error === 'STOCK_INSUFICIENTE') {
        setErrorMsg(`Stock insuficiente: ${data.producto || ''} (Disponible: ${data.stockDisponible || 0})`);
      } else {
        setErrorMsg(data?.message || 'Error al procesar la venta');
      }
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleNextSale = () => {
    setCartItems([]);
    setTicketResult(null);
  };

  const totalVenta = calculateTotal();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Caja status alert banner if closed */}
      {!cajaAbierta && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">No hay caja abierta registrada</h3>
              <p className="text-xs text-amber-400/80">Debe abrir el turno de caja antes de procesar cobros.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAbrirCajaModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg shadow-lg transition-colors whitespace-nowrap"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center justify-between gap-2 text-rose-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            {unregisteredBarcode && (
              <button
                type="button"
                onClick={() => setShowQuickCreateModal(true)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                + Registrar Producto Ahora
              </button>
            )}
            <button onClick={() => { setErrorMsg(''); setUnregisteredBarcode(null); }} className="text-rose-400 font-bold hover:text-white px-1">✕</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Barcode / Search Input (Section 13.1) */}
          <div className="glass-panel p-4 rounded-xl shadow-lg relative z-20">
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Barcode className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escanee código de barras o busque por nombre (Flechas ⬆⬇⬅➡ + Enter)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-500 text-sm font-medium input-focus shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Visual Rectangular Product Cards Grid */}
          <div className="glass-panel p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Catálogo de Productos {searchTerm.trim() ? `(Filtrado: ${displayedItems.length})` : `(${displayedItems.length})`}</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Ordenado por más vendidos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1 font-sans">
              {displayedItems.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-xs">
                  No se encontraron productos para "{searchTerm}".
                </div>
              ) : (
                displayedItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;

                  let pct = 100;
                  let isLowStock = false;
                  let isOutOfStock = false;
                  let barColorClass = 'bg-emerald-500 shadow-emerald-500/50';
                  let stockLabel = '';

                  if (!item.isPromo) {
                    const stkActual = parseFloat(item.stock_actual) || 0;
                    const stkMax = parseFloat(item.stock_maximo) || 100;
                    const stkMin = parseFloat(item.stock_minimo) || 0;

                    pct = Math.min(100, Math.max(0, (stkActual / stkMax) * 100));
                    isOutOfStock = stkActual <= 0;
                    isLowStock = stkActual <= stkMin || pct < 20;

                    if (isOutOfStock) {
                      barColorClass = 'bg-zinc-700';
                      stockLabel = 'Sin stock';
                    } else if (isLowStock) {
                      barColorClass = 'bg-rose-500 shadow-rose-500/50';
                      stockLabel = `${stkActual} ${item.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}`;
                    } else if (pct <= 50) {
                      barColorClass = 'bg-amber-500 shadow-amber-500/50';
                      stockLabel = `${stkActual} ${item.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}`;
                    } else {
                      barColorClass = 'bg-emerald-500 shadow-emerald-500/50';
                      stockLabel = `${stkActual} ${item.tipo_venta === 'PESABLE' ? 'kg' : 'uds'}`;
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => addSearchResultToCart(item)}
                      className={`glass-panel p-3 rounded-xl transition-all cursor-pointer flex flex-col justify-between relative group border ${
                        isSelected
                          ? 'border-emerald-400 bg-zinc-800/90 shadow-xl scale-[1.02] z-10'
                          : 'border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        {/* Badges */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          {item.isPromo ? (
                            <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> COMBO
                            </span>
                          ) : item.tipo_venta === 'PESABLE' ? (
                            <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                              <Scale className="w-2.5 h-2.5" /> PESABLE
                            </span>
                          ) : (
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                              UNITARIO
                            </span>
                          )}

                          {isSelected && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-mono font-bold">
                              ⏎ Enter
                            </span>
                          )}
                        </div>

                        {/* Title & Code */}
                        <h3 className="text-xs font-bold text-zinc-100 line-clamp-2 leading-tight mb-1 group-hover:text-emerald-300 transition-colors">
                          {item.nombre}
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 mb-2">Cód: {item.codigo_barras}</p>
                      </div>

                      <div>
                        {/* Price */}
                        <div className="text-xs font-bold text-emerald-400 font-mono mb-2">
                          ${parseFloat(item.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          {item.tipo_venta === 'PESABLE' && <span className="text-[9px] text-zinc-400 font-normal"> /kg</span>}
                        </div>

                        {/* Visual Stock Bar */}
                        {!item.isPromo && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                              <span>Stock: {stockLabel}</span>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-full h-2 p-0.5 border border-zinc-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Detalle de Venta & Cobro (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[500px]">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Detalle de Venta</h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs">El carrito está vacío.</p>
                <p className="text-[11px] text-zinc-600">Escanee un código de barras o seleccione un producto del catálogo.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 truncate">{item.nombre}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {item.tipo_venta === 'PESABLE' ? (
                          <span className="text-sky-300 font-bold">{item.cantidad} kg x ${item.precio}/kg</span>
                        ) : (
                          <span>${item.precio.toFixed(2)} c/u</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      {item.tipo_venta === 'PESABLE' ? (
                        <button
                          onClick={() => updateQuantity(idx, 0)}
                          className="px-2 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-500/30 text-sky-300 rounded-lg text-xs font-mono transition-colors"
                        >
                          Modificar kg
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateQuantity(idx, -1)}
                            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-bold text-zinc-100">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, 1)}
                            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => removeItem(idx)}
                        className="w-6 h-6 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right font-mono text-xs font-bold text-emerald-400 w-16">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total & Checkout Section */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-4 mt-4">
            
            {/* Payment Method Selector (Section 13.3) */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Medio de Pago</span>
              </label>
              <select
                value={selectedMedioPagoId}
                onChange={(e) => setSelectedMedioPagoId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs font-medium input-focus cursor-pointer"
              >
                {mediosPago.map(mp => (
                  <option key={mp.id} value={mp.id}>
                    {mp.nombre} {mp.es_efectivo ? '(Efectivo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Total display */}
            <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total General:</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Prominent High-Contrast COBRAR Button (Section 22.3) */}
            <button
              onClick={handleCheckout}
              disabled={loadingCheckout || cartItems.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingCheckout ? 'Procesando Venta...' : 'COBRAR (Confirmar Venta)'}
            </button>

          </div>

        </div>

      </div>

      {/* Modales */}
      {pesableProductToEdit && (
        <PesableModal
          producto={pesableProductToEdit}
          initialQtyKg={pesableInitialQty}
          onConfirm={(kg) => {
            addProductoToCart(pesableProductToEdit, kg);
            setPesableProductToEdit(null);
          }}
          onClose={() => setPesableProductToEdit(null)}
        />
      )}

      {ticketResult && (
        <TicketModal
          ventaResult={ticketResult}
          cartItems={cartItems}
          onClose={handleNextSale}
        />
      )}

      {showAbrirCajaModal && (
        <AbrirCajaModal onClose={() => setShowAbrirCajaModal(false)} />
      )}

      {showQuickCreateModal && (
        <QuickCreateProductModal
          scannedBarcode={unregisteredBarcode}
          onClose={() => setShowQuickCreateModal(false)}
          onSuccess={(newProd) => {
            cargarCatalogoCompleto();
            addProductoToCart(newProd);
            setShowQuickCreateModal(false);
            setUnregisteredBarcode(null);
            setErrorMsg('');
          }}
        />
      )}

    </div>
  );
}
