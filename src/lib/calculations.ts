import { Person, ReceiptItem, SplitData } from './types';

export function calculateSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateTip(subtotal: number, tipType: 'percentage' | 'fixed', tipValue: number): number {
  if (tipType === 'percentage') {
    return subtotal * (tipValue / 100);
  }
  return tipValue;
}

export function calculateTotal(data: SplitData): number {
  const subtotal = calculateSubtotal(data.items);
  const tip = calculateTip(subtotal, data.tipType, data.tipValue);
  return subtotal + data.tax + tip;
}

export function calculatePersonSubtotal(personId: string, items: ReceiptItem[]): number {
  return items.reduce((sum, item) => {
    if (item.assignedTo.includes(personId)) {
      const shareCount = item.assignedTo.length;
      const itemTotal = item.price * item.quantity;
      return sum + itemTotal / shareCount;
    }
    return sum;
  }, 0);
}

export function calculatePersonShare(
  personId: string,
  data: SplitData
): number {
  const subtotal = calculateSubtotal(data.items);
  if (subtotal === 0) return 0;

  const personSubtotal = calculatePersonSubtotal(personId, data.items);
  const tip = calculateTip(subtotal, data.tipType, data.tipValue);
  
  let taxShare: number;
  let tipShare: number;
  
  if (data.taxTipSplitMode === 'equal') {
    const peopleCount = data.people.length || 1;
    taxShare = data.tax / peopleCount;
    tipShare = tip / peopleCount;
  } else {
    // proportional (default)
    const proportion = personSubtotal / subtotal;
    taxShare = data.tax * proportion;
    tipShare = tip * proportion;
  }

  return personSubtotal + taxShare + tipShare;
}

export function applyRounding(
  amount: number,
  mode: SplitData['roundingMode']
): number {
  switch (mode) {
    case 'whole':
      return Math.round(amount);
    case 'five':
      return Math.round(amount / 5) * 5;
    case 'ten':
      return Math.round(amount / 10) * 10;
    case 'exact':
    default:
      return Math.round(amount * 100) / 100;
  }
}

export function calculateFinalShares(data: SplitData): Map<string, number> {
  const shares = new Map<string, number>();
  const total = calculateTotal(data);
  
  let runningTotal = 0;
  const sortedPeople = [...data.people].sort((a, b) => a.id.localeCompare(b.id));
  
  sortedPeople.forEach((person, index) => {
    const rawShare = calculatePersonShare(person.id, data);
    
    if (index === sortedPeople.length - 1) {
      // Last person gets the remainder to ensure total matches
      const roundedRunningTotal = applyRounding(runningTotal, data.roundingMode);
      const remainder = applyRounding(total - roundedRunningTotal, data.roundingMode);
      shares.set(person.id, remainder > 0 ? remainder : 0);
    } else {
      const roundedShare = applyRounding(rawShare, data.roundingMode);
      shares.set(person.id, roundedShare);
      runningTotal += roundedShare;
    }
  });

  return shares;
}

export function formatCurrency(amount: number, currency: string = '¥'): string {
  if (currency === '¥') {
    return `${currency}${Math.round(amount).toLocaleString()}`;
  }
  return `${currency}${amount.toFixed(2)}`;
}

export function generateShareableText(data: SplitData, showDetails: boolean = false): string {
  const shares = calculateFinalShares(data);
  const total = calculateTotal(data);
  const itemsSubtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
  const tip = calculateTip(itemsSubtotal, data.tipType, data.tipValue);
  const peopleCount = data.people.length || 1;
  const lines: string[] = ['📝 SplitRight Receipt', ''];
  
  // Add store name and date/time if available
  if (data.storeName || data.dateTime) {
    if (data.storeName) {
      lines.push(`Store: ${data.storeName}`);
    }
    if (data.dateTime) {
      lines.push(`Date/Time: ${data.dateTime}`);
    }
    lines.push('');
  }
  
  data.people.forEach(person => {
    const share = shares.get(person.id) || 0;
    lines.push(`${person.name}: ${formatCurrency(share, data.currency)}`);
    
    if (showDetails) {
      const personItems = data.items.filter(i => i.assignedTo.includes(person.id));
      const subtotal = calculatePersonSubtotal(person.id, data.items);
      
      personItems.forEach(item => {
        const splitCount = item.assignedTo.length;
        const itemShare = (item.price * item.quantity) / splitCount;
        const splitText = splitCount > 1 ? ` (÷${splitCount})` : '';
        lines.push(`  • ${item.name}${splitText}: ${formatCurrency(itemShare, data.currency)}`);
      });
      
      if (data.tax > 0) {
        const taxShare = data.taxTipSplitMode === 'equal' 
          ? data.tax / peopleCount 
          : (data.tax * subtotal) / itemsSubtotal;
        lines.push(`  • Tax: ${formatCurrency(taxShare, data.currency)}`);
      }
      if (data.tipValue > 0) {
        const tipShare = data.taxTipSplitMode === 'equal'
          ? tip / peopleCount
          : (tip * subtotal) / itemsSubtotal;
        lines.push(`  • Tip: ${formatCurrency(tipShare, data.currency)}`);
      }
      lines.push('');
    }
  });
  
  if (!showDetails) lines.push('');
  lines.push(`Total: ${formatCurrency(total, data.currency)}`);
  
  // Add payment information if available
  if (data.paymentInfo?.method) {
    lines.push('');
    lines.push('---');
    lines.push('Payment Method:');
    
    switch (data.paymentInfo.method) {
      case 'bank':
        if (data.paymentInfo.bankAccountNumber) {
          lines.push(`Bank Transfer`);
          lines.push(`Account Number: ${data.paymentInfo.bankAccountNumber}`);
        }
        break;
      case 'venmo':
        if (data.paymentInfo.venmoHandle) {
          lines.push(`Venmo: @${data.paymentInfo.venmoHandle}`);
        }
        break;
      case 'paypal':
        if (data.paymentInfo.paypalInfo) {
          lines.push(`PayPal: ${data.paymentInfo.paypalInfo}`);
        }
        break;
      case 'custom':
        if (data.paymentInfo.customMethod) {
          lines.push(`${data.paymentInfo.customMethod}`);
          if (data.paymentInfo.customDetails) {
            lines.push(data.paymentInfo.customDetails);
          }
        }
        break;
    }
    
    lines.push('---');
  }
  
  return lines.join('\n');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function capitalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
