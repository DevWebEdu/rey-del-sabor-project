import { LayoutDashboard, ShoppingBag, Package, Flame, X, LogOut, Bike, Users, UserCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const NAV_SECTIONS = [
  {
    id: 'principal',
    heading: null,
    items: [
      { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin', 'operario'] },
      { id: 'orders',    label: 'Pedidos',    icon: ShoppingBag,     roles: ['admin', 'operario'], badge: 'pending' },
    ],
  },
  {
    id: 'gestion',
    heading: 'Gestión',
    items: [
      { id: 'products',             label: 'Productos',   icon: Package,    roles: ['admin', 'operario'] },
      { id: 'gestion-motorizados',  label: 'Motorizados', icon: Bike,       roles: ['admin', 'operario'] },
      { id: 'clientes',             label: 'Clientes',    icon: UserCircle, roles: ['admin', 'operario'] },
    ],
  },
  {
    id: 'admin',
    heading: 'Administración',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['admin'], tag: 'Admin' },
    ],
  },
];

const ROL_LABEL = { admin: 'Administrador', operario: 'Operario' };
const ROL_CHIP  = {
  admin:    'bg-red-500/20 text-red-400 border border-red-500/20',
  operario: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
};

export default function Sidebar({ active, onNavigate, pendingCount, sidebarOpen, setSidebarOpen, user, onLogout }) {
  const rol      = user?.rol || 'operario';
  const initial  = user?.nombre?.[0]?.toUpperCase() || 'A';

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-slate-950 border-r border-slate-800/60
        transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-tight truncate">El Rey del Sabor</p>
              <p className="text-slate-500 text-xs">Panel de Control</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Alerta de pedidos urgentes ── */}
        {pendingCount > 0 && (
          <button
            onClick={() => { onNavigate('orders'); setSidebarOpen(false); }}
            className="mx-3 mt-3 flex items-center gap-2.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 hover:border-amber-500/40 rounded-xl px-3 py-2.5 transition-all group text-left shrink-0"
          >
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
              <AlertTriangle size={13} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-400 text-xs font-bold leading-tight">
                {pendingCount} pedido{pendingCount !== 1 ? 's' : ''} en espera
              </p>
              <p className="text-amber-600 text-xs">Atender ahora</p>
            </div>
            <ChevronRight size={13} className="text-amber-500 shrink-0" />
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
          </button>
        )}

        {/* ── Navegación ── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(item => item.roles.includes(rol));
            if (visible.length === 0) return null;
            return (
              <div key={section.id}>
                {section.heading && (
                  <p className="text-slate-600 text-xs font-bold uppercase tracking-widest px-3 mb-2">
                    {section.heading}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visible.map(item => {
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200 group border
                          ${isActive
                            ? 'bg-orange-500/12 border-orange-500/20 text-orange-400'
                            : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }
                        `}
                      >
                        <item.icon
                          size={16}
                          className={`shrink-0 transition-colors ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                        />
                        <span className="flex-1 text-left leading-none">{item.label}</span>

                        {item.badge === 'pending' && pendingCount > 0 && (
                          <span className="min-w-5 h-5 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1.5 shrink-0">
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                        {item.tag && (
                          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                            {item.tag}
                          </span>
                        )}
                        {isActive && !item.badge && !item.tag && (
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Footer usuario ── */}
        <div className="border-t border-slate-800/60 p-3 space-y-1 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/60 transition-colors">
            <div className="relative shrink-0">
              <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow">
                {initial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-slate-950 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate leading-tight">{user?.nombre || 'Usuario'}</p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded-md font-semibold mt-0.5 ${ROL_CHIP[rol] || 'bg-slate-700 text-slate-400'}`}>
                {ROL_LABEL[rol] || rol}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-500/8 hover:text-red-400 hover:border-red-500/15 border border-transparent transition-all text-xs font-semibold"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
