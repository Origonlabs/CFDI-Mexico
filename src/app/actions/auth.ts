'use server';

import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    redirect('/dashboard');
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw new Error('Failed to sign in with Google.');
  }
}

export async function signOut() {
    if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  try {
    await firebaseSignOut(auth);
    redirect('/');
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out.');
  }
}
