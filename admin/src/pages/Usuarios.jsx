import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, X, User, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ROL_CONFIG = {
  admin:      { label: 'Administrador', color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30' },
  operario:   { label: 'Operario',      color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30' },
  motorizado: { label: 'Motorizado',    color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
};

const EMPTY_FORM = { nombre: '', email: '', password: '', rol: 'operario' };

export default function Usuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'create' | { ...user }
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/usuarios`);
      if (res.ok) setUsuarios(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchUsuarios(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal('create');
  }

  function openEdit(user) {
    setForm({ nombre: user.nombre, email: user.email, password: '', rol: user.rol, activo: user.activo, id: user.id });
    setError('');
    setModal(user);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password || !form.rol) return setError('Todos los campos son requeridos');
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, rol: form.rol }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al crear usuario');
      await fetchUsuarios();
      setModal(null);
    } catch { setError('Error de conexión'); } finally { setSaving(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/api/usuarios/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre: form.nombre, rol: form.rol, activo: form.activo }),
      });
      if (!res.ok) return setError('Error al actualizar');
      await fetchUsuarios();
      setModal(null);
    } catch { setError('Error de conexión'); } finally { setSaving(false); }
  }

  async function toggleActivo(user) {
    await authFetch(`${API_URL}/api/usuarios/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre: user.nombre, rol: user.rol, activo: user.activo === 1 ? 0 : 1 }),
    });
    fetchUsuarios();
  }

  const isEditing = modal && modal !== 'create';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Usuarios</h1>
          <p className="text-slate-400 text-sm">Gestión de accesos al sistema</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(ROL_CONFIG).map(([rol, cfg]) => {
          const count = usuarios.filter(u => u.rol === rol).length;
          return (
            <div key={rol} className={`bg-slate-800 border ${cfg.border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
              <p className="text-slate-400 text-xs mt-1">{cfg.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Usuario</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Rol</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {usuarios.map(user => {
                  const cfg = ROL_CONFIG[user.rol] || ROL_CONFIG.operario;
                  return (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${cfg.bg} rounded-full flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-black ${cfg.color}`}>
                              {user.nombre?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{user.nombre}</p>
                            <p className="text-slate-500 text-xs sm:hidden">{user.email}</p>
                            {user.motorizado_nombre && (
                              <p className="text-purple-400 text-xs">🛵 {user.motorizado_nombre}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActivo(user)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${user.activo === 1 ? 'text-green-400 hover:text-red-400' : 'text-slate-500 hover:text-green-400'}`}>
                          {user.activo === 1
                            ? <><ToggleRight size={18} /> Activo</>
                            : <><ToggleLeft size={18} /> Inactivo</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(user)}
                          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-orange-400" />
                <h3 className="font-black text-white">{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isEditing ? handleEdit : handleCreate} className="p-5 space-y-4">
              {/* Nombre */}
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Nombre completo" value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Email (solo creación) */}
              {!isEditing && (
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" placeholder="Correo electrónico" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* Contraseña (solo creación) */}
              {!isEditing && (
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" placeholder="Contraseña" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* Rol */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Rol del usuario</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROL_CONFIG).map(([rol, cfg]) => (
                    <button key={rol} type="button"
                      onClick={() => setForm(f => ({ ...f, rol }))}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        form.rol === rol ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
                {form.rol === 'motorizado' && !isEditing && (
                  <p className="text-purple-400 text-xs mt-2">
                    ℹ️ Se creará automáticamente un registro de motorizado vinculado.
                  </p>
                )}
              </div>

              {/* Activo (solo edición) */}
              {isEditing && (
                <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                  <span className="text-slate-300 text-sm font-semibold">Estado del usuario</span>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, activo: f.activo === 1 ? 0 : 1 }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activo === 1 ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.activo === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 py-3 border border-slate-600 rounded-xl text-slate-400 font-semibold text-sm hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:shadow-lg transition-all text-sm">
                  {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
