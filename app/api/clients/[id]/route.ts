import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, json, recordAudit, withAuth } from "@/lib/api";
import { clientUpdateSchema } from "@/modules/clients/validation";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { request, user }) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!;
  const client = await prisma.client.findFirst({ where: { id, organizationId: user.organizationId, deletedAt: null } });
  return client ? json(client) : apiError("Client not found", 404);
});

export const PATCH = withAuth(clientUpdateSchema, [Role.ADMIN, Role.ACCOUNTANT], async (input, { request, user }) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!;
  const before = await prisma.client.findFirst({ where: { id, organizationId: user.organizationId, deletedAt: null } });
  if (!before) return apiError("Client not found", 404);
  const client = await prisma.client.update({ where: { id }, data: input });
  await recordAudit({ organizationId: user.organizationId, userId: user.id, clientId: id, entityType: "Client", entityId: id, action: "UPDATE", before, after: client });
  return json(client);
});

export const DELETE = withAuth(null, [Role.ADMIN], async (_, { request, user }) => {
  const id = request.nextUrl.pathname.split("/").at(-1)!;
  const before = await prisma.client.findFirst({ where: { id, organizationId: user.organizationId, deletedAt: null } });
  if (!before) return apiError("Client not found", 404);
  const client = await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordAudit({ organizationId: user.organizationId, userId: user.id, clientId: id, entityType: "Client", entityId: id, action: "SOFT_DELETE", before, after: client });
  return json({ ok: true });
});
