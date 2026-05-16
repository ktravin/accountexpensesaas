import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { json, withAuth } from "@/lib/api";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT], async (_, { request, user }) => {
  const id = request.nextUrl.pathname.split("/").at(-2)!;
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: user.organizationId, clientId: id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  return json(logs);
});
