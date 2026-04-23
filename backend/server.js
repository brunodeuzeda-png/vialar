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
const fs = require('fs');
const path2 = require('path');

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

  // Auto-run pending migrations on every startup
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const migrationsDir = path2.join(__dirname, 'database/migrations');
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        const { rows } = await client.query('SELECT id FROM migrations WHERE filename = $1', [file]);
        if (rows.length > 0) continue;
        const sql = fs.readFileSync(path2.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        logger.info({ file }, 'Migration applied');
      }
      logger.info('Migrations up to date');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error({ err }, 'Migration error — continuing anyway');
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
