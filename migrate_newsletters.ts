import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = JSON.parse(
  await readFile(new URL('./firebase-applet-config.json', import.meta.url), 'utf-8')
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrateNewsletters() {
  const newslettersRef = collection(db, 'newsletters');
  const snapshot = await getDocs(newslettersRef);
  
  console.log(`Fant ${snapshot.size} nyhetsbrev. Sjekker for utdaterte bilde-lenker...`);
  
  for (const nlDoc of snapshot.docs) {
    const nlData = nlDoc.data();
    let data = JSON.parse(JSON.stringify(nlData.data)); // Deep clone
    let changed = false;

    // Helper to update image URL if we have an imageId and it's base64/old
    const updateImage = async (obj: any) => {
      if (obj && typeof obj === 'object') {
        // Check hero image
        if (obj.heroImageId && (obj.heroImage?.startsWith('data:') || !obj.heroImage)) {
          const imgSnap = await getDoc(doc(db, 'images', obj.heroImageId));
          if (imgSnap.exists()) {
            const imgUrl = imgSnap.data().url;
            if (imgUrl && !imgUrl.startsWith('data:')) {
              obj.heroImage = imgUrl;
              changed = true;
              console.log(`Oppdaterte heroImage i "${nlData.name}"`);
            }
          }
        }

        // Check footer logos
        const footerFields = ['footerLogoLeft', 'footerLogoRight', 'footerLogoFull'];
        for (const field of footerFields) {
          const idField = `${field}Id`;
          if (obj[idField] && (obj[field]?.startsWith('data:') || !obj[field])) {
            const imgSnap = await getDoc(doc(db, 'images', obj[idField]));
            if (imgSnap.exists()) {
              const imgUrl = imgSnap.data().url;
              if (imgUrl && !imgUrl.startsWith('data:')) {
                obj[field] = imgUrl;
                changed = true;
                console.log(`Oppdaterte ${field} i "${nlData.name}"`);
              }
            }
          }
        }

        // Check sections
        if (obj.sections && Array.isArray(obj.sections)) {
          for (const section of obj.sections) {
            // Main section image
            if (section.imageId && (section.image?.startsWith('data:') || !section.image)) {
              const imgSnap = await getDoc(doc(db, 'images', section.imageId));
              if (imgSnap.exists()) {
                const imgUrl = imgSnap.data().url;
                if (imgUrl && !imgUrl.startsWith('data:')) {
                  section.image = imgUrl;
                  changed = true;
                  console.log(`Oppdaterte bilde i seksjon "${section.title}" i "${nlData.name}"`);
                }
              }
            }

            // List items
            if (section.items && Array.isArray(section.items)) {
              for (const item of section.items) {
                if (item.imageId && (item.image?.startsWith('data:') || !item.image)) {
                  const imgSnap = await getDoc(doc(db, 'images', item.imageId));
                  if (imgSnap.exists()) {
                    const imgUrl = imgSnap.data().url;
                    if (imgUrl && !imgUrl.startsWith('data:')) {
                      item.image = imgUrl;
                      changed = true;
                      console.log(`Oppdaterte bilde i listepunkt i "${nlData.name}"`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    await updateImage(data);

    if (changed) {
      await updateDoc(doc(db, 'newsletters', nlDoc.id), { data });
      console.log(`Lagret endringer for nyhetsbrev: ${nlData.name}`);
    }
  }
}

migrateNewsletters().catch(console.error);
