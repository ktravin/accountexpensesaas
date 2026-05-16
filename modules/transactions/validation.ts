import { z } from "zod";

export const receiptSchema = z.object({
  clientId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  paymentDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  currency: z.enum(["USD", "INR"]),
  exchangeRate: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
  paymentMode: z.enum(["BANK_TRANSFER", "CARD", "CASH", "UPI", "CHECK", "OTHER"]),
  bankReference: z.string().optional().nullable(),
  category: z.string().min(1),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERPAID", "VOID"]).default("PAID"),
  attachmentUrl: z.string().optional().nullable()
});

export const expenseSchema = z.object({
  vendor: z.string().min(1),
  category: z.enum(["TRAVEL", "FOOD", "SALARY", "RENT", "CLOUD", "SOFTWARE", "MARKETING", "MISCELLANEOUS"]),
  expenseDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  currency: z.enum(["USD", "INR"]),
  exchangeRate: z.coerce.number().positive(),
  taxAmount: z.coerce.number().min(0).default(0),
  paymentMode: z.enum(["BANK_TRANSFER", "CARD", "CASH", "UPI", "CHECK", "OTHER"]),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  recurring: z.boolean().default(false),
  nextDueDate: z.coerce.date().optional().nullable()
});
