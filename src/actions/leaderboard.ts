
'use server';
/**
 * @fileOverview A server action to handle leaderboard points and referral confirmations.
 *
 * - awardPointsForReferral - Confirms a referral and awards points to the referrer based on their status.
 */
import { z } from 'zod';
import admin from 'firebase-admin';
import 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const AwardPointsInputSchema = z.object({
  requestId: z.string().describe('The ID of the referral request to confirm.'),
  referrerId: z.string().describe('The ID of the referrer receiving points.'),
});

type AwardPointsInput = z.infer<typeof AwardPointsInputSchema>;

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error (leaderboard):', error);
  }
}

export async function awardPointsForReferral(input: AwardPointsInput) {
    const validatedInput = AwardPointsInputSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, message: 'Invalid input.' };
    }
    
    const { requestId, referrerId } = validatedInput.data;
    const adminDb = admin.firestore();
    
    try {
        const batch = adminDb.batch();
        const requestRef = adminDb.collection('referral_requests').doc(requestId);
        const requestSnap = await requestRef.get();

        if (!requestSnap.exists) {
            return { success: false, message: 'Referral request not found.' };
        }
        
        const requestData = requestSnap.data();
        if (requestData?.status !== 'Referred - Awaiting Confirmation') {
            return { success: false, message: `Request is not in a confirmable state. Current status: ${requestData?.status || 'N/A'}` };
        }
      
        batch.update(requestRef, { status: 'Confirmed Referral', confirmedAt: admin.firestore.FieldValue.serverTimestamp() });

        const referrerProfileRef = adminDb.collection('profiles').doc(referrerId);
        const referrerSnap = await referrerProfileRef.get();

        if (referrerSnap.exists) {
            const referrerData = referrerSnap.data() || {};
            const isPremium = referrerData.isPremiumReferrer === true;

            // Count confirmed referrals for this referrer
            let confirmedReferralCount = 0;
            try {
              const confirmedReferralsSnap = await adminDb
                .collection('referral_requests')
                .where('referrerId', '==', referrerId)
                .where('status', '==', 'Confirmed Referral')
                .get();
              confirmedReferralCount = confirmedReferralsSnap.size + 1; // +1 for this confirmation
            } catch (e: any) {
              // Fallback when composite index is missing: filter client-side by status
              if (e?.code === 9 || String(e?.message || '').includes('index')) {
                const eqSnap = await adminDb
                  .collection('referral_requests')
                  .where('referrerId', '==', referrerId)
                  .get();
                const confirmed = eqSnap.docs.filter(d => d.get('status') === 'Confirmed Referral').length;
                confirmedReferralCount = confirmed + 1;
              } else {
                throw e;
              }
            }

            if (isPremium) {
                // Award points to premium referrers
                batch.update(referrerProfileRef, { points: admin.firestore.FieldValue.increment(75) });
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

// Opportunistic auto-confirm for a single referrer, to be called when they open their requests page
export async function autoConfirmOverdueForReferrer(input: { referrerId: string }) {
  const schema = z.object({ referrerId: z.string() });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, message: 'Invalid input.' };

  const { referrerId } = parsed.data;
  const adminDb = admin.firestore();
  try {
    const now = admin.firestore.Timestamp.now();
    const q = await adminDb
      .collection('referral_requests')
      .where('referrerId', '==', referrerId)
      .where('status', '==', 'Referred - Awaiting Confirmation')
      .where('autoConfirmAt', '<=', now)
      .get();

    if (q.empty) return { success: true, processed: 0 };

    let processed = 0;
    for (const docSnap of q.docs) {
      const requestId = docSnap.id;

      const batch = adminDb.batch();
      const requestRef = adminDb.collection('referral_requests').doc(requestId);
      batch.update(requestRef, { status: 'Confirmed Referral', confirmedAt: admin.firestore.FieldValue.serverTimestamp() });

      const referrerProfileRef = adminDb.collection('profiles').doc(referrerId);
      const referrerSnap = await referrerProfileRef.get();
      if (referrerSnap.exists) {
        const referrerData = referrerSnap.data() || {};
        const isPremium = referrerData.isPremiumReferrer === true;

        let confirmedReferralCount = 0;
        try {
          const confirmedReferralsSnap = await adminDb
            .collection('referral_requests')
            .where('referrerId', '==', referrerId)
            .where('status', '==', 'Confirmed Referral')
            .get();
          confirmedReferralCount = confirmedReferralsSnap.size + 1;
        } catch (e: any) {
          if (e?.code === 9 || String(e?.message || '').includes('index')) {
            const eqSnap = await adminDb
              .collection('referral_requests')
              .where('referrerId', '==', referrerId)
              .get();
            const confirmed = eqSnap.docs.filter(d => d.get('status') === 'Confirmed Referral').length;
            confirmedReferralCount = confirmed + 1;
          } else {
            throw e;
          }
        }

        if (isPremium) {
          batch.update(referrerProfileRef, { points: admin.firestore.FieldValue.increment(75) });
        } else {
          if (confirmedReferralCount >= 10) {
            batch.update(referrerProfileRef, { isPremiumReferrer: true });
          }
        }
      }

      await batch.commit();
      processed++;
    }

    revalidatePath('/dashboard', 'page');
    return { success: true, processed };
  } catch (error) {
    console.error('Error in autoConfirmOverdueForReferrer:', error);
    return { success: false, message: 'Failed to auto-confirm referrals.' };
  }
}

// Allow seekers to reject a referral that was marked as referred, without awarding points
const RejectReferralInputSchema = z.object({
  requestId: z.string().describe('The ID of the referral request to reject.'),
  seekerId: z.string().describe('The ID of the seeker rejecting the referral.'),
});

type RejectReferralInput = z.infer<typeof RejectReferralInputSchema>;

export async function rejectReferral(input: RejectReferralInput) {
  const validated = RejectReferralInputSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { requestId, seekerId } = validated.data;
  const adminDb = admin.firestore();
  try {
    const requestRef = adminDb.collection('referral_requests').doc(requestId);
    const snap = await requestRef.get();
    if (!snap.exists) {
      return { success: false, message: 'Referral request not found.' };
    }
    const data = snap.data();
    if (!data || data.seekerId !== seekerId) {
      return { success: false, message: 'You are not authorized to reject this request.' };
    }
    if (data.status !== 'Referred - Awaiting Confirmation') {
      return { success: false, message: 'Only referrals awaiting your confirmation can be rejected.' };
    }

    await requestRef.update({
      status: 'Cancelled',
      cancellationReason: 'Rejected by referral seeker',
    });

    revalidatePath('/dashboard', 'page');
    return { success: true, message: 'Referral rejected.' };
  } catch (error) {
    console.error('Error in rejectReferral:', error);
    return { success: false, message: 'An error occurred while rejecting the referral.' };
  }
}