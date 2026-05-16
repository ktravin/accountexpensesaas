import { AccountType } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { getTrialBalance } from "@/services/accounting-service";

export async function profitAndLoss(organizationId: string) {
  const trial = await getTrialBalance(organizationId);
  const income = trial.filter((row) => row.type === AccountType.INCOME).reduce((sum, row) => sum.plus(row.credit - row.debit), new Decimal(0));
  const expenses = trial.filter((row) => row.type === AccountType.EXPENSE).reduce((sum, row) => sum.plus(row.debit - row.credit), new Decimal(0));
  return { income: income.toNumber(), expenses: expenses.toNumber(), netProfit: income.minus(expenses).toNumber() };
}

export async function balanceSheet(organizationId: string) {
  const trial = await getTrialBalance(organizationId);
  const assets = trial.filter((row) => row.type === AccountType.ASSET).reduce((sum, row) => sum.plus(row.debit - row.credit), new Decimal(0));
  const liabilities = trial.filter((row) => row.type === AccountType.LIABILITY).reduce((sum, row) => sum.plus(row.credit - row.debit), new Decimal(0));
  const equity = trial.filter((row) => row.type === AccountType.EQUITY).reduce((sum, row) => sum.plus(row.credit - row.debit), new Decimal(0));
  const pnl = await profitAndLoss(organizationId);
  return { assets: assets.toNumber(), liabilities: liabilities.toNumber(), equity: equity.plus(pnl.netProfit).toNumber() };
}

export async function expenseSummary(organizationId: string) {
  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    where: { organizationId, deletedAt: null },
    _sum: { convertedAmount: true, taxAmount: true },
    _count: true
  });
  return expenses.map((row) => ({
    category: row.category,
    amount: Number(row._sum.convertedAmount ?? 0) + Number(row._sum.taxAmount ?? 0),
    count: row._count
  }));
}

export async function outstandingReceivables(organizationId: string) {
  return prisma.receipt.findMany({
    where: { organizationId, deletedAt: null, status: { in: ["PENDING", "PARTIAL"] } },
    include: { client: true },
    orderBy: { dueDate: "asc" }
  });
}

export async function getReport(type: string, organizationId: string) {
  switch (type) {
    case "balance-sheet":
      return balanceSheet(organizationId);
    case "profit-loss":
      return profitAndLoss(organizationId);
    case "trial-balance":
      return getTrialBalance(organizationId);
    case "expense-summary":
      return expenseSummary(organizationId);
    case "outstanding-receivables":
      return outstandingReceivables(organizationId);
    default:
      throw new Error("Unsupported report type");
  }
}
