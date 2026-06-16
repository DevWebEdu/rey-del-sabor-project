import { useState, useEffect, useCallback } from 'react';
import {
  LogOut, RefreshCw, ChevronDown, ChevronUp, MapPin, Phone,
  Clock, Flame, X, CreditCard, Banknote,
  MessageSquare, Package, UtensilsCrossed, Droplets, Wine, Plus,
  CheckCircle2, AlertTriangle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ESTADO_CONFIG = {
  recepcionado: { label: 'Recepcionado', bg: 'bg-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  enviado:      { label: 'En camino',    bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  merma:        { label: 'Merma',        bg: 'bg-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400'    },
  entregado:    { label: 'Entregado',    bg: 'bg-green-500/20',  text: 'text-green-400',  dot: 'bg-green-400'  },
};

function parseDes(descripcion) {
  try { return JSON.parse(descripcion || '{}'); } catch { return {}; }
}

// ── Modal vista amigable de descripción ───────────────────────────
function DescripcionModal({ order, onClose }) {
  const d = parseDes(order.descripcion);

  const subtotal     = (d.items || []).reduce((s, i) => s + i.price * i.qty, 0);
  const pagoEfectivo = d.pago_efectivo;
  const vuelto       = pagoEfectivo && !pagoEfectivo.exacto
    ? parseFloat(pagoEfectivo.monto_con?.replace('S/ ', '') || 0) - Number(order.total)
    : null;

  const salsaNombres = {
    criolla: 'Salsa criolla', ajo: 'Salsa de ajo', huancaina: 'Huancaína',
    ocopa: 'Ocopa', tartar: 'Tártar', chimichurri: 'Chimichurri', rocoto: 'Rocoto',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <p className="text-white font-black text-base">{order.codigo || `#${order.id}`}</p>
            <p className="text-slate-400 text-xs">{order.nombre_cliente}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Tipo de entrega */}
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
            order.tipo_entrega === 0
              ? 'bg-teal-500/10 border border-teal-500/20'
              : 'bg-purple-500/10 border border-purple-500/20'
          }`}>
            <span className="text-2xl">{order.tipo_entrega === 0 ? '🏪' : '🛵'}</span>
            <div>
              <p className={`font-bold text-sm ${order.tipo_entrega === 0 ? 'text-teal-400' : 'text-purple-400'}`}>
                {order.tipo_entrega === 0 ? 'Recojo en tienda' : 'Delivery a domicilio'}
              </p>
              {d.address && <p className="text-slate-400 text-xs mt-0.5">{d.address}</p>}
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cliente</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-orange-400 font-black">{order.nombre_cliente?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{order.nombre_cliente}</p>
                {order.numero_telefonico && (
                  <a href={`tel:${order.numero_telefonico}`}
                    className="flex items-center gap-1 text-green-400 text-sm font-semibold mt-0.5">
                    <Phone size={12} /> {order.numero_telefonico}
                    <span className="text-green-600 text-xs ml-1">Llamar</span>
                  </a>
                )}
              </div>
            </div>
            {d.address && order.tipo_entrega !== 0 && (
              <div className="flex items-start gap-2 bg-slate-700/50 rounded-xl px-3 py-2 mt-2">
                <MapPin size={13} className="text-orange-400 mt-0.5 shrink-0" />
                <p className="text-slate-200 text-sm">{d.address}</p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {d.observaciones && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
              <MessageSquare size={15} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-400 text-xs font-bold mb-1">Indicaciones del cliente</p>
                <p className="text-amber-300 text-sm">{d.observaciones}</p>
              </div>
            </div>
          )}

          {/* Productos */}
          {(d.items || []).length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Productos · {d.items.length} ítem{d.items.length !== 1 ? 's' : ''}
              </p>
              {d.items.map((item, i) => {
                const salsas = item.sauces
                  ? Object.entries(item.sauces).filter(([, v]) => v > 0).map(([k]) => salsaNombres[k] || k)
                  : [];
                return (
                  <div key={i} className="bg-slate-800 rounded-2xl overflow-hidden">
                    {/* Fila principal */}
                    <div className="flex items-center gap-3 p-3">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        : <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                            <UtensilsCrossed size={20} className="text-slate-500" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{item.name}</p>
                        <p className="text-slate-400 text-xs">x{item.qty} unidad{item.qty !== 1 ? 'es' : ''}</p>
                        <p className="text-slate-500 text-xs">S/ {item.price.toFixed(2)} c/u</p>
                      </div>
                      <p className="text-orange-400 font-black text-base shrink-0">
                        S/ {(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>

                    {/* Personalizaciones */}
                    {(
                      (item.presaQtys && (item.presaQtys.pecho > 0 || item.presaQtys.pierna > 0)) ||
                      item.gaseosaFlavor ||
                      salsas.length > 0 ||
                      (item.complementos || []).length > 0 ||
                      (item.bebidas || []).length > 0
                    ) && (
                      <div className="border-t border-slate-700 px-3 py-2.5 space-y-1.5">
                        {/* Presas */}
                        {item.presaQtys && (item.presaQtys.pecho > 0 || item.presaQtys.pierna > 0) && (
                          <div className="flex items-center gap-2">
                            <span className="text-base">🍗</span>
                            <p className="text-orange-300 text-xs font-semibold">
                              {[
                                item.presaQtys.pecho  > 0 && `${item.presaQtys.pecho}× Pecho`,
                                item.presaQtys.pierna > 0 && `${item.presaQtys.pierna}× Pierna`,
                              ].filter(Boolean).join('  ·  ')}
                            </p>
                          </div>
                        )}

                        {/* Gaseosa incluida */}
                        {item.gaseosaFlavor && (
                          <div className="flex items-center gap-2">
                            <span className="text-base">{item.gaseosaFlavor === 'inca_kola' ? '🟡' : '🔴'}</span>
                            <p className="text-yellow-300 text-xs font-semibold">
                              Gaseosa: {item.gaseosaFlavor === 'inca_kola' ? 'Inca Kola' : 'Coca Cola'}
                            </p>
                          </div>
                        )}

                        {/* Salsas */}
                        {salsas.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Droplets size={13} className="text-red-400 mt-0.5 shrink-0" />
                            <p className="text-slate-300 text-xs">
                              <span className="font-semibold text-red-400">Salsas: </span>
                              {salsas.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Complementos */}
                        {(item.complementos || []).map((c, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <Plus size={11} className="text-slate-500 shrink-0" />
                            <p className="text-slate-300 text-xs">{c.qty}× {c.nombre}</p>
                            {c.precio > 0 && <span className="text-slate-500 text-xs ml-auto">+S/ {c.precio.toFixed(2)}</span>}
                          </div>
                        ))}

                        {/* Bebidas */}
                        {(item.bebidas || []).map((b, bi) => (
                          <div key={bi} className="flex items-center gap-2">
                            <Wine size={11} className="text-blue-400 shrink-0" />
                            <p className="text-slate-300 text-xs">
                              {b.qty}× {b.nombre}
                              {b.sabor === 'inca_kola' && <span className="ml-1">🟡</span>}
                              {b.sabor === 'coca_cola' && <span className="ml-1">🔴</span>}
                            </p>
                            {b.precio > 0 && <span className="text-slate-500 text-xs ml-auto">+S/ {(b.precio * b.qty).toFixed(2)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resumen de pago */}
          <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Resumen de pago</p>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-300">S/ {subtotal.toFixed(2)}</span>
              </div>
              {order.cargo_tarjeta === 1 && (
                <div className="flex justify-between">
                  <span className="text-blue-400 text-xs">Cargo tarjeta (5%)</span>
                  <span className="text-blue-400 text-xs">+S/ {(Number(order.total) - subtotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                <span className="text-white font-bold">Total</span>
                <span className="text-orange-400 font-black text-lg">S/ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Método */}
            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              order.tipo_pago === 'tarjeta'
                ? 'bg-blue-500/10 border border-blue-500/20'
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {order.tipo_pago === 'tarjeta'
                ? <CreditCard size={16} className="text-blue-400 shrink-0" />
                : <Banknote    size={16} className="text-green-400 shrink-0" />
              }
              <div>
                <p className={`font-semibold text-sm capitalize ${order.tipo_pago === 'tarjeta' ? 'text-blue-400' : 'text-green-400'}`}>
                  {order.tipo_pago || '—'}
                </p>
                {pagoEfectivo && !pagoEfectivo.exacto && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    Paga con {pagoEfectivo.monto_con} · vuelto{' '}
                    <span className="text-amber-400 font-bold">S/ {vuelto?.toFixed(2)}</span>
                  </p>
                )}
                {pagoEfectivo?.exacto && (
                  <p className="text-slate-400 text-xs mt-0.5">Paga con monto exacto</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────────────
function OrderCard({ order, token, onRefresh }) {
  const [open, setOpen]           = useState(false);
  const [showDes, setShowDes]     = useState(false);
  const [confirm, setConfirm]     = useState(null); // 'entregado' | 'merma' | null
  const [saving, setSaving]       = useState(false);
  const cfg   = ESTADO_CONFIG[order.estado_nombre] || ESTADO_CONFIG.recepcionado;

  async function cambiarEstado(estado) {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/pedidos/${order.id}/estado-motorizado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      setConfirm(null);
      onRefresh();
    } finally { setSaving(false); }
  }
  const d     = parseDes(order.descripcion);
  const fecha = new Date(order.hora_pedido).toLocaleString('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-black text-white text-base">{order.codigo || `#${order.id}`}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-slate-300 font-semibold truncate">{order.nombre_cliente}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={11} className="text-slate-500" />
              <span className="text-slate-500 text-xs">{fecha}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-orange-400 font-black text-lg">S/ {Number(order.total).toFixed(2)}</p>
            {open
              ? <ChevronUp size={16} className="text-slate-400 ml-auto mt-1" />
              : <ChevronDown size={16} className="text-slate-400 ml-auto mt-1" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {/* Tipo de entrega */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${order.tipo_entrega === 0 ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-purple-500/10 border border-purple-500/20'}`}>
            <span className="text-lg">{order.tipo_entrega === 0 ? '🏪' : '🛵'}</span>
            <span className={`text-sm font-semibold ${order.tipo_entrega === 0 ? 'text-teal-400' : 'text-purple-400'}`}>
              {order.tipo_entrega === 0 ? 'Recojo en tienda' : 'Delivery a domicilio'}
            </span>
          </div>

          {/* Dirección */}
          {d.address && (
            <div className="flex items-start gap-2 bg-slate-700/50 rounded-xl p-3">
              <MapPin size={15} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-slate-200 text-sm">{d.address}</p>
            </div>
          )}

          {/* Teléfono */}
          {order.numero_telefonico && (
            <a href={`tel:${order.numero_telefonico}`}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <Phone size={15} className="text-green-400" />
              <span className="text-green-400 font-semibold text-sm">{order.numero_telefonico}</span>
              <span className="text-green-500 text-xs ml-auto">Llamar</span>
            </a>
          )}

          {/* Notas */}
          {d.observaciones && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-400 text-xs font-semibold mb-1">Indicaciones</p>
              <p className="text-amber-300 text-sm">{d.observaciones}</p>
            </div>
          )}

          {/* Productos (resumen) */}
          {d.items?.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Productos del pedido</p>
              <div className="space-y-2">
                {d.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-700/50 rounded-xl p-3">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{item.name}</p>
                      <p className="text-slate-400 text-xs">x{item.qty}</p>
                      {item.presaQtys && (item.presaQtys.pecho > 0 || item.presaQtys.pierna > 0) && (
                        <p className="text-orange-400 text-xs font-semibold mt-1">
                          🍗 {[item.presaQtys.pecho > 0 && `${item.presaQtys.pecho}x Pecho`, item.presaQtys.pierna > 0 && `${item.presaQtys.pierna}x Pierna`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {item.gaseosaFlavor === 'inca_kola' && <p className="text-yellow-400 text-xs">🟡 Inca Kola</p>}
                      {item.gaseosaFlavor === 'coca_cola'  && <p className="text-red-400 text-xs">🔴 Coca Cola</p>}
                      {item.sauces && Object.entries(item.sauces).some(([, v]) => v > 0) && (
                        <p className="text-slate-400 text-xs mt-0.5">
                          Salsas: {Object.entries(item.sauces).filter(([, v]) => v > 0).map(([k]) => k).join(', ')}
                        </p>
                      )}
                      {(item.complementos || []).map((c, ci) => <p key={ci} className="text-slate-400 text-xs">🍟 {c.qty}x {c.nombre}</p>)}
                      {(item.bebidas || []).map((b, bi) => (
                        <p key={bi} className="text-slate-400 text-xs">🥤 {b.qty}x {b.nombre}{b.sabor === 'inca_kola' ? ' 🟡' : b.sabor === 'coca_cola' ? ' 🔴' : ''}</p>
                      ))}
                    </div>
                    <p className="text-orange-400 font-bold text-sm shrink-0">S/ {(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pago */}
          <div className="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">Método de pago</p>
              <p className="text-white font-bold capitalize mt-0.5">{order.tipo_pago || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs font-semibold">Total a cobrar</p>
              <p className="text-orange-400 font-black text-xl">S/ {Number(order.total).toFixed(2)}</p>
            </div>
          </div>

          {d.pago_efectivo && !d.pago_efectivo.exacto && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-400 text-xs font-semibold">💵 El cliente paga con: {d.pago_efectivo.monto_con}</p>
              <p className="text-amber-300 text-xs mt-1">
                Vuelto: S/ {(parseFloat(d.pago_efectivo.monto_con?.replace('S/ ', '') || 0) - Number(order.total)).toFixed(2)}
              </p>
            </div>
          )}

          {/* Acciones del motorizado — solo en pedidos "en camino" */}
          {order.estado_nombre === 'enviado' && (
            confirm ? (
              <div className={`rounded-2xl p-4 border space-y-3 ${
                confirm === 'entregado'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <p className={`text-sm font-bold text-center ${confirm === 'entregado' ? 'text-green-400' : 'text-red-400'}`}>
                  {confirm === 'entregado'
                    ? '¿Confirmar entrega del pedido?'
                    : '¿Marcar este pedido como merma?'}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 font-semibold text-sm">
                    Cancelar
                  </button>
                  <button onClick={() => cambiarEstado(confirm)} disabled={saving}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
                      confirm === 'entregado'
                        ? 'bg-green-500 hover:bg-green-400'
                        : 'bg-red-500 hover:bg-red-400'
                    } disabled:opacity-50`}>
                    {saving ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirm('entregado')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-bold text-sm transition-colors">
                  <CheckCircle2 size={16} />
                  Entregado
                </button>
                <button onClick={() => setConfirm('merma')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold text-sm transition-colors">
                  <AlertTriangle size={16} />
                  Merma
                </button>
              </div>
            )
          )}

          {/* Botón ver detalle completo */}
          <button onClick={() => setShowDes(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-sm font-bold transition-colors">
            <Package size={15} />
            Ver detalle completo del pedido
          </button>
        </div>
      )}

      {showDes && <DescripcionModal order={order} onClose={() => setShowDes(false)} />}
    </div>
  );
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

function formatFechaHistorial(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Vista principal del motorizado ────────────────────────────────
export default function MotorizadoView({ user, token, onLogout }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('pedidos'); // 'pedidos' | 'historial'

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos/mis-pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      if (res.ok) setOrders(await res.json());
    } catch {} finally { setLoading(false); }
  }, [token, onLogout]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const hoy      = orders.filter(o => isToday(o.hora_pedido));
  const pasados  = orders.filter(o => !isToday(o.hora_pedido));

  const activos    = hoy.filter(o => o.estado_nombre === 'enviado');
  const pendientes = hoy.filter(o => o.estado_nombre === 'recepcionado');
  const finalizados = hoy.filter(o => ['entregado', 'merma'].includes(o.estado_nombre));

  // Agrupar historial por fecha
  const historialPorFecha = pasados.reduce((acc, o) => {
    const fecha = formatFechaHistorial(o.hora_pedido);
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(o);
    return acc;
  }, {});

  const activeCount = hoy.filter(o => ['enviado', 'recepcionado'].includes(o.estado_nombre)).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/70 px-4 pt-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">El Rey del Sabor</p>
              <p className="text-slate-500 text-xs">{user?.nombre} · Repartidor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 rounded-xl px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-orange-400 text-xs font-bold">{activeCount} activo{activeCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-3">
          {[
            { key: 'pedidos',   label: 'Mis pedidos',  count: activeCount,   countActive: true  },
            { key: 'historial', label: 'Historial',    count: pasados.length, countActive: false },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t.key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black ${
                  tab === t.key ? 'bg-white/20 text-white' : t.countActive ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 space-y-5 max-w-lg mx-auto w-full">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-orange-200/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Cargando tus pedidos...</p>
          </div>
        ) : tab === 'pedidos' ? (
          hoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-5xl">📭</span>
              <p className="text-white font-bold text-lg">Sin pedidos hoy</p>
              <p className="text-slate-400 text-sm">Cuando te asignen un pedido aparecerá aquí.</p>
            </div>
          ) : (
            <>
              {activos.length > 0 && (
                <section>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    En camino ({activos.length})
                  </p>
                  <div className="space-y-3">{activos.map(o => <OrderCard key={o.id} order={o} token={token} onRefresh={fetchOrders} />)}</div>
                </section>
              )}
              {pendientes.length > 0 && (
                <section>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    Por retirar ({pendientes.length})
                  </p>
                  <div className="space-y-3">{pendientes.map(o => <OrderCard key={o.id} order={o} token={token} onRefresh={fetchOrders} />)}</div>
                </section>
              )}
              {finalizados.length > 0 && (
                <section>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                    Completados hoy ({finalizados.length})
                  </p>
                  <div className="space-y-3">{finalizados.map(o => <OrderCard key={o.id} order={o} token={token} onRefresh={fetchOrders} />)}</div>
                </section>
              )}
            </>
          )
        ) : (
          pasados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-5xl">📋</span>
              <p className="text-white font-bold text-lg">Sin historial</p>
              <p className="text-slate-400 text-sm">Aquí aparecerán tus pedidos de días anteriores.</p>
            </div>
          ) : (
            Object.entries(historialPorFecha).map(([fecha, pedidos]) => (
              <section key={fecha}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={12} />
                  {fecha} · {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-3">{pedidos.map(o => <OrderCard key={o.id} order={o} token={token} onRefresh={fetchOrders} />)}</div>
              </section>
            ))
          )
        )}
      </main>
    </div>
  );
}
