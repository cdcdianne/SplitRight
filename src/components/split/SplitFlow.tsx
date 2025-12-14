import { AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { useSplit } from '@/context/SplitContext';
import { StepIndicator } from './StepIndicator';
import { PeopleStep } from './steps/PeopleStep';
import { ItemsStep } from './steps/ItemsStep';
import { AssignStep } from './steps/AssignStep';
import { TaxTipStep } from './steps/TaxTipStep';
import { RoundingStep } from './steps/RoundingStep';
import { SummaryStep } from './steps/SummaryStep';
import { ShareStep } from './steps/ShareStep';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SplitFlow() {
  const { currentStep, visitedSteps, setCurrentStep } = useSplit();

  const renderStep = () => {
    switch (currentStep) {
      case 'people':
        return <PeopleStep key="people" />;
      case 'items':
        return <ItemsStep key="items" />;
      case 'assign':
        return <AssignStep key="assign" />;
      case 'tax-tip':
        return <TaxTipStep key="tax-tip" />;
      case 'rounding':
        return <RoundingStep key="rounding" />;
      case 'summary':
        return <SummaryStep key="summary" />;
      case 'share':
        return <ShareStep key="share" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-subtle safe-top safe-bottom">
      {/* Header - Full Width */}
      <div className="w-full text-center py-6 sm:py-8 lg:py-10 relative">
        <div className="absolute right-4 sm:right-6 lg:right-8 flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon">
            <Link to="/history">
              <History className="w-5 h-5" color="white" />
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-primary bg-clip-text text-white">
          SplitRight
        </h1>
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-12">
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <StepIndicator currentStep={currentStep} visitedSteps={visitedSteps} onStepClick={setCurrentStep} />
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
