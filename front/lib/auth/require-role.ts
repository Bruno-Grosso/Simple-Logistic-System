import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUserProfile } from "./get-user"

export async function requireRole(...allowed: string[]) {
  const profile = await getCurrentUserProfile()
  const role = profile.user.rawRole || profile.user.role
  if (!allowed.includes(role)) redirect("/dashboard")
  return profile.user
}
