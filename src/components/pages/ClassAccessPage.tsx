import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  GraduationCap,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import type { EnrollmentState } from '../../types';

interface ClassAccessPageProps {
  state: EnrollmentState;
  token: string;
  onResetSession?: () => void;
}

export const ClassAccessPage: React.FC<ClassAccessPageProps> = ({
  state,
  token,
  onResetSession,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const rawLearnerName = state.learner?.name;
  const learnerName =
    typeof rawLearnerName === 'string'
      ? rawLearnerName
      : typeof rawLearnerName === 'object' && rawLearnerName && (rawLearnerName as any).name
      ? String((rawLearnerName as any).name)
      : 'Learner';
  const programName =
    typeof state.program?.name === 'string' ? state.program.name : 'NxtWave Program';
  const enrollmentUid = state.canonicalJourney?.journey.applicationId || state.token || '';
  const receiptId =
    state.payment.receiptId ||
    state.canonicalJourney?.payment.receiptId ||
    '';
  const batchStartDate = state.canonicalJourney?.journey?.batchStartDate || 'To be announced';

  const [isResetting, setIsResetting] = useState(false);

  // Celebration confetti particles state
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const colors = ['#0B63E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
    const generated = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 360,
      y: (Math.random() - 0.5) * 280 - 30,
      color: colors[i % colors.length],
      size: Math.floor(Math.random() * 7) + 4,
      delay: Math.random() * 0.5,
    }));
    setParticles(generated);
  }, [prefersReducedMotion]);

  const handleDownloadReceipt = () => {
    // Generates print/download receipt window
    window.print();
  };

  const handleLaunchLms = () => {
    window.open('https://learning.ccbp.in', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Soft Confetti Burst */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -top-24 z-10">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.2, 1],
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.4,
                delay: p.delay,
                ease: 'easeOut',
              }}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Top Success Celebration Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <GraduationCap className="w-8 h-8 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300 inline-block mb-2">
            Enrollment 100% Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight">
            Welcome to NxtWave, {learnerName}!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            Your admission seat is confirmed and your learning workspace has been provisioned.
          </p>
        </div>

        {/* ENROLLMENT & RECEIPT RECORD CARD */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admission Record
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Student
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Learner</span>
              <strong className="text-slate-800">{learnerName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Program</span>
              <strong className="text-slate-800">{programName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">UID / Reg No.</span>
              <strong className="font-mono text-slate-800">{enrollmentUid}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Receipt / Ref</span>
              <strong className="font-mono text-slate-800">{receiptId}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Batch Start Date</span>
              <strong className="text-blue-700 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{batchStartDate}</span>
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Access Status</span>
              <strong className="text-emerald-700 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active</span>
              </strong>
            </div>
          </div>
        </div>

        {/* CLASS LAUNCH CARD */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white mb-6 text-left relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              Learning Management System (LMS)
            </span>
            <h2 className="text-lg sm:text-xl font-bold mt-2 mb-1">
              Launch Your Student Learning Portal
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed max-w-lg mb-4">
              Access your daily structured curriculum, live coding environments, orientation masterclasses, and mentor discord community.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="launch-lms-btn"
                type="button"
                onClick={handleLaunchLms}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Open Learning Portal</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                id="download-receipt-btn"
                type="button"
                onClick={handleDownloadReceipt}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* NEXT STEPS CHECKLIST */}
        <div className="border border-slate-200 rounded-xl p-5 mb-6 text-left space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Your Next Steps Before Cohort Day 1
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Attend Welcome Orientation</strong>
                <span>Live virtual orientation on Google Meet with course directors on 14 September.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Meet Your Dedicated Student Mentor</strong>
                <span>Your mentor will contact you via WhatsApp for personal roadmap planning.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Development Environment Setup</strong>
                <span>Follow the pre-work guide inside the learning portal to configure your workstation.</span>
              </div>
            </div>
          </div>
        </div>


      </motion.div>
    </div>
  );
};
