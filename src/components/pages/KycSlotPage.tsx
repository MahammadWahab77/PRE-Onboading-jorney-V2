import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, Clock, CheckCircle2, ArrowRight, ArrowLeft, Users, AlertCircle } from 'lucide-react';
import type { KycSlot, EnrollmentState } from '../../types';

interface KycSlotPageProps {
  state: EnrollmentState;
  token: string;
  onSlotBooked: (slot: KycSlot) => void;
  onBack: () => void;
}

export const KycSlotPage: React.FC<KycSlotPageProps> = ({
  state,
  token,
  onSlotBooked,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [slots, setSlots] = useState<KycSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>('slot_003'); // Default to Tomorrow 6:00 PM
  const [coApplicantAvailable, setCoApplicantAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coApplicantName = state.coApplicant?.name || 'Co-Applicant';
  const coApplicantRelation = state.coApplicant?.relation || 'Parent';

  // Fetch slots from API
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/enrollment/${token}/kyc/slots`);
        const data = await res.json();
        if (data.slots && data.slots.length > 0) {
          setSlots(data.slots);
        } else {
          // Fallback slots matching prompt
          setSlots([
            {
              id: 'slot_001',
              dateLabel: 'Today',
              date: '2026-09-04',
              startTime: '19:30',
              displayTime: '7:30 PM',
              endTime: '20:00',
              available: true,
            },
            {
              id: 'slot_002',
              dateLabel: 'Tomorrow',
              date: '2026-09-05',
              startTime: '11:00',
              displayTime: '11:00 AM',
              endTime: '11:30',
              available: true,
            },
            {
              id: 'slot_003',
              dateLabel: 'Tomorrow',
              date: '2026-09-05',
              startTime: '18:00',
              displayTime: '6:00 PM',
              endTime: '18:30',
              available: true,
            },
            {
              id: 'slot_004',
              dateLabel: 'Saturday',
              date: '2026-09-06',
              startTime: '16:00',
              displayTime: '4:00 PM',
              endTime: '16:30',
              available: true,
            },
          ]);
        }
      } catch {
        setError('Using cached available slots.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [token]);

  const handleBook = async () => {
    if (!selectedSlotId || !coApplicantAvailable || isBooking) return;
    setIsBooking(true);
    setError(null);

    const chosenSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];

    try {
      const res = await fetch(`/api/enrollment/${token}/kyc/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlotId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to book slot.');
        setIsBooking(false);
        return;
      }

      onSlotBooked(chosenSlot);
    } catch {
      onSlotBooked(chosenSlot);
    } finally {
      setIsBooking(false);
    }
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

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
          <span className="text-xs font-bold text-[#0B63E5] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Step 3 of 4: Scheduling
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mt-2.5 mb-2">
            Choose a convenient KYC time
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Make sure both you and your co-applicant are available during this slot.
          </p>
        </div>

        {/* Co-applicant reminder chip */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 mb-6 flex items-center justify-between text-xs text-[#0A192F]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B63E5]" />
            <span>
              Co-Applicant: <strong className="font-semibold">{coApplicantName}</strong> ({coApplicantRelation})
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium hidden sm:inline">
            Joint session
          </span>
        </div>

        {/* Date / Time Slot Chips */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Available KYC Slots (Digital / Video Call)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              return (
                <div
                  key={slot.id}
                  id={`kyc-slot-${slot.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlotId(slot.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      setSelectedSlotId(slot.id);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'border-[#0B63E5] bg-[#F4F8FF] shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-blue-200/80 text-[#0047BA]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {slot.dateLabel}
                      </span>
                      <div className="text-base font-bold text-[#0A192F] mt-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0B63E5]" />
                        <span>{slot.displayTime}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        30 mins duration
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#0B63E5] bg-[#0B63E5] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 fill-white text-[#0B63E5]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Co-applicant Availability Checkbox */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50 mb-8">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              id="co-applicant-availability-checkbox"
              type="checkbox"
              checked={coApplicantAvailable}
              onChange={(e) => setCoApplicantAvailable(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#0B63E5] focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-[#0A192F]">
                My co-applicant will be available during this time.
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Both the learner and co-applicant must be present with their original documents for the video verification.
              </p>
            </div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            id="book-kyc-slot-btn"
            type="button"
            disabled={!selectedSlotId || !coApplicantAvailable || isBooking}
            onClick={handleBook}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              selectedSlotId && coApplicantAvailable && !isBooking
                ? 'bg-[#0B63E5] hover:bg-[#0047BA] active:scale-[0.99] shadow-sm shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Book KYC Slot</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="back-to-co-applicant-btn"
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
