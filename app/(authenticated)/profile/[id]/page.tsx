import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  return <ProfileEditor profileId={id} />;
}
