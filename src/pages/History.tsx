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

        {/* History List */}
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-6">
              Your completed splits will appear here
            </p>
            <Button asChild>
              <Link to="/split">Start a Split</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {entry.data.storeName || 'No store name'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 flex-wrap mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {entry.peopleCount} {entry.peopleCount === 1 ? 'person' : 'people'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Receipt className="w-4 h-4" />
                            {entry.itemsCount} {entry.itemsCount === 1 ? 'item' : 'items'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(entry.total, entry.data.currency)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadSplit(entry)}
                        className="flex-1"
                      >
                        <Loader2 className="w-4 h-4 mr-2" />
                        Load Split
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(entry)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
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
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Split Summary</DialogTitle>
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
                  className="px-6 pt-6 pb-10 rounded-2xl bg-card shadow-medium space-y-4"
                >
                  <div className="text-center pb-3 border-b border-border">
                    <h3 className="text-xl font-bold gradient-primary bg-clip-text text-white">
                      SplitRight
                    </h3>
                    <p className="text-sm text-muted-foreground">Receipt Split</p>
                  </div>

                  {/* Store Name and Date/Time */}
                  {(selectedEntry.data.storeName || selectedEntry.data.dateTime) && (
                    <div className="pb-3 border-b border-border space-y-1">
                      {selectedEntry.data.storeName && (
                        <div className="text-center">
                          <p className="text-sm font-semibold">{selectedEntry.data.storeName}</p>
                        </div>
                      )}
                      {selectedEntry.data.dateTime && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">{selectedEntry.data.dateTime}</p>
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
                              <span className="font-medium">{person.name}</span>
                            </div>
                            <span className="text-lg font-bold">
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
                                  <div key={item.id} className="flex justify-between text-muted-foreground">
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
                                    <div className="flex justify-between text-muted-foreground">
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
                                    <div className="flex justify-between text-muted-foreground">
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

                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(selectedEntry.total, selectedEntry.data.currency)}
                    </span>
                  </div>

                  {/* Payment Information */}
                  {selectedEntry.data.paymentInfo && selectedEntry.data.paymentInfo.method && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                      <div className="text-sm">
                        {selectedEntry.data.paymentInfo.method === 'bank' && selectedEntry.data.paymentInfo.bankAccountNumber && (
                          <div>
                            <div className="font-medium">Bank Transfer</div>
                            <div className="text-muted-foreground">Account: {selectedEntry.data.paymentInfo.bankAccountNumber}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'venmo' && selectedEntry.data.paymentInfo.venmoHandle && (
                          <div>
                            <div className="font-medium">Venmo: @{selectedEntry.data.paymentInfo.venmoHandle}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'paypal' && selectedEntry.data.paymentInfo.paypalInfo && (
                          <div>
                            <div className="font-medium">PayPal: {selectedEntry.data.paymentInfo.paypalInfo}</div>
                          </div>
                        )}
                        {selectedEntry.data.paymentInfo.method === 'custom' && selectedEntry.data.paymentInfo.customMethod && (
                          <div>
                            <div className="font-medium">{selectedEntry.data.paymentInfo.customMethod}</div>
                            {selectedEntry.data.paymentInfo.customDetails && (
                              <div className="text-muted-foreground">{selectedEntry.data.paymentInfo.customDetails}</div>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
