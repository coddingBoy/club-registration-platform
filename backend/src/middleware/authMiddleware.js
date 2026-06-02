const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/appError");

const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token", 401));
  }
};

const requireRole = (...allowedRoles) => [
  requireAuth,
  (req, _res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(new AppError("Forbidden", 403));
    }

    next();
  },
];

module.exports = {
  requireAuth,
  requireRole,
};
