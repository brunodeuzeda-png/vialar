const { query } = require('../../shared/db/pool');

async function list(administradoraId) {
  const { rows } = await query(
    `SELECT * FROM setores WHERE administradora_id = $1 ORDER BY name`,
    [administradoraId]
  );
  return rows;
}

async function create(administradoraId, { name, icon, color }) {
  if (!name?.trim()) {
    const err = new Error('Nome do setor é obrigatório');
    err.statusCode = 400; throw err;
  }
  const { rows: [setor] } = await query(
    `INSERT INTO setores (administradora_id, name, icon, color)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [administradoraId, name.trim(), icon || '📋', color || '#6B7280']
  );
  return setor;
}

async function update(id, administradoraId, { name, icon, color, is_active }) {
  const { rows: [setor] } = await query(
    `UPDATE setores SET
       name      = COALESCE($1, name),
       icon      = COALESCE($2, icon),
       color     = COALESCE($3, color),
       is_active = COALESCE($4, is_active)
     WHERE id = $5 AND administradora_id = $6
     RETURNING *`,
    [name?.trim() || null, icon || null, color || null, is_active ?? null, id, administradoraId]
  );
  if (!setor) { const err = new Error('Setor não encontrado'); err.statusCode = 404; throw err; }
  return setor;
}

async function remove(id, administradoraId) {
  const { rowCount } = await query(
    `DELETE FROM setores WHERE id = $1 AND administradora_id = $2`,
    [id, administradoraId]
  );
  if (!rowCount) { const err = new Error('Setor não encontrado'); err.statusCode = 404; throw err; }
}

async function getNames(administradoraId) {
  const { rows } = await query(
    `SELECT name FROM setores WHERE administradora_id = $1 AND is_active = TRUE ORDER BY name`,
    [administradoraId]
  );
  return rows.map(r => r.name);
}

module.exports = { list, create, update, remove, getNames };
