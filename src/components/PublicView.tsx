import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, ensureAuth } from '../lib/firebase';
import { NewsletterData } from '../types';
import { Preview } from './Preview';
import { DEFAULT_DATA, COLORS } from '../constants';

export const PublicView: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        await ensureAuth();
        const docSnap = await getDoc(doc(db, 'newsletters', id));
        if (docSnap.exists()) {
          const docData = docSnap.data();
          let newsletterData = docData.data as NewsletterData;
          
          // Resolve image IDs if Base64 is missing
          const resolveImages = async (data: NewsletterData) => {
            const newData = { ...data };
            
            const fetchImage = async (imageId: string | undefined) => {
              if (!imageId) return null;
              const imgSnap = await getDoc(doc(db, 'images', imageId));
              return imgSnap.exists() ? imgSnap.data().url : null;
            };

            if (newData.heroImageId && !newData.heroImage) {
              newData.heroImage = await fetchImage(newData.heroImageId) || '';
            }
            if (newData.footerLogoLeftId && !newData.footerLogoLeft) {
              newData.footerLogoLeft = await fetchImage(newData.footerLogoLeftId) || '';
            }
            if (newData.footerLogoRightId && !newData.footerLogoRight) {
              newData.footerLogoRight = await fetchImage(newData.footerLogoRightId) || '';
            }
            if (newData.footerLogoFullId && !newData.footerLogoFull) {
              newData.footerLogoFull = await fetchImage(newData.footerLogoFullId) || '';
            }

            newData.sections = await Promise.all(newData.sections.map(async s => {
              const newSec = { ...s };
              if (newSec.imageId && !newSec.image) {
                newSec.image = await fetchImage(newSec.imageId) || '';
              }
              if (newSec.items) {
                newSec.items = await Promise.all(newSec.items.map(async i => {
                  if (i.imageId && !i.image) {
                    return { ...i, image: await fetchImage(i.imageId) || '' };
                  }
                  return i;
                }));
              }
              if (newSec.gridItems) {
                newSec.gridItems = await Promise.all(newSec.gridItems.map(async i => {
                  if (i.imageId && !i.image) {
                    return { ...i, image: await fetchImage(i.imageId) || '' };
                  }
                  return i;
                }));
              }
              return newSec;
            }));

            return newData;
          };

          newsletterData = await resolveImages(newsletterData);
          setData(newsletterData);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fant ikke nyhetsbrevet</h1>
          <p className="text-gray-500">Kanskje lenken er feil eller utkastet er slettet.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen sm:py-12 py-4 flex flex-col items-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="newsletter-web-container rounded-lg overflow-hidden">
        <Preview 
          data={data} 
          previewRef={{ current: null }} 
          onlineUrl={window.location.href}
          hideOnlineLink={true}
          activeSectionId={null}
          setActiveSectionId={() => {}}
        />
      </div>
    </div>
  );
};
