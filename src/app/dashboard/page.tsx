import { Suspense } from 'react';
import { ReferrerDashboard } from '@/components/dashboard/ReferrerDashboard';
import { SeekerDashboard } from '@/components/dashboard/SeekerDashboard';
import { DashboardToggle } from '@/components/dashboard/DashboardToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockCandidates } from "@/lib/data";
import { ReferralRequestsPage } from '@/components/dashboard/ReferralRequestsPage';

export const dynamic = 'force-dynamic';

function ReferralHistoryPage({ userType }: { userType: 'seeker' | 'referrer' }) {
    const history = mockCandidates.slice(0, 4).map(c => ({
        name: userType === 'seeker' ? c.company : c.name,
        role: c.role,
        status: c.status
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">
                    {userType === 'seeker' ? 'My Referrals' : 'Referred Candidates'}
                </h1>
                <p className="text-muted-foreground">
                    {userType === 'seeker' ? 'Track the status of your referral requests.' : 'Track the candidates you have referred.'}
                </p>
            </div>
            <Card>
                <CardHeader className="sr-only">
                  <CardTitle>Referral History</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{userType === 'seeker' ? 'Company' : 'Candidate'}</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.role}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.status === 'Referred' ? 'default' : 'secondary'} className="capitalize">{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

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
  } else if (page === 'referred') {
    content = <ReferralHistoryPage userType={view as 'seeker' | 'referrer'} />;
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
