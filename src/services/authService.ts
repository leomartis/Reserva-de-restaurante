import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { deleteApp, getApp, getApps, initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../firebase';
import type { UserProfile, UserRole } from '../types';

function profileCacheKey(userId: string) {
  return `mesaRapida:userProfile:${userId}`;
}

function cacheProfile(profile: UserProfile) {
  localStorage.setItem(profileCacheKey(profile.id), JSON.stringify(profile));
}

function getCachedProfile(userId: string): UserProfile | null {
  const cached = localStorage.getItem(profileCacheKey(userId));

  if (!cached) {
    return null;
  }

  try {
    const profile = JSON.parse(cached) as UserProfile;
    return profile.id === userId ? profile : null;
  } catch {
    localStorage.removeItem(profileCacheKey(userId));
    return null;
  }
}

function listCachedProfiles() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith('mesaRapida:userProfile:'))
    .map((key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '') as UserProfile;
      } catch {
        return null;
      }
    })
    .filter((profile): profile is UserProfile => Boolean(profile?.id));
}

export async function saveUserProfile(profile: UserProfile) {
  cacheProfile(profile);

  await setDoc(doc(db, 'usuarios', profile.id), {
    name: profile.name,
    email: profile.email,
    role: profile.role,
    createdAt: profile.createdAt ?? serverTimestamp(),
  }, { merge: true });
}

export async function registerUser(name: string, email: string, password: string, role: UserRole) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  const profile: UserProfile = {
    id: credential.user.uid,
    name,
    email,
    role,
  };

  await saveUserProfile(profile);

  return credential.user;
}

export async function createWaiterUser(name: string, email: string, password: string) {
  const secondaryApp = getApps().some((item) => item.name === 'waiter-creator')
    ? getApp('waiter-creator')
    : initializeApp(firebaseConfig, 'waiter-creator');
  const secondaryAuth = getAuth(secondaryApp);
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

  await updateProfile(credential.user, { displayName: name });
  await saveUserProfile({
    id: credential.user.uid,
    name,
    email,
    role: 'garcom',
  });
  await signOut(secondaryAuth);
  await deleteApp(secondaryApp);

  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const cachedProfile = getCachedProfile(userId);
  const snapshot = await Promise.race([
    getDoc(doc(db, 'usuarios', userId)).catch(() => null),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), 2500);
    }),
  ]);

  if (!snapshot) {
    return cachedProfile;
  }

  if (!snapshot.exists()) {
    return cachedProfile;
  }

  const profile = {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile;

  cacheProfile(profile);
  return profile;
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, 'usuarios'));
  const firestoreProfiles = snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    })) as UserProfile[];

  const profilesById = new Map<string, UserProfile>();

  [...firestoreProfiles, ...listCachedProfiles()].forEach((item) => {
    profilesById.set(item.id, item);
  });

  return [...profilesById.values()];
}

export function logoutUser() {
  return signOut(auth);
}
