import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Check, ImagePlus, Megaphone, Search } from 'lucide-react';
import { categories } from '../data/initialData';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EMPTY_PRODUCT = { nombre: '', precio: '', descripcion: '', categoria: 'burgers', imagen_url: '' };
const EMPTY_PROMO   = {
  nombre: '', titulo: '', subtitulo: '', descuento_texto: '', emoji: '🍔',
  color: 'from-orange-500 to-red-600', inicio_vigencia: '', fin_vigencia: '',
  precio: '', productos: [],
};

const PROMO_COLORS = [
  { label: 'Naranja-Rojo',  value: 'from-orange-500 to-red-600'   },
  { label: 'Rojo-Rosa',     value: 'from-red-500 to-pink-600'     },
  { label: 'Ámbar-Naranja', value: 'from-amber-500 to-orange-600' },
  { label: 'Azul-Índigo',   value: 'from-blue-500 to-indigo-600'  },
  { label: 'Verde-Teal',    value: 'from-green-500 to-teal-600'   },
];

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts]       = useState([]);
  const [promos, setPromos]           = useState([]);
  const [activeTab, setActiveTab]     = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingPromo, setEditingPromo]   = useState(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [promoSearch, setPromoSearch]     = useState('');
  const [productSearch, setProductSearch] = useState('');
  const fileInputRef = useRef();

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

  // ── Productos ────────────────────────────────────────────────────────
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

  const uploadImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res  = await fetch(`${API_URL}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (data.url) setEditingProduct(p => ({ ...p, imagen_url: data.url }));
    } catch { alert('Error al subir la imagen'); }
  };

  // ── Promociones ──────────────────────────────────────────────────────
  const handlePromoSave = async () => {
    if (!editingPromo.nombre || !editingPromo.titulo) return;
    setLoading(true);
    try {
      const body = {
        ...editingPromo,
        precio:    editingPromo.precio || null,
        productos: (editingPromo.productos || []).length > 0 ? editingPromo.productos : null,
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

  const openEditPromo = (promo) => {
    setEditingPromo({
      ...promo,
      precio:    promo.precio    || '',
      productos: Array.isArray(promo.productos) ? promo.productos : [],
    });
    setPromoSearch('');
    setShowPromoForm(true);
  };

  const togglePromoProduct = (product) => {
    const current  = editingPromo.productos || [];
    const exists   = current.some(p => p.id === product.id);
    const updated  = exists
      ? current.filter(p => p.id !== product.id)
      : [...current, { id: product.id, nombre: product.nombre, precio: Number(product.precio), imagen_url: product.imagen_url || '' }];
    setEditingPromo(p => ({ ...p, productos: updated }));
  };

  const productList = Array.isArray(products) ? products : (products?.data || []);
  const displayedProducts = productList.filter(p =>
    p.nombre.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredProducts = productList.filter(p =>
    p.nombre.toLowerCase().includes(promoSearch.toLowerCase())
  );

  const promoStatus = (promo) => {
    const now = new Date();
    const ini = promo.inicio_vigencia ? new Date(promo.inicio_vigencia) : null;
    const fin = promo.fin_vigencia    ? new Date(promo.fin_vigencia)    : null;
    if (ini && ini > now) return { label: '◷ Programada', cls: 'bg-blue-500/30 text-blue-200'   };
    if (fin && fin < now) return { label: '✕ Vencida',    cls: 'bg-red-500/30 text-red-200'     };
    if (ini || fin)       return { label: '● Activa',     cls: 'bg-green-500/30 text-green-200' };
    return                       { label: '○ Sin fechas', cls: 'bg-white/20 text-white/70'      };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Productos & Promociones</h1>
        <p className="text-slate-400 text-sm">{productList.length} productos · {promos.length} promociones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'products', label: '🍔 Productos', count: productList.length }, { id: 'promos', label: '🎯 Promociones', count: promos.length }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Productos ── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-500"
              />
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
                <p className="text-slate-400">{productSearch ? 'Sin resultados para tu búsqueda' : 'No hay productos todavía'}</p>
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
                      <tr
                        key={product.id}
                        onClick={() => { setEditingProduct({ ...product, precio: String(product.precio) }); setShowProductForm(true); }}
                        className="border-b border-slate-700/60 last:border-0 hover:bg-slate-700/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          {product.imagen_url ? (
                            <img
                              src={product.imagen_url}
                              alt={product.nombre}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-700 group-hover:border-orange-500/40 transition-colors"
                            />
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
                          <span className="text-xs bg-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg capitalize">
                            {product.categoria || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-orange-400 font-black">S/ {Number(product.precio).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { setEditingProduct({ ...product, precio: String(product.precio) }); setShowProductForm(true); }}
                              className="w-8 h-8 bg-slate-700 hover:bg-blue-500/20 border border-slate-600 hover:border-blue-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleProductDelete(product.id)}
                              className="w-8 h-8 bg-slate-700 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
                            >
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
              const st = promoStatus(promo);
              const promoProds = Array.isArray(promo.productos) ? promo.productos : [];
              return (
                <div key={promo.id} className={`relative bg-linear-to-r ${promo.color} rounded-2xl p-5 overflow-hidden group`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                  <div className="relative">
                    <p className="text-white/70 text-xs">{promo.subtitulo}</p>
                    <p className="text-white font-black text-lg leading-tight">{promo.titulo}</p>
                    {promo.descuento_texto && <p className="text-white/90 text-2xl font-black mt-1">{promo.descuento_texto}</p>}
                    {promo.precio && <p className="text-white font-black text-xl mt-0.5">S/ {Number(promo.precio).toFixed(2)}</p>}

                    {/* Productos incluidos */}
                    {promoProds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {promoProds.slice(0, 3).map(p => (
                          <span key={p.id} className="text-[10px] bg-black/20 text-white/90 px-2 py-0.5 rounded-full">{p.nombre}</span>
                        ))}
                        {promoProds.length > 3 && (
                          <span className="text-[10px] bg-black/20 text-white/90 px-2 py-0.5 rounded-full">+{promoProds.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="text-4xl mt-2">{promo.emoji}</div>

                    <div className="mt-2 space-y-0.5">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {promo.inicio_vigencia && <p className="text-white/50 text-xs">Desde: {new Date(promo.inicio_vigencia).toLocaleDateString('es-PE', {day:'2-digit',month:'short',year:'numeric'})}</p>}
                      {promo.fin_vigencia    && <p className="text-white/50 text-xs">Hasta: {new Date(promo.fin_vigencia).toLocaleDateString('es-PE', {day:'2-digit',month:'short',year:'numeric'})}</p>}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditPromo(promo)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-blue-600">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handlePromoDelete(promo.id)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-red-500">
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
                    <img src={editingProduct.imagen_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-slate-500 mb-2" />
                      <p className="text-slate-400 text-xs font-medium">Clic o arrastra una imagen</p>
                      <p className="text-slate-600 text-xs mt-0.5">JPG, PNG, WEBP · máx 15 MB</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={e => uploadImage(e.target.files[0])} className="hidden" />
                <input type="text" placeholder="O pegar URL de imagen..."
                  value={editingProduct.imagen_url?.startsWith('data:') ? '' : (editingProduct.imagen_url || '')}
                  onChange={e => setEditingProduct(p => ({ ...p, imagen_url: e.target.value }))}
                  className="w-full mt-2 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  rows={2} className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Descripción del producto..." />
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
              <h3 className="text-white font-bold">{editingPromo.id ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={() => { setShowPromoForm(false); setPromoSearch(''); }} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Preview */}
              <div className={`relative bg-linear-to-r ${editingPromo.color} rounded-xl p-4 overflow-hidden`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                <p className="text-white/70 text-xs">{editingPromo.subtitulo || 'Subtítulo'}</p>
                <p className="text-white font-black text-lg">{editingPromo.titulo || 'Título'}</p>
                {editingPromo.descuento_texto && <p className="text-white/90 text-2xl font-black">{editingPromo.descuento_texto}</p>}
                {editingPromo.precio && <p className="text-white font-black text-xl">S/ {editingPromo.precio}</p>}
                {(editingPromo.productos || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(editingPromo.productos || []).slice(0, 3).map(p => (
                      <span key={p.id} className="text-[10px] bg-black/20 text-white/90 px-2 py-0.5 rounded-full">{p.nombre}</span>
                    ))}
                    {(editingPromo.productos || []).length > 3 && (
                      <span className="text-[10px] bg-black/20 text-white/90 px-2 py-0.5 rounded-full">+{(editingPromo.productos || []).length - 3}</span>
                    )}
                  </div>
                )}
                <div className="text-3xl mt-1">{editingPromo.emoji}</div>
              </div>

              {/* Campos base */}
              <input type="text" placeholder="Nombre interno *" value={editingPromo.nombre} onChange={e => setEditingPromo(p => ({ ...p, nombre: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Título visible *" value={editingPromo.titulo} onChange={e => setEditingPromo(p => ({ ...p, titulo: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Subtítulo (ej: Solo hoy)" value={editingPromo.subtitulo || ''} onChange={e => setEditingPromo(p => ({ ...p, subtitulo: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Texto descuento (ej: 50% OFF)" value={editingPromo.descuento_texto || ''} onChange={e => setEditingPromo(p => ({ ...p, descuento_texto: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Inicio vigencia</label>
                  <input type="datetime-local" value={editingPromo.inicio_vigencia || ''} onChange={e => setEditingPromo(p => ({ ...p, inicio_vigencia: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Fin vigencia</label>
                  <input type="datetime-local" value={editingPromo.fin_vigencia || ''} onChange={e => setEditingPromo(p => ({ ...p, fin_vigencia: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Emoji" value={editingPromo.emoji} onChange={e => setEditingPromo(p => ({ ...p, emoji: e.target.value }))}
                  className="bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-2xl focus:outline-none focus:border-orange-500 text-center" />
                <select value={editingPromo.color} onChange={e => setEditingPromo(p => ({ ...p, color: e.target.value }))}
                  className="bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500">
                  {PROMO_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* ── Sección productos ── */}
              <div className="border-t border-slate-700 pt-3 space-y-2.5">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Productos de la promoción</p>

                {/* Precio especial */}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Precio especial S/</label>
                  <input type="number" placeholder="0.00" value={editingPromo.precio || ''}
                    onChange={e => setEditingPromo(p => ({ ...p, precio: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
                </div>

                {/* Búsqueda */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Buscar producto..." value={promoSearch}
                    onChange={e => setPromoSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-500 placeholder-slate-600" />
                </div>

                {/* Lista de productos */}
                <div className="max-h-44 overflow-y-auto bg-slate-900 rounded-xl border border-slate-700 divide-y divide-slate-700/50">
                  {filteredProducts.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-5">Sin resultados</p>
                  ) : filteredProducts.map(p => {
                    const isSelected = (editingPromo.productos || []).some(sp => sp.id === p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => togglePromoProduct(p)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/60 transition-colors text-left ${isSelected ? 'bg-orange-500/10' : ''}`}
                      >
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-lg shrink-0">🍔</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{p.nombre}</p>
                          <p className="text-slate-400 text-xs">S/ {Number(p.precio).toFixed(2)}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-orange-500' : 'border border-slate-600'}`}>
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Chips seleccionados */}
                {(editingPromo.productos || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(editingPromo.productos || []).map(p => (
                      <span key={p.id} className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs px-2 py-1 rounded-lg">
                        {p.nombre}
                        <button type="button"
                          onClick={() => setEditingPromo(ep => ({ ...ep, productos: (ep.productos || []).filter(sp => sp.id !== p.id) }))}
                          className="text-orange-400/70 hover:text-white ml-0.5 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3 shrink-0">
              <button onClick={() => { setShowPromoForm(false); setPromoSearch(''); }}
                className="flex-1 py-3 border border-slate-600 text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-700">
                Cancelar
              </button>
              <button onClick={handlePromoSave} disabled={loading}
                className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
