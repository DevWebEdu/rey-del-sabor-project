const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options:  '-c timezone=America/Lima',
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Fijar timezone de Perú (UTC-5) a nivel de base de datos
    await client.query(`ALTER DATABASE "${process.env.DB_NAME}" SET timezone TO 'America/Lima'`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            SERIAL PRIMARY KEY,
        nombre        TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rol           TEXT NOT NULL CHECK(rol IN ('admin','operario','motorizado')),
        activo        INTEGER DEFAULT 1,
        created_at    TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS motorizados (
        id         SERIAL PRIMARY KEY,
        nombre     TEXT NOT NULL,
        disponible INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS estados_pedido (
        id     SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS productos (
        id          SERIAL PRIMARY KEY,
        nombre      TEXT NOT NULL,
        descripcion TEXT,
        precio      NUMERIC(10,2) NOT NULL,
        categoria   TEXT,
        imagen_url  TEXT,
        activo      INTEGER DEFAULT 1,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS promociones (
        id              SERIAL PRIMARY KEY,
        nombre          TEXT NOT NULL,
        descripcion     TEXT,
        precio          NUMERIC(10,2),
        fin_vigencia    TIMESTAMP,
        titulo          TEXT,
        subtitulo       TEXT,
        descuento_texto TEXT,
        emoji           TEXT,
        color           TEXT,
        activo          INTEGER DEFAULT 1,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id               SERIAL PRIMARY KEY,
        nombre           TEXT NOT NULL,
        correo           TEXT UNIQUE NOT NULL,
        fecha_nacimiento DATE,
        password_hash    TEXT NOT NULL,
        activo           INTEGER DEFAULT 1,
        created_at       TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id                SERIAL PRIMARY KEY,
        nombre_cliente    TEXT NOT NULL,
        hora_pedido       TIMESTAMP DEFAULT NOW(),
        numero_telefonico TEXT,
        tipo_pago         TEXT,
        total             NUMERIC(10,2) NOT NULL,
        descripcion       TEXT,
        estado_id         INTEGER DEFAULT 1 REFERENCES estados_pedido(id),
        motorizado_id     INTEGER REFERENCES motorizados(id),
        created_at        TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migraciones seguras (ADD COLUMN IF NOT EXISTS)
    await client.query(`ALTER TABLE productos   ADD COLUMN IF NOT EXISTS imagen_url   TEXT`);
    await client.query(`ALTER TABLE pedidos     ADD COLUMN IF NOT EXISTS codigo        TEXT`);
    await client.query(`ALTER TABLE pedidos     ADD COLUMN IF NOT EXISTS cargo_tarjeta SMALLINT DEFAULT 0`);
    await client.query(`ALTER TABLE pedidos     ADD COLUMN IF NOT EXISTS tipo_entrega  SMALLINT DEFAULT 1`);
    await client.query(`ALTER TABLE pedidos     ADD COLUMN IF NOT EXISTS cliente_id    INTEGER REFERENCES clientes(id)`);
    await client.query(`ALTER TABLE motorizados ADD COLUMN IF NOT EXISTS usuario_id      INTEGER REFERENCES usuarios(id)`);
    await client.query(`ALTER TABLE pedidos     ADD COLUMN IF NOT EXISTS monto_pago_cliente NUMERIC(10,2)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo)`);
    await client.query(`ALTER TABLE promociones ADD COLUMN IF NOT EXISTS inicio_vigencia TIMESTAMP`);
    await client.query(`ALTER TABLE promociones ADD COLUMN IF NOT EXISTS productos        TEXT`);

    // Tabla pivote para tracking de pedidos (pedido ↔ cliente ↔ motorizado)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pedido_seguimiento (
        id            SERIAL PRIMARY KEY,
        pedido_id     INTEGER NOT NULL REFERENCES pedidos(id),
        cliente_id    INTEGER REFERENCES clientes(id),
        motorizado_id INTEGER REFERENCES motorizados(id),
        assigned_at   TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Lima')
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_pedido ON pedido_seguimiento(pedido_id)`);

    // Seed estados
    const estados = ['recepcionado', 'enviado', 'merma', 'entregado'];
    for (const nombre of estados) {
      await client.query(
        `INSERT INTO estados_pedido (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
        [nombre]
      );
    }

    // Seed usuario admin
    await client.query(
      `UPDATE usuarios SET email = 'admin@reydelsabor.com' WHERE email = 'admin@brasero.com'`
    );
    const { rows } = await client.query(
      `SELECT id FROM usuarios WHERE email = $1`, ['admin@reydelsabor.com']
    );
    if (rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await client.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)`,
        ['Administrador', 'admin@reydelsabor.com', hash, 'admin']
      );
      console.log('Usuario admin creado: admin@reydelsabor.com / admin123');
    }

    console.log('Base de datos PostgreSQL inicializada correctamente');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
