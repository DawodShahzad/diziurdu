import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function registerUser(email: string, password: string, username: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  await sendEmailVerification(cred.user);

  await setDoc(doc(db, 'users', cred.user.uid), {
    username,
    email,
    watchlist: [],
    watchHistory: {},
    createdAt: Date.now(),
  });

  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveUserProgress(
  uid: string,
  payload: { watchlist?: string[]; watchHistory?: Record<string, any> }
) {
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export async function loadUserProgress(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}