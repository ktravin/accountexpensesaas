import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, ZodSchema } from "zod";
import { can, readSessionFromRequest, SessionUser } from "@/lib/auth";
import { auditLog } from "@/services/audit-service";
import { env } from "@/lib/env";

type Handler<T> = (input: T, ctx: { request: NextRequest; user: SessionUser }) => Promise<Response>;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json({ error: { message, details } }, { status });
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 20), 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function rateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { count: 0, resetAt: now + env.RATE_LIMIT_WINDOW_MS };
  if (bucket.resetAt < now) {
    bucket.count = 0;
    bucket.resetAt = now + env.RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);
  return bucket.count <= env.RATE_LIMIT_MAX;
}

export function withAuth<T>(
  schema: ZodSchema<T> | null,
  roles: Array<SessionUser["role"]>,
  handler: Handler<T>
) {
  return async (request: NextRequest) => {
    try {
      if (!rateLimit(request)) return apiError("Too many requests", 429);
      const user = await readSessionFromRequest(request);
      if (!user) return apiError("Authentication required", 401);
      if (!can(user.role, roles)) return apiError("Insufficient permissions", 403);

      const body = request.method === "GET" || request.method === "DELETE" ? {} : await request.json();
      const parsed = schema ? schema.parse(body) : ({} as T);
      return handler(parsed, { request, user });
    } catch (error) {
      if (error instanceof ZodError) return apiError("Validation failed", 422, error.flatten());
      if (error instanceof Prisma.PrismaClientKnownRequestError) return apiError("Database constraint failed", 409, error.message);
      console.error(error);
      return apiError("Unexpected server error", 500);
    }
  };
}

export async function recordAudit(params: Parameters<typeof auditLog>[0]) {
  await auditLog(params).catch((error) => console.error("Audit log failed", error));
}
