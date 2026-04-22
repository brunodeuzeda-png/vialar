const { query } = require('../shared/db/pool');
const aiService = require('../modules/ai/ai.service');
const { sendMessage } = require('../modules/whatsapp/whatsapp.session');
const logger = require('../shared/utils/logger');

async function runComplianceAlerts() {
  // Busca obrigações vencendo em 7, 30 ou 90 dias
  const { rows: records } = await query(`
    SELECT cr.*, t.name, t.legal_basis, t.category, t.alert_days,
      c.id AS condominium_id, c.name AS condominium_name,
      EXTRACT(DAY FROM (cr.due_date - CURRENT_DATE))::INTEGER AS days_left
    FROM compliance_records cr
    JOIN compliance_obligation_templates t ON cr.template_id = t.id
    JOIN condominiums c ON cr.condominium_id = c.id
    WHERE cr.status = 'PENDENTE'
      AND EXTRACT(DAY FROM (cr.due_date - CURRENT_DATE)) IN (
        SELECT UNNEST(t2.alert_days)
        FROM compliance_obligation_templates t2
        WHERE t2.id = t.id
      )
      AND cr.due_date >= CURRENT_DATE
  `);

  logger.info({ count: records.length }, 'Processing compliance alerts');

  for (const record of records) {
    try {
      // Cria notificação no sistema
      await query(
        `INSERT INTO notifications (condominium_id, type, title, body, channel, metadata)
         VALUES ($1, 'COMPLIANCE_ALERT', $2, $3, 'APP', $4)`,
        [
          record.condominium_id,
          `${record.name} vence em ${record.days_left} dias`,
          `Obrigação regulatória pendente: ${record.name}. Base legal: ${record.legal_basis}`,
          JSON.stringify({ record_id: record.id, days_left: record.days_left }),
        ]
      );

      // Para urgências (7 dias), envia WA para o síndico
      if (record.days_left <= 7) {
        const { rows: [sindico] } = await query(
          `SELECT whatsapp_number FROM users WHERE condominium_id = $1 AND role = 'SINDICO' AND is_active = TRUE LIMIT 1`,
          [record.condominium_id]
        );

        if (sindico?.whatsapp_number) {
          const alertText = await aiService.generateComplianceAlert(record, record.days_left, record.condominium_id);
          await sendMessage(record.condominium_id, sindico.whatsapp_number,
            `🚨 COMPLIANCE URGENTE\n\n${alertText}`
          ).catch(() => {});
        }
      }
    } catch (err) {
      logger.error({ err, recordId: record.id }, 'Failed to process compliance alert');
    }
  }
}

module.exports = { runComplianceAlerts };
