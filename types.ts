export enum TravelLevel {
  Untouched = 0,
  Passed = 1,
  Visited = 2,
  Lived = 3,
}

export interface City {
  id: string;
  name: string;
  provinceId: string;
  // For map visualization simulation
  x: number;
  y: number;
}

export interface Province {
  id: string;
  name: string;
  cities: City[];
  // For map visualization simulation
  x: number;
  y: number;
  width: number;
  height: number;
  // Real world data
  area: number; // in sq km
}

export interface UserProgress {
  [cityId: string]: TravelLevel;
}

export const LEVEL_CONFIG = {
  [TravelLevel.Untouched]: { color: '#E5E5EA', label: '未涉足', tailwind: 'bg-ios-lightGray', text: 'text-gray-500' },
  [TravelLevel.Passed]: { color: '#5AC8FA', label: '路过', tailwind: 'bg-ios-sky', text: 'text-white' },
  [TravelLevel.Visited]: { color: '#FF9500', label: '游玩', tailwind: 'bg-ios-orange', text: 'text-white' },
  [TravelLevel.Lived]: { color: '#FF3B30', label: '长住', tailwind: 'bg-ios-red', text: 'text-white' },
};