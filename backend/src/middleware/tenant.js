const ROLES = require('../shared/constants/roles');

function tenantMiddleware(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  if (user.role === ROLES.SUPER_ADMIN) {
    req.tenant = { id: req.params.condominiumId || null, isSuper: true };
    return next();
  }

  if (user.role === ROLES.ADMIN) {
    req.tenant = {
      id: req.params.condominiumId || req.query?.condominium_id || req.body?.condominium_id || user.condominium_id,
      administradoraId: user.administradora_id,
      isAdmin: true,
    };
    return next();
  }

  if (!user.condominium_id) {
    return res.status(403).json({ error: 'Usuário sem condomínio associado' });
  }

  req.tenant = { id: user.condominium_id };
  next();
}

module.exports = tenantMiddleware;
