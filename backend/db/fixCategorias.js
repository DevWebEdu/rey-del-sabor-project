require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

(async () => {
  const client = await pool.connect();
  try {
    // Corregir: Parrilla Familiar y Parrilla Lovers → categoria parrillas
    const r1 = await client.query(
      `UPDATE productos
       SET categoria = 'parrillas'
       WHERE nombre IN ('Parrilla Familiar','Parrilla Lovers') AND activo = 1
       RETURNING nombre, categoria`
    );
    console.log('Actualizados a categoría "parrillas":');
    r1.rows.forEach(r => console.log('  ✓', r.nombre, '→', r.categoria));

    // Resumen final por categoría
    const r2 = await client.query(
      `SELECT categoria, COUNT(*) AS total
       FROM productos
       WHERE activo = 1
       GROUP BY categoria
       ORDER BY categoria`
    );
    console.log('\nResumen final en BD:');
    r2.rows.forEach(r => console.log(`  ${r.categoria.padEnd(15)} : ${r.total} productos`));
    console.log('\n✅ Listo.');
  } finally {
    client.release();
    await pool.end();
  }
})();
