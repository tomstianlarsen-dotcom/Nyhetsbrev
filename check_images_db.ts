import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFile } from 'fs/promises';

const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf-8')
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkImages() {
  const snapshot = await getDocs(query(collection(db, 'images'), limit(10)));
  console.log(`Fant ${snapshot.size} bilder.`);
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}, URL: ${doc.data().url}`);
  });
}

checkImages().catch(console.error);
