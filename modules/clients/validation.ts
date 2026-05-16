import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  country: z.string().min(2),
  currencyPreference: z.enum(["USD", "INR"]),
  taxNumber: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  openingBalance: z.coerce.number().default(0),
  notes: z.string().optional().nullable()
});

export const clientUpdateSchema = clientSchema.partial();
