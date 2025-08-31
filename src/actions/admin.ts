'use server';

import admin from 'firebase-admin';

// Initialize Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Admin init error:', error);
  }
}

export async function getEmailsForUids(uids: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!uids || uids.length === 0) return result;
  const unique = Array.from(new Set(uids)).filter(Boolean);

  // Batch in chunks of 100 per Admin SDK limitation
  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    try {
      const users = await admin.auth().getUsers(chunk.map(uid => ({ uid })));
      for (const u of users.users) {
        if (u.uid) {
          result[u.uid] = u.email || '';
        }
      }
    } catch (e) {
      console.error('getUsers chunk failed:', e);
    }
  }
  return result;
}

export async function getConfirmedReferralsCountByReferrer(uid: string): Promise<number> {
  try {
    const db = admin.firestore();
    const snap = await db
      .collection('referral_requests')
      .where('referrerId', '==', uid)
      .where('status', '==', 'Confirmed Referral')
      .get();
    return snap.size;
  } catch (e) {
    console.error('getConfirmedReferralsCountByReferrer error:', e);
    return 0;
  }
}

export async function getDownloadCountsByUser(uid: string): Promise<number> {
  try {
    const db = admin.firestore();
    const snap = await db
      .collection('downloadActivity')
      .where('downloaderId', '==', uid)
      .get();
    return snap.size;
  } catch (e) {
    console.error('getDownloadCountsByUser error:', e);
    return 0;
  }
}

export async function getProfilesCreatedAtForUids(uids: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (!uids || uids.length === 0) return result;
  try {
    const db = admin.firestore();
    const unique = Array.from(new Set(uids)).filter(Boolean);
    const chunkSize = 300; // conservative
    for (let i = 0; i < unique.length; i += chunkSize) {
      const chunk = unique.slice(i, i + chunkSize);
      const refs = chunk.map((uid) => db.collection('profiles').doc(uid));
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        const id = snap.id;
        const ct = snap.createTime ? snap.createTime.toMillis() : undefined;
        if (ct) result[id] = ct;
      }
    }
  } catch (e) {
    console.error('getProfilesCreatedAtForUids error:', e);
  }
  return result;
}


