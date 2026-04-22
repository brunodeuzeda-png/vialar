const ROLES = require('../shared/constants/roles');

function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }
    next();
  };
}

const isSindico = allow(ROLES.SINDICO, ROLES.ADMIN, ROLES.SUPER_ADMIN);
const isAdmin = allow(ROLES.ADMIN, ROLES.SUPER_ADMIN);
const isSuperAdmin = allow(ROLES.SUPER_ADMIN);
const isAnyRole = allow(...Object.values(ROLES));

module.exports = { allow, isSindico, isAdmin, isSuperAdmin, isAnyRole };
