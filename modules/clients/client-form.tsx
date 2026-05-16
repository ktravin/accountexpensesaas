"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setError(null);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      setError("Client could not be saved.");
      return;
    }
    router.refresh();
    (document.getElementById("client-form") as HTMLFormElement | null)?.reset();
  }

  return (
    <form id="client-form" action={submit} className="grid gap-3 md:grid-cols-2">
      <Input name="name" placeholder="Client name" required />
      <Input name="companyName" placeholder="Company name" />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="phone" placeholder="Phone" />
      <Input name="country" placeholder="Country" required />
      <select name="currencyPreference" className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
      <Input name="taxNumber" placeholder="GST / TAX / PAN" />
      <Input name="openingBalance" type="number" step="0.01" placeholder="Opening balance" />
      <textarea name="billingAddress" className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Billing address" />
      <textarea name="notes" className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Notes" />
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <Button className="md:col-span-2">Save client</Button>
    </form>
  );
}
