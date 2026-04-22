require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { setupWebSocket } = require('./src/websocket/ws.server');
const { startAll } = require('./src/jobs/scheduler');
const { restoreSessions } = require('./src/modules/whatsapp/whatsapp.service');
const { pool } = require('./src/shared/db/pool');
const logger = require('./src/shared/utils/logger');

const server = http.createServer(app);

setupWebSocket(server);

async function start() {
  // Verifica conexão com o banco
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection OK');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to database');
    process.exit(1);
  }

  server.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Server started');
  });

  // Inicia cron jobs
  if (env.isProd || process.env.ENABLE_JOBS === 'true') {
    startAll();
  }

  // Restaura sessões WhatsApp ativas
  try {
    await restoreSessions();
  } catch (err) {
    logger.warn({ err }, 'Failed to restore WhatsApp sessions');
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  const { stopAll } = require('./src/jobs/scheduler');
  stopAll();
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

start().catch((err) => {
  logger.fatal({ err }, 'Startup error');
  process.exit(1);
});
