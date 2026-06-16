const SAMPLE_ITEMS = [
  [
    { id: 1, name: 'Burger Clásica', price: 18.90, qty: 2, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { id: 9, name: 'Limonada Frozen', price: 8.50, qty: 2, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80' },
  ],
  [
    { id: 3, name: 'Pizza Margherita', price: 32.00, qty: 1, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
    { id: 10, name: 'Smoothie Tropical', price: 10.00, qty: 1, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80' },
  ],
  [
    { id: 7, name: 'Roll Especial', price: 35.00, qty: 1, image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&q=80' },
    { id: 8, name: 'Sashimi Mix', price: 42.00, qty: 1, image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80' },
  ],
  [
    { id: 6, name: 'Alitas Buffalo', price: 19.90, qty: 1, image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80' },
    { id: 11, name: 'Lava Cake', price: 14.00, qty: 2, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80' },
  ],
  [
    { id: 2, name: 'Double Smash', price: 26.90, qty: 2, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80' },
  ],
  [
    { id: 4, name: 'Pizza BBQ Pollo', price: 38.00, qty: 1, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
    { id: 9, name: 'Limonada Frozen', price: 8.50, qty: 3, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80' },
  ],
];

const CUSTOMERS = [
  { name: 'María González', phone: '987654321', notes: 'Timbre no funciona, llamar al llegar' },
  { name: 'Carlos Paredes', phone: '956789012', notes: '' },
  { name: 'Lucía Ríos', phone: '912345678', notes: 'Dejar con el portero' },
  { name: 'Andrés Fuentes', phone: '978901234', notes: 'Sin cebolla por favor' },
  { name: 'Valeria Castro', phone: '934567890', notes: '' },
  { name: 'Diego Morales', phone: '967890123', notes: 'Apartamento 4B' },
];

const ADDRESSES = [
  'Av. Larco 1234, Miraflores, Lima',
  'Calle Schell 567, Miraflores, Lima',
  'Av. José Pardo 890, Miraflores, Lima',
  'Jr. de la Unión 234, Lima Centro, Lima',
  'Av. Benavides 1567, Surco, Lima',
  'Calle Monte Hermoso 345, San Isidro, Lima',
];

const PAYMENTS = ['card', 'yape', 'plin', 'efectivo'];
const STATUSES = ['pending', 'pending', 'preparing', 'delivering', 'delivered'];
const MOTORCYCLISTS = ['Carlos Ramos', 'Luis García', 'Miguel Torres', null, null];

export function generateSeedOrders() {
  const now = Date.now();
  return SAMPLE_ITEMS.map((items, i) => {
    const subtotal = items.reduce((s, item) => s + item.price * item.qty, 0);
    const delivery = subtotal >= 50 ? 0 : 5;
    const status = STATUSES[i % STATUSES.length];
    const motor = MOTORCYCLISTS[i % MOTORCYCLISTS.length];
    return {
      id: `ORD-${now - i * 300000}`,
      createdAt: new Date(now - i * 300000).toISOString(),
      customer: CUSTOMERS[i % CUSTOMERS.length],
      address: ADDRESSES[i % ADDRESSES.length],
      lat: -12.0464 + (Math.random() - 0.5) * 0.05,
      lon: -77.0428 + (Math.random() - 0.5) * 0.05,
      paymentMethod: PAYMENTS[i % PAYMENTS.length],
      items,
      subtotal,
      delivery,
      total: subtotal + delivery,
      status,
      motorizado: (status === 'delivering' || status === 'delivered') ? motor || 'Juan Pérez' : undefined,
    };
  });
}
