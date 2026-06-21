import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Check, ImagePlus, Megaphone, Search, Calendar, Image as ImageIcon, EyeOff, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { categories } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../utils/imgUrl';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EMPTY_PRODUCT = { nombre: '', precio: '', descripcion: '', categoria: 'combos_pollo', imagen_url: '' };
const EMPTY_PROMO = {
  nombre: '', titulo: '', subtitulo: '', descuento_texto: '',
  color: 'linear-gradient(135deg, #FF6B35, #C0392B)',
  inicio_vigencia: '', fin_vigencia: '',
  precio: '', productos: [],
  vigencia_tipo: 'rango', dias_semana: [],
  imagen_url: '',
};

const PROMO_COLORS = [
  { label: 'Fuego',          value: 'linear-gradient(135deg, #FF6B35, #C0392B)' },
  { label: 'Rosa Intenso',   value: 'linear-gradient(135deg, #FF0080, #7928CA)' },
  { label: 'Azul Eléctrico', value: 'linear-gradient(135deg, #0070F3, #00DFD8)' },
  { label: 'Dorado',         value: 'linear-gradient(135deg, #F7971E, #FFD200)' },
  { label: 'Morado Neón',    value: 'linear-gradient(135deg, #DA22FF, #9733EE)' },
  { label: 'Crimsón',        value: 'linear-gradient(135deg, #C94B4B, #4B134F)' },
  { label: 'Verde Vibrante', value: 'linear-gradient(135deg, #11998E, #38EF7D)' },
  { label: 'Noche',          value: 'linear-gradient(135deg, #1a1a2e, #7b2ff7)' },
];

const DIAS_SEMANA  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_PLURAL  = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
const SHOW_DESC_CATS = ['combos_pollo', 'parrillas'];

