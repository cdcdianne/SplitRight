import { motion } from 'framer-motion';
import { ArrowRight, Receipt, Users, Calculator, Share2, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Users,
    title: 'Add People',
    description: 'Enter names of everyone splitting the bill',
  },
  {
    icon: Receipt,
    title: 'Scan or Add Items',
    description: 'Take a photo of your receipt or manually enter items. Store name and date are automatically extracted.',
  },
  {
    icon: Calculator,
    title: 'Split Fairly',
    description: 'Assign items to people and split tax & tip proportionally or equally',
  },
  {
    icon: Share2,
    title: 'Share & Pay',
    description: 'Copy text or save an image. Add payment methods like Venmo, PayPal, or bank transfer details.',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen gradient-subtle safe-top safe-bottom">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8">
        <ThemeToggle />
      </div>
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 sm:space-y-8 mb-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto rounded-3xl gradient-primary shadow-glow flex items-center justify-center"
          >
            <Receipt className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="gradient-primary bg-clip-text text-white p-2">Split</span>
              <span className="text-foreground">Right</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Split one receipt quickly and fairly, then share the result
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 justify-center"
          >
            <Button asChild size="xl" className="gap-3">
              <Link to="/split">
                Start a Split
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="gap-3">
              <Link to="/history">
                <History className="w-5 h-5" />
                History
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <p className="text-sm font-medium text-muted-foreground text-center mb-6">
            How it works
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 sm:p-5 lg:p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-shadow"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base sm:text-lg">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-muted-foreground mt-12"
        >
          No accounts • No tracking • Your data stays on your device
        </motion.p>
      </div>
    </div>
  );
};

export default Index;
