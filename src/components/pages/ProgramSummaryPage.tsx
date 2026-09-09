import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Tag,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import type { EnrollmentState } from '../../types';
import { ProgramCurriculumVideoPlayer } from '../ProgramCurriculumVideoPlayer';

interface ProgramSummaryPageProps {
  state: EnrollmentState;
  onNext: () => void;
  onBack: () => void;
}

export const ProgramSummaryPage: React.FC<ProgramSummaryPageProps> = ({
  state,
  onNext,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [showCurriculumVideo, setShowCurriculumVideo] = useState(false);

  // Commercial Pricing Data
  const baseFee = state.program.baseFee || state.canonicalJourney?.program.baseFee || 160000;
  const scholarshipAmount =
    state.program.scholarshipAmount ||
    state.canonicalJourney?.program.scholarshipAmount ||
    30000;
  const seatReservationPaid =
    state.program.seatReservationPaid ||
    state.canonicalJourney?.program.seatReservationPaid ||
    18000;
  const amountPayable =
    state.program.amountPayable ||
    state.canonicalJourney?.program.amountPayable ||
    Math.max(0, baseFee - scholarshipAmount - seatReservationPaid);

  const programTitle = state.program.name || 'NxtWave Genius';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#0B63E5] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Admissions & Commercial Commitment
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seat Reserved</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
          {programTitle} Program Details
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Transparent fee summary and scholarship breakdown for your confirmed cohort enrollment.
        </p>

        {/* PRIMARY FOCUS: COMMERCIAL FEE & SCHOLARSHIP BREAKDOWN */}
        <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fee Item
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Amount (INR)
            </span>
          </div>

          <div className="space-y-3 text-sm">
            {/* 1. Base Program Fee */}
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>Program Fee (Full Cost)</span>
              </span>
              <span className="font-mono font-semibold text-slate-900">
                ₹{baseFee.toLocaleString('en-IN')}
              </span>
            </div>

            {/* 2. Merit Scholarship */}
            <div className="flex items-center justify-between text-emerald-700">
              <span className="font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Merit Scholarship Applied</span>
              </span>
              <span className="font-mono font-semibold">
                -₹{scholarshipAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* 3. Seat Reservation Paid */}
            <div className="flex items-center justify-between text-emerald-700">
              <span className="font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Seat Reservation Fee (Paid Till Now)</span>
              </span>
              <span className="font-mono font-semibold">
                -₹{seatReservationPaid.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Divider Line */}
            <div className="pt-3 border-t-2 border-slate-300/80" />

            {/* 4. Net Amount Payable */}
            <div className="flex items-center justify-between pt-1 text-base sm:text-lg">
              <div>
                <span className="font-bold text-[#0A192F] block">Amount Payable</span>
                <span className="text-xs text-slate-500 font-normal">
                  All inclusive • zero hidden charges
                </span>
              </div>
              <span className="font-mono font-bold text-2xl text-[#0B63E5]">
                ₹{amountPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRAM HIGHLIGHTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-[#0B63E5] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Industry-Ready Certification
                </span>
                <span className="text-[11px] text-slate-500">
                  NSDC-aligned curriculum co-designed by leading tech architects.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-[#0B63E5] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Live Mentorship & Placement
                </span>
                <span className="text-[11px] text-slate-500">
                  Dedicated mock interviews, resume feedback, and placement drives.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY: CURRICULUM VIDEO EXPLAINER (ACCORDION / TOGGLE) */}
        <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCurriculumVideo((prev) => !prev)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B63E5]" />
              <span>Curriculum & Program Video Overview (Optional)</span>
            </div>
            {showCurriculumVideo ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showCurriculumVideo && (
            <div className="p-4 bg-white border-t border-slate-200">
              <ProgramCurriculumVideoPlayer />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
          <button
            id="program-back-btn"
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            id="program-continue-btn"
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B63E5] text-white text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Choose Payment Method</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
