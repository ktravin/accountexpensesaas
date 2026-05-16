import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function auditLog(params: {
  organizationId: string;
  userId?: string;
  clientId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: params
  });
}
