import { useState, useEffect } from 'react';
import { Search, Clock, MapPin, User, Phone, Bike, XCircle, Package, Send, RefreshCw, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  recepcionado: { label: 'Recepcionado', color: 'amber',  icon: Clock    },
  enviado:      { label: 'Enviado',      color: 'purple', icon: Send     },
  merma:        { label: 'Merma',        color: 'red',    icon: XCircle  },
  entregado:    { label: 'Entregado',    color: 'green',  icon: Package  },
};

const COLOR_CLASSES = {
  amber:  { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  red:    { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30'    },
  green:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30'  },
};

// Helpers de zona horaria Lima
function limaDateStr(d) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}
function todayLima() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

export default function Orders({ orders, onRefresh }) {
  const { token } = useAuth();
  const [tab, setTab]                   = useState('hoy');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [motorizados, setMotorizados]   = useState([]);
  const [assignMotorId, setAssignMotorId] = useState('');
  const [estados, setEstados]           = useState([]);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/motorizados`, { headers }).then(r => r.json()).then(setMotorizados).catch(() => {});
    fetch(`${API_URL}/api/pedidos/config/estados`, { headers }).then(r => r.json()).then(setEstados).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id);
      if (fresh) setSelectedOrder(fresh);
    }
  }, [orders]);

  // Separar pedidos por tab con zona horaria Lima
  const today = todayLima();
  const todayOrders   = orders.filter(o => limaDateStr(o.hora_pedido) === today);
  const historyOrders = orders.filter(o => limaDateStr(o.hora_pedido) < today);
  const baseOrders    = tab === 'hoy' ? todayOrders : historyOrders;
  const isHistorial   = tab === 'historial';

  const filtered = baseOrders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.estado_nombre === filterStatus;
    const matchSearch = o.nombre_cliente?.toLowerCase().includes(search.toLowerCase()) ||
                        String(o.id).includes(search) ||
                        (o.codigo || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });

  const handleChangeEstado = async (order, estadoId) => {
    if (isHistorial) return;
    setSaving(true);
    try {
      await authFetch(`${API_URL}/api/pedidos/${order.id}/estado`, {
        method: 'PATCH', body: JSON.stringify({ estado_id: estadoId }),
      });
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleAssignAndSend = async (order) => {
    if (!assignMotorId || isHistorial) return;
    setSaving(true);
    try {
      await authFetch(`${API_URL}/api/pedidos/${order.id}/motorizado`, {
        method: 'PATCH', body: JSON.stringify({ motorizado_id: parseInt(assignMotorId) }),
      });
      const estadoEnviado = estados.find(e => e.nombre === 'enviado');
      if (estadoEnviado) {
        await authFetch(`${API_URL}/api/pedidos/${order.id}/estado`, {
          method: 'PATCH', body: JSON.stringify({ estado_id: estadoEnviado.id }),
        });
      }
      setAssignMotorId('');
      onRefresh();
    } finally { setSaving(false); }
  };

  const desc = (order) => { try { return JSON.parse(order.descripcion || '{}'); } catch { return {}; } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Bandeja de Pedidos</h1>
          <p className="text-slate-400 text-sm">{filtered.length} pedidos · {todayOrders.length} hoy</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {orders.filter(o => o.estado_nombre === 'recepcionado').length} recepcionados
          </span>
          <button onClick={onRefresh} className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white shrink-0">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs Hoy / Historial */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-2xl p-1 w-fit gap-1">
        <button onClick={() => { setTab('hoy'); setSelectedOrder(null); setFilterStatus('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'hoy' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
          <Clock size={14} />
          Pedidos del día
          {todayOrders.length > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{todayOrders.length}</span>
          )}
        </button>
        <button onClick={() => { setTab('historial'); setSelectedOrder(null); setFilterStatus('all'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'historial' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          <History size={14} />
          Historial
          {historyOrders.length > 0 && (
            <span className="bg-slate-600/60 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">{historyOrders.length}</span>
          )}
        </button>
      </div>

      {isHistorial && (
        <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-400">
          <History size={14} />
          Historial — solo lectura. Los pedidos anteriores a hoy no se pueden modificar.
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por cliente o código..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'recepcionado', 'enviado', 'entregado', 'merma'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === s ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}>
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de pedidos ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400">{tab === 'hoy' ? 'No hay pedidos hoy todavía' : 'No hay pedidos en el historial'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Código</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Hora</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Pago</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">Cambio</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Motorizado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const cfg        = STATUS_CONFIG[order.estado_nombre] || STATUS_CONFIG.recepcionado;
                  const colors     = COLOR_CLASSES[cfg.color];
                  const hora = new Date(order.hora_pedido).toLocaleTimeString('es-PE', {
                    timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit',
                  });

                  return (
                    <tr
                      key={order.id}
                      onClick={() => { setSelectedOrder(order); setAssignMotorId(''); }}
                      className="border-b border-slate-700/60 last:border-0 cursor-pointer transition-colors hover:bg-slate-700/40"
                    >
                      {/* Código */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-orange-400 font-black tracking-wider text-xs">
                          {order.codigo || `#${order.id}`}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold truncate max-w-35">{order.nombre_cliente}</p>
                        {order.numero_telefonico && (
                          <p className="text-slate-500 text-xs">{order.numero_telefonico}</p>
                        )}
                      </td>

                      {/* Hora */}
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-slate-400 text-xs">{hora}</span>
                      </td>

                      {/* Tipo entrega */}
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          order.tipo_entrega === 0
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {order.tipo_entrega === 0 ? '🏪 Recojo' : '🛵 Delivery'}
                        </span>
                      </td>

                      {/* Pago */}
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        <span className="text-slate-300 capitalize text-xs">{order.tipo_pago || '—'}</span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-orange-400 font-black">S/ {Number(order.total).toFixed(2)}</span>
                      </td>

                      {/* Cambio */}
                      <td className="px-4 py-3 text-right whitespace-nowrap hidden lg:table-cell">
                        {order.tipo_pago !== 'efectivo' || order.monto_pago_cliente == null ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : (
                          <div>
                            <p className="text-white text-xs font-semibold">S/ {Number(order.monto_pago_cliente).toFixed(2)}</p>
                            <p className="text-amber-400 text-xs">Vuelto: S/ {(Number(order.monto_pago_cliente) - Number(order.total)).toFixed(2)}</p>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <cfg.icon size={10} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Motorizado */}
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        {order.motorizado_nombre ? (
                          <div className="flex items-center gap-1.5 text-xs text-purple-400">
                            <Bike size={12} />
                            <span>{order.motorizado_nombre}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal detalle pedido ── */}
      {selectedOrder && (() => {
        const o      = selectedOrder;
        const d      = desc(o);
        const cfg    = STATUS_CONFIG[o.estado_nombre] || STATUS_CONFIG.recepcionado;
        const colors = COLOR_CLASSES[cfg.color];
        const montoPago = o.monto_pago_cliente != null ? Number(o.monto_pago_cliente) : null;
        const vuelto   = montoPago !== null ? montoPago - Number(o.total) : null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-700 bg-linear-to-r from-orange-500/10 to-red-500/10 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-black text-lg">{o.codigo || `#${o.id}`}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                        <cfg.icon size={10} /> {cfg.label}
                      </span>
                      {isHistorial && (
                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-lg font-semibold">Solo lectura</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(o.hora_pedido).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* Cliente */}
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Cliente</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                      <User size={16} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{o.nombre_cliente}</p>
                      <p className="text-slate-400 text-xs">{o.numero_telefonico || '—'}</p>
                    </div>
                  </div>
                  {d.observaciones && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-amber-400 text-xs">💬 {d.observaciones}</p>
                    </div>
                  )}
                </div>

                {/* Entrega */}
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${o.tipo_entrega === 0 ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-purple-500/10 border border-purple-500/20'}`}>
                  <span>{o.tipo_entrega === 0 ? '🏪' : '🛵'}</span>
                  <span className={`text-sm font-semibold ${o.tipo_entrega === 0 ? 'text-teal-400' : 'text-purple-400'}`}>
                    {o.tipo_entrega === 0 ? 'Recojo en tienda' : 'Delivery a domicilio'}
                  </span>
                </div>

                {/* Dirección */}
                {d.address && (
                  <div className="bg-slate-800 rounded-xl p-3 flex items-start gap-2">
                    <MapPin size={14} className="text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-white text-sm">{d.address}</p>
                  </div>
                )}

                {/* Productos */}
                {d.items?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                      Productos · {d.items.length} ítem{d.items.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {d.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-xl p-2.5">
                          {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-slate-400 text-xs">x{item.qty}</p>
                            {item.presaQtys && (item.presaQtys.pecho > 0 || item.presaQtys.pierna > 0) && (
                              <p className="text-orange-400 text-xs font-semibold">
                                🍗 {[item.presaQtys.pecho > 0 && `${item.presaQtys.pecho}x Pecho`, item.presaQtys.pierna > 0 && `${item.presaQtys.pierna}x Pierna`].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {item.gaseosaFlavor === 'inca_kola' && <p className="text-yellow-400 text-xs">🟡 Inca Kola</p>}
                            {item.gaseosaFlavor === 'coca_cola'  && <p className="text-red-400 text-xs">🔴 Coca Cola</p>}
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
                <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Pago</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize font-semibold">{o.tipo_pago || '—'}</span>
                    <span className="text-orange-400 font-black text-lg">S/ {Number(o.total).toFixed(2)}</span>
                  </div>
                  {o.cargo_tarjeta === 1 && <p className="text-blue-400 text-xs">💳 Incluye cargo por tarjeta (5%)</p>}
                  {o.tipo_pago === 'efectivo' && (
                    montoPago !== null ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-1">
                        <p className="text-amber-400 text-xs font-semibold">💵 Paga con: S/ {montoPago.toFixed(2)}</p>
                        <p className="text-amber-300 text-xs">Vuelto a entregar: <span className="font-black">S/ {vuelto?.toFixed(2)}</span></p>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">💵 Paga con monto exacto</p>
                    )
                  )}
                </div>

                {/* Motorizado */}
                {o.motorizado_nombre && (
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <Bike size={16} className="text-purple-400" />
                    <p className="text-purple-400 text-sm font-semibold">{o.motorizado_nombre}</p>
                  </div>
                )}

                {/* Acciones */}
                {!isHistorial && (
                  <>
                    {o.estado_nombre === 'recepcionado' && (
                      <div className="space-y-2">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Asignar motorizado y enviar</p>
                        <select value={assignMotorId} onChange={e => setAssignMotorId(e.target.value)}
                          className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500">
                          <option value="">Seleccionar motorizado...</option>
                          {motorizados.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}{m.disponible === 0 ? ' (no disponible)' : ''}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAssignAndSend(o)} disabled={!assignMotorId || saving}
                          className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-40 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                          <Bike size={16} />
                          {saving ? 'Guardando...' : 'Asignar y Enviar'}
                        </button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Cambiar estado</p>
                      <div className="flex gap-2 flex-wrap">
                        {estados.filter(e => e.nombre !== o.estado_nombre && e.nombre !== 'enviado').map(e => {
                          const eCfg    = STATUS_CONFIG[e.nombre] || {};
                          const eColors = COLOR_CLASSES[eCfg.color] || COLOR_CLASSES.amber;
                          return (
                            <button key={e.id} onClick={() => handleChangeEstado(o, e.id)} disabled={saving}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-40 ${eColors.bg} ${eColors.text} ${eColors.border}`}>
                              {eCfg.label || e.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
