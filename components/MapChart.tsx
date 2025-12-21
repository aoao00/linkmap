import React, { useRef, useEffect, useState } from 'react';
import * as echarts from 'echarts';
import * as topojson from 'topojson-client';
import { Province, City, UserProgress, TravelLevel, LEVEL_CONFIG } from '../types';
import { PROVINCE_DATA, getTopoJSONData } from '../services/geoData';
import { ArrowLeft } from 'lucide-react';

// Province full name to abbreviation mapping
const PROVINCE_ABBR: Record<string, string> = {
  "北京市": "京",
  "天津市": "津",
  "河北省": "冀",
  "山西省": "晋",
  "内蒙古自治区": "蒙",
  "辽宁省": "辽",
  "吉林省": "吉",
  "黑龙江省": "黑",
  "上海市": "沪",
  "江苏省": "苏",
  "浙江省": "浙",
  "安徽省": "皖",
  "福建省": "闽",
  "江西省": "赣",
  "山东省": "鲁",
  "河南省": "豫",
  "湖北省": "鄂",
  "湖南省": "湘",
  "广东省": "粤",
  "广西壮族自治区": "桂",
  "海南省": "琼",
  "重庆市": "渝",
  "四川省": "川",
  "贵州省": "贵",
  "云南省": "云",
  "西藏自治区": "藏",
  "陕西省": "陕",
  "甘肃省": "甘",
  "青海省": "青",
  "宁夏回族自治区": "宁",
  "新疆维吾尔自治区": "新",
  "台湾省": "台",
  "香港特别行政区": "港",
  "澳门特别行政区": "澳"
};

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
          color: '#000',
          formatter: (params: any) => {
            // Use province abbreviation instead of full name
            return PROVINCE_ABBR[params.name] || params.name;
          }
        },
        emphasis: {
          label: {
            show: true,
            color: '#007AFF',
            fontWeight: 'bold',
            formatter: (params: any) => {
              return PROVINCE_ABBR[params.name] || params.name;
            }
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
              fontWeight: 'bold',
              formatter: (params: any) => {
                return PROVINCE_ABBR[params.name] || params.name;
              }
            },
            itemStyle: {
              areaColor: 'rgba(0, 122, 255, 0.3)'
            }
          }
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
    
    // Get TopoJSON data with type assertions
    const topoData = getTopoJSONData();
    const geoData = topojson.feature(topoData as any, topoData.objects.province as any) as any;
    
    // Find the specific province feature
    const provinceFeature = geoData.features.find((f: any) => f.properties.name === province.name);
    
    if (!provinceFeature) {
      console.error(`Province feature not found: ${province.name}`);
      return;
    }
    
    // Get province adcode for filtering cities
    const provinceAdcode = provinceFeature.properties.adcode;
    
    // Get and filter city features for this province
    const cityFeatures = (topojson.feature(topoData as any, topoData.objects.city as any) as any).features;
    const provinceCityFeatures = cityFeatures.filter((cityFeature: any) => {
      // Filter cities by province adcode from parent.adcode or acroutes
      const cityProvinceAdcode = cityFeature.properties.parent?.adcode || cityFeature.properties.acroutes?.[1];
      return cityProvinceAdcode === provinceAdcode;
    });
    
    // Create a province map with cities
    const provinceMapData = {
      type: 'FeatureCollection',
      features: [...provinceCityFeatures]
    };
    
    // Register province map with cities
    echarts.registerMap(`${province.name}-cities`, provinceMapData as any);
    
    // Prepare city data for map series
    const cityData = provinceCityFeatures.map((cityFeature: any) => {
      const cityId = `city-${cityFeature.properties.adcode}`;
      const level = progress[cityId] || TravelLevel.Untouched;
      
      return {
        name: cityFeature.properties.name,
        value: level,
        city: {
          id: cityId,
          name: cityFeature.properties.name,
          provinceId: province.id,
          x: cityFeature.properties.center?.[0] || 0,
          y: cityFeature.properties.center?.[1] || 0
        } as City
      };
    });
    
    // Calculate appropriate zoom and center
    const provinceCenter = provinceFeature.properties.centroid || provinceFeature.properties.center || [104, 36];
    
    // Adjust zoom based on province size (larger provinces need smaller zoom)
    let zoom = 3;
    const provinceArea = province.area || 100000;
    if (provinceArea > 500000) zoom = 2;
    if (provinceArea > 1000000) zoom = 1.5;
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}'
      },
      geo: {
        map: `${province.name}-cities`,
        roam: true,
        zoom: zoom,
        center: provinceCenter,
        scaleLimit: {
          min: 1,
          max: 10
        },
        label: {
          show: true,
          fontSize: 10,
          color: '#000',
          position: 'inside',
          formatter: (params: any) => params.name
        },
        emphasis: {
          label: {
            show: true,
            color: '#007AFF',
            fontWeight: 'bold',
            fontSize: 12
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
          map: `${province.name}-cities`,
          geoIndex: 0,
          data: cityData,
          label: {
          show: true,
          fontSize: 10,
          color: '#000',
          position: 'inside',
          formatter: (params: any) => params.name
        },
        emphasis: {
          label: {
            show: true,
            color: '#007AFF',
            fontWeight: 'bold',
            fontSize: 12
          }
        },
        itemStyle: {
          color: (params: any) => {
            const level = params.data?.value || TravelLevel.Untouched;
            return LEVEL_CONFIG[level].color;
          },
          borderColor: '#fff',
            borderWidth: 1
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