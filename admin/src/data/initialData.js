export const categories = [
  { id: 'all',          label: 'Todo',                        emoji: '🍽️' },
  { id: 'combos_pollo', label: 'Combos de Pollos a la Brasa',  emoji: '🍗' },
  { id: 'parrillas',    label: 'Parrillas',                    emoji: '🔥' },
  { id: 'platos_carta', label: 'Platos a la Carta',            emoji: '🥩' },
  { id: 'complementos', label: 'Complementos',                 emoji: '🍟' },
  { id: 'bebidas',      label: 'Bebidas',                      emoji: '🥤' },
];

export const initialProducts = [
  {
    id: 1, category: 'combos_pollo',
    name: 'Pollo Entero a la Brasa', price: 52.00,
    description: 'Pollo entero marinado en especias secretas, asado a leña. Incluye papas fritas y ensalada.',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80',
    badge: 'Más Pedido', rating: 4.9, reviews: 512, time: '35-40 min'
  },
  {
    id: 2, category: 'combos_pollo',
    name: '½ Pollo a la Brasa', price: 29.00,
    description: 'Medio pollo jugoso a la brasa con papas fritas y ensalada fresca.',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80',
    badge: 'Popular', rating: 4.8, reviews: 389, time: '30-35 min'
  },
  {
    id: 3, category: 'combos_pollo',
    name: '¼ Pollo a la Brasa', price: 18.00,
    description: 'Cuarto de pollo a la brasa con papas fritas y ensalada.',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    badge: null, rating: 4.7, reviews: 620, time: '25-30 min'
  },
  {
    id: 4, category: 'platos_carta',
    name: 'Parrillada Mixta para 2', price: 78.00,
    description: 'Costillas, churrasco, chorizo criollo, anticuchos y choclo para dos personas.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
    badge: '🔥 Para 2', rating: 4.9, reviews: 298, time: '40-45 min'
  },
  {
    id: 5, category: 'platos_carta',
    name: 'Anticuchos de Corazón', price: 22.00,
    description: '6 brochetas de corazón de res marinadas en ají panca, asadas al carbón.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    badge: 'Típico', rating: 4.8, reviews: 445, time: '25-30 min'
  },
  {
    id: 6, category: 'combos_pollo',
    name: 'Combo Familiar', price: 95.00,
    description: 'Pollo entero + 1kg papas + ensalada grande + 4 bebidas.',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80',
    badge: '🔥 Familiar', rating: 4.9, reviews: 356, time: '40-45 min'
  },
  {
    id: 7, category: 'complementos',
    name: 'Papas Fritas Grandes', price: 12.00,
    description: 'Papas fritas crujientes en abundante porción.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    badge: null, rating: 4.7, reviews: 920, time: '10-15 min'
  },
  {
    id: 8, category: 'bebidas',
    name: 'Chicha Morada 1L', price: 10.00,
    description: 'Chicha morada artesanal preparada con maíz morado, piña y canela.',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
    badge: 'Artesanal', rating: 4.9, reviews: 567, time: '5 min'
  },
];
