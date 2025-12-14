import { SplitData, HistoryEntry } from './types';
import { calculateTotal } from './calculations';

const STORAGE_KEY = 'splitright_data';
const HISTORY_KEY = 'splitright_history';

export function saveSplitData(data: SplitData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save split data:', error);
  }
}

export function loadSplitData(): SplitData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SplitData;
    }
  } catch (error) {
    console.error('Failed to load split data:', error);
  }
  return null;
}

export function clearSplitData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear split data:', error);
  }
}

export function getDefaultSplitData(): SplitData {
  return {
    people: [],
    items: [],
    tax: 0,
    tipType: 'percentage',
    tipValue: 0,
    taxTipSplitMode: 'proportional',
    roundingMode: 'exact',
    currency: '¥',
  };
}

// History functions
export function saveToHistory(data: SplitData): string {
  try {
    const history = getHistory();
    const total = calculateTotal(data);
    const entry: HistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      data: { ...data },
      total,
      peopleCount: data.people.length,
      itemsCount: data.items.length,
    };
    
    // Add to beginning of array (most recent first)
    history.unshift(entry);
    
    // Keep only last 50 entries to prevent storage bloat
    const trimmedHistory = history.slice(0, 50);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    return entry.id;
  } catch (error) {
    console.error('Failed to save to history:', error);
    throw error;
  }
}

export function getHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as HistoryEntry[];
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
  return [];
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find(entry => entry.id === id) || null;
}

export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete history entry:', error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
