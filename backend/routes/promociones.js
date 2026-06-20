const express = require('express');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Público: promos activas (solo se ocultan si fin_vigencia ya pasó)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promociones
       WHERE activo = 1
         AND (fin_vigencia IS NULL OR fin_vigencia AT TIME ZONE 'America/Lima' >= NOW() AT TIME ZONE 'America/Lima')
       ORDER BY created_at DESC`
    );
    res.json(await enrichProductos(rows));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Admin: todas (incluyendo inactivas para poder reactivarlas)
router.get('/all', authenticate, authorize('admin', 'operario'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promociones WHERE activo IN (0, 1) ORDER BY created_at DESC`
    );
    res.json(await enrichProductos(rows));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Toggle activo/inactivo sin borrar
router.patch('/:id/toggle', authenticate, authorize('admin', 'operario'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE promociones SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END WHERE id = $1 RETURNING activo`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ activo: rows[0].activo });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.post('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const {
    nombre, descripcion, precio, inicio_vigencia, fin_vigencia,
    titulo, subtitulo, descuento_texto, emoji, color, productos,
    dias_semana, vigencia_tipo, imagen_url,
  } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO promociones
         (nombre, descripcion, precio, inicio_vigencia, fin_vigencia,
          titulo, subtitulo, descuento_texto, emoji, color, productos,
          dias_semana, vigencia_tipo, imagen_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        nombre, descripcion || null, precio || null,
        inicio_vigencia || null, fin_vigencia || null,
        titulo || null, subtitulo || null, descuento_texto || null,
        emoji || null, color || null,
        productos ? JSON.stringify(productos) : null,
        dias_semana || null,
        vigencia_tipo || 'rango',
        imagen_url || null,
      ]
    );
    res.status(201).json(parsePromo(rows[0]));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.put('/:id', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const {
    nombre, descripcion, precio, inicio_vigencia, fin_vigencia,
    titulo, subtitulo, descuento_texto, emoji, color, productos,
    dias_semana, vigencia_tipo, imagen_url,
  } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    await pool.query(
      `UPDATE promociones SET
         nombre=$1, descripcion=$2, precio=$3, inicio_vigencia=$4, fin_vigencia=$5,
         titulo=$6, subtitulo=$7, descuento_texto=$8, emoji=$9, color=$10,
         productos=$11, dias_semana=$12, vigencia_tipo=$13, imagen_url=$14
       WHERE id=$15`,
      [
        nombre, descripcion || null, precio || null,
        inicio_vigencia || null, fin_vigencia || null,
        titulo || null, subtitulo || null, descuento_texto || null,
        emoji || null, color || null,
        productos ? JSON.stringify(productos) : null,
        dias_semana || null,
        vigencia_tipo || 'rango',
        imagen_url || null,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query(`UPDATE promociones SET activo = 0 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

function parsePromo(row) {
  return {
    ...row,
    productos: row.productos
      ? (typeof row.productos === 'string' ? JSON.parse(row.productos) : row.productos)
      : [],
  };
}

async function enrichProductos(rows) {
  const parsed = rows.map(parsePromo);

  // Recolectar todos los IDs de productos referenciados
  const ids = [...new Set(parsed.flatMap(p => p.productos.map(pr => pr.id)).filter(Boolean))];
  if (!ids.length) return parsed;

  const { rows: dbProds } = await pool.query(
    `SELECT id, nombre, descripcion, precio, imagen_url FROM productos WHERE id = ANY($1)`,
    [ids]
  );
  const map = Object.fromEntries(dbProds.map(p => [p.id, p]));

  return parsed.map(promo => ({
    ...promo,
    productos: promo.productos.map(p => ({
      ...p,
      descripcion: map[p.id]?.descripcion || p.descripcion || '',
      imagen_url:  map[p.id]?.imagen_url  || p.imagen_url  || '',
    })),
  }));
}

module.exports = router;
