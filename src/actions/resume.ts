
// 'use server';

// import { z } from 'zod';
// import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { Storage } from '@google-cloud/storage';

// const DownloadResumeInputSchema = z.object({
//   candidateId: z.string().describe('The ID of the candidate whose resume is being requested.'),
//   downloaderId: z.string().describe("The ID of the user downloading the resume."),
// });

// type DownloadResumeInput = z.infer<typeof DownloadResumeInputSchema>;

// const DOWNLOAD_LIMIT = 8;
// const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

// let storage: Storage;
// // Initialize storage only if the bucket environment variable is set.
// if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
//     try {
//         storage = new Storage();
//     } catch (e) {
//         console.error("Failed to initialize Google Cloud Storage:", e);
//     }
// } else {
//     console.error("Firebase Storage bucket environment variable is not set.");
// }


// export async function downloadResumeWithLimit(input: DownloadResumeInput) {
//   console.log('--- downloadResumeWithLimit action started ---');
//   const validatedInput = DownloadResumeInputSchema.safeParse(input);
//   if (!validatedInput.success) {
//     console.error('Invalid input:', validatedInput.error);
//     return { success: false, message: 'Invalid input.' };
//   }
  
//   const { candidateId, downloaderId } = validatedInput.data;
//   console.log(`Input validated for candidateId: ${candidateId}, downloaderId: ${downloaderId}`);

//   if (!db || !storage) {
//     console.error('Firestore or Storage is not initialized.');
//     return { success: false, message: 'Firestore or Storage is not initialized.' };
//   }
  
//   try {
//     const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - TWENTY_FOUR_HOURS_IN_MS);
//     const activityRef = collection(db, 'downloadActivity');
//     const q = query(
//       activityRef,
//       where('downloaderId', '==', downloaderId),
//       where('downloadedAt', '>=', twentyFourHoursAgo)
//     );
    
//     console.log('Querying download activity...');
//     const activitySnapshot = await getDocs(q);
//     const downloadCount = activitySnapshot.size;
//     console.log(`Found ${downloadCount} downloads in the last 24 hours.`);

//     if (downloadCount >= DOWNLOAD_LIMIT) {
//       console.warn(`Download limit reached for user ${downloaderId}.`);
//       return { success: false, message: `You have reached your limit of ${DOWNLOAD_LIMIT} downloads per 24 hours.` };
//     }
    
//     console.log(`Fetching resume document for candidate: ${candidateId}`);
//     const resumeDocRef = doc(db, 'resumes', candidateId);
//     const resumeDoc = await getDoc(resumeDocRef);
    
//     if (!resumeDoc.exists() || !resumeDoc.data()?.fileName) {
//       console.error(`Resume document not found for candidate: ${candidateId}`);
//       return { success: false, message: 'This user has not uploaded a resume.' };
//     }
    
//     const resumeData = resumeDoc.data();
//     const fileName = resumeData.fileName;
//     const filePath = `resumes/${candidateId}/${fileName}`;
//     const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
//     console.log(`Preparing to generate signed URL for file: gs://${bucketName}/${filePath}`);
    
//     const [signedUrl] = await storage
//       .bucket(bucketName)
//       .file(filePath)
//       .getSignedUrl({
//         action: 'read',
//         expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//         responseDisposition: `attachment; filename="${resumeData.fileName}"`
//       });
      
//     console.log('Successfully generated signed URL.');
    
//     await addDoc(activityRef, {
//       downloaderId: downloaderId,
//       candidateId: candidateId,
//       downloadedAt: serverTimestamp(),
//     });
//     console.log('Download activity logged successfully.');

//     return { 
//       success: true, 
//       message: 'Download authorized.',
//       url: signedUrl,
//       fileName: resumeData.fileName || `${candidateId}_resume.pdf`
//     };

//   } catch (error: any) {
//     console.error('Error in downloadResumeWithLimit:', error);
//     let message = 'An error occurred while processing the download.';
//     if (error.code === 404 || error.message.includes('No such object')) {
//       message = 'Resume file not found in storage. It may have been deleted.';
//     } else if (error.code === 403 || error.message.includes('permission-denied')) {
//         message = 'Permission denied. Please check your Firebase Storage security rules.';
//     }
//     return { success: false, message };
//   }
// }



'use server';

import { z } from 'zod';
import admin from 'firebase-admin';
import 'firebase-admin/firestore';

const DownloadResumeInputSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  downloaderId: z.string().min(1, 'Downloader ID is required'),
  // Source context to differentiate limits between sections
  source: z.enum(['candidates', 'requests', 'recruitment']).optional().default('candidates'),
});

