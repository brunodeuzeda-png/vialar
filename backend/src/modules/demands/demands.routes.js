const router = require('express').Router();
const service = require('./demands.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico, isAnyRole } = require('../../middleware/rbac');
const aiService = require('../ai/ai.service');
const { SETORES } = require('../team/team.service');
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

    // Triagem IA + roteamento assíncrono
    const administradoraId = req.user.administradora_id;
    aiService.triageDemand(demand).then(async (triage) => {
      if (triage) {
        await service.update(demand.id, req.tenant.id, { ai_triage_data: triage }, null);
        emitToCondominium(req.tenant.id, 'demand:triage_done', { id: demand.id, triage });
      }
      if (administradoraId) {
        const routing = await aiService.routeDemandToSetor(
          { ...demand, category: triage?.category || demand.category, priority: triage?.priority || demand.priority },
          SETORES
        );
        if (routing) emitToCondominium(req.tenant.id, 'demand:routed', { id: demand.id, setor: routing.assigned_setor });
      }
    }).catch(() => {});

    res.status(201).json(demand);
  } catch (err) { next(err); }
});

router.get('/stats/by-setor', isAnyRole, async (req, res, next) => {
  try {
    const { rows } = await require('../../shared/db/pool').query(
      `SELECT assigned_setor,
         COUNT(*) FILTER (WHERE status NOT IN ('CONCLUIDA','CANCELADA')) AS open,
         COUNT(*) FILTER (WHERE status = 'CONCLUIDA') AS done,
         COUNT(*) FILTER (WHERE priority = 'CRITICA' AND status NOT IN ('CONCLUIDA','CANCELADA')) AS critical,
         COUNT(*) AS total
       FROM demands
       WHERE condominium_id = $1 AND assigned_setor IS NOT NULL
       GROUP BY assigned_setor`,
      [req.tenant.id]
    );
    res.json(rows);
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
      // Route to setor after triage
      const routing = await aiService.routeDemandToSetor(
        { ...demand, category: triage.category || demand.category, priority: triage.priority || demand.priority },
        SETORES
      );
      if (routing?.assigned_setor) {
        emitToCondominium(req.tenant.id, 'demand:routed', { id: demand.id, setor: routing.assigned_setor });
        triage._routing = routing;
      }
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
