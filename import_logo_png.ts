import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import axios from 'axios';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function importLogo() {
  const dropboxUrl = 'https://www.dropbox.com/scl/fi/y8k4h8f6b2m8p5k9n0k8j/Figur3.png?rlkey=v8p5k9n0k8j1v8p5k9n0k8j&st=3r3i2q6j&dl=1';
  try {
    const response = await axios.get(dropboxUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    const docRef = await addDoc(collection(db, 'images'), {
      name: 'Footer logos.png',
      url: dataUrl,
      type: 'image/png',
      size: response.data.length,
      uploadedAt: serverTimestamp(),
      userId: 'system' // or whatever
    });

    console.log(JSON.stringify({ id: docRef.id, url: dataUrl }));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

importLogo();
