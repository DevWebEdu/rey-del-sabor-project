import { useState, useEffect } from 'react';
import { X, Plus, Minus, Star, Clock, ShoppingBag, Zap, CheckCircle, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SAUCES = [
  { id: 'ketchup',    label: 'Ketchup',     emoji: '🍅' },
  { id: 'mayonesa',   label: 'Mayonesa',    emoji: '🫙' },
  { id: 'ajiPollero', label: 'Ají Pollero', emoji: '🌶️' },
];

const SODA_FLAVORS = [
  { id: 'inca_kola', label: 'Inca Kola', emoji: '🟡' },
  { id: 'coca_cola', label: 'Coca Cola', emoji: '🔴' },
];

const PRESAS = [
  { id: 'pecho',  label: 'Pecho',  emoji: '🍗' },
  { id: 'pierna', label: 'Pierna', emoji: '🦵' },
];

// Detecta cuántas presas elige el cliente según el pollo entero del combo.
// Si hay fracción adicional (+ 1/2, + 1/4) viene como pieza fija y no cuenta.
//   "2 Pollos"              → 8  (2 × 4)
//   "1 Pollo + 1/2 pollo"  → 4  (solo el entero; el 1/2 es pieza fija)
//   "1 Pollo + 1/4 pollo"  → 4  (solo el entero; el 1/4 es pieza fija)
//   "1 Pollo"               → 4
//   "1/2 Pollo"             → 2  (sin entero → se elige la fracción)
//   "1/4 Pollo"             → 1
const getPresasPerCombo = (product) => {
  if (product.category !== 'combos_pollo') return null;
  const text = `${product.name} ${product.description}`.toLowerCase();

  // Pollos enteros primero (tienen prioridad sobre fracciones)
  const multiPollo = text.match(/\b(\d+)\s*pollos\b/);
  if (multiPollo) return parseInt(multiPollo[1]) * 4;
  if (/\b1\s*pollo\b/.test(text)) return 4;

  // Solo fracción (sin pollo entero)
  if (/\b3\/4\b/.test(text))               return 3;
  if (/\b(1\/2|medio|media)\b/.test(text)) return 2;
  if (/\b1\/4\b/.test(text))               return 1;
  if (/\b(entero|4\/4)\b/.test(text))      return 4;

  return null;
};

function Accordion({ title, subtitle, badge, badgeError, open, onToggle, children, highlight }) {
  return (
    <div className={`rounded-2xl overflow-hidden border-2 ${highlight ? 'border-orange-300' : 'border-gray-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
          highlight ? 'bg-orange-50 hover:bg-orange-100' : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{title}</span>
            {badge != null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                badgeError ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${highlight ? 'text-orange-500' : 'text-gray-400'}`}>{subtitle}</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''} ${
            highlight ? 'text-orange-400' : 'text-gray-400'
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function ExtraItems({ items, qtys, onChangeQty, fallbackEmoji, loading, flavors, onChangeFlavor }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-3">No hay productos disponibles</p>;
  }
  return (
    <div className="space-y-2">
      {items.map(item => {
        const qty         = qtys[item.id] || 0;
        const isSelected  = qty > 0;
        const showFlavor  = isSelected && /gaseosa/i.test(item.nombre) && onChangeFlavor;
        const selectedFlavor = flavors?.[item.id];
        return (
          <div key={item.id}>
            <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
              isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
            }`}>
              {item.imagen_url ? (
                <img src={item.imagen_url} alt={item.nombre} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
                  {fallbackEmoji}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-tight truncate ${isSelected ? 'text-orange-800' : 'text-gray-800'}`}>
                  {item.nombre}
                </p>
                {item.descripcion && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{item.descripcion}</p>
                )}
                <p className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                  S/ {Number(item.precio).toFixed(2)} c/u
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => onChangeQty(item.id, -1)} disabled={qty === 0}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-orange-400 transition-colors">
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center font-black text-gray-900">{qty}</span>
                <button type="button" onClick={() => onChangeQty(item.id, 1)}
                  className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors">
                  <Plus size={13} />
                </button>
              </div>
            </div>
            {showFlavor && (
              <div className="mt-1.5 mx-1 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-xs text-orange-600 font-semibold mb-2">¿Qué sabor quieres?</p>
                <div className="flex gap-2">
                  {SODA_FLAVORS.map(f => (
                    <button key={f.id} type="button" onClick={() => onChangeFlavor(item.id, f.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        selectedFlavor === f.id
                          ? 'border-orange-500 bg-white text-orange-700 shadow-sm'
                          : 'border-orange-200 bg-white/60 text-gray-500 hover:border-orange-400'
                      }`}>
                      {f.emoji} {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const makeChangeQty = (setter) => (id, delta) => {
  setter(prev => {
    const next = (prev[id] || 0) + delta;
    if (next <= 0) { const { [id]: _, ...rest } = prev; return rest; }
    return { ...prev, [id]: next };
  });
};

const toSelectedArray = (items, qtys, flavors = {}) =>
  items
    .filter(item => (qtys[item.id] || 0) > 0)
    .map(item => ({
      id: item.id, nombre: item.nombre, precio: item.precio,
      imagen_url: item.imagen_url || null, qty: qtys[item.id], sabor: flavors[item.id] || null,
    }));

export default function ProductDetailModal({ product, onClose, onGoToCheckout }) {
  const { dispatch } = useCart();

  const hasGaseosa     = /gaseosa/i.test(product.description || '');
  const presasPerCombo = getPresasPerCombo(product);
  const isBebida       = product.category === 'bebidas';

  const [qty, setQty]                   = useState(1);
  const [sauces, setSauces]             = useState({ ketchup: 0, mayonesa: 0, ajiPollero: 0 });
  const [presaQtys, setPresaQtys]       = useState({ pecho: 0, pierna: 0 });
  const [gaseosaFlavor, setGaseosaFlavor] = useState(null);
  const [compQtys, setCompQtys]         = useState({});
  const [bebQtys, setBebQtys]           = useState({});
  const [bebFlavors, setBebFlavors]     = useState({});
  const [added, setAdded]               = useState(false);

  const [openPreses, setOpenPreses]             = useState(presasPerCombo != null);
  const [openGaseosa, setOpenGaseosa]           = useState(hasGaseosa);
  const [openSauces, setOpenSauces]             = useState(!hasGaseosa && presasPerCombo == null);
  const [openComplementos, setOpenComplementos] = useState(false);
  const [openBebidas, setOpenBebidas]           = useState(false);

  const [complementos, setComplementos]   = useState([]);
  const [bebidas, setBebidas]             = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [compRes, bebRes] = await Promise.all([
          fetch(`${API_URL}/api/productos?categoria=complementos`),
          fetch(`${API_URL}/api/productos?categoria=bebidas`),
        ]);
        const compData = await compRes.json();
        const bebData  = await bebRes.json();
        setComplementos(Array.isArray(compData) ? compData : (compData.data ?? []));
        setBebidas(Array.isArray(bebData) ? bebData : (bebData.data ?? []));
      } catch { /* silently ignore */ } finally { setLoadingExtras(false); }
    };
    fetchExtras();
  }, []);

  const changeCompQty = makeChangeQty(setCompQtys);
  const changeBebQty  = (id, delta) => {
    setBebQtys(prev => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        setBebFlavors(f => { const { [id]: __, ...r } = f; return r; });
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };
  const handleChangeFlavor = (itemId, flavorId) =>
    setBebFlavors(prev => ({ ...prev, [itemId]: flavorId }));

  // ── Cremas ──
  const totalSauces     = Object.values(sauces).reduce((s, v) => s + v, 0);
  const maxSauces       = qty * 3;
  const saucesOverLimit = totalSauces > maxSauces;

  const changeSauce = (id, delta) => {
    const next = (sauces[id] || 0) + delta;
    if (next < 0) return;
    if (delta > 0 && totalSauces >= maxSauces) return;
    setSauces(s => ({ ...s, [id]: next }));
    if (delta > 0 && totalSauces + 1 === maxSauces && openSauces) {
      setTimeout(() => {
        setOpenSauces(false);
        setOpenComplementos(true);
      }, 350);
    }
  };

  // ── Presas ──
  const totalPresas     = presaQtys.pecho + presaQtys.pierna;
  const maxPresas       = presasPerCombo != null ? presasPerCombo * qty : 0;
  const presasOverLimit = presasPerCombo != null && totalPresas > maxPresas;

  const changePresa = (id, delta) => {
    const next = (presaQtys[id] || 0) + delta;
    if (next < 0) return;
    if (delta > 0 && totalPresas >= maxPresas) return;
    setPresaQtys(p => ({ ...p, [id]: next }));
    if (delta > 0 && totalPresas + 1 === maxPresas && openPreses) {
      setTimeout(() => {
        setOpenPreses(false);
        if (hasGaseosa) setOpenGaseosa(true);
        else setOpenSauces(true);
      }, 350);
    }
  };

  // ── Extras & total ──
  const totalCompQty = Object.values(compQtys).reduce((s, v) => s + v, 0);
  const totalBebQty  = Object.values(bebQtys).reduce((s, v) => s + v, 0);

  const extraPrice =
    complementos.reduce((s, i) => s + Number(i.precio) * (compQtys[i.id] || 0), 0) +
    bebidas.reduce((s, i) => s + Number(i.precio) * (bebQtys[i.id] || 0), 0);
  const grandTotal = product.price * qty + extraPrice;

  // Solo es obligatorio para 1/4 pollo (1 presa); en 1/2 pollo o más es opcional
  const saucesRequired  = !isBebida && totalSauces === 0;
  const presasRequired  = presasPerCombo === 1 && totalPresas === 0;
  const gaseosaRequired = hasGaseosa && !gaseosaFlavor;
  const canSubmit       = !saucesRequired && !saucesOverLimit && !presasOverLimit && !presasRequired && !gaseosaRequired;
  const selectedFlavorLabel  = SODA_FLAVORS.find(f => f.id === gaseosaFlavor);

  const buildProduct = () => ({
    ...product,
    qty,
    sauces,
    presaQtys:     presasPerCombo != null ? presaQtys : null,
    gaseosaFlavor: hasGaseosa ? gaseosaFlavor : null,
    complementos:  toSelectedArray(complementos, compQtys),
    bebidas:       toSelectedArray(bebidas, bebQtys, bebFlavors),
  });

  const handleAdd = () => {
    dispatch({ type: 'ADD', product: buildProduct() });
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  };

  const handleBuyNow = () => {
    dispatch({ type: 'ADD', product: buildProduct() });
    onClose();
    onGoToCheckout();
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />

      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col">

          {/* Image header */}
          <div className="relative h-36 sm:h-48 shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-50 flex items-center justify-center text-6xl">🍗</div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md">
              <X size={18} className="text-gray-700" />
            </button>
            {product.badge && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                {product.badge}
              </span>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="text-3xl font-black text-white drop-shadow-lg">
                S/ {product.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h2>
                <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-1 rounded-full">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-amber-700">{product.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Clock size={12} /> {product.time}</span>
                <span>·</span>
                <span>{product.reviews} reseñas</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="px-5 space-y-3 pb-4">

              {/* Cantidad */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">Cantidad</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-orange-400 transition-colors">
                    <Minus size={16} className="text-gray-600" />
                  </button>
                  <span className="w-8 text-center font-black text-xl text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Acordión: Presas (solo combos_pollo con fracción detectada) */}
              {presasPerCombo != null && (
                <Accordion
                  title="🍗 Elige tus presas"
                  subtitle={
                    presasPerCombo === 1
                      ? `Elige 1 presa por combo${qty > 1 ? ` (${qty} en total)` : ''}`
                      : qty > 1
                        ? `Opcional — hasta ${maxPresas} presas (${qty} × ${presasPerCombo})`
                        : `Opcional — hasta ${maxPresas} presa${maxPresas > 1 ? 's' : ''} por combo`
                  }
                  badge={totalPresas > 0 ? `${totalPresas}/${maxPresas}` : null}
                  badgeError={presasOverLimit}
                  open={openPreses}
                  onToggle={() => setOpenPreses(o => !o)}
                  highlight
                >
                  <div className="space-y-2">
                    {PRESAS.map(p => (
                      <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                        presaQtys[p.id] > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.emoji}</span>
                          <span className="font-semibold text-gray-800">{p.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => changePresa(p.id, -1)} disabled={presaQtys[p.id] === 0}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-orange-400 transition-colors">
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center font-black text-gray-900">{presaQtys[p.id]}</span>
                          <button onClick={() => changePresa(p.id, 1)} disabled={totalPresas >= maxPresas}
                            className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-30 hover:bg-orange-600 transition-colors">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Acordión: Gaseosa incluida en el combo */}
              {hasGaseosa && (
                <Accordion
                  title="🥤 Elige tu gaseosa"
                  subtitle="Incluida en el combo — elige el sabor"
                  badge={selectedFlavorLabel ? `${selectedFlavorLabel.emoji} ${selectedFlavorLabel.label}` : '⚠ Elige sabor'}
                  open={openGaseosa}
                  onToggle={() => setOpenGaseosa(o => !o)}
                  highlight
                >
                  <div className="flex gap-3">
                    {SODA_FLAVORS.map(f => (
                      <button key={f.id} type="button" onClick={() => {
                        setGaseosaFlavor(f.id);
                        if (openGaseosa) {
                          setTimeout(() => {
                            setOpenGaseosa(false);
                            setOpenSauces(true);
                          }, 350);
                        }
                      }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${
                          gaseosaFlavor === f.id
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-300'
                        }`}>
                        <span className="text-xl">{f.emoji}</span>
                        {f.label}
                        {gaseosaFlavor === f.id && <CheckCircle size={15} className="text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Acordión: Cremas */}
              {!isBebida && (
                <Accordion
                  title="Elige tus cremas"
                  subtitle={qty > 1 ? `Máximo ${maxSauces} en total (${qty} × 3)` : 'Máximo 3 en total'}
                  badge={totalSauces > 0 ? `${totalSauces}/${maxSauces}` : null}
                  badgeError={saucesOverLimit}
                  open={openSauces}
                  onToggle={() => setOpenSauces(o => !o)}
                >
                  <div className="space-y-2">
                    {SAUCES.map(sauce => (
                      <div key={sauce.id} className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                        sauces[sauce.id] > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{sauce.emoji}</span>
                          <span className="font-semibold text-gray-800">{sauce.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => changeSauce(sauce.id, -1)} disabled={sauces[sauce.id] === 0}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-orange-400 transition-colors">
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center font-black text-gray-900">{sauces[sauce.id]}</span>
                          <button onClick={() => changeSauce(sauce.id, 1)} disabled={totalSauces >= maxSauces}
                            className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-30 hover:bg-orange-600 transition-colors">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Acordión: Complementos */}
              {!isBebida && (
                <Accordion
                  title="Complementos"
                  subtitle="Agrega los que quieras (opcional)"
                  badge={totalCompQty > 0 ? `${totalCompQty}` : null}
                  open={openComplementos}
                  onToggle={() => setOpenComplementos(o => !o)}
                >
                  <ExtraItems items={complementos} qtys={compQtys} onChangeQty={changeCompQty}
                    fallbackEmoji="🍟" loading={loadingExtras} />
                </Accordion>
              )}

              {/* Acordión: Bebidas */}
              <Accordion
                title="Bebidas"
                subtitle="Agrega las que quieras (opcional)"
                badge={totalBebQty > 0 ? `${totalBebQty}` : null}
                open={openBebidas}
                onToggle={() => setOpenBebidas(o => !o)}
              >
                <ExtraItems items={bebidas} qtys={bebQtys} onChangeQty={changeBebQty}
                  fallbackEmoji="🥤" loading={loadingExtras}
                  flavors={bebFlavors} onChangeFlavor={handleChangeFlavor} />
              </Accordion>

              {/* Resumen */}
              {(totalPresas > 0 || (hasGaseosa && gaseosaFlavor) || totalSauces > 0 || totalCompQty > 0 || totalBebQty > 0) && (
                <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-500 space-y-1">
                  {totalPresas > 0 && (
                    <p>🍗 Presas: {PRESAS.filter(p => presaQtys[p.id] > 0).map(p => `${presaQtys[p.id]}x ${p.label}`).join(', ')}</p>
                  )}
                  {hasGaseosa && gaseosaFlavor && (
                    <p className="text-orange-600 font-semibold">
                      {selectedFlavorLabel?.emoji} Gaseosa incluida: {selectedFlavorLabel?.label}
                    </p>
                  )}
                  {totalSauces > 0 && (
                    <p>🫙 Cremas: {SAUCES.filter(s => sauces[s.id] > 0).map(s => `${sauces[s.id]}x ${s.label}`).join(', ')}</p>
                  )}
                  {complementos.filter(c => (compQtys[c.id] || 0) > 0).map(c => (
                    <p key={c.id}>🍟 {compQtys[c.id]}x {c.nombre} (+S/ {(Number(c.precio) * compQtys[c.id]).toFixed(2)})</p>
                  ))}
                  {bebidas.filter(b => (bebQtys[b.id] || 0) > 0).map(b => {
                    const flavor = SODA_FLAVORS.find(f => f.id === bebFlavors[b.id]);
                    return (
                      <p key={b.id}>
                        🥤 {bebQtys[b.id]}x {b.nombre}
                        {flavor && <span className="text-orange-500 font-semibold"> — {flavor.emoji} {flavor.label}</span>}
                        {' '}(+S/ {(Number(b.precio) * bebQtys[b.id]).toFixed(2)})
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 pb-safe border-t border-gray-100 bg-white space-y-2 shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Total</span>
              <span className="font-black text-xl text-gray-900">S/ {grandTotal.toFixed(2)}</span>
            </div>
            {saucesRequired && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-200 rounded-xl py-2">
                🫙 Debes elegir al menos una crema para continuar
              </p>
            )}
            {presasRequired && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-200 rounded-xl py-2">
                🍗 Debes elegir al menos una presa para continuar
              </p>
            )}
            {presasOverLimit && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-200 rounded-xl py-2">
                Tienes {totalPresas} presas para {qty} combo{qty > 1 ? 's' : ''} — reduce a {maxPresas} para continuar
              </p>
            )}
            {gaseosaRequired && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-200 rounded-xl py-2">
                🥤 Debes elegir el sabor de tu gaseosa para continuar
              </p>
            )}
            {saucesOverLimit && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-50 border border-red-200 rounded-xl py-2">
                Tienes {totalSauces} cremas para {qty} combo{qty > 1 ? 's' : ''} — reduce a {maxSauces} para continuar
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleAdd} disabled={!canSubmit}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  added ? 'bg-green-500 text-white' : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50'
                }`}>
                {added ? <><CheckCircle size={16} /> Agregado</> : <><ShoppingBag size={16} /> Al carrito</>}
              </button>
              <button onClick={handleBuyNow} disabled={!canSubmit}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-linear-to-r from-orange-500 to-red-600 text-white shadow-md hover:shadow-orange-300 hover:shadow-lg transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                <Zap size={16} />
                Pedir ya
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
