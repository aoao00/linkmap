export interface ProvinceConfig {
  name: string;
  abbreviation: string;
  area: number; // in sq km
  zoom: number; // default zoom level for map display
  labelOffset?: [number, number]; // [x, y] offset for label position
  hasLabelLine?: boolean; // whether to show connecting line from label to province
  labelPosition?: string; // label position (top, bottom, left, right, inside, outside)
  // Special label configuration for Hong Kong, Macau, etc.
  specialLabelConfig?: {
    coord: [number, number]; // Custom coordinates for special labels
    offset: [number, number]; // Offset from custom coordinates
    position: 'top' | 'bottom' | 'left' | 'right'; // Label position
  };
}

// All provinces with complete configuration
export const PROVINCES: ProvinceConfig[] = [
  { name: "北京市", abbreviation: "京", area: 16410, zoom: 1 },
  { name: "天津市", abbreviation: "津", area: 11966, zoom: 1 },
  { name: "河北省", abbreviation: "冀", area: 188800, zoom: 1 },
  { name: "山西省", abbreviation: "晋", area: 156300, zoom: 1 },
  { name: "内蒙古自治区", abbreviation: "蒙", area: 1183000, zoom: 1 },
  { name: "辽宁省", abbreviation: "辽", area: 148600, zoom: 1 },
  { name: "吉林省", abbreviation: "吉", area: 187400, zoom: 1 },
  { name: "黑龙江省", abbreviation: "黑", area: 473000, zoom: 1 },
  { name: "上海市", abbreviation: "沪", area: 6340, zoom: 0.8 },
  { name: "江苏省", abbreviation: "苏", area: 107200, zoom: 1 },
  { name: "浙江省", abbreviation: "浙", area: 105500, zoom: 1 },
  { name: "安徽省", abbreviation: "皖", area: 140100, zoom: 1 },
  { name: "福建省", abbreviation: "闽", area: 124000, zoom: 1 },
  { name: "江西省", abbreviation: "赣", area: 166900, zoom: 1 },
  { name: "山东省", abbreviation: "鲁", area: 157900, zoom: 1 },
  { name: "河南省", abbreviation: "豫", area: 167000, zoom: 1 },
  { name: "湖北省", abbreviation: "鄂", area: 185900, zoom: 1 },
  { name: "湖南省", abbreviation: "湘", area: 211800, zoom: 1 },
  { name: "广东省", abbreviation: "粤", area: 179700, zoom: 1 },
  { name: "广西壮族自治区", abbreviation: "桂", area: 237600, zoom: 1 },
  { name: "海南省", abbreviation: "琼", area: 35400, zoom: 1 },
  { name: "重庆市", abbreviation: "渝", area: 82400, zoom: 1 },
  { name: "四川省", abbreviation: "川", area: 486000, zoom: 1 },
  { name: "贵州省", abbreviation: "贵", area: 176100, zoom: 1 },
  { name: "云南省", abbreviation: "云", area: 394000, zoom: 1 },
  { name: "西藏自治区", abbreviation: "藏", area: 1228400, zoom: 1 },
  { name: "陕西省", abbreviation: "陕", area: 205600, zoom: 1 },
  { name: "甘肃省", abbreviation: "甘", area: 425800, zoom: 1.2 },
  { name: "青海省", abbreviation: "青", area: 722300, zoom: 1.2 }, // Special case
  { name: "宁夏回族自治区", abbreviation: "宁", area: 66400, zoom: 1 },
  { name: "新疆维吾尔自治区", abbreviation: "新", area: 1664900, zoom: 1 },
  { name: "台湾省", abbreviation: "台", area: 36000, zoom: 1 },
  { name: "香港特别行政区", abbreviation: "港", area: 1113, zoom: 1, specialLabelConfig: { coord: [114.18, 22.30], offset: [1.5, -1.2], position: 'right' } },
  { name: "澳门特别行政区", abbreviation: "澳", area: 32, zoom: 1, specialLabelConfig: { coord: [113.50, 22.15], offset: [-1.5, -0.8], position: 'left' } }
];

// Map for quick lookup by province name
export const PROVINCE_MAP: Record<string, ProvinceConfig> = {};

// Populate the map
PROVINCES.forEach(province => {
  PROVINCE_MAP[province.name] = province;
});

// Backward compatible abbreviation mapping
export const PROVINCE_ABBR: Record<string, string> = {};

// Populate the abbreviation map
PROVINCES.forEach(province => {
  PROVINCE_ABBR[province.name] = province.abbreviation;
});

// Backward compatible area mapping
export const PROVINCE_AREAS: Record<string, number> = {};

// Populate the area map
PROVINCES.forEach(province => {
  PROVINCE_AREAS[province.name] = province.area;
});