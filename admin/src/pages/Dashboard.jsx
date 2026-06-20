import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Bike,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Calendar, XCircle, Target, Minus, Tag,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Colores ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  recepcionado: '#F59E0B',
  enviado:      '#8B5CF6',
  merma:        '#EF4444',
  entregado:    '#22C55E',
};
const STATUS_LABEL = {
  recepcionado: 'En preparación',
  enviado:      'En camino',
  merma:        'Merma',
  entregado:    'Entregado',
};
const PIE_COLORS = ['#F59E0B', '#8B5CF6', '#EF4444', '#22C55E'];

// ── Helpers de fecha Lima ─────────────────────────────────────────
function limaNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
}
function limaStr(d) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}
function fmtDate(d, opts) {
  return new Date(d).toLocaleDateString('es-PE', { timeZone: 'America/Lima', ...opts });
}

// ── Período a partir de filtro + offset ───────────────────────────
function getPeriod(filtro, offset) {
  const now = limaNow();
  switch (filtro) {
    case 'dia': {
      const d = new Date(now); d.setDate(d.getDate() + offset);
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: fmtDate(d, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) };
    }
    case 'semana': {
      const wd  = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const mon = new Date(now); mon.setDate(now.getDate() - wd + offset * 7); mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
      const short = { day: '2-digit', month: 'short' };
      return { start: mon, end: sun, label: `${fmtDate(mon, short)} – ${fmtDate(sun, { ...short, year: 'numeric' })}` };
    }
    case 'mes': {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const s = new Date(d.getFullYear(), d.getMonth(), 1);
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s, end: e, label: fmtDate(d, { month: 'long', year: 'numeric' }) };
    }
    case 'año': {
      const y = now.getFullYear() + offset;
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999), label: String(y) };
    }
    default: return { start: now, end: now, label: '' };
  }
}

// ── Construcción de datos del gráfico ─────────────────────────────
function buildChartData(orders, filtro, start, end) {
  switch (filtro) {
    case 'dia': {
      const b = {};
      for (let h = 8; h <= 23; h++) b[h] = { label: `${h}:00`, pedidos: 0, ingresos: 0 };
      orders.forEach(o => {
        const h = parseInt(new Date(o.hora_pedido).toLocaleString('en-US', { timeZone: 'America/Lima', hour: 'numeric', hour12: false }));
        if (b[h]) { b[h].pedidos++; b[h].ingresos += Number(o.total); }
      });
      return Object.values(b);
    }
    case 'semana': {
      const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const b = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        b[limaStr(d)] = { label: DAYS[i], pedidos: 0, ingresos: 0 };
      }
      orders.forEach(o => {
        const k = limaStr(o.hora_pedido);
        if (b[k]) { b[k].pedidos++; b[k].ingresos += Number(o.total); }
      });
      return Object.values(b);
    }
    case 'mes': {
      const dim = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const b = {};
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(start.getFullYear(), start.getMonth(), d);
        b[limaStr(dt)] = { label: String(d), pedidos: 0, ingresos: 0 };
      }
      orders.forEach(o => {
        const k = limaStr(o.hora_pedido);
        if (b[k]) { b[k].pedidos++; b[k].ingresos += Number(o.total); }
      });
      return Object.values(b);
    }
    case 'año': {
      const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const b = Array.from({ length: 12 }, (_, i) => ({ label: MONTHS[i], pedidos: 0, ingresos: 0 }));
      orders.forEach(o => {
        const m = parseInt(new Date(o.hora_pedido).toLocaleString('en-US', { timeZone: 'America/Lima', month: 'numeric' })) - 1;
        if (b[m]) { b[m].pedidos++; b[m].ingresos += Number(o.total); }
      });
      return b;
    }
    default: return [];
  }
}

function buildCustomChartData(orders) {
  const b = {};
  orders.forEach(o => {
    const k = limaStr(o.hora_pedido);
    if (!b[k]) b[k] = { label: fmtDate(o.hora_pedido, { day: '2-digit', month: 'short' }), pedidos: 0, ingresos: 0 };
    b[k].pedidos++;
    b[k].ingresos += Number(o.total);
  });
  return Object.values(b).sort((a, b) => a.label.localeCompare(b.label));
}

