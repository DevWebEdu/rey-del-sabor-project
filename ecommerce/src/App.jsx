import { useState, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import { Flame, MapPin, Clock, Phone } from 'lucide-react';

const CartDrawer   = lazy(() => import('./components/CartDrawer'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AuthModal    = lazy(() => import('./components/AuthModal'));
const MisPedidos   = lazy(() => import('./pages/MisPedidos'));

function Footer() {
  const config = useConfig();
  return (
    <footer className="border-t border-gray-100 mt-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Flame size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">{config.nombre_local}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Los mejores pollos a la brasa de Lima, preparados con nuestra receta secreta y leña seleccionada.
            </p>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Horarios</h3>
            <div className="space-y-2">
              {[
                { day: 'Lunes – Viernes', hours: config.horario_semana },
                { day: 'Sábado',          hours: config.horario_sabado },
                { day: 'Domingo',         hours: config.horario_domingo },
              ].map(h => (
                <div key={h.day} className="flex items-start gap-2">
                  <Clock size={13} className="text-gray-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{h.day}</p>
                    <p className="text-xs text-gray-400">{h.hours}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Contacto</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-300 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-500 leading-snug">{config.direccion}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-300 shrink-0" />
                <p className="text-sm text-gray-500">{config.telefono}</p>
              </div>
              <div className="mt-3 bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-600 font-semibold">Delivery · {config.delivery_tiempo}</p>
                <p className="text-xs text-gray-400 mt-0.5">Radio máx. {config.delivery_radio} · Pedido mínimo S/ {config.pedido_minimo}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 py-4 px-4">
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {config.nombre_local} · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}

function AppContent() {
  const [cartOpen, setCartOpen]     = useState(false);
  const [checkout, setCheckout]     = useState(false);
  const [misPedidos, setMisPedidos] = useState(false);
  const [authModal, setAuthModal]   = useState(null);

  const openCart      = useCallback(() => setCartOpen(true),  []);
  const closeCart     = useCallback(() => setCartOpen(false), []);
  const openCheckout  = useCallback(() => setCheckout(true),  []);
  const closeCheckout = useCallback(() => setCheckout(false), []);

  const openRegister = useCallback((pendingOrderId = null) => {
    setCheckout(false);
    setAuthModal({ mode: 'register', pendingOrderId });
  }, []);

  const openLogin      = useCallback(() => setAuthModal({ mode: 'login', pendingOrderId: null }), []);
  const closeAuthModal = useCallback(() => setAuthModal(null), []);
  const openMisPedidos  = useCallback(() => setMisPedidos(true),  []);
  const closeMisPedidos = useCallback(() => setMisPedidos(false), []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar
        onCartOpen={openCart}
        onOpenLogin={openLogin}
        onOpenMisPedidos={openMisPedidos}
      />

      <main className="pt-14 sm:pt-16 overflow-x-hidden">
        <Hero onCartOpen={openCart} onCheckout={openCheckout} />
        <div id="product-grid">
          <ProductGrid onGoToCheckout={openCheckout} />
        </div>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <CartDrawer open={cartOpen} onClose={closeCart} onCheckout={openCheckout} />
      </Suspense>

      {checkout && (
        <Suspense fallback={null}>
          <CheckoutPage
            onBack={closeCheckout}
            onSuccess={closeCheckout}
            onRegister={openRegister}
          />
        </Suspense>
      )}

      {authModal && (
        <Suspense fallback={null}>
          <AuthModal
            initialMode={authModal.mode}
            pendingOrderId={authModal.pendingOrderId}
            onClose={closeAuthModal}
            onAuthSuccess={authModal.pendingOrderId ? openMisPedidos : undefined}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {misPedidos && (
          <Suspense fallback={null}>
            <MisPedidos onClose={closeMisPedidos} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
