const router = require('express').Router();
const service = require('./compliance.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/obligations', async (req, res, next) => {
  try {
    res.json(await service.getObligations(req.tenant.id, req.query));
  } catch (err) { next(err); }
});

router.get('/alerts', async (req, res, next) => {
  try {
    res.json(await service.getAlerts(req.tenant.id));
  } catch (err) { next(err); }
});

router.get('/calendar', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    res.json(await service.getCalendar(req.tenant.id, year, month));
  } catch (err) { next(err); }
});

router.post('/records/:id/complete', async (req, res, next) => {
  try {
    const record = await service.completeRecord(req.params.id, req.tenant.id, req.body, req.user.id);
    res.json(record);
  } catch (err) { next(err); }
});

router.post('/initialize', async (req, res, next) => {
  try {
    await service.initializeForCondominium(req.tenant.id, req.user.id);
    res.json({ message: 'Obrigações inicializadas' });
  } catch (err) { next(err); }
});

module.exports = router;
