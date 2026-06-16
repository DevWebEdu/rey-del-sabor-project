export const categories = [
  { id: 'all',          label: 'Todo',                        emoji: '🍽️' },
  { id: 'combos_pollo', label: 'Combos de Pollos a la Brasa',  emoji: '🍗' },
  { id: 'platos_carta', label: 'Platos a la Carta',            emoji: '🥩' },
  { id: 'parrillas',    label: 'Parrillas',                    emoji: '🔥' },
  { id: 'complementos', label: 'Complementos',                 emoji: '🍟' },
  { id: 'bebidas',      label: 'Bebidas',                      emoji: '🥤' },
];

export const initialProducts = [
  // ── POLLO A LA BRASA ──────────────────────────────────────
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
    id: 4, category: 'combos_pollo',
    name: '⅛ Pollo a la Brasa', price: 12.00,
    description: 'Un octavo de pollo a la brasa, ideal para los más pequeños. Con papas.',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80',
    badge: null, rating: 4.6, reviews: 210, time: '20-25 min'
  },

  // ── PARRILLAS ─────────────────────────────────────────────
  {
    id: 5, category: 'platos_carta',
    name: 'Parrillada Mixta para 2', price: 78.00,
    description: 'Costillas de cerdo, churrasco, chorizo criollo, anticuchos y choclo. Para dos personas.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
    badge: '🔥 Para 2', rating: 4.9, reviews: 298, time: '40-45 min'
  },
  {
    id: 6, category: 'platos_carta',
    name: 'Churrasco', price: 35.00,
    description: '300g de churrasco de res a la parrilla con chimichurri, papas doradas y ensalada.',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80',
    badge: 'Premium', rating: 4.8, reviews: 174, time: '30-35 min'
  },
  {
    id: 7, category: 'platos_carta',
    name: 'Costillas BBQ', price: 42.00,
    description: '400g de costillas de cerdo adobadas, glaseadas con salsa BBQ casera y papas rústicas.',
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80',
    badge: 'Especial', rating: 4.9, reviews: 231, time: '40-45 min'
  },
  {
    id: 8, category: 'platos_carta',
    name: 'Anticuchos de Corazón', price: 22.00,
    description: '6 brochetas de corazón de res marinadas en ají panca, asadas al carbón. Con papa y choclo.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    badge: 'Típico', rating: 4.8, reviews: 445, time: '25-30 min'
  },
  {
    id: 9, category: 'platos_carta',
    name: 'Chorizo Criollo', price: 18.00,
    description: '3 chorizos criollos a la parrilla con sarsa criolla y pan de campo.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
    badge: null, rating: 4.6, reviews: 189, time: '20-25 min'
  },

  // ── COMBOS ────────────────────────────────────────────────
  {
    id: 10, category: 'combos_pollo',
    name: 'Combo Familiar', price: 95.00,
    description: 'Pollo entero + 1kg de papas fritas + ensalada grande + 4 bebidas 500ml. ¡Para toda la familia!',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80',
    badge: '🔥 Familiar', rating: 4.9, reviews: 356, time: '40-45 min'
  },
  {
    id: 11, category: 'combos_pollo',
    name: 'Combo Pareja', price: 58.00,
    description: '½ pollo a la brasa + papas fritas + ensalada + 2 bebidas. Perfecto para dos.',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    badge: 'Para 2', rating: 4.8, reviews: 267, time: '30-35 min'
  },
  {
    id: 12, category: 'combos_pollo',
    name: 'Combo Personal', price: 28.00,
    description: '¼ pollo a la brasa + papas fritas + ensalada + 1 bebida 500ml.',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80',
    badge: 'Lo más pedido', rating: 4.8, reviews: 834, time: '25-30 min'
  },

  // ── ACOMPAÑAMIENTOS ───────────────────────────────────────
  {
    id: 13, category: 'complementos',
    name: 'Papas Fritas Grandes', price: 12.00,
    description: 'Papas fritas crujientes en abundante porción, sazonadas con sal y ají.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    badge: null, rating: 4.7, reviews: 920, time: '10-15 min'
  },
  {
    id: 14, category: 'complementos',
    name: 'Yuca Frita', price: 10.00,
    description: 'Yuca peruana frita hasta quedar dorada por fuera, suave por dentro. Con salsa huancaína.',
    image: 'https://images.unsplash.com/photo-1580821810991-c9c35b34a44c?w=400&q=80',
    badge: 'Típico', rating: 4.6, reviews: 312, time: '15-20 min'
  },
  {
    id: 15, category: 'complementos',
    name: 'Ensalada Fresca', price: 8.00,
    description: 'Lechuga, tomate, pepino, cebolla y zanahoria con aderezo de la casa.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    badge: null, rating: 4.5, reviews: 156, time: '5-10 min'
  },
  {
    id: 16, category: 'complementos',
    name: 'Papa a la Huancaína', price: 11.00,
    description: 'Papas sancochadas bañadas en cremosa salsa huancaína con huevo y aceituna.',
    image: 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=400&q=80',
    badge: 'Peruano 🇵🇪', rating: 4.8, reviews: 278, time: '10 min'
  },
  {
    id: 17, category: 'complementos',
    name: 'Choclo con Queso', price: 7.00,
    description: 'Choclo serrano sancochado servido con queso fresco y ají molido.',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
    badge: null, rating: 4.5, reviews: 198, time: '10 min'
  },
  {
    id: 18, category: 'complementos',
    name: 'Arroz con Leche', price: 9.00,
    description: 'Cremoso arroz con leche con canela y pasas, receta casera.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
    badge: null, rating: 4.6, reviews: 143, time: '5 min'
  },

  // ── BEBIDAS ───────────────────────────────────────────────
  {
    id: 19, category: 'bebidas',
    name: 'Chicha Morada 1L', price: 10.00,
    description: 'Chicha morada artesanal preparada con maíz morado, piña y canela. Fría y natural.',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
    badge: 'Artesanal', rating: 4.9, reviews: 567, time: '5 min'
  },
  {
    id: 20, category: 'bebidas',
    name: 'Inca Kola 1.5L', price: 9.00,
    description: 'La bebida del Perú. Botella familiar de 1.5 litros bien fría.',
    image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&q=80',
    badge: null, rating: 4.7, reviews: 489, time: '5 min'
  },
  {
    id: 21, category: 'bebidas',
    name: 'Limonada Frozen', price: 8.00,
    description: 'Limonada natural frozen bien fría, con menta y un toque de azúcar.',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80',
    badge: null, rating: 4.7, reviews: 334, time: '5 min'
  },
  {
    id: 22, category: 'bebidas',
    name: 'Cerveza Pilsen 620ml', price: 11.00,
    description: 'Cerveza Pilsen Callao bien helada, la clásica para acompañar la parrilla.',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
    badge: null, rating: 4.6, reviews: 412, time: '5 min'
  },
];

export const promotions = [
  {
    id: 1,
    title: 'Pollo Entero + 1L Chicha',
    subtitle: 'Solo hoy • Oferta especial del día',
    discount: 'S/ 58 TODO',
    color: 'from-orange-600 to-red-700',
    emoji: '🍗'
  },
  {
    id: 2,
    title: 'Combo Pareja',
    subtitle: '½ Pollo + papas + 2 bebidas',
    discount: 'S/ 58.00',
    color: 'from-red-600 to-orange-700',
    emoji: '🔥'
  },
  {
    id: 3,
    title: 'Delivery Gratis',
    subtitle: 'En pedidos mayores a S/ 50',
    discount: 'FREE DELIVERY',
    color: 'from-amber-600 to-orange-700',
    emoji: '🛵'
  },
];
