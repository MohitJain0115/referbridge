
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReferAndEarnPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Refer & Earn</h1>
                <p className="text-muted-foreground mt-1">
                    At ReferBridge, we believe in rewarding the people who make job referrals possible.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                    <CardDescription>
                        Our Refer & Earn program lets you collect points for every successful referral you make.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">How to Become a Premium Referrer</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Start referring candidates through ReferBridge.</li>
                            <li>Once you reach 10 confirmed referrals, you’ll automatically become a <span className="font-semibold text-primary">Premium Referrer.</span></li>
                            <li>As a Premium Referrer, you’ll earn <span className="font-semibold text-primary">75 points</span> for every confirmed referral.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">What Counts as a Confirmed Referral?</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>After you refer a candidate, mark their status as “Referred” in your dashboard.</li>
                            <li>The candidate will then see the referral in their dashboard and confirm if you actually referred them.</li>
                            <li>Once the candidate confirms, the referral will be added to your Confirmed Referral Tally, and you’ll earn points.</li>
                            <li>If the candidate doesn’t update their status within <span className="font-semibold text-primary">5 days</span>, the referral will be automatically confirmed, and points will be awarded.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Important Guidelines & Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                     <div className="flex items-start gap-3">
                        <span className="text-lg">✅</span>
                        <div>
                            <p className="font-semibold text-foreground">Points are awarded only for referrals made through the “Referral Requests” section.</p>
                            <p className="text-muted-foreground">➝ Make sure every candidate sends you a referral request on the platform before you refer them.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <span className="text-lg">✅</span>
                        <div>
                            <p className="font-semibold text-foreground">You can refer up to 6 candidates per day.</p>
                            <p className="text-muted-foreground">➝ This ensures that referrals remain quality-driven and focused on candidates with a strong chance of success.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="pt-2">
                <h3 className="font-semibold text-lg text-foreground">Why This Matters</h3>
                <p className="text-muted-foreground mt-2">
                    The Refer & Earn program is designed to reward genuine efforts while keeping the referral process transparent and fair. By focusing on quality referrals, we make sure both candidates and referrers benefit in the long run.
                </p>
            </div>
        </div>
    );
}