type DownloadResumeInput = z.infer<typeof DownloadResumeInputSchema>;

// Daily limits per source (resets at 8AM IST)
const CANDIDATES_SECTION_LIMIT = 3; // Candidate section
const REQUESTS_SECTION_LIMIT = 6;   // Referral requests section

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

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function downloadResumeWithLimit(input: DownloadResumeInput) {
  console.log('--- downloadResumeWithLimit action started ---');
  
  // Validate input
  const validatedInput = DownloadResumeInputSchema.safeParse(input);
  if (!validatedInput.success) {
    console.error('Invalid input:', validatedInput.error);
    return { 
      success: false, 
      message: 'Invalid input: ' + validatedInput.error.issues.map(i => i.message).join(', ')
    };
  }
  
  const { candidateId, downloaderId, source } = validatedInput.data;
  console.log(`Input validated for candidateId: ${candidateId}, downloaderId: ${downloaderId}`);

  // Use Admin Firestore (bypasses security rules in server environment)
  const adminDb = admin.firestore();
  
  try {
    // Check download limit (resets daily at 8AM IST)
    const lastReset = getLastISTResetTimestamp();
    const downloadLimit = source === 'requests' ? REQUESTS_SECTION_LIMIT : CANDIDATES_SECTION_LIMIT;
    const activityRef = adminDb.collection('downloadActivity');
    const downloadQuery = activityRef
      .where('downloaderId', '==', downloaderId)
      .where('downloadedAt', '>=', lastReset)
      .where('source', '==', source);
    
    if (source !== 'recruitment') {
      console.log('Checking download activity...');
      const activitySnapshot = await downloadQuery.get();
      const downloadCount = activitySnapshot.size;
      console.log(`Found ${downloadCount} downloads in the last 24 hours`);

      if (downloadCount >= downloadLimit) {
        console.warn(`Download limit reached for user ${downloaderId}`);
        return { 
          success: false, 
          message: `You have reached your daily limit of ${downloadLimit} downloads for this section. Limits reset at 8:00 AM IST.` 
        };
      }
    } else {
      console.log('Recruitment source detected: skipping download limit checks.');
    }
    
    // Fetch resume document
    console.log(`Fetching resume document for candidate: ${candidateId}`);
    const resumeDocRef = adminDb.collection('resumes').doc(candidateId);
    const resumeDoc = await resumeDocRef.get();
    
    if (!resumeDoc.exists) {
      console.error(`Resume document not found for candidate: ${candidateId}`);
      return { 
        success: false, 
        message: 'Resume not found. The user may not have uploaded a resume yet.' 
      };
    }

    const resumeData = resumeDoc.data();
    
    if (!resumeData?.fileName) {
      console.error(`Resume fileName is missing for candidate: ${candidateId}`);
      return { 
        success: false, 
        message: 'Resume file information is incomplete.' 
      };
    }
    
    // Generate signed URL using Firebase Admin SDK
    const fileName = resumeData.fileName;
    const filePath = `resumes/${candidateId}/${fileName}`;
    console.log(`Generating signed URL for file: ${filePath}`);
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName || typeof bucketName !== 'string' || bucketName.trim().length === 0) {
      console.error('Storage bucket is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
      return {
        success: false,
        message: 'Resume downloads are not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.'
      };
    }
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.error(`File does not exist: ${filePath}`);
      return { 
        success: false, 
        message: 'Resume file not found in storage.' 
      };
    }
    
    // Generate signed URL (expires in 15 minutes)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      responseDisposition: `attachment; filename="${fileName}"`
    });
    
    console.log('Successfully generated signed URL');
    
    // Log download activity
    await activityRef.add({
      downloaderId: downloaderId,
      candidateId: candidateId,
      fileName: fileName,
      downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: source,
    });
    console.log('Download activity logged successfully');

    return { 
      success: true, 
      message: 'Download authorized successfully',
      url: signedUrl,
      fileName: fileName
    };

  } catch (error: any) {
    console.error('Error in downloadResumeWithLimit:', error);
    
    let message = 'An error occurred while processing your download request.';
    
    // Handle specific errors
    if (error.code === 'storage/object-not-found' || error.code === 404) {
      message = 'Resume file not found. It may have been moved or deleted.';
    } else if (error.code === 'storage/unauthorized' || error.code === 403) {
      message = 'Access denied. Please check your permissions.';
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      message = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('credential') || error.message?.includes('authentication')) {
      message = 'Service authentication error. Please contact support.';
    }
    
    return { success: false, message };
  }
}