"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (email && password) {
      router.push("/dashboard");
    } else {
      setError("Please enter your email and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left — decorative (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-end p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-px top-0 h-[120%] w-px origin-top bg-primary/25"
          style={{ transform: "rotate(-24deg)" }}
          aria-hidden
        />

        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
            <Truck className="size-7" aria-hidden />
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-foreground">
            Logistics simplified.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Track orders, fleet, and warehouse capacity from one unified operations hub.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="size-6" aria-hidden />
            </div>
            <p className="font-display text-lg font-medium text-foreground">LogiSys</p>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <Card className="border-border/80 shadow-lg shadow-background/20">
            <CardHeader className="hidden lg:block">
              <CardTitle className="font-display text-xl">Sign in</CardTitle>
              <CardDescription>Enter your work email and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 lg:pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPass ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn("h-10 pr-11")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      aria-pressed={showPass}
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Demo credentials
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                    <p className="text-xs font-medium text-primary">Admin</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">ana@logisys.com</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                    <p className="text-xs font-medium text-chart-2">Client</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">marcos@client.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
