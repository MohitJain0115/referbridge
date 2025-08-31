"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmailsForUids, getConfirmedReferralsCountByReferrer, getDownloadCountsByUser, getProfilesCreatedAtForUids } from "@/actions/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DeveloperPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [emailsByUid, setEmailsByUid] = useState<Record<string, string>>({});
  const [activityCounts, setActivityCounts] = useState<Record<string, { downloads: number; confirmedReferrals: number }>>({});
  const [createdAtByUid, setCreatedAtByUid] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created'>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [resumeFilter, setResumeFilter] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [minDownloads, setMinDownloads] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [minConfirmed, setMinConfirmed] = useState("");
  const [maxConfirmed, setMaxConfirmed] = useState("");

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      setAuthorized(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const isDev = user?.email?.toLowerCase() === 'mohitjain3579@gmail.com';
      setAuthorized(Boolean(isDev));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time profiles
  useEffect(() => {
    if (!authorized || !db) return;
    const q = query(collection(db, 'profiles'));
    const unsub = onSnapshot(q, async (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProfiles(rows);
      // Fetch emails in background via server action
      const uids = rows.map((r) => r.id);
      try {
        const emails = await getEmailsForUids(uids);
        setEmailsByUid(emails);
      } catch (e) {
        console.error('getEmailsForUids failed', e);
      }
      // Fetch createdAt timestamps
      try {
        const created = await getProfilesCreatedAtForUids(uids);
        setCreatedAtByUid(created);
      } catch (e) {
        console.error('getProfilesCreatedAtForUids failed', e);
      }
      // Fetch activity counts per user (downloads + confirmed referrals)
      const counts: Record<string, { downloads: number; confirmedReferrals: number }> = {};
      await Promise.all(uids.map(async (uid) => {
        try {
          const [downloads, confirmed] = await Promise.all([
            getDownloadCountsByUser(uid),
            getConfirmedReferralsCountByReferrer(uid),
          ]);
          counts[uid] = { downloads, confirmedReferrals: confirmed };
        } catch (e) {
          counts[uid] = { downloads: 0, confirmedReferrals: 0 };
        }
      }));
      setActivityCounts(counts);
    });
    return () => unsub();
  }, [authorized]);

  const rows = useMemo(() => {
    return profiles.map((p) => {
      const resumeFileName = p.resumeName || p.resume?.fileName || '';
      const points = p.points || 0;
      const activity = activityCounts[p.id] || { downloads: 0, confirmedReferrals: 0 };
      return {
        id: p.id,
        name: p.name || '—',
        email: emailsByUid[p.id] || '—',
        resume: resumeFileName,
        points,
        downloads: activity.downloads,
        confirmedReferrals: activity.confirmedReferrals,
        created: createdAtByUid[p.id] || 0,
      };
    });
  }, [profiles, emailsByUid, activityCounts, createdAtByUid]);

  const filteredRows = useMemo(() => {
    const toNum = (v: string) => (v === '' ? null : Number(v));
    const minP = toNum(minPoints);
    const maxP = toNum(maxPoints);
    const minD = toNum(minDownloads);
    const maxD = toNum(maxDownloads);
    const minC = toNum(minConfirmed);
    const maxC = toNum(maxConfirmed);
    return rows.filter((r) => {
      if (nameFilter && !r.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (emailFilter && !r.email.toLowerCase().includes(emailFilter.toLowerCase())) return false;
      if (resumeFilter && !(r.resume || '').toLowerCase().includes(resumeFilter.toLowerCase())) return false;
      if (minP !== null && r.points < minP) return false;
      if (maxP !== null && r.points > maxP) return false;
      if (minD !== null && r.downloads < minD) return false;
      if (maxD !== null && r.downloads > maxD) return false;
      if (minC !== null && r.confirmedReferrals < minC) return false;
      if (maxC !== null && r.confirmedReferrals > maxC) return false;
      return true;
    });
  }, [rows, nameFilter, emailFilter, resumeFilter, minPoints, maxPoints, minDownloads, maxDownloads, minConfirmed, maxConfirmed]);

  const sortedRows = useMemo(() => {
    const r = [...filteredRows];
    const cmpStr = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });
    r.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = cmpStr(a.name || '', b.name || '');
      else if (sortBy === 'email') comp = cmpStr(a.email || '', b.email || '');
      else if (sortBy === 'created') comp = (a.created || 0) - (b.created || 0);
      return sortDir === 'asc' ? comp : -comp;
    });
    return r;
  }, [filteredRows, sortBy, sortDir]);

  const toggleSort = (key: 'name' | 'email' | 'created') => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const summary = useMemo(() => {
    const count = filteredRows.length;
    const totalPoints = filteredRows.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
    return { count, totalPoints };
  }, [filteredRows]);

  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setResumeFilter("");
    setMinPoints("");
    setMaxPoints("");
    setMinDownloads("");
    setMaxDownloads("");
    setMinConfirmed("");
    setMaxConfirmed("");
  };

  if (loading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!authorized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This section is restricted.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please log in with an authorized developer account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Developer</h1>
        <p className="text-muted-foreground">Internal tools and diagnostics for development.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Quick info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">User: {currentUser?.email}</div>
          <div className="text-sm text-muted-foreground">UID: {currentUser?.uid}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profiles (Live)</CardTitle>
          <CardDescription>Auto-updates on profile, resume, or points changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="rounded-md border p-3 min-w-[160px]">
              <div className="text-xs text-muted-foreground">Profiles</div>
              <div className="text-lg font-semibold">{summary.count}</div>
            </div>
            <div className="rounded-md border p-3 min-w-[160px]">
              <div className="text-xs text-muted-foreground">Total Points</div>
              <div className="text-lg font-semibold">{summary.totalPoints}</div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Search name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="Search email" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resume</Label>
              <Input value={resumeFilter} onChange={(e) => setResumeFilter(e.target.value)} placeholder="Search resume" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Points Min</Label>
              <Input type="number" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Points Max</Label>
              <Input type="number" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} placeholder="9999" />
            </div>
            <div className="hidden xl:block" />
            <div className="space-y-1">
              <Label className="text-xs">Downloads Min</Label>
              <Input type="number" value={minDownloads} onChange={(e) => setMinDownloads(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Downloads Max</Label>
              <Input type="number" value={maxDownloads} onChange={(e) => setMaxDownloads(e.target.value)} placeholder="9999" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirmed Min</Label>
              <Input type="number" value={minConfirmed} onChange={(e) => setMinConfirmed(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirmed Max</Label>
              <Input type="number" value={maxConfirmed} onChange={(e) => setMaxConfirmed(e.target.value)} placeholder="9999" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">Clear filters</Button>
            </div>
          </div>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button className="font-medium hover:underline" onClick={() => toggleSort('name')}>Name{sortBy === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
                  </TableHead>
                  <TableHead>
                    <button className="font-medium hover:underline" onClick={() => toggleSort('email')}>Email{sortBy === 'email' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
                  </TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>
                    <button className="font-medium hover:underline" onClick={() => toggleSort('created')}>Created{sortBy === 'created' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
                  </TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                  <TableHead className="text-right">Confirmed Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.email}</TableCell>
                    <TableCell className="truncate max-w-[240px]" title={r.resume}>{r.resume || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.created ? new Date(r.created).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-right">{r.points}</TableCell>
                    <TableCell className="text-right">{r.downloads}</TableCell>
                    <TableCell className="text-right">{r.confirmedReferrals}</TableCell>
                  </TableRow>
                ))}
                {sortedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No profiles found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





