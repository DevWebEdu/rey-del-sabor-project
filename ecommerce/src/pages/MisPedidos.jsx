import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Package, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Estado → índice en el timeline (coincide 1:1 con la BD)
const STATE_STEP = { recepcionado: 1, enviado: 2, entregado: 3 };

const ESTADO_CONFIG = {
  recepcionado: { label: 'En preparación', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  enviado:      { label: 'En camino',      color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  merma:        { label: 'Problema',       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'    },
  entregado:    { label: 'Entregado',      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
};

const STEPS = [
  { icon: '📋', label: 'Pedido recibido'  },
  { icon: '👨‍🍳', label: 'En preparación'  },
  { icon: '🛵', label: 'En camino'        },
  { icon: '✅', label: 'Entregado'        },
];

function StatusTimeline({ estado }) {
  if (estado === 'merma') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-red-700 text-sm">Problema con el pedido</p>
          <p className="text-red-500 text-xs">Contáctanos por WhatsApp para más información.</p>
        </div>
      </div>
    );
  }

  const current   = STATE_STEP[estado] ?? 0;
  const pct       = (current / (STEPS.length - 1)) * 100;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="relative flex items-start justify-between">
        {/* Línea base */}
        <div className="absolute left-5 right-5 top-5 h-1 bg-gray-200 rounded-full" />
        {/* Progreso */}
        <div
          className="absolute left-5 top-5 h-1 rounded-full transition-all duration-700"
          style={{
            width: `calc((100% - 2.5rem) * ${pct} / 100)`,
            background: estado === 'entregado' ? '#22c55e' : '#f97316',
          }}
        />
        {STEPS.map(({ icon, label }, i) => {
          const done   = i <= current;
          const active = i === current;
          const isLast = estado === 'entregado' && i === STEPS.length - 1;
          return (
            <div key={i} className="flex flex-col items-center gap-1 z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                isLast
                  ? 'bg-green-500 border-green-500 shadow-md shadow-green-200'
                  : done
                    ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-200'
                    : 'bg-white border-gray-200'
              } ${active ? 'scale-110' : ''}`}>
                {icon}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight px-0.5 ${
                isLast ? 'text-green-600' : done ? 'text-orange-600' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ pedido }) {
  const [open, setOpen] = useState(false);
  const cfg   = ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.recepcionado;
  const desc  = pedido.descripcion
    ? (typeof pedido.descripcion === 'string' ? JSON.parse(pedido.descripcion) : pedido.descripcion)
    : null;
  const items = desc?.items || [];

  const fecha = new Date(pedido.hora_pedido).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 ${cfg.border} overflow-hidden`}
    >
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
          <Package size={20} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-gray-900 text-base">{pedido.codigo}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={11} className="text-gray-400" />
            <p className="text-xs text-gray-400">{fecha}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-gray-900">S/ {Number(pedido.total).toFixed(2)}</p>
          {open ? <ChevronUp size={16} className="text-gray-400 ml-auto mt-1" /> : <ChevronDown size={16} className="text-gray-400 ml-auto mt-1" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <StatusTimeline estado={pedido.estado} />

              {pedido.estado === 'enviado' && pedido.motorizado_nombre && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <span className="text-lg">🛵</span>
                  <p className="text-sm text-orange-700">
                    <span className="font-bold">Repartidor:</span> {pedido.motorizado_nombre}
                  </p>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Productos</p>
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const compExtras = (item.complementos || []).reduce((s, c) => s + Number(c.precio) * c.qty, 0);
                      const bebExtras  = (item.bebidas || []).reduce((s, b) => s + Number(b.precio) * b.qty, 0);
                      const itemTotal  = item.price * item.qty + compExtras + bebExtras;
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">x{item.qty}</p>
                            {(item.complementos || []).map((c, i) => (
                              <p key={i} className="text-xs text-gray-400">+ {c.qty}x {c.nombre}</p>
                            ))}
                          </div>
                          <p className="text-sm font-bold text-gray-900 shrink-0">S/ {itemTotal.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-semibold mb-0.5">Entrega</p>
                  <p className="text-gray-700 font-bold">
                    {pedido.tipo_entrega === 1 || pedido.tipo_entrega === '1' ? '🛵 Delivery' : '🏪 Recojo en tienda'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 font-semibold mb-0.5">Pago</p>
                  <p className="text-gray-700 font-bold capitalize">{pedido.tipo_pago || '—'}</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-orange-50 rounded-xl px-4 py-2.5">
                <span className="text-sm font-semibold text-orange-700">Total pagado</span>
                <span className="text-base font-black text-orange-600">S/ {Number(pedido.total).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MisPedidos({ onClose }) {
  const { token, cliente } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchPedidos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clientes/mis-pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPedidos(await res.json());
    } catch {
      setError('No se pudieron cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  useEffect(() => {
    const id = setInterval(fetchPedidos, 15000);
    return () => clearInterval(id);
  }, [fetchPedidos]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="mis-pedidos-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div
        key="mis-pedidos-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gray-50 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 shrink-0">
          <div className="flex-1">
            <h2 className="font-black text-gray-900 text-lg leading-tight">Mis Pedidos</h2>
            {cliente && <p className="text-xs text-gray-400">{cliente.nombre}</p>}
          </div>
          <button
            onClick={fetchPedidos}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Cargando tus pedidos...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-5xl">⚠️</span>
              <p className="text-gray-600 font-semibold">{error}</p>
              <button onClick={fetchPedidos} className="text-orange-500 font-bold text-sm hover:underline">
                Reintentar
              </button>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-6xl">📦</span>
              <p className="text-gray-700 font-bold text-lg">Aún no tienes pedidos</p>
              <p className="text-gray-400 text-sm">Los pedidos realizados con tu cuenta aparecerán aquí.</p>
              <button
                onClick={onClose}
                className="mt-2 bg-orange-500 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-orange-600 transition-colors"
              >
                Ver el menú
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">
                {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
              </p>
              {pedidos.map(p => <OrderCard key={p.id} pedido={p} />)}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
