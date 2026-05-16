import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthForm } from "@/modules/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Create your finance workspace</h1>
          <p className="text-sm text-muted-foreground">Multi-currency accounting for service businesses.</p>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" />
          <p className="mt-4 text-sm text-muted-foreground">Already registered? <Link className="text-primary" href="/login">Sign in</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
