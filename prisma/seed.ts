import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { ensureChartOfAccounts, postExpenseJournal, postReceiptJournal } from "../services/accounting-service";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000001", name: "Northstar Studio", baseCurrency: "USD" }
  });

  await ensureChartOfAccounts(organization.id);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ledgerly.test" },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Avery Finance",
      email: "admin@ledgerly.test",
      passwordHash: await hashPassword("AdminPass123"),
      role: Role.ADMIN
    }
  });

  const acme = await prisma.client.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: "finance@acme.com" } },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Priya Shah",
      companyName: "Acme Cloud",
      email: "finance@acme.com",
      phone: "+1 555 0100",
      country: "United States",
      currencyPreference: "USD",
      taxNumber: "US-TAX-9281",
      billingAddress: "100 Market Street, San Francisco, CA",
      openingBalance: 0,
      notes: "Enterprise retainer client"
    }
  });

  const bytecraft = await prisma.client.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: "accounts@bytecraft.in" } },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Rohan Mehta",
      companyName: "ByteCraft India",
      email: "accounts@bytecraft.in",
      phone: "+91 98765 43210",
      country: "India",
      currencyPreference: "INR",
      taxNumber: "29ABCDE1234F1Z5",
      billingAddress: "Indiranagar, Bengaluru",
      openingBalance: 25000,
      notes: "Pays in INR"
    }
  });

  const receiptCount = await prisma.receipt.count({ where: { organizationId: organization.id } });
  if (receiptCount === 0) {
    const receipts = await Promise.all([
      prisma.receipt.create({
        data: {
          organizationId: organization.id,
          clientId: acme.id,
          invoiceNumber: "INV-1001",
          paymentDate: new Date("2026-04-05"),
          dueDate: new Date("2026-04-15"),
          currency: "USD",
          exchangeRate: 1,
          amount: 12000,
          convertedAmount: 12000,
          paymentMode: "BANK_TRANSFER",
          bankReference: "WIRE-4481",
          category: "Consulting",
          status: "PAID"
        }
      }),
      prisma.receipt.create({
        data: {
          organizationId: organization.id,
          clientId: bytecraft.id,
          invoiceNumber: "INV-1002",
          paymentDate: new Date("2026-04-20"),
          dueDate: new Date("2026-05-05"),
          currency: "INR",
          exchangeRate: 0.012,
          amount: 900000,
          convertedAmount: 10800,
          paymentMode: "UPI",
          bankReference: "UPI-88392",
          category: "Implementation",
          status: "PARTIAL"
        }
      })
    ]);

    for (const receipt of receipts) {
      const journal = await postReceiptJournal({
        organizationId: organization.id,
        receiptId: receipt.id,
        paymentDate: receipt.paymentDate,
        amount: Number(receipt.amount),
        currency: receipt.currency,
        exchangeRate: Number(receipt.exchangeRate)
      });
      await prisma.receipt.update({ where: { id: receipt.id }, data: { journalEntryId: journal.id } });
    }
  }

  const expenseCount = await prisma.expense.count({ where: { organizationId: organization.id } });
  if (expenseCount === 0) {
    const expenses = await Promise.all([
      prisma.expense.create({
        data: {
          organizationId: organization.id,
          vendor: "AWS",
          category: "CLOUD",
          expenseDate: new Date("2026-04-12"),
          amount: 1840,
          currency: "USD",
          exchangeRate: 1,
          convertedAmount: 1840,
          taxAmount: 0,
          paymentMode: "CARD",
          recurring: true,
          nextDueDate: new Date("2026-05-12")
        }
      }),
      prisma.expense.create({
        data: {
          organizationId: organization.id,
          vendor: "Design Contractor",
          category: "SALARY",
          expenseDate: new Date("2026-04-28"),
          amount: 180000,
          currency: "INR",
          exchangeRate: 0.012,
          convertedAmount: 2160,
          taxAmount: 120,
          paymentMode: "BANK_TRANSFER"
        }
      })
    ]);

    for (const expense of expenses) {
      const journal = await postExpenseJournal({
        organizationId: organization.id,
        expenseId: expense.id,
        expenseDate: expense.expenseDate,
        amount: Number(expense.amount),
        taxAmount: Number(expense.taxAmount),
        currency: expense.currency,
        exchangeRate: Number(expense.exchangeRate),
        category: expense.category,
        paymentMode: expense.paymentMode
      });
      await prisma.expense.update({ where: { id: expense.id }, data: { journalEntryId: journal.id } });
    }
  }

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      userId: admin.id,
      entityType: "Seed",
      entityId: organization.id,
      action: "SEED_DATA"
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
