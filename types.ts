
export enum AnimalType {
  CHICKEN = '🐔 Gallina',
  GOAT = '🐐 Capra',
  DUCK = '🦆 Anatra',
  RABBIT = '🐰 Coniglio',
  COW = '🐄 Mucca'
}

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  birth: string;
  sex: 'F' | 'M';
  breed?: string;
  color?: string;
  img?: string;
  notes?: string;
}

export interface EggLog {
  [date: string]: number;
}

export interface EventLog {
  id: string;
  type: 'medical' | 'work';
  animalId: string;
  desc: string;
  date: string;
}

export interface StockItem {
  id: string;
  name: string;
  initialQty: number;
  currentQty: number;
  dailyConsumption: number;
  lastRefill: number;
}

export interface DiaryNote {
  id: string;
  date: string;
  text: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  code: number;
  daily: {
    time: string;
    maxTemp: number;
    minTemp: number;
    humidity: number;
    code: number;
  }[];
}
