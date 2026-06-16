const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'brasero_secret_2024_delivery';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1 AND activo = 1`, [email]
    );
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Si es motorizado, obtenemos su id en la tabla motorizados
    let motorizadoId = null;
    if (user.rol === 'motorizado') {
      const { rows: moto } = await pool.query(
        `SELECT id FROM motorizados WHERE usuario_id = $1`, [user.id]
      );
      motorizadoId = moto[0]?.id || null;
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol, motorizado_id: motorizadoId },
      SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, motorizado_id: motorizadoId },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, email, rol FROM usuarios WHERE id = $1`, [req.user.id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
