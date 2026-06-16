import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FALLBACK_SLIDES = [
  {
    id: 'f1',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1920&q=90',
    title: 'Pollo a la Brasa',
    subtitle: 'Dorado, crujiente y lleno de sabor',
  },
  {
    id: 'f2',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1920&q=90',
    title: 'Receta de siempre',
    subtitle: 'Preparado con la mejor leña y especias',
  },
  {
    id: 'f3',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1920&q=90',
    title: 'Combos Familiares',
    subtitle: 'Pollo, papas, ensalada y bebidas para todos',
  },
  {
    id: 'f4',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=90',
    title: 'El sabor que nos une',
    subtitle: 'El lugar favorito de Lima para compartir',
  },
];


export default function Hero() {
  const [slides, setSlides]   = useState(FALLBACK_SLIDES);
  const [isPromo, setIsPromo] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/promociones`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setSlides(data.map(p => ({
            id:       p.id,
            type:     'promo',
            title:    p.titulo    || p.nombre,
            subtitle: p.subtitulo || '',
            discount: p.descuento_texto || '',
            emoji:    p.emoji    || '🍗',
            color:    p.color    || 'from-orange-500 to-red-600',
          })));
          setIsPromo(true);
          setCurrent(0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent(c => (c + 1) % slides.length);

  if (slides.length === 0) return null;

  return (
    <section>
      {/* ── Slider ── */}
      <div
        className="relative overflow-hidden w-full"
        style={{ height: 'clamp(220px, 48vw, 440px)' }}
      >
        {/* Image slides */}
        {!isPromo && slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-8 max-w-6xl mx-auto">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-1 sm:mb-2 drop-shadow">
                {s.title}
              </h1>
              <p className="text-white/80 text-sm sm:text-base drop-shadow">
                {s.subtitle}
              </p>
            </div>
          </div>
        ))}

        {/* Promo slides */}
        {isPromo && slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 bg-linear-to-r ${s.color} ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div className="absolute inset-0 flex items-end p-5 sm:p-8 max-w-6xl mx-auto">
              <div className="text-white">
                <h1 className="text-2xl sm:text-4xl font-bold mb-1">{s.title}</h1>
                <p className="text-white/80 text-sm sm:text-base">{s.subtitle}</p>
                {s.discount && (
                  <p className="text-3xl sm:text-4xl font-black mt-2">{s.discount}</p>
                )}
              </div>
              <div className="hidden sm:block text-8xl ml-auto select-none">{s.emoji}</div>
            </div>
          </div>
        ))}

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="flex items-stretch min-w-max max-w-6xl mx-auto px-4">
          {[
            { label: '30–40 min', desc: 'Delivery'            },
            { label: '4.9 / 5',  desc: 'Calificación'        },
            { label: 'Abierto',  desc: 'Lun–Dom · 11am–10pm' },
          ].map((s, i, arr) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center px-5 py-3 sm:py-3.5 shrink-0 ${i < arr.length - 1 ? 'border-r border-gray-100' : ''}`}
            >
              <span className="font-bold text-gray-900 text-sm sm:text-base leading-none">{s.label}</span>
              <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
