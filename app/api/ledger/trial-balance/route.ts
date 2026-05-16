import { Role } from "@prisma/client";
import { json, withAuth } from "@/lib/api";
import { getTrialBalance } from "@/services/accounting-service";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { user }) => {
  return json(await getTrialBalance(user.organizationId));
});
