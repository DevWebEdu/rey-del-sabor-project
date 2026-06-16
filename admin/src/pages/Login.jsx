import { useState } from 'react';
import { Flame, Mail, Lock, Eye, EyeOff, ShoppingBag, BarChart2, Bike, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FEATURES = [
  { icon: ShoppingBag, label: 'Control de pedidos en tiempo real',   desc: 'Monitorea y gestiona cada pedido al instante' },
  { icon: Bike,        label: 'Seguimiento de motorizados',          desc: 'Asigna y rastrea tus repartidores' },
  { icon: BarChart2,   label: 'Dashboard de productividad',          desc: 'Métricas clave para tomar mejores decisiones' },
  { icon: Users,       label: 'Gestión de clientes y usuarios',      desc: 'Administra accesos y fideliza clientes' },
];

export default function Login() {
  const { login }                     = useAuth();
  const [email, setEmail]             = useState('admin@reydelsabor.com');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales incorrectas');
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Panel izquierdo (brand) — solo desktop ── */}
      <div className="hidden lg:flex w-[44%] xl:w-[40%] relative flex-col justify-between overflow-hidden border-r border-slate-800/60 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-12">

        {/* Decoración de fondo */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-1/3 -left-24 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-40 h-40 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />

        {/* Contenido */}
        <div className="relative space-y-14">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Flame size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xl leading-tight">El Rey del Sabor</p>
              <p className="text-slate-500 text-sm">Sistema de Gestión</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1]">
              Gestiona tu<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-400">
                restaurante
              </span><br />
              con precisión.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Monitorea pedidos, controla tus motorizados y analiza el desempeño de tu negocio en un solo lugar.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-slate-200 text-sm font-semibold leading-tight">{f.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-700 text-xs">
          © {new Date().getFullYear()} El Rey del Sabor · Panel de Administración
        </p>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-900">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/25">
              <Flame size={28} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-xl">El Rey del Sabor</p>
              <p className="text-slate-500 text-sm">Panel de Administración</p>
            </div>
          </div>

          {/* Header del form */}
          <div>
            <h1 className="text-3xl font-black text-white">Bienvenido</h1>
            <p className="text-slate-400 text-sm mt-1.5">Ingresa tus credenciales para acceder al panel</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-orange-500 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-orange-500 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="text-red-400 text-lg leading-none shrink-0">⚠</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Hint credenciales */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">Acceso por defecto</p>
            <p className="text-slate-400 text-xs font-mono">admin@reydelsabor.com</p>
            <p className="text-slate-500 text-xs font-mono">admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
