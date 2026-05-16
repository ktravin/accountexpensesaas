import { readSessionFromRequest } from "@/lib/auth";
import { getDashboard } from "@/services/dashboard-service";
import { money } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCharts } from "@/modules/dashboard/dashboard-charts";

export default async function DashboardPage() {
  const user = await readSessionFromRequest();
  const data = await getDashboard(user!.organizationId);
  const metrics = [
    ["Total income", data.metrics.totalIncome],
    ["Total expenses", data.metrics.totalExpenses],
    ["Net profit", data.metrics.netProfit],
    ["Receivables", data.metrics.receivables],
    ["Payables", data.metrics.payables]
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance dashboard</h1>
        <p className="text-sm text-muted-foreground">Cash flow, receivables, expenses, and operating signals.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardContent>
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{money(value as number)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardCharts monthlyTrends={data.monthlyTrends} currencySplit={data.currencySplit} />
      <div className="grid gap-4 lg:grid-cols-2" id="analytics">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">AI financial insights</h2>
            <div className="space-y-3">
              {data.insights.map((insight) => <div key={insight} className="rounded-md bg-muted p-3 text-sm">{insight}</div>)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Recent transactions</h2>
            <div className="space-y-2">
              {data.recentTransactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <div className="font-medium">{item.party}</div>
                    <div className="text-muted-foreground">{item.type}</div>
                  </div>
                  <div className={item.amount < 0 ? "text-destructive" : "text-primary"}>{money(item.amount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
