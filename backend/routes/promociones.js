const express = require('express');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Público: solo las vigentes en este momento (Lima TZ)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promociones
       WHERE activo = 1
         AND (inicio_vigencia IS NULL OR inicio_vigencia AT TIME ZONE 'America/Lima' <= NOW() AT TIME ZONE 'America/Lima')
         AND (fin_vigencia    IS NULL OR fin_vigencia    AT TIME ZONE 'America/Lima' >= NOW() AT TIME ZONE 'America/Lima')
       ORDER BY created_at DESC`
    );
    res.json(rows.map(parsePromo));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Admin: todas
router.get('/all', authenticate, authorize('admin', 'operario'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promociones WHERE activo = 1 ORDER BY created_at DESC`
    );
    res.json(rows.map(parsePromo));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.post('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre, descripcion, precio, inicio_vigencia, fin_vigencia, titulo, subtitulo, descuento_texto, emoji, color, productos } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO promociones (nombre, descripcion, precio, inicio_vigencia, fin_vigencia, titulo, subtitulo, descuento_texto, emoji, color, productos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [nombre, descripcion || null, precio || null,
       inicio_vigencia || null, fin_vigencia || null,
       titulo || null, subtitulo || null, descuento_texto || null, emoji || null, color || null,
       productos ? JSON.stringify(productos) : null]
    );
    res.status(201).json(parsePromo(rows[0]));
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.put('/:id', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre, descripcion, precio, inicio_vigencia, fin_vigencia, titulo, subtitulo, descuento_texto, emoji, color, productos } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    await pool.query(
      `UPDATE promociones SET nombre=$1, descripcion=$2, precio=$3, inicio_vigencia=$4, fin_vigencia=$5,
       titulo=$6, subtitulo=$7, descuento_texto=$8, emoji=$9, color=$10, productos=$11 WHERE id=$12`,
      [nombre, descripcion || null, precio || null,
       inicio_vigencia || null, fin_vigencia || null,
       titulo || null, subtitulo || null, descuento_texto || null, emoji || null, color || null,
       productos ? JSON.stringify(productos) : null,
       req.params.id]
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

module.exports = router;
