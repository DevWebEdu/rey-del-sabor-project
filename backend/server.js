require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDB } = require('./db/database');

const authRoutes        = require('./routes/auth');
const clientesRoutes    = require('./routes/clientes');
const productosRoutes   = require('./routes/productos');
const promocionesRoutes = require('./routes/promociones');
const pedidosRoutes     = require('./routes/pedidos');
const motorizadosRoutes = require('./routes/motorizados');
const usuariosRoutes    = require('./routes/usuarios');
const uploadsRoutes     = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

initDB();

// Archivos subidos (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',        authRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/productos',   productosRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/pedidos',     pedidosRoutes);
app.use('/api/motorizados', motorizadosRoutes);
app.use('/api/usuarios',    usuariosRoutes);
app.use('/api/uploads',     uploadsRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n🔥 El Rey del Sabor Backend corriendo en http://localhost:${PORT}\n`);
});
