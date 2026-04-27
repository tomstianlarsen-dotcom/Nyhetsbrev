import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listImages() {
  const q = query(collection(db, 'images'), where('name', '==', 'Footer logos.png'));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log('No image found with name "Footer logos.png"');
    // List all just in case naming is slightly off
    const allQ = collection(db, 'images');
    const allSnapshot = await getDocs(allQ);
    console.log('All images in DB:');
    allSnapshot.forEach(doc => {
      console.log(`ID: ${doc.id}, Name: ${doc.data().name}, Type: ${doc.data().type}`);
    });
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log('--- Found Match ---');
    console.log('ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Type:', data.type);
    console.log('URL Length:', data.url?.length);
    console.log('URL Prefix:', data.url?.substring(0, 50));
  });
}

listImages();
