const express = require('express');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Listar todos los motorizados con conteo de pedidos total y por filtro
router.get('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { filter = 'dia' } = req.query;
  const DATE_FILTERS = {
    dia:    `(p.hora_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date`,
    semana: `(p.hora_pedido AT TIME ZONE 'America/Lima') >= DATE_TRUNC('week',  NOW() AT TIME ZONE 'America/Lima')`,
    mes:    `DATE_TRUNC('month', p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Lima')`,
    año:    `DATE_TRUNC('year',  p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('year',  NOW() AT TIME ZONE 'America/Lima')`,
  };
  const dateWhere = DATE_FILTERS[filter] || DATE_FILTERS.dia;
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.nombre, m.disponible, m.usuario_id, u.email,
              COUNT(DISTINCT p.id)::int AS total_pedidos,
              COUNT(DISTINCT CASE WHEN ${dateWhere} THEN p.id END)::int AS count_filtro
       FROM motorizados m
       LEFT JOIN usuarios u ON m.usuario_id = u.id
       LEFT JOIN pedidos p ON p.motorizado_id = m.id
       GROUP BY m.id, u.email
       ORDER BY m.nombre`
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Stats de un motorizado con filtros de tiempo (Lima TZ)
router.get('/:id/stats', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { filter = 'dia' } = req.query;
  const filters = {
    dia:    `(p.hora_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date`,
    semana: `(p.hora_pedido AT TIME ZONE 'America/Lima') >= DATE_TRUNC('week', NOW() AT TIME ZONE 'America/Lima')`,
    mes:    `DATE_TRUNC('month', p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Lima')`,
    año:    `DATE_TRUNC('year',  p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('year',  NOW() AT TIME ZONE 'America/Lima')`,
  };
  const dateWhere = filters[filter] || filters.dia;
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as total FROM pedidos p
       WHERE p.motorizado_id = $1 AND ${dateWhere}`,
      [req.params.id]
    );
    res.json({ count: parseInt(rows[0].total), filter });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Pedidos de un motorizado específico
router.get('/:id/pedidos', authenticate, authorize('admin', 'operario'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, e.nombre AS estado_nombre
       FROM pedidos p
       LEFT JOIN estados_pedido e ON p.estado_id = e.id
       WHERE p.motorizado_id = $1
       ORDER BY p.hora_pedido DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Crear motorizado (admin + operario)
router.post('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO motorizados (nombre) VALUES ($1) RETURNING *`, [nombre]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Actualizar motorizado (admin + operario)
router.put('/:id', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { nombre, disponible } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    await pool.query(
      `UPDATE motorizados SET nombre=$1, disponible=$2 WHERE id=$3`,
      [nombre, disponible ?? 1, req.params.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM motorizados WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
