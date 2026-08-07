import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { api } from "@/lib/api"
import { ProfileManagement } from "@/components/profile-management"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const [{ user, onlineSession }, allUsers] = await Promise.all([
    getCurrentUserProfile(),
    api.users.getAll(),
  ])

  return (
    <ProfileManagement
      initialUser={user}
      initialOnlineSession={onlineSession}
      allMockUsers={allUsers}
    />
  )
}
