import { useState, useEffect } from 'react';
import { Edit2, X, Bike, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FILTROS = ['dia', 'semana', 'mes', 'año'];
const FILTRO_LABEL = { dia: 'Hoy', semana: 'Semana', mes: 'Mes', año: 'Año' };

export default function GestionMotorizados({ orders = [] }) {
  const { token } = useAuth();
  const [motorizados, setMotorizados] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState('dia');
  const [modal, setModal]             = useState(null); // null | motorizado object
  const [form, setForm]               = useState({ nombre: '', disponible: 1 });
  const [saving, setSaving]           = useState(false);
  const [expanded, setExpanded]       = useState(null);

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });

  async function fetchMotorizados(f = filtro) {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/motorizados?filter=${f}`);
      if (res.ok) setMotorizados(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchMotorizados(filtro); }, [filtro]);

  function getPedidosActuales(motorizadoId) {
    return orders.filter(o => o.motorizado_id === motorizadoId && o.estado_nombre === 'enviado');
  }

  function getPedidosPendientes(motorizadoId) {
    return orders.filter(o => o.motorizado_id === motorizadoId && o.estado_nombre === 'recepcionado');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      await authFetch(`${API_URL}/api/motorizados/${modal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre: form.nombre, disponible: form.disponible }),
      });
      await fetchMotorizados(filtro);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function toggleDisponible(m) {
    await authFetch(`${API_URL}/api/motorizados/${m.id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre: m.nombre, disponible: m.disponible === 1 ? 0 : 1 }),
    });
    fetchMotorizados(filtro);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Gestión de Motorizados</h1>
        <p className="text-slate-400 text-sm">Monitoreo en tiempo real</p>
      </div>

      {/* Filtros de tiempo */}
      <div className="flex gap-2">
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filtro === f ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
            }`}>
            {FILTRO_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Cards de motorizados */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-200/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : motorizados.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
          <Bike size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay motorizados registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motorizados.map(m => {
            const activos    = getPedidosActuales(m.id);
            const pendientes = getPedidosPendientes(m.id);
            const isExpanded = expanded === m.id;

            return (
              <div key={m.id} className={`bg-slate-800 rounded-2xl border transition-all ${m.disponible === 1 ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.disponible === 1 ? 'bg-purple-500/20' : 'bg-slate-700'}`}>
                        <Bike size={22} className={m.disponible === 1 ? 'text-purple-400' : 'text-slate-500'} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{m.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${m.disponible === 1 ? 'bg-green-400' : 'bg-slate-500'}`} />
                          <span className={`text-xs font-semibold ${m.disponible === 1 ? 'text-green-400' : 'text-slate-500'}`}>
                            {m.disponible === 1 ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setForm({ nombre: m.nombre, disponible: m.disponible }); setModal(m); }}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                    <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
                      <p className="text-orange-400 font-black text-xl">{m.count_filtro ?? 0}</p>
                      <p className="text-slate-500 text-xs">{FILTRO_LABEL[filtro]}</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 text-center">
                      <p className="text-purple-400 font-black text-xl">{activos.length}</p>
                      <p className="text-slate-500 text-xs">En camino</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
                      <p className="text-amber-400 font-black text-xl">{pendientes.length}</p>
                      <p className="text-slate-500 text-xs">Por retirar</p>
                    </div>
                  </div>

                  {/* Total acumulado */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                    <span>Total acumulado</span>
                    <span className="font-bold text-slate-400">{m.total_pedidos} pedidos</span>
                  </div>

                  {/* Toggle disponible */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => toggleDisponible(m)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        m.disponible === 1
                          ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                          : 'bg-slate-700 text-slate-400 hover:bg-green-500/10 hover:text-green-400'
                      }`}>
                      {m.disponible === 1 ? '✓ Marcar no disponible' : '+ Marcar disponible'}
                    </button>

                    {(activos.length > 0 || pendientes.length > 0) && (
                      <button onClick={() => setExpanded(isExpanded ? null : m.id)}
                        className="text-xs text-slate-400 hover:text-white font-semibold transition-colors">
                        {isExpanded ? 'Ocultar ▲' : 'Ver pedidos ▼'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Pedidos expandidos */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-4 space-y-2">
                    {activos.map(o => (
                      <div key={o.id} className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5">
                        <CheckCircle size={14} className="text-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{o.nombre_cliente}</p>
                          <p className="text-purple-400 text-xs font-bold">{o.codigo}</p>
                        </div>
                        <p className="text-orange-400 text-xs font-bold shrink-0">S/ {Number(o.total).toFixed(2)}</p>
                      </div>
                    ))}
                    {pendientes.map(o => (
                      <div key={o.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                        <AlertCircle size={14} className="text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{o.nombre_cliente}</p>
                          <p className="text-amber-400 text-xs font-bold">{o.codigo}</p>
                        </div>
                        <p className="text-orange-400 text-xs font-bold shrink-0">S/ {Number(o.total).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal editar — solo edición, sin crear */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-black text-white">Editar motorizado</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="relative">
                <Bike size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Nombre del motorizado" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                <span className="text-slate-300 text-sm">Disponible</span>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, disponible: f.disponible === 1 ? 0 : 1 }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.disponible === 1 ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.disponible === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 py-3 border border-slate-600 rounded-xl text-slate-400 font-semibold text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 text-sm">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
