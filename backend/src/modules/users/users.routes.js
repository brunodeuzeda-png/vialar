const router = require('express').Router();
const { query } = require('../../shared/db/pool');
const { hash } = require('../../shared/utils/crypto');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');

router.use(authMiddleware, tenantMiddleware);

router.get('/', isSindico, async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const { rows } = await query(
      `SELECT id, name, email, phone, whatsapp_number, role, unit_id, is_active, created_at
       FROM users WHERE condominium_id = $1 ORDER BY name
       LIMIT $2 OFFSET $3`,
      [req.tenant.id, limit, offset]
    );
    const { rows: [{ count }] } = await query(
      'SELECT COUNT(*) FROM users WHERE condominium_id = $1', [req.tenant.id]
    );
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
});

router.post('/', isSindico, async (req, res, next) => {
  try {
    const { name, email, phone, whatsapp_number, role, unit_id, password } = req.body;
    const passwordHash = await hash(password || Math.random().toString(36).slice(2));
    const { rows: [user] } = await query(
      `INSERT INTO users (condominium_id, name, email, phone, whatsapp_number, role, unit_id, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, email, phone, whatsapp_number, role, unit_id, is_active, created_at`,
      [req.tenant.id, name, email, phone, whatsapp_number, role || 'MORADOR', unit_id, passwordHash]
    );
    res.status(201).json(user);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const canEdit = req.user.role === 'SINDICO' || req.user.role === 'ADMIN' || req.user.id === req.params.id;
    if (!canEdit) return res.status(403).json({ error: 'Sem permissão' });

    const { name, phone, whatsapp_number, unit_id } = req.body;
    const { rows: [user] } = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         whatsapp_number = COALESCE($3, whatsapp_number),
         unit_id = COALESCE($4, unit_id),
         updated_at = NOW()
       WHERE id = $5 AND condominium_id = $6
       RETURNING id, name, email, phone, whatsapp_number, role, unit_id`,
      [name, phone, whatsapp_number, unit_id, req.params.id, req.tenant.id]
    );
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
