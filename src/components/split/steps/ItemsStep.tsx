import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Trash2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/calculations';
import { extractReceiptItems } from '@/lib/ocr';
import { ReceiptItem, CURRENCIES } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ItemsStep() {
  const { data, addItem, updateItem, removeItem, addItems, clearAllItems, setCurrency, setStoreName, setDateTime, setCurrentStep } = useSplit();
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ status: '', progress: 0 });
  const [draftItems, setDraftItems] = useState<Omit<ReceiptItem, 'id' | 'assignedTo'>[]>([]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    const price = parseFloat(itemPrice);
    const quantity = parseInt(itemQty) || 1;
    
    if (itemName.trim() && price > 0) {
      addItem({ name: itemName.trim(), price, quantity });
      setItemName('');
      setItemPrice('');
      setItemQty('1');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setDraftItems([]);

    try {
      const result = await extractReceiptItems(file, progress => {
        setScanProgress(progress);
      });
      
      if (result.items.length > 0) {
        setDraftItems(result.items.map(({ name, price, quantity }) => ({ name, price, quantity })));
        
        // Auto-detect and set currency if detected
        if (result.detectedCurrency) {
          setCurrency(result.detectedCurrency);
        }
        
        // Auto-detect and set store name if detected
        if (result.storeName) {
          setStoreName(result.storeName);
        }
        
        // Auto-detect and set date/time if detected
        if (result.dateTime) {
          setDateTime(result.dateTime);
        }
      } else {
        setDraftItems([]);
      }
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmDraft = () => {
    addItems(draftItems);
    setDraftItems([]);
  };

  const handleDiscardDraft = () => {
    setDraftItems([]);
  };

  const updateDraftItem = (index: number, field: keyof Omit<ReceiptItem, 'id' | 'assignedTo'>, value: string | number) => {
    setDraftItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeDraftItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = data.items.length > 0;
  const currentCurrency = CURRENCIES.find(c => c.symbol === data.currency) || CURRENCIES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Add receipt items</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Enter items manually or scan a receipt</p>
      </div>

      {/* Currency Selector */}
      <div className="relative">
        <button
          onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-card shadow-soft border border-border hover:border-primary/30 transition-colors"
        >
          <span className="text-sm text-muted-foreground">Currency</span>
          <span className="flex items-center gap-2 font-medium">
            {currentCurrency.label}
            <ChevronDown className={cn("w-4 h-4 transition-transform", showCurrencyPicker && "rotate-180")} />
          </span>
        </button>
        
        <AnimatePresence>
          {showCurrencyPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-full bg-card rounded-xl shadow-medium border border-border overflow-hidden"
            >
              {CURRENCIES.map(currency => (
                <button
                  key={currency.symbol}
                  onClick={() => {
                    setCurrency(currency.symbol);
                    setShowCurrencyPicker(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-secondary transition-colors",
                    data.currency === currency.symbol && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {currency.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scan Receipt */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {scanProgress.status === 'recognizing text' 
                ? `Scanning... ${Math.round(scanProgress.progress * 100)}%`
                : 'Processing...'}
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Scan Receipt Photo
            </>
          )}
        </Button>
      </div>

      {/* Draft Items from OCR */}
      <AnimatePresence>
        {draftItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 rounded-xl bg-accent/10 border-2 border-accent/30"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Review scanned items</p>
                <p className="text-xs text-muted-foreground">
                  OCR may be inaccurate. Please verify and edit before adding.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {draftItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={item.name}
                    onChange={e => updateDraftItem(index, 'name', e.target.value)}
                    className="flex-1 h-10 text-sm"
                    placeholder="Item name"
                  />
                  <Input
                    type="number"
                    value={item.price}
                    onChange={e => updateDraftItem(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-24 h-10 text-sm"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeDraftItem(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmDraft} className="flex-1" variant="accent">
                Add {draftItems.length} Items
              </Button>
              <Button onClick={handleDiscardDraft} variant="outline">
                Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Item name"
            className="flex-1"
          />
          <div className="flex gap-2 sm:gap-3">
            <Input
              type="number"
              value={itemPrice}
              onChange={e => setItemPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Price"
              className="w-24 sm:w-28"
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              value={itemQty}
              onChange={e => setItemQty(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Qty"
              className="w-16 sm:w-20"
              min="1"
            />
            <Button onClick={handleAddItem} disabled={!itemName.trim() || !itemPrice} className="shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-2 sm:space-y-3">
        {data.items.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {data.items.length} {data.items.length === 1 ? 'item' : 'items'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllItems}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {data.items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-card shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-base sm:text-lg">{item.name}</p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {item.quantity > 1 && `${item.quantity} × `}
                  {formatCurrency(item.price, data.currency)}
                </p>
              </div>
              <span className="font-semibold text-base sm:text-lg shrink-0">
                {formatCurrency(item.price * item.quantity, data.currency)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {data.items.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-muted-foreground">
            Add items from your receipt
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('people')} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep('assign')}
          disabled={!canProceed}
          className="flex-1"
        >
          Assign Items
        </Button>
      </div>
    </motion.div>
  );
}