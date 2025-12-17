
import { Suspense } from 'react';
import { ReferrerDashboard } from '@/components/dashboard/ReferrerDashboard';
import { SeekerDashboard } from '@/components/dashboard/SeekerDashboard';
import { DashboardToggle } from '@/components/dashboard/DashboardToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { SuggestionsPage } from '@/components/dashboard/SuggestionsPage';
import { ReferralRequestsPage } from '@/components/dashboard/ReferralRequestsPage';
import { ReferralStatusPage } from '@/components/dashboard/ReferralStatusPage';
import { LeaderboardPage } from '@/components/dashboard/LeaderboardPage';
import { DeveloperPage } from '@/components/dashboard/DeveloperPage';
import { ReferAndEarnPage } from '@/components/dashboard/ReferAndEarnPage';
import { RecruitmentSpecialistDashboard } from '@/components/dashboard/RecruitmentSpecialistDashboard';
import { RecruitmentGate } from '@/components/dashboard/RecruitmentGate';

export const dynamic = 'force-dynamic';

function MainDashboard({ view }: { view: string }) {
  const isSeeker = view === 'seeker';
  const isRecruitment = view === 'recruitment';
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl font-headline">
            {isSeeker ? 'Your Referral Dashboard' : isRecruitment ? 'Recruitment Specialist' : 'Referrer Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isSeeker
              ? 'Track your readiness, maximize visibility, and improve your score.'
              : isRecruitment
                ? 'Source candidates with advanced filters and unlimited resume downloads.'
                : 'Review and manage candidates seeking referrals.'}
          </p>
        </div>
        <DashboardToggle currentView={view} />
      </div>
      {isSeeker ? <SeekerDashboard /> : isRecruitment ? <RecruitmentGate /> : <ReferrerDashboard />}
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
  } else if (page === 'suggestions') {
    content = <SuggestionsPage />;
  } else if (page === 'developer') {
    content = <DeveloperPage />;
  } else if (page === 'leaderboard') {
    content = <LeaderboardPage />;
  } else if (page === 'refer-and-earn') {
    content = <ReferAndEarnPage />;
  } else if (page === 'requests') {
    if (view === 'referrer') {
      content = <ReferralRequestsPage />;
    } else {
      content = <ReferralStatusPage />;
    }
  } else {
    content = <MainDashboard view={view} />;
  }

  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      {content}
    </Suspense>
  );
}
