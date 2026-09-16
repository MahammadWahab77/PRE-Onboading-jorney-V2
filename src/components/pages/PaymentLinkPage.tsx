import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  CreditCard,
  Copy,
  Smartphone,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import type { EnrollmentState } from '../../types';
import { getFullPaymentInfo } from '../../utils/paymentLinks';

interface PaymentLinkPageProps {
  state: EnrollmentState;
  token: string;
  onPaymentSuccess: (receiptId: string, amount: number, paidAt: string) => void;
  onBack: () => void;
}

export const PaymentLinkPage: React.FC<PaymentLinkPageProps> = ({
  state,
  token,
  onPaymentSuccess,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileSent, setMobileSent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fullPaymentInfo = getFullPaymentInfo(state.program?.name);
  const isFullPayment = state.payment.selectedMethod === 'FULL_PAYMENT' || !state.payment.selectedMethod;
  const amount = state.program.amountPayable || 100000;
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;
  const methodLabel =
    state.payment.selectedMethod === 'CREDIT_CARD'
      ? 'Credit Card'
      : 'Full Payment (UPI / Netbanking)';
  const paymentLinkUrl = isFullPayment ? fullPaymentInfo.link : `https://pay.nxtwave.co.in/checkout/${token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendMobile = () => {
    setMobileSent(true);
    setTimeout(() => setMobileSent(false), 4000);
  };

  // Direct Pay Securely flow launching official registration link & completing journey
  const handlePayNow = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    if (isFullPayment && fullPaymentInfo.link) {
      window.open(fullPaymentInfo.link, '_blank', 'noopener,noreferrer');
    }

    try {
      const res = await fetch(`/api/enrollment/${token}/pay/simulate`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success && data.receiptId) {
        onPaymentSuccess(
          data.receiptId,
          data.journey?.program?.amountPayable || amount,
          new Date().toISOString()
        );
      } else if (data.payment && data.payment.status === 'SUCCESS') {
        onPaymentSuccess(
          data.payment.receiptId,
          data.payment.amountPaid,
          data.payment.paidAt
        );
      } else {
        setPaymentError("Your payment wasn’t completed. No worries, you can try again.");
      }
    } catch {
      setPaymentError("Network error. Please try again or copy payment link.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B63E5] mb-3 mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A192F] tracking-tight mb-1">
            Complete your payment
          </h1>
          <p className="text-sm text-slate-600">
            Secure checkout powered by official banking partners
          </p>
        </div>

        {/* Error message */}
        {paymentError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{paymentError}</p>
              <button
                type="button"
                onClick={handlePayNow}
                className="mt-2 text-[#0B63E5] font-semibold underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Payment Summary Box */}
        <div className="bg-[#F4F8FF] border border-[#D6E4FA] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2EDFC]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Selected Method
            </span>
            <span className="text-sm font-bold text-[#0A192F]">
              {methodLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount Payable
              </span>
              <div className="text-2xl font-black text-[#0A192F] tracking-tight mt-0.5">
                {formattedAmount}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Link valid for 60m</span>
            </div>
          </div>
        </div>

        {/* Official Full Payment Link Banner */}
        {isFullPayment && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50/80 border border-blue-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                {fullPaymentInfo.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold font-mono">
                Official CCBP Link
              </span>
            </div>
            <div className="text-xs text-blue-800 font-mono break-all mb-3">
              {fullPaymentInfo.link}
            </div>
            <a
              href={fullPaymentInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B63E5] hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <span>Open Registration Payment Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Primary CTA */}
        <button
          id="pay-securely-btn"
          type="button"
          disabled={isProcessing}
          onClick={handlePayNow}
          className="w-full py-4 px-6 rounded-xl text-base font-semibold text-white bg-[#0B63E5] hover:bg-[#0047BA] active:scale-[0.99] shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Connecting to Secure Gateway...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Pay Securely {formattedAmount}</span>
            </>
          )}
        </button>

        {/* Secondary Action Row */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <button
            id="copy-payment-link-btn"
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            id="send-to-mobile-btn"
            type="button"
            onClick={handleSendMobile}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {mobileSent ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>SMS Dispatched</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Send to Mobile</span>
              </>
            )}
          </button>
        </div>

        {mobileSent && (
          <p className="text-center text-xs text-emerald-700 font-medium -mt-3 mb-4">
            Payment link sent to +91 {state.learner.mobileMasked}
          </p>
        )}

        {/* Back navigation */}
        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            id="back-to-payment-method-btn"
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change payment method</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
