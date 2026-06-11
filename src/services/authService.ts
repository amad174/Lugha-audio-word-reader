import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase/config';
import { AppUser, UserRole } from '../types';
import { generateInviteCode, slugifyId } from '../utils/validation';

/** Sync orgId/role custom claims onto the ID token (helps Storage rules). Best-effort. */
export async function syncAuthClaims(): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const refreshClaims = httpsCallable(functions, 'refreshUserClaims');
    await refreshClaims({});
  } catch (err) {
    console.warn('refreshUserClaims failed', err);
  }
  await auth.currentUser.getIdToken(true);
}

export async function mapFirebaseUser(fbUser: FirebaseUser): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', fbUser.uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? data.email,
    displayName: data.displayName ?? fbUser.displayName ?? '',
    role: data.role as UserRole,
    orgId: data.orgId,
    createdAt: data.createdAt ?? Date.now(),
  };
}

export async function signUpTeacher(
  email: string,
  password: string,
  displayName: string,
  orgName: string
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const orgId = slugifyId();
  const inviteCode = generateInviteCode();
  const now = Date.now();
  const batch = writeBatch(db);

  batch.set(doc(db, 'orgs', orgId), {
    name: orgName.trim(),
    createdBy: cred.user.uid,
    createdAt: now,
    inviteCode,
  });

  batch.set(doc(db, 'users', cred.user.uid), {
    email,
    displayName: displayName.trim(),
    role: 'teacher',
    orgId,
    createdAt: now,
  });

  batch.set(doc(db, 'orgs', orgId, 'members', cred.user.uid), {
    role: 'teacher',
    displayName: displayName.trim(),
    email,
    joinedAt: now,
  });

  batch.set(doc(db, 'inviteCodes', inviteCode), { orgId });

  await batch.commit();

  await syncAuthClaims();

  return {
    uid: cred.user.uid,
    email,
    displayName: displayName.trim(),
    role: 'teacher',
    orgId,
    createdAt: now,
  };
}

export async function signUpStudent(
  email: string,
  password: string,
  displayName: string,
  inviteCode: string
): Promise<AppUser> {
  const code = inviteCode.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(db, 'inviteCodes', code));
  if (!inviteSnap.exists()) {
    throw new Error('Invalid invite code.');
  }
  const orgId = inviteSnap.data().orgId as string;

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await auth.authStateReady();

  const now = Date.now();

  const userBatch = writeBatch(db);
  userBatch.set(doc(db, 'users', cred.user.uid), {
    email,
    displayName: displayName.trim(),
    role: 'student',
    orgId,
    createdAt: now,
  });
  await userBatch.commit();

  const batch = writeBatch(db);

  batch.set(doc(db, 'orgs', orgId, 'members', cred.user.uid), {
    role: 'student',
    displayName: displayName.trim(),
    email,
    joinedAt: now,
  });

  batch.set(doc(db, 'orgs', orgId, 'progress', cred.user.uid), {
    wordsHeard: 0,
    totalPoints: 0,
    level: 1,
    achievements: [],
    heardBoxes: {},
    updatedAt: now,
  });

  await batch.commit();

  await syncAuthClaims();

  return {
    uid: cred.user.uid,
    email,
    displayName: displayName.trim(),
    role: 'student',
    orgId,
    createdAt: now,
  };
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await syncAuthClaims();
  const user = await mapFirebaseUser(cred.user);
  if (!user) throw new Error('User profile not found.');
  return user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getOrganization(orgId: string) {
  const snap = await getDoc(doc(db, 'orgs', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as import('../types').Organization;
}

export async function regenerateInviteCode(orgId: string): Promise<string> {
  const orgRef = doc(db, 'orgs', orgId);
  const orgSnap = await getDoc(orgRef);
  if (!orgSnap.exists()) throw new Error('Organization not found.');

  const oldCode = orgSnap.data().inviteCode as string;
  const newCode = generateInviteCode();
  const batch = writeBatch(db);

  batch.update(orgRef, { inviteCode: newCode });
  batch.delete(doc(db, 'inviteCodes', oldCode));
  batch.set(doc(db, 'inviteCodes', newCode), { orgId });

  await batch.commit();
  return newCode;
}

export async function listOrgStudents(orgId: string) {
  const q = query(
    collection(db, 'orgs', orgId, 'members'),
    where('role', '==', 'student')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() })) as import('../types').OrgMember[];
}

export async function findOrgByInviteCode(code: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'inviteCodes', code.trim().toUpperCase()));
  return snap.exists() ? (snap.data().orgId as string) : null;
}
