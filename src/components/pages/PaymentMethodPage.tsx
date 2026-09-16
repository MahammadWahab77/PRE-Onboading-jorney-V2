import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CreditCard, CalendarDays, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PaymentMethodType, EnrollmentState } from '../../types';
import { getFullPaymentInfo } from '../../utils/paymentLinks';

interface PaymentMethodPageProps {
  state: EnrollmentState;
  token: string;
  onSelectMethod: (method: PaymentMethodType) => void;
  onBack: () => void;
}

export const PaymentMethodPage: React.FC<PaymentMethodPageProps> = ({
  state,
  token,
  onSelectMethod,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<PaymentMethodType | null>(
    state.payment.selectedMethod
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullPaymentInfo = getFullPaymentInfo(state.program?.name);

  const methods = [
    {
      id: 'FULL_PAYMENT' as PaymentMethodType,
      title: 'Full Payment',
      badge: 'Fastest Route',
      description: 'Pay the full program fee in one go via UPI, Netbanking, or Debit Card.',
      note: `Official Registration Link: ${fullPaymentInfo.link}`,
      icon: (
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B63E5] font-black text-xl">
          ₹
        </div>
      ),
    },
    {
      id: 'CREDIT_CARD' as PaymentMethodType,
      title: 'Credit Card',
      badge: 'Instant Confirmation',
      description: 'Pay securely using your credit card with zero wait time.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <CreditCard className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'NO_COST_EMI' as PaymentMethodType,
      title: 'No-Cost EMI',
      badge: 'Popular Option',
      description: 'Spread the program fee into monthly instalments.',
      note: 'If you choose EMI, we’ll explain the process before asking for any financing details.',
      icon: (
        <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
          <CalendarDays className="w-5 h-5" />
        </div>
      ),
    },
  ];

  const handleContinue = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await fetch(`/api/enrollment/${token}/payment-method`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selected, paymentMethod: selected }),
      });
      onSelectMethod(selected);
    } catch {
      // In case of transient issue, proceed with selected state
      onSelectMethod(selected);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
            How would you like to pay?
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Choose the option that works best for you and your family.
          </p>
        </div>

        {/* 3 Large Selectable Cards */}
        <div className="space-y-3.5 mb-6">
          {methods.map((m) => {
            const isChosen = selected === m.id;
            return (
              <div
                key={m.id}
                id={`payment-option-${m.id.toLowerCase()}`}
                role="radio"
                aria-checked={isChosen}
                tabIndex={0}
                onClick={() => setSelected(m.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    setSelected(m.id);
                  }
                }}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  isChosen
                    ? 'border-[#0B63E5] bg-[#F4F8FF] shadow-sm ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="shrink-0">{m.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0A192F]">
                          {m.title}
                        </h3>
                        {m.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isChosen
                                ? 'bg-blue-200/70 text-[#0047BA]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {m.description}
                      </p>

                      {m.note && (
                        <p className="text-[11px] font-medium text-[#0B63E5] mt-2 bg-blue-50/80 p-2 rounded-lg border border-blue-100/80">
                          {m.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Radio tick indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isChosen
                        ? 'border-[#0B63E5] bg-[#0B63E5] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChosen && <CheckCircle2 className="w-4 h-4 fill-white text-[#0B63E5]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security badge */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No hidden charges. 100% transparent fee breakup.</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            id="payment-continue-btn"
            type="button"
            disabled={!selected || isSubmitting}
            onClick={handleContinue}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              selected && !isSubmitting
                ? 'bg-[#0B63E5] hover:bg-[#0047BA] active:scale-[0.99] shadow-sm shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="payment-back-btn"
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0A192F] hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
