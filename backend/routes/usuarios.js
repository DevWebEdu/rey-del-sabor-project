const express = require('express');
const bcrypt  = require('bcryptjs');
const { pool } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.created_at,
              m.id AS motorizado_id, m.nombre AS motorizado_nombre
       FROM usuarios u
       LEFT JOIN motorizados m ON m.usuario_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (!['admin', 'operario', 'motorizado'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4) RETURNING id, nombre, email, rol`,
      [nombre, email, hash, rol]
    );
    const usuario = rows[0];

    // Si es motorizado, crear registro en tabla motorizados vinculado
    if (rol === 'motorizado') {
      await client.query(
        `INSERT INTO motorizados (nombre, usuario_id) VALUES ($1, $2)`,
        [nombre, usuario.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(usuario);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está en uso' });
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { nombre, rol, activo } = req.body;
  try {
    await pool.query(
      `UPDATE usuarios SET nombre=$1, rol=$2, activo=$3 WHERE id=$4`,
      [nombre, rol, activo ?? 1, req.params.id]
    );
    // Sincronizar nombre en motorizados si corresponde
    if (rol === 'motorizado') {
      await pool.query(
        `UPDATE motorizados SET nombre=$1 WHERE usuario_id=$2`,
        [nombre, req.params.id]
      );
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
