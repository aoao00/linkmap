import React, { useState } from 'react';
import { PROVINCE_DATA } from '../services/geoData';
import { UserProgress, TravelLevel, LEVEL_CONFIG } from '../types';
import { ChevronDown, ChevronRight, AlertCircle, Trash2, Layers } from 'lucide-react';

interface ListViewProps {
  progress: UserProgress;
  onUpdate: (cityId: string, level: TravelLevel) => void;
  onBatchUpdate: (updates: { [cityId: string]: TravelLevel }) => void;
  onReset: () => void;
}

const ListView: React.FC<ListViewProps> = ({ progress, onUpdate, onBatchUpdate, onReset }) => {
  const [expandedProv, setExpandedProv] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const toggleProv = (id: string) => {
    setExpandedProv(expandedProv === id ? null : id);
  };

  const handleBatchSet = (provId: string, level: TravelLevel) => {
    const province = PROVINCE_DATA.find(p => p.id === provId);
    if (!province) return;

    const updates: { [cityId: string]: TravelLevel } = {};
    province.cities.forEach(city => {
      updates[city.id] = level;
    });
    onBatchUpdate(updates);
  };

  const initiateReset = () => {
    setResetConfirmOpen(true);
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="bg-[#F2F2F7] min-h-screen pb-32 pt-40 px-4 relative">
      <div className="max-w-3xl mx-auto space-y-4">
        {PROVINCE_DATA.map((prov) => {
          const isExpanded = expandedProv === prov.id;
          const activeCities = prov.cities.filter(c => (progress[c.id] || 0) > 0).length;
          
          return (
            <div key={prov.id} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleProv(prov.id)}
                className="w-full flex items-center justify-between p-5 bg-white active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full transition-colors ${activeCities > 0 ? 'bg-ios-blue/10 text-ios-blue' : 'bg-gray-100 text-gray-400'}`}>
                    <span className="font-bold text-lg">{prov.name.substring(0, 1)}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xl font-bold text-black">{prov.name}</span>
                    <span className="text-sm text-ios-gray">点亮 {activeCities}/{prov.cities.length} 城</span>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="text-ios-gray" /> : <ChevronRight className="text-ios-gray" />}
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  
                  {/* Batch Control - Elegant Style */}
                  <div className="p-4 bg-white/90 border-b border-gray-100 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 mb-3 px-1">
                       <Layers size={14} className="text-ios-blue" />
                       <span className="text-xs font-bold text-ios-gray uppercase tracking-wider">全省统一设置</span>
                    </div>
                    {/* Unified Slider Container */}
                    <div className="flex bg-slate-100/80 rounded-xl p-1.5 gap-1.5 ring-1 ring-black/5">
                      {[0, 1, 2, 3].map((lvl) => {
                          const config = LEVEL_CONFIG[lvl as TravelLevel];
                          const isAllActive = prov.cities.every(c => (progress[c.id] || 0) === lvl);

                          return (
                            <button
                              key={lvl}
                              onClick={() => handleBatchSet(prov.id, lvl as TravelLevel)}
                              className={`
                                flex-1 py-3 rounded-[10px] text-sm font-semibold transition-all duration-300 ease-out
                                ${isAllActive 
                                  ? 'shadow-[0_2px_8px_rgba(0,0,0,0.12)] text-white scale-[1.02]' 
                                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-700 active:scale-95'
                                }
                              `}
                              style={{ 
                                backgroundColor: isAllActive ? config.color : 'transparent'
                              }}
                            >
                              {lvl === 0 ? '未涉足' : config.label}
                            </button>
                          );
                      })}
                    </div>
                  </div>

                  {prov.cities.map((city) => {
                    const currentLvl = progress[city.id] || 0;
                    return (
                      <div key={city.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors">
                        <span className="text-lg font-medium text-gray-800 ml-2 tracking-tight">{city.name}</span>
                        
                        {/* City Level Slider - Compact & Elegant */}
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                          {[0, 1, 2, 3].map((lvl) => {
                            const isActive = currentLvl === lvl;
                            const config = LEVEL_CONFIG[lvl as TravelLevel];
                            return (
                              <button
                                key={lvl}
                                onClick={() => onUpdate(city.id, lvl as TravelLevel)}
                                className={`
                                  w-12 h-9 rounded-md text-xs font-bold transition-all duration-200
                                  ${isActive 
                                    ? 'shadow-sm text-white scale-100 ring-1 ring-black/5' 
                                    : 'text-gray-400 hover:bg-white/60 hover:text-gray-600'
                                  }
                                `}
                                style={{ backgroundColor: isActive ? config.color : 'transparent' }}
                              >
                                {lvl === 0 ? '无' : config.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Reset Trigger Button - Always visible at bottom */}
        <div className="mt-12 p-6">
          <button 
            onClick={initiateReset}
            className="w-full bg-white border border-gray-200 text-ios-red font-bold py-4 rounded-2xl text-lg active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Trash2 size={20} />
            重置所有数据
          </button>
        </div>
      </div>

      {/* Centered Modal Overlay */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
             onClick={() => setResetConfirmOpen(false)}
           />
           
           {/* Modal Content */}
           <div className="relative bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-50/50">
                    <AlertCircle size={32} className="text-ios-red" strokeWidth={2.5} />
                 </div>
                 <h3 className="text-xl font-bold text-black mb-3">确定要清空吗？</h3>
                 <p className="text-gray-500 mb-8 text-sm leading-relaxed font-medium">
                   此操作不可恢复，您记录的所有城市足迹数据都将永久丢失。
                 </p>
                 
                 <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setResetConfirmOpen(false)}
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-95 transition-transform hover:bg-gray-200"
                    >
                      取消
                    </button>
                    <button 
                      disabled={countdown > 0}
                      onClick={() => {
                        onReset();
                        setResetConfirmOpen(false);
                      }}
                      className={`flex-1 py-3.5 font-bold rounded-xl text-white transition-all shadow-lg active:scale-95 flex items-center justify-center ${countdown > 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-ios-red shadow-ios-red/30'}`}
                    >
                      {countdown > 0 ? `确认 (${countdown}s)` : '确认清空'}
                    </button>
                 </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ListView;