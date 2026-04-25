const router = require('express').Router();
const service = require('./demands.service');
const teamService = require('../team/team.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico, isAnyRole } = require('../../middleware/rbac');
const aiService = require('../ai/ai.service');
const setoresService = require('../setores/setores.service');
const { emitToCondominium } = require('../../websocket/ws.server');
const { query } = require('../../shared/db/pool');

router.use(authMiddleware, tenantMiddleware);

router.get('/', isAnyRole, async (req, res, next) => {
  try {
    if (req.query.all_condominiums === 'true' && req.tenant.administradoraId) {
      const result = await service.listAllCondos(req.tenant.administradoraId, req.query);
      return res.json(result);
    }
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
        const setores = await setoresService.getNames(administradoraId);
        const routing = await aiService.routeDemandToSetor(
          { ...demand, category: triage?.category || demand.category, priority: triage?.priority || demand.priority },
          setores.length ? setores : ['Manutenção','Financeiro','Jurídico','Atendimento','Obras e Reformas','Segurança','Administrativo','TI']
        );
        if (routing) {
          emitToCondominium(req.tenant.id, 'demand:routed', {
            id: demand.id,
            setor: routing.assigned_setor,
            setores: routing.assigned_setores || [routing.assigned_setor].filter(Boolean),
          });

          // Auto-assign: pick the active member of the principal setor with fewest open demands
          if (routing.assigned_setor) {
            const members = await teamService.getBySetor(administradoraId, routing.assigned_setor);
            if (members.length > 0) {
              const { rows: load } = await query(
                `SELECT assigned_to_id, COUNT(*) AS cnt
                 FROM demands
                 WHERE assigned_to_id = ANY($1) AND status NOT IN ('CONCLUIDA','CANCELADA')
                 GROUP BY assigned_to_id`,
                [members.map(m => m.id)]
              );
              const loadMap = Object.fromEntries(load.map(r => [r.assigned_to_id, Number(r.cnt)]));
              const pick = members.reduce((a, b) => (loadMap[a.id] || 0) <= (loadMap[b.id] || 0) ? a : b);
              await query(
                `UPDATE demands SET assigned_to_id = $1, updated_at = NOW() WHERE id = $2`,
                [pick.id, demand.id]
              );
              emitToCondominium(req.tenant.id, 'demand:assigned', { id: demand.id, assigned_to_id: pick.id, assigned_name: pick.name });
            }
          }
        }
      }
    }).catch(() => {});

    res.status(201).json(demand);
  } catch (err) { next(err); }
});

router.get('/stats/by-setor', isAnyRole, async (req, res, next) => {
  try {
    const { rows } = await require('../../shared/db/pool').query(
      `SELECT s.setor AS assigned_setor,
         COUNT(*) FILTER (WHERE d.status NOT IN ('CONCLUIDA','CANCELADA')) AS open,
         COUNT(*) FILTER (WHERE d.status = 'CONCLUIDA') AS done,
         COUNT(*) FILTER (WHERE d.priority = 'CRITICA' AND d.status NOT IN ('CONCLUIDA','CANCELADA')) AS critical,
         COUNT(*) AS total
       FROM demands d,
            LATERAL unnest(
              CASE WHEN d.assigned_setores IS NOT NULL AND array_length(d.assigned_setores,1) > 0
                   THEN d.assigned_setores
                   WHEN d.assigned_setor IS NOT NULL
                   THEN ARRAY[d.assigned_setor]
                   ELSE '{}'::text[]
              END
            ) AS s(setor)
       WHERE d.condominium_id = $1
       GROUP BY s.setor`,
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
      const setores = await setoresService.getNames(req.user.administradora_id);
      const routing = await aiService.routeDemandToSetor(
        { ...demand, category: triage.category || demand.category, priority: triage.priority || demand.priority },
        setores.length ? setores : ['Manutenção','Financeiro','Jurídico','Atendimento','Obras e Reformas','Segurança','Administrativo','TI']
      );
      if (routing?.assigned_setor || routing?.assigned_setores?.length) {
        emitToCondominium(req.tenant.id, 'demand:routed', {
          id: demand.id,
          setor: routing.assigned_setor,
          setores: routing.assigned_setores || [routing.assigned_setor].filter(Boolean),
        });
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
