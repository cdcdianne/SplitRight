import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check, RotateCcw, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateFinalShares, calculateTotal, calculatePersonSubtotal, calculateTip, formatCurrency, generateShareableText } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import { saveToHistory, updateMostRecentHistoryEntry } from '@/lib/storage';

export function ShareStep() {
  const { data, setCurrentStep, resetSplit, setPaymentMethod, setPaymentDetails } = useSplit();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [historyEntryId, setHistoryEntryId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const previousPaymentInfoRef = useRef<string>('');

  // Reset savedToHistory flag when data is cleared (new split started)
  useEffect(() => {
    if (data.people.length === 0 && data.items.length === 0) {
      setSavedToHistory(false);
      setHistoryEntryId(null);
      previousPaymentInfoRef.current = '';
    }
  }, [data.people.length, data.items.length]);

  // Save to history when component mounts (user reached share step)
  useEffect(() => {
    if (!savedToHistory && data.people.length > 0 && data.items.length > 0) {
      try {
        const id = saveToHistory(data);
        setHistoryEntryId(id);
        setSavedToHistory(true);
        previousPaymentInfoRef.current = JSON.stringify(data.paymentInfo);
      } catch (error) {
        console.error('Failed to save to history:', error);
      }
    }
  }, [data, savedToHistory]);

  // Update history entry when payment info changes
  useEffect(() => {
    if (savedToHistory && historyEntryId && data.people.length > 0 && data.items.length > 0) {
      const currentPaymentInfo = JSON.stringify(data.paymentInfo);
      if (currentPaymentInfo !== previousPaymentInfoRef.current) {
        try {
          updateMostRecentHistoryEntry(data);
          previousPaymentInfoRef.current = currentPaymentInfo;
        } catch (error) {
          console.error('Failed to update history entry:', error);
        }
      }
    }
  }, [data, savedToHistory, historyEntryId]);

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
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    setSavedToHistory(false);
    resetSplit();
    setShowResetDialog(false);
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
        className="px-6 pt-6 pb-10 rounded-2xl bg-card shadow-medium space-y-4"
      >
        <div className="text-center pb-3 border-b border-border">
          <h3 className="text-xl font-bold gradient-primary bg-clip-text text-white">
            SplitRight
          </h3>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">Receipt Split</p>
        </div>

        {/* Store Name and Date/Time */}
        {(data.storeName || data.dateTime) && (
          <div className="pb-3 border-b border-border space-y-1">
            {data.storeName && (
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{data.storeName}</p>
              </div>
            )}
            {data.dateTime && (
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-muted-foreground">{data.dateTime}</p>
              </div>
            )}
          </div>
        )}

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
                    <span className="font-medium text-gray-900 dark:text-foreground">{person.name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-foreground">
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
                        <div key={item.id} className="flex justify-between text-gray-600 dark:text-muted-foreground">
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
                          <div className="flex justify-between text-gray-600 dark:text-muted-foreground">
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
                          <div className="flex justify-between text-gray-600 dark:text-muted-foreground">
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
          <span className="text-gray-700 dark:text-muted-foreground font-medium">Total</span>
          <span className="text-xl font-bold text-gray-900 dark:text-foreground">{formatCurrency(total, data.currency)}</span>
        </div>

        {/* Payment Information */}
        {data.paymentInfo?.method && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-muted-foreground">Payment Method</div>
            <div className="text-sm">
              {data.paymentInfo.method === 'bank' && data.paymentInfo.bankAccountNumber && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-foreground">Bank Transfer</div>
                  <div className="text-gray-700 dark:text-muted-foreground">Account: {data.paymentInfo.bankAccountNumber}</div>
                </div>
              )}
              {data.paymentInfo.method === 'venmo' && data.paymentInfo.venmoHandle && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-foreground">Venmo: @{data.paymentInfo.venmoHandle}</div>
                </div>
              )}
              {data.paymentInfo.method === 'paypal' && data.paymentInfo.paypalInfo && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-foreground">PayPal: {data.paymentInfo.paypalInfo}</div>
                </div>
              )}
              {data.paymentInfo.method === 'custom' && data.paymentInfo.customMethod && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-foreground">{data.paymentInfo.customMethod}</div>
                  {data.paymentInfo.customDetails && (
                    <div className="text-gray-700 dark:text-muted-foreground">{data.paymentInfo.customDetails}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Payment Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Payment Method</h3>
        </div>
        
        <RadioGroup
          value={data.paymentInfo?.method || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              setPaymentMethod(null);
            } else {
              setPaymentMethod(value as 'bank' | 'venmo' | 'paypal' | 'custom');
            }
          }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="payment-none" />
            <Label htmlFor="payment-none" className="font-normal cursor-pointer">
              No payment method
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bank" id="payment-bank" />
            <Label htmlFor="payment-bank" className="font-normal cursor-pointer">
              Bank Transfer
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="venmo" id="payment-venmo" />
            <Label htmlFor="payment-venmo" className="font-normal cursor-pointer">
              Venmo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paypal" id="payment-paypal" />
            <Label htmlFor="payment-paypal" className="font-normal cursor-pointer">
              PayPal
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="payment-custom" />
            <Label htmlFor="payment-custom" className="font-normal cursor-pointer">
              Custom
            </Label>
          </div>
        </RadioGroup>

        {/* Conditional Input Fields */}
        {data.paymentInfo?.method === 'bank' && (
          <div className="space-y-2">
            <Label htmlFor="bank-account">Account Number</Label>
            <Input
              id="bank-account"
              type="tel"
              placeholder="Enter account number"
              value={data.paymentInfo.bankAccountNumber || ''}
              onChange={(e) => setPaymentDetails('bankAccountNumber', e.target.value)}
            />
          </div>
        )}

        {data.paymentInfo?.method === 'venmo' && (
          <div className="space-y-2">
            <Label htmlFor="venmo-handle">Venmo Handle</Label>
            <Input
              id="venmo-handle"
              type="text"
              placeholder="@username"
              value={data.paymentInfo.venmoHandle || ''}
              onChange={(e) => setPaymentDetails('venmoHandle', e.target.value)}
            />
          </div>
        )}

        {data.paymentInfo?.method === 'paypal' && (
          <div className="space-y-2">
            <Label htmlFor="paypal-info">PayPal Email or Username</Label>
            <Input
              id="paypal-info"
              type="text"
              placeholder="email@example.com or username"
              value={data.paymentInfo.paypalInfo || ''}
              onChange={(e) => setPaymentDetails('paypalInfo', e.target.value)}
            />
          </div>
        )}

        {data.paymentInfo?.method === 'custom' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-method">Method Name</Label>
              <Input
                id="custom-method"
                type="text"
                placeholder="e.g., Cash App, Zelle, etc."
                value={data.paymentInfo.customMethod || ''}
                onChange={(e) => setPaymentDetails('customMethod', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-details">Details</Label>
              <Textarea
                id="custom-details"
                placeholder="Enter payment details (e.g., $cashtag, phone number, etc.)"
                value={data.paymentInfo.customDetails || ''}
                onChange={(e) => setPaymentDetails('customDetails', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
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

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new split?</DialogTitle>
            <DialogDescription>
              Your current split will be saved to history and all data will be cleared. You'll be able to upload a new receipt and add new people.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}