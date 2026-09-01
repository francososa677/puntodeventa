import React, { useEffect } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function TicketModal({ ventaResult, cartItems, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ventaResult) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-100">¡Venta Registrada!</h2>
          <p className="text-xs text-zinc-400 font-mono">Comprobante #{ventaResult.ventaId}</p>
        </div>

        {/* Formato de Ticket */}
        <div id="printable-ticket" className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg font-mono text-xs text-zinc-300 space-y-3 mb-5">
          <div className="text-center border-b border-dashed border-zinc-800 pb-2">
            <div className="font-bold text-sm text-zinc-100 uppercase">ALMACÉN DE BARRIO</div>
            <div className="text-[10px] text-zinc-500">Ticket de Venta</div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Fecha: {new Date().toLocaleString('es-AR')}
            </div>
            <div className="text-[10px] text-zinc-500">
              Caja #{ventaResult.cajaId} • Medio: {ventaResult.medioPago}
            </div>
          </div>

          <div className="space-y-1.5 border-b border-dashed border-zinc-800 pb-3">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <div>{item.nombre}</div>
                  <div className="text-[10px] text-zinc-500">
                    {item.tipo === 'PRODUCTO_PESABLE'
                      ? `${item.cantidad} kg x $${item.precio}/kg`
                      : `${item.cantidad} x $${item.precio}`}
                  </div>
                </div>
                <div className="font-bold text-zinc-200">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-emerald-400 pt-1">
            <span>TOTAL:</span>
            <span>${ventaResult.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-dashed border-zinc-800">
            ¡Gracias por su compra!
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Siguiente Venta (Enter ⏎)
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex-1"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
