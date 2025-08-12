
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaderboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Leaderboard</h1>
                <p className="text-muted-foreground">
                    This feature is currently under construction.
                </p>
            </div>
             <Card className="text-center p-10">
                <p className="text-muted-foreground">Check back soon to see the top referrers!</p>
            </Card>
        </div>
    )
}
