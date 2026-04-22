const { query } = require('../../shared/db/pool');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');
const waSession = require('./whatsapp.session');
const { handleIncomingMessage } = require('./whatsapp.handler');
const QRCode = require('qrcode');

let pendingQRCodes = new Map();

async function connect(condominiumId) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    waSession.getOrCreateSession(
      condominiumId,
      async (qr) => {
        const qrDataUrl = await QRCode.toDataURL(qr);
        pendingQRCodes.set(condominiumId, { qr: qrDataUrl, timestamp: Date.now() });
        if (!resolved) {
          resolved = true;
          resolve({ status: 'QR_PENDING', qr: qrDataUrl });
        }
      },
      () => {
        pendingQRCodes.delete(condominiumId);
        if (!resolved) {
          resolved = true;
          resolve({ status: 'CONNECTED' });
        }
      },
      handleIncomingMessage
    ).catch(reject);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ status: 'PENDING' });
      }
    }, 3000);
  });
}

async function getStatus(condominiumId) {
  const { rows: [session] } = await query(
    'SELECT status, phone_number, last_seen_at FROM whatsapp_sessions WHERE condominium_id = $1',
    [condominiumId]
  );
  const pending = pendingQRCodes.get(condominiumId);
  return {
    ...session,
    has_pending_qr: !!pending,
    qr: pending ? pending.qr : null,
  };
}

async function disconnect(condominiumId) {
  await waSession.disconnectSession(condominiumId);
}

async function sendMessage(condominiumId, to, text) {
  await waSession.sendMessage(condominiumId, to, text);
  await query(
    `INSERT INTO whatsapp_messages (condominium_id, direction, to_number, message_type, content)
     VALUES ($1, 'OUTBOUND', $2, 'text', $3)`,
    [condominiumId, to, text]
  );
}

async function broadcast(condominiumId, message, filter = {}) {
  let sql = `SELECT DISTINCT u.whatsapp_number, u.name
             FROM users u
             WHERE u.condominium_id = $1 AND u.whatsapp_number IS NOT NULL AND u.is_active = TRUE`;
  const params = [condominiumId];

  if (filter.roles?.length) {
    params.push(filter.roles);
    sql += ` AND u.role = ANY($${params.length})`;
  }

  const { rows: recipients } = await query(sql, params);

  const results = { sent: 0, failed: 0 };
  for (const recipient of recipients) {
    try {
      await sendMessage(condominiumId, recipient.whatsapp_number, message);
      results.sent++;
    } catch {
      results.failed++;
    }
  }

  return { ...results, total: recipients.length };
}

async function getMessages(condominiumId, filters = {}) {
  const { limit, offset, page } = paginate(filters.page, filters.limit);
  const params = [condominiumId];
  let sql = `SELECT * FROM whatsapp_messages WHERE condominium_id = $1`;

  if (filters.from) {
    params.push(filters.from);
    sql += ` AND from_number = $${params.length}`;
  }
  if (filters.direction) {
    params.push(filters.direction);
    sql += ` AND direction = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await query(sql, params);
  const { rows: [{ count }] } = await query(
    'SELECT COUNT(*) FROM whatsapp_messages WHERE condominium_id = $1', [condominiumId]
  );

  return paginatedResponse(rows, count, page, limit);
}

async function restoreSessions() {
  await waSession.restoreAllSessions(handleIncomingMessage);
}

module.exports = { connect, getStatus, disconnect, sendMessage, broadcast, getMessages, restoreSessions };
