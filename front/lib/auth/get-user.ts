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

export async function getCurrentUserProfile(): Promise<UserProfileWithSession> {
  const session = await getSession()
  if (!session?.sub) {
    throw new Error("No authenticated user session is available.")
  }

  const user = await api.users.getById(session.sub)
  if (!user) {
    throw new Error("The authenticated user could not be found.")
  }

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
