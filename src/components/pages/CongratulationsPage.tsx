import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, ArrowRight, Award, CheckCircle2 } from 'lucide-react';
import type { EnrollmentState } from '../../types';

interface CongratulationsPageProps {
  state: EnrollmentState;
  onNext: () => void;
}

export const CongratulationsPage: React.FC<CongratulationsPageProps> = ({
  state,
  onNext,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const rawLearnerName = state.learner?.name;
  const learnerName =
    typeof rawLearnerName === 'string'
      ? rawLearnerName
      : typeof rawLearnerName === 'object' && rawLearnerName && (rawLearnerName as any).name
      ? String((rawLearnerName as any).name)
      : 'Learner';
  const firstName =
    typeof learnerName === 'string' && typeof learnerName.split === 'function'
      ? learnerName.split(' ')[0] || 'Learner'
      : 'Learner';
  const programName =
    typeof state.program?.name === 'string' ? state.program.name : 'NxtWave Program';

  // Subtle confetti particles state
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const colors = ['#0B63E5', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
    const generated = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 320,
      y: (Math.random() - 0.5) * 260 - 20,
      color: colors[i % colors.length],
      size: Math.floor(Math.random() * 6) + 4,
      delay: Math.random() * 0.4,
    }));
    setParticles(generated);
  }, [prefersReducedMotion]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Soft Particles Burst (Runs once 1-1.5s sequence, no aggressive loop) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -top-24">
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
                duration: 1.3,
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
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 relative z-10 text-center"
      >
        {/* Success / Sparkle Icon */}
        <motion.div
          initial={prefersReducedMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-500/25"
        >
          <Sparkles className="w-8 h-8 stroke-[2.2]" />
        </motion.div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
          Congratulations, {firstName}!
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Your NxtWave enrollment journey is ready.
        </p>

        {/* Enrollment Status Card */}
        <div className="bg-[#F4F8FF] border border-[#D6E4FA] rounded-2xl p-5 mb-8 text-left transition-all">
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E2EDFC]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[#0B63E5]">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Program
              </span>
            </div>
            <span className="text-base font-bold text-[#0A192F] tracking-tight">
              {programName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enrollment Status
              </span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ready to proceed
            </span>
          </div>
        </div>

        {/* Note on counselling to enrollment */}
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Your counsellor has reviewed your profile and set up your personal enrollment path.
        </p>

        {/* Primary Action Button */}
        <button
          id="view-my-program-btn"
          type="button"
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-[#0B63E5] hover:bg-[#0047BA] active:scale-[0.99] shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View My Program</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
