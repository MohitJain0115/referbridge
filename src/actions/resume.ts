
'use server';

import { z } from 'zod';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Assuming auth can be used server-side like this
import { headers } from 'next/headers';

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

  if (!db) {
    return { success: false, message: 'Firestore database is not initialized.' };
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

    // 2. If within limit, fetch the resume URL
    const resumeDocRef = doc(db, 'resumes', candidateId);
    const resumeDoc = await getDoc(resumeDocRef);

    if (!resumeDoc.exists() || !resumeDoc.data()?.fileUrl) {
      return { success: false, message: 'This user has not uploaded a resume.' };
    }
    const resumeData = resumeDoc.data();

    // 3. Log the new download
    await addDoc(activityRef, {
      downloaderId: downloaderId,
      candidateId: candidateId,
      downloadedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Download authorized.',
      url: resumeData.fileUrl,
      fileName: resumeData.fileName || `${candidateId}_resume.pdf`
    };

  } catch (error) {
    console.error('Error in downloadResumeWithLimit:', error);
    return { success: false, message: 'An error occurred while processing the download.' };
  }
}
