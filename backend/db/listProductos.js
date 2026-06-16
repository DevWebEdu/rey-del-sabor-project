require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});
(async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, nombre, precio, categoria, activo FROM productos ORDER BY id`
    );
    rows.forEach(r => console.log(`[${r.id}] ${r.activo ? '✓' : '✗'} | ${String(r.categoria).padEnd(16)} | S/${Number(r.precio).toFixed(2).padStart(7)} | ${r.nombre}`));
    console.log(`\nTotal: ${rows.length} productos`);
  } finally { client.release(); await pool.end(); }
})();
