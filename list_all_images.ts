import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listImages() {
  const snapshot = await getDocs(collection(db, 'images'));
  const imgs = snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    type: doc.data().type,
    urlLength: doc.data().url?.length
  }));
  console.log(JSON.stringify(imgs, null, 2));
  process.exit(0);
}

listImages();
