
'use server';

import { z } from 'zod';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { Storage } from '@google-cloud/storage';

const DownloadResumeInputSchema = z.object({
  candidateId: z.string().describe('The ID of the candidate whose resume is being requested.'),
  downloaderId: z.string().describe("The ID of the user downloading the resume."),
});

type DownloadResumeInput = z.infer<typeof DownloadResumeInputSchema>;

const DOWNLOAD_LIMIT = 8;
const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

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
    // 1. Check the download count for the last 24 hours
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

    // 2. If within limit, fetch the resume document
    const resumeDocRef = doc(db, 'resumes', candidateId);
    const resumeDoc = await getDoc(resumeDocRef);

    if (!resumeDoc.exists() || !resumeDoc.data()?.fileName) {
      return { success: false, message: 'This user has not uploaded a resume.' };
    }
    const resumeData = resumeDoc.data();
    const fileName = resumeData.fileName;
    const filePath = `resumes/${candidateId}/${fileName}`;
    
    // 3. Get a downloadable URL using the Firebase SDK
    const fileRef = ref(storage, filePath);
    const downloadUrl = await getDownloadURL(fileRef);

    // 4. Log the new download before proceeding
    await addDoc(activityRef, {
      downloaderId: downloaderId,
      candidateId: candidateId,
      downloadedAt: serverTimestamp(),
    });
    
    // 5. Fetch the file from the URL and return its content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch resume file from storage.');
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return { 
      success: true, 
      message: 'Download authorized.',
      fileData: `data:${contentType};base64,${base64Data}`,
      fileName: resumeData.fileName || `${candidateId}_resume.pdf`
    };

  } catch (error: any) {
    console.error('Error in downloadResumeWithLimit:', error);
    let message = 'An error occurred while processing the download.';
    if (error.code === 'storage/object-not-found') {
      message = 'Resume file not found in storage. It may have been deleted.';
    } else if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
        message = 'Permission denied. Please check your Firebase Storage security rules.';
    }
    return { success: false, message };
  }
}
