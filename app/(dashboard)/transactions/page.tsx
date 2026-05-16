import { readSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExpenseForm, ReceiptForm } from "@/modules/transactions/transaction-forms";

export default async function TransactionsPage() {
  const user = await readSessionFromRequest();
  const [clients, receipts, expenses] = await Promise.all([
    prisma.client.findMany({ where: { organizationId: user!.organizationId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.receipt.findMany({ where: { organizationId: user!.organizationId, deletedAt: null }, include: { client: true }, orderBy: { paymentDate: "desc" }, take: 20 }),
    prisma.expense.findMany({ where: { organizationId: user!.organizationId, deletedAt: null }, orderBy: { expenseDate: "desc" }, take: 20 })
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">Receipts and expenses automatically post immutable double-entry ledger records.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><h2 className="font-semibold">Incoming receipt</h2></CardHeader><CardContent><ReceiptForm clients={clients.map((c) => ({ id: c.id, label: c.companyName ?? c.name }))} /></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Outgoing expense</h2></CardHeader><CardContent><ExpenseForm /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold">Recent activity</h2></CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              {receipts.map((receipt) => <div key={receipt.id} className="flex justify-between rounded-md border p-3 text-sm"><span>{receipt.client.companyName ?? receipt.client.name} · {receipt.invoiceNumber}</span><span className="text-primary">{money(receipt.convertedAmount.toString())}</span></div>)}
            </div>
            <div className="space-y-2">
              {expenses.map((expense) => <div key={expense.id} className="flex justify-between rounded-md border p-3 text-sm"><span>{expense.vendor} · {expense.category}</span><span className="text-destructive">{money(expense.convertedAmount.toString())}</span></div>)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
