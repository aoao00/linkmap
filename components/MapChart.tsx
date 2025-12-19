import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Province, City, UserProgress, TravelLevel, LEVEL_CONFIG } from '../types';
import { PROVINCE_DATA } from '../services/geoData';
import { ArrowLeft } from 'lucide-react';

interface MapChartProps {
  progress: UserProgress;
  onCityClick: (city: City) => void;
}

const MapChart: React.FC<MapChartProps> = ({ progress, onCityClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const [activeProvince, setActiveProvince] = useState<Province | null>(null);
  const activeProvinceRef = useRef<Province | null>(null);
  
  // Track if we are currently dragging to prevent click events
  const isDragging = useRef(false);

  // Constants for map dimensions
  const WIDTH = 800;
  const HEIGHT = 1000;

  // Sync ref for D3 callbacks
  useEffect(() => {
    activeProvinceRef.current = activeProvince;
  }, [activeProvince]);

  const getProvinceColor = (province: Province) => {
    let totalScore = 0;
    let maxScore = province.cities.length * 3;
    
    province.cities.forEach(city => {
      totalScore += (progress[city.id] || 0);
    });

    if (totalScore === 0) return '#FFFFFF'; 

    const intensity = Math.max(0.1, totalScore / maxScore);
    return d3.interpolateRgb("rgba(242, 242, 247, 1)", "rgba(0, 122, 255, 1)")(intensity);
  };

  const getCityColor = (cityId: string) => {
    const level = progress[cityId] || TravelLevel.Untouched;
    return LEVEL_CONFIG[level].color;
  };

  // Initialize Zoom Behavior
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const content = d3.select(contentRef.current);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8]) // Allow slightly wider zoom range
      .translateExtent([[-400, -400], [WIDTH + 400, HEIGHT + 400]])
      .on("start", () => {
        isDragging.current = false;
      })
      .on("zoom", (event) => {
        isDragging.current = true;
        content.attr("transform", event.transform);
      })
      .on("end", (event) => {
        setTimeout(() => { isDragging.current = false; }, 50);
        
        // "Pinch to Back" Logic
        if (activeProvinceRef.current && event.transform.k < 1.5) {
           setActiveProvince(null);
        }
      });

    svg.call(zoomBehavior);

    if (!activeProvince) {
      // SHIFT MAP DOWN: translate(0, 240) to accommodate the lower stats card
      // This ensures the map is visible below the stats card initially
      const initialTransform = d3.zoomIdentity.translate(80, 320);
      // @ts-ignore
      svg.call(zoomBehavior.transform, initialTransform);
    }
  }, []); 

  // Handle Focus / Drill Down Transitions
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    // Re-select logic to apply transform
    const zoomBehavior = d3.zoom().on("zoom", (event) => {
       d3.select(contentRef.current).attr("transform", event.transform);
    });
    
    if (activeProvince) {
      // Zoom to Province
      const p = activeProvince;
      const scale = 3.5; 
      const x = -(p.x + p.width / 2) * scale + WIDTH / 2;
      const y = -(p.y + p.height / 2) * scale + HEIGHT / 2;
      
      const transform = d3.zoomIdentity
        .translate(x, y)
        .scale(scale);

      svg.transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        // @ts-ignore
        .call(zoomBehavior.transform, transform);
    } else {
      // Reset to Global View (with downward shift)
      svg.transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        // @ts-ignore
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(80, 320));
    }
  }, [activeProvince]);

  const handleProvinceClick = (province: Province) => {
    if (isDragging.current) return;
    setActiveProvince(province);
  };

  const handleCityClick = (e: React.MouseEvent, city: City) => {
    e.stopPropagation();
    if (isDragging.current) return;
    onCityClick(city);
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveProvince(null);
  };

  return (
    <div className="relative w-full h-full bg-[#F2F2F7] overflow-hidden">
      {/* Super Large Back Button */}
      <div 
        className={`absolute bottom-32 right-6 z-30 transition-all duration-500 transform ${activeProvince ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <button 
          onClick={handleBackClick}
          className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center text-black active:scale-90 transition-transform border border-gray-100"
          aria-label="Back to national map"
        >
          <ArrowLeft size={36} strokeWidth={3} />
        </button>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full touch-none cursor-move"
      >
        <g ref={contentRef}>
          <g className="map-layer">
            {PROVINCE_DATA.map((province) => {
              const isActive = activeProvince?.id === province.id;
              
              // Hide other provinces completely when one is active
              if (activeProvince && !isActive) return null;

              return (
                <g 
                  key={province.id} 
                  transform={`translate(${province.x}, ${province.y})`}
                  onClick={() => !activeProvince && handleProvinceClick(province)}
                  className={`transition-all duration-300 ${!activeProvince ? 'cursor-pointer hover:opacity-90' : ''}`}
                >
                  {/* Province Shape */}
                  <rect
                    width={province.width}
                    height={province.height}
                    rx={12}
                    fill={getProvinceColor(province)}
                    stroke={isActive ? "#007AFF" : "#8E8E93"}
                    strokeWidth={isActive ? 2 : 1} // Thicker border when active
                    className="transition-all duration-500"
                    style={{
                       filter: isActive ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' : 'none'
                    }}
                  />
                  
                  {/* Province Label (Hide when active to focus on cities) */}
                  {!isActive && (
                    <text
                      x={province.width / 2}
                      y={province.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={16}
                      fill="#000"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {province.name}
                    </text>
                  )}

                  {/* Cities (Only Visible when this province is active) */}
                  {isActive && (
                    <g className="animate-in fade-in duration-700">
                      {province.cities.map((city) => {
                         const cityLevel = progress[city.id] || 0;
                         return (
                          <g 
                            key={city.id} 
                            transform={`translate(${city.x}, ${city.y})`}
                            onClick={(e) => handleCityClick(e, city)}
                            className="cursor-pointer transition-transform active:scale-95"
                          >
                             {/* Touch Area */}
                            <rect x={-20} y={-20} width={64} height={64} fill="transparent" />
                            
                            {/* City Marker - Card Style for "Solid" look */}
                            <rect
                              x={-8} y={-8} width={40} height={40} rx={10}
                              fill={cityLevel > 0 ? getCityColor(city.id) : "white"}
                              stroke={cityLevel > 0 ? "white" : "#C7C7CC"}
                              strokeWidth={2}
                              className="shadow-md"
                            />
                            
                            {/* Icon or Status Indicator inside marker */}
                            {cityLevel > 0 && (
                               <circle cx={12} cy={12} r={4} fill="white" fillOpacity={0.5} />
                            )}

                            {/* City Name - Prominent */}
                            <text
                              x={12} y={48}
                              textAnchor="middle"
                              fontSize={8}
                              fill="#000"
                              fontWeight="800"
                              className="select-none"
                              style={{ 
                                textShadow: '0 2px 4px rgba(255,255,255,0.9)',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {city.name}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default MapChart;