function buildFrecuencia(promo) {
  const dias = (() => {
    try {
      if (!promo.dias_semana) return [];
      if (Array.isArray(promo.dias_semana)) return promo.dias_semana;
      return JSON.parse(promo.dias_semana);
    } catch { return []; }
  })();
  if (promo.vigencia_tipo === 'dias_semana' || dias.length > 0) {
    if (!dias.length) return 'Días específicos';
    if (dias.length === 1) return `Todos los ${DIAS_PLURAL[dias[0]]}`;
    const last = DIAS_PLURAL[dias[dias.length - 1]];
    const rest = dias.slice(0, -1).map(d => DIAS_PLURAL[d]);
    return `${rest.join(', ')} y ${last}`;
  }
  if (promo.inicio_vigencia) {
    const ini = new Date(promo.inicio_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    const fin = promo.fin_vigencia
      ? new Date(promo.fin_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    return fin ? `Del ${ini} al ${fin}` : `Desde el ${ini}`;
  }
  return '';
}

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts]               = useState([]);
  const [promos, setPromos]                   = useState([]);
  const [activeTab, setActiveTab]             = useState('products');
  const [editingProduct, setEditingProduct]   = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingPromo, setEditingPromo]       = useState(null);
  const [showPromoForm, setShowPromoForm]     = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [promoSearch, setPromoSearch]         = useState('');
  const [productSearch, setProductSearch]     = useState('');
  const [prodPage, setProdPage]               = useState(1);
  const fileInputRef      = useRef();
  const promoFileInputRef = useRef();

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadProducts = async () => {
    const res = await fetch(`${API_URL}/api/productos`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setProducts(await res.json());
  };

  const loadPromos = async () => {
    const res = await fetch(`${API_URL}/api/promociones/all`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setPromos(await res.json());
  };

  useEffect(() => { loadProducts(); loadPromos(); }, []);

  // ── Productos ─────────────────────────────────────────────────────────
  const handleProductSave = async () => {
    if (!editingProduct.nombre || !editingProduct.precio) return;
    setLoading(true);
    try {
      const body = {
        nombre:      editingProduct.nombre,
        descripcion: editingProduct.descripcion || null,
        precio:      parseFloat(editingProduct.precio),
        categoria:   editingProduct.categoria || null,
        imagen_url:  editingProduct.imagen_url || null,
      };
      if (editingProduct.id) {
        await fetch(`${API_URL}/api/productos/${editingProduct.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_URL}/api/productos`, { method: 'POST', headers, body: JSON.stringify(body) });
      }
      await loadProducts();
      setEditingProduct(null);
      setShowProductForm(false);
    } finally { setLoading(false); }
  };

  const handleProductDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await fetch(`${API_URL}/api/productos/${id}`, { method: 'DELETE', headers });
    await loadProducts();
  };

  const uploadImage = async (file, forPromo = false) => {
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res  = await fetch(`${API_URL}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (data.url) {
        if (forPromo) setEditingPromo(p => ({ ...p, imagen_url: data.url }));
        else          setEditingProduct(p => ({ ...p, imagen_url: data.url }));
      }
    } catch { alert('Error al subir la imagen'); }
  };

  // ── Promociones ───────────────────────────────────────────────────────
  const parseDias = (raw) => {
    try {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      return JSON.parse(raw);
    } catch { return []; }
  };

  const handlePromoSave = async () => {
    if (!editingPromo.nombre || !editingPromo.titulo) return;
    setLoading(true);
    try {
      const esDias = editingPromo.vigencia_tipo === 'dias_semana';
      const body = {
        nombre:          editingPromo.nombre,
        titulo:          editingPromo.titulo,
        subtitulo:       editingPromo.subtitulo       || null,
        descuento_texto: editingPromo.descuento_texto || null,
        color:           editingPromo.color           || null,
        precio:          editingPromo.precio          || null,
        imagen_url:      editingPromo.imagen_url      || null,
        vigencia_tipo:   editingPromo.vigencia_tipo   || 'rango',
        dias_semana:     esDias ? JSON.stringify(editingPromo.dias_semana || []) : null,
        inicio_vigencia: esDias ? null : (editingPromo.inicio_vigencia || null),
        fin_vigencia:    editingPromo.fin_vigencia    || null,
        productos:       (editingPromo.productos || []).length > 0 ? editingPromo.productos : null,
      };
      if (editingPromo.id) {
        await fetch(`${API_URL}/api/promociones/${editingPromo.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_URL}/api/promociones`, { method: 'POST', headers, body: JSON.stringify(body) });
      }
      await loadPromos();
      setEditingPromo(null);
      setShowPromoForm(false);
      setPromoSearch('');
    } finally { setLoading(false); }
  };

  const handlePromoDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await fetch(`${API_URL}/api/promociones/${id}`, { method: 'DELETE', headers });
    await loadPromos();
  };

  const handlePromoToggle = async (id) => {
    await fetch(`${API_URL}/api/promociones/${id}/toggle`, { method: 'PATCH', headers });
    await loadPromos();
  };

  const openEditPromo = (promo) => {
    setEditingPromo({
      ...promo,
      precio:          promo.precio || '',
      productos:       Array.isArray(promo.productos) ? promo.productos : [],
      dias_semana:     parseDias(promo.dias_semana),
      vigencia_tipo:   promo.vigencia_tipo || 'rango',
      imagen_url:      promo.imagen_url || '',
      inicio_vigencia: promo.inicio_vigencia
        ? new Date(promo.inicio_vigencia).toISOString().split('T')[0] : '',
      fin_vigencia:    promo.fin_vigencia
        ? new Date(promo.fin_vigencia).toISOString().split('T')[0] : '',
    });
    setPromoSearch('');
    setShowPromoForm(true);
  };

  const togglePromoProduct = (product) => {
    const current = editingPromo.productos || [];
    const exists  = current.some(p => p.id === product.id);
    const updated = exists
      ? current.filter(p => p.id !== product.id)
      : [...current, {
          id:          product.id,
          nombre:      product.nombre,
          precio:      Number(product.precio),
          imagen_url:  product.imagen_url  || '',
          descripcion: product.descripcion || '',
          categoria:   product.categoria   || '',
        }];
    setEditingPromo(p => ({ ...p, productos: updated }));
  };

  const toggleDia = (dia) => {
    const dias    = editingPromo.dias_semana || [];
    const updated = dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia].sort((a,b)=>a-b);
    setEditingPromo(p => ({ ...p, dias_semana: updated }));
  };

  const PROD_LIMIT    = 10;
  const productList   = Array.isArray(products) ? products : (products?.data || []);
  const searchFiltered   = productList.filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase()));
  const prodTotalPages   = Math.ceil(searchFiltered.length / PROD_LIMIT) || 1;
  const displayedProducts = searchFiltered.slice((prodPage - 1) * PROD_LIMIT, prodPage * PROD_LIMIT);
  const filteredProducts  = productList.filter(p => p.nombre.toLowerCase().includes(promoSearch.toLowerCase()));

  const promoStatus = (promo) => {
    if (promo.activo === 0) return { label: '◉ Pausada', cls: 'bg-black/40 text-white/60' };

    const now = new Date();
    const fin = promo.fin_vigencia ? new Date(promo.fin_vigencia) : null;
    if (fin && fin < now) return { label: '✕ Vencida', cls: 'bg-red-500/30 text-red-200' };

    if (promo.vigencia_tipo === 'dias_semana') {
      const dias     = parseDias(promo.dias_semana);
      const limaDay  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' })).getDay();
      if (dias.includes(limaDay)) return { label: '● Activa hoy', cls: 'bg-green-500/30 text-green-200' };
      const names = dias.map(d => DIAS_SEMANA[d]).join(', ');
      return { label: `◷ ${names || 'Sin días'}`, cls: 'bg-blue-500/30 text-blue-200' };
    }

    const ini = promo.inicio_vigencia ? new Date(promo.inicio_vigencia) : null;
    if (ini && ini > now) return { label: '◷ Programada', cls: 'bg-blue-500/30 text-blue-200' };
    if (ini || fin)       return { label: '● Activa',     cls: 'bg-green-500/30 text-green-200' };
    return                       { label: '○ Sin fechas', cls: 'bg-white/20 text-white/70' };
  };

  // ── Input class helper ────────────────────────────────────────────────
  const inputCls = 'w-full bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-orange-500 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors placeholder-slate-600';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Productos & Promociones</h1>
        <p className="text-slate-400 text-sm">{productList.length} productos · {promos.length} promociones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'products', label: '🍔 Productos',   count: productList.length },
          { id: 'promos',   label: '🎯 Promociones', count: promos.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Productos ── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Buscar producto..." value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setProdPage(1); }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-500" />
            </div>
            <button
              onClick={() => { setEditingProduct({ ...EMPTY_PRODUCT }); setShowProductForm(true); }}
              className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all shrink-0"
            >
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {displayedProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🍔</div>
                <p className="text-slate-400">{productSearch ? 'Sin resultados' : 'No hay productos todavía'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider bg-slate-800/80">
                      <th className="text-left px-4 py-3 font-semibold w-16">Img</th>
                      <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Descripción</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Categoría</th>
                      <th className="text-right px-4 py-3 font-semibold">Precio</th>
                      <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.map(product => (
                      <tr key={product.id}
                        onClick={() => { setEditingProduct({ ...product, precio: String(product.precio) }); setShowProductForm(true); }}
                        className="border-b border-slate-700/60 last:border-0 hover:bg-slate-700/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          {product.imagen_url ? (
                            <img src={imgUrl(product.imagen_url)} alt={product.nombre}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-700 group-hover:border-orange-500/40 transition-colors" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-xl border border-slate-700 group-hover:border-orange-500/40 transition-colors">🍔</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-semibold">{product.nombre}</p>
                          <p className="text-slate-500 text-xs sm:hidden line-clamp-1 mt-0.5">{product.descripcion || '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell max-w-56">
                          <p className="text-slate-400 text-xs line-clamp-2">{product.descripcion || <span className="text-slate-600">—</span>}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs bg-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg capitalize">{product.categoria || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-orange-400 font-black">S/ {Number(product.precio).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditingProduct({ ...product, precio: String(product.precio) }); setShowProductForm(true); }}
                              className="w-8 h-8 bg-slate-700 hover:bg-blue-500/20 border border-slate-600 hover:border-blue-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleProductDelete(product.id)}
                              className="w-8 h-8 bg-slate-700 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {prodTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                <p className="text-slate-500 text-xs">
                  {searchFiltered.length} productos · Página {prodPage} de {prodTotalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setProdPage(p => Math.max(1, p - 1))}
                    disabled={prodPage === 1}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: prodTotalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === prodTotalPages || Math.abs(p - prodPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`ellipsis-${i}`} className="text-slate-600 px-1 text-sm">…</span>
                      ) : (
                        <button key={p} onClick={() => setProdPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                            p === prodPage
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  }

                  <button
                    onClick={() => setProdPage(p => Math.min(prodTotalPages, p + 1))}
                    disabled={prodPage === prodTotalPages}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-600 transition-colors flex items-center justify-center"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Promociones ── */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          <button
            onClick={() => { setEditingPromo({ ...EMPTY_PROMO }); setPromoSearch(''); setShowPromoForm(true); }}
            className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all"
          >
            <Plus size={16} /> Nueva Promoción
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map(promo => {
              const st        = promoStatus(promo);
              const promoProds = Array.isArray(promo.productos) ? promo.productos : [];
              const dias       = parseDias(promo.dias_semana);
              return (
                <div key={promo.id} className={`relative rounded-2xl overflow-hidden group transition-opacity flex flex-col ${promo.activo === 0 ? 'opacity-50' : ''}`} style={{ background: promo.color, minHeight: '210px' }}>
                  {/* Overlay cuando está pausada */}
                  {promo.activo === 0 && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl pointer-events-none z-10" />
                  )}
                  {/* Orbs decorativos */}
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
                  <div className="absolute -bottom-14 -left-6 w-36 h-36 bg-black/15 rounded-full pointer-events-none" />

                  <div className="relative p-4 flex flex-col flex-1 gap-2">
                    {/* Fila superior: badges + imagen */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                        <span className="inline-flex items-center bg-white/20 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                          🎯 Promo
                        </span>
                        {buildFrecuencia(promo) && (
                          <span className="inline-flex items-center bg-black/30 backdrop-blur-md text-white text-[8px] font-semibold px-2 py-0.5 rounded-full truncate max-w-full">
                            🗓 {buildFrecuencia(promo)}
                          </span>
                        )}
                      </div>
                      {promo.imagen_url && (
                        <div className="shrink-0 relative" style={{ width: '68px', height: '68px' }}>
                          <div className="absolute inset-0 rounded-full bg-white/25 blur-xl pointer-events-none" />
                          <div className="absolute -inset-1 rounded-full border border-white/20 pointer-events-none" />
                          <div className="relative w-full h-full rounded-full overflow-hidden"
                            style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.4)' }}>
                            <img src={imgUrl(promo.imagen_url)} alt={promo.titulo} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1">
                      {promo.subtitulo && <p className="text-white/70 text-[10px] font-medium -mb-0.5">{promo.subtitulo}</p>}
                      <p className="text-white font-black text-base leading-tight">{promo.titulo}</p>

                      {(promo.descuento_texto || promo.precio) && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {promo.descuento_texto && (
                            <span className="bg-white text-gray-900 font-black text-sm px-2.5 py-1 rounded-lg shadow-lg leading-none">
                              {promo.descuento_texto}
                            </span>
                          )}
                          {promo.precio && (
                            <span className="text-white font-black text-base drop-shadow-lg">
                              S/ {Number(promo.precio).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      {promoProds.length > 0 && (
                        <div className="mt-2 bg-black/20 backdrop-blur-md rounded-xl px-2.5 py-1.5 space-y-1 border border-white/10">
                          <p className="text-white/50 text-[8px] uppercase tracking-widest font-black">✦ Incluye</p>
                          {promoProds.slice(0, 2).map(p => (
                            <div key={p.id} className="flex gap-1 items-start">
                              <span className="text-white/40 text-[10px] mt-0.5 shrink-0">•</span>
                              <p className="text-white font-semibold text-[10px] leading-tight truncate">{p.nombre}</p>
                            </div>
                          ))}
                          {promoProds.length > 2 && (
                            <p className="text-white/40 text-[8px]">+{promoProds.length - 2} más</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Estado y vigencia */}
                    <div className="mt-1 pt-2 border-t border-white/10 space-y-0.5">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {promo.vigencia_tipo === 'dias_semana' ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dias.map(d => (
                            <span key={d} className="text-[10px] bg-black/20 text-white/80 px-1.5 py-0.5 rounded-full">{DIAS_SEMANA[d]}</span>
                          ))}
                          {promo.fin_vigencia && <p className="text-white/50 text-[10px] w-full mt-0.5">Hasta: {new Date(promo.fin_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                        </div>
                      ) : (
                        <>
                          {promo.inicio_vigencia && <p className="text-white/50 text-[10px]">Desde: {new Date(promo.inicio_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                          {promo.fin_vigencia    && <p className="text-white/50 text-[10px]">Hasta: {new Date(promo.fin_vigencia).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción (hover) */}
                  <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => handlePromoToggle(promo.id)}
                      title={promo.activo === 0 ? 'Activar' : 'Pausar'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        promo.activo === 0
                          ? 'bg-green-500 text-white hover:bg-green-400'
                          : 'bg-white/90 text-yellow-600 hover:bg-white'
                      }`}>
                      {promo.activo === 0 ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => openEditPromo(promo)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-blue-600 hover:bg-white transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handlePromoDelete(promo.id)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {promos.length === 0 && (
              <div className="col-span-3 bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                <Megaphone size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay promociones. Crea la primera.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Producto ── */}
      {showProductForm && editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-bold">{editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowProductForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <div
                  onClick={() => fileInputRef.current.click()}
                  onDrop={e => { e.preventDefault(); uploadImage(e.dataTransfer.files[0]); }}
                  onDragOver={e => e.preventDefault()}
                  className="h-36 bg-slate-700 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors overflow-hidden"
                >
                  {editingProduct.imagen_url ? (
                    <img src={imgUrl(editingProduct.imagen_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-slate-500 mb-2" />
                      <p className="text-slate-400 text-xs font-medium">Clic o arrastra una imagen</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={e => uploadImage(e.target.files[0])} className="hidden" />
                <input type="text" placeholder="O pegar URL de imagen..."
                  value={editingProduct.imagen_url?.startsWith('data:') ? '' : (editingProduct.imagen_url || '')}
                  onChange={e => setEditingProduct(p => ({ ...p, imagen_url: e.target.value }))}
                  className="w-full mt-2 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-orange-500 placeholder-slate-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Nombre *</label>
                  <input type="text" value={editingProduct.nombre} onChange={e => setEditingProduct(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" placeholder="Pollo a la Brasa" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Precio S/ *</label>
                  <input type="number" value={editingProduct.precio} onChange={e => setEditingProduct(p => ({ ...p, precio: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Descripción</label>
                <textarea value={editingProduct.descripcion} onChange={e => setEditingProduct(p => ({ ...p, descripcion: e.target.value }))}
                  rows={2} className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none" placeholder="Descripción del producto..." />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Categoría</label>
                <select value={editingProduct.categoria} onChange={e => setEditingProduct(p => ({ ...p, categoria: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500">
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex gap-3">
              <button onClick={() => setShowProductForm(false)} className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-700">Cancelar</button>
              <button onClick={handleProductSave} disabled={loading}
                className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Promoción ── */}
      {showPromoForm && editingPromo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-700/80 flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-white font-black text-lg">{editingPromo.id ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
                <p className="text-slate-500 text-xs mt-0.5">Previsualiza el banner en tiempo real</p>
              </div>
              <button onClick={() => { setShowPromoForm(false); setPromoSearch(''); }}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* ── Preview banner ── */}
              <div className="rounded-2xl overflow-hidden relative shadow-xl" style={{ background: editingPromo.color, height: '260px' }}>
                {/* Orbs decorativos */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />
                <div className="absolute -bottom-20 -left-10 w-52 h-52 bg-black/15 rounded-full pointer-events-none" />
                <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />

                <div className="absolute inset-0 flex items-center px-6 gap-5">
                  {/* Columna izquierda */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                        🎯 Promo Especial
                      </span>
                      {buildFrecuencia(editingPromo) && (
                        <span className="inline-flex items-center gap-1 bg-black/30 backdrop-blur-md text-white text-[9px] font-semibold px-2.5 py-1 rounded-full">
                          🗓 {buildFrecuencia(editingPromo)}
                        </span>
                      )}
                    </div>

                    {editingPromo.subtitulo && (
                      <p className="text-white/75 text-xs font-medium tracking-wide -mb-0.5">{editingPromo.subtitulo}</p>
                    )}

                    <h2 className="text-white font-black text-xl leading-tight drop-shadow-xl">
                      {editingPromo.titulo || <span className="opacity-40">Título de la promoción</span>}
                    </h2>

                    {(editingPromo.descuento_texto || editingPromo.precio) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {editingPromo.descuento_texto && (
                          <span className="bg-white text-gray-900 font-black text-base px-3 py-1.5 rounded-xl shadow-xl shadow-black/30 leading-none">
                            {editingPromo.descuento_texto}
                          </span>
                        )}
                        {editingPromo.precio && (
                          <div className="flex flex-col leading-none">
                            <span className="text-white/60 text-[9px] uppercase tracking-widest font-bold">Precio especial</span>
                            <span className="text-white font-black text-lg drop-shadow-lg">S/ {Number(editingPromo.precio).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(editingPromo.productos || []).length > 0 && (
                      <div className="bg-black/25 backdrop-blur-md rounded-xl px-3 py-2 space-y-1 max-w-xs border border-white/10">
                        <p className="text-white/50 text-[9px] uppercase tracking-[0.15em] font-black">✦ Incluye</p>
                        {(editingPromo.productos || []).slice(0, 3).map((p, idx) => (
                          <div key={p.id ?? idx} className="flex gap-1.5 items-start">
                            <span className="text-white/40 text-xs mt-0.5 shrink-0">•</span>
                            <div className="min-w-0">
                              <p className="text-white font-bold text-xs leading-tight truncate">{p.nombre}</p>
                              {p.descripcion && (
                                <p className="text-white/60 text-[10px] leading-snug mt-0.5 line-clamp-1">{p.descripcion}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {(editingPromo.productos || []).length > 3 && (
                          <p className="text-white/40 text-[9px]">+{(editingPromo.productos || []).length - 3} más</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Columna derecha: imagen circular */}
                  {editingPromo.imagen_url ? (
                    <div className="shrink-0 relative" style={{ width: '140px', height: '140px' }}>
                      <div className="absolute inset-0 rounded-full bg-white/25 blur-2xl scale-125 pointer-events-none" />
                      <div className="absolute -inset-2 rounded-full border border-white/15 pointer-events-none" />
                      <div className="absolute -inset-1 rounded-full border border-white/25 pointer-events-none" />
                      <div className="relative w-full h-full rounded-full overflow-hidden"
                        style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.35), 0 16px 40px rgba(0,0,0,0.45)' }}>
                        <img src={imgUrl(editingPromo.imagen_url)} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="shrink-0 w-28 h-28 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <ImageIcon size={28} className="text-white/25" />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Textos ── */}
              <div className="space-y-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Textos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Nombre interno *</label>
                    <input type="text" placeholder="ej: Promo Martes Familiar"
                      value={editingPromo.nombre}
                      onChange={e => setEditingPromo(p => ({ ...p, nombre: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Precio especial S/</label>
                    <input type="number" placeholder="0.00"
                      value={editingPromo.precio || ''}
                      onChange={e => setEditingPromo(p => ({ ...p, precio: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Título visible *</label>
                    <input type="text" placeholder="ej: ¡Combo Familiar!"
                      value={editingPromo.titulo}
                      onChange={e => setEditingPromo(p => ({ ...p, titulo: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs mb-1.5 block">Texto de descuento</label>
                    <input type="text" placeholder="ej: 50% OFF"
                      value={editingPromo.descuento_texto || ''}
                      onChange={e => setEditingPromo(p => ({ ...p, descuento_texto: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1.5 block">Subtítulo</label>
                  <input type="text" placeholder="ej: Solo los martes · Hasta agotar stock"
                    value={editingPromo.subtitulo || ''}
                    onChange={e => setEditingPromo(p => ({ ...p, subtitulo: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              {/* ── Apariencia ── */}
              <div className="space-y-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Apariencia</p>

                {/* Color swatches */}
                <div>
                  <label className="text-slate-500 text-xs mb-2.5 block">Color de fondo</label>
                  <div className="flex flex-wrap gap-3">
                    {PROMO_COLORS.map(c => (
                      <button key={c.value} type="button" title={c.label}
                        onClick={() => setEditingPromo(p => ({ ...p, color: c.value }))}
                        className={`relative w-10 h-10 rounded-full transition-all duration-150 ${
                          editingPromo.color === c.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-115 shadow-lg'
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: c.value }}
                      >
                        {editingPromo.color === c.value && (
                          <Check size={14} className="text-white absolute inset-0 m-auto drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="text-slate-500 text-xs mb-2 block">Foto del producto <span className="text-slate-600">(aparece en el banner)</span></label>
                  <div className="flex gap-3 items-start">
                    <div
                      onClick={() => promoFileInputRef.current.click()}
                      onDrop={e => { e.preventDefault(); uploadImage(e.dataTransfer.files[0], true); }}
                      onDragOver={e => e.preventDefault()}
                      className="w-20 h-20 bg-slate-800 rounded-xl border-2 border-dashed border-slate-700 hover:border-orange-500 flex items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0"
                    >
                      {editingPromo.imagen_url ? (
                        <img src={imgUrl(editingPromo.imagen_url)} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <ImagePlus size={20} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="O pegar URL de imagen..."
                        value={editingPromo.imagen_url?.startsWith('data:') ? '' : (editingPromo.imagen_url || '')}
                        onChange={e => setEditingPromo(p => ({ ...p, imagen_url: e.target.value }))}
                        className={inputCls} />
                      {editingPromo.imagen_url && (
                        <button type="button"
                          onClick={() => setEditingPromo(p => ({ ...p, imagen_url: '' }))}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                          × Quitar foto
                        </button>
                      )}
                    </div>
                    <input ref={promoFileInputRef} type="file" accept="image/*"
                      onChange={e => uploadImage(e.target.files[0], true)} className="hidden" />
                  </div>
                </div>
              </div>

              {/* ── Vigencia ── */}
              <div className="space-y-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Vigencia
                </p>

                {/* Tipo */}
                <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                  {[
                    { id: 'rango',       label: 'Rango de fechas'  },
                    { id: 'dias_semana', label: 'Días específicos' },
                  ].map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setEditingPromo(p => ({ ...p, vigencia_tipo: t.id }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        editingPromo.vigencia_tipo === t.id
                          ? 'bg-orange-500 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {editingPromo.vigencia_tipo === 'rango' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 text-xs mb-1.5 block">Desde</label>
                      <input type="date"
                        value={editingPromo.inicio_vigencia || ''}
                        onChange={e => setEditingPromo(p => ({ ...p, inicio_vigencia: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-500 text-xs">Hasta</label>
                        <button type="button"
                          onClick={() => setEditingPromo(p => ({ ...p, fin_vigencia: '' }))}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                            !editingPromo.fin_vigencia
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          Sin límite
                        </button>
                      </div>
                      {editingPromo.fin_vigencia !== '' && (
                        <input type="date"
                          value={editingPromo.fin_vigencia || ''}
                          onChange={e => setEditingPromo(p => ({ ...p, fin_vigencia: e.target.value }))}
                          className={inputCls} />
                      )}
                      {!editingPromo.fin_vigencia && (
                        <button type="button"
                          onClick={() => setEditingPromo(p => ({ ...p, fin_vigencia: new Date().toISOString().split('T')[0] }))}
                          className="w-full text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl py-2 hover:border-slate-500 hover:text-slate-400 transition-all"
                        >
                          + Agregar fecha límite
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-500 text-xs mb-2 block">Días activos</label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map((dia, i) => {
                          const active = (editingPromo.dias_semana || []).includes(i);
                          return (
                            <button key={i} type="button" onClick={() => toggleDia(i)}
                              className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                                active
                                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              {dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-500 text-xs">Hasta la fecha</label>
                        <button type="button"
                          onClick={() => setEditingPromo(p => ({ ...p, fin_vigencia: '' }))}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                            !editingPromo.fin_vigencia
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          Sin límite
                        </button>
                      </div>
                      {editingPromo.fin_vigencia !== '' && (
                        <input type="date"
                          value={editingPromo.fin_vigencia || ''}
                          onChange={e => setEditingPromo(p => ({ ...p, fin_vigencia: e.target.value }))}
                          className={inputCls} />
                      )}
                      {!editingPromo.fin_vigencia && (
                        <button type="button"
                          onClick={() => setEditingPromo(p => ({ ...p, fin_vigencia: new Date().toISOString().split('T')[0] }))}
                          className="w-full text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl py-2 hover:border-slate-500 hover:text-slate-400 transition-all"
                        >
                          + Agregar fecha límite
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Productos ── */}
              <div className="space-y-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Productos del combo</p>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Buscar producto para agregar..."
                    value={promoSearch} onChange={e => setPromoSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 placeholder-slate-600 transition-colors" />
                </div>

                <div className="max-h-52 overflow-y-auto bg-slate-800/50 rounded-xl border border-slate-700/80 divide-y divide-slate-700/40">
                  {filteredProducts.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-6">Sin resultados</p>
                  ) : filteredProducts.map(p => {
                    const isSelected = (editingPromo.productos || []).some(sp => sp.id === p.id);
                    const showDesc   = SHOW_DESC_CATS.includes(p.categoria) && p.descripcion;
                    return (
                      <button key={p.id} type="button" onClick={() => togglePromoProduct(p)}
                        className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-700/50 transition-colors text-left ${isSelected ? 'bg-orange-500/10' : ''}`}
                      >
                        {p.imagen_url ? (
                          <img src={imgUrl(p.imagen_url)} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg shrink-0">🍔</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{p.nombre}</p>
                          {showDesc && (
                            <p className="text-slate-400 text-xs leading-tight mt-0.5 line-clamp-2">{p.descripcion}</p>
                          )}
                          <p className="text-orange-400 text-xs font-semibold mt-0.5">S/ {Number(p.precio).toFixed(2)}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-orange-500' : 'border border-slate-600'}`}>
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {(editingPromo.productos || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-xs">{(editingPromo.productos || []).length} producto(s) incluido(s)</p>
                    <div className="flex flex-wrap gap-2">
                      {(editingPromo.productos || []).map(p => {
                        const showDesc = SHOW_DESC_CATS.includes(p.categoria) && p.descripcion;
                        return (
                          <div key={p.id} className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 max-w-55">
                            <div className="flex items-center gap-1">
                              <span className="text-orange-300 text-xs font-semibold truncate">{p.nombre}</span>
                              <button type="button"
                                onClick={() => setEditingPromo(ep => ({ ...ep, productos: (ep.productos || []).filter(sp => sp.id !== p.id) }))}
                                className="text-orange-400/60 hover:text-white transition-colors ml-0.5 shrink-0 text-base leading-none">×</button>
                            </div>
                            {showDesc && (
                              <p className="text-orange-200/50 text-[10px] leading-tight mt-0.5 line-clamp-2">{p.descripcion}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => { setShowPromoForm(false); setPromoSearch(''); }}
                className="flex-1 py-3 border border-slate-700 text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-800 hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={handlePromoSave} disabled={loading}
                className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                {editingPromo.id ? 'Guardar cambios' : 'Crear promoción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
