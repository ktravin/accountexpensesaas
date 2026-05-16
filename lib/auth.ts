import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { Role } from "@prisma/client";
import { env } from "@/lib/env";

export type SessionUser = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
};

const key = new TextEncoder().encode(env.JWT_SECRET);
export const sessionCookieName = "ledgerly_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function readSessionFromRequest(request?: NextRequest): Promise<SessionUser | null> {
  const token = request
    ? request.cookies.get(sessionCookieName)?.value
    : (await cookies()).get(sessionCookieName)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export function can(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}
