import { Suspense } from 'react';
import { ReferrerDashboard } from '@/components/dashboard/ReferrerDashboard';
import { SeekerDashboard } from '@/components/dashboard/SeekerDashboard';
import { DashboardToggle } from '@/components/dashboard/DashboardToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPage } from '@/components/dashboard/SettingsPage';

export const dynamic = 'force-dynamic';

function MainDashboard({ view }: { view: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your ReferBridge dashboard.</p>
        </div>
        <DashboardToggle currentView={view} />
      </div>
      {view === 'referrer' ? <ReferrerDashboard /> : <SeekerDashboard />}
    </>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string; page?: string };
}) {
  const view = searchParams.view || 'seeker';
  const page = searchParams.page || null;

  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      {page === 'settings' ? <SettingsPage /> : <MainDashboard view={view} />}
    </Suspense>
  );
}
