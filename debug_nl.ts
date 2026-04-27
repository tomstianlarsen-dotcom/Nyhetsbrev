import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFile } from 'fs/promises';

const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf-8')
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const snapshot = await getDocs(collection(db, 'newsletters'));
  snapshot.forEach(doc => {
    const dataString = JSON.stringify(doc.data().data);
    if (dataString.includes('raw.githubusercontent.com')) {
      console.log(`Newsletter ${doc.id} still has old links`);
    } else {
      console.log(`Newsletter ${doc.id} is clean`);
    }
  });
}

check().catch(console.error);
