const router = require('express').Router();
const service = require('./dashboard.service');
const aiService = require('../ai/ai.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/overview', async (req, res, next) => {
  try {
    res.json(await service.getOverview(req.tenant.id));
  } catch (err) { next(err); }
});

router.get('/alerts', async (req, res, next) => {
  try {
    res.json(await service.getAlerts(req.tenant.id));
  } catch (err) { next(err); }
});

router.get('/ai-digest', async (req, res, next) => {
  try {
    const data = await service.getDigestData(req.tenant.id);
    const digest = await aiService.generateDailyDigest(req.tenant.id, data);
    res.json(digest || { error: 'Digest indisponível no momento' });
  } catch (err) { next(err); }
});

module.exports = router;
