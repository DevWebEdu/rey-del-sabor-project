require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, nombre, imagen_url FROM productos WHERE imagen_url IS NOT NULL ORDER BY id LIMIT 5`
    );
    rows.forEach(r => console.log(`[${r.id}] ${r.nombre}: ${r.imagen_url}`));
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(e => { console.error(e.message); process.exit(1); });
