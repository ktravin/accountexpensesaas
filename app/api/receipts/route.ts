import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, json, recordAudit, withAuth } from "@/lib/api";
import { receiptSchema } from "@/modules/transactions/validation";
import { postReceiptJournal } from "@/services/accounting-service";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { request, user }) => {
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip, take } = getPagination(searchParams);
  const where = {
    organizationId: user.organizationId,
    deletedAt: null,
    ...(searchParams.get("clientId") ? { clientId: searchParams.get("clientId")! } : {}),
    ...(searchParams.get("currency") ? { currency: searchParams.get("currency") as "USD" | "INR" } : {})
  };
  const [data, total] = await Promise.all([
    prisma.receipt.findMany({ where, include: { client: true }, skip, take, orderBy: { paymentDate: "desc" } }),
    prisma.receipt.count({ where })
  ]);
  return json({ data, meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
});

export const POST = withAuth(receiptSchema, [Role.ADMIN, Role.ACCOUNTANT], async (input, { user }) => {
  const convertedAmount = input.amount * input.exchangeRate;
  const receipt = await prisma.receipt.create({ data: { ...input, organizationId: user.organizationId, convertedAmount } });
  const journal = await postReceiptJournal({
    organizationId: user.organizationId,
    receiptId: receipt.id,
    paymentDate: receipt.paymentDate,
    amount: Number(receipt.amount),
    currency: receipt.currency,
    exchangeRate: Number(receipt.exchangeRate)
  });
  const updated = await prisma.receipt.update({ where: { id: receipt.id }, data: { journalEntryId: journal.id } });
  await recordAudit({ organizationId: user.organizationId, userId: user.id, entityType: "Receipt", entityId: receipt.id, action: "CREATE", after: updated });
  return json(updated, { status: 201 });
});
