import admin from 'firebase-admin';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminApp: admin.app.App | null = null;

if (serviceAccountString) {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error: any) {
      console.error('Error initializing Firebase Admin SDK:', error.message);
    }
  } else {
    adminApp = admin.app();
  }
} else {
  console.warn('Firebase Admin SDK service account not found in environment variables. Firebase Storage features will be disabled.');
}

const adminAuth = adminApp ? admin.auth() : null;
const adminStorage = adminApp ? admin.storage() : null;

export { adminAuth, adminStorage };
