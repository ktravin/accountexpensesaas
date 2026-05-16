"use client";

import { Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions({ type }: { type: string }) {
  async function email() {
    const to = window.prompt("Email report to");
    if (!to) return;
    await fetch(`/api/reports/${type}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to }) });
  }
  return (
    <div className="flex gap-2">
      <a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm" href={`/api/reports/${type}/export?format=pdf`}><Download className="h-4 w-4" />PDF</a>
      <a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm" href={`/api/reports/${type}/export?format=xlsx`}><Download className="h-4 w-4" />Excel</a>
      <Button className="gap-2" onClick={email}><Mail className="h-4 w-4" />Email</Button>
    </div>
  );
}
