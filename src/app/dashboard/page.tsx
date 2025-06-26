import { Suspense } from 'react';
import { ReferrerDashboard } from '@/components/dashboard/ReferrerDashboard';
import { SeekerDashboard } from '@/components/dashboard/SeekerDashboard';
import { DashboardToggle } from '@/components/dashboard/DashboardToggle';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function DashboardContent({ view }: { view: string | null }) {
  if (view === 'referrer') {
    return <ReferrerDashboard />;
  }
  return <SeekerDashboard />;
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const view = searchParams.view || 'seeker';

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your ReferBridge dashboard.</p>
        </div>
        <DashboardToggle currentView={view} />
      </div>
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <DashboardContent view={view} />
      </Suspense>
    </>
  );
}