// ── Tooltip personalizado ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name === 'ingresos' ? 'Ingresos' : 'Pedidos'}:</span>
          <span className="text-white font-bold">
            {p.name === 'ingresos' ? `S/ ${Number(p.value).toFixed(2)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Tarjeta KPI ───────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color, trend }) {
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-500';
  const TrendIcon  = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-500/15`}>
          <Icon size={17} className={`text-${color}-400`} />
        </div>
      </div>
      <p className="text-3xl font-black text-white leading-none">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs">{sub}</p>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
            <TrendIcon size={12} />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────
const FILTROS = [
  { key: 'dia',    label: 'Hoy'      },
  { key: 'semana', label: 'Semana'   },
  { key: 'mes',    label: 'Mes'      },
  { key: 'año',    label: 'Año'      },
  { key: 'custom', label: '📅 Rango' },
];

export default function Dashboard({ orders, motorizados = [] }) {
  const [filtro, setFiltro]           = useState('dia');
  const [offset, setOffset]           = useState(0);
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [promos, setPromos]           = useState([]);

  const isCustom   = filtro === 'custom';
  const period     = useMemo(() => isCustom ? null : getPeriod(filtro, offset),     [filtro, offset, isCustom]);
  const prevPeriod = useMemo(() => isCustom ? null : getPeriod(filtro, offset - 1), [filtro, offset, isCustom]);
  const canNext    = !isCustom && offset < 0;

  // Fetch promociones del endpoint público (el mismo que usa el Hero del ecommerce)
  useEffect(() => {
    fetch(`${API_URL}/api/promociones`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPromos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Filtrar pedidos del período
  const filtered = useMemo(() => {
    if (isCustom) {
      if (!customStart || !customEnd) return [];
      const s = new Date(customStart + 'T00:00:00');
      const e = new Date(customEnd   + 'T23:59:59');
      return orders.filter(o => { const t = new Date(o.hora_pedido); return t >= s && t <= e; });
    }
    return orders.filter(o => { const t = new Date(o.hora_pedido); return t >= period.start && t <= period.end; });
  }, [orders, filtro, period, customStart, customEnd, isCustom]);

  const prevFiltered = useMemo(() => {
    if (isCustom || !prevPeriod) return [];
    return orders.filter(o => { const t = new Date(o.hora_pedido); return t >= prevPeriod.start && t <= prevPeriod.end; });
  }, [orders, prevPeriod, isCustom]);

  // KPIs
  const kpis = useMemo(() => {
    const revenue      = filtered.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue  = prevFiltered.reduce((s, o) => s + Number(o.total), 0);
    const avg          = filtered.length ? revenue / filtered.length : 0;
    const entregados   = filtered.filter(o => o.estado_nombre === 'entregado').length;
    const mermas       = filtered.filter(o => o.estado_nombre === 'merma').length;
    const completados  = entregados + mermas;
    const tasa         = completados ? (entregados / completados) * 100 : 0;

    const trendCount   = prevFiltered.length ? ((filtered.length - prevFiltered.length) / prevFiltered.length) * 100 : null;
    const trendRevenue = prevRevenue          ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

    return { revenue, avg, entregados, mermas, tasa, trendCount, trendRevenue };
  }, [filtered, prevFiltered]);

  // Estado distribución
  const statusDist = useMemo(() => {
    const counts = {};
    filtered.forEach(o => { counts[o.estado_nombre] = (counts[o.estado_nombre] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Datos del gráfico
  const chartData = useMemo(() => {
    if (isCustom) return buildCustomChartData(filtered);
    if (!period) return [];
    return buildChartData(filtered, filtro, period.start, period.end);
  }, [filtered, filtro, period, isCustom]);

  const xInterval = { dia: 2, semana: 0, mes: 5, año: 0 }[filtro] ?? 0;

  const motoStats = useMemo(() => {
    const enCamino   = filtered.filter(o => o.estado_nombre === 'enviado').length;
    const sinAsignar = filtered.filter(o => o.estado_nombre === 'recepcionado' && !o.motorizado_id).length;
    const byMoto = {};
    filtered.filter(o => o.motorizado_id).forEach(o => {
      if (!byMoto[o.motorizado_id]) byMoto[o.motorizado_id] = { id: o.motorizado_id, nombre: o.motorizado_nombre, count: 0, ingresos: 0 };
      byMoto[o.motorizado_id].count++;
      byMoto[o.motorizado_id].ingresos += Number(o.total);
    });
    const ranking = Object.values(byMoto).sort((a, b) => b.count - a.count);
    const motosActivos = Object.keys(byMoto).length;
    return { motosActivos, total: motorizados.length, enCamino, sinAsignar, ranking };
  }, [motorizados, filtered]);

  // Top productos del período — extrae items del campo descripcion de cada pedido
  // Espeja la lógica de ProductGrid/ProductCard del ecommerce usando los datos ya cargados
  const topProducts = useMemo(() => {
    const map = {};
    filtered.forEach(order => {
      try {
        const desc = typeof order.descripcion === 'string'
          ? JSON.parse(order.descripcion)
          : (order.descripcion || {});
        (desc.items || []).forEach(item => {
          if (!map[item.name]) {
            map[item.name] = { name: item.name, image: item.image || '', qty: 0, ingresos: 0 };
          }
          map[item.name].qty      += item.qty;
          map[item.name].ingresos += item.price * item.qty;
        });
      } catch {}
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [filtered]);

  const periodLabel = isCustom
    ? (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Selecciona rango')
    : period?.label ?? '';

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Análisis de operaciones · El Rey del Sabor</p>
        </div>

        <div className="flex flex-col gap-2 items-start sm:items-end">
          {/* Filtros */}
          <div className="flex overflow-x-auto bg-slate-800 border border-slate-700 rounded-2xl p-1 gap-1 scrollbar-hide">
            {FILTROS.map(f => (
              <button
                key={f.key}
                onClick={() => { setFiltro(f.key); setOffset(0); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filtro === f.key
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Navegación de período */}
          {!isCustom && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 w-full sm:w-auto">
              <button
                onClick={() => setOffset(o => o - 1)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-slate-200 text-xs font-semibold flex-1 text-center min-w-0 px-2 truncate">
                {periodLabel}
              </span>
              <button
                onClick={() => setOffset(o => o + 1)}
                disabled={!canNext}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Selector de rango personalizado */}
          {isCustom && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-orange-400 shrink-0" />
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none"
              />
              <span className="text-slate-600">→</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label="Pedidos"
          value={filtered.length}
          sub={prevFiltered.length ? `Período anterior: ${prevFiltered.length}` : 'Sin período anterior'}
          icon={ShoppingBag}
          color="orange"
          trend={kpis.trendCount}
        />
        <KPICard
          label="Ingresos"
          value={`S/ ${kpis.revenue.toFixed(2)}`}
          sub={prevFiltered.length ? `Anterior: S/ ${prevFiltered.reduce((s, o) => s + Number(o.total), 0).toFixed(2)}` : '—'}
          icon={DollarSign}
          color="green"
          trend={kpis.trendRevenue}
        />
        <KPICard
          label="Ticket Promedio"
          value={`S/ ${kpis.avg.toFixed(2)}`}
          sub={`${filtered.length} pedido${filtered.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          color="purple"
          trend={null}
        />
        <KPICard
          label="Tasa de Éxito"
          value={`${kpis.tasa.toFixed(1)}%`}
          sub={`${kpis.entregados} entregados · ${kpis.mermas} merma${kpis.mermas !== 1 ? 's' : ''}`}
          icon={Target}
          color="teal"
          trend={null}
        />
      </div>

      {/* ── Estado operacional ── */}
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Estado operacional · {periodLabel}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sin asignar', value: motoStats.sinAsignar, icon: AlertCircle, color: 'red',    sub: 'requieren acción', urgent: motoStats.sinAsignar > 0 },
            { label: 'En camino',   value: motoStats.enCamino,   icon: Bike,         color: 'purple', sub: 'pedidos en tránsito' },
            { label: 'Mermas',      value: kpis.mermas,           icon: XCircle,      color: 'amber',  sub: 'del período' },
            { label: 'Motorizados', value: `${motoStats.motosActivos}/${motoStats.total}`, icon: CheckCircle, color: 'green', sub: 'activos en período' },
          ].map((item, i) => (
            <div key={i} className={`bg-slate-800 rounded-2xl p-4 border transition-all ${item.urgent ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <item.icon size={16} className={`text-${item.color}-400`} />
                {item.urgent && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
              </div>
              <p className={`text-2xl font-black ${item.urgent ? 'text-red-400' : 'text-white'}`}>{item.value}</p>
              <p className="text-slate-400 text-xs font-semibold mt-1">{item.label}</p>
              <p className="text-slate-600 text-xs">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promociones visibles para clientes (espeja el Hero del ecommerce) ── */}
      {promos.length > 0 && (
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Tag size={12} className="text-orange-400" />
            Promociones visibles para clientes
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {promos.map(promo => (
              <div
                key={promo.id}
                className="relative shrink-0 w-48 rounded-2xl p-4 overflow-hidden"
                style={{ background: promo.color || 'linear-gradient(to right, #f97316, #dc2626)' }}
              >
                {/* Círculo decorativo igual al del ecommerce Hero */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="relative">
                  {promo.subtitulo && (
                    <p className="text-white/70 text-[10px] leading-tight truncate">{promo.subtitulo}</p>
                  )}
                  <p className="text-white font-black text-sm leading-tight mt-0.5 line-clamp-2">{promo.titulo}</p>
                  {promo.descuento_texto && (
                    <p className="text-white/90 text-xl font-black mt-1 leading-none">{promo.descuento_texto}</p>
                  )}
                  {promo.precio && (
                    <p className="text-white font-bold text-sm mt-0.5">S/ {Number(promo.precio).toFixed(2)}</p>
                  )}
                  <div className="text-2xl mt-2 leading-none">{promo.emoji || '🎯'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gráfica combinada Pedidos + Ingresos ── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold">Actividad del período</h3>
            <p className="text-slate-500 text-xs mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500/80" />
              <span className="text-slate-400">Pedidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-400 rounded" />
              <span className="text-slate-400">Ingresos S/</span>
            </div>
          </div>
        </div>
        {chartData.length === 0 || filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <ShoppingBag size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Sin datos en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F97316" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={xInterval}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `S/${v}`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="pedidos" fill="url(#barGrad)" radius={[5, 5, 0, 0]} maxBarSize={32} />
              <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#22C55E" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#22C55E' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Fila inferior: distribución · motorizados · productos más pedidos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Distribución de estados */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <h3 className="text-white font-bold mb-4">Distribución de estados</h3>
          {statusDist.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Sin datos</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {statusDist.map((e, i) => (
                      <Cell key={i} fill={STATUS_COLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }}
                    formatter={(v, _, p) => [v, STATUS_LABEL[p.payload.name] || p.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {statusDist.map((e, i) => {
                  const color = STATUS_COLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length];
                  const pct   = filtered.length ? ((e.value / filtered.length) * 100).toFixed(0) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-slate-400 text-xs">{STATUS_LABEL[e.name] || e.name}</span>
                        </div>
                        <span className="text-white text-xs font-bold">{e.value} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ranking motorizados */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Rendimiento motorizados</h3>
            <span className="text-slate-500 text-xs">{periodLabel}</span>
          </div>
          {motoStats.ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 gap-2">
              <Bike size={28} className="opacity-30" />
              <p className="text-sm">Sin datos de motorizados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {motoStats.ranking.map((m, i) => {
                const maxCount = motoStats.ranking[0].count;
                const pct      = maxCount ? (m.count / maxCount) * 100 : 0;
                const medals   = ['🥇', '🥈', '🥉'];
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{medals[i] || `#${i + 1}`}</span>
                        <span className="text-white text-sm font-semibold truncate max-w-32">{m.nombre || `Motorizado #${m.id}`}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-orange-400 font-black text-sm">{m.count}</span>
                        <span className="text-slate-500 text-xs ml-1">ped.</span>
                        <span className="text-green-400 text-xs ml-2">S/ {m.ingresos.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#F97316' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Productos más pedidos */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Productos más pedidos</h3>
            <span className="text-slate-500 text-xs">{periodLabel}</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 gap-2">
              <ShoppingBag size={28} className="opacity-30" />
              <p className="text-sm">Sin datos de productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="pb-2.5 pr-2 text-left font-semibold w-7">#</th>
                    <th className="pb-2.5 text-left font-semibold">Producto</th>
                    <th className="pb-2.5 px-3 text-right font-semibold">Uds.</th>
                    <th className="pb-2.5 text-right font-semibold">S/</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <tr key={p.name} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 pr-2 text-sm leading-none">{medals[i] || <span className="text-slate-500 font-bold text-xs">#{i + 1}</span>}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-700/60" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-sm">🍗</div>
                            )}
                            <span className="text-white text-xs font-semibold truncate max-w-25 lg:max-w-20 xl:max-w-30">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="text-orange-400 font-black text-sm">{p.qty}</span>
                          <span className="text-slate-500 text-xs ml-0.5">u</span>
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <span className="text-green-400 font-bold text-xs">{p.ingresos.toFixed(0)}</span>
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
    </div>
  );
}
