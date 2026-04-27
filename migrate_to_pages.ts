import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFile } from 'fs/promises';

const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf-8')
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrateToGithubPages() {
  const imagesRef = collection(db, 'images');
  const snapshot = await getDocs(imagesRef);
  
  console.log(`Sjekker ${snapshot.size} bilder for migrering til GitHub Pages...`);
  
  for (const imgDoc of snapshot.docs) {
    const data = imgDoc.data();
    const oldUrl = data.url;
    
    if (oldUrl && oldUrl.includes('raw.githubusercontent.com')) {
      // Pattern: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
      const parts = oldUrl.replace('https://raw.githubusercontent.com/', '').split('/');
      const owner = parts[0];
      const repo = parts[1];
      // parts[2] is branch (main)
      const path = parts.slice(3).join('/');
      
      const newUrl = `https://${owner}.github.io/${repo}/${path}`;
      
      await updateDoc(doc(db, 'images', imgDoc.id), {
        url: newUrl
      });
      console.log(`Oppdaterte bilde ${imgDoc.id}: ${newUrl}`);
    }
  }
  
  console.log('Ferdig med bildemigrering. Starter nå oppdatering av nyhetsbrev for å bruke de nye URL-ene...');
}

migrateToGithubPages().catch(console.error);
