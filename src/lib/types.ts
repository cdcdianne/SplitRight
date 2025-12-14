export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // Person IDs
}

export interface SplitData {
  people: Person[];
  items: ReceiptItem[];
  tax: number;
  tipType: 'percentage' | 'fixed';
  tipValue: number;
  taxTipSplitMode: 'proportional' | 'equal';
  roundingMode: 'exact' | 'whole' | 'five' | 'ten';
  currency: string;
}

export type SplitStep = 
  | 'people'
  | 'items'
  | 'assign'
  | 'tax-tip'
  | 'rounding'
  | 'summary'
  | 'share';

export const PERSON_COLORS = [
  'hsl(187, 85%, 43%)',   // Primary teal
  'hsl(16, 85%, 60%)',    // Coral
  'hsl(262, 70%, 60%)',   // Purple
  'hsl(152, 60%, 45%)',   // Green
  'hsl(32, 90%, 55%)',    // Orange
  'hsl(340, 75%, 55%)',   // Pink
  'hsl(200, 80%, 50%)',   // Blue
  'hsl(45, 90%, 50%)',    // Yellow
];

export const CURRENCIES = [
  { symbol: '¥', name: 'JPY', label: '¥ (Yen)' },
  { symbol: '$', name: 'USD', label: '$ (Dollar)' },
  { symbol: '€', name: 'EUR', label: '€ (Euro)' },
  { symbol: '£', name: 'GBP', label: '£ (Pound)' },
  { symbol: '₩', name: 'KRW', label: '₩ (Won)' },
  { symbol: '₱', name: 'PHP', label: '₱ (Peso)' },
  { symbol: '฿', name: 'THB', label: '฿ (Baht)' },
];

export interface HistoryEntry {
  id: string;
  timestamp: number;
  data: SplitData;
  total: number;
  peopleCount: number;
  itemsCount: number;
}
