
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

const REQUEST_LIMIT = 15;
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

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

    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - TWENTY_FOUR_HOURS_IN_MS);
    
    const activityRef = db.collection('referral_requests_activity');
    const q = activityRef
        .where('seekerId', '==', userId)
        .where('requestedAt', '>=', twentyFourHoursAgo);
    
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
        if (!existingReqSnapshot.empty) {
            return { success: false, message: `You have already sent a request to this referrer.` };
        }

        // 2. Check the daily limit
        const remainingRequests = await fetchRemainingRequests(seekerId);
        if (remainingRequests <= 0) {
            return { success: false, message: `You have reached your limit of ${REQUEST_LIMIT} requests per 24 hours.` };
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
