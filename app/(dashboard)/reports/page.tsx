import { readSessionFromRequest } from "@/lib/auth";
import { money } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { balanceSheet, expenseSummary, profitAndLoss } from "@/services/report-service";
import { getTrialBalance } from "@/services/accounting-service";
import { ReportActions } from "@/modules/reports/report-actions";

export default async function ReportsPage() {
  const user = await readSessionFromRequest();
  const [pnl, sheet, trial, expenses] = await Promise.all([
    profitAndLoss(user!.organizationId),
    balanceSheet(user!.organizationId),
    getTrialBalance(user!.organizationId),
    expenseSummary(user!.organizationId)
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Balance sheet, P&L, trial balance, cash flow, client statements, and export workflows.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Profit & Loss</h2><ReportActions type="profit-loss" /></CardHeader>
          <CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Income</span><b>{money(pnl.income)}</b></div><div className="flex justify-between"><span>Expenses</span><b>{money(pnl.expenses)}</b></div><div className="flex justify-between border-t pt-2"><span>Net profit</span><b>{money(pnl.netProfit)}</b></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Balance Sheet</h2><ReportActions type="balance-sheet" /></CardHeader>
          <CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Assets</span><b>{money(sheet.assets)}</b></div><div className="flex justify-between"><span>Liabilities</span><b>{money(sheet.liabilities)}</b></div><div className="flex justify-between"><span>Equity</span><b>{money(sheet.equity)}</b></div></CardContent>
        </Card>
      </div>
      <Card id="ledger">
        <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Trial Balance</h2><ReportActions type="trial-balance" /></CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm"><thead className="text-muted-foreground"><tr><th>Code</th><th>Account</th><th>Type</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody>{trial.map((row) => <tr key={row.accountCode} className="border-t"><td className="py-2">{row.accountCode}</td><td>{row.accountName}</td><td>{row.type}</td><td className="text-right">{money(row.debit)}</td><td className="text-right">{money(row.credit)}</td></tr>)}</tbody></table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><h2 className="font-semibold">Expense Summary</h2><ReportActions type="expense-summary" /></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{expenses.map((row) => <div key={row.category} className="rounded-md border p-3"><div className="text-sm text-muted-foreground">{row.category}</div><div className="text-xl font-semibold">{money(row.amount)}</div><div className="text-xs text-muted-foreground">{row.count} entries</div></div>)}</CardContent>
      </Card>
    </div>
  );
}
