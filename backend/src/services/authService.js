const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/appError");

const validateAdminCredentials = async ({ email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const providedPassword = String(password || "");

  if (normalizedEmail !== env.adminEmail.toLowerCase()) {
    throw new AppError("Invalid email or password", 401);
  }

  if (env.adminPasswordHash) {
    const isValid = await bcrypt.compare(providedPassword, env.adminPasswordHash);

    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }
  } else if (providedPassword !== env.adminPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    email: env.adminEmail,
    role: "admin",
  };
};

const createToken = (admin) =>
  jwt.sign(admin, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

module.exports = {
  validateAdminCredentials,
  createToken,
};
