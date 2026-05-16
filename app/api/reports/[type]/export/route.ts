import { Role } from "@prisma/client";
import { apiError, withAuth } from "@/lib/api";
import { getReport } from "@/services/report-service";
import { toExcel, toPdf } from "@/services/export-service";

function asArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT], async (_, { request, user }) => {
  const parts = request.nextUrl.pathname.split("/");
  const type = parts.at(-2)!;
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  const report = await getReport(type, user.organizationId);
  if (format === "xlsx") {
    const body = toExcel(type, report);
    return new Response(asArrayBuffer(body), {
      headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="${type}.xlsx"` }
    });
  }
  if (format === "pdf") {
    const body = toPdf(type, report);
    return new Response(asArrayBuffer(body), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${type}.pdf"` } });
  }
  return apiError("Unsupported export format", 400);
});
