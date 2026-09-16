import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Download, Check, ArrowRight, FileText, Calendar } from 'lucide-react';
import type { EnrollmentState } from '../../types';

interface PaymentSuccessPageProps {
  state: EnrollmentState;
  onDone: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  state,
  onDone,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [downloaded, setDownloaded] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const amountPaid = state.payment.amountPaid || 100000;
  const formattedAmount = `₹${amountPaid.toLocaleString('en-IN')}`;
  const receiptId = state.payment.receiptId || 'NW-PAY-128781';
  const paidAt = state.payment.paidAt
    ? new Date(state.payment.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '04 Sep 2026';

  const handleDownload = () => {
    setDownloaded(true);
    setShowReceiptModal(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 text-center"
      >
        {/* Large Success Icon */}
        <motion.div
          initial={prefersReducedMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-sm"
        >
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </motion.div>

        {/* Heading & Supporting Copy */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
          You’re enrolled!
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-sm mx-auto">
          Your payment has been received successfully.
        </p>

        {/* Confirmation Card */}
        <div className="bg-[#F4F8FF] border border-[#D6E4FA] rounded-2xl p-5 mb-8 text-left space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2EDFC]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Amount Paid
            </span>
            <span className="text-xl font-bold text-[#0A192F]">
              {formattedAmount}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-[#E2EDFC]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receipt ID
            </span>
            <span className="text-xs font-mono font-bold text-[#0B63E5] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              {receiptId}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-[#E2EDFC]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Date
            </span>
            <span className="text-xs font-medium text-slate-700">
              {paidAt}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payment Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Completed</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="done-enrollment-btn"
            type="button"
            onClick={onDone}
            className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-[#0B63E5] hover:bg-[#0047BA] active:scale-[0.99] shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Done</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="download-receipt-btn"
            type="button"
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Receipt</span>
          </button>
        </div>

        {/* Modal for official receipt preview */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#0A192F] font-bold text-base">
                  <FileText className="w-5 h-5 text-[#0B63E5]" />
                  <span>Official Payment Receipt</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-600 mb-5 font-mono">
                <div className="flex justify-between">
                  <span>Learner:</span>
                  <span className="font-bold text-slate-900">{state.learner.name || 'Learner'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program:</span>
                  <span className="font-bold text-slate-900">NxtWave {state.program.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-bold text-slate-900">{receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-emerald-700">{formattedAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-700">VERIFIED & COMPLETED</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0B63E5] text-white text-xs font-semibold hover:bg-[#0047BA] transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
