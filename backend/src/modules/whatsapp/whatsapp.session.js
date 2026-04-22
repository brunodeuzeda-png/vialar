const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const { query } = require('../../shared/db/pool');
const logger = require('../../shared/utils/logger');

const sessions = new Map();
const SESSION_DIR = path.join(process.cwd(), '.wa_sessions');

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

async function getOrCreateSession(condominiumId, onQR, onConnected, onMessage) {
  if (sessions.has(condominiumId)) return sessions.get(condominiumId);

  const sessionDir = path.join(SESSION_DIR, condominiumId);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ module: 'baileys', condominiumId }),
    browser: ['SíndicoGestão', 'Chrome', '1.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && onQR) {
      await onQR(qr);
      await updateSessionStatus(condominiumId, 'QR_PENDING');
    }

    if (connection === 'open') {
      logger.info({ condominiumId }, 'WhatsApp connected');
      await updateSessionStatus(condominiumId, 'CONNECTED', sock.user?.id?.split(':')[0]);
      if (onConnected) onConnected();
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error instanceof Boom
        && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      await updateSessionStatus(condominiumId, shouldReconnect ? 'DISCONNECTED' : 'LOGGED_OUT');
      sessions.delete(condominiumId);

      if (shouldReconnect) {
        logger.info({ condominiumId }, 'WhatsApp reconnecting...');
        setTimeout(() => getOrCreateSession(condominiumId, onQR, onConnected, onMessage), 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (onMessage) await onMessage(condominiumId, msg, sock);
    }
  });

  sessions.set(condominiumId, sock);
  return sock;
}

async function updateSessionStatus(condominiumId, status, phoneNumber = null) {
  await query(
    `INSERT INTO whatsapp_sessions (condominium_id, status, phone_number, last_seen_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (condominium_id) DO UPDATE SET status=$2, phone_number=COALESCE($3, whatsapp_sessions.phone_number), last_seen_at=NOW(), updated_at=NOW()`,
    [condominiumId, status, phoneNumber]
  );
}

async function getSession(condominiumId) {
  return sessions.get(condominiumId) || null;
}

async function disconnectSession(condominiumId) {
  const sock = sessions.get(condominiumId);
  if (sock) {
    await sock.logout();
    sessions.delete(condominiumId);
  }
  await updateSessionStatus(condominiumId, 'DISCONNECTED');
}

async function sendMessage(condominiumId, to, text) {
  const sock = sessions.get(condominiumId);
  if (!sock) throw new Error('Sessão WhatsApp não conectada');

  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
  logger.debug({ condominiumId, to }, 'WA message sent');
}

async function restoreAllSessions(onMessage) {
  const { rows } = await query(
    `SELECT condominium_id FROM whatsapp_sessions WHERE status = 'CONNECTED'`
  );
  for (const { condominium_id } of rows) {
    logger.info({ condominiumId: condominium_id }, 'Restoring WA session');
    getOrCreateSession(condominium_id, null, null, onMessage).catch(() => {});
  }
}

module.exports = { getOrCreateSession, getSession, disconnectSession, sendMessage, restoreAllSessions };
