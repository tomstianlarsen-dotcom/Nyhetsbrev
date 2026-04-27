import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// Load firebase config manually to avoid import issues in script
const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf-8')
);

const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = process.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = process.env.VITE_GITHUB_REPO;
const GITHUB_PATH = process.env.VITE_GITHUB_IMAGES_PATH || 'public/bilder';

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('FEIL: Mangler GitHub-konfigurasjon i .env (VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, VITE_GITHUB_REPO)');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrate() {
  const imagesRef = collection(db, 'images');
  const snapshot = await getDocs(imagesRef);
  
  console.log(`Fant ${snapshot.size} bilder i Firestore. Sjekker etter base64-data...`);
  
  let migratedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Only migrate if it's a data URL
    if (data.url && data.url.startsWith('data:')) {
      console.log(`Migrerer "${data.name}" (${docSnap.id})...`);
      
      try {
        const base64Content = data.url.split(',')[1];
        const filename = `${Date.now()}-${data.name.replace(/\s+/g, '-')}`;
        const path = `${GITHUB_PATH}/${filename}`.replace(/\/+/g, '/');
        
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Migrate image from base64: ${data.name}`,
              content: base64Content,
            }),
          }
        );
        
        if (!response.ok) {
          const err: any = await response.json();
          console.error(`Feilet ved opplasting av ${data.name}:`, err.message);
          continue;
        }
        
        const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${path}`;
        
        await updateDoc(doc(db, 'images', docSnap.id), {
          url: githubUrl,
          githubPath: path,
          migratedFromBase64: true
        });
        
        console.log(`Suksess! "${data.name}" er nå hostet på: ${githubUrl}`);
        migratedCount++;
      } catch (err) {
        console.error(`Feil ved migrering av ${data.name}:`, err);
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`\nMigrering fullført!`);
  console.log(`Migrert: ${migratedCount}`);
  console.log(`Hoppet over (allerede eksterne): ${skippedCount}`);
}

migrate().catch(err => {
  console.error("Uventet feil i migreringsscriptet:", err);
  process.exit(1);
});
