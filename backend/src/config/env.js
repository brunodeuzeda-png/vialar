require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

module.exports = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  db: {
    url: required('DATABASE_URL'),
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },

  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-5',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048'),
  },

  whatsapp: {
    encryptionKey: required('WA_SESSION_ENCRYPTION_KEY'),
    reconnectInterval: parseInt(process.env.WA_RECONNECT_INTERVAL_MS || '30000'),
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  internalApiKey: required('INTERNAL_API_KEY'),

  cron: {
    complianceAlerts: process.env.CRON_COMPLIANCE_ALERTS || '0 8 * * *',
    aiDigest: process.env.CRON_AI_DIGEST || '0 7 * * *',
    financialReminders: process.env.CRON_FINANCIAL_REMINDERS || '0 9 * * 1',
  },
};
