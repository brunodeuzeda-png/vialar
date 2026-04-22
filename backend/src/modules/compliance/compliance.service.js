const { query } = require('../../shared/db/pool');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');

async function getObligations(condominiumId, filters = {}) {
  const { limit, offset, page } = paginate(filters.page, filters.limit);
  const params = [condominiumId];

  let sql = `
    SELECT cr.*, t.code, t.name, t.description, t.legal_basis, t.category, t.frequency, t.alert_days,
      EXTRACT(DAY FROM (cr.due_date - CURRENT_DATE))::INTEGER AS days_until_due,
      p.name AS provider_name
    FROM compliance_records cr
    JOIN compliance_obligation_templates t ON cr.template_id = t.id
    LEFT JOIN providers p ON cr.provider_id = p.id
    WHERE cr.condominium_id = $1
  `;

  if (filters.status) {
    params.push(filters.status);
    sql += ` AND cr.status = $${params.length}`;
  }
  if (filters.category) {
    params.push(filters.category);
    sql += ` AND t.category = $${params.length}`;
  }
  if (filters.upcoming_days) {
    params.push(parseInt(filters.upcoming_days));
    sql += ` AND cr.due_date <= CURRENT_DATE + ($${params.length} || ' days')::INTERVAL`;
  }

  const countSql = sql.replace(
    /SELECT cr\.\*, .+ FROM compliance_records/,
    'SELECT COUNT(*) FROM compliance_records'
  );

  sql += ` ORDER BY cr.due_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const [{ rows }, { rows: [{ count }] }] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);

  return paginatedResponse(rows, count, page, limit);
}

async function getAlerts(condominiumId) {
  const { rows } = await query(
    `SELECT cr.*, t.code, t.name, t.category, t.legal_basis,
       EXTRACT(DAY FROM (cr.due_date - CURRENT_DATE))::INTEGER AS days_until_due
     FROM compliance_records cr
     JOIN compliance_obligation_templates t ON cr.template_id = t.id
     WHERE cr.condominium_id = $1
       AND cr.status = 'PENDENTE'
       AND cr.due_date <= CURRENT_DATE + INTERVAL '90 days'
     ORDER BY cr.due_date ASC`,
    [condominiumId]
  );
  return rows;
}

async function getCalendar(condominiumId, year, month) {
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, month, 0).toISOString().split('T')[0];

  const { rows } = await query(
    `SELECT cr.id, cr.due_date, cr.status, t.name, t.category, t.code
     FROM compliance_records cr
     JOIN compliance_obligation_templates t ON cr.template_id = t.id
     WHERE cr.condominium_id = $1 AND cr.due_date BETWEEN $2 AND $3
     ORDER BY cr.due_date ASC`,
    [condominiumId, start, end]
  );
  return rows;
}

async function completeRecord(recordId, condominiumId, data, userId) {
  const { rows: [record] } = await query(
    `UPDATE compliance_records SET
       status = 'EM_DIA',
       completed_date = $1,
       document_url = COALESCE($2, document_url),
       notes = COALESCE($3, notes),
       provider_id = COALESCE($4, provider_id),
       cost = COALESCE($5, cost),
       updated_at = NOW()
     WHERE id = $6 AND condominium_id = $7
     RETURNING *`,
    [data.completed_date || new Date(), data.document_url, data.notes, data.provider_id, data.cost, recordId, condominiumId]
  );

  if (!record) {
    const err = new Error('Obrigação não encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Cria o próximo registro automático
  const { rows: [template] } = await query(
    'SELECT * FROM compliance_obligation_templates WHERE id = $1', [record.template_id]
  );
  if (template && template.frequency !== 'UNICA') {
    const nextDue = calculateNextDue(record.due_date, template.frequency);
    await query(
      `INSERT INTO compliance_records (condominium_id, template_id, due_date, created_by_id)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [condominiumId, template.id, nextDue, userId]
    );
  }

  return record;
}

async function initializeForCondominium(condominiumId, userId) {
  const { rows: templates } = await query(
    'SELECT * FROM compliance_obligation_templates WHERE is_active = TRUE'
  );

  const values = templates.map((t, i) => {
    const due = calculateNextDue(new Date(), t.frequency);
    return `($1, '${t.id}', '${due}', '${userId || condominiumId}')`;
  });

  if (values.length === 0) return;

  await query(
    `INSERT INTO compliance_records (condominium_id, template_id, due_date, created_by_id)
     VALUES ${values.join(',')}
     ON CONFLICT DO NOTHING`,
    [condominiumId]
  );
}

function calculateNextDue(fromDate, frequency) {
  const date = new Date(fromDate);
  switch (frequency) {
    case 'MENSAL': date.setMonth(date.getMonth() + 1); break;
    case 'TRIMESTRAL': date.setMonth(date.getMonth() + 3); break;
    case 'SEMESTRAL': date.setMonth(date.getMonth() + 6); break;
    case 'ANUAL': date.setFullYear(date.getFullYear() + 1); break;
    case 'BIENAL': date.setFullYear(date.getFullYear() + 2); break;
    case 'QUINQUENAL': date.setFullYear(date.getFullYear() + 5); break;
    default: date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().split('T')[0];
}

module.exports = { getObligations, getAlerts, getCalendar, completeRecord, initializeForCondominium };
