import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires a driver adapter instead of a bare connection string on
// PrismaClient. The pool (and the client wrapping it) is cached on the
// global object in dev so Next.js's hot reload doesn't open a fresh
// connection pool on every module reload. Without this, `next dev` will
// exhaust Postgres's connection limit within a few edits.

// Neon suspends an idle database after a few minutes, and the first
// connection afterwards takes several seconds to wake it. These are the
// codes Prisma uses when it couldn't reach, or lost, the database.
const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
const RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function isConnectionError(error: unknown) {
  const code = (error as { code?: string })?.code;
  return (
    (code !== undefined && CONNECTION_ERROR_CODES.has(code)) ||
    (error as { name?: string })?.name === "PrismaClientInitializationError"
  );
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Wait for a waking database instead of hanging forever or giving up
    // instantly.
    connectionTimeoutMillis: 20_000,
    // Drop idle sockets well before the database can suspend under them, so
    // a request never reuses a connection that died while nobody was using it.
    idleTimeoutMillis: 20_000,
    keepAlive: true,
    max: 10,
  });
  // An error on an idle pooled connection is emitted as an event, and an
  // unhandled 'error' event takes the whole Node process down.
  pool.on("error", (error) => {
    console.warn("[db] idle connection error, it will be replaced:", error.message);
  });

  const client = new PrismaClient({ adapter: new PrismaPg(pool) });

  // Retry a query that failed because the database couldn't be reached, which
  // is what a cold start looks like. Only connection failures are retried,
  // never a query that reached the database and was rejected.
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            if (attempt >= RETRIES || !isConnectionError(error)) throw error;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
