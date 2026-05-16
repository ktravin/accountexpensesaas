import Decimal from "decimal.js";
import { subMonths, startOfMonth, format } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getDashboard(organizationId: string) {
  const [receipts, expenses, clients] = await Promise.all([
    prisma.receipt.findMany({ where: { organizationId, deletedAt: null }, include: { client: true }, orderBy: { paymentDate: "desc" } }),
    prisma.expense.findMany({ where: { organizationId, deletedAt: null }, orderBy: { expenseDate: "desc" } }),
    prisma.client.findMany({ where: { organizationId, deletedAt: null } })
  ]);

  const totalIncome = receipts.reduce((sum, receipt) => sum.plus(receipt.convertedAmount.toString()), new Decimal(0));
  const totalExpenses = expenses.reduce((sum, expense) => sum.plus(expense.convertedAmount.toString()).plus(expense.taxAmount.toString()), new Decimal(0));
  const pendingReceivables = receipts
    .filter((receipt) => ["PENDING", "PARTIAL"].includes(receipt.status))
    .reduce((sum, receipt) => sum.plus(receipt.convertedAmount.toString()), new Decimal(0));

  const months = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(new Date(), 5 - index)));
  const monthlyTrends = months.map((month) => {
    const key = format(month, "MMM yyyy");
    const income = receipts
      .filter((receipt) => format(receipt.paymentDate, "MMM yyyy") === key)
      .reduce((sum, receipt) => sum.plus(receipt.convertedAmount.toString()), new Decimal(0));
    const expense = expenses
      .filter((item) => format(item.expenseDate, "MMM yyyy") === key)
      .reduce((sum, item) => sum.plus(item.convertedAmount.toString()).plus(item.taxAmount.toString()), new Decimal(0));
    return { month: key, income: income.toNumber(), expenses: expense.toNumber(), cashFlow: income.minus(expense).toNumber() };
  });

  const clientAnalytics = clients.map((client) => {
    const value = receipts
      .filter((receipt) => receipt.clientId === client.id)
      .reduce((sum, receipt) => sum.plus(receipt.convertedAmount.toString()), new Decimal(0));
    return { client: client.companyName ?? client.name, value: value.toNumber() };
  });

  const currencySplit = ["USD", "INR"].map((currency) => ({
    currency,
    income: receipts.filter((receipt) => receipt.currency === currency).reduce((sum, receipt) => sum + Number(receipt.amount), 0),
    expenses: expenses.filter((expense) => expense.currency === currency).reduce((sum, expense) => sum + Number(expense.amount), 0)
  }));

  return {
    metrics: {
      totalIncome: totalIncome.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      netProfit: totalIncome.minus(totalExpenses).toNumber(),
      receivables: pendingReceivables.toNumber(),
      payables: expenses.filter((expense) => expense.recurring).reduce((sum, expense) => sum.plus(expense.convertedAmount.toString()), new Decimal(0)).toNumber()
    },
    monthlyTrends,
    currencySplit,
    clientAnalytics,
    recentTransactions: [
      ...receipts.slice(0, 5).map((receipt) => ({ id: receipt.id, type: "Receipt", party: receipt.client.companyName ?? receipt.client.name, amount: Number(receipt.convertedAmount), date: receipt.paymentDate })),
      ...expenses.slice(0, 5).map((expense) => ({ id: expense.id, type: "Expense", party: expense.vendor, amount: -Number(expense.convertedAmount), date: expense.expenseDate }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8),
    insights: [
      totalExpenses.gt(totalIncome.mul(0.65)) ? "Expense pressure is above 65% of income this period." : "Expense ratio is within the current operating target.",
      pendingReceivables.gt(0) ? `Outstanding receivables total ${pendingReceivables.toFixed(2)}.` : "No outstanding receivable risk detected.",
      monthlyTrends.at(-1)?.cashFlow && monthlyTrends.at(-1)!.cashFlow < 0 ? "Cash flow risk predicted next month unless collections improve." : "Cash flow trend is currently positive."
    ]
  };
}
