import { useState, lazy, Suspense, memo } from 'react';
import { Plus, Star, Clock, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductDetailModal = lazy(() => import('./ProductDetailModal'));

function ProductCard({ product, index, onGoToCheckout }) {
  const { items } = useCart();
  const [liked, setLiked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const inCart = items.find(i => i.id === product.id);

  return (
    <>
      <div
        className="fade-in-up bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
        style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative overflow-hidden h-44">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.badge && (
            <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {product.badge}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={15} className={liked ? 'fill-white' : ''} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center gap-1 text-white text-xs">
              <Clock size={12} />
              <span>{product.time}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base leading-tight">{product.name}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-600 font-medium">{product.rating}</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-black text-gray-900">S/ {product.price.toFixed(2)}</span>
              {inCart && (
                <span className="ml-2 text-xs text-orange-500 font-semibold">({inCart.qty} en carrito)</span>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setModalOpen(true); }}
              className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center font-bold text-white shadow-md hover:shadow-orange-300 hover:shadow-lg transition-all active:scale-90"
            >
              <Plus size={20} />
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
}

export default memo(ProductCard);
