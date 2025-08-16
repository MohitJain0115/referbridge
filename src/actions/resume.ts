
'use server';

import { z } from 'zod';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Storage } from '@google-cloud/storage';

const DownloadResumeInputSchema = z.object({
  candidateId: z.string().describe('The ID of the candidate whose resume is being requested.'),
  downloaderId: z.string().describe("The ID of the user downloading the resume."),
});

type DownloadResumeInput = z.infer<typeof DownloadResumeInputSchema>;

const DOWNLOAD_LIMIT = 8;
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

let storage: Storage;
if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    storage = new Storage();
}

export async function downloadResumeWithLimit(input: DownloadResumeInput) {
  const validatedInput = DownloadResumeInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { candidateId, downloaderId } = validatedInput.data;

  if (!db || !storage) {
    return { success: false, message: 'Firestore or Storage is not initialized.' };
  }
  
  try {
    const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - TWENTY_FOUR_HOURS_IN_MS);
    const activityRef = collection(db, 'downloadActivity');
    const q = query(
      activityRef,
      where('downloaderId', '==', downloaderId),
      where('downloadedAt', '>=', twentyFourHoursAgo)
    );
    
    const activitySnapshot = await getDocs(q);
    const downloadCount = activitySnapshot.size;

    if (downloadCount >= DOWNLOAD_LIMIT) {
      return { success: false, message: `You have reached your limit of ${DOWNLOAD_LIMIT} downloads per 24 hours.` };
    }

    const resumeDocRef = doc(db, 'resumes', candidateId);
    const resumeDoc = await getDoc(resumeDocRef);

    if (!resumeDoc.exists() || !resumeDoc.data()?.fileName) {
      return { success: false, message: 'This user has not uploaded a resume.' };
    }
    const resumeData = resumeDoc.data();
    const fileName = resumeData.fileName;
    const filePath = `resumes/${candidateId}/${fileName}`;
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
    
    // Generate a signed URL for the client to download the file directly.
    // This is secure and delegates the download to the client, saving server resources.
    const [signedUrl] = await storage
      .bucket(bucketName)
      .file(filePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        responseDisposition: `attachment; filename="${resumeData.fileName}"`
      });

    await addDoc(activityRef, {
      downloaderId: downloaderId,
      candidateId: candidateId,
      downloadedAt: serverTimestamp(),
    });
    
    return { 
      success: true, 
      message: 'Download authorized.',
      url: signedUrl,
      fileName: resumeData.fileName || `${candidateId}_resume.pdf`
    };

  } catch (error: any) {
    console.error('Error in downloadResumeWithLimit:', error);
    let message = 'An error occurred while processing the download.';
    if (error.code === 404 || error.message.includes('No such object')) {
      message = 'Resume file not found in storage. It may have been deleted.';
    } else if (error.code === 403 || error.message.includes('permission-denied')) {
        message = 'Permission denied. Please check your Firebase Storage security rules.';
    }
    return { success: false, message };
  }
}
