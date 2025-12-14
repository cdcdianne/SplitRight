import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Trash2, 
  Eye, 
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  Receipt,
  DollarSign,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getHistory, deleteHistoryEntry, clearHistory, saveSplitData } from '@/lib/storage';
import { HistoryEntry } from '@/lib/types';
import { 
  formatCurrency, 
  calculateFinalShares, 
  calculateTotal, 
  calculatePersonSubtotal, 
  calculateTip, 
  generateShareableText 
} from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadHistory = useCallback(() => {
    setLoading(true);
    try {
      const entries = getHistory();
      // Ensure paymentInfo exists for backward compatibility
      const normalizedEntries = entries.map(entry => ({
        ...entry,
        data: {
          ...entry.data,
          paymentInfo: entry.data.paymentInfo || { method: null },
        },
      }));
      setHistory(normalizedEntries);
    } catch (error) {
      toast({
        title: 'Failed to load history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = (id: string) => {
    try {
      deleteHistoryEntry(id);
      setHistory(prev => prev.filter(entry => entry.id !== id));
      toast({
        title: 'Deleted',
        description: 'Split removed from history',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = () => {
    try {
      clearHistory();
      setHistory([]);
      toast({
        title: 'History cleared',
        description: 'All splits removed from history',
      });
    } catch (error) {
      toast({
        title: 'Failed to clear history',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleLoadSplit = (entry: HistoryEntry) => {
    try {
      // Save the history entry data to current split storage
      saveSplitData(entry.data);
      
      toast({
        title: 'Split loaded',
        description: 'Redirecting to split page...',
      });
      
      // Navigate to split page after a short delay
      setTimeout(() => {
        window.location.href = '/split';
      }, 500);
    } catch (error) {
      toast({
        title: 'Failed to load split',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (entry: HistoryEntry) => {
    // Ensure paymentInfo exists for backward compatibility
    if (!entry.data.paymentInfo) {
      entry.data.paymentInfo = { method: null };
    }
    setSelectedEntry(entry);
    setShowDetails(false);
    setCopied(false);
  };

  const handleCopyText = async () => {
    if (!selectedEntry) return;
    
    const text = generateShareableText(selectedEntry.data, showDetails);
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle safe-top safe-bottom flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle safe-top safe-bottom">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-primary bg-clip-text text-white flex items-center gap-3 pl-4">
                  <HistoryIcon className="w-8 h-8" />
                  History
                </h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your past splits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all saved splits. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </div>
          </div>
        </motion.div>

        {/* Note about history limit */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <HistoryIcon className="w-3 h-3 text-primary" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Note:</span> Only the 5 most recent splits are saved in history. Older entries are automatically removed.
              </p>
            </div>
          </motion.div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto rounded-full gradient-primary/10 flex items-center justify-center mb-6">
              <HistoryIcon className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your completed splits will appear here. Start splitting a receipt to see your history!
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/split">
                <Receipt className="w-5 h-5" />
                Start a Split
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {history.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-medium transition-all duration-200 border-2 hover:border-primary/20 group overflow-hidden">
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg gradient-primary/10 flex items-center justify-center shrink-0">
                              <Receipt className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-bold truncate">
                                {entry.data.storeName || 'Untitled Split'}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(entry.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="font-medium">{entry.peopleCount}</span>
                              <span className="text-muted-foreground text-xs">
                                {entry.peopleCount === 1 ? 'person' : 'people'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                              <Receipt className="w-4 h-4 text-primary" />
                              <span className="font-medium">{entry.itemsCount}</span>
                              <span className="text-muted-foreground text-xs">
                                {entry.itemsCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-bold text-primary">
                                {formatCurrency(entry.total, entry.data.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLoadSplit(entry)}
                          className="flex-1 gap-2"
                        >
                          <Loader2 className="w-4 h-4" />
                          Load Split
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this split?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this split from your history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(entry.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                Split Summary
              </DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-6">
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
                  className="px-6 pt-6 pb-10 rounded-2xl bg-card shadow-medium space-y-4 border-2 border-border"
                >
                  <div className="text-center pb-4 border-b border-border">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-3 shadow-glow">
                      <Receipt className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold gradient-primary bg-clip-text text-white mb-1">
                      SplitRight
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">Receipt Split</p>
                  </div>

                  {/* Store Name and Date/Time */}
                  {(selectedEntry.data.storeName || selectedEntry.data.dateTime) && (
                    <div className="pb-3 border-b border-border space-y-1">
                      {selectedEntry.data.storeName && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{selectedEntry.data.storeName}</p>
                        </div>
                      )}
                      {selectedEntry.data.dateTime && (
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-muted-foreground">{selectedEntry.data.dateTime}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedEntry.data.people.map(person => {
                      const shares = calculateFinalShares(selectedEntry.data);
                      const share = shares.get(person.id) || 0;
                      const subtotal = calculatePersonSubtotal(person.id, selectedEntry.data.items);
                      const personItems = selectedEntry.data.items.filter(i => i.assignedTo.includes(person.id));
                      const itemsSubtotal = selectedEntry.data.items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
                      const tipAmount = calculateTip(itemsSubtotal, selectedEntry.data.tipType, selectedEntry.data.tipValue);
                      const peopleCount = selectedEntry.data.people.length || 1;

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
                              {formatCurrency(share, selectedEntry.data.currency)}
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
                                    <span>{formatCurrency(itemShare, selectedEntry.data.currency)}</span>
                                  </div>
                                );
                              })}
                              {(selectedEntry.data.tax > 0 || selectedEntry.data.tipValue > 0) && (
                                <>
                                  {selectedEntry.data.tax > 0 && (
                                    <div className="flex justify-between text-gray-600 dark:text-muted-foreground">
                                      <span>Tax</span>
                                      <span>
                                        {formatCurrency(
                                          selectedEntry.data.taxTipSplitMode === 'equal' 
                                            ? selectedEntry.data.tax / peopleCount 
                                            : (selectedEntry.data.tax * subtotal) / itemsSubtotal, 
                                          selectedEntry.data.currency
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {selectedEntry.data.tipValue > 0 && (
                                    <div className="flex justify-between text-gray-600 dark:text-muted-foreground">
                                      <span>Tip</span>
                                      <span>
                                        {formatCurrency(
                                          selectedEntry.data.taxTipSplitMode === 'equal'
                                            ? tipAmount / peopleCount
                                            : (tipAmount * subtotal) / itemsSubtotal,
                                          selectedEntry.data.currency
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

                  <div className="pt-4 border-t-2 border-border flex justify-between items-center bg-primary/5 -mx-6 px-6 py-3 rounded-b-2xl">
                    <span className="text-base font-semibold text-gray-700 dark:text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-foreground">
                      {formatCurrency(selectedEntry.total, selectedEntry.data.currency)}
                    </span>
                  </div>

                  {/* Payment Information */}
                  {selectedEntry.data.paymentInfo && selectedEntry.data.paymentInfo.method && (
                    <div className="pt-4 border-t-2 border-border space-y-2 bg-secondary/30 -mx-6 px-6 py-3 rounded-lg">
                      <div className="text-sm font-semibold text-gray-700 dark:text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payment Method
                      </div>
                      <div className="text-sm">
                        {selectedEntry.data.paymentInfo.method === 'bank' && selectedEntry.data.paymentInfo.bankAccountNumber && (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-foreground">Bank Transfer</div>
                            <div className="text-gray-700 dark:text-muted-foreground">Account: {selectedEntry.data.paymentInfo.bankAccountNumber}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'venmo' && selectedEntry.data.paymentInfo.venmoHandle && (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-foreground">Venmo: @{selectedEntry.data.paymentInfo.venmoHandle}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'paypal' && selectedEntry.data.paymentInfo.paypalInfo && (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-foreground">PayPal: {selectedEntry.data.paymentInfo.paypalInfo}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'custom' && selectedEntry.data.paymentInfo.customMethod && (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-foreground">{selectedEntry.data.paymentInfo.customMethod}</div>
                            {selectedEntry.data.paymentInfo.customDetails && (
                              <div className="text-gray-700 dark:text-muted-foreground">{selectedEntry.data.paymentInfo.customDetails}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Share Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant={copied ? "default" : "outline"}
                    onClick={handleCopyText}
                    className="h-12 gap-2"
                    disabled={copied}
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
                    className="h-12 gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Saving...' : 'Save Image'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
