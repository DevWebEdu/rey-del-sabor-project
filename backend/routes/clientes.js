const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'brasero_secret_2024_delivery';

function authenticateCliente(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    if (decoded.tipo !== 'cliente') return res.status(403).json({ error: 'No autorizado' });
    req.cliente = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// POST /api/clientes/register
router.post('/register', async (req, res) => {
  const { nombre, correo, fecha_nacimiento, password, pedido_id } = req.body;
  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'nombre, correo y contraseña son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM clientes WHERE correo = $1', [correo.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre, correo, fecha_nacimiento, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, correo, fecha_nacimiento`,
      [nombre.trim(), correo.toLowerCase().trim(), fecha_nacimiento || null, hash]
    );
    const cliente = rows[0];

    if (pedido_id) {
      await pool.query(
        `UPDATE pedidos SET cliente_id = $1 WHERE id = $2 AND cliente_id IS NULL`,
        [cliente.id, pedido_id]
      );
    }

    const token = jwt.sign(
      { id: cliente.id, nombre: cliente.nombre, correo: cliente.correo, tipo: 'cliente' },
      SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, cliente });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clientes/login
router.post('/login', async (req, res) => {
  const { correo, password, pedido_id } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE correo = $1 AND activo = 1`,
      [correo.toLowerCase().trim()]
    );
    const cliente = rows[0];
    if (!cliente || !bcrypt.compareSync(password, cliente.password_hash)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Vincular pedido pendiente si viene uno (hecho sin cuenta)
    if (pedido_id) {
      await pool.query(
        `UPDATE pedidos SET cliente_id = $1 WHERE id = $2 AND cliente_id IS NULL`,
        [cliente.id, pedido_id]
      );
    }

    const token = jwt.sign(
      { id: cliente.id, nombre: cliente.nombre, correo: cliente.correo, tipo: 'cliente' },
      SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      cliente: { id: cliente.id, nombre: cliente.nombre, correo: cliente.correo, fecha_nacimiento: cliente.fecha_nacimiento },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clientes/me
router.get('/me', authenticateCliente, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, fecha_nacimiento, created_at FROM clientes WHERE id = $1`,
      [req.cliente.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/clientes/mis-pedidos
router.get('/mis-pedidos', authenticateCliente, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.codigo, p.total, p.tipo_pago, p.tipo_entrega,
              p.hora_pedido, p.descripcion, e.nombre AS estado,
              m.nombre AS motorizado_nombre
       FROM pedidos p
       LEFT JOIN estados_pedido e ON p.estado_id = e.id
       LEFT JOIN motorizados m ON p.motorizado_id = m.id
       WHERE p.cliente_id = $1
       ORDER BY p.hora_pedido DESC`,
      [req.cliente.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en mis-pedidos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin/operario: listar todos los clientes con conteo de pedidos total y por filtro
router.get('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { filter = 'mes' } = req.query;
  const DATE_FILTERS = {
    dia:    `(p.hora_pedido AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date`,
    semana: `(p.hora_pedido AT TIME ZONE 'America/Lima') >= DATE_TRUNC('week',  NOW() AT TIME ZONE 'America/Lima')`,
    mes:    `DATE_TRUNC('month', p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Lima')`,
    año:    `DATE_TRUNC('year',  p.hora_pedido AT TIME ZONE 'America/Lima') = DATE_TRUNC('year',  NOW() AT TIME ZONE 'America/Lima')`,
  };
  const dateWhere = DATE_FILTERS[filter] || DATE_FILTERS.mes;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.correo, c.fecha_nacimiento, c.created_at,
              COUNT(DISTINCT p.id)::int AS total_pedidos,
              COUNT(DISTINCT CASE WHEN ${dateWhere} THEN p.id END)::int AS count_filtro
       FROM clientes c
       LEFT JOIN pedidos p ON p.cliente_id = c.id
       WHERE c.activo = 1
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin/operario: stats de un cliente con filtros de tiempo (Lima TZ)
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
      `SELECT COUNT(*) as total FROM pedidos p WHERE p.cliente_id = $1 AND ${dateWhere}`,
      [req.params.id]
    );
    res.json({ count: parseInt(rows[0].total), filter });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
