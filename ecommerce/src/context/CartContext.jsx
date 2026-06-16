import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'el_brasero_cart';

const CartContext = createContext();

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { qty = 1, sauces, presaQtys, gaseosaFlavor, complementos, bebidas, ...productData } = action.product;
      const exists = state.items.find(i => i.id === productData.id);
      if (exists) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === productData.id
              ? {
                  ...i,
                  qty:           i.qty + qty,
                  sauces:        sauces        ?? i.sauces,
                  presaQtys:     presaQtys     ?? i.presaQtys,
                  gaseosaFlavor: gaseosaFlavor ?? i.gaseosaFlavor,
                  complementos:  complementos  ?? i.complementos,
                  bebidas:       bebidas       ?? i.bebidas,
                }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            ...productData,
            qty,
            sauces:        sauces        ?? null,
            presaQtys:     presaQtys     ?? null,
            gaseosaFlavor: gaseosaFlavor ?? null,
            complementos:  complementos ?? [],
            bebidas:       bebidas      ?? [],
          },
        ],
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i).filter(i => i.qty > 0),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { items: JSON.parse(saved) } : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const total = state.items.reduce((sum, i) => {
    const compExtras = (i.complementos || []).reduce((s, c) => s + Number(c.precio) * c.qty, 0);
    const bebExtras  = (i.bebidas || []).reduce((s, b) => s + Number(b.precio) * b.qty, 0);
    return sum + i.price * i.qty + compExtras + bebExtras;
  }, 0);

  const count = state.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items: state.items, total, count, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
