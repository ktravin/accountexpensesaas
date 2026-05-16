import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, sessionCookieName } from "@/lib/auth";
import { registerSchema } from "@/modules/auth/validation";
import { ensureChartOfAccounts } from "@/services/accounting-service";

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { organizationName, name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: organizationName } });
    const user = await tx.user.create({
      data: { organizationId: organization.id, name, email, passwordHash, role: Role.ADMIN }
    });
    return { organization, user };
  });

  await ensureChartOfAccounts(result.organization.id);

  const token = await createSessionToken({
    id: result.user.id,
    organizationId: result.organization.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role
  });

  const response = NextResponse.json({ user: { email: result.user.email, name: result.user.name, role: result.user.role } }, { status: 201 });
  response.cookies.set(sessionCookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
