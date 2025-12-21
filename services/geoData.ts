import { Province, City } from '../types';
import * as topojson from 'topojson-client';
import fullJson from '../source/data/full.json';

/**
 * Approximate area in sq km for calculation purposes.
 */
const PROVINCE_AREAS: Record<string, number> = {
  "新疆维吾尔自治区": 1664900, "西藏自治区": 1228400, "内蒙古自治区": 1183000, "青海省": 722300,
  "四川省": 486000, "黑龙江省": 473000, "甘肃省": 425800, "云南省": 394000,
  "广西壮族自治区": 237600, "湖南省": 211800, "陕西省": 205600, "河北省": 188800,
  "吉林省": 187400, "湖北省": 185900, "广东省": 179700, "贵州省": 176100,
  "江西省": 166900, "河南省": 167000, "山西省": 156300, "山东省": 157900,
  "辽宁省": 148600, "安徽省": 140100, "福建省": 124000, "江苏省": 107200,
  "浙江省": 105500, "重庆市": 82400, "宁夏回族自治区": 66400, "台湾省": 36000,
  "海南省": 35400, "北京市": 16410, "天津市": 11966, "上海市": 6340,
  "香港特别行政区": 1113, "澳门特别行政区": 32
};

/**
 * Parse TopoJSON data and convert to Province[] format
 */
const parseTopoJSONData = (): Province[] => {
  try {
    // Extract features from TopoJSON
    const geoData = fullJson;
    
    // Convert TopoJSON to GeoJSON with type assertions
    const provinceFeatures = (topojson.feature(geoData as any, geoData.objects.province as any) as any).features;
    const cityFeatures = (topojson.feature(geoData as any, geoData.objects.city as any) as any).features;
    
    // Create a map to store cities by province adcode for efficient grouping
    const citiesByProvinceAdcode: Record<string, any[]> = {};
    
    // Group cities by province adcode
    cityFeatures.forEach((cityFeature: any) => {
      // Get province adcode from parent.adcode or acroutes array
      const provinceAdcode = cityFeature.properties.parent?.adcode || (cityFeature.properties.acroutes?.[1] || cityFeature.properties.adcode?.toString().substring(0, 2) + '0000');
      
      if (provinceAdcode) {
        if (!citiesByProvinceAdcode[provinceAdcode]) {
          citiesByProvinceAdcode[provinceAdcode] = [];
        }
        citiesByProvinceAdcode[provinceAdcode].push(cityFeature);
      }
    });
    
    // Create provinces array
    const provinces: Province[] = [];
    
    provinceFeatures.forEach((provFeature: any, index: number) => {
      const provinceName = provFeature.properties.name;
      const provinceAdcode = provFeature.properties.adcode || `${index}0000`; // Get province adcode
      
      // For simplicity, we'll use the province's name as part of the ID
      const provinceId = `prov-${provinceName}`;
      
      // Get real cities for this province using adcode, fallback to empty array if none
      const provinceCities = citiesByProvinceAdcode[provinceAdcode] || [];
      
      // Create cities array with real data
      const cities: City[] = provinceCities.map((cityFeature: any, cIndex: number) => {
        const cityName = cityFeature.properties.name;
        const center = cityFeature.properties.center || [0, 0];
        
        return {
          id: `city-${cityFeature.properties.adcode || `${provinceName}-${cIndex}`}`,
          name: cityName,
          provinceId: provinceId,
          x: center[0], // Real longitude
          y: center[1]  // Real latitude
        };
      });
      
      // Get province center coordinates if available
      const center = provFeature.properties.center || [0, 0];
      const x = center[0];
      const y = center[1];
      const width = 100; // Default width for display purposes
      const height = 100; // Default height for display purposes
      
      provinces.push({
        id: provinceId,
        name: provinceName,
        cities: cities,
        x: x,
        y: y,
        width: width,
        height: height,
        area: PROVINCE_AREAS[provinceName] || 10000 // Fallback area
      });
    });
    
    return provinces;
  } catch (error) {
    console.error('Error parsing TopoJSON data:', error);
    // Return empty array as fallback
    return [];
  }
};

/**
 * Get TopoJSON data for direct use in ECharts
 */
export const getTopoJSONData = () => {
  return fullJson;
};

/**
 * Get province features from TopoJSON
 */
export const getProvinceFeatures = () => {
  try {
    const geoData = fullJson;
    return (topojson.feature(geoData as any, geoData.objects.province as any) as any).features;
  } catch (error) {
    console.error('Error getting province features:', error);
    return [];
  }
};

export const PROVINCE_DATA = parseTopoJSONData();

export const getAllCities = () => {
  return PROVINCE_DATA.flatMap(p => p.cities);
};