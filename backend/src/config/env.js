const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  adminEmail: process.env.ADMIN_EMAIL || "admin@soccerschool.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

module.exports = env;
