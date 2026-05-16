import Link from "next/link";
import { BarChart3, BookOpen, Building2, FileText, LayoutDashboard, ReceiptText } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/reports#ledger", label: "Ledger", icon: BookOpen },
  { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3 }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="border-b p-6">
        <div className="text-xl font-semibold">Ledgerly</div>
        <div className="text-sm text-muted-foreground">Accounting workspace</div>
      </div>
      <nav className="p-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
