
'use server';
/**
 * @fileOverview A server action to handle leaderboard points and referral confirmations.
 *
 * - awardPointsForReferral - Confirms a referral and awards points to the referrer.
 */
import { z } from 'zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
      const requestRef = doc(db, 'referral_requests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        return { success: false, message: 'Referral request not found.' };
      }
      
      const requestData = requestSnap.data();
      if (requestData?.status !== 'Referred - Awaiting Confirmation') {
        return { success: false, message: `Request is not in a confirmable state. Current status: ${requestData?.status || 'N/A'}` };
      }
      
      await updateDoc(requestRef, {
        status: 'Confirmed Referral',
      });

      const referrerProfileRef = doc(db, 'profiles', referrerId);
      const referrerSnap = await getDoc(referrerProfileRef);

      if (referrerSnap.exists()) {
        const referrerData = referrerSnap.data();
        const currentPoints = referrerData?.points || 0;
        await updateDoc(referrerProfileRef, {
            points: currentPoints + 10,
        });
      }

      revalidatePath('/dashboard', 'page');
      return { success: true, message: 'Referral confirmed and points awarded.' };
    } catch (error) {
      console.error('Error in awardPointsForReferral:', error);
      return { success: false, message: 'An error occurred while processing the request.' };
    }
}
