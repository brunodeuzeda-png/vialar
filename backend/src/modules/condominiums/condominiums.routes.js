const router = require('express').Router();
const auth = require('../../middleware/auth');
const svc = require('./condominiums.service');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    let condos = await svc.list(req.user.administradora_id);
    if (req.query.active === 'true') condos = condos.filter(c => c.is_active);
    res.json(condos);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const condo = await svc.create(req.user.administradora_id, req.body);
    res.status(201).json(condo);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const condo = await svc.getOne(req.params.id, req.user.administradora_id);
    res.json(condo);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const condo = await svc.update(req.params.id, req.user.administradora_id, req.body);
    res.json(condo);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.remove(req.params.id, req.user.administradora_id);
    res.json({ message: 'Condomínio desativado' });
  } catch (err) { next(err); }
});

router.patch('/:id/sindico', async (req, res, next) => {
  try {
    const condo = await svc.updateSindico(req.params.id, req.user.administradora_id, req.body);
    res.json(condo);
  } catch (err) { next(err); }
});

module.exports = router;
