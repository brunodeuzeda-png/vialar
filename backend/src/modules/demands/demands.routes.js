const router = require('express').Router();
const service = require('./demands.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico, isAnyRole } = require('../../middleware/rbac');
const aiService = require('../ai/ai.service');
const { emitToCondominium } = require('../../websocket/ws.server');

router.use(authMiddleware, tenantMiddleware);

router.get('/', isAnyRole, async (req, res, next) => {
  try {
    const result = await service.list(req.tenant.id, req.query);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', isAnyRole, async (req, res, next) => {
  try {
    const demand = await service.create(req.tenant.id, req.body, req.user.id);

    emitToCondominium(req.tenant.id, 'demand:created', demand);

    // Triagem IA assíncrona
    aiService.triageDemand(demand).then(async (triage) => {
      if (triage) {
        await service.update(demand.id, req.tenant.id, { ai_triage_data: triage }, null);
        emitToCondominium(req.tenant.id, 'demand:triage_done', { id: demand.id, triage });
      }
    }).catch(() => {});

    res.status(201).json(demand);
  } catch (err) { next(err); }
});

router.get('/:id', isAnyRole, async (req, res, next) => {
  try {
    const demand = await service.getById(req.params.id, req.tenant.id);
    res.json(demand);
  } catch (err) { next(err); }
});

router.patch('/:id', isSindico, async (req, res, next) => {
  try {
    const demand = await service.update(req.params.id, req.tenant.id, req.body, req.user.id);
    emitToCondominium(req.tenant.id, 'demand:updated', demand);
    res.json(demand);
  } catch (err) { next(err); }
});

router.post('/:id/updates', isAnyRole, async (req, res, next) => {
  try {
    const { type = 'COMMENT', content, metadata } = req.body;
    const update = await service.addUpdate(req.params.id, req.tenant.id, req.user.id, type, content, metadata);
    emitToCondominium(req.tenant.id, 'demand:update_added', { demandId: req.params.id, update });
    res.status(201).json(update);
  } catch (err) { next(err); }
});

router.post('/:id/ai/triage', isSindico, async (req, res, next) => {
  try {
    const demand = await service.getById(req.params.id, req.tenant.id);
    const triage = await aiService.triageDemand(demand);
    if (triage) {
      await service.update(req.params.id, req.tenant.id, { ai_triage_data: triage }, req.user.id);
    }
    res.json(triage);
  } catch (err) { next(err); }
});

router.post('/:id/ai/summary', isSindico, async (req, res, next) => {
  try {
    const demand = await service.getById(req.params.id, req.tenant.id);
    const summary = await aiService.summarizeDemand(demand);
    if (summary) {
      await service.update(req.params.id, req.tenant.id, { ai_summary: summary }, req.user.id);
    }
    res.json({ summary });
  } catch (err) { next(err); }
});

module.exports = router;
