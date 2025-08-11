
'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Crown, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
    id: string;
    name: string;
    avatar: string;
    company: string;
    points: number;
};

function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 text-lg font-bold" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                </Card>
            ))}
        </div>
    );
}


export function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] =useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchLeaderboard() {
            if (!firebaseReady || !db) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const leaderboardQuery = query(
                    collection(db, "leaderboard"),
                    orderBy("points", "desc"),
                    limit(50)
                );
                const querySnapshot = await getDocs(leaderboardQuery);
                const entries: LeaderboardEntry[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as LeaderboardEntry));

                setLeaderboard(entries);

            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch leaderboard data.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, [toast]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
        if (rank === 3) return <Award className="h-6 w-6 text-yellow-700" />;
        return <span className="text-lg font-bold w-6 text-center">{rank}</span>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Top Referrers</h1>
                <p className="text-muted-foreground">
                    Recognizing the most active and helpful referrers on the platform.
                </p>
            </div>

            {isLoading ? <LeaderboardSkeleton /> : (
                <div className="space-y-2">
                    {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
                        <Card key={entry.id} className={cn(
                            "p-3 transition-all",
                            index === 0 && "bg-yellow-500/10 border-yellow-500",
                            index === 1 && "bg-slate-500/10 border-slate-400",
                            index === 2 && "bg-yellow-800/10 border-yellow-700"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8">
                                    {getRankIcon(index + 1)}
                                </div>
                                <Image 
                                    src={entry.avatar}
                                    alt={entry.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover aspect-square border"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold">{entry.name}</p>
                                    <p className="text-sm text-muted-foreground">{entry.company}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">{entry.points}</p>
                                    <p className="text-xs text-muted-foreground">Points</p>
                                </div>
                            </div>
                        </Card>
                    )) : (
                        <Card className="text-center p-10">
                            <p className="text-muted-foreground">The leaderboard is empty. Be the first to earn points by referring candidates!</p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
