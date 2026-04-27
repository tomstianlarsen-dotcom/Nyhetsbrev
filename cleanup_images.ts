import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function cleanup() {
  const badIds = [
    'RUaExBZURYJljQHlEg3X' // The HTML error page disguised as PNG
  ];

  for (const id of badIds) {
    try {
      await deleteDoc(doc(db, 'images', id));
      console.log(`Deleted ${id}`);
    } catch (err) {
      console.error(`Error deleting ${id}:`, err.message);
    }
  }
}

cleanup();
