import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, json, recordAudit, withAuth } from "@/lib/api";
import { clientSchema } from "@/modules/clients/validation";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { request, user }) => {
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip, take } = getPagination(searchParams);
  const q = searchParams.get("q") ?? undefined;
  const where = {
    organizationId: user.organizationId,
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { companyName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [data, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.client.count({ where })
  ]);
  return json({ data, meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
});

export const POST = withAuth(clientSchema, [Role.ADMIN, Role.ACCOUNTANT], async (input, { request, user }) => {
  const client = await prisma.client.create({ data: { ...input, organizationId: user.organizationId } });
  await recordAudit({
    organizationId: user.organizationId,
    userId: user.id,
    clientId: client.id,
    entityType: "Client",
    entityId: client.id,
    action: "CREATE",
    after: client,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined
  });
  return json(client, { status: 201 });
});
