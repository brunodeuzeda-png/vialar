const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { defaultLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./shared/utils/logger');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);

// Request logging
app.use((req, res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Request');
  next();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/v1/auth', authLimiter, require('./modules/auth/auth.routes'));
app.use('/v1/users', require('./modules/users/users.routes'));
app.use('/v1/demands', require('./modules/demands/demands.routes'));
app.use('/v1/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/v1/whatsapp', require('./modules/whatsapp/whatsapp.routes'));
app.use('/v1/ai', require('./modules/ai/ai.routes'));
app.use('/v1/providers', require('./modules/providers/providers.routes'));
app.use('/v1/financial', require('./modules/financial/financial.routes'));
app.use('/v1/compliance', require('./modules/compliance/compliance.routes'));
app.use('/v1/condominiums', require('./modules/condominiums/condominiums.routes'));
app.use('/v1/team', require('./modules/team/team.routes'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Error handler
app.use(errorHandler);

module.exports = app;
