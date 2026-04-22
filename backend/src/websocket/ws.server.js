const { WebSocketServer } = require('ws');
const { verify } = require('../shared/utils/jwt');
const logger = require('../shared/utils/logger');

const rooms = new Map();

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Token obrigatório');
      return;
    }

    let user;
    try {
      user = verify(token);
    } catch {
      ws.close(4001, 'Token inválido');
      return;
    }

    const condominiumId = user.condominiumId;
    if (!condominiumId) {
      ws.close(4003, 'Sem condomínio');
      return;
    }

    if (!rooms.has(condominiumId)) rooms.set(condominiumId, new Set());
    rooms.get(condominiumId).add(ws);

    ws.userId = user.sub;
    ws.condominiumId = condominiumId;

    ws.send(JSON.stringify({ event: 'connected', data: { userId: user.sub } }));
    logger.debug({ userId: user.sub, condominiumId }, 'WS client connected');

    ws.on('close', () => {
      const room = rooms.get(condominiumId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(condominiumId);
      }
    });

    ws.on('error', (err) => logger.warn({ err }, 'WS error'));
  });

  return wss;
}

function emitToCondominium(condominiumId, event, data) {
  const room = rooms.get(condominiumId);
  if (!room) return;

  const payload = JSON.stringify({ event, data });
  for (const client of room) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

module.exports = { setupWebSocket, emitToCondominium };
