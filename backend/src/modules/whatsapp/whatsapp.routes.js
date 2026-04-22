const router = require('express').Router();
const service = require('./whatsapp.service');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { isSindico } = require('../../middleware/rbac');

router.use(authMiddleware, tenantMiddleware, isSindico);

router.get('/status', async (req, res, next) => {
  try {
    res.json(await service.getStatus(req.tenant.id));
  } catch (err) { next(err); }
});

router.post('/connect', async (req, res, next) => {
  try {
    res.json(await service.connect(req.tenant.id));
  } catch (err) { next(err); }
});

router.post('/disconnect', async (req, res, next) => {
  try {
    await service.disconnect(req.tenant.id);
    res.json({ message: 'Sessão encerrada' });
  } catch (err) { next(err); }
});

router.get('/messages', async (req, res, next) => {
  try {
    res.json(await service.getMessages(req.tenant.id, req.query));
  } catch (err) { next(err); }
});

router.post('/send', async (req, res, next) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'to e message obrigatórios' });
    await service.sendMessage(req.tenant.id, to, message);
    res.json({ message: 'Enviado' });
  } catch (err) { next(err); }
});

router.post('/broadcast', async (req, res, next) => {
  try {
    const { message, filter } = req.body;
    if (!message) return res.status(400).json({ error: 'message obrigatório' });
    const result = await service.broadcast(req.tenant.id, message, filter || {});
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
