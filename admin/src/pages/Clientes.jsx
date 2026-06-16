import { useState, useEffect } from 'react';
import { Users, Search, Calendar, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FILTROS = ['dia', 'semana', 'mes', 'año'];
const FILTRO_LABEL = { dia: 'Hoy', semana: 'Semana', mes: 'Mes', año: 'Año' };

export default function Clientes() {
  const { token }               = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filtro, setFiltro]     = useState('mes');

  async function fetchClientes(f = filtro) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clientes?filter=${f}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setClientes(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchClientes(filtro); }, [filtro]);

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.correo.toLowerCase().includes(search.toLowerCase())
  );

  const totalPedidosFiltro = filtered.reduce((s, c) => s + (c.count_filtro || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">{clientes.length} clientes registrados</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-orange-400 font-black text-2xl">{clientes.length}</p>
          <p className="text-slate-400 text-xs mt-1">Total clientes</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-green-400 font-black text-2xl">{totalPedidosFiltro}</p>
          <p className="text-slate-400 text-xs mt-1">Pedidos ({FILTRO_LABEL[filtro]})</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-blue-400 font-black text-2xl">
            {clientes.filter(c => c.total_pedidos > 0).length}
          </p>
          <p className="text-slate-400 text-xs mt-1">Con pedidos</p>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o correo..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                filtro === f ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}>
              {FILTRO_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={40} className="text-slate-600" />
            <p className="text-slate-400">No hay clientes registrados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Cliente</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Nacimiento</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Registrado</th>
                  <th className="text-center text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="text-center text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">{FILTRO_LABEL[filtro]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(c => {
                  const regDate = new Date(c.created_at).toLocaleDateString('es-PE', {
                    timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric',
                  });
                  const birthDate = c.fecha_nacimiento
                    ? new Date(c.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-orange-400 font-black text-sm">
                              {c.nombre?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{c.nombre}</p>
                            <p className="text-slate-400 text-xs truncate">{c.correo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Calendar size={12} />
                          {birthDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-slate-400 text-xs">{regDate}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ShoppingBag size={12} className="text-slate-500" />
                          <span className="text-white font-bold text-sm">{c.total_pedidos}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                          c.count_filtro > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-500'
                        }`}>
                          {c.count_filtro}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
