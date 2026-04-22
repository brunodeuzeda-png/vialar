const { verify } = require('../shared/utils/jwt');
const { query } = require('../shared/db/pool');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = header.slice(7);
    const payload = verify(token);

    const { rows } = await query(
      'SELECT id, name, email, role, condominium_id, administradora_id, is_active FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;
