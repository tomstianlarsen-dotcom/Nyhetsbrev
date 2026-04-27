import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import fs from 'fs';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function findImage() {
  const q = query(collection(db, 'images'), where('name', '==', 'Footer logos.png'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log('NOT_FOUND');
  } else {
    const data = snapshot.docs[0].data();
    fs.writeFileSync('footer_base64.txt', data.url);
    console.log('SUCCESS');
  }
  process.exit(0);
}

findImage().catch(err => {
  console.error(err);
  process.exit(1);
});
