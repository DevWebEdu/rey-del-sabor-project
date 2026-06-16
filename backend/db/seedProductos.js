/**
 * Seed de productos reales - El Rey del Sabor
 * Ejecutar: node db/seedProductos.js
 *
 * Productos extraídos del menú oficial (imágenes del local).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Imágenes base por categoría (Unsplash food photos)
const IMG = {
  pollo_brasa:   'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80',
  medio_pollo:   'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
  cuarto_pollo:  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
  parrilla:      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  anticucho:     'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  chorizo:       'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  salchipapa:    'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
  mollejas:      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80',
  filete_pollo:  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  bistec:        'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',
  churrasco:     'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=600&q=80',
  tequeños:      'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&q=80',
  papas_fritas:  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
  cremas:        'https://images.unsplash.com/photo-1612392062126-a1d73ber6f87?w=600&q=80',
  gaseosa:       'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600&q=80',
  chicha:        'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
  agua:          'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80',
  cerveza:       'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80',
  vino:          'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
};

const productos = [
  // ── COMBOS DE POLLO A LA BRASA ──────────────────────────────
  {
    nombre: 'Combo 1',
    descripcion: '2 Pollos a la Brasa. 2 Gaseosas 1.5 litros. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 168.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 2',
    descripcion: '1 Pollo a la Brasa + 1/2 pollo (parte pierna). Gaseosa 1.5 litros. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 107.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 3',
    descripcion: '1 Pollo a la Brasa + 1/2 pollo (parte pierna). Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 102.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.medio_pollo,
  },
  {
    nombre: 'Combo 4',
    descripcion: '1 Pollo a la Brasa + 1/4 pollo (parte pierna). Gaseosa 1.5 litros. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 102.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 5',
    descripcion: '1 Pollo a la Brasa + 1/4 pollo (parte pierna). Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 97.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 6',
    descripcion: '1 Pollo a la Brasa. Gaseosa 1.5 litros. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 87.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 7',
    descripcion: '1 Pollo a la Brasa. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 77.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.pollo_brasa,
  },
  {
    nombre: 'Combo 8',
    descripcion: '1/2 Pollo a la Brasa. Gaseosa 1 litro. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 49.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.medio_pollo,
  },
  {
    nombre: 'Combo 9',
    descripcion: '1/2 Pollo a la Brasa. Gaseosa 600 Ml. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 47.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.medio_pollo,
  },
  {
    nombre: 'Combo 10',
    descripcion: '1/2 Pollo a la Brasa. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 43.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.medio_pollo,
  },
  {
    nombre: 'Combo 11',
    descripcion: '1/4 Pollo a la Brasa. Gaseosa 600 Ml. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 29.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.cuarto_pollo,
  },
  {
    nombre: 'Combo 12',
    descripcion: '1/4 Pollo a la Brasa. Papas Naturales fritas. Ensalada fresca. Cremas de la casa.',
    precio: 25.00,
    categoria: 'combos_pollo',
    imagen_url: IMG.cuarto_pollo,
  },

  // ── PARRILLAS ────────────────────────────────────────────────
  {
    nombre: 'Parrilla Familiar',
    descripcion: '300 gr. Chuleta de lomo. 300 gr. Churrasco. 300 gr. Mollejitas. 3 Palos de anticucho. 1/2 pollo a la brasa. 4 unid. chorizo parrillero. Papas naturales fritas. Ensalada fresca familiar. Cremas de la casa. Chimichurri incluido. + GRATIS Gaseosa o Chicha de 1 Litro.',
    precio: 185.00,
    categoria: 'parrillas',
    imagen_url: IMG.parrilla,
  },
  {
    nombre: 'Parrilla Lovers',
    descripcion: '150 gr. Chuleta de lomo. 150 gr. Churrasco. 150 gr. Mollejitas. 1 Palo de anticucho. 1/4 de pollo a la brasa (parte pierna). 2 unid. chorizo parrillero. Papas naturales fritas. Ensalada fresca familiar. Cremas de la casa. Chimichurri incluido. + GRATIS Gaseosa o Chicha de 1 Litro.',
    precio: 108.00,
    categoria: 'parrillas',
    imagen_url: IMG.parrilla,
  },

  // ── PLATOS A LA CARTA ────────────────────────────────────────
  {
    nombre: 'Piqueo del Rey',
    descripcion: 'Tequeños rellenos de Queso. Guacamole.',
    precio: 17.00,
    categoria: 'platos_carta',
    imagen_url: IMG.tequeños,
  },
  {
    nombre: 'Chorizo Parrillero',
    descripcion: 'Papas naturales fritas. Ensalada personal. Cremas de la casa.',
    precio: 27.00,
    categoria: 'platos_carta',
    imagen_url: IMG.chorizo,
  },
  {
    nombre: 'Salchipapa King',
    descripcion: 'Salchicha frankfurt. Papas naturales fritas. Cremas de la casa.',
    precio: 18.00,
    categoria: 'platos_carta',
    imagen_url: IMG.salchipapa,
  },
  {
    nombre: 'Especial King',
    descripcion: 'Chorizo parrillero. Salchicha frankfurt. Papas naturales fritas. Cremas de la casa.',
    precio: 20.00,
    categoria: 'platos_carta',
    imagen_url: IMG.chorizo,
  },
  {
    nombre: 'Mollejitas a la Parrilla',
    descripcion: '300 gr. de mollejitas. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 26.00,
    categoria: 'platos_carta',
    imagen_url: IMG.mollejas,
  },
  {
    nombre: 'Filete de Pierna',
    descripcion: 'Pierna deshuesada. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 27.00,
    categoria: 'platos_carta',
    imagen_url: IMG.filete_pollo,
  },
  {
    nombre: 'Anticucho Parrillero',
    descripcion: 'Corazón de res. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 30.00,
    categoria: 'platos_carta',
    imagen_url: IMG.anticucho,
  },
  {
    nombre: 'Chuleta Parrillera',
    descripcion: '300 gr. de Chuleta de Lomo. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 28.00,
    categoria: 'platos_carta',
    imagen_url: IMG.bistec,
  },
  {
    nombre: 'Pechuga a la Parrilla',
    descripcion: 'Filete de pechuga. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 28.00,
    categoria: 'platos_carta',
    imagen_url: IMG.filete_pollo,
  },
  {
    nombre: 'Bistec a la Parrilla',
    descripcion: 'Bistec. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 30.00,
    categoria: 'platos_carta',
    imagen_url: IMG.bistec,
  },
  {
    nombre: 'Churrasco a la Parrilla',
    descripcion: '300 gr. de Churrasco. Papas naturales fritas. Ensalada personal. Cremas de la casa. Incluye chimichurri.',
    precio: 32.00,
    categoria: 'platos_carta',
    imagen_url: IMG.churrasco,
  },

  // ── COMPLEMENTOS ─────────────────────────────────────────────
  {
    nombre: 'Porción de Papas Naturales Fritas',
    descripcion: 'Porción de papas naturales fritas crujientes.',
    precio: 12.00,
    categoria: 'complementos',
    imagen_url: IMG.papas_fritas,
  },
  {
    nombre: 'Cremas para Llevar (Pote 4 oz)',
    descripcion: 'Pote de 4 onzas de cremas de la casa para llevar.',
    precio: 5.00,
    categoria: 'complementos',
    imagen_url: IMG.papas_fritas,
  },
  {
    nombre: 'Cremas para Llevar (Pote Grande 4 oz)',
    descripcion: 'Pote grande de 4 onzas de cremas de la casa para llevar.',
    precio: 7.00,
    categoria: 'complementos',
    imagen_url: IMG.papas_fritas,
  },

  // ── BEBIDAS ──────────────────────────────────────────────────
  {
    nombre: 'Gaseosa 1.5 Lt.',
    descripcion: 'Botella de gaseosa de 1.5 litros bien fría.',
    precio: 13.50,
    categoria: 'bebidas',
    imagen_url: IMG.gaseosa,
  },
  {
    nombre: 'Gaseosa 1 Lt.',
    descripcion: 'Botella de gaseosa de 1 litro bien fría.',
    precio: 11.50,
    categoria: 'bebidas',
    imagen_url: IMG.gaseosa,
  },
  {
    nombre: 'Gaseosa 600 Ml.',
    descripcion: 'Botella de gaseosa de 600 ml bien fría.',
    precio: 6.00,
    categoria: 'bebidas',
    imagen_url: IMG.gaseosa,
  },
  {
    nombre: 'Chicha 1 Lt.',
    descripcion: 'Chicha artesanal de 1 litro.',
    precio: 15.00,
    categoria: 'bebidas',
    imagen_url: IMG.chicha,
  },
  {
    nombre: 'Chicha 1/2 Lt.',
    descripcion: 'Chicha artesanal de 1/2 litro.',
    precio: 10.00,
    categoria: 'bebidas',
    imagen_url: IMG.chicha,
  },
  {
    nombre: 'Agua',
    descripcion: 'Botella de agua mineral.',
    precio: 3.50,
    categoria: 'bebidas',
    imagen_url: IMG.agua,
  },
  {
    nombre: 'Cusqueña',
    descripcion: 'Cerveza Cusqueña bien helada.',
    precio: 8.00,
    categoria: 'bebidas',
    imagen_url: IMG.cerveza,
  },
  {
    nombre: 'Pilsen',
    descripcion: 'Cerveza Pilsen Callao bien helada.',
    precio: 7.00,
    categoria: 'bebidas',
    imagen_url: IMG.cerveza,
  },
  {
    nombre: 'Vino',
    descripcion: 'Copa de vino tinto o blanco.',
    precio: 22.00,
    categoria: 'bebidas',
    imagen_url: IMG.vino,
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando seed de productos...\n');

    // Desactivar productos anteriores (soft delete)
    await client.query(`UPDATE productos SET activo = 0`);
    console.log('   → Productos anteriores desactivados.');

    // Insertar todos los productos del menú
    let insertados = 0;
    for (const p of productos) {
      await client.query(
        `INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, activo)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [p.nombre, p.descripcion, p.precio, p.categoria, p.imagen_url]
      );
      insertados++;
      console.log(`   ✓ ${p.nombre} — S/ ${p.precio.toFixed(2)}`);
    }

    console.log(`\n✅ Seed completado: ${insertados} productos insertados.\n`);
  } catch (err) {
    console.error('❌ Error en el seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
