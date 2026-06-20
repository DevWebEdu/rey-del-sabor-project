import { useState, useEffect } from 'react';
import { Save, Phone, MapPin, Clock, Globe, MessageCircle, Truck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEFAULTS = {
  nombre_local:    'El Rey del Sabor',
  whatsapp:        '51999999999',
  telefono:        '+51 999 999 999',
  direccion:       'Av. Principal 123, Lima, Perú',
  horario_semana:  '11:00 am – 10:00 pm',
  horario_sabado:  '11:00 am – 11:00 pm',
  horario_domingo: '11:00 am – 10:00 pm',
  horario_resumen: 'Lun–Dom · 11am–10pm',
  delivery_tiempo: '30–40 min',
  delivery_radio:  '2 km',
  pedido_minimo:   '24',
};

const inputCls = 'w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-orange-500 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors placeholder-slate-600';

export default function Configuracion() {
  const { token }             = useAuth();
  const [config, setConfig]   = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(r => r.json())
      .then(data => setConfig({ ...DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setConfig(c => ({ ...c, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(config),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig({ ...DEFAULTS, ...updated });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configuración</h1>
          <p className="text-slate-400 text-sm mt-0.5">Datos del local visibles en el ecommerce</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shrink-0 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-linear-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/20'
          }`}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {/* ── Información del local ── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Globe size={13} className="text-orange-400" />
          </div>
          <p className="text-white font-bold text-sm">Información del local</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Nombre del restaurante</label>
          <input type="text" value={config.nombre_local} onChange={set('nombre_local')}
            placeholder="El Rey del Sabor" className={inputCls} />
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Dirección</label>
          <input type="text" value={config.direccion} onChange={set('direccion')}
            placeholder="Av. Principal 123, Lima, Perú" className={inputCls} />
          <div className="flex items-start gap-2 mt-2 bg-slate-900/60 rounded-xl px-3 py-2">
            <MapPin size={12} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-slate-500 text-xs">{config.direccion || 'Sin dirección configurada'}</p>
          </div>
        </div>
      </div>

      {/* ── Contacto ── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={13} className="text-green-400" />
          </div>
          <p className="text-white font-bold text-sm">Contacto</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Teléfono visible</label>
          <input type="text" value={config.telefono} onChange={set('telefono')}
            placeholder="+51 999 123 456" className={inputCls} />
        </div>
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">
            WhatsApp para consulta de pedidos
          </label>
          <input type="text" value={config.whatsapp} onChange={set('whatsapp')}
            placeholder="51999123456" className={inputCls} />
          <p className="text-slate-600 text-xs mt-1.5">
            Solo números, sin +. Ej: <span className="text-slate-500">51999123456</span> (código de país + número). Se usa en el botón al confirmar un pedido.
          </p>
          <a
            href={`https://wa.me/${config.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-green-400 text-xs hover:text-green-300 transition-colors"
          >
            <MessageCircle size={12} />
            Probar enlace: wa.me/{config.whatsapp}
          </a>
        </div>
      </div>

      {/* ── Horarios ── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={13} className="text-blue-400" />
          </div>
          <p className="text-white font-bold text-sm">Horarios</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Lunes – Viernes</label>
            <input type="text" value={config.horario_semana} onChange={set('horario_semana')}
              placeholder="11:00 am – 10:00 pm" className={inputCls} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Sábado</label>
            <input type="text" value={config.horario_sabado} onChange={set('horario_sabado')}
              placeholder="11:00 am – 11:00 pm" className={inputCls} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Domingo</label>
            <input type="text" value={config.horario_domingo} onChange={set('horario_domingo')}
              placeholder="11:00 am – 10:00 pm" className={inputCls} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Resumen en banner</label>
            <input type="text" value={config.horario_resumen} onChange={set('horario_resumen')}
              placeholder="Lun–Dom · 11am–10pm" className={inputCls} />
            <p className="text-slate-600 text-xs mt-1">Texto corto en la barra del Hero</p>
          </div>
        </div>
      </div>

      {/* ── Delivery ── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-purple-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Truck size={13} className="text-purple-400" />
          </div>
          <p className="text-white font-bold text-sm">Delivery</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Tiempo estimado</label>
            <input type="text" value={config.delivery_tiempo} onChange={set('delivery_tiempo')}
              placeholder="30–40 min" className={inputCls} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Radio máximo</label>
            <input type="text" value={config.delivery_radio} onChange={set('delivery_radio')}
              placeholder="2 km" className={inputCls} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Pedido mínimo S/</label>
            <input type="number" value={config.pedido_minimo} onChange={set('pedido_minimo')}
              placeholder="24" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Vista previa ecommerce ── */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">Vista previa — Ecommerce</p>

        {/* Stats bar Hero */}
        <p className="text-slate-600 text-[10px] mb-1.5 uppercase tracking-widest">Barra de stats (Hero)</p>
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <div className="flex divide-x divide-gray-100">
            {[
              { label: config.delivery_tiempo || '—', desc: 'Delivery' },
              { label: '4.9 / 5',                     desc: 'Calificación' },
              { label: 'Abierto',                      desc: config.horario_resumen || '—' },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center px-3 py-2.5">
                <span className="font-bold text-gray-900 text-xs leading-none">{s.label}</span>
                <span className="text-gray-400 text-[10px] mt-0.5 text-center">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer preview */}
        <p className="text-slate-600 text-[10px] mb-1.5 uppercase tracking-widest">Footer</p>
        <div className="bg-white rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-gray-800">{config.nombre_local || '—'}</p>
            <p className="text-gray-400 flex items-start gap-1.5"><MapPin size={11} className="mt-0.5 shrink-0 text-gray-300" />{config.direccion || '—'}</p>
            <p className="text-gray-400 flex items-center gap-1.5"><Phone size={11} className="shrink-0 text-gray-300" />{config.telefono || '—'}</p>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-gray-700">Horarios</p>
            <p className="text-gray-400">Lun–Vie: {config.horario_semana || '—'}</p>
            <p className="text-gray-400">Sáb: {config.horario_sabado || '—'}</p>
            <p className="text-gray-400">Dom: {config.horario_domingo || '—'}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
