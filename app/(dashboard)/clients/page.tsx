import { readSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClientForm } from "@/modules/clients/client-form";
import { money } from "@/lib/format";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await readSessionFromRequest();
  const params = await searchParams;
  const clients = await prisma.client.findMany({
    where: {
      organizationId: user!.organizationId,
      deletedAt: null,
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { companyName: { contains: params.q, mode: "insensitive" } },
              { email: { contains: params.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">Party master with soft delete, audit history, and currency preferences.</p>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold">Add client</h2></CardHeader>
        <CardContent><ClientForm /></CardContent>
      </Card>
      <Card>
        <CardHeader><h2 className="font-semibold">Client directory</h2></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr><th className="py-2">Client</th><th>Email</th><th>Country</th><th>Currency</th><th className="text-right">Opening</th></tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t">
                    <td className="py-3"><div className="font-medium">{client.companyName ?? client.name}</div><div className="text-muted-foreground">{client.name}</div></td>
                    <td>{client.email}</td>
                    <td>{client.country}</td>
                    <td>{client.currencyPreference}</td>
                    <td className="text-right">{money(client.openingBalance.toString(), client.currencyPreference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
