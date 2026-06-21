require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const OLD = 'http://localhost:3001';
const NEW = 'https://chatbot-edu-rey-te-vende.k6vtoi.easypanel.host';

async function run() {
  const client = await pool.connect();
  try {
    const r1 = await client.query(
      `UPDATE productos
       SET imagen_url = REPLACE(imagen_url, $1, $2)
       WHERE imagen_url LIKE $3`,
      [OLD, NEW, `${OLD}/uploads/%`]
    );
    console.log(`productos actualizados: ${r1.rowCount}`);

    const r2 = await client.query(
      `UPDATE promociones
       SET imagen_url = REPLACE(imagen_url, $1, $2)
       WHERE imagen_url LIKE $3`,
      [OLD, NEW, `${OLD}/uploads/%`]
    );
    console.log(`promociones actualizadas: ${r2.rowCount}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
