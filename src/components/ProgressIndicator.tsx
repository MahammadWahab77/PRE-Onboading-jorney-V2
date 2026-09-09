import React from 'react';
import { Check } from 'lucide-react';
import type { PortalRoute } from '../types';

interface ProgressIndicatorProps {
  currentRoute: PortalRoute;
  paymentMethod?: string | null;
}

interface StepItem {
  id: number;
  label: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentRoute,
  paymentMethod,
}) => {
  const isEmi =
    paymentMethod === 'NO_COST_EMI' ||
    paymentMethod === 'No-Cost EMI' ||
    ['emi', 'co-applicant', 'kyc', 'nbfc-status'].includes(currentRoute);

  // 1. Direct Pay Flow: 4 steps
  const directSteps: StepItem[] = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Program' },
    { id: 3, label: 'Payment' },
    { id: 4, label: 'Class Access' },
  ];

  // 2. Financing / EMI Flow: 7 steps
  const emiSteps: StepItem[] = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Program' },
    { id: 3, label: 'Payment' },
    { id: 4, label: 'Co-Applicant' },
    { id: 5, label: 'KYC' },
    { id: 6, label: 'NBFC Review' },
    { id: 7, label: 'Class Access' },
  ];

  const steps = isEmi ? emiSteps : directSteps;

  const getActiveStep = (): number => {
    if (!isEmi) {
      switch (currentRoute) {
        case 'auth':
          return 1;
        case 'congratulations':
        case 'program':
          return 2;
        case 'payment':
        case 'pay':
        case 'payment-success':
          return 3;
        case 'class-access':
          return 4;
        default:
          return 1;
      }
    } else {
      switch (currentRoute) {
        case 'auth':
          return 1;
        case 'congratulations':
        case 'program':
          return 2;
        case 'payment':
        case 'emi':
          return 3;
        case 'co-applicant':
          return 4;
        case 'kyc':
        case 'kyc-slot':
        case 'kyc-readiness':
        case 'kyc-confirmation':
          return 5;
        case 'nbfc-status':
          return 6;
        case 'class-access':
        case 'payment-success':
          return 7;
        default:
          return 1;
      }
    }
  };

  const activeStep = getActiveStep();

  return (
    <nav
      aria-label="Enrollment Progress"
      className="sticky top-16 z-20 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2.5 px-4 shadow-xs transition-all"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute left-4 right-4 top-3.5 -translate-y-1/2 h-[2px] bg-slate-200 z-0" />

          {/* Filled Progress Line */}
          <div
            className="absolute left-4 top-3.5 -translate-y-1/2 h-[2px] bg-[#0B63E5] z-0 transition-all duration-500 ease-out"
            style={{
              width: `${((activeStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step) => {
            const isCompleted = step.id < activeStep;
            const isCurrent = step.id === activeStep;

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center group"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0B63E5] text-white ring-3 ring-blue-50'
                      : isCurrent
                      ? 'bg-white border-2 border-[#0B63E5] text-[#0B63E5] ring-3 ring-blue-100 shadow-xs'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>
                <span
                  className={`mt-1 text-[10px] sm:text-[11px] font-semibold text-center hidden sm:block whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'text-[#0A192F] font-bold'
                      : isCompleted
                      ? 'text-[#0B63E5]'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile active indicator text */}
        <div className="sm:hidden mt-1.5 text-center text-xs text-slate-500 font-medium">
          Step {activeStep} of {steps.length}:{' '}
          <span className="text-[#0A192F] font-semibold">
            {steps[activeStep - 1]?.label || 'Verification'}
          </span>
        </div>
      </div>
    </nav>
  );
};
