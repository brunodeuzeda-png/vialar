const router = require('express').Router();
const aiService = require('./ai.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');
const dashboardService = require('../dashboard/dashboard.service');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/daily-digest', async (req, res, next) => {
  try {
    const data = await dashboardService.getDigestData(req.tenant.id);
    const digest = await aiService.generateDailyDigest(req.tenant.id, data);
    res.json(digest);
  } catch (err) { next(err); }
});

router.get('/usage', async (req, res, next) => {
  try {
    const usage = await aiService.getUsage(req.tenant.id, req.query.month);
    res.json(usage);
  } catch (err) { next(err); }
});

module.exports = router;
