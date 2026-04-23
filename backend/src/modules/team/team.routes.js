const router = require('express').Router();
const auth = require('../../middleware/auth');
const { list, create, update, remove, SETORES } = require('./team.service');

router.use(auth);

router.get('/setores', (req, res) => res.json(SETORES));

router.get('/', async (req, res, next) => {
  try {
    const members = await list(req.user.administradoraId);
    res.json(members);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const member = await create(req.user.administradoraId, req.body);
    res.status(201).json(member);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const member = await update(req.params.id, req.user.administradoraId, req.body);
    res.json(member);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await remove(req.params.id, req.user.administradoraId);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
