import { createContext, useContext, useState, useEffect } from 'react';

const ProductsContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiToLocal = (p) => ({
  id:          p.id,
  name:        p.nombre,
  description: p.descripcion || '',
  price:       Number(p.precio),
  category:    p.categoria || 'combos_pollo',
  image:       p.imagen_url || '',
  badge:       '',
  rating:      4.8,
  reviews:     0,
  time:        '25-30 min',
});

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.map(apiToLocal));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const interval = setInterval(loadProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, reload: loadProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);
