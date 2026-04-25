const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/errors');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(jwtSecret) {
  return function authMiddleware(req, res, next) {
    const token = getBearerToken(req);
    if (!token) return next(new HttpError(401, 'Unauthorized'));

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload;
      return next();
    } catch {
      return next(new HttpError(401, 'Invalid token'));
    }
  };
}

function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) return next(new HttpError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
    return next();
  };
}

module.exports = { requireAuth, requireRole };
