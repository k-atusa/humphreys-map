export interface TimeSlot {
  open: string;  // "09:00" 형식
  close: string; // "21:00" 형식
}

export interface BusinessHours {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface BuildingData {
  buildingNumber: string;
  name: string;
  category: string;
  businessHours?: BusinessHours | string; // 하위 호환성을 위해 string도 허용
  contact?: string;
  address?: string;
  latitude: number;
  longitude: number;
  description?: string;
}
