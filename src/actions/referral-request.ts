
'use server';
/**
 * @fileOverview Server actions for managing referral requests with a daily limit.
 * 
 * - getRemainingRequests - Fetches the number of referral requests a user has left for the day.
 * - sendReferralRequestWithLimit - Sends a referral request if the user is within their daily limit.
 */

import { z } from 'zod';
import admin from 'firebase-admin';
import 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const REQUEST_LIMIT = 10;

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}
const db = admin.firestore();

// Compute the last reset boundary at 8:00 AM IST (Asia/Kolkata) for daily limits
function getLastISTResetTimestamp(): admin.firestore.Timestamp {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30, no DST
    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + IST_OFFSET_MS);
    const boundaryIst = new Date(nowIst.getTime());
    boundaryIst.setUTCHours(8, 0, 0, 0); // 08:00 in the shifted IST view
    if (nowIst.getUTCHours() < 8) {
      boundaryIst.setUTCDate(boundaryIst.getUTCDate() - 1);
    }
    const boundaryUtc = new Date(boundaryIst.getTime() - IST_OFFSET_MS);
    return admin.firestore.Timestamp.fromDate(boundaryUtc);
}


// Schema for sending a request
const SendRequestSchema = z.object({
  seekerId: z.string(),
  referrerId: z.string(),
  jobInfo: z.string().optional(),
});
type SendRequestInput = z.infer<typeof SendRequestSchema>;

// --- Helper function to get remaining requests ---
async function fetchRemainingRequests(userId: string): Promise<number> {
    if (!db) return 0;

    const lastReset = getLastISTResetTimestamp();
    
    const activityRef = db.collection('referral_requests_activity');
    const q = activityRef
        .where('seekerId', '==', userId)
        .where('requestedAt', '>=', lastReset);
    
    const activitySnapshot = await q.get();
    const requestCount = activitySnapshot.size;
    
    return Math.max(0, REQUEST_LIMIT - requestCount);
}


// --- Server Action: Get Remaining Requests ---
export async function getRemainingRequests(userId: string) {
    if (!userId) {
        return { success: false, remaining: 0, message: "User ID is required." };
    }
    try {
        const remaining = await fetchRemainingRequests(userId);
        return { success: true, remaining };
    } catch (error) {
        console.error("Error in getRemainingRequests:", error);
        return { success: false, remaining: 0, message: "An error occurred." };
    }
}

// --- Server Action: Send Referral Request ---
export async function sendReferralRequestWithLimit(input: SendRequestInput) {
    if (!db) {
        return { success: false, message: 'Service not available. Please try again later.' };
    }
    
    const validatedInput = SendRequestSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, message: 'Invalid input.' };
    }

    const { seekerId, referrerId, jobInfo } = validatedInput.data;

    try {
        // 1. Check if a request already exists to this referrer
        const requestsRef = db.collection("referral_requests");
        const existingReqQuery = requestsRef
            .where("seekerId", "==", seekerId)
            .where("referrerId", "==", referrerId);
        const existingReqSnapshot = await existingReqQuery.get();
        // if (!existingReqSnapshot.empty) {
        //     return { success: false, message: `You have already sent a request to this referrer.` };
        // }

        // 2. Check the daily limit
        const remainingRequests = await fetchRemainingRequests(seekerId);
        if (remainingRequests <= 0) {
            return { success: false, message: `You have reached your daily limit of ${REQUEST_LIMIT} requests. Limits reset at 8:00 AM IST.` };
        }
        
        // 3. Log the request activity for rate limiting
        const activityRef = db.collection('referral_requests_activity');
        await activityRef.add({
            seekerId: seekerId,
            referrerId: referrerId,
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 4. Create the actual referral request
        await requestsRef.add({
            seekerId: seekerId,
            referrerId: referrerId,
            jobInfo: jobInfo || '',
            status: "Pending",
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            cancellationReason: null,
        });
        
        revalidatePath('/seeker-profile', 'page');
        return { success: true, message: 'Your profile has been shared.' };

    } catch (error) {
        console.error("Error in sendReferralRequestWithLimit:", error);
        return { success: false, message: 'An error occurred while sending the request.' };
    }
}

// --- Server Action: Mark as Referred with Daily Limit (6/day, resets 8AM IST) ---
const MarkReferredSchema = z.object({
  requestId: z.string(),
  referrerId: z.string(),
});
type MarkReferredInput = z.infer<typeof MarkReferredSchema>;

export async function markAsReferredWithLimit(input: MarkReferredInput) {
    if (!db) {
        return { success: false, message: 'Service not available. Please try again later.' };
    }
    const validated = MarkReferredSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, message: 'Invalid input.' };
    }
    const { requestId, referrerId } = validated.data;

    try {
        const requestRef = db.collection('referral_requests').doc(requestId);
        const requestSnap = await requestRef.get();
        if (!requestSnap.exists) {
            return { success: false, message: 'Referral request not found.' };
        }
        const data = requestSnap.data() || {} as any;
        if (data.referrerId !== referrerId) {
            return { success: false, message: 'You are not authorized to update this request.' };
        }

        if (data.status === 'Confirmed Referral') {
            return { success: false, message: 'This request is already confirmed.' };
        }

        // Rate limit: 6 per day at 8AM IST reset
        const lastReset = getLastISTResetTimestamp();
        const activityRef = db.collection('referral_status_activity');
        const q = activityRef
            .where('referrerId', '==', referrerId)
            .where('action', '==', 'mark_referred')
            .where('actedAt', '>=', lastReset);
        const snap = await q.get();
        const count = snap.size;
        const DAILY_LIMIT = 6;
        if (count >= DAILY_LIMIT) {
            return { success: false, message: `Daily limit reached. You can mark up to ${DAILY_LIMIT} requests as referred per day. Limits reset at 8:00 AM IST.` };
        }

        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        // const FIVE_DAYS_MS = 30 * 1000;
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        const autoConfirmAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + FIVE_DAYS_MS);
        batch.update(requestRef, { 
            status: 'Referred - Awaiting Confirmation',
            referredAt: now,
            autoConfirmAt: autoConfirmAt,
        });
        batch.set(activityRef.doc(), {
            referrerId,
            requestId,
            action: 'mark_referred',
            actedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
        revalidatePath('/dashboard', 'page');
        return { success: true, message: 'Marked as Referred.' };
    } catch (error) {
        console.error('Error in markAsReferredWithLimit:', error);
        return { success: false, message: 'An error occurred while updating the request.' };
    }
}
