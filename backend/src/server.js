// ============================================================
// SAMARTH PROPERTIES — Express Server Entry Point
// File: backend/src/server.js
// ============================================================

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');
const mediaRoutes = require('./routes/media');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ─────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── Body Parsing & Compression ────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Samarth Properties API is running',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api/media', mediaRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[Server Error]', err);

    if (err.message && err.message.startsWith('CORS policy')) {
        return sendError(res, err.message, 403);
    }

    if (err.type === 'entity.too.large') {
        return sendError(res, 'Request body too large', 413);
    }

    sendError(res, 'Internal server error', 500);
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       SAMARTH PROPERTIES API SERVER              ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Status  : Running                               ║`);
    console.log(`║  Port    : ${PORT}                              ║`);
    console.log(`║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(38)}║`);
    console.log(`║  Health  : http://localhost:${PORT}/health        ║`);
    console.log('╚══════════════════════════════════════════════════╝');
});

module.exports = app;
