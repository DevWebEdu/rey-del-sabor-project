const express        = require('express');
const { pool }       = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT clave, valor FROM configuracion');
    res.json(Object.fromEntries(rows.map(r => [r.clave, r.valor])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticate, authorize('admin', 'operario'), async (req, res) => {
  try {
    for (const [clave, valor] of Object.entries(req.body)) {
      await pool.query(
        `INSERT INTO configuracion (clave, valor) VALUES ($1,$2)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
        [clave, String(valor)]
      );
    }
    const { rows } = await pool.query('SELECT clave, valor FROM configuracion');
    res.json(Object.fromEntries(rows.map(r => [r.clave, r.valor])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
