import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';
import { useConfig } from '../context/ConfigContext';
import { imgUrl } from '../utils/imgUrl';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Plural en español: lunes-viernes no cambian, sábado/domingo añaden 's'
const DIAS_PLURAL = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];

const FALLBACK_SLIDES = [
  {
    id: 'f1', type: 'image',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1920&q=90',
    title: 'Pollo a la Brasa', subtitle: 'Dorado, crujiente y lleno de sabor',
  },
  {
    id: 'f2', type: 'image',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1920&q=90',
    title: 'Receta de siempre', subtitle: 'Preparado con la mejor leña y especias',
  },
  {
    id: 'f3', type: 'image',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1920&q=90',
    title: 'Combos Familiares', subtitle: 'Pollo, papas, ensalada y bebidas para todos',
  },
  {
    id: 'f4', type: 'image',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=90',
    title: 'El sabor que nos une', subtitle: 'El lugar favorito de Lima para compartir',
  },
];

function parseDias(raw) {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return JSON.parse(raw);
  } catch { return []; }
}

function buildFrecuencia(slide) {
  const dias = parseDias(slide.dias_semana);
  if (slide.vigencia_tipo === 'dias_semana' || dias.length > 0) {
    if (!dias.length) return 'Días específicos';
    if (dias.length === 1) return `Todos los ${DIAS_PLURAL[dias[0]]}`;
    const last = DIAS_PLURAL[dias[dias.length - 1]];
    const rest = dias.slice(0, -1).map(d => DIAS_PLURAL[d]);
    return `${rest.join(', ')} y ${last}`;
  }
  if (slide.inicio_vigencia) {
    const ini = new Date(slide.inicio_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    const fin = slide.fin_vigencia
      ? new Date(slide.fin_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    return fin ? `Del ${ini} al ${fin}` : `Desde el ${ini}`;
  }
  return 'Disponible todos los días';
}

// Convierte un slide de promo al formato que espera ProductDetailModal.
// - description: texto legible con los productos incluidos (se muestra en el modal)
//   e incluye nombres/descripciones de productos para que getPresasPerCombo
//   detecte fracciones (1/4, 1/2, 3/4, entero) igual que en productos normales.
// - category: 'combos_pollo' si el título, productos o descripciones mencionan pollo/combo.
function slideToProduct(s) {
  // Texto con todos los nombres y descripciones de productos incluidos
  const productLines = s.productos
    .map(p => p.descripcion ? `${p.nombre} — ${p.descripcion}` : p.nombre)
    .join(' · ');

  // Descripción visible en modal: productos incluidos o subtítulo como fallback
  const description = productLines || s.subtitle || '';

  // Texto completo para detectar fracciones (incluye title en caso de que la fracción esté ahí)
  const allText = `${s.title} ${s.subtitle} ${productLines}`;

  const tienePollo =
    s.productos.some(p => p.categoria === 'combos_pollo') ||
    /pollo|combo|presa/i.test(allText);

  return {
    id:          `promo_${s.id}`,
    name:        s.title,
    price:       Number(s.precio || 0),
    image:       imgUrl(s.imagen_url),
    category:    tienePollo ? 'combos_pollo' : '',
    description,
  };
}

export default function Hero({ onCartOpen }) {
  const config                      = useConfig();
  const [slides, setSlides]         = useState(FALLBACK_SLIDES);
  const [isPromo, setIsPromo]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [current, setCurrent]       = useState(0);
  const [promoProduct, setPromoProduct] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/promociones`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setSlides(data.map(p => ({
            id:              p.id,
            type:            'promo',
            title:           p.titulo          || p.nombre,
            subtitle:        p.subtitulo       || '',
            discount:        p.descuento_texto || '',
            precio:          p.precio          || null,
            emoji:           p.emoji           || '',
            color:           p.color           || 'linear-gradient(135deg, #FF6B35, #C0392B)',
            imagen_url:      imgUrl(p.imagen_url),
            productos:       Array.isArray(p.productos) ? p.productos : [],
            vigencia_tipo:   p.vigencia_tipo   || 'rango',
            dias_semana:     p.dias_semana     || [],
            inicio_vigencia: p.inicio_vigencia || null,
            fin_vigencia:    p.fin_vigencia    || null,
          })));
          setIsPromo(true);
          setCurrent(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent(c => (c + 1) % slides.length);

  if (loading) return (
    <section>
      <div className="w-full bg-gray-900 animate-pulse" style={{ height: 'clamp(320px, 60vw, 580px)' }} />
    </section>
  );

  if (slides.length === 0) return null;

  return (
    <section>
      <div
        className="relative overflow-hidden w-full"
        style={{ height: 'clamp(320px, 60vw, 580px)' }}
      >
        {/* ── Slides de imagen (fallback) ── */}
        {!isPromo && slides.map((s, i) => (
          <div key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-10 max-w-6xl mx-auto">
              <h1 className="text-2xl sm:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">{s.title}</h1>
              <p className="text-white/80 text-sm sm:text-lg drop-shadow">{s.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Keyframes para animaciones del banner */}
        <style>{`
          @keyframes hero-fade-up   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
          @keyframes hero-fade-left { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
          @keyframes hero-float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-14px); } }
          @keyframes hero-orb1      { 0%,100% { transform:scale(1) translate(0,0); opacity:.10; } 50% { transform:scale(1.18) translate(-8px,6px); opacity:.18; } }
          @keyframes hero-orb2      { 0%,100% { transform:scale(1) translate(0,0); opacity:.15; } 50% { transform:scale(1.12) translate(6px,-8px); opacity:.22; } }
          @keyframes hero-pulse-ring { 0%,100% { box-shadow:0 8px 32px rgba(0,0,0,.35),0 0 0 3px rgba(255,255,255,.5); }  50% { box-shadow:0 8px 40px rgba(0,0,0,.45),0 0 0 6px rgba(255,255,255,.25); } }
          .hero-badge  { animation: hero-fade-up   .45s ease both; }
          .hero-sub    { animation: hero-fade-up   .45s .10s ease both; }
          .hero-title  { animation: hero-fade-left .50s .15s ease both; }
          .hero-price  { animation: hero-fade-up   .45s .25s ease both; }
          .hero-card   { animation: hero-fade-up   .45s .30s ease both; }
          .hero-btn    { animation: hero-fade-up   .45s .40s ease both; }
          .hero-img    { animation: hero-float 2s ease-in-out infinite; }
          .hero-orb1   { animation: hero-orb1  7s ease-in-out infinite; }
          .hero-orb2   { animation: hero-orb2  9s ease-in-out infinite; }
          .hero-btn-el { animation: hero-pulse-ring 2.5s ease-in-out infinite; }
        `}</style>

        {/* ── Slides de promo ── */}
        {isPromo && slides.map((s, i) => {
          const frecuencia   = buildFrecuencia(s);
          const esDiasSemana = (s.vigencia_tipo === 'dias_semana') || parseDias(s.dias_semana).length > 0;
          const hasta = (esDiasSemana && s.fin_vigencia)
            ? new Date(s.fin_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
            : null;

          return (
            <div key={s.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              style={{ background: s.color }}
            >
              {/* Decorativos animados */}
              <div className="hero-orb1 absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full pointer-events-none" />
              <div className="hero-orb2 absolute -bottom-28 -left-16 w-72 h-72 bg-black/15 rounded-full pointer-events-none" />
              <div className="absolute top-1/3 right-1/3 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

              {/* Contenido — key fuerza re-mount al cambiar slide para reiniciar animaciones */}
              <div key={`content-${i}-${current}`} className="absolute inset-0 flex items-center max-w-6xl mx-auto px-5 sm:px-10 gap-8 lg:gap-14">

                {/* Columna izquierda */}
                <div className="flex-1 min-w-0 py-3 sm:py-5 flex flex-col gap-2 sm:gap-3">

                  {/* Badges */}
                  <div className={`hero-badge flex flex-wrap gap-2 ${i !== current ? 'opacity-0' : ''}`}>
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                      🎯 Promo Especial
                    </span>
                    {frecuencia && (
                      <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full">
                        🗓 {frecuencia}
                      </span>
                    )}
                    {hasta && (
                      <span className="inline-flex items-center gap-1 bg-black/20 text-white/80 text-[10px] sm:text-xs px-3 py-1.5 rounded-full">
                        ⏰ Hasta el {hasta}
                      </span>
                    )}
                  </div>

                  {s.subtitle && (
                    <p className={`hero-sub text-white/75 text-xs sm:text-sm font-medium tracking-wide -mb-1 ${i !== current ? 'opacity-0' : ''}`}>{s.subtitle}</p>
                  )}

                  <h1 className={`hero-title text-2xl sm:text-4xl lg:text-6xl font-black text-white leading-[0.92] tracking-tight drop-shadow-xl ${i !== current ? 'opacity-0' : ''}`}>
                    {s.title}
                  </h1>

                  {/* Precio */}
                  {(s.discount || s.precio) && (
                    <div className={`hero-price flex items-center gap-3 flex-wrap ${i !== current ? 'opacity-0' : ''}`}>
                      {s.discount && (
                        <span className="bg-white text-gray-900 font-black text-lg sm:text-2xl px-4 sm:px-5 py-2 rounded-2xl shadow-2xl shadow-black/30 leading-none">
                          {s.discount}
                        </span>
                      )}
                      {s.precio && (
                        <div className="flex flex-col leading-none">
                          <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Precio especial</span>
                          <span className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">
                            S/ {Number(s.precio).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Productos — oculto en móvil para no desbordar el banner */}
                  {s.productos?.length > 0 && (
                    <div className={`hero-card hidden sm:block bg-black/25 backdrop-blur-md rounded-2xl px-4 py-3 space-y-2 max-w-sm border border-white/10 ${i !== current ? 'opacity-0' : ''}`}>
                      <p className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-black">
                        ✦ Incluye
                      </p>
                      {s.productos.map((p, idx) => (
                        <div key={p.id ?? idx} className="flex gap-2 items-start">
                          <span className="text-white/40 text-xs mt-0.5 shrink-0">•</span>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-xs sm:text-sm leading-tight">{p.nombre}</p>
                            {p.descripcion && (
                              <p className="text-white/60 text-[10px] sm:text-xs leading-snug mt-0.5">{p.descripcion}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón CTA */}
                  <div className={`hero-btn pt-1 ${i !== current ? 'opacity-0' : ''}`}>
                    <button
                      onClick={() => setPromoProduct(slideToProduct(s))}
                      className="hero-btn-el cursor-pointer relative inline-flex items-center gap-3 font-black text-sm sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden group"
                      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)', color: '#111' }}
                    >
                      {/* Shimmer animado */}
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                      <span className="relative flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:rotate-12 transition-transform duration-200">
                          <Plus size={15} className="text-white" strokeWidth={3} />
                        </span>
                        <span>Pedir ahora</span>
                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform duration-200">→</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Columna derecha: imagen */}
                {s.imagen_url ? (
                  <div className="hero-img hidden sm:flex shrink-0 items-center justify-center relative"
                    style={{ width: '300px', height: '300px' }}
                  >
                    {/* Glow difuso detrás */}
                    <div className="absolute inset-0 rounded-full bg-white/25 blur-3xl scale-125 pointer-events-none" />
                    {/* Anillos decorativos */}
                    <div className="absolute -inset-3 rounded-full border border-white/15 pointer-events-none z-10" />
                    <div className="absolute -inset-1.5 rounded-full border border-white/25 pointer-events-none z-10" />
                    {/* Imagen circular */}
                    <div className="relative z-10 w-full h-full rounded-full overflow-hidden"
                      style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.35), 0 24px 56px rgba(0,0,0,0.45)' }}
                    >
                      <img
                        src={s.imagen_url}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Lustre sutil */}
                      <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
                    </div>
                  </div>
                ) : s.emoji ? (
                  <div
                    className="hero-img hidden sm:flex shrink-0 w-40 items-center justify-center text-[7rem] select-none"
                    style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' }}
                  >
                    {s.emoji}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* Navegación */}
        {slides.length > 1 && (
          <>
            <button onClick={prev} aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all shadow-lg">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all shadow-lg">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-100">
        <div className="flex items-stretch divide-x divide-gray-100 max-w-6xl mx-auto">
          {[
            { label: config.delivery_tiempo, desc: 'Delivery'              },
            { label: '4.9 / 5',             desc: 'Calificación'          },
            { label: 'Abierto',             desc: config.horario_resumen  },
          ].map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-center px-2 sm:px-5 py-2.5 sm:py-3.5">
              <span className="font-bold text-gray-900 text-xs sm:text-base leading-none">{s.label}</span>
              <span className="text-gray-400 text-[10px] sm:text-xs mt-0.5 text-center">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de personalización de promo */}
      {promoProduct && (
        <ProductDetailModal
          product={promoProduct}
          onClose={() => setPromoProduct(null)}
          onGoToCheckout={() => {
            setPromoProduct(null);
            if (onCartOpen) onCartOpen();
          }}
        />
      )}
    </section>
  );
}
