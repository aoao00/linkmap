import { Province, City } from '../types';

/**
 * Approximate area in sq km for calculation purposes.
 */
const PROVINCE_AREAS: Record<string, number> = {
  "新疆": 1664900, "西藏": 1228400, "内蒙古": 1183000, "青海": 722300,
  "四川": 486000, "黑龙江": 473000, "甘肃": 425800, "云南": 394000,
  "广西": 237600, "湖南": 211800, "陕西": 205600, "河北": 188800,
  "吉林": 187400, "湖北": 185900, "广东": 179700, "贵州": 176100,
  "江西": 166900, "河南": 167000, "山西": 156300, "山东": 157900,
  "辽宁": 148600, "安徽": 140100, "福建": 124000, "江苏": 107200,
  "浙江": 105500, "重庆": 82400, "宁夏": 66400, "台湾": 36000,
  "海南": 35400, "北京": 16410, "天津": 11966, "上海": 6340,
  "香港": 1113, "澳门": 32
};

const generateMockData = (): Province[] => {
  const provinceNames = [
    "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
    "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东",
    "河南", "湖北", "湖南", "广东", "广西", "海南",
    "重庆", "四川", "贵州", "云南", "西藏",
    "陕西", "甘肃", "青海", "宁夏", "新疆", "台湾", "香港", "澳门"
  ];

  const provinces: Province[] = [];
  const cols = 6;
  
  provinceNames.forEach((name, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Create cities for each province
    const cities: City[] = Array.from({ length: 6 }).map((_, cIndex) => ({
      id: `city-${index}-${cIndex}`,
      name: `${name}市${cIndex + 1}`,
      provinceId: `prov-${index}`,
      x: (cIndex % 3) * 30 + 20, // Relative inside province
      y: Math.floor(cIndex / 3) * 30 + 20
    }));

    provinces.push({
      id: `prov-${index}`,
      name: name,
      cities: cities,
      x: col * 110, // Schematic Grid Layout
      y: row * 110,
      width: 100,
      height: 100,
      area: PROVINCE_AREAS[name] || 10000 // Fallback area
    });
  });

  return provinces;
};

export const PROVINCE_DATA = generateMockData();

export const getAllCities = () => {
  return PROVINCE_DATA.flatMap(p => p.cities);
};