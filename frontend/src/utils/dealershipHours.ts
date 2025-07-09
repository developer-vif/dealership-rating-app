import { DealershipHours } from '../types/dealership';

export interface CurrentHoursInfo {
  isOpen: boolean;
  todayHours: string;
  nextChange?: string;
}

export const getDealershipHours = (hours: DealershipHours): CurrentHoursInfo => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
  
  const dayMap: { [key: string]: keyof DealershipHours } = {
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday'
  };
  
  const todayKey = dayMap[currentDay];
  const todayHours = hours[todayKey];
  
  if (!todayHours) {
    return {
      isOpen: false,
      todayHours: 'Hours not available'
    };
  }
  
  // Parse today's hours
  const todayInfo = parseHours(todayHours);
  
  if (!todayInfo) {
    return {
      isOpen: false,
      todayHours: 'Closed today'
    };
  }
  
  const isOpen = currentTime >= todayInfo.openTime && currentTime < todayInfo.closeTime;
  
  let nextChange: string | undefined;
  if (isOpen) {
    nextChange = `Closes at ${formatTime(todayInfo.closeTime)}`;
  } else if (currentTime < todayInfo.openTime) {
    nextChange = `Opens at ${formatTime(todayInfo.openTime)}`;
  }
  
  return {
    isOpen,
    todayHours: todayHours,
    ...(nextChange && { nextChange })
  };
};

interface ParsedHours {
  openTime: number; // Minutes since midnight
  closeTime: number; // Minutes since midnight
}

const parseHours = (hoursString: string): ParsedHours | null => {
  if (!hoursString || hoursString.toLowerCase().includes('closed')) {
    return null;
  }
  
  // Match patterns like "9:00 AM - 8:00 PM" or "9:00 AM–8:00 PM"
  const match = hoursString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  
  if (!match) {
    return null;
  }
  
  const [, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = match;
  
  const openTime = parseTime(parseInt(openHour), parseInt(openMin), openPeriod);
  const closeTime = parseTime(parseInt(closeHour), parseInt(closeMin), closePeriod);
  
  return { openTime, closeTime };
};

const parseTime = (hour: number, minute: number, period: string): number => {
  let adjustedHour = hour;
  
  if (period.toUpperCase() === 'PM' && hour !== 12) {
    adjustedHour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    adjustedHour = 0;
  }
  
  return adjustedHour * 60 + minute;
};

const formatTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
};