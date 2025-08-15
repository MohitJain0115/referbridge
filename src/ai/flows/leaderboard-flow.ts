
'use server';
/**
 * @fileOverview A flow to handle leaderboard points and referral confirmations.
 *
 * - awardPointsForReferral - Confirms a referral and awards points to the referrer.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AwardPointsInputSchema = z.object({
  requestId: z.string().describe('The ID of the referral request to confirm.'),
  referrerId: z.string().describe('The ID of the referrer receiving points.'),
});

const AwardPointsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function awardPointsForReferral(
  input: z.infer<typeof AwardPointsInputSchema>
): Promise<z.infer<typeof AwardPointsOutputSchema>> {
  return awardPointsFlow(input);
}

const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsInputSchema,
    outputSchema: AwardPointsOutputSchema,
  },
  async ({ requestId, referrerId }) => {
    if (!db) {
      throw new Error('Firestore database is not initialized.');
    }
    try {
      const requestRef = doc(db, 'referral_requests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists() || requestSnap.data()?.status !== 'Referred - Awaiting Confirmation') {
        return { success: false, message: 'Request not found or not in a confirmable state.' };
      }
      
      // Update the request status to Confirmed Referral
      await updateDoc(requestRef, {
        status: 'Confirmed Referral',
      });

      // Award points to the referrer
      const referrerProfileRef = doc(db, 'profiles', referrerId);
      await updateDoc(referrerProfileRef, {
        points: increment(10),
      });

      return { success: true, message: 'Referral confirmed and points awarded.' };
    } catch (error) {
      console.error('Error in awardPointsFlow:', error);
      return { success: false, message: 'An error occurred while processing the request.' };
    }
  }
);
