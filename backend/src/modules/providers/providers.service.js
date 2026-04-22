const { query } = require('../../shared/db/pool');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');
const { withTransaction } = require('../../shared/db/transaction');

async function list(condominiumId, administradoraId, filters = {}) {
  const { limit, offset, page } = paginate(filters.page, filters.limit);
  const params = [condominiumId, administradoraId];

  let sql = `SELECT * FROM providers WHERE (condominium_id = $1 OR administradora_id = $2) AND is_active = TRUE`;

  if (filters.specialty) {
    params.push(filters.specialty);
    sql += ` AND $${params.length} = ANY(specialties)`;
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    sql += ` AND name ILIKE $${params.length}`;
  }

  const { rows: [{ count }] } = await query(
    sql.replace('SELECT *', 'SELECT COUNT(*)'), params
  );

  sql += ` ORDER BY rating_avg DESC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await query(sql, params);
  return paginatedResponse(rows, count, page, limit);
}

async function create(condominiumId, data) {
  const { rows: [provider] } = await query(
    `INSERT INTO providers (condominium_id, name, cnpj, cpf, email, phone, whatsapp, specialties, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [condominiumId, data.name, data.cnpj, data.cpf, data.email, data.phone, data.whatsapp,
     data.specialties || [], data.notes]
  );
  return provider;
}

async function getById(id, condominiumId) {
  const { rows: [provider] } = await query(
    `SELECT p.*,
       (SELECT COUNT(*) FROM quotes WHERE provider_id = p.id) AS total_quotes,
       (SELECT COUNT(*) FROM demands d JOIN quotes q ON d.id = q.demand_id WHERE q.provider_id = p.id AND d.status = 'CONCLUIDA') AS completed_demands
     FROM providers p
     WHERE p.id = $1 AND (p.condominium_id = $2 OR p.administradora_id IN (
       SELECT administradora_id FROM condominiums WHERE id = $2
     ))`,
    [id, condominiumId]
  );
  if (!provider) {
    const err = new Error('Prestador não encontrado');
    err.statusCode = 404;
    throw err;
  }
  return provider;
}

async function update(id, condominiumId, data) {
  const { rows: [provider] } = await query(
    `UPDATE providers SET
       name = COALESCE($1, name), email = COALESCE($2, email),
       phone = COALESCE($3, phone), whatsapp = COALESCE($4, whatsapp),
       specialties = COALESCE($5, specialties), notes = COALESCE($6, notes),
       updated_at = NOW()
     WHERE id = $7 AND condominium_id = $8 RETURNING *`,
    [data.name, data.email, data.phone, data.whatsapp, data.specialties, data.notes, id, condominiumId]
  );
  if (!provider) {
    const err = new Error('Prestador não encontrado');
    err.statusCode = 404;
    throw err;
  }
  return provider;
}

async function addRating(providerId, demandId, ratedById, rating, comment) {
  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO provider_ratings (provider_id, demand_id, rated_by_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [providerId, demandId, ratedById, rating, comment]
    );
    const { rows: [updated] } = await client.query(
      `UPDATE providers SET
         rating_avg = (SELECT AVG(rating) FROM provider_ratings WHERE provider_id = $1),
         rating_count = (SELECT COUNT(*) FROM provider_ratings WHERE provider_id = $1),
         updated_at = NOW()
       WHERE id = $1 RETURNING rating_avg, rating_count`,
      [providerId]
    );
    return updated;
  });
}

module.exports = { list, create, getById, update, addRating };
