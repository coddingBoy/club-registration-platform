const env = require("./env");
const prisma = require("./prisma");

const connectDatabase = async () => {
  if (!env.databaseUrl) {
    console.warn("DATABASE_URL is missing. Prisma routes will fail until it is configured.");
    return;
  }

  await prisma.$queryRaw`SELECT 1`;
  console.log("PostgreSQL connected through Prisma");
};

module.exports = connectDatabase;
