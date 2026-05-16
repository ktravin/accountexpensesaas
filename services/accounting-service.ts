import { AccountType, Currency, ExpenseCategory, PaymentMode, Prisma, PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

const accountCodes = {
  cash: "1000",
  receivables: "1100",
  payables: "2000",
  equity: "3000",
  income: "4000",
  exchangeGainLoss: "4900",
  tax: "5100",
  expense: "5000"
};

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function ensureChartOfAccounts(organizationId: string, tx: Tx = prisma) {
  const defaults = [
    [accountCodes.cash, "Operating Cash", "ASSET"],
    [accountCodes.receivables, "Accounts Receivable", "ASSET"],
    [accountCodes.payables, "Accounts Payable", "LIABILITY"],
    [accountCodes.equity, "Owner Equity", "EQUITY"],
    [accountCodes.income, "Service Revenue", "INCOME"],
    [accountCodes.exchangeGainLoss, "Exchange Gain/Loss", "INCOME"],
    [accountCodes.expense, "Operating Expense", "EXPENSE"],
    [accountCodes.tax, "Taxes", "EXPENSE"]
  ] as const;

  for (const [code, name, type] of defaults) {
    await tx.account.upsert({
      where: { organizationId_code: { organizationId, code } },
      update: {},
      create: {
        organizationId,
        code,
        name,
        type: type as AccountType,
        isSystem: true,
        currency: Currency.USD
      }
    });
  }
}

async function accountId(organizationId: string, code: string, tx: Tx) {
  const account = await tx.account.findUniqueOrThrow({
    where: { organizationId_code: { organizationId, code } },
    select: { id: true }
  });
  return account.id;
}

function base(amount: number | Prisma.Decimal, exchangeRate: number | Prisma.Decimal) {
  return new Decimal(amount.toString()).mul(exchangeRate.toString()).toDecimalPlaces(2).toNumber();
}

async function balancedJournal(
  tx: Tx,
  organizationId: string,
  entryDate: Date,
  memo: string,
  sourceType: string,
  sourceId: string,
  entries: Array<{
    accountId: string;
    debit?: number;
    credit?: number;
    currency: Currency;
    exchangeRate: number;
  }>
) {
  const baseDebit = entries.reduce((sum, entry) => sum.plus(base(entry.debit ?? 0, entry.exchangeRate)), new Decimal(0));
  const baseCredit = entries.reduce((sum, entry) => sum.plus(base(entry.credit ?? 0, entry.exchangeRate)), new Decimal(0));

  if (!baseDebit.eq(baseCredit)) {
    throw new Error(`Unbalanced journal: debit ${baseDebit.toString()} credit ${baseCredit.toString()}`);
  }

  return tx.journalEntry.create({
    data: {
      organizationId,
      entryDate,
      memo,
      sourceType,
      sourceId,
      locked: true,
      ledgerEntries: {
        create: entries.map((entry) => ({
          accountId: entry.accountId,
          debit: entry.debit ?? 0,
          credit: entry.credit ?? 0,
          currency: entry.currency,
          exchangeRate: entry.exchangeRate,
          baseDebit: base(entry.debit ?? 0, entry.exchangeRate),
          baseCredit: base(entry.credit ?? 0, entry.exchangeRate)
        }))
      }
    }
  });
}

export async function postReceiptJournal(params: {
  organizationId: string;
  receiptId: string;
  paymentDate: Date;
  amount: number;
  currency: Currency;
  exchangeRate: number;
}) {
  await ensureChartOfAccounts(params.organizationId);
  return prisma.$transaction(async (tx) => {
    const cash = await accountId(params.organizationId, accountCodes.cash, tx);
    const income = await accountId(params.organizationId, accountCodes.income, tx);
    return balancedJournal(tx, params.organizationId, params.paymentDate, "Customer payment received", "RECEIPT", params.receiptId, [
      { accountId: cash, debit: params.amount, currency: params.currency, exchangeRate: params.exchangeRate },
      { accountId: income, credit: params.amount, currency: params.currency, exchangeRate: params.exchangeRate }
    ]);
  });
}

export async function postExpenseJournal(params: {
  organizationId: string;
  expenseId: string;
  expenseDate: Date;
  amount: number;
  taxAmount: number;
  currency: Currency;
  exchangeRate: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
}) {
  await ensureChartOfAccounts(params.organizationId);
  return prisma.$transaction(async (tx) => {
    const cash = await accountId(params.organizationId, accountCodes.cash, tx);
    const expense = await accountId(params.organizationId, accountCodes.expense, tx);
    const tax = await accountId(params.organizationId, accountCodes.tax, tx);
    const lines = [
      { accountId: expense, debit: params.amount, currency: params.currency, exchangeRate: params.exchangeRate },
      { accountId: cash, credit: params.amount + params.taxAmount, currency: params.currency, exchangeRate: params.exchangeRate }
    ];
    if (params.taxAmount > 0) {
      lines.splice(1, 0, { accountId: tax, debit: params.taxAmount, currency: params.currency, exchangeRate: params.exchangeRate });
    }
    return balancedJournal(tx, params.organizationId, params.expenseDate, `${params.category} expense paid via ${params.paymentMode}`, "EXPENSE", params.expenseId, lines);
  });
}

export async function getTrialBalance(organizationId: string) {
  const accounts = await prisma.account.findMany({
    where: { organizationId, deletedAt: null },
    include: { ledgerEntries: true },
    orderBy: { code: "asc" }
  });

  return accounts.map((account) => {
    const debit = account.ledgerEntries.reduce((sum, entry) => sum.plus(entry.baseDebit.toString()), new Decimal(0));
    const credit = account.ledgerEntries.reduce((sum, entry) => sum.plus(entry.baseCredit.toString()), new Decimal(0));
    return {
      accountCode: account.code,
      accountName: account.name,
      type: account.type,
      debit: debit.toNumber(),
      credit: credit.toNumber(),
      balance: debit.minus(credit).toNumber()
    };
  });
}
