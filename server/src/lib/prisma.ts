import { PrismaClient } from "@prisma/client";

// Em serverless (Vercel), cada invocação "morna" reusa o mesmo processo Node;
// sem esse cache em globalThis, cada invocação criaria uma nova conexão com
// o banco e esgotaria o limite de conexões do Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
