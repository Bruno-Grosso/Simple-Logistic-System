import Link from "next/link"
import { Truck } from "lucide-react"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/get-session"

import { LoginForm } from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const justRegistered = params.registered === "1"
  const showDevHint = process.env.NODE_ENV === "development"

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
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
              {justRegistered ? (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400"
                >
                  Account created! You can now sign in.
                </div>
              ) : null}

              <LoginForm />

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Register
                </Link>
              </p>

              {showDevHint ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Local development
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Set <code className="font-mono text-[11px]">LOGISYS_ALLOW_DEV_LOGIN=true</code> and{" "}
                    <code className="font-mono text-[11px]">LOGISYS_DEV_USERS_JSON</code> in{" "}
                    <code className="font-mono text-[11px]">.env.local</code>, or use{" "}
                    <code className="font-mono text-[11px]">LOGISYS_AUTH_EMAIL</code> /{" "}
                    <code className="font-mono text-[11px]">LOGISYS_AUTH_PASSWORD</code>. See{" "}
                    <code className="font-mono text-[11px]">.env.example</code>.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
