"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DashboardCharts({ monthlyTrends, currencySplit }: { monthlyTrends: Array<Record<string, string | number>>; currencySplit: Array<Record<string, string | number>> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-80 rounded-lg border bg-card p-4">
        <div className="mb-3 font-semibold">Monthly cash flow</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#0f766e" />
            <Line type="monotone" dataKey="expenses" stroke="#dc2626" />
            <Line type="monotone" dataKey="cashFlow" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-80 rounded-lg border bg-card p-4">
        <div className="mb-3 font-semibold">Currency split</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={currencySplit}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="currency" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#0f766e" />
            <Bar dataKey="expenses" fill="#be123c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
