import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { verifySession } from "@/lib/auth/dal";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Use DAL for auth - will redirect if not authenticated
  await verifySession();

  const { id } = await params;

  return <ProfileEditor profileId={id} />;
}
