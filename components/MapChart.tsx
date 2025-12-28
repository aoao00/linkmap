import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import * as topojson from 'topojson-client';
import { Province, City, UserProgress, TravelLevel, LEVEL_CONFIG } from '../types';
import { PROVINCE_DATA, getTopoJSONData } from '../services/geoData';
import { ArrowLeft } from 'lucide-react';
import { PROVINCE_ABBR, PROVINCE_MAP, PROVINCES } from '../source/data/province-config';

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
    const topoData = getTopoJSONData();
    const geoData = topojson.feature(topoData as any, topoData.objects.province as any);
    
    echarts.registerMap('china', geoData as any);
    
    const APPLE_BLUE = '17, 110, 251'; 
    const DEFAULT_BG = '#F2F2F7';

    const provinceData = PROVINCE_DATA.map(province => {
      let totalScore = 0;
      const maxScore = province.cities.length * 3;
      
      province.cities.forEach(city => {
        totalScore += (progress[city.id] || 0);
      });
      
      const hasProgress = totalScore > 0;
      let areaColor = DEFAULT_BG;

      if (hasProgress) {
        const intensity = totalScore / maxScore;
        const alpha = 0.2 + (intensity * 0.4);
        areaColor = `rgba(${APPLE_BLUE}, ${alpha})`;
      }
      
      return {
        name: province.name,
        value: totalScore,
        itemStyle: {
          areaColor: areaColor,
          borderColor: hasProgress ? 'rgba(0, 122, 255, 0.4)' : "#D1D1D6",
          borderWidth: 0.8,
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 5,
          shadowOffsetY: 2
        },
        emphasis: {
          itemStyle: {
            areaColor: hasProgress ? `rgba(${APPLE_BLUE}, 0.8)` : 'rgba(0, 122, 255, 0.05)',
            borderColor: 'rgba(0, 122, 255, 0.8)',
            borderWidth: 1.5
          }
        }
      };
    });
    
    return provinceData;
  };
  
  // Render China map
  const renderChinaMap = () => {
    if (!chartInstanceRef.current) return;
    
    const provinceData = prepareMapData();
    
    const markLineData: any[] = [];
    const markPointData: any[] = [];

    // Generate special labels and lines from province config
    PROVINCES.forEach(province => {
      const config = province.specialLabelConfig;
      if (config) {
        const startPoint = config.coord;
        const endPoint = [startPoint[0] + config.offset[0], startPoint[1] + config.offset[1]];
        
        markLineData.push([
          { coord: startPoint },
          { coord: endPoint }
        ]);
        
        markPointData.push({
          name: province.abbreviation,
          coord: endPoint,
          value: province.abbreviation, 
          label: {
            position: config.position
          },
          tooltip: {
              formatter: province.name
          }
        });
      }
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'none'
      },
      series: [
        {
          type: 'map',
          map: 'china',
          roam: true,
          zoom: 1.2,
          scaleLimit: { min: 1, max: 8 },
          animationDurationUpdate: 400,
          animationEasingUpdate: 'cubicOut',
          center: [104, 36],
          label: {
            show: false,
            fontSize: 10,
            color: '#000'
          },
          select: { disabled: true },
          emphasis: { disabled: true },
          itemStyle: {
            borderColor: '#8E8E93',
            borderWidth: 1
          },
          data: provinceData,
          
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: {
              color: '#333',
              type: 'solid',
              width: 1,
              opacity: 0.8
            },
            data: markLineData,
            animation: false 
          },
          
          markPoint: {
            silent: false,
            symbol: 'circle',
            symbolSize: 3,
            cursor: 'pointer',
            itemStyle: { color: '#333' },
            label: {
              show: true,
              color: '#000',
              fontSize: 10,
              formatter: '{b}'
            },
            data: markPointData,
            animation: false
          }
        }
      ]
    };
    
    chartInstanceRef.current.setOption(option);
    
    chartInstanceRef.current.off('click');
    chartInstanceRef.current.on('click', (params: any) => {
      const targetName = params.name;
      if (!targetName) return;

      // --- 核心修改：三沙群岛点击跳转到海南省 ---
      if (targetName.includes('三沙')) {
        const hainanProvince = PROVINCE_DATA.find(p => p.name.includes('海南'));
        if (hainanProvince) {
          setActiveProvince(hainanProvince);
        }
        return;
      }

      // --- 核心修改：如果是台湾省，直接处理为打卡点击，不进入省份地图 ---
      if (targetName.includes('台湾')) {
        const province = PROVINCE_DATA.find(p => p.name.includes('台湾'));
        if (province && province.cities.length > 0) {
          const taiwanCity = province.cities[0];
          onCityClick(taiwanCity);
        }
        return; // 阻止 setActiveProvince，从而不进入下钻视图
      }

      // 其他省份正常进入下钻视图
      const province = PROVINCE_DATA.find(p => 
        p.name === targetName || (p.name.includes(targetName) && targetName.length > 0)
      );

      if (province) {
        setActiveProvince(province);
      }
    });
  };
  
  // Render province map with cities
  const renderProvinceMap = (province: Province) => {
    if (!chartInstanceRef.current) return;
    
    const topoData = getTopoJSONData();
    const geoData = topojson.feature(topoData as any, topoData.objects.province as any) as any;
    
    const provinceFeature = geoData.features.find((f: any) => f.properties.name === province.name);
    
    if (!provinceFeature) {
      console.error(`Province feature not found: ${province.name}`);
      return;
    }
    
    const provinceAdcode = provinceFeature.properties.adcode;
    
    const cityFeatures = (topojson.feature(topoData as any, topoData.objects.city as any) as any).features;
    const provinceCityFeatures = cityFeatures.filter((cityFeature: any) => {
      const cityProvinceAdcode = cityFeature.properties.parent?.adcode || cityFeature.properties.acroutes?.[1];
      return cityProvinceAdcode === provinceAdcode;
    });
    
    const provinceMapData = {
      type: 'FeatureCollection',
      features: [...provinceCityFeatures]
    };
    
    echarts.registerMap(`${province.name}-cities`, provinceMapData as any);
    
    const cityData = provinceCityFeatures.map((cityFeature: any, cIndex: number) => {
      const cityId = `city-${cityFeature.properties.adcode || `${province.name}-${cIndex}`}`;
      const level = progress[cityId] || TravelLevel.Untouched;
      const color = LEVEL_CONFIG[level].color;
      
      return {
        name: cityFeature.properties.name,
        value: level,
        itemStyle: {
          color: color
        },
        city: {
          id: cityId,
          name: cityFeature.properties.name,
          provinceId: province.id,
          x: cityFeature.properties.center?.[0] || 0,
          y: cityFeature.properties.center?.[1] || 0
        } as City
      };
    });
    
    const provinceCenter = provinceFeature.properties.centroid || provinceFeature.properties.center || [104, 36];
    
    // Use configured zoom level from province config
    const zoom = PROVINCE_MAP[province.name]?.zoom || 3;
    
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'none' },
      series: [
        {
          type: 'map',
          map: `${province.name}-cities`,
          roam: true,
          zoom: zoom,
          center: provinceCenter,
          animationDurationUpdate: 400,
          animationEasingUpdate: 'cubicOut',
          scaleLimit: { min: 0.5, max: 10 },
          data: cityData,
          label: {
            show: true,
            fontSize: 10,
            color: '#000',
            position: 'inside',
            formatter: (params: any) => params.name
          },
          emphasis: {},
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          markLine: { data: [] },
          markPoint: { data: [] }
        }
      ]
    };
    
    chartInstanceRef.current.setOption(option);
    
    chartInstanceRef.current.off('click');
    chartInstanceRef.current.on('click', (params: echarts.ECElementEvent) => {
      const data = params.data as any;
      if (data?.city) {
        onCityClick(data.city as City);
      }
    });
  };
  
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

      <div 
        ref={chartRef}
        className="w-full h-full"
      ></div>
    </div>
  );
};

export default MapChart;