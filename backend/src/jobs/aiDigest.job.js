const { query } = require('../shared/db/pool');
const dashboardService = require('../modules/dashboard/dashboard.service');
const aiService = require('../modules/ai/ai.service');
const { sendMessage } = require('../modules/whatsapp/whatsapp.session');
const logger = require('../shared/utils/logger');

async function runAiDigest() {
  const { rows: condominiums } = await query(
    `SELECT c.id, c.name FROM condominiums c
     JOIN whatsapp_sessions ws ON c.id = ws.condominium_id
     WHERE c.is_active = TRUE AND ws.status = 'CONNECTED'`
  );

  logger.info({ count: condominiums.length }, 'Generating AI digests');

  for (const condo of condominiums) {
    try {
      const data = await dashboardService.getDigestData(condo.id);
      const digest = await aiService.generateDailyDigest(condo.id, data);

      if (!digest) continue;

      // Notificação no app
      await query(
        `INSERT INTO notifications (condominium_id, type, title, body, channel, metadata)
         VALUES ($1, 'AI_DAILY_DIGEST', $2, $3, 'APP', $4)`,
        [
          condo.id,
          'Resumo do dia',
          digest.summary,
          JSON.stringify(digest),
        ]
      );

      // Envia resumo via WA para o síndico
      const { rows: [sindico] } = await query(
        `SELECT whatsapp_number, name FROM users
         WHERE condominium_id = $1 AND role = 'SINDICO' AND is_active = TRUE LIMIT 1`,
        [condo.id]
      );

      if (sindico?.whatsapp_number) {
        const msg = `${digest.greeting}\n\n${digest.summary}\n\n📋 *Ações prioritárias:*\n${
          digest.top_actions.map((a, i) => `${i+1}. ${a.action}`).join('\n')
        }`;
        await sendMessage(condo.id, sindico.whatsapp_number, msg).catch(() => {});
      }
    } catch (err) {
      logger.error({ err, condominiumId: condo.id }, 'Failed to generate digest');
    }
  }
}

module.exports = { runAiDigest };
