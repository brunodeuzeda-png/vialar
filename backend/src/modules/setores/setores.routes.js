const router = require('express').Router();
const auth = require('../../middleware/auth');
const svc = require('./setores.service');

router.use(auth);

router.get('/', async (req, res, next) => {
  try { res.json(await svc.list(req.user.administradora_id)); }
  catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await svc.create(req.user.administradora_id, req.body)); }
  catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try { res.json(await svc.update(req.params.id, req.user.administradora_id, req.body)); }
  catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try { await svc.remove(req.params.id, req.user.administradora_id); res.status(204).end(); }
  catch (err) { next(err); }
});

module.exports = router;
