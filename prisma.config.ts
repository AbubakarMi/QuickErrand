// Read by the Prisma CLI (migrate, generate, studio) — not by the Next.js
// app itself, which is why it needs its own dotenv load; Next.js loads
// .env automatically for the app, but a plain `node`/CLI process doesn't.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
