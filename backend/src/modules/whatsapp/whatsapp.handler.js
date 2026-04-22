const { query } = require('../../shared/db/pool');
const aiService = require('../ai/ai.service');
const demandsService = require('../demands/demands.service');
const { sendMessage } = require('./whatsapp.session');
const logger = require('../../shared/utils/logger');

async function handleIncomingMessage(condominiumId, msg, sock) {
  const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '');
  const text = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || '';

  if (!from || !text) return;

  logger.info({ condominiumId, from, textLen: text.length }, 'WA message received');

  // Persiste a mensagem
  await query(
    `INSERT INTO whatsapp_messages (condominium_id, wa_message_id, direction, from_number, message_type, content)
     VALUES ($1, $2, 'INBOUND', $3, 'text', $4)`,
    [condominiumId, msg.key.id, from, text]
  );

  // Busca usuário pelo número
  const { rows: [user] } = await query(
    'SELECT id, name, condominium_id FROM users WHERE whatsapp_number = $1 AND condominium_id = $2',
    [from, condominiumId]
  );

  if (!user) {
    await sendMessage(condominiumId, from,
      'Olá! Não encontrei seu cadastro no sistema. Por favor, entre em contato com a administração do condomínio.'
    );
    return;
  }

  // Triagem IA para verificar se é uma demanda
  const triage = await aiService.triageWhatsappMessage(text);

  if (!triage || !triage.is_demand) {
    await sendMessage(condominiumId, from,
      triage?.confirmation_message || 'Olá! Mensagem recebida. Para registrar uma solicitação, descreva o problema que está enfrentando.'
    );
    return;
  }

  // Cria o chamado automaticamente
  const demand = await demandsService.create(condominiumId, {
    title: triage.title,
    description: triage.description,
    category: triage.category,
    priority: triage.priority,
    origin: 'WHATSAPP',
  }, user.id);

  // Atualiza a mensagem com o demand_id
  await query(
    'UPDATE whatsapp_messages SET demand_id = $1, is_processed = TRUE, processed_at = NOW() WHERE wa_message_id = $2',
    [demand.id, msg.key.id]
  );

  // Envia confirmação ao morador
  const confirmationMsg = triage.confirmation_message
    || `✅ Chamado registrado com sucesso!\n\nTítulo: ${demand.title}\nProtocolo: ${demand.id.slice(0, 8).toUpperCase()}\n\nVocê será notificado sobre o andamento.`;

  await sendMessage(condominiumId, from, confirmationMsg);

  // Notifica o síndico via WA se for CRITICA ou ALTA
  if (triage.priority === 'CRITICA' || triage.priority === 'ALTA') {
    const { rows: [sindico] } = await query(
      `SELECT whatsapp_number FROM users WHERE condominium_id = $1 AND role = 'SINDICO' AND is_active = TRUE LIMIT 1`,
      [condominiumId]
    );
    if (sindico?.whatsapp_number) {
      await sendMessage(condominiumId, sindico.whatsapp_number,
        `🚨 Novo chamado ${triage.priority}!\n\n${demand.title}\nMorador: ${user.name}\nProtocolo: ${demand.id.slice(0, 8).toUpperCase()}`
      );
    }
  }
}

module.exports = { handleIncomingMessage };
