
'use server';
/**
 * @fileOverview A server action to handle leaderboard points and referral confirmations.
 *
 * - awardPointsForReferral - Confirms a referral and awards points to the referrer based on their status.
 */
import { z } from 'zod';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

const AwardPointsInputSchema = z.object({
  requestId: z.string().describe('The ID of the referral request to confirm.'),
  referrerId: z.string().describe('The ID of the referrer receiving points.'),
});

type AwardPointsInput = z.infer<typeof AwardPointsInputSchema>;

export async function awardPointsForReferral(input: AwardPointsInput) {
    const validatedInput = AwardPointsInputSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, message: 'Invalid input.' };
    }
    
    const { requestId, referrerId } = validatedInput.data;

    if (!db) {
      return { success: false, message: 'Firestore database is not initialized.' };
    }
    
    try {
        const batch = writeBatch(db);
        
        const requestRef = doc(db, 'referral_requests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            return { success: false, message: 'Referral request not found.' };
        }
        
        const requestData = requestSnap.data();
        if (requestData?.status !== 'Referred - Awaiting Confirmation') {
            return { success: false, message: `Request is not in a confirmable state. Current status: ${requestData?.status || 'N/A'}` };
        }
      
        batch.update(requestRef, { status: 'Confirmed Referral' });

        const referrerProfileRef = doc(db, 'profiles', referrerId);
        const referrerSnap = await getDoc(referrerProfileRef);

        if (referrerSnap.exists()) {
            const referrerData = referrerSnap.data();
            const isPremium = referrerData.isPremiumReferrer === true;

            const confirmedReferralsQuery = query(
                collection(db, 'referral_requests'),
                where('referrerId', '==', referrerId),
                where('status', '==', 'Confirmed Referral')
            );
            const confirmedReferralsSnap = await getDocs(confirmedReferralsQuery);
            const confirmedReferralCount = confirmedReferralsSnap.size + 1; // +1 for the current confirmation

            if (isPremium) {
                const currentPoints = referrerData.points || 0;
                batch.update(referrerProfileRef, { points: currentPoints + 25 });
            } else {
                if (confirmedReferralCount >= 10) {
                    batch.update(referrerProfileRef, { isPremiumReferrer: true });
                    // No points for the 10th referral, they just unlock the status.
                }
                // No points awarded for the first 9 referrals.
            }
        }

        await batch.commit();

        revalidatePath('/dashboard', 'page');
        return { success: true, message: 'Referral confirmed.' };

    } catch (error) {
      console.error('Error in awardPointsForReferral:', error);
      return { success: false, message: 'An error occurred while processing the request.' };
    }
}
