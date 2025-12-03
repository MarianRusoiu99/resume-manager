import { verifySession } from '@/lib/auth/dal';
import { cookies } from 'next/headers';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ProfileProvider } from '@/contexts/ProfileContext';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use DAL for auth check - will redirect if not authenticated
  const session = await verifySession();

  // Get sidebar state from cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';

  return (
    <ProfileProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar user={{ 
          email: session.email, 
          name: session.name 
        }} />
        <SidebarInset>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProfileProvider>
  );
}
