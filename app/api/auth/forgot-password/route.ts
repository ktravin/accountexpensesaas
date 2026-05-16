import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/modules/auth/validation";

export async function POST(request: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.updateMany({
    where: { email: parsed.data.email, deletedAt: null },
    data: { passwordResetToken: token, passwordResetExpires: addHours(new Date(), 1) }
  });

  return NextResponse.json({ ok: true, message: "If the account exists, a reset email will be sent." });
}
