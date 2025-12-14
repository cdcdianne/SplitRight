import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SplitData, SplitStep, Person, ReceiptItem, PERSON_COLORS, PaymentMethod, PaymentInfo } from '@/lib/types';
import { saveSplitData, loadSplitData, clearSplitData, getDefaultSplitData } from '@/lib/storage';
import { generateId, capitalizeName } from '@/lib/calculations';

interface SplitContextType {
  data: SplitData;
  currentStep: SplitStep;
  visitedSteps: Set<SplitStep>;
  setCurrentStep: (step: SplitStep) => void;
  
  // People actions
  addPerson: (name: string) => void;
  updatePerson: (id: string, name: string) => void;
  removePerson: (id: string) => void;
  
  // Item actions
  addItem: (item: Omit<ReceiptItem, 'id' | 'assignedTo'>) => void;
  addItems: (items: Omit<ReceiptItem, 'id' | 'assignedTo'>[]) => void;
  updateItem: (id: string, updates: Partial<ReceiptItem>) => void;
  removeItem: (id: string) => void;
  
  // Assignment actions
  assignItem: (itemId: string, personIds: string[]) => void;
  assignItems: (itemIds: string[], personIds: string[]) => void;
  
  // Tax & Tip
  setTax: (amount: number) => void;
  setTip: (type: 'percentage' | 'fixed', value: number) => void;
  setTaxTipSplitMode: (mode: 'proportional' | 'equal') => void;
  
  // Rounding
  setRoundingMode: (mode: SplitData['roundingMode']) => void;
  
  // Currency
  setCurrency: (currency: string) => void;
  
  // Payment
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPaymentDetails: (field: keyof PaymentInfo, value: string) => void;
  
  // Receipt metadata
  setStoreName: (name: string) => void;
  setDateTime: (dateTime: string) => void;
  
  // Reset
  resetSplit: () => void;
}

const SplitContext = createContext<SplitContextType | null>(null);

export function SplitProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SplitData>(getDefaultSplitData);
  const [currentStep, setCurrentStep] = useState<SplitStep>('people');
  const [visitedSteps, setVisitedSteps] = useState<Set<SplitStep>>(new Set(['people']));
  const [initialized, setInitialized] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = loadSplitData();
    if (saved) {
      // Ensure paymentInfo exists for backward compatibility
      if (!saved.paymentInfo) {
        saved.paymentInfo = { method: null };
      }
      setData(saved);
    }
    setInitialized(true);
  }, []);

  // Save data on changes
  useEffect(() => {
    if (initialized) {
      saveSplitData(data);
    }
  }, [data, initialized]);

  const addPerson = useCallback((name: string) => {
    setData(prev => {
      const colorIndex = prev.people.length % PERSON_COLORS.length;
      const newPerson: Person = {
        id: generateId(),
        name: capitalizeName(name),
        color: PERSON_COLORS[colorIndex],
      };
      return { ...prev, people: [...prev.people, newPerson] };
    });
  }, []);

  const updatePerson = useCallback((id: string, name: string) => {
    setData(prev => ({
      ...prev,
      people: prev.people.map(p => 
        p.id === id ? { ...p, name: capitalizeName(name) } : p
      ),
    }));
  }, []);

  const removePerson = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== id),
      items: prev.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(pid => pid !== id),
      })),
    }));
  }, []);

  const addItem = useCallback((item: Omit<ReceiptItem, 'id' | 'assignedTo'>) => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { ...item, id: generateId(), assignedTo: [] }],
    }));
  }, []);

  const addItems = useCallback((items: Omit<ReceiptItem, 'id' | 'assignedTo'>[]) => {
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        ...items.map(item => ({ ...item, id: generateId(), assignedTo: [] })),
      ],
    }));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ReceiptItem>) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  }, []);

  const assignItem = useCallback((itemId: string, personIds: string[]) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, assignedTo: personIds } : item
      ),
    }));
  }, []);

  const assignItems = useCallback((itemIds: string[], personIds: string[]) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        itemIds.includes(item.id) ? { ...item, assignedTo: personIds } : item
      ),
    }));
  }, []);

  const setTax = useCallback((amount: number) => {
    setData(prev => ({ ...prev, tax: amount }));
  }, []);

  const setTip = useCallback((type: 'percentage' | 'fixed', value: number) => {
    setData(prev => ({ ...prev, tipType: type, tipValue: value }));
  }, []);

  const setTaxTipSplitMode = useCallback((mode: 'proportional' | 'equal') => {
    setData(prev => ({ ...prev, taxTipSplitMode: mode }));
  }, []);

  const setRoundingMode = useCallback((mode: SplitData['roundingMode']) => {
    setData(prev => ({ ...prev, roundingMode: mode }));
  }, []);

  const setCurrency = useCallback((currency: string) => {
    setData(prev => ({ ...prev, currency }));
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod | null) => {
    setData(prev => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        method,
        // Clear other fields when method changes
        bankAccountNumber: method === 'bank' ? prev.paymentInfo.bankAccountNumber : undefined,
        venmoHandle: method === 'venmo' ? prev.paymentInfo.venmoHandle : undefined,
        paypalInfo: method === 'paypal' ? prev.paymentInfo.paypalInfo : undefined,
        customMethod: method === 'custom' ? prev.paymentInfo.customMethod : undefined,
        customDetails: method === 'custom' ? prev.paymentInfo.customDetails : undefined,
      },
    }));
  }, []);

  const setPaymentDetails = useCallback((field: keyof PaymentInfo, value: string) => {
    setData(prev => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        [field]: value || undefined,
      },
    }));
  }, []);

  const setStoreName = useCallback((name: string) => {
    setData(prev => ({
      ...prev,
      storeName: name.trim() || undefined,
    }));
  }, []);

  const setDateTime = useCallback((dateTime: string) => {
    setData(prev => ({
      ...prev,
      dateTime: dateTime.trim() || undefined,
    }));
  }, []);

  const handleSetCurrentStep = useCallback((step: SplitStep) => {
    setCurrentStep(step);
    setVisitedSteps(prev => new Set([...prev, step]));
  }, []);

  const resetSplit = useCallback(() => {
    clearSplitData();
    setData(getDefaultSplitData());
    setCurrentStep('people');
    setVisitedSteps(new Set(['people']));
  }, []);

  return (
    <SplitContext.Provider
      value={{
        data,
        currentStep,
        visitedSteps,
        setCurrentStep: handleSetCurrentStep,
        addPerson,
        updatePerson,
        removePerson,
        addItem,
        addItems,
        updateItem,
        removeItem,
        assignItem,
        assignItems,
        setTax,
        setTip,
        setTaxTipSplitMode,
        setRoundingMode,
        setCurrency,
        setPaymentMethod,
        setPaymentDetails,
        setStoreName,
        setDateTime,
        resetSplit,
      }}
    >
      {children}
    </SplitContext.Provider>
  );
}

export function useSplit() {
  const context = useContext(SplitContext);
  if (!context) {
    throw new Error('useSplit must be used within a SplitProvider');
  }
  return context;
}
