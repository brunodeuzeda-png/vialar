const { Pool } = require('pg');
const env = require('../../config/env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.db.url,
  min: env.db.poolMin,
  max: env.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected pg pool error');
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
