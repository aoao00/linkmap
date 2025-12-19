import React, { useMemo } from 'react';
import { UserProgress, TravelLevel } from '../types';
import { PROVINCE_DATA } from '../services/geoData';
import { Trophy, MapPin, Footprints, Globe2 } from 'lucide-react';

interface StatsCardProps {
  progress: UserProgress;
}

const StatsCard: React.FC<StatsCardProps> = ({ progress }) => {
  const stats = useMemo(() => {
    let visitedCitiesCount = 0;
    let visitedProvincesSet = new Set<string>();
    let totalScore = 0;
    let exploredArea = 0;
    
    // Constants
    const TOTAL_LAND_AREA = 9600000; // approx China land area in sq km
    const TOTAL_CITIES = PROVINCE_DATA.reduce((acc, p) => acc + p.cities.length, 0);

    PROVINCE_DATA.forEach(p => {
      let provinceHitCount = 0;
      
      p.cities.forEach(c => {
        const level = progress[c.id] || TravelLevel.Untouched;
        if (level > 0) {
          visitedCitiesCount++;
          provinceHitCount++;
          visitedProvincesSet.add(p.id);
          
          // Calculate Score
          if (level === TravelLevel.Passed) totalScore += 10;
          if (level === TravelLevel.Visited) totalScore += 30;
          if (level === TravelLevel.Lived) totalScore += 100;
        }
      });

      // Calculate area contribution based on ratio of explored cities in the province
      if (provinceHitCount > 0) {
        const ratio = provinceHitCount / p.cities.length;
        exploredArea += p.area * ratio;
      }
    });

    // Level Calculation
    let level = 1;
    let title = "旅行新手";
    if (totalScore >= 100) { level = 2; title = "初级探索者"; }
    if (totalScore >= 500) { level = 3; title = "进阶旅行家"; }
    if (totalScore >= 1500) { level = 4; title = "资深向导"; }
    if (totalScore >= 3000) { level = 5; title = "华夏通"; }
    if (totalScore >= 5000) { level = 6; title = "传奇行者"; }

    return {
      provCount: visitedProvincesSet.size,
      cityCount: visitedCitiesCount,
      exploredArea: (exploredArea / 10000).toFixed(2), // Convert to Wan Sq Km
      coverage: ((exploredArea / TOTAL_LAND_AREA) * 100).toFixed(1),
      level,
      title
    };
  }, [progress]);

  return (
    <div className="absolute top-32 left-4 right-4 z-20">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-glass rounded-3xl p-4 transition-all duration-300">
        
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4 pl-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ios-blue to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white">
               Lv.{stats.level}
             </div>
             <div className="flex flex-col">
               <h2 className="text-lg font-bold text-black leading-tight tracking-tight">{stats.title}</h2>
               <p className="text-xs text-ios-gray font-medium">继续探索升级</p>
             </div>
          </div>
          {/* Decorative Icon */}
          <div className="bg-yellow-100 p-2 rounded-full opacity-80">
            <Trophy size={18} className="text-yellow-600" />
          </div>
        </div>

        {/* Horizontal Compact Stats Row */}
        <div className="flex justify-between items-stretch bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
          
          {/* Footprints */}
          <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-200">
            <div className="flex items-center gap-1 mb-0.5 text-ios-gray">
              <Footprints size={12} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">足迹</span>
            </div>
            <div className="text-base font-bold text-slate-800">
              {stats.provCount}<span className="text-xs font-medium text-gray-400 ml-0.5">省</span>
              <span className="text-gray-300 mx-1">/</span>
              {stats.cityCount}<span className="text-xs font-medium text-gray-400 ml-0.5">城</span>
            </div>
          </div>

          {/* Area */}
          <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-200 px-2">
             <div className="flex items-center gap-1 mb-0.5 text-ios-gray">
              <MapPin size={12} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">面积</span>
            </div>
             <div className="text-base font-bold text-slate-800 whitespace-nowrap">
              {stats.exploredArea}<span className="text-xs font-medium text-gray-400 ml-0.5">万km²</span>
            </div>
          </div>

           {/* Coverage */}
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 mb-0.5 text-ios-blue">
                <Globe2 size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">覆盖</span>
              </div>
              <div className="text-lg font-black text-ios-blue">
                {stats.coverage}<span className="text-xs">%</span>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default StatsCard;