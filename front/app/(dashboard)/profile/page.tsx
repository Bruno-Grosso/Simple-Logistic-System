import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { ProfileManagement } from "@/components/profile-management"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const { user, onlineSession } = await getCurrentUserProfile()

  return (
    <ProfileManagement
      initialUser={user}
      initialOnlineSession={onlineSession}
    />
  )
}
