import React, { useEffect, useState } from 'react';
import { City, TravelLevel, LEVEL_CONFIG } from '../types';
import { X } from 'lucide-react';

interface ActionSheetProps {
  city: City | null;
  currentLevel: TravelLevel;
  onClose: () => void;
  onSelect: (level: TravelLevel) => void;
}

const ActionSheet: React.FC<ActionSheetProps> = ({ city, currentLevel, onClose, onSelect }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (city) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [city]);

  if (!city) return null;

  const handleSelect = (level: TravelLevel) => {
    onSelect(level);
    // Auto close after brief delay for visual confirmation
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-[2.5rem] shadow-2xl z-50 transform transition-transform duration-300 ease-out safe-pb ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-6" />
        
        <div className="px-8 pb-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold text-black">{city.name}</h3>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xl text-gray-500 font-medium mb-4">你在这座城市的足迹?</p>
            
            <div className="grid grid-cols-1 gap-4">
              {[TravelLevel.Lived, TravelLevel.Visited, TravelLevel.Passed, TravelLevel.Untouched].map((level) => {
                 const config = LEVEL_CONFIG[level as TravelLevel];
                 const isSelected = currentLevel === level;
                 
                 return (
                   <button
                     key={level}
                     onClick={() => handleSelect(level)}
                     className={`
                       relative w-full p-6 rounded-2xl flex items-center justify-between transition-all duration-200
                       ${isSelected ? 'ring-4 ring-offset-2 ring-ios-blue shadow-lg scale-[1.02]' : 'hover:bg-gray-50'}
                     `}
                     style={{ backgroundColor: isSelected ? config.color : '#F9F9F9' }}
                   >
                     <div className="flex flex-col items-start">
                       <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-black'}`}>
                         {config.label}
                       </span>
                     </div>
                     {isSelected && (
                       <div className="bg-white/20 rounded-full p-2">
                         <div className="w-4 h-4 bg-white rounded-full" />
                       </div>
                     )}
                   </button>
                 );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionSheet;