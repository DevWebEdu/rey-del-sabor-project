const express = require('express');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function buildCodigo(id) {
  return 'PE' + String(id).padStart(3, '0');
}

const SELECT_PEDIDO = `
  SELECT p.*, e.nombre AS estado_nombre, m.nombre AS motorizado_nombre
  FROM pedidos p
  LEFT JOIN estados_pedido e ON p.estado_id = e.id
  LEFT JOIN motorizados m ON p.motorizado_id = m.id
`;

// Público: estados disponibles
router.get('/config/estados', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM estados_pedido ORDER BY id`);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Público: seguimiento por código
router.get('/seguimiento/:codigo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.codigo, p.nombre_cliente, p.total, p.tipo_pago, p.tipo_entrega,
              p.hora_pedido, p.descripcion, e.nombre AS estado, m.nombre AS motorizado_nombre
       FROM pedidos p
       LEFT JOIN estados_pedido e ON p.estado_id = e.id
       LEFT JOIN motorizados m ON p.motorizado_id = m.id
       WHERE p.codigo = $1`,
      [req.params.codigo.toUpperCase()]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Motorizado: ver sus pedidos asignados (con descripción completa)
router.get('/mis-pedidos', authenticate, authorize('motorizado'), async (req, res) => {
  const motorizadoId = req.user.motorizado_id;
  if (!motorizadoId) return res.status(400).json({ error: 'Sin motorizado asignado a este usuario' });
  try {
    const { rows } = await pool.query(
      `${SELECT_PEDIDO} WHERE p.motorizado_id = $1 ORDER BY p.hora_pedido DESC`,
      [motorizadoId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Público: crear pedido desde ecommerce
router.post('/', async (req, res) => {
  const { nombre_cliente, numero_telefonico, tipo_pago, total, descripcion, cargo_tarjeta, tipo_entrega, cliente_id, monto_pago_cliente } = req.body;
  if (!nombre_cliente || total == null) {
    return res.status(400).json({ error: 'nombre_cliente y total son requeridos' });
  }
  const desc = typeof descripcion === 'object' ? JSON.stringify(descripcion) : (descripcion || null);
  try {
    const { rows: ins } = await pool.query(
      `INSERT INTO pedidos (nombre_cliente, numero_telefonico, tipo_pago, total, descripcion, cargo_tarjeta, tipo_entrega, cliente_id, monto_pago_cliente)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [nombre_cliente, numero_telefonico || null, tipo_pago || null, total, desc,
       cargo_tarjeta        != null ? cargo_tarjeta        : 0,
       tipo_entrega         != null ? tipo_entrega         : 1,
       cliente_id           || null,
       monto_pago_cliente   ?? null]
    );
    const id     = ins[0].id;
    const codigo = buildCodigo(id);
    await pool.query(`UPDATE pedidos SET codigo = $1 WHERE id = $2`, [codigo, id]);

    // Insertar en pivot si hay cliente
    if (cliente_id) {
      await pool.query(
        `INSERT INTO pedido_seguimiento (pedido_id, cliente_id) VALUES ($1, $2) ON CONFLICT (pedido_id) DO NOTHING`,
        [id, cliente_id]
      );
    }

    res.status(201).json({ id, codigo });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Protegido: listar pedidos (admin/operario)
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT_PEDIDO} ORDER BY p.hora_pedido DESC`);
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Protegido: obtener pedido por id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_PEDIDO} WHERE p.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Motorizado: marcar entregado o merma (solo sus propios pedidos)
router.patch('/:id/estado-motorizado', authenticate, authorize('motorizado'), async (req, res) => {
  const { estado } = req.body; // 'entregado' | 'merma'
  if (!['entregado', 'merma'].includes(estado)) {
    return res.status(400).json({ error: 'Solo se permite entregado o merma' });
  }
  const motorizadoId = req.user.motorizado_id;
  try {
    // Verificar que el pedido le pertenece y está en estado enviado
    const { rows: pedRows } = await pool.query(
      `SELECT p.id, e.nombre AS estado_actual
       FROM pedidos p
       JOIN estados_pedido e ON p.estado_id = e.id
       WHERE p.id = $1 AND p.motorizado_id = $2`,
      [req.params.id, motorizadoId]
    );
    if (!pedRows[0]) return res.status(404).json({ error: 'Pedido no encontrado o no asignado a ti' });
    if (pedRows[0].estado_actual !== 'enviado') {
      return res.status(400).json({ error: 'Solo puedes cambiar pedidos que están en camino' });
    }
    const { rows: eRows } = await pool.query(
      `SELECT id FROM estados_pedido WHERE nombre = $1`, [estado]
    );
    if (!eRows[0]) return res.status(400).json({ error: 'Estado no encontrado' });
    await pool.query(`UPDATE pedidos SET estado_id = $1 WHERE id = $2`, [eRows[0].id, req.params.id]);
    res.json({ success: true, estado });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Operario/admin: cambiar estado
router.patch('/:id/estado', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { estado_id } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM estados_pedido WHERE id = $1`, [estado_id]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Estado inválido' });

    await pool.query(
      `UPDATE pedidos SET estado_id = $1 WHERE id = $2`, [estado_id, req.params.id]
    );
    res.json({ success: true, estado_nombre: rows[0].nombre });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

// Operario/admin: asignar motorizado + actualizar pivot
router.patch('/:id/motorizado', authenticate, authorize('admin', 'operario'), async (req, res) => {
  const { motorizado_id } = req.body;
  try {
    await pool.query(
      `UPDATE pedidos SET motorizado_id = $1 WHERE id = $2`,
      [motorizado_id || null, req.params.id]
    );

    // Actualizar tabla pivote
    if (motorizado_id) {
      const { rows: pedRow } = await pool.query(
        `SELECT cliente_id FROM pedidos WHERE id = $1`, [req.params.id]
      );
      const clienteId = pedRow[0]?.cliente_id || null;
      await pool.query(
        `INSERT INTO pedido_seguimiento (pedido_id, cliente_id, motorizado_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (pedido_id) DO UPDATE
           SET motorizado_id = EXCLUDED.motorizado_id,
               assigned_at   = NOW() AT TIME ZONE 'America/Lima'`,
        [req.params.id, clienteId, motorizado_id]
      );
    }

    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
