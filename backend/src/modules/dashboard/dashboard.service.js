const { query } = require('../../shared/db/pool');

async function getOverview(condominiumId) {
  const [demands, compliance, financial] = await Promise.all([
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('CONCLUIDA','CANCELADA')) AS open,
        COUNT(*) FILTER (WHERE status = 'ABERTA') AS aberta,
        COUNT(*) FILTER (WHERE status = 'EM_ANDAMENTO') AS em_andamento,
        COUNT(*) FILTER (WHERE priority = 'CRITICA' AND status NOT IN ('CONCLUIDA','CANCELADA')) AS critica,
        COUNT(*) FILTER (WHERE priority = 'ALTA' AND status NOT IN ('CONCLUIDA','CANCELADA')) AS alta,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS created_today,
        COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '7 days') AS resolved_week,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE status = 'CONCLUIDA'), 1) AS avg_resolution_hours
      FROM demands WHERE condominium_id = $1`, [condominiumId]),

    query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDENTE' AND due_date <= CURRENT_DATE + 7) AS urgent,
        COUNT(*) FILTER (WHERE status = 'PENDENTE' AND due_date <= CURRENT_DATE + 30) AS this_month,
        COUNT(*) FILTER (WHERE status = 'VENCIDA') AS overdue
      FROM compliance_records WHERE condominium_id = $1`, [condominiumId]),

    query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='RECEITA' AND is_paid=TRUE THEN amount ELSE 0 END), 0) AS receitas,
        COALESCE(SUM(CASE WHEN type='DESPESA' AND is_paid=TRUE THEN amount ELSE 0 END), 0) AS despesas,
        COALESCE(SUM(CASE WHEN type='RECEITA' AND is_paid=TRUE THEN amount WHEN type='DESPESA' AND is_paid=TRUE THEN -amount ELSE 0 END), 0) AS saldo
      FROM financial_entries
      WHERE condominium_id = $1
        AND competence_date >= date_trunc('month', CURRENT_DATE)`, [condominiumId]),
  ]);

  return {
    demands: demands.rows[0],
    compliance: compliance.rows[0],
    financial: financial.rows[0],
  };
}

async function getAlerts(condominiumId) {
  const alerts = [];

  // Chamados críticos abertos
  const { rows: criticalDemands } = await query(
    `SELECT id, title, created_at FROM demands
     WHERE condominium_id = $1 AND priority = 'CRITICA' AND status NOT IN ('CONCLUIDA','CANCELADA')
     ORDER BY created_at ASC LIMIT 5`, [condominiumId]
  );
  if (criticalDemands.length) {
    alerts.push({ type: 'DEMAND_CRITICAL', severity: 'high', items: criticalDemands });
  }

  // Compliance vencendo em 7 dias
  const { rows: urgentCompliance } = await query(
    `SELECT cr.id, t.name, cr.due_date,
       EXTRACT(DAY FROM (cr.due_date - CURRENT_DATE))::INTEGER AS days_left
     FROM compliance_records cr
     JOIN compliance_obligation_templates t ON cr.template_id = t.id
     WHERE cr.condominium_id = $1 AND cr.status = 'PENDENTE'
       AND cr.due_date <= CURRENT_DATE + 7
     ORDER BY cr.due_date ASC`, [condominiumId]
  );
  if (urgentCompliance.length) {
    alerts.push({ type: 'COMPLIANCE_URGENT', severity: 'high', items: urgentCompliance });
  }

  // Chamados sem atualização há mais de 3 dias
  const { rows: staleDemarks } = await query(
    `SELECT id, title, updated_at FROM demands
     WHERE condominium_id = $1 AND status = 'EM_ANDAMENTO'
       AND updated_at < NOW() - INTERVAL '3 days'
     LIMIT 5`, [condominiumId]
  );
  if (staleDemarks.length) {
    alerts.push({ type: 'DEMAND_STALE', severity: 'medium', items: staleDemarks });
  }

  return alerts;
}

async function getDigestData(condominiumId) {
  const { rows: [condo] } = await query('SELECT name FROM condominiums WHERE id = $1', [condominiumId]);
  const overview = await getOverview(condominiumId);

  return {
    condominiumName: condo?.name || 'Condomínio',
    openDemands: overview.demands.open,
    criticalDemands: overview.demands.critica,
    newToday: overview.demands.created_today,
    resolvedWeek: overview.demands.resolved_week,
    complianceUrgent: overview.compliance.urgent,
    compliance30: overview.compliance.this_month,
    balance: parseFloat(overview.financial.saldo).toFixed(2),
  };
}

module.exports = { getOverview, getAlerts, getDigestData };
