"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientOption = { id: string; label: string };

async function post(path: string, formData: FormData) {
  const payload = Object.fromEntries(formData.entries());
  for (const key of ["amount", "exchangeRate", "taxAmount"]) {
    if (payload[key] === "") delete payload[key];
  }
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Save failed");
}

export function ReceiptForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function submit(formData: FormData) {
    try {
      await post("/api/receipts", formData);
      router.refresh();
    } catch {
      setError("Receipt could not be saved.");
    }
  }
  return (
    <form action={submit} className="grid gap-3 md:grid-cols-2">
      <select name="clientId" className="h-10 rounded-md border bg-background px-3 text-sm" required>{clients.map((client) => <option key={client.id} value={client.id}>{client.label}</option>)}</select>
      <Input name="invoiceNumber" placeholder="Invoice number" required />
      <Input name="paymentDate" type="date" required />
      <Input name="dueDate" type="date" />
      <select name="currency" className="h-10 rounded-md border bg-background px-3 text-sm"><option>USD</option><option>INR</option></select>
      <Input name="exchangeRate" type="number" step="0.000001" defaultValue="1" required />
      <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
      <select name="paymentMode" className="h-10 rounded-md border bg-background px-3 text-sm"><option>BANK_TRANSFER</option><option>CARD</option><option>CASH</option><option>UPI</option><option>CHECK</option><option>OTHER</option></select>
      <Input name="bankReference" placeholder="Bank reference" />
      <Input name="category" placeholder="Category" defaultValue="Service revenue" required />
      <select name="status" className="h-10 rounded-md border bg-background px-3 text-sm"><option>PAID</option><option>PENDING</option><option>PARTIAL</option><option>OVERPAID</option></select>
      <Input name="attachmentUrl" placeholder="Attachment URL" />
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <Button className="md:col-span-2">Record receipt</Button>
    </form>
  );
}

export function ExpenseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  async function submit(formData: FormData) {
    try {
      await post("/api/expenses", formData);
      router.refresh();
    } catch {
      setError("Expense could not be saved.");
    }
  }
  return (
    <form action={submit} className="grid gap-3 md:grid-cols-2">
      <Input name="vendor" placeholder="Vendor" required />
      <select name="category" className="h-10 rounded-md border bg-background px-3 text-sm"><option>TRAVEL</option><option>FOOD</option><option>SALARY</option><option>RENT</option><option>CLOUD</option><option>SOFTWARE</option><option>MARKETING</option><option>MISCELLANEOUS</option></select>
      <Input name="expenseDate" type="date" required />
      <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
      <select name="currency" className="h-10 rounded-md border bg-background px-3 text-sm"><option>USD</option><option>INR</option></select>
      <Input name="exchangeRate" type="number" step="0.000001" defaultValue="1" required />
      <Input name="taxAmount" type="number" step="0.01" placeholder="GST/Tax" defaultValue="0" />
      <select name="paymentMode" className="h-10 rounded-md border bg-background px-3 text-sm"><option>BANK_TRANSFER</option><option>CARD</option><option>CASH</option><option>UPI</option><option>CHECK</option><option>OTHER</option></select>
      <Input name="receiptUrl" placeholder="Receipt URL" />
      <Input name="nextDueDate" type="date" />
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <Button className="md:col-span-2">Record expense</Button>
    </form>
  );
}
