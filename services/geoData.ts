import { Province, City } from '../types';
import * as topojson from 'topojson-client';
import fullJson from '../source/data/full.json';
import { PROVINCE_AREAS } from '../source/data/province-config';

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
      
      // Get province center coordinates if available
      const center = provFeature.properties.center || [0, 0];
      const x = center[0];
      const y = center[1];
      const width = 100; // Default width for display purposes
      const height = 100; // Default height for display purposes
      
      // Get real cities for this province using adcode, fallback to empty array if none
      const provinceCities = citiesByProvinceAdcode[provinceAdcode] || [];
      
      // Create cities array with real data
      const cities: City[] = provinceCities.map((cityFeature: any, cIndex: number) => {
        const cityName = cityFeature.properties.name;
        const cityCenter = cityFeature.properties.center || [0, 0];
        
        return {
          id: `city-${cityFeature.properties.adcode || `${provinceName}-${cIndex}`}`,
          name: cityName,
          provinceId: provinceId,
          x: cityCenter[0], // Real longitude
          y: cityCenter[1]  // Real latitude
        };
      });
      
      // Add a virtual city for Taiwan Province if no cities exist
      if (provinceName.includes('台湾') && cities.length === 0) {
        cities.push({
          id: `city-${provinceAdcode || 'taiwan-0'}`,
          name: provinceName,
          provinceId: provinceId,
          x: center[0], // Use province center as city center
          y: center[1]
        });
      }
      
      // Filter out provinces with empty names
      if (provinceName) {
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
      }
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