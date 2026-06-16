import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthModal({ initialMode = 'register', onClose, pendingOrderId = null, onAuthSuccess }) {
  const { login } = useAuth();
  const [mode, setMode]           = useState(initialMode);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [form, setForm] = useState({
    nombre: '', correo: '', fecha_nacimiento: '', password: '', password2: '',
  });

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  }

  function getEffectivePendingOrderId() {
    if (pendingOrderId) return pendingOrderId;
    try {
      const stored = localStorage.getItem('pending_order');
      return stored ? JSON.parse(stored).id : null;
    } catch { return null; }
  }

  function clearPendingOrder() {
    localStorage.removeItem('pending_order');
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return setError('Ingresa tu nombre completo');
    if (!form.correo.trim()) return setError('Ingresa tu correo electrónico');
    if (!form.fecha_nacimiento) return setError('Ingresa tu fecha de nacimiento');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.password2) return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      const pedidoId = getEffectivePendingOrderId();
      const res = await fetch(`${API_URL}/api/clientes/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:           form.nombre.trim(),
          correo:           form.correo.trim(),
          fecha_nacimiento: form.fecha_nacimiento,
          password:         form.password,
          pedido_id:        pedidoId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al registrarse');
      clearPendingOrder();
      login(data.token, data.cliente);
      onAuthSuccess?.();
      onClose();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.correo.trim() || !form.password) return setError('Completa todos los campos');
    setLoading(true);
    try {
      const pedidoId = getEffectivePendingOrderId();
      const res = await fetch(`${API_URL}/api/clientes/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo:    form.correo.trim(),
          password:  form.password,
          pedido_id: pedidoId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Error al iniciar sesión');
      clearPendingOrder();
      login(data.token, data.cliente);
      onAuthSuccess?.();
      onClose();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={() => {}}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👑</span>
              <p className="font-black text-gray-900 text-lg">El Rey del Sabor</p>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              {mode === 'register' ? 'Crea tu cuenta y accede a beneficios exclusivos' : 'Bienvenido de vuelta'}
            </p>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              {(['register', 'login'] ).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode === m ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {m === 'register' ? 'Registrarse' : 'Iniciar sesión'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {mode === 'register' ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleRegister}
                  className="space-y-3"
                >
                  {/* Nombre */}
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={form.nombre}
                      onChange={e => setField('nombre', e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>

                  {/* Correo */}
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={form.correo}
                      onChange={e => setField('correo', e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>

                  {/* Fecha de nacimiento */}
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      placeholder="Fecha de nacimiento"
                      value={form.fecha_nacimiento}
                      onChange={e => setField('fecha_nacimiento', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors text-gray-700"
                    />
                  </div>

                  {/* Contraseña */}
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      value={form.password}
                      onChange={e => setField('password', e.target.value)}
                      className="w-full pl-9 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirmar contraseña */}
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass2 ? 'text' : 'password'}
                      placeholder="Confirmar contraseña"
                      value={form.password2}
                      onChange={e => setField('password2', e.target.value)}
                      className="w-full pl-9 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass2(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-xl">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando cuenta...</>
                    ) : '¡Crear mi cuenta gratis!'}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Al registrarte aceptas nuestros términos de servicio y política de privacidad.
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={form.correo}
                      onChange={e => setField('correo', e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={form.password}
                      onChange={e => setField('password', e.target.value)}
                      className="w-full pl-9 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-xl">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Ingresando...</>
                    ) : 'Ingresar'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
