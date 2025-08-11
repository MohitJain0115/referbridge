'use server';
/**
 * @fileOverview AI flows for managing the leaderboard.
 *
 * - awardPointsForReferral - Awards points for a successful referral.
 * - awardPointsForView - Awards points for viewing a candidate profile.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, firebaseReady } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

// Input for awarding points
const AwardPointsInputSchema = z.object({
  referrerId: z.string().describe('The UID of the referrer to award points to.'),
});

// Points for a successful referral
export async function awardPointsForReferral(input: z.infer<typeof AwardPointsInputSchema>): Promise<void> {
    return awardPointsFlow({ ...input, points: 10 });
}

// Points for viewing a candidate profile
export async function awardPointsForView(input: z.infer<typeof AwardPointsInputSchema>): Promise<void> {
    return awardPointsFlow({ ...input, points: 2 });
}


const AwardPointsFlowInputSchema = AwardPointsInputSchema.extend({
    points: z.number().int().positive().describe('The number of points to award.'),
});


const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: z.void(),
  },
  async ({ referrerId, points }) => {
    if (!firebaseReady || !db) {
        console.error("Firebase not initialized, cannot award points.");
        return;
    }

    try {
        const leaderboardRef = doc(db, 'leaderboard', referrerId);
        const profileRef = doc(db, 'profiles', referrerId);

        const [leaderboardSnap, profileSnap] = await Promise.all([
            getDoc(leaderboardRef),
            getDoc(profileRef)
        ]);
        
        if (!profileSnap.exists()) {
            console.warn(`Profile not found for referrer ID: ${referrerId}. Cannot award points.`);
            return;
        }

        const profileData = profileSnap.data();

        if (leaderboardSnap.exists()) {
            // Document exists, increment points
            await setDoc(leaderboardRef, {
                points: increment(points),
                name: profileData.name || 'Unknown User',
                avatar: profileData.profilePic || 'https://placehold.co/100x100.png',
                company: profileData.referrerCompany || 'Unknown Company',
            }, { merge: true });
        } else {
            // Document does not exist, create it
            await setDoc(leaderboardRef, {
                points: points,
                name: profileData.name || 'Unknown User',
                avatar: profileData.profilePic || 'https://placehold.co/100x100.png',
                company: profileData.referrerCompany || 'Unknown Company',
            });
        }
    } catch (error) {
        console.error(`Failed to award ${points} points to ${referrerId}:`, error);
        // We don't throw an error to the client, as this is a background-like operation.
    }
  }
);
