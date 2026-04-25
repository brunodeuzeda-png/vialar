const LIST = `
  SELECT d.*,
    u.name AS requester_name, u.whatsapp_number AS requester_whatsapp,
    un.identifier AS unit_identifier,
    a.name AS assigned_name,
    c.name AS condominium_name
  FROM demands d
  LEFT JOIN users u ON d.requester_id = u.id
  LEFT JOIN units un ON d.unit_id = un.id
  LEFT JOIN users a ON d.assigned_to_id = a.id
  LEFT JOIN condominiums c ON d.condominium_id = c.id
  WHERE d.condominium_id = $1
`;

const COUNT = `SELECT COUNT(*) FROM demands WHERE condominium_id = $1`;

const LIST_ALL_CONDOS = `
  SELECT d.*,
    u.name AS requester_name, u.whatsapp_number AS requester_whatsapp,
    un.identifier AS unit_identifier,
    a.name AS assigned_name,
    c.name AS condominium_name
  FROM demands d
  LEFT JOIN users u ON d.requester_id = u.id
  LEFT JOIN units un ON d.unit_id = un.id
  LEFT JOIN users a ON d.assigned_to_id = a.id
  LEFT JOIN condominiums c ON d.condominium_id = c.id
  WHERE c.administradora_id = $1
`;

const COUNT_ALL_CONDOS = `
  SELECT COUNT(*) FROM demands d
  LEFT JOIN condominiums c ON d.condominium_id = c.id
  WHERE c.administradora_id = $1
`;

const GET_BY_ID = `
  SELECT d.*,
    u.name AS requester_name, u.whatsapp_number AS requester_whatsapp, u.email AS requester_email,
    un.identifier AS unit_identifier,
    a.name AS assigned_name
  FROM demands d
  LEFT JOIN users u ON d.requester_id = u.id
  LEFT JOIN units un ON d.unit_id = un.id
  LEFT JOIN users a ON d.assigned_to_id = a.id
  WHERE d.id = $1 AND d.condominium_id = $2
`;

const GET_UPDATES = `
  SELECT du.*, u.name AS author_name, u.role AS author_role
  FROM demand_updates du
  LEFT JOIN users u ON du.author_id = u.id
  WHERE du.demand_id = $1
  ORDER BY du.created_at ASC
`;

const INSERT = `
  INSERT INTO demands (condominium_id, requester_id, unit_id, title, description, priority, category, origin, status)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ABERTA')
  RETURNING *
`;

const UPDATE_STATUS = `
  UPDATE demands SET status = $1, updated_at = NOW()
  WHERE id = $2 AND condominium_id = $3
  RETURNING *
`;

const UPDATE = `
  UPDATE demands SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    status = COALESCE($3, status),
    priority = COALESCE($4, priority),
    category = COALESCE($5, category),
    assigned_to_id = COALESCE($6, assigned_to_id),
    ai_triage_data = COALESCE($7, ai_triage_data),
    ai_summary = COALESCE($8, ai_summary),
    internal_notes = COALESCE($9, internal_notes),
    due_date = COALESCE($10, due_date),
    assigned_setor = COALESCE($13, assigned_setor),
    assigned_setores = COALESCE($14, assigned_setores),
    resolved_at = CASE WHEN $3 = 'CONCLUIDA' THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = $11 AND condominium_id = $12
  RETURNING *
`;

const INSERT_UPDATE = `
  INSERT INTO demand_updates (demand_id, author_id, type, content, old_value, new_value, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
`;

const STATS = `
  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('CONCLUIDA','CANCELADA')) AS total_open,
    COUNT(*) FILTER (WHERE status = 'ABERTA') AS total_aberta,
    COUNT(*) FILTER (WHERE status = 'EM_ANDAMENTO') AS total_em_andamento,
    COUNT(*) FILTER (WHERE priority = 'CRITICA' AND status NOT IN ('CONCLUIDA','CANCELADA')) AS total_critica,
    COUNT(*) FILTER (WHERE priority = 'ALTA' AND status NOT IN ('CONCLUIDA','CANCELADA')) AS total_alta,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS criadas_hoje,
    COUNT(*) FILTER (WHERE resolved_at >= NOW() - INTERVAL '7 days') AS resolvidas_semana,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE status = 'CONCLUIDA') AS avg_resolution_hours
  FROM demands
  WHERE condominium_id = $1
`;

module.exports = { LIST, COUNT, LIST_ALL_CONDOS, COUNT_ALL_CONDOS, GET_BY_ID, GET_UPDATES, INSERT, UPDATE_STATUS, UPDATE, INSERT_UPDATE, STATS };
