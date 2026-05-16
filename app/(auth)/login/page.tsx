import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthForm } from "@/modules/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Sign in to Ledgerly</h1>
          <p className="text-sm text-muted-foreground">Run close, reporting, and collections from one workspace.</p>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
          <p className="mt-4 text-sm text-muted-foreground">New here? <Link className="text-primary" href="/register">Create an account</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
