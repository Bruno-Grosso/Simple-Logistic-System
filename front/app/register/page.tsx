import Link from "next/link"
import { Truck } from "lucide-react"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/auth/get-session"

import { RegisterForm } from "./register-form"

export default async function RegisterPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Top right theme toggle */}
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle variant="outline" size="sm" />
      </div>

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
            Get started with LogiSys.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Create an account to manage your logistics, orders, fleet, and inventory in real time.
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
            <h1 className="font-display text-xl font-semibold text-foreground">LogiSys</h1>
            <p className="text-sm text-muted-foreground">Create a new account</p>
          </div>

          <Card className="border-border/80 shadow-lg shadow-background/20">
            <CardHeader className="hidden lg:block">
              <CardTitle className="font-display text-xl">Create Account</CardTitle>
              <CardDescription>Enter your details to create your LogiSys account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 lg:pt-0">
              <RegisterForm />

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
