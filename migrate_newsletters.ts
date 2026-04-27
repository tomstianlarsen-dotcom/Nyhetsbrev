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

    // Helper to update image URL if we have an imageId and it's base64/old OR just a raw.github link
    const updateImage = async (obj: any) => {
      if (obj && typeof obj === 'object') {
        // Check hero image
        if (obj.heroImage?.includes('raw.githubusercontent.com')) {
          obj.heroImage = obj.heroImage.replace('raw.githubusercontent.com', '').split('/').filter(Boolean);
          // https://raw.githubusercontent.com/<owner>/<repo>/main/<path>
          const owner = obj.heroImage[0];
          const repo = obj.heroImage[1];
          const path = obj.heroImage.slice(3).join('/');
          obj.heroImage = `https://${owner}.github.io/${repo}/${path}`;
          changed = true;
          console.log(`Oppdaterte heroImage URL i "${nlData.name}"`);
        } else if (obj.heroImageId && (obj.heroImage?.startsWith('data:') || !obj.heroImage)) {
          const imgSnap = await getDoc(doc(db, 'images', obj.heroImageId));
          if (imgSnap.exists()) {
            const imgUrl = imgSnap.data().url;
            if (imgUrl) {
              obj.heroImage = imgUrl;
              changed = true;
            }
          }
        }

        // Check footer logos
        const footerFields = ['footerLogoLeft', 'footerLogoRight', 'footerLogoFull'];
        for (const field of footerFields) {
          const idField = `${field}Id`;
          if (obj[field]?.includes('raw.githubusercontent.com')) {
             const parts = obj[field].replace('https://raw.githubusercontent.com/', '').split('/');
             const owner = parts[0];
             const repo = parts[1];
             const path = parts.slice(3).join('/');
             obj[field] = `https://${owner}.github.io/${repo}/${path}`;
             changed = true;
             console.log(`Oppdaterte ${field} URL i "${nlData.name}"`);
          } else if (obj[idField] && (obj[field]?.startsWith('data:') || !obj[field])) {
            const imgSnap = await getDoc(doc(db, 'images', obj[idField]));
            if (imgSnap.exists()) {
              const imgUrl = imgSnap.data().url;
              if (imgUrl) {
                obj[field] = imgUrl;
                changed = true;
              }
            }
          }
        }

        // Check sections
        if (obj.sections && Array.isArray(obj.sections)) {
          for (const section of obj.sections) {
            if (section.image?.includes('raw.githubusercontent.com')) {
               const parts = section.image.replace('https://raw.githubusercontent.com/', '').split('/');
               const owner = parts[0];
               const repo = parts[1];
               const path = parts.slice(3).join('/');
               section.image = `https://${owner}.github.io/${repo}/${path}`;
               changed = true;
               console.log(`Oppdaterte bilde URL i seksjon "${section.title}"`);
            } else if (section.imageId && (section.image?.startsWith('data:') || !section.image)) {
              const imgSnap = await getDoc(doc(db, 'images', section.imageId));
              if (imgSnap.exists()) {
                const imgUrl = imgSnap.data().url;
                if (imgUrl) {
                  section.image = imgUrl;
                  changed = true;
                }
              }
            }

            // List items and grid items
            const itemLists = ['items', 'gridItems'];
            for (const listProp of itemLists) {
              if (section[listProp] && Array.isArray(section[listProp])) {
                for (const item of section[listProp]) {
                  if (item.image?.includes('raw.githubusercontent.com')) {
                    const parts = item.image.replace('https://raw.githubusercontent.com/', '').split('/');
                    const owner = parts[0];
                    const repo = parts[1];
                    const path = parts.slice(3).join('/');
                    item.image = `https://${owner}.github.io/${repo}/${path}`;
                    changed = true;
                  } else if (item.imageId && (item.image?.startsWith('data:') || !item.image)) {
                    const imgSnap = await getDoc(doc(db, 'images', item.imageId));
                    if (imgSnap.exists()) {
                      const imgUrl = imgSnap.data().url;
                      if (imgUrl) {
                        item.image = imgUrl;
                        changed = true;
                      }
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
