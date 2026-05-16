import { Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar({ userName }: { userName: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search clients, invoices, vendors" />
      </div>
      <div className="ml-4 flex items-center gap-3">
        <button className="rounded-md border p-2" title="Light mode"><Sun className="h-4 w-4" /></button>
        <button className="rounded-md border p-2" title="Dark mode"><Moon className="h-4 w-4" /></button>
        <div className="rounded-md border px-3 py-2 text-sm font-medium">{userName}</div>
      </div>
    </header>
  );
}
