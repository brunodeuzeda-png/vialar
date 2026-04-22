const jwt = require('jsonwebtoken');
const env = require('../../config/env');

function signAccess(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.accessExpires });
}

function signRefresh(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.refreshExpires });
}

function verify(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signAccess, signRefresh, verify };
