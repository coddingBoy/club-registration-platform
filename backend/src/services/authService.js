const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/prisma");
const AppError = require("../utils/appError");

const validateAdminCredentials = async ({ email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const providedPassword = String(password || "");

  if (normalizedEmail !== env.adminEmail.toLowerCase()) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!adminUser) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(providedPassword, adminUser.passwordHash);

    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    };
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
    role: "ADMIN",
  };
};

const validateParentCredentials = async ({ email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const providedPassword = String(password || "");

  const account = await prisma.parentAccount.findUnique({
    where: { email: normalizedEmail },
    include: { player: true },
  });

  if (!account) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(providedPassword, account.passwordHash);

  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    id: account.id,
    email: account.email,
    role: account.role,
    playerId: account.playerId,
  };
};

const createToken = (user) =>
  jwt.sign(user, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

module.exports = {
  validateAdminCredentials,
  validateParentCredentials,
  createToken,
};
