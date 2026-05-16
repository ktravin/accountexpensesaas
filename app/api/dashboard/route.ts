import { Role } from "@prisma/client";
import { json, withAuth } from "@/lib/api";
import { getDashboard } from "@/services/dashboard-service";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { user }) => {
  return json(await getDashboard(user.organizationId));
});
