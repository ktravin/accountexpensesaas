import { z } from "zod";
import { Role } from "@prisma/client";
import { json, withAuth } from "@/lib/api";
import { getReport } from "@/services/report-service";
import { toPdf } from "@/services/export-service";
import { sendReportEmail } from "@/services/email-service";

const emailSchema = z.object({ to: z.string().email() });

export const POST = withAuth(emailSchema, [Role.ADMIN, Role.ACCOUNTANT], async (input, { request, user }) => {
  const type = request.nextUrl.pathname.split("/").at(-2)!;
  const report = await getReport(type, user.organizationId);
  const content = toPdf(type, report);
  await sendReportEmail({
    to: input.to,
    subject: `Ledgerly report: ${type}`,
    text: "Attached is your requested accounting report.",
    attachmentName: `${type}.pdf`,
    content,
    contentType: "application/pdf"
  });
  return json({ ok: true });
});
