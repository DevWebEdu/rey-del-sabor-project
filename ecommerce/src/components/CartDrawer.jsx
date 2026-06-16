import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight, Bike, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';

const DELIVERY_FREE_AT = 50;
const DELIVERY_COST    = 5;

function ItemRow({ item, dispatch }) {
  const lineTotal = item.price * item.qty;

  const extras = [];
  if (item.sauces) {
    const SAUCE_LABELS = { ketchup: 'Ketchup', mayonesa: 'Mayo', ajiPollero: 'Ají Pollero' };
    Object.entries(item.sauces).filter(([, v]) => v > 0).forEach(([k, v]) => {
      extras.push(`${SAUCE_LABELS[k] || k} ×${v}`);
    });
  }
  if (item.presaQtys) {
    if (item.presaQtys.pecho  > 0) extras.push(`${item.presaQtys.pecho}× Pecho`);
    if (item.presaQtys.pierna > 0) extras.push(`${item.presaQtys.pierna}× Pierna`);
  }
  if (item.gaseosaFlavor) extras.push(item.gaseosaFlavor === 'inca_kola' ? 'Inca Kola' : 'Coca Cola');
  (item.complementos || []).forEach(c => extras.push(`${c.qty}× ${c.nombre}`));
  (item.bebidas     || []).forEach(b => extras.push(`${b.qty}× ${b.nombre}`));

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-50" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-2xl">🍗</div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</p>
        {extras.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{extras.join(' · ')}</p>
        )}
        <p className="text-orange-500 font-bold text-sm mt-1">S/ {lineTotal.toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <button
          onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty + 1 })}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all active:scale-90"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
        <span className="font-bold text-gray-900 text-sm">{item.qty}</span>
        <button
          onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty - 1 })}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
        >
          {item.qty === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} />}
        </button>
      </div>
    </div>
  );
}

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { items, total, count, dispatch } = useCart();
  const deliveryCost = total >= DELIVERY_FREE_AT ? 0 : DELIVERY_COST;
  const grandTotal   = total + deliveryCost;
  const pct          = Math.min((total / DELIVERY_FREE_AT) * 100, 100);
  const remaining    = Math.max(DELIVERY_FREE_AT - total, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm bg-white z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
            <ShoppingCart size={16} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-base leading-none">Mi Pedido</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {count === 0 ? 'Sin productos' : `${count} producto${count !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Progreso delivery gratis ── */}
        {total > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Bike size={12} className="text-orange-500" />
                {deliveryCost === 0
                  ? <span className="font-semibold text-green-600">¡Delivery gratis!</span>
                  : <span>Falta <strong>S/ {remaining.toFixed(2)}</strong> para delivery gratis</span>
                }
              </div>
              <span className="text-gray-400">{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Items ── */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={24} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Tu pedido está vacío</p>
              <p className="text-sm text-gray-400 mb-5">Agrega productos desde el menú</p>
              <button
                onClick={onClose}
                className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                Ver el menú →
              </button>
            </div>
          ) : (
            <div className="py-2">
              {items.map(item => (
                <ItemRow key={item.id} item={item} dispatch={dispatch} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 pt-4 pb-5 space-y-3 shrink-0">
            {/* Desglose */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <div className="flex items-center gap-1">
                  <Bike size={12} />
                  <span>Delivery</span>
                </div>
                {deliveryCost === 0 ? (
                  <span className="text-green-500 font-semibold flex items-center gap-1">
                    <Gift size={11} /> Gratis
                  </span>
                ) : (
                  <span>S/ {DELIVERY_COST.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
                <span>Total</span>
                <span>S/ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-[15px]"
            >
              Confirmar Pedido
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
