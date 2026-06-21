require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { v2: cloudinary } = require('cloudinary');
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function updateDB(oldPattern, newUrl) {
  const client = await pool.connect();
  try {
    const r1 = await client.query(
      `UPDATE productos SET imagen_url = $1 WHERE imagen_url LIKE $2`, [newUrl, oldPattern]
    );
    const r2 = await client.query(
      `UPDATE promociones SET imagen_url = $1 WHERE imagen_url LIKE $2`, [newUrl, oldPattern]
    );
    return { productos: r1.rowCount, promociones: r2.rowCount };
  } finally {
    client.release();
  }
}

async function run() {
  const localFiles = fs.readdirSync(UPLOADS_DIR);
  console.log(`Archivos a migrar: ${localFiles.length}\n`);

  for (const filename of localFiles) {
    const filePath = path.join(UPLOADS_DIR, filename);
    const publicId = path.parse(filename).name;

    console.log(`Subiendo ${filename}...`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'reysabor',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    });
    const newUrl = result.secure_url;
    console.log(`  URL: ${newUrl}`);

    const counts = await updateDB(`%/uploads/${filename}`, newUrl);
    console.log(`  productos: ${counts.productos} | promociones: ${counts.promociones}`);
  }

  await pool.end();
  console.log('\nMigración completada.');
}

run().catch(err => { console.error(err.message); process.exit(1); });
