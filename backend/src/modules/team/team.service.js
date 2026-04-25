const { query, pool } = require('../../shared/db/pool');
const { hash } = require('../../shared/utils/crypto');

const SETORES = [
  'Financeiro', 'Manutenção', 'Jurídico', 'Atendimento',
  'Obras e Reformas', 'Segurança', 'Administrativo', 'TI',
];

async function list(administradoraId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.whatsapp_number, u.role, u.setor, u.funcao,
            u.is_active, u.last_login_at, u.created_at,
            COALESCE(
              json_agg(json_build_object('id', c.id, 'name', c.name))
              FILTER (WHERE c.id IS NOT NULL),
              '[]'::json
            ) AS condominiums
     FROM users u
     LEFT JOIN user_condominiums uc ON uc.user_id = u.id
     LEFT JOIN condominiums c ON c.id = uc.condominium_id
     WHERE u.administradora_id = $1 AND u.role IN ('ADMIN','FUNCIONARIO')
     GROUP BY u.id, u.name, u.email, u.phone, u.whatsapp_number, u.role,
              u.setor, u.funcao, u.is_active, u.last_login_at, u.created_at
     ORDER BY u.setor NULLS LAST, u.name`,
    [administradoraId]
  );
  return rows;
}

async function create(administradoraId, { name, email, password, phone, whatsapp_number, setor, funcao, role, condominium_ids }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    const err = new Error('Email já cadastrado');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hash(password || Math.random().toString(36).slice(2) + 'Aa1!');
  const { rows: [user] } = await query(
    `INSERT INTO users (administradora_id, name, email, phone, whatsapp_number, password_hash, role, setor, funcao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, name, email, phone, whatsapp_number, role, setor, funcao, is_active, created_at`,
    [administradoraId, name, email, phone || null, whatsapp_number || null,
     passwordHash, role || 'FUNCIONARIO', setor || null, funcao || null]
  );

  if (Array.isArray(condominium_ids) && condominium_ids.length > 0) {
    await _setCondominiums(user.id, condominium_ids);
  }

  return { ...user, condominiums: [] };
}

async function update(id, administradoraId, data) {
  const { name, phone, whatsapp_number, setor, funcao, is_active, role, condominium_ids } = data;
  const { rows: [user] } = await query(
    `UPDATE users SET
       name            = COALESCE($1, name),
       phone           = COALESCE($2, phone),
       whatsapp_number = COALESCE($3, whatsapp_number),
       setor           = COALESCE($4, setor),
       funcao          = COALESCE($5, funcao),
       is_active       = COALESCE($6, is_active),
       role            = COALESCE($7, role),
       updated_at      = NOW()
     WHERE id = $8 AND administradora_id = $9
     RETURNING id, name, email, phone, whatsapp_number, role, setor, funcao, is_active`,
    [name || null, phone || null, whatsapp_number || null, setor || null,
     funcao || null, is_active ?? null, role || null, id, administradoraId]
  );

  if (!user) {
    const err = new Error('Funcionário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (Array.isArray(condominium_ids)) {
    await _setCondominiums(id, condominium_ids);
  }

  return user;
}

async function _setCondominiums(userId, condominiumIds) {
  await query('DELETE FROM user_condominiums WHERE user_id = $1', [userId]);
  if (condominiumIds.length === 0) return;
  const values = condominiumIds.map((cid, i) => `($1,$${i + 2})`).join(',');
  await query(
    `INSERT INTO user_condominiums (user_id, condominium_id) VALUES ${values} ON CONFLICT DO NOTHING`,
    [userId, ...condominiumIds]
  );
}

async function remove(id, administradoraId) {
  await query(
    'UPDATE users SET is_active = false WHERE id = $1 AND administradora_id = $2',
    [id, administradoraId]
  );
}

async function getBySetor(administradoraId, setor) {
  const { rows } = await query(
    `SELECT id, name, email, whatsapp_number, setor, funcao
     FROM users
     WHERE administradora_id = $1 AND setor = $2 AND is_active = true`,
    [administradoraId, setor]
  );
  return rows;
}

module.exports = { list, create, update, remove, getBySetor, SETORES };
