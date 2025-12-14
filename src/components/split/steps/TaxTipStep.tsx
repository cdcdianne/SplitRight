import { motion } from 'framer-motion';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateSubtotal, calculateTip, formatCurrency } from '@/lib/calculations';
import { cn } from '@/lib/utils';

const TIP_PRESETS = [0, 10, 15, 18, 20];

export function TaxTipStep() {
  const { data, setTax, setTip, setTaxTipSplitMode, setCurrentStep } = useSplit();

  const subtotal = calculateSubtotal(data.items);
  const tipAmount = calculateTip(subtotal, data.tipType, data.tipValue);
  const total = subtotal + data.tax + tipAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Tax & Tip</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Add any tax or tip to distribute</p>
      </div>

      {/* Subtotal Display */}
      <div className="p-4 sm:p-6 rounded-xl bg-card shadow-soft text-center">
        <p className="text-sm sm:text-base text-muted-foreground">Subtotal</p>
        <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(subtotal, data.currency)}</p>
      </div>

      {/* Tax Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Tax Amount (optional)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {data.currency}
          </span>
          <Input
            type="number"
            value={data.tax || ''}
            onChange={e => setTax(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="pl-10"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Tip Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Tip (optional)</label>
        
        {/* Tip Type Toggle */}
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setTip('percentage', data.tipValue)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              data.tipType === 'percentage'
                ? 'bg-card shadow-soft text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Percentage
          </button>
          <button
            onClick={() => setTip('fixed', data.tipValue)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              data.tipType === 'fixed'
                ? 'bg-card shadow-soft text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Fixed Amount
          </button>
        </div>

        {/* Percentage Presets */}
        {data.tipType === 'percentage' && (
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {TIP_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setTip('percentage', preset)}
                className={cn(
                  'py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all border-2',
                  data.tipValue === preset
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                {preset}%
              </button>
            ))}
          </div>
        )}

        {/* Tip Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {data.tipType === 'percentage' ? '%' : data.currency}
          </span>
          <Input
            type="number"
            value={data.tipValue || ''}
            onChange={e => setTip(data.tipType, parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="pl-10"
            min="0"
            step={data.tipType === 'percentage' ? '1' : '0.01'}
          />
        </div>

        {data.tipType === 'percentage' && data.tipValue > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Tip: {formatCurrency(tipAmount, data.currency)}
          </p>
        )}
      </div>

      {/* Tax/Tip Split Mode */}
      {(data.tax > 0 || data.tipValue > 0) && (
        <div className="space-y-3">
          <label className="text-sm font-medium">How to split tax & tip?</label>
          <div className="flex gap-2 p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setTaxTipSplitMode('proportional')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                data.taxTipSplitMode === 'proportional'
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Proportional
            </button>
            <button
              onClick={() => setTaxTipSplitMode('equal')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                data.taxTipSplitMode === 'equal'
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Equal
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {data.taxTipSplitMode === 'proportional' 
              ? 'Based on what each person ordered' 
              : 'Split evenly among everyone'}
          </p>
        </div>
      )}

      {/* Total Preview */}
      <div className="p-4 sm:p-6 rounded-xl gradient-primary text-primary-foreground text-center">
        <p className="text-sm sm:text-base opacity-90">Total</p>
        <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(total, data.currency)}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('assign')} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setCurrentStep('summary')} className="flex-1">
          View Summary
        </Button>
      </div>
    </motion.div>
  );
}