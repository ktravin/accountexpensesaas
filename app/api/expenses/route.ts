import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, json, recordAudit, withAuth } from "@/lib/api";
import { expenseSchema } from "@/modules/transactions/validation";
import { postExpenseJournal } from "@/services/accounting-service";

export const GET = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER], async (_, { request, user }) => {
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip, take } = getPagination(searchParams);
  const where = {
    organizationId: user.organizationId,
    deletedAt: null,
    ...(searchParams.get("category") ? { category: searchParams.get("category") as never } : {}),
    ...(searchParams.get("currency") ? { currency: searchParams.get("currency") as "USD" | "INR" } : {})
  };
  const [data, total] = await Promise.all([
    prisma.expense.findMany({ where, skip, take, orderBy: { expenseDate: "desc" } }),
    prisma.expense.count({ where })
  ]);
  return json({ data, meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
});

export const POST = withAuth(expenseSchema, [Role.ADMIN, Role.ACCOUNTANT], async (input, { user }) => {
  const convertedAmount = input.amount * input.exchangeRate;
  const expense = await prisma.expense.create({ data: { ...input, organizationId: user.organizationId, convertedAmount } });
  const journal = await postExpenseJournal({
    organizationId: user.organizationId,
    expenseId: expense.id,
    expenseDate: expense.expenseDate,
    amount: Number(expense.amount),
    taxAmount: Number(expense.taxAmount),
    currency: expense.currency,
    exchangeRate: Number(expense.exchangeRate),
    category: expense.category,
    paymentMode: expense.paymentMode
  });
  const updated = await prisma.expense.update({ where: { id: expense.id }, data: { journalEntryId: journal.id } });
  await recordAudit({ organizationId: user.organizationId, userId: user.id, entityType: "Expense", entityId: expense.id, action: "CREATE", after: updated });
  return json(updated, { status: 201 });
});
