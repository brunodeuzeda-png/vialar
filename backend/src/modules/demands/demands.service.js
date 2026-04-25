const { query } = require('../../shared/db/pool');
const { withTransaction } = require('../../shared/db/transaction');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');
const Q = require('./demands.queries');

async function list(condominiumId, filters = {}) {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  let sql = Q.LIST;
  let countSql = Q.COUNT;
  const params = [condominiumId];
  const countParams = [condominiumId];

  if (filters.status) {
    params.push(filters.status);
    sql += ` AND d.status = $${params.length}`;
    countParams.push(filters.status);
    countSql += ` AND status = $${countParams.length}`;
  }
  if (filters.priority) {
    params.push(filters.priority);
    sql += ` AND d.priority = $${params.length}`;
    countParams.push(filters.priority);
    countSql += ` AND priority = $${countParams.length}`;
  }
  if (filters.category) {
    params.push(filters.category);
    sql += ` AND d.category = $${params.length}`;
    countParams.push(filters.category);
    countSql += ` AND category = $${countParams.length}`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    sql += ` AND (d.title ILIKE $${params.length} OR d.description ILIKE $${params.length})`;
    countParams.push(`%${filters.search}%`);
    countSql += ` AND (title ILIKE $${countParams.length} OR description ILIKE $${countParams.length})`;
  }
  if (filters.assigned_setor) {
    params.push(filters.assigned_setor);
    sql += ` AND d.assigned_setor = $${params.length}`;
    countParams.push(filters.assigned_setor);
    countSql += ` AND assigned_setor = $${countParams.length}`;
  }

  sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(sql, params),
    query(countSql, countParams),
  ]);

  return paginatedResponse(rows, countRows[0].count, page, limit);
}

async function listAllCondos(administradoraId, filters = {}) {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  let sql = Q.LIST_ALL_CONDOS;
  let countSql = Q.COUNT_ALL_CONDOS;
  const params = [administradoraId];
  const countParams = [administradoraId];

  if (filters.assigned_setor) {
    params.push(filters.assigned_setor);
    sql += ` AND d.assigned_setor = $${params.length}`;
    countParams.push(filters.assigned_setor);
    countSql += ` AND d.assigned_setor = $${countParams.length}`;
  }
  if (filters.status) {
    params.push(filters.status);
    sql += ` AND d.status = $${params.length}`;
    countParams.push(filters.status);
    countSql += ` AND d.status = $${countParams.length}`;
  }
  if (filters.priority) {
    params.push(filters.priority);
    sql += ` AND d.priority = $${params.length}`;
    countParams.push(filters.priority);
    countSql += ` AND d.priority = $${countParams.length}`;
  }

  sql += ` ORDER BY c.name, d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(sql, params),
    query(countSql, countParams),
  ]);

  return paginatedResponse(rows, countRows[0].count, page, limit);
}

async function getById(id, condominiumId) {
  const [{ rows: [demand] }, { rows: updates }] = await Promise.all([
    query(Q.GET_BY_ID, [id, condominiumId]),
    query(Q.GET_UPDATES, [id]),
  ]);

  if (!demand) {
    const err = new Error('Chamado não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { ...demand, updates };
}

async function create(condominiumId, data, userId) {
  return withTransaction(async (client) => {
    const { rows: [demand] } = await client.query(Q.INSERT, [
      condominiumId,
      userId,
      data.unit_id || null,
      data.title,
      data.description,
      data.priority || 'MEDIA',
      data.category || 'OUTRO',
      data.origin || 'PORTAL',
    ]);

    await client.query(Q.INSERT_UPDATE, [
      demand.id, userId, 'STATUS_CHANGE',
      `Chamado aberto: ${demand.title}`, null, 'ABERTA', null,
    ]);

    return demand;
  });
}

async function update(id, condominiumId, data, userId) {
  return withTransaction(async (client) => {
    const { rows: [old] } = await client.query(
      'SELECT * FROM demands WHERE id = $1 AND condominium_id = $2', [id, condominiumId]
    );
    if (!old) {
      const err = new Error('Chamado não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const newSetores = data.assigned_setores || null;
    const newSetor = data.assigned_setor || (newSetores?.length ? newSetores[0] : null);

    const { rows: [updated] } = await client.query(Q.UPDATE, [
      data.title, data.description, data.status, data.priority, data.category,
      data.assigned_to_id, data.ai_triage_data, data.ai_summary,
      data.internal_notes, data.due_date, id, condominiumId,
      newSetor, newSetores,
    ]);

    if (data.status && data.status !== old.status) {
      await client.query(Q.INSERT_UPDATE, [
        id, userId, 'STATUS_CHANGE',
        `Status alterado para ${data.status}`, old.status, data.status, null,
      ]);
    }
    if (newSetores && JSON.stringify(newSetores.sort()) !== JSON.stringify((old.assigned_setores || []).sort())) {
      const oldVal = (old.assigned_setores?.length ? old.assigned_setores : [old.assigned_setor].filter(Boolean)).join(', ') || '—';
      const newVal = newSetores.join(', ');
      await client.query(Q.INSERT_UPDATE, [
        id, userId, 'SETOR_CHANGE',
        `Setores: ${oldVal} → ${newVal}`, oldVal, newVal, null,
      ]);
    }
    if (data.priority && data.priority !== old.priority) {
      await client.query(Q.INSERT_UPDATE, [
        id, userId, 'PRIORITY_CHANGE',
        `Prioridade: ${old.priority} → ${data.priority}`, old.priority, data.priority, null,
      ]);
    }
    if (data.comment) {
      await client.query(Q.INSERT_UPDATE, [id, userId, 'COMMENT', data.comment, null, null, null]);
    }

    return updated;
  });
}

async function addUpdate(demandId, condominiumId, userId, type, content, metadata) {
  const { rows: [demand] } = await query(
    'SELECT id FROM demands WHERE id = $1 AND condominium_id = $2', [demandId, condominiumId]
  );
  if (!demand) {
    const err = new Error('Chamado não encontrado');
    err.statusCode = 404;
    throw err;
  }

  const { rows: [update] } = await query(Q.INSERT_UPDATE, [
    demandId, userId, type, content, null, null, metadata || null,
  ]);
  return update;
}

async function getStats(condominiumId) {
  const { rows: [stats] } = await query(Q.STATS, [condominiumId]);
  return stats;
}

module.exports = { list, listAllCondos, getById, create, update, addUpdate, getStats };
