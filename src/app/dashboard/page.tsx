import { Suspense } from 'react';
import { ReferrerDashboard } from '@/components/dashboard/ReferrerDashboard';
import { SeekerDashboard } from '@/components/dashboard/SeekerDashboard';
import { DashboardToggle } from '@/components/dashboard/DashboardToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { ReferralRequestsPage } from '@/components/dashboard/ReferralRequestsPage';

export const dynamic = 'force-dynamic';

function MainDashboard({ view }: { view: string }) {
  const isSeeker = view === 'seeker';
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl font-headline">{isSeeker ? 'Find a Referrer' : 'Candidate Dashboard'}</h1>
          <p className="text-muted-foreground">{isSeeker ? 'Discover and connect with insiders at your target companies.' : 'Review and manage candidates seeking referrals.'}</p>
        </div>
        <DashboardToggle currentView={view} />
      </div>
      {isSeeker ? <SeekerDashboard /> : <ReferrerDashboard />}
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

  let content;

  if (page === 'settings') {
    content = <SettingsPage />;
  } else if (page === 'requests' && view === 'referrer') {
    content = <ReferralRequestsPage />;
  } else {
    content = <MainDashboard view={view} />;
  }

  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      {content}
    </Suspense>
  );
}
