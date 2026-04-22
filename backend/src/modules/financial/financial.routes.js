const router = require('express').Router();
const service = require('./financial.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/accounts', async (req, res, next) => {
  try {
    res.json(await service.getAccounts(req.tenant.id));
  } catch (err) { next(err); }
});

router.post('/accounts', async (req, res, next) => {
  try {
    res.status(201).json(await service.createAccount(req.tenant.id, req.body));
  } catch (err) { next(err); }
});

router.get('/entries', async (req, res, next) => {
  try {
    res.json(await service.listEntries(req.tenant.id, req.query));
  } catch (err) { next(err); }
});

router.post('/entries', async (req, res, next) => {
  try {
    res.status(201).json(await service.createEntry(req.tenant.id, req.body, req.user.id));
  } catch (err) { next(err); }
});

router.patch('/entries/:id/pay', async (req, res, next) => {
  try {
    res.json(await service.markAsPaid(req.params.id, req.tenant.id));
  } catch (err) { next(err); }
});

router.get('/reports/monthly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    res.json(await service.getMonthlyReport(req.tenant.id, year, month));
  } catch (err) { next(err); }
});

module.exports = router;
