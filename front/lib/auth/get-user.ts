import "server-only"

import { api } from "@/lib/api"
import { getSession } from "@/lib/auth/get-session"
import type { User } from "@/types"

export type UserProfileWithSession = {
  user: User
  onlineSession?: {
    session_id: string
    user_id: string
    login_time: string
    last_activity: string
  } | null
}

const DEFAULT_SEED_USER: User = {
  id: "USR-001",
  name: "Alice Admin",
  email: "alice@logisys.com",
  role: "admin",
  rawRole: "admin",
  work_position: "System Administrator",
  address: "Rua do Imperador, Centro, Petrópolis - RJ",
}

export async function getCurrentUserProfile(): Promise<UserProfileWithSession> {
  const session = await getSession()
  let userId = session?.sub

  if (!userId && session?.email) {
    const allUsers = await api.users.getAll()
    const found = allUsers.find(
      (u) =>
        u.email?.toLowerCase() === session.email?.toLowerCase() ||
        u.id.toLowerCase() === session.email?.toLowerCase(),
    )
    if (found) userId = found.id
  }

  const targetId = userId || "USR-001"
  const user = (await api.users.getById(targetId)) || DEFAULT_SEED_USER

  let onlineSession = null
  try {
    const sessions = await api.users.getOnlineSessions(user.id)
    if (sessions && sessions.length > 0) {
      onlineSession = sessions[0]
    }
  } catch {
    /* ignore session lookup error */
  }

  return {
    user,
    onlineSession,
  }
}
