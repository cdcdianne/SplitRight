import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { calculateFinalShares, calculateTotal, calculatePersonSubtotal, calculateTip, formatCurrency, generateShareableText } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import { saveToHistory } from '@/lib/storage';

export function ShareStep() {
  const { data, setCurrentStep, resetSplit } = useSplit();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // Save to history when component mounts (user reached share step)
  useEffect(() => {
    if (!savedToHistory && data.people.length > 0 && data.items.length > 0) {
      try {
        saveToHistory(data);
        setSavedToHistory(true);
      } catch (error) {
        console.error('Failed to save to history:', error);
      }
    }
  }, [data, savedToHistory]);

  const shares = calculateFinalShares(data);
  const total = calculateTotal(data);
  const itemsSubtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
  const tipAmount = calculateTip(itemsSubtotal, data.tipType, data.tipValue);
  const peopleCount = data.people.length || 1;

  const handleCopyText = async () => {
    const text = generateShareableText(data, showDetails);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Share text copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `splitright-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: 'Downloaded!', description: 'Image saved to your device' });
    } catch {
      toast({ title: 'Failed to download', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Start a new split? This will clear all data.')) {
      resetSplit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Share</h2>
        <p className="text-muted-foreground">Send to your group</p>
      </div>

      {/* Toggle Details Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full"
      >
        {showDetails ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show Details
          </>
        )}
      </Button>

      {/* Shareable Card */}
      <div
        ref={cardRef}
        className="p-6 rounded-2xl bg-card shadow-medium space-y-4"
      >
        <div className="text-center pb-3 border-b border-border">
          <h3 className="text-xl font-bold gradient-primary bg-clip-text text-white">
            SplitRight
          </h3>
          <p className="text-sm text-muted-foreground">Receipt Split</p>
        </div>

        <div className="space-y-3">
          {data.people.map(person => {
            const share = shares.get(person.id) || 0;
            const subtotal = calculatePersonSubtotal(person.id, data.items);
            const personItems = data.items.filter(i => i.assignedTo.includes(person.id));

            return (
              <div key={person.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: person.color, color: 'white' }}
                    >
                      {person.name[0]}
                    </div>
                    <span className="font-medium">{person.name}</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatCurrency(share, data.currency)}
                  </span>
                </div>

                {/* Item Details */}
                {showDetails && personItems.length > 0 && (
                  <div className="mt-2 ml-11 space-y-1 text-sm">
                    {personItems.map(item => {
                      const splitCount = item.assignedTo.length;
                      const itemShare = (item.price * item.quantity) / splitCount;
                      return (
                        <div key={item.id} className="flex justify-between text-muted-foreground">
                          <span>
                            {item.name}
                            {splitCount > 1 && ` (÷${splitCount})`}
                          </span>
                          <span>{formatCurrency(itemShare, data.currency)}</span>
                        </div>
                      );
                    })}
                    {(data.tax > 0 || data.tipValue > 0) && (
                      <>
                        {data.tax > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Tax</span>
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
                          <div className="flex justify-between text-muted-foreground">
                            <span>Tip</span>
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
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatCurrency(total, data.currency)}</span>
        </div>
      </div>

      {/* Share Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleCopyText}
          className="h-14"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Text
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="h-14"
        >
          <Download className="w-5 h-5" />
          {downloading ? 'Saving...' : 'Save Image'}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('summary')} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleReset}
          variant="destructive"
          className="flex-1"
        >
          <RotateCcw className="w-5 h-5" />
          New Split
        </Button>
      </div>
    </motion.div>
  );
}