
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

async function listImages() {
  const querySnapshot = await getDocs(collection(db, 'images'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id}\nNAME: ${data.name}\nURL: ${data.url}\n---`);
  });
}

listImages().catch(console.error);
