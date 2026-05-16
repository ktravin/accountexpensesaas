import { redirect } from "next/navigation";
import { readSessionFromRequest } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await readSessionFromRequest();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Topbar userName={user.name} />
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
