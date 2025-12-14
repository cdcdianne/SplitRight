import { motion } from 'framer-motion';
import { SplitStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Users, Receipt, UserCheck, Calculator, ClipboardList, Share2 } from 'lucide-react';

const STEPS: { key: SplitStep; label: string; icon: React.ElementType }[] = [
  { key: 'people', label: 'People', icon: Users },
  { key: 'items', label: 'Items', icon: Receipt },
  { key: 'assign', label: 'Assign', icon: UserCheck },
  { key: 'tax-tip', label: 'Tax & Tip', icon: Calculator },
  { key: 'summary', label: 'Summary', icon: ClipboardList },
  { key: 'share', label: 'Share', icon: Share2 },
];

interface StepIndicatorProps {
  currentStep: SplitStep;
  visitedSteps?: Set<SplitStep>;
  onStepClick?: (step: SplitStep) => void;
}

export function StepIndicator({ currentStep, visitedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className=" overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide pt-2">
      <div className="flex items-center justify-between min-w-[500px] sm:min-w-0 sm:grid sm:grid-cols-6 gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;
          const hasBeenVisited = visitedSteps?.has(step.key) ?? false;
          const isClickable = onStepClick && (hasBeenVisited || isActive);

          return (
            <button
              key={step.key}
              onClick={() => isClickable && onStepClick?.(step.key)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-200',
                isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60',
                isActive && 'scale-110 sm:scale-105'
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.9,
                  backgroundColor: isActive
                    ? 'hsl(var(--primary))'
                    : isCompleted
                    ? 'hsl(var(--success))'
                    : 'hsl(var(--muted))',
                }}
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all',
                  isActive && 'shadow-glow'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 transition-colors',
                    isActive || isCompleted
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-primary'
                    : isCompleted
                    ? 'text-success'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
