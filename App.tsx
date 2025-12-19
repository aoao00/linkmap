import React, { useState, useEffect } from 'react';
import { UserProgress, City, TravelLevel } from './types';
import MapChart from './components/MapChart';
import StatsCard from './components/StatsCard';
import ActionSheet from './components/ActionSheet';
import ListView from './components/ListView';
import { Map, List, Share2, Loader2 } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'china_steps_progress_v1';

const App: React.FC = () => {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [progress, setProgress] = useState<UserProgress>({});
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  // Save data helper
  const updateProgress = (cityId: string, level: TravelLevel) => {
    const newProgress = { ...progress, [cityId]: level };
    // Cleanup if 0 to save space
    if (level === 0) {
      delete newProgress[cityId];
    }
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  // Batch update helper
  const batchUpdateProgress = (updates: { [cityId: string]: TravelLevel }) => {
    const newProgress = { ...progress, ...updates };
    
    // Cleanup 0s
    Object.keys(updates).forEach(cityId => {
      if (updates[cityId] === TravelLevel.Untouched) {
        delete newProgress[cityId];
      }
    });

    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const handleReset = () => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Capture the screen
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 2, // Retina quality
        backgroundColor: '#F2F2F7',
        ignoreElements: (element: Element) => {
          // Ignore the share button itself during capture
          return element.classList.contains('screenshot-hide');
        }
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const file = new File([blob], 'ChinaSteps.png', { type: 'image/png' });

        // Try Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My ChinaSteps',
              text: '看看我的中国足迹！'
            });
          } catch (err) {
            console.log('Share cancelled or failed', err);
          }
        } else {
          // Fallback: Download image
          const link = document.createElement('a');
          link.download = 'ChinaSteps-Share.png';
          link.href = canvas.toDataURL();
          link.click();
        }
        setIsSharing(false);
      });
    } catch (e) {
      console.error("Screenshot failed", e);
      setIsSharing(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#F2F2F7] overflow-hidden font-sans text-slate-900">
      
      {/* Header - Sticky & Glassy */}
      <header className="absolute top-0 left-0 right-0 h-24 z-10 flex items-end pb-4 px-6 pointer-events-none">
        <div className="w-full flex justify-between items-end pointer-events-auto">
           <div>
             <h1 className="text-4xl font-extrabold text-black tracking-tight drop-shadow-sm">ChinaSteps</h1>
             <p className="text-ios-gray text-sm font-medium ml-1">记录你的中国足迹</p>
           </div>
           
           {/* View Toggle */}
           <div className="bg-white/80 backdrop-blur-md p-1 rounded-full flex shadow-sm border border-black/5 screenshot-hide">
             <button 
               onClick={() => setView('map')}
               className={`p-3 rounded-full transition-all duration-300 ${view === 'map' ? 'bg-ios-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <Map size={24} />
             </button>
             <button 
               onClick={() => setView('list')}
               className={`p-3 rounded-full transition-all duration-300 ${view === 'list' ? 'bg-ios-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <List size={24} />
             </button>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full h-full pt-0">
        {view === 'map' ? (
          <>
            <StatsCard progress={progress} />
            <MapChart 
              progress={progress} 
              onCityClick={setSelectedCity} 
            />
            
            {/* Share Button - Floating Bottom Right */}
            <div className="absolute bottom-10 right-6 z-40 screenshot-hide">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : (
                  <Share2 size={28} strokeWidth={2.5} className="ml-[-2px]" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="h-full overflow-y-auto no-scrollbar">
             <ListView 
               progress={progress} 
               onUpdate={updateProgress} 
               onBatchUpdate={batchUpdateProgress}
               onReset={handleReset}
             />
          </div>
        )}
      </main>

      {/* Interaction Layers */}
      <ActionSheet 
        city={selectedCity} 
        currentLevel={selectedCity ? (progress[selectedCity.id] || 0) : 0}
        onClose={() => setSelectedCity(null)}
        onSelect={(lvl) => selectedCity && updateProgress(selectedCity.id, lvl)}
      />

    </div>
  );
};

export default App;