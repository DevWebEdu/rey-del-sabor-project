import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu, Bell, RefreshCw, LayoutDashboard, ShoppingBag,
  Package, Bike, UserCircle, Users, X, Clock, ShoppingCart,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import GestionMotorizados from './pages/GestionMotorizados';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import MotorizadoView from './pages/MotorizadoView';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PAGE_META = {
  dashboard:             { label: 'Dashboard',            icon: LayoutDashboard },
  orders:                { label: 'Pedidos',              icon: ShoppingBag },
  products:              { label: 'Productos & Promos',   icon: Package },
  'gestion-motorizados': { label: 'Gestión Motorizados',  icon: Bike },
  clientes:              { label: 'Clientes',             icon: UserCircle },
  usuarios:              { label: 'Usuarios',             icon: Users },
};

function todayLima() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

function fmtHora(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function useClock() {
  const [clock, setClock] = useState({ time: '', date: '' });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        date: now.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'short', day: '2-digit', month: 'short' }),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return clock;
}

export default function App() {
  const { user, token, logout } = useAuth();
  const [page, setPage]               = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders]           = useState([]);
  const [motorizados, setMotorizados] = useState([]);
  const [notifications, setNotifications] = useState([]); // nuevos pedidos detectados
  const [notifOpen, setNotifOpen]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const clock = useClock();

  // Refs para tracking sin causar re-renders
  const initialLoadDone = useRef(false);
  const knownOrderIds   = useRef(new Set());

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) return;
      const data = await res.json();

      if (!initialLoadDone.current) {
        // Primera carga: solo poblar IDs conocidos, sin notificar
        data.forEach(o => knownOrderIds.current.add(o.id));
        initialLoadDone.current = true;
        setOrders(data);
        return;
      }

      // Cargas siguientes: detectar pedidos nuevos de HOY con estado recepcionado
      const today = todayLima();
      const nuevos = data.filter(o =>
        !knownOrderIds.current.has(o.id) &&
        o.estado_nombre === 'recepcionado' &&
        new Date(o.hora_pedido).toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) === today
      );

      data.forEach(o => knownOrderIds.current.add(o.id));

      if (nuevos.length > 0) {
        setNotifications(prev => [...nuevos, ...prev].slice(0, 20));
      }

      setOrders(data);
    } catch { /* network error */ }
  }, [token, logout]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 600);
  }, [fetchOrders]);

  const fetchMotorizados = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/motorizados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMotorizados(await res.json());
    } catch { /* network error */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    fetchMotorizados();
    const ordersInterval = setInterval(fetchOrders, 5000);
    const motoInterval   = setInterval(fetchMotorizados, 15000);
    return () => { clearInterval(ordersInterval); clearInterval(motoInterval); };
  }, [fetchOrders, fetchMotorizados, token]);

  if (!user) return <Login />;

  if (user.rol === 'motorizado') {
    return <MotorizadoView user={user} token={token} onLogout={logout} />;
  }

  const today        = todayLima();
  // Solo pedidos de HOY en estado recepcionado
  const pendingCount = orders.filter(o =>
    o.estado_nombre === 'recepcionado' &&
    new Date(o.hora_pedido).toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) === today
  ).length;

  const safePage = (user.rol !== 'admin' && page === 'usuarios') ? 'dashboard' : page;
  const meta     = PAGE_META[safePage] || PAGE_META.dashboard;
  const PageIcon = meta.icon;
  const unreadCount = notifications.length;

  const goToOrders = () => {
    setPage('orders');
    setNotifOpen(false);
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar
        active={safePage}
        onNavigate={setPage}
        pendingCount={pendingCount}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={logout}
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between px-4 py-3 gap-3">

            {/* Izquierda */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <Menu size={17} />
              </button>
              <div className="hidden lg:flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center shrink-0">
                  <PageIcon size={14} className="text-orange-400" />
                </div>
                <span className="text-white text-sm font-bold truncate">{meta.label}</span>
              </div>
              <span className="lg:hidden text-white text-sm font-bold truncate">{meta.label}</span>
            </div>

            {/* Derecha */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Reloj */}
              <div className="hidden xl:flex flex-col items-end mr-1">
                <span className="text-white text-sm font-black tabular-nums leading-tight">{clock.time}</span>
                <span className="text-slate-500 text-xs capitalize">{clock.date}</span>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                title="Actualizar pedidos"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-400' : ''} />
              </button>

              {/* ── Campana con notificaciones ── */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(v => !v)}
                  className={`w-9 h-9 border rounded-xl flex items-center justify-center transition-all ${
                    notifOpen
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Bell size={15} />
                </button>

                {/* Badge de nuevos pedidos */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/40 animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

                {/* Dropdown de notificaciones */}
                {notifOpen && (
                  <>
                    {/* Overlay cierre */}
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />

                    <div className="absolute top-11 right-0 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-orange-400" />
                          <span className="text-white font-bold text-sm">Notificaciones</span>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => setNotifications([])}
                            className="text-slate-500 hover:text-slate-300 text-xs transition-colors font-semibold"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      {/* Lista */}
                      {unreadCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell size={28} className="text-slate-700" />
                          <p className="text-slate-500 text-sm">Sin notificaciones nuevas</p>
                          <p className="text-slate-600 text-xs">Los nuevos pedidos aparecerán aquí</p>
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/60">
                          {notifications.map((o, i) => (
                            <button
                              key={`${o.id}-${i}`}
                              onClick={goToOrders}
                              className="w-full px-4 py-3 hover:bg-slate-700/50 transition-colors text-left flex items-start gap-3"
                            >
                              <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                <ShoppingCart size={14} className="text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-orange-400 font-black text-xs">{o.codigo || `#${o.id}`}</span>
                                  <span className="text-slate-500 text-xs shrink-0">{fmtHora(o.hora_pedido)}</span>
                                </div>
                                <p className="text-white font-semibold text-sm truncate mt-0.5">{o.nombre_cliente}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-slate-400 text-xs capitalize">{o.tipo_pago || '—'}</span>
                                  <span className="text-green-400 text-xs font-bold">S/ {Number(o.total).toFixed(2)}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="border-t border-slate-700 px-4 py-2.5 bg-slate-900/50">
                        <button
                          onClick={goToOrders}
                          className="w-full text-center text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors py-1"
                        >
                          Ver todos los pedidos →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 bg-linear-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0">
                  {user?.nombre?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-slate-300 text-xs font-semibold max-w-24 truncate">{user?.nombre}</span>
              </div>
            </div>
          </div>

          {/* Barra de alerta: pedidos de HOY recepcionados */}
          {pendingCount > 0 && (
            <div className="px-4 pb-2.5">
              <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                <span className="text-amber-400 text-xs font-semibold flex-1">
                  {pendingCount} pedido{pendingCount !== 1 ? 's' : ''} de hoy aguardando asignación de motorizado
                </span>
                {safePage !== 'orders' && (
                  <button
                    onClick={() => setPage('orders')}
                    className="text-amber-500 hover:text-amber-300 text-xs font-bold underline underline-offset-2 shrink-0 transition-colors"
                  >
                    Atender →
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ── Contenido ── */}
        <main className="flex-1 p-4 lg:p-6">
          {safePage === 'dashboard'             && <Dashboard orders={orders} motorizados={motorizados} />}
          {safePage === 'orders'                && <Orders orders={orders} onRefresh={fetchOrders} />}
          {safePage === 'products'              && <Products />}
          {safePage === 'gestion-motorizados'   && <GestionMotorizados orders={orders} />}
          {safePage === 'clientes'              && <Clientes />}
          {safePage === 'usuarios' && user.rol === 'admin' && <Usuarios />}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-800/60 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-slate-700 text-xs">El Rey del Sabor · Panel Admin</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-slate-700 text-xs">Activo · actualizando cada 5s</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
