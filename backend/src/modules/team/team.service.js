const { query } = require('../../shared/db/pool');
const { hash } = require('../../shared/utils/crypto');

const SETORES = [
  'Financeiro', 'Manutenção', 'Jurídico', 'Atendimento',
  'Obras e Reformas', 'Segurança', 'Administrativo', 'TI',
];

async function list(administradoraId) {
  const { rows } = await query(
    `SELECT id, name, email, phone, whatsapp_number, role, setor, funcao,
            is_active, last_login_at, created_at
     FROM users
     WHERE administradora_id = $1 AND role IN ('ADMIN','FUNCIONARIO')
     ORDER BY setor NULLS LAST, name`,
    [administradoraId]
  );
  return rows;
}

async function create(administradoraId, { name, email, password, phone, whatsapp_number, setor, funcao, role }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    const err = new Error('Email já cadastrado');
    err.statusCode = 409;
    throw err;
  }
  const passwordHash = await hash(password || Math.random().toString(36).slice(2) + 'Aa1!');
  const { rows: [user] } = await query(
    `INSERT INTO users (administradora_id, name, email, phone, whatsapp_number,
                        password_hash, role, setor, funcao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, name, email, phone, whatsapp_number, role, setor, funcao, is_active, created_at`,
    [administradoraId, name, email, phone || null, whatsapp_number || null,
     passwordHash, role || 'FUNCIONARIO', setor || null, funcao || null]
  );
  return user;
}

async function update(id, administradoraId, data) {
  const { name, phone, whatsapp_number, setor, funcao, is_active, role } = data;
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
    [name||null, phone||null, whatsapp_number||null, setor||null,
     funcao||null, is_active ?? null, role||null, id, administradoraId]
  );
  if (!user) {
    const err = new Error('Funcionário não encontrado');
    err.statusCode = 404;
    throw err;
  }
  return user;
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
