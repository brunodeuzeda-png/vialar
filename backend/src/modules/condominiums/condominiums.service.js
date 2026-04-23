const { query } = require('../../shared/db/pool');
const { withTransaction } = require('../../shared/db/transaction');

async function list(administradoraId) {
  const { rows } = await query(
    `SELECT c.*,
       COUNT(DISTINCT u.id) FILTER (WHERE u.is_active) AS total_users,
       COUNT(DISTINCT d.id) FILTER (WHERE d.status NOT IN ('RESOLVIDO','FECHADO')) AS open_demands
     FROM condominiums c
     LEFT JOIN users u ON u.condominium_id = c.id
     LEFT JOIN demands d ON d.condominium_id = c.id
     WHERE c.administradora_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [administradoraId]
  );
  return rows;
}

async function getOne(id, administradoraId) {
  const { rows } = await query(
    `SELECT c.*,
       COUNT(DISTINCT u.id) FILTER (WHERE u.is_active) AS total_users,
       COUNT(DISTINCT d.id) FILTER (WHERE d.status NOT IN ('RESOLVIDO','FECHADO')) AS open_demands,
       COUNT(DISTINCT d.id) AS total_demands
     FROM condominiums c
     LEFT JOIN users u ON u.condominium_id = c.id
     LEFT JOIN demands d ON d.condominium_id = c.id
     WHERE c.id = $1 AND c.administradora_id = $2
     GROUP BY c.id`,
    [id, administradoraId]
  );
  if (!rows[0]) {
    const err = new Error('Condomínio não encontrado');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
}

async function create(administradoraId, data) {
  if (!administradoraId) {
    const err = new Error('Administradora não identificada. Faça login novamente.');
    err.statusCode = 401;
    throw err;
  }
  const { name, cnpj, address, city, state, zip_code, total_units, whatsapp_number,
          sindico_name, sindico_phone, sindico_whatsapp, sindico_email } = data;
  if (!name?.trim()) {
    const err = new Error('Nome do condomínio é obrigatório');
    err.statusCode = 400;
    throw err;
  }
  const { rows: [condo] } = await query(
    `INSERT INTO condominiums
       (administradora_id, name, cnpj, address, city, state, zip_code, total_units,
        whatsapp_number, sindico_name, sindico_phone, sindico_whatsapp, sindico_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [administradoraId, name.trim(), cnpj || null, address || null,
     city || null, state || null, zip_code || null,
     parseInt(total_units) || 0, whatsapp_number || null,
     sindico_name || null, sindico_phone || null,
     sindico_whatsapp || null, sindico_email || null]
  );
  return condo;
}

async function update(id, administradoraId, data) {
  await getOne(id, administradoraId);
  const { name, cnpj, address, city, state, zip_code, total_units, whatsapp_number, is_active,
          sindico_name, sindico_phone, sindico_whatsapp, sindico_email } = data;
  const { rows: [updated] } = await query(
    `UPDATE condominiums SET
       name             = COALESCE($1,  name),
       cnpj             = COALESCE($2,  cnpj),
       address          = COALESCE($3,  address),
       city             = COALESCE($4,  city),
       state            = COALESCE($5,  state),
       zip_code         = COALESCE($6,  zip_code),
       total_units      = COALESCE($7,  total_units),
       whatsapp_number  = COALESCE($8,  whatsapp_number),
       is_active        = COALESCE($9,  is_active),
       sindico_name     = COALESCE($10, sindico_name),
       sindico_phone    = COALESCE($11, sindico_phone),
       sindico_whatsapp = COALESCE($12, sindico_whatsapp),
       sindico_email    = COALESCE($13, sindico_email),
       updated_at       = NOW()
     WHERE id = $14 AND administradora_id = $15
     RETURNING *`,
    [name || null, cnpj || null, address || null, city || null,
     state || null, zip_code || null,
     total_units !== undefined ? parseInt(total_units) : null,
     whatsapp_number || null,
     is_active !== undefined ? is_active : null,
     sindico_name || null, sindico_phone || null,
     sindico_whatsapp || null, sindico_email || null,
     id, administradoraId]
  );
  if (!updated) {
    const err = new Error('Condomínio não encontrado');
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function remove(id, administradoraId) {
  await getOne(id, administradoraId);
  await query('UPDATE condominiums SET is_active = false WHERE id = $1', [id]);
}

async function updateSindico(id, administradoraId, data) {
  await getOne(id, administradoraId);
  const { sindico_name, sindico_phone, sindico_whatsapp, sindico_email } = data;
  const { rows: [updated] } = await query(
    `UPDATE condominiums SET
       sindico_name     = COALESCE($1, sindico_name),
       sindico_phone    = COALESCE($2, sindico_phone),
       sindico_whatsapp = COALESCE($3, sindico_whatsapp),
       sindico_email    = COALESCE($4, sindico_email),
       updated_at       = NOW()
     WHERE id = $5
     RETURNING id, name, sindico_name, sindico_phone, sindico_whatsapp, sindico_email`,
    [sindico_name || null, sindico_phone || null, sindico_whatsapp || null, sindico_email || null, id]
  );
  return updated;
}

module.exports = { list, getOne, create, update, remove, updateSindico };
