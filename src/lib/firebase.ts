import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// Helper to ensure user is "logged in" (anonymously)
export const ensureAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.warn("Anonymous auth failed. This is likely because it's not enabled in Firebase Console:", error);
  }
};

// CRITICAL: Validate Connection to Firestore
export const testConnection = async () => {
  try {
    // Attempt to fetch a non-existent doc from server to verify connection
    await getDocFromServer(doc(db, '_connection_test', 'status'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Firestore Error: The client is offline. Please check your Firebase configuration or network connection.");
    }
  }
};

// Run connection test on boot
testConnection();

export default app;
