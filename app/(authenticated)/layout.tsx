import { verifySession } from '@/lib/auth/dal';
import { cookies } from 'next/headers';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ProfileProvider, NotificationProvider } from '@/lib/contexts';

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
      <NotificationProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar user={{ 
            email: session.email, 
            name: session.name 
          }} />
          <SidebarInset className="flex flex-col overflow-hidden">
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </NotificationProvider>
    </ProfileProvider>
  );
}
