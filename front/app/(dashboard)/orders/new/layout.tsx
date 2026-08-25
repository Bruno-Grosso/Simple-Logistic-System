import { requireRole } from "@/lib/auth/require-role"

/** Order creation and dispatch assignment are administrative operations. */
export default async function NewOrderLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin")
  return children
}
