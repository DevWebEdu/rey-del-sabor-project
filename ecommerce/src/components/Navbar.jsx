import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  ChevronDown,
  Flame,
  User,
  LogOut,
  Package,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";

export default function Navbar({ onCartOpen, onOpenLogin, onOpenMisPedidos }) {
  const { count, total } = useCart();
  const { cliente, logout } = useAuth();
  const config = useConfig();
  const [scrolled, setScrolled] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const prevCount = useRef(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const previousCount = prevCount.current;
    if (count > previousCount) {
      setAnimate(true);
      const timeoutId = setTimeout(() => setAnimate(false), 500);
      prevCount.current = count;
      return () => clearTimeout(timeoutId);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? "shadow-[0_1px_0_0_#f3f4f6] shadow-sm" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <Flame size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-[15px] text-gray-900 leading-none">
              El Rey del Sabor
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
              Delivery · {config.delivery_tiempo}
            </p>
          </div>
        </div>

        {/* ── Derecha ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Auth */}
          {cliente ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-600 font-bold text-xs">
                    {cliente.nombre?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-20 truncate">
                  {cliente.nombre.split(" ")[0]}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-gray-400 transition-transform hidden sm:block ${userMenu ? "rotate-180" : ""}`}
                />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-lg shadow-black/8 border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {cliente.nombre}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {cliente.correo}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenu(false);
                      onOpenMisPedidos();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Package size={15} className="text-gray-400" />
                    Mis Pedidos
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <User size={14} />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}

          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95"
          >
            <ShoppingCart size={16} />
            {total > 0 && (
              <span className="hidden sm:block text-xs font-bold">
                S/ {total.toFixed(0)}
              </span>
            )}
            {count > 0 && (
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ${animate ? "bounce-in" : ""}`}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
