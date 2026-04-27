import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listRecentImages() {
  const q = query(collection(db, 'images'), orderBy('uploadedAt', 'desc'), limit(10));
  const querySnapshot = await getDocs(q);
  
  console.log('Recent 10 images:');
  querySnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Name: ${data.name}, Type: ${data.type}, Size: ${data.url?.length}`);
    if (data.url && data.url.length > 100) {
        console.log(`  Prefix: ${data.url.substring(0, 50)}`);
    }
  });
}

listRecentImages();
