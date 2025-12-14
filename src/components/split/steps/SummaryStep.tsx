import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateFinalShares, calculateTotal, calculatePersonSubtotal, calculateTip, formatCurrency } from '@/lib/calculations';

export function SummaryStep() {
  const { data, setCurrentStep, setStoreName, setDateTime } = useSplit();
  const [isEditing, setIsEditing] = useState(false);

  const shares = calculateFinalShares(data);
  const total = calculateTotal(data);
  const itemsSubtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
  const tipAmount = calculateTip(itemsSubtotal, data.tipType, data.tipValue);
  const peopleCount = data.people.length || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Summary</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Here's what everyone owes</p>
      </div>

      {/* Store Name and Date/Time */}
      <div className="p-4 sm:p-5 rounded-xl bg-card shadow-medium space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Receipt Information</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 text-xs"
          >
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="store-name" className="text-xs">Store Name</Label>
              <Input
                id="store-name"
                value={data.storeName || ''}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter store name"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-time" className="text-xs">Date & Time</Label>
              <Input
                id="date-time"
                value={data.dateTime || ''}
                onChange={(e) => setDateTime(e.target.value)}
                placeholder="e.g., 2024-01-15 14:30 or 01/15/2024 2:30 PM"
                className="h-9 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.storeName && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Store:</span>
                <span className="text-sm font-medium">{data.storeName}</span>
              </div>
            )}
            {data.dateTime && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Date/Time:</span>
                <span className="text-sm font-medium">{data.dateTime}</span>
              </div>
            )}
            {!data.storeName && !data.dateTime && (
              <p className="text-xs text-muted-foreground italic">No receipt information. Click Edit to add.</p>
            )}
          </div>
        )}
      </div>

      {/* Person Summaries */}
      <div className="space-y-4">
        {data.people.map((person, index) => {
          const share = shares.get(person.id) || 0;
          const subtotal = calculatePersonSubtotal(person.id, data.items);
          const personItems = data.items.filter(i => i.assignedTo.includes(person.id));

          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 sm:p-6 rounded-2xl bg-card shadow-medium"
            >
              <div className="flex items-center gap-4 sm:gap-5 mb-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shrink-0"
                  style={{ backgroundColor: person.color, color: 'white' }}
                >
                  {person.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg sm:text-xl truncate">{person.name}</p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {personItems.length} item{personItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: person.color }}>
                    {formatCurrency(share, data.currency)}
                  </p>
                </div>
              </div>

              {/* Item Details (collapsed) */}
              <details className="group">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <span className="text-xs bg-secondary px-2 py-1 rounded">
                    Show details
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {personItems.map(item => {
                    const splitCount = item.assignedTo.length;
                    const itemShare = (item.price * item.quantity) / splitCount;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name}
                          {splitCount > 1 && ` (÷${splitCount})`}
                        </span>
                        <span>{formatCurrency(itemShare, data.currency)}</span>
                      </div>
                    );
                  })}
                  {(data.tax > 0 || data.tipValue > 0) && (
                    <>
                      <div className="border-t border-border pt-2 mt-2"></div>
                      {data.tax > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tax share</span>
                          <span>
                            {formatCurrency(
                              data.taxTipSplitMode === 'equal'
                                ? data.tax / peopleCount
                                : (data.tax * subtotal) / itemsSubtotal,
                              data.currency
                            )}
                          </span>
                        </div>
                      )}
                      {data.tipValue > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tip share</span>
                          <span>
                            {formatCurrency(
                              data.taxTipSplitMode === 'equal'
                                ? tipAmount / peopleCount
                                : (tipAmount * subtotal) / itemsSubtotal,
                              data.currency
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
            </motion.div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="p-4 sm:p-6 rounded-xl gradient-primary text-primary-foreground text-center">
        <p className="text-sm sm:text-base opacity-90">Total</p>
        <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(total, data.currency)}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('tax-tip')} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setCurrentStep('share')} className="flex-1" variant="accent">
          Share Results
        </Button>
      </div>
    </motion.div>
  );
}
