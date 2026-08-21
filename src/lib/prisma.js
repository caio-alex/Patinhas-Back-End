const { PrismaClient } = require("@prisma/client");

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload em dev
const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

module.exports = prisma;
