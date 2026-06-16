import { useState, useEffect, useRef, lazy, Suspense, memo } from 'react';
import { categories } from '../data/products';
import { Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductDetailModal = lazy(() => import('./ProductDetailModal'));
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiToLocal = (p) => ({
  id:          p.id,
  name:        p.nombre,
  description: p.descripcion || '',
  price:       Number(p.precio),
  category:    p.categoria || 'combos_pollo',
  image:       p.imagen_url || '',
});

// ── Skeleton ──────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="w-36 sm:w-44 shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="aspect-4/3 shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 shimmer rounded-full w-4/5" />
        <div className="h-3 shimmer rounded-full w-1/2" />
        <div className="h-7 shimmer rounded-lg mt-2" />
      </div>
    </div>
  );
}

// ── Tarjeta de producto ───────────────────────────────────────────────
const ProductCard = memo(function ProductCard({ product, onGoToCheckout, index = 0 }) {
  const { items }                 = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [flash, setFlash]         = useState(false);
  const inCart = items.find(i => i.id === product.id);

  function handleAdd(e) {
    e.stopPropagation();
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
    setModalOpen(true);
  }

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        style={{ animationDelay: `${index * 35}ms` }}
        className="fade-in-up relative bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-md transition-all duration-200 group w-36 sm:w-44 shrink-0"
      >
        {/* Imagen */}
        <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl select-none bg-orange-50">🍗</div>
          )}
          {inCart && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {inCart.qty}×
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5">
          <h3 className="font-semibold text-gray-900 text-[13px] leading-snug line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-orange-500 font-bold text-sm">
              S/ {product.price.toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              aria-label={`Agregar ${product.name}`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${
                flash ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {flash ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Suspense fallback={null}>
          <ProductDetailModal
            product={product}
            onClose={() => setModalOpen(false)}
            onGoToCheckout={onGoToCheckout}
          />
        </Suspense>
      )}
    </>
  );
});

// ── Categoría con carrusel ─────────────────────────────────────────────
function CategoryRow({ cat, onGoToCheckout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const trackRef                = useRef(null);
  const [canPrev, setCanPrev]   = useState(false);
  const [canNext, setCanNext]   = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: 1, limit: 30 });
    if (cat.id !== 'all') params.set('categoria', cat.id);
    fetch(`${API_URL}/api/productos?${params}`)
      .then(r => r.json())
      .then(json => setProducts((json.data || []).map(apiToLocal)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [cat.id]);

  const checkBounds = () => {
    const el = trackRef.current;
    if (!el) return;
    const over = el.scrollWidth > el.clientWidth + 8;
    setCanPrev(over && el.scrollLeft > 8);
    setCanNext(over && el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(checkBounds);
    el.addEventListener('scroll', checkBounds, { passive: true });
    window.addEventListener('resize', checkBounds);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', checkBounds);
      window.removeEventListener('resize', checkBounds);
    };
  }, [products]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? (card.offsetWidth + 12) * 2 : 360;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <div className="mb-10 sm:mb-14">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cat.emoji}</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{cat.label}</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {products.length} opción{products.length !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Flechas desktop */}
        <div className={`hidden sm:flex items-center gap-1 transition-opacity ${canPrev || canNext ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canNext}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-4 sm:mb-5 mx-4 sm:mx-6" />

      {/* Carrusel */}
      <div className="relative">
        {/* Flecha izquierda móvil */}
        {canPrev && (
          <button
            onClick={() => scroll(-1)}
            className="sm:hidden absolute left-1 top-1/2 -translate-y-6 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {loading ? (
          <div className="flex gap-3 px-4 sm:px-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-3 px-4 sm:px-6 overflow-x-auto scrollbar-hide scroll-smooth pb-1"
          >
            {products.map((p, i) => (
              <div key={p.id} data-card>
                <ProductCard product={p} onGoToCheckout={onGoToCheckout} index={i} />
              </div>
            ))}
          </div>
        )}

        {/* Flecha derecha móvil */}
        {canNext && (
          <button
            onClick={() => scroll(1)}
            className="sm:hidden absolute right-1 top-1/2 -translate-y-6 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Grid principal ────────────────────────────────────────────────────
export default function ProductGrid({ onGoToCheckout }) {
  const cats = categories.filter(c => c.id !== 'all');
  return (
    <section className="max-w-6xl mx-auto py-6 sm:py-10">
      {cats.map(cat => (
        <CategoryRow key={cat.id} cat={cat} onGoToCheckout={onGoToCheckout} />
      ))}
    </section>
  );
}
