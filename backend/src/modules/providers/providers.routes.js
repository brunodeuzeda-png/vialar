const router = require('express').Router();
const service = require('./providers.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.list(req.tenant.id, req.user.administradora_id, req.query));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.tenant.id, req.body));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.getById(req.params.id, req.tenant.id));
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.tenant.id, req.body));
  } catch (err) { next(err); }
});

router.post('/:id/ratings', async (req, res, next) => {
  try {
    const { demand_id, rating, comment } = req.body;
    if (!rating) return res.status(400).json({ error: 'rating obrigatório' });
    res.json(await service.addRating(req.params.id, demand_id, req.user.id, rating, comment));
  } catch (err) { next(err); }
});

module.exports = router;
