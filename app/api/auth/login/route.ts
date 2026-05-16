import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieName, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/modules/auth/validation";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.deletedAt) return NextResponse.json({ error: { message: "Invalid credentials" } }, { status: 401 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: { message: "Invalid credentials" } }, { status: 401 });

  const token = await createSessionToken({
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role
  });

  const response = NextResponse.json({ user: { email: user.email, name: user.name, role: user.role } });
  response.cookies.set(sessionCookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
