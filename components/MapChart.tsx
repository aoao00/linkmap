import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import * as topojson from 'topojson-client';
import { Province, City, UserProgress, TravelLevel, LEVEL_CONFIG } from '../types';
import { PROVINCE_DATA, getTopoJSONData } from '../services/geoData';
import { ArrowLeft } from 'lucide-react';

interface MapChartProps {
  progress: UserProgress;
  onCityClick: (city: City) => void;
}

const MapChart: React.FC<MapChartProps> = ({ progress, onCityClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [activeProvince, setActiveProvince] = useState<Province | null>(null);
  
  // Initialize ECharts instance
  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      chartInstanceRef.current = chartInstance;
      
      // Handle window resize
      const handleResize = () => {
        chartInstance.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.dispose();
      };
    }
  }, []);
  
  // Prepare data for ECharts
  const prepareMapData = () => {
    // Get province features from TopoJSON with type assertions
    const topoData = getTopoJSONData();
    const geoData = topojson.feature(topoData as any, topoData.objects.province as any);
    
    // Register map with ECharts
    echarts.registerMap('china', geoData as any);
    
    // Prepare province data with progress
    const provinceData = PROVINCE_DATA.map(province => {
      let totalScore = 0;
      let maxScore = province.cities.length * 3;
      
      province.cities.forEach(city => {
        totalScore += (progress[city.id] || 0);
      });
      
      const intensity = Math.max(0.1, totalScore / maxScore);
      // 使用颜色字符串插值
      const color = `rgba(242, 242, 247, ${1 - intensity})`;
      
      return {
        name: province.name,
        value: totalScore,
        itemStyle: {
          areaColor: color,
          borderColor: "#8E8E93",
          borderWidth: 1
        }
      };
    });
    
    return provinceData;
  };
  
  // Render China map
  const renderChinaMap = () => {
    if (!chartInstanceRef.current) return;
    
    const provinceData = prepareMapData();
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}分'
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [104, 36],
        label: {
          show: true,
          fontSize: 10,
          color: '#000'
        },
        emphasis: {
          label: {
            show: true,
            color: '#007AFF',
            fontWeight: 'bold'
          },
          itemStyle: {
            areaColor: 'rgba(0, 122, 255, 0.3)'
          }
        },
        itemStyle: {
          areaColor: '#F2F2F7',
          borderColor: '#8E8E93',
          borderWidth: 1
        }
      },
      series: [
        {
          type: 'map',
          map: 'china',
          data: provinceData,
          geoIndex: 0,
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              color: '#007AFF',
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: 'rgba(0, 122, 255, 0.3)'
            }
          }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          yAxisIndex: 0,
          start: 0,
          end: 100
        }
      ]
    };
    
    chartInstanceRef.current.setOption(option);
    
    // Add province click event
    chartInstanceRef.current.off('click');
    chartInstanceRef.current.on('click', (params: echarts.ECElementEvent) => {
      if (params.name) {
        const province = PROVINCE_DATA.find(p => p.name === params.name);
        if (province) {
          setActiveProvince(province);
        }
      }
    });
  };
  
  // Render province map with cities
  const renderProvinceMap = (province: Province) => {
    if (!chartInstanceRef.current) return;
    
    // Get province features from TopoJSON with type assertions
    const topoData = getTopoJSONData();
    const geoData = topojson.feature(topoData as any, topoData.objects.province as any) as any;
    
    // Find the specific province feature
    const provinceFeature = geoData.features.find((f: any) => f.properties.name === province.name);
    
    if (!provinceFeature) {
      console.error(`Province feature not found: ${province.name}`);
      return;
    }
    
    // Create a simple province map (in a real app, you would have province-level TopoJSON)
    const provinceMapData = {
      type: 'FeatureCollection',
      features: [provinceFeature]
    };
    
    // Register province map
    echarts.registerMap(province.name, provinceMapData as any);
    
    // Prepare city data
    const cityData = province.cities.map(city => {
      const level = progress[city.id] || TravelLevel.Untouched;
      
      return {
        name: city.name,
        value: [city.x, city.y, level],
        city: city
      } as any; // Add type assertion
    });
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}'
      },
      geo: {
        map: province.name,
        roam: true,
        zoom: 1.5,
        center: [province.x, province.y],
        label: {
          show: true,
          fontSize: 12,
          color: '#000'
        },
        itemStyle: {
          areaColor: '#F2F2F7',
          borderColor: '#007AFF',
          borderWidth: 2
        }
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: cityData,
          symbolSize: 15,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            formatter: '{b}'
          },
          itemStyle: {
            color: (params: any) => {
              const level = params.data.value[2];
              return LEVEL_CONFIG[level].color;
            },
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              // symbolSize is controlled by the series symbolSize, not emphasis
            },
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            }
          }
        }
      ]
    };
    
    chartInstanceRef.current.setOption(option);
    
    // Add city click event
    chartInstanceRef.current.off('click');
    chartInstanceRef.current.on('click', (params: echarts.ECElementEvent) => {
      const data = params.data as any;
      if (data?.city) {
        onCityClick(data.city as City);
      }
    });
  };
  
  // Update chart when activeProvince or progress changes
  useEffect(() => {
    if (activeProvince) {
      renderProvinceMap(activeProvince);
    } else {
      renderChinaMap();
    }
  }, [activeProvince, progress]);
  
  const handleBackClick = () => {
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

      {/* ECharts Container */}
      <div 
        ref={chartRef}
        className="w-full h-full"
      ></div>
    </div>
  );
};

export default MapChart;