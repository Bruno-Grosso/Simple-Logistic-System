"use client"

import { useId } from "react"
import { LogOut } from "lucide-react"

import { logoutAction } from "@/app/login/actions"
import { buttonVariants } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/** Full-width submit for settings / pages (clears httpOnly session cookie server-side). */
export function SignOutButton({
  className,
  variant = "destructive",
  size = "sm",
  children,
}: {
  className?: string
  variant?: "destructive" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  children?: React.ReactNode
}) {
  return (
    <form action={logoutAction} className="inline">
      <button
        type="submit"
        className={cn(buttonVariants({ variant, size }), "inline-flex items-center gap-1.5", className)}
      >
        {children ?? (
          <>
            <LogOut className="size-3.5" />
            Sign out
          </>
        )}
      </button>
    </form>
  )
}

/** Sidebar user dropdown: submits server action (do not use Link — cookie would stay). */
export function SignOutMenuItem() {
  const rawId = useId()
  const formId = `logout-${rawId.replace(/:/g, "")}`

  return (
    <>
      <form id={formId} action={logoutAction} className="hidden" aria-hidden="true" />
      <DropdownMenuItem
        variant="destructive"
        render={
          <button
            type="submit"
            form={formId}
            className="w-full cursor-pointer border-0 bg-transparent text-left font-inherit"
          />
        }
      >
        <LogOut className="mr-2 size-4" />
        Sign out
      </DropdownMenuItem>
    </>
  )
}
