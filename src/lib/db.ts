import { PrismaClient } from '@prisma/client';
import { copyFileSync, existsSync } from 'fs';
import os from 'os';
import path from 'path';

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();

  // Hosted DBs (Turso, Postgres, etc.)
  if (configured && !configured.startsWith('file:') && configured !== 'DATABASE_URL') {
    return configured;
  }

  const bundledDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const isVercel = process.env.VERCEL === '1';

  // Vercel: copy bundled SQLite to /tmp (serverless FS is read-only)
  if (isVercel && existsSync(bundledDb)) {
    const tmpDb = path.join(os.tmpdir(), 'localpro-dev.db');
    if (!existsSync(tmpDb)) {
      copyFileSync(bundledDb, tmpDb);
    }
    return `file:${tmpDb}`;
  }

  if (configured?.startsWith('file:') && configured !== 'file:DATABASE_URL') {
    const rel = configured.slice('file:'.length).replace(/^\.\//, '');
    if (path.isAbsolute(rel)) {
      if (existsSync(rel)) return `file:${rel}`;
    } else {
      const absolute = path.join(/* turbopackIgnore: true */ process.cwd(), 'prisma', rel.replace(/^prisma\//, ''));
      if (existsSync(absolute)) return `file:${absolute}`;
    }
  }

  if (existsSync(bundledDb)) return `file:${bundledDb}`;

  return configured && configured !== 'DATABASE_URL' ? configured : `file:${bundledDb}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
