const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');
const { query } = require('../../shared/db/pool');
const logger = require('../../shared/utils/logger');
const P = require('./ai.prompts');

const client = new Anthropic({ apiKey: env.anthropic.apiKey });

async function callClaude(systemPrompt, userPrompt, options = {}) {
  const start = Date.now();
  const model = options.model || env.anthropic.model;
  const maxTokens = options.maxTokens || env.anthropic.maxTokens;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0]?.text || '';
    const duration = Date.now() - start;

    // Log assíncrono do uso
    logInteraction({
      condominiumId: options.condominiumId,
      userId: options.userId,
      demandId: options.demandId,
      type: options.interactionType || 'GENERIC',
      promptTokens: response.usage?.input_tokens,
      completionTokens: response.usage?.output_tokens,
      model,
      inputPreview: userPrompt.slice(0, 200),
      outputPreview: content.slice(0, 200),
      metadata: options.metadata,
      durationMs: duration,
    }).catch(() => {});

    return content;
  } catch (err) {
    logger.error({ err }, 'Claude API error');
    throw err;
  }
}

async function triageDemand(demand) {
  try {
    const raw = await callClaude(P.TRIAGE_SYSTEM, P.TRIAGE_USER(demand), {
      condominiumId: demand.condominium_id,
      demandId: demand.id,
      interactionType: 'TRIAGE',
      maxTokens: 512,
    });
    return JSON.parse(raw);
  } catch (err) {
    logger.warn({ err, demandId: demand.id }, 'Triage failed');
    return null;
  }
}

async function summarizeDemand(demand) {
  try {
    return await callClaude(P.SUMMARY_SYSTEM, P.SUMMARY_USER(demand), {
      condominiumId: demand.condominium_id,
      demandId: demand.id,
      interactionType: 'SUMMARY',
      maxTokens: 256,
    });
  } catch (err) {
    logger.warn({ err, demandId: demand.id }, 'Summary failed');
    return null;
  }
}

async function generateDailyDigest(condominiumId, data) {
  try {
    const raw = await callClaude(P.DAILY_DIGEST_SYSTEM, P.DAILY_DIGEST_USER(data), {
      condominiumId,
      interactionType: 'DAILY_DIGEST',
      maxTokens: 512,
    });
    return JSON.parse(raw);
  } catch (err) {
    logger.warn({ err, condominiumId }, 'Daily digest failed');
    return null;
  }
}

async function generateComplianceAlert(obligation, daysLeft, condominiumId) {
  try {
    return await callClaude(P.COMPLIANCE_ALERT_SYSTEM, P.COMPLIANCE_ALERT_USER(obligation, daysLeft), {
      condominiumId,
      interactionType: 'COMPLIANCE_ALERT',
      maxTokens: 256,
    });
  } catch (err) {
    logger.warn({ err }, 'Compliance alert generation failed');
    return `Atenção: "${obligation.name}" vence em ${daysLeft} dias. Providencie o agendamento.`;
  }
}

async function routeDemandToSetor(demand, setores) {
  try {
    const raw = await callClaude(P.ROUTING_SYSTEM, P.ROUTING_USER(demand, setores), {
      condominiumId: demand.condominium_id,
      demandId: demand.id,
      interactionType: 'ROUTING',
      maxTokens: 256,
    });
    const result = JSON.parse(raw);
    if (result.assigned_setor && setores.includes(result.assigned_setor)) {
      await query(
        `UPDATE demands SET assigned_setor = $1, routing_data = $2 WHERE id = $3`,
        [result.assigned_setor, JSON.stringify(result), demand.id]
      );
    }
    return result;
  } catch (err) {
    logger.warn({ err, demandId: demand.id }, 'Demand routing failed');
    return null;
  }
}

async function triageWhatsappMessage(message) {
  try {
    const raw = await callClaude(P.WHATSAPP_TRIAGE_SYSTEM, P.WHATSAPP_TRIAGE_USER(message), {
      interactionType: 'WHATSAPP_TRIAGE',
      maxTokens: 512,
    });
    return JSON.parse(raw);
  } catch (err) {
    logger.warn({ err }, 'WhatsApp triage failed');
    return null;
  }
}

async function logInteraction({ condominiumId, userId, demandId, type, promptTokens, completionTokens, model, inputPreview, outputPreview, metadata, durationMs }) {
  await query(
    `INSERT INTO ai_interactions
     (condominium_id, user_id, demand_id, interaction_type, prompt_tokens, completion_tokens,
      model_used, input_preview, output_preview, metadata, duration_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [condominiumId, userId, demandId, type, promptTokens, completionTokens,
     model, inputPreview, outputPreview, metadata ? JSON.stringify(metadata) : null, durationMs]
  );
}

async function getUsage(condominiumId, month) {
  const start = month ? new Date(month) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const { rows: [usage] } = await query(
    `SELECT
       COUNT(*) AS total_calls,
       SUM(prompt_tokens) AS total_input_tokens,
       SUM(completion_tokens) AS total_output_tokens,
       SUM(prompt_tokens + completion_tokens) AS total_tokens
     FROM ai_interactions
     WHERE condominium_id = $1 AND created_at >= $2 AND created_at < $3`,
    [condominiumId, start, end]
  );
  return usage;
}

module.exports = { triageDemand, summarizeDemand, generateDailyDigest, generateComplianceAlert, triageWhatsappMessage, routeDemandToSetor, getUsage };
