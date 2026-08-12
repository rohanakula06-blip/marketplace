import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'localpro-secret';
const TOKEN_EXPIRY = '7d';

export type SessionClaims = {
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  location?: string | null;
};

export type TokenPayload = SessionClaims & { userId: string };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  language: string;
  largeText: boolean;
  reducedMotion: boolean;
  workerProfile: unknown;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, claims: SessionClaims) {
  return jwt.sign({ userId, ...claims }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

function userFromTokenClaims(payload: TokenPayload): AuthUser | null {
  if (!payload.email || !payload.name || !payload.role) return null;

  return {
    id: payload.userId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    role: payload.role,
    location: payload.location ?? null,
    latitude: null,
    longitude: null,
    language: 'en',
    largeText: false,
    reducedMotion: false,
    workerProfile: null,
  };
}

export async function createSession(userId: string, claims: SessionClaims) {
  const token = signToken(userId, claims);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await prisma.session.create({ data: { userId, token, expiresAt } });
  } catch {
    // Session write can fail on read-only/ephemeral serverless storage; JWT cookie still authenticates.
  }
  return { token, expiresAt };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('localpro_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: { workerProfile: true },
        },
      },
    });

    if (session && session.expiresAt >= new Date()) {
      return session.user;
    }
  } catch {
    // Session lookup can fail when DB is ephemeral across serverless instances.
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { workerProfile: true },
    });
    if (user) return user;
  } catch {
    // DB read can fail on serverless.
  }

  // JWT claims fallback — user registered on another serverless instance (Vercel SQLite).
  return userFromTokenClaims(payload);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('localpro_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('localpro_token');
}

export function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  location: string | null;
  language: string;
  largeText: boolean;
  reducedMotion: boolean;
  workerProfile?: unknown;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location,
    language: user.language,
    largeText: user.largeText,
    reducedMotion: user.reducedMotion,
    workerProfile: user.workerProfile || null,
  };
}

export function sessionClaimsFromUser(user: {
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  location?: string | null;
}): SessionClaims {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    location: user.location ?? null,
  };
}
