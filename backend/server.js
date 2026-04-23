require('dotenv').config();
const http = require('http');
const path = require('path');
const app = require('./src/app');
const env = require('./src/config/env');
const { setupWebSocket } = require('./src/websocket/ws.server');
const { startAll } = require('./src/jobs/scheduler');
const { restoreSessions } = require('./src/modules/whatsapp/whatsapp.service');
const { pool } = require('./src/shared/db/pool');
const logger = require('./src/shared/utils/logger');

const FRONTEND_DIR = path.join(__dirname, '../frontend');

async function start() {
  // Inicializa Next.js a partir dos node_modules do frontend
  const next = require(path.join(FRONTEND_DIR, 'node_modules/next'));
  const nextApp = next({ dev: !env.isProd, dir: FRONTEND_DIR });
  const nextHandle = nextApp.getRequestHandler();

  await nextApp.prepare();
  logger.info('Next.js ready');

  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url.startsWith('/v1') || url === '/health') {
      app(req, res);
    } else {
      nextHandle(req, res);
    }
  });

  setupWebSocket(server);

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

  if (env.isProd || process.env.ENABLE_JOBS === 'true') {
    startAll();
  }

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
  pool.end();
  process.exit(0);
});

start().catch((err) => {
  logger.fatal({ err }, 'Startup error');
  process.exit(1);
});
