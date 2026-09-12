import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

// ---------------------------------------------------------------------------
// Prisma client
// ---------------------------------------------------------------------------
// Vercel gives a serverless function no writable, persistent filesystem, so a
// plain `file:` SQLite database cannot work in production. We therefore go
// through Prisma's libSQL driver adapter, which speaks to either:
//
//   development  DATABASE_URL=file:../db/custom.db    (local SQLite file)
//   production   DATABASE_URL=libsql://<db>.turso.io  (+ TURSO_AUTH_TOKEN)
//
// The URL decides which one is used — no code branches on the environment, and
// local development keeps working exactly as before.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The Prisma CLI resolves a relative `file:` URL from the directory holding
 * `schema.prisma` (i.e. `prisma/`), while the libSQL client resolves it from
 * the process cwd. Without normalisation the same DATABASE_URL would point at
 * two different files — the app would read an empty database while
 * `prisma db push` happily created another one.
 */
function normaliseDatabaseUrl(rawUrl: string): string {
  if (!rawUrl.startsWith('file:')) return rawUrl;

  const filePath = rawUrl.slice('file:'.length);
  if (path.isAbsolute(filePath)) return rawUrl;

  return `file:${path.resolve(process.cwd(), 'prisma', filePath)}`;
}

function createPrismaClient(): PrismaClient {
  const url = normaliseDatabaseUrl(
    process.env.DATABASE_URL ?? 'file:../db/custom.db',
  );

  // Turso requires a token; a local file must not receive one.
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSQL(
    authToken ? { url, authToken } : { url },
  );

  return new PrismaClient({
    adapter,
    // Query logging is useful locally and deafening in serverless logs.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across hot reloads in development.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
