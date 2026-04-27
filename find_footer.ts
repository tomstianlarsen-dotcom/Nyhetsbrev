import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function findFooter() {
  const querySnapshot = await getDocs(collection(db, 'images'));
  console.log('Searching for "Footer" or large files...');
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name.toLowerCase().includes('footer') || (data.url && data.url.length > 50000)) {
        console.log(`ID: ${doc.id}, Name: ${data.name}, Type: ${data.type}, Size: ${data.url?.length}`);
    }
  });
}

findFooter();
