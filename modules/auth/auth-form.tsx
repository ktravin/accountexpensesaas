"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!response.ok) {
      setError("Please check the details and try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      {mode === "register" && <Input name="organizationName" placeholder="Organization name" required />}
      {mode === "register" && <Input name="name" placeholder="Your name" required />}
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}</Button>
    </form>
  );
}
