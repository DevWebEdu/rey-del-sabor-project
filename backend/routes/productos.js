const express = require('express');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const CAT_ORDER = `CASE categoria
  WHEN 'combos_pollo' THEN 1
  WHEN 'platos_carta' THEN 2
  WHEN 'complementos' THEN 3
  WHEN 'bebidas'      THEN 4
  ELSE 5 END`;

// GET /api/productos?page=1&limit=8&categoria=combos_pollo&q=pollo
router.get('/', async (req, res) => {
  const page  = parseInt(req.query.page)  || null;
  const limit = parseInt(req.query.limit) || 8;
  const cat   = req.query.categoria || null;
  const q     = req.query.q         || null;

  const conditions = ['activo = 1'];
  const params     = [];
  let idx = 1;

  if (cat) { conditions.push(`categoria = $${idx++}`); params.push(cat); }
  if (q)   { conditions.push(`nombre ILIKE $${idx++}`); params.push(`%${q}%`); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // Orden numérico: extrae el número del nombre para ordenar "Combo 1"→1, "Combo 12"→12, etc.
  const NUM_ORDER = `(NULLIF(regexp_replace(nombre, '[^0-9]', '', 'g'), ''))::integer ASC NULLS LAST`;
  // Orden externo:
  //   sin categoría → round-robin entre categorías (combos_pollo primero, en orden numérico)
  //   con categoría → orden numérico por nombre
  const outerOrder = cat ? NUM_ORDER : `rn ASC, cat_ord ASC`;

  try {
    if (page) {
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) FROM productos ${where}`, params
      );
      const total      = parseInt(countRows[0].count);
      const totalPages = Math.ceil(total / limit) || 1;
      const offset     = (page - 1) * limit;

      const { rows } = await pool.query(
        `SELECT * FROM (
           SELECT *,
             ${CAT_ORDER} AS cat_ord,
             ROW_NUMBER() OVER (
               PARTITION BY categoria
               ORDER BY (NULLIF(regexp_replace(nombre, '[^0-9]', '', 'g'), ''))::integer ASC NULLS LAST, created_at ASC
             ) AS rn
           FROM productos ${where}
         ) ranked
         ORDER BY ${outerOrder}
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset]
      );

      return res.json({ data: rows, total, page, limit, totalPages });
    }

    // Sin paginación → devuelve todo ordenado numéricamente por nombre
    const { rows } = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY ${CAT_ORDER}, (NULLIF(regexp_replace(nombre, '[^0-9]', '', 'g'), ''))::integer ASC NULLS LAST, nombre ASC`, params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM productos WHERE id = $1 AND activo = 1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.post('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre, descripcion, precio, categoria, imagen_url } = req.body;
  if (!nombre || precio == null) return res.status(400).json({ error: 'nombre y precio son requeridos' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre, descripcion || null, precio, categoria || null, imagen_url || null]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.put('/:id', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre, descripcion, precio, categoria, imagen_url } = req.body;
  if (!nombre || precio == null) return res.status(400).json({ error: 'nombre y precio son requeridos' });
  try {
    await pool.query(
      `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, categoria=$4, imagen_url=$5 WHERE id=$6`,
      [nombre, descripcion || null, precio, categoria || null, imagen_url || null, req.params.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query(`UPDATE productos SET activo = 0 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
