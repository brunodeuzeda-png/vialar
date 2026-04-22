const { query } = require('../../shared/db/pool');
const { hash, compare, generateToken } = require('../../shared/utils/crypto');
const { signAccess, signRefresh, verify } = require('../../shared/utils/jwt');
const { withTransaction } = require('../../shared/db/transaction');

async function register({ name, email, password, adminName, adminCnpj }) {
  return withTransaction(async (client) => {
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      const err = new Error('Email já cadastrado');
      err.statusCode = 409;
      throw err;
    }

    const { rows: [admin] } = await client.query(
      `INSERT INTO administradoras (name, cnpj, email) VALUES ($1, $2, $3) RETURNING id`,
      [adminName, adminCnpj || null, email]
    );

    const passwordHash = await hash(password);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (administradora_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'ADMIN') RETURNING id, name, email, role`,
      [admin.id, name, email, passwordHash]
    );

    const tokens = generateTokenPair(user);
    const refreshHash = await hash(tokens.refreshToken);
    await client.query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    return { user, ...tokens };
  });
}

async function login({ email, password }) {
  const { rows } = await query(
    `SELECT id, name, email, role, password_hash, condominium_id, administradora_id, is_active
     FROM users WHERE email = $1`,
    [email]
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    const err = new Error('Credenciais inválidas');
    err.statusCode = 401;
    throw err;
  }

  const valid = await compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Credenciais inválidas');
    err.statusCode = 401;
    throw err;
  }

  const tokens = generateTokenPair(user);
  const refreshHash = await hash(tokens.refreshToken);
  await query(
    'UPDATE users SET refresh_token_hash = $1, last_login_at = NOW() WHERE id = $2',
    [refreshHash, user.id]
  );

  const { password_hash, refresh_token_hash, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verify(refreshToken);
  } catch {
    const err = new Error('Refresh token inválido');
    err.statusCode = 401;
    throw err;
  }

  const { rows } = await query(
    'SELECT id, name, email, role, condominium_id, administradora_id, refresh_token_hash FROM users WHERE id = $1',
    [payload.sub]
  );

  const user = rows[0];
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 401;
    throw err;
  }

  const valid = await compare(refreshToken, user.refresh_token_hash);
  if (!valid) {
    const err = new Error('Refresh token inválido');
    err.statusCode = 401;
    throw err;
  }

  const tokens = generateTokenPair(user);
  const newRefreshHash = await hash(tokens.refreshToken);
  await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [newRefreshHash, user.id]);

  return tokens;
}

async function logout(userId) {
  await query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [userId]);
}

function generateTokenPair(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    condominiumId: user.condominium_id,
    administradoraId: user.administradora_id,
  };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

module.exports = { register, login, refresh, logout };
