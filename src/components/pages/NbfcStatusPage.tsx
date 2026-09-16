import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  Lock,
} from 'lucide-react';
import type { EnrollmentState, EnrollmentJourney } from '../../types';
import { ActionRequiredCard } from '../ActionRequiredCard';

interface NbfcStatusPageProps {
  state: EnrollmentState;
  token: string;
  onUpdateJourney: (journey: EnrollmentJourney) => void;
  onComplete: () => void;
  onBack: () => void;
  onSwitchCoApplicant: () => void;
  onSwitchToDirectPay: () => void;
}

export interface NbfcChildRecordItem {
  id: string;
  nbfcName: string;
  appId: string | null;
  facilityAmount: number;
  facilityAmountFormatted: string;
  appliedLoanAmount: number;
  approvedLoanAmount: number;
  studentPhone: string | null;
  linkedRecordId: string | null;
  isActive: boolean;
  coApplicantName: string | null;
  coApplicantPhone: string | null;
  coApplicantRelation: string | null;
}

export interface CadenceStageItem {
  step: number;
  name: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

// Normalized NBFC shape from the API
interface NbfcNormalized {
  statusCode: string;
  statusLabel: string;
  activeLender: string;
  userMessage: string;
  guidanceMessage?: string;
  cadenceStep?: number;
  cadenceStages?: CadenceStageItem[];
  callToAction: {
    label: string;
    action: string;
    primary: boolean;
  } | null;
  classAccessEta: string | null;
  lastUpdated: string;
  rawStatus: string | null;
  allNbfcs?: NbfcChildRecordItem[];
}

export const NbfcStatusPage: React.FC<NbfcStatusPageProps> = ({
  state,
  token,
  onUpdateJourney,
  onComplete,
  onBack,
  onSwitchCoApplicant,
  onSwitchToDirectPay,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const financing = state.financing || state.canonicalJourney?.financing;

  // Normalized NBFC state (fetched live from Salesforce)
  const [nbfcData, setNbfcData] = useState<NbfcNormalized | null>(null);
  const [isLoadingNbfc, setIsLoadingNbfc] = useState(false);
  const [nbfcError, setNbfcError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Keep a stable ref for onUpdateJourney to prevent re-triggering effects
  const onUpdateJourneyRef = useRef(onUpdateJourney);
  useEffect(() => {
    onUpdateJourneyRef.current = onUpdateJourney;
  }, [onUpdateJourney]);

  // Derive display values from live NBFC data, falling back to journey state
  const lenderName = nbfcData?.activeLender || financing?.lenderName || 'Finance partner is being assigned';
  const status = (nbfcData?.statusCode || financing?.status || 'UNDER_REVIEW') as string;
  const currentCadenceStep = nbfcData?.cadenceStep || (
    status === 'DISBURSED' ? 5 :
    status === 'EMI_SETUP_COMPLETED' || status === 'EMI_SETUP_PENDING' ? 4 :
    status === 'APPROVED' ? 3 :
    status === 'UNDER_REVIEW' || status === 'DOCUMENTS_REQUIRED' ? 2 :
    1
  );

  // Fetch latest NBFC status from Salesforce (via normalized endpoint)
  const fetchLatestNbfcStatus = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setIsLoadingNbfc(true);
    setNbfcError(null);
    try {
      const res = await fetch(`/api/enrollment/${token}/nbfc-status`);
      const data = await res.json();
      if (res.ok && data.nbfc) {
        setNbfcData(data.nbfc as NbfcNormalized);
        if (data.journey) onUpdateJourneyRef.current(data.journey);
      } else if (!isSilent) {
        setNbfcError(data.error || 'Failed to load financing status');
      }
    } catch {
      if (!isSilent) {
        setNbfcError('Unable to connect. Please check your internet and try again.');
      }
    } finally {
      if (!isSilent) setIsLoadingNbfc(false);
    }
  }, [token]);

  // 2-Stage Sync Policy on portal load:
  // 1st sync runs immediately on mount
  // 2nd sync runs after 2 seconds to capture/lock-in updated Salesforce status
  useEffect(() => {
    let secondSyncTimer: NodeJS.Timeout;

    // 1st Sync (Immediate)
    fetchLatestNbfcStatus(false);

    // 2nd Sync (After 2 seconds)
    secondSyncTimer = setTimeout(() => {
      fetchLatestNbfcStatus(true);
    }, 2000);

    const handleFocus = () => {
      fetchLatestNbfcStatus(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(secondSyncTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, fetchLatestNbfcStatus]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('Financing Application Assistance');
  const [ticketDescription, setTicketDescription] = useState(
    'Need help with auto-debit setup and document status.'
  );
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  // Trigger NBFC Actions
  const handleNbfcAction = async (
    actionType: 'SETUP_EMI' | 'DISBURSE_SIMULATE' | 'CHANGE_CO_APPLICANT' | 'RETRY_DOCUMENTS'
  ) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/enrollment/${token}/nbfc/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
      });
      const data = await res.json();
      if (res.ok && data.journey) {
        onUpdateJourney(data.journey);
        await fetchLatestNbfcStatus(true);
        if (actionType === 'CHANGE_CO_APPLICANT') {
          onSwitchCoApplicant();
        } else if (actionType === 'DISBURSE_SIMULATE') {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Error triggering NBFC action:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Support Ticket Form Submit
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await fetch(`/api/enrollment/${token}/support-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ticketCategory,
          description: ticketDescription,
          learnerName: state.learner.name,
          contactNumber: state.learner.mobileMasked,
        }),
      });
      setTicketSuccessMsg('Ticket logged. Our admissions counselor will call you shortly.');
      setTimeout(() => {
        setShowSupportModal(false);
        setTicketSuccessMsg(null);
      }, 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5-Step Financing Cadence Lifecycle
  const cadenceStages: CadenceStageItem[] = nbfcData?.cadenceStages || [
    {
      step: 1,
      name: 'Application & Consent',
      description: 'Educational EMI application initiated & consent link sent to co-applicant',
      isCompleted: currentCadenceStep > 1 && status !== 'REJECTED',
      isCurrent: currentCadenceStep === 1 && status !== 'REJECTED',
    },
    {
      step: 2,
      name: 'Document & Credit Review',
      description: 'Lender underwriting team reviews KYC, income details & credit bureau score',
      isCompleted: currentCadenceStep > 2 && status !== 'REJECTED',
      isCurrent: currentCadenceStep === 2 && status !== 'REJECTED',
    },
    {
      step: 3,
      name: 'Sanction & Video KYC',
      description: 'Loan sanctioned, digital agreement signing & quick Video KYC (if applicable)',
      isCompleted: currentCadenceStep > 3 && status !== 'REJECTED',
      isCurrent: currentCadenceStep === 3 && status !== 'REJECTED',
    },
    {
      step: 4,
      name: 'Auto-Debit (e-NACH) Setup',
      description: 'Our NBFC partner will connect with you to register monthly auto-debit (0% interest)',
      isCompleted: currentCadenceStep > 4 && status !== 'REJECTED',
      isCurrent: currentCadenceStep === 4 && status !== 'REJECTED',
    },
    {
      step: 5,
      name: 'Disbursement & Class Access',
      description: 'Facility disbursed directly to NxtWave and Genius LMS portal unlocked',
      isCompleted: currentCadenceStep === 5,
      isCurrent: currentCadenceStep === 5,
    },
  ];

  const faqs = [
    {
      q: 'How does the 0% No-Cost EMI work?',
      a: 'NxtWave subvents the interest directly with the lending partner so you only pay the exact program fee in equal monthly installments without any hidden interest charges or upfront processing fees.',
    },
    {
      q: 'Why is a Co-Applicant required?',
      a: 'As students are currently focusing on their education, RBI-approved lending partners require a salaried or self-employed parent, guardian, or earning sibling to act as the primary co-applicant for auto-debit registration.',
    },
    {
      q: 'What is an e-NACH Auto-Debit Mandate?',
      a: 'e-NACH is a secure, RBI-mandated digital banking authorization that allows your monthly EMI to be automatically debited from your co-applicant’s bank account on a fixed date each month.',
    },
    {
      q: 'When will my program classes unlock?',
      a: 'Your learning portal and curriculum classes unlock automatically as soon as your auto-debit mandate is confirmed and the partner lender issues the sanction.',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#0B63E5] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Education Financing Dashboard
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Lender: {lenderName}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
          Financing Application Status
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Track the step-by-step underwriting, verification, and auto-debit setup for your educational facility.
        </p>

        {/* 0% NO-COST EMI BENEFIT BANNER */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 mb-6 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-900 block">0% Interest No-Cost Educational EMI</span>
              <span className="text-[11px] text-emerald-700">Zero hidden fees • Subsidized by NxtWave • Equal monthly installments</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>0% Extra Charges</span>
          </div>
        </div>

        {/* ---- LIVE NBFC STATUS CARD ---- */}

        {/* Loading state */}
        {isLoadingNbfc && !nbfcData && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 mb-6">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
            <p className="text-sm text-blue-700 font-medium">Checking your latest finance status...</p>
          </div>
        )}

        {/* Error state */}
        {nbfcError && !isLoadingNbfc && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{nbfcError}</p>
              <button
                type="button"
                onClick={() => fetchLatestNbfcStatus(false)}
                className="mt-2 text-xs font-semibold text-red-600 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Status & Guidance Card */}
        {nbfcData && (
          <div className={`p-5 rounded-2xl border mb-6 text-left ${
            nbfcData.statusCode === 'DISBURSED' ? 'bg-emerald-50/70 border-emerald-200' :
            nbfcData.statusCode === 'APPROVED' ? 'bg-green-50/70 border-green-200' :
            nbfcData.statusCode === 'EMI_SETUP_COMPLETED' ? 'bg-blue-50/70 border-blue-200' :
            nbfcData.statusCode === 'DOCUMENTS_REQUIRED' ? 'bg-amber-50/70 border-amber-200' :
            nbfcData.statusCode === 'REJECTED' ? 'bg-orange-50/70 border-orange-200' :
            'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                nbfcData.statusCode === 'DISBURSED' ? 'bg-emerald-100 text-emerald-700' :
                nbfcData.statusCode === 'APPROVED' ? 'bg-green-100 text-green-700' :
                nbfcData.statusCode === 'EMI_SETUP_COMPLETED' ? 'bg-blue-100 text-blue-700' :
                nbfcData.statusCode === 'DOCUMENTS_REQUIRED' ? 'bg-amber-100 text-amber-700' :
                nbfcData.statusCode === 'REJECTED' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-[#0B63E5]'
              }`}>
                {nbfcData.statusCode === 'DISBURSED' ? <Sparkles className="w-5 h-5" /> :
                 nbfcData.statusCode === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> :
                 nbfcData.statusCode === 'EMI_SETUP_COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> :
                 nbfcData.statusCode === 'DOCUMENTS_REQUIRED' ? <AlertTriangle className="w-5 h-5" /> :
                 nbfcData.statusCode === 'REJECTED' ? <RefreshCw className="w-5 h-5" /> :
                 <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    nbfcData.statusCode === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800' :
                    nbfcData.statusCode === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    nbfcData.statusCode === 'EMI_SETUP_COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    nbfcData.statusCode === 'DOCUMENTS_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                    nbfcData.statusCode === 'REJECTED' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {nbfcData.statusLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchLatestNbfcStatus(false)}
                    disabled={isLoadingNbfc}
                    title="Refresh status"
                    className="p-1 rounded hover:bg-black/5 transition-colors disabled:opacity-50 shrink-0 text-slate-400 hover:text-slate-600"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNbfc ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-sm font-medium text-slate-900 mt-2 leading-snug">
                  {nbfcData.userMessage}
                </p>

                {nbfcData.guidanceMessage && (
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                    💡 <strong className="text-slate-800">What to expect:</strong> {nbfcData.guidanceMessage}
                  </p>
                )}

                {nbfcData.classAccessEta && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      {nbfcData.classAccessEta.startsWith('In 2-3 days')
                        ? nbfcData.classAccessEta
                        : `Estimated Access: ${nbfcData.classAccessEta}`}
                    </span>
                  </div>
                )}

                {/* Team will connect callout for DOCUMENTS_REQUIRED */}
                {nbfcData.statusCode === 'DOCUMENTS_REQUIRED' && (
                  <div className="flex items-center gap-2.5 mt-3.5 p-3 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-semibold">
                    <PhoneCall className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Our Team will connect with you for additional docs</span>
                  </div>
                )}

                {/* Team will connect callout for APPROVED / EMI_SETUP */}
                {(nbfcData.statusCode === 'APPROVED' || nbfcData.statusCode === 'EMI_SETUP_PENDING') && (
                  <div className="flex items-center gap-2.5 mt-3.5 p-3 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-semibold">
                    <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Our NBFC partner will connect with you to set up auto-debit</span>
                  </div>
                )}

                {/* Completion notice for EMI_SETUP_COMPLETED */}
                {nbfcData.statusCode === 'EMI_SETUP_COMPLETED' && (
                  <div className="flex items-center gap-2.5 mt-3.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold">
                    <Clock className="w-4 h-4 text-[#0B63E5] shrink-0" />
                    <span>In 2-3 days we will complete the class access</span>
                  </div>
                )}

                {/* Primary CTA */}
                {nbfcData.callToAction && nbfcData.callToAction.action !== 'REFRESH' && nbfcData.callToAction.action !== 'NONE' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (nbfcData.callToAction?.action === 'SETUP_EMI') handleNbfcAction('SETUP_EMI');
                      else if (nbfcData.callToAction?.action === 'GO_TO_CLASS_ACCESS') onComplete();
                      else if (nbfcData.callToAction?.action === 'RETRY_DOCUMENTS') handleNbfcAction('RETRY_DOCUMENTS');
                      else if (nbfcData.callToAction?.action === 'CHANGE_CO_APPLICANT') onSwitchCoApplicant();
                    }}
                    className={`mt-3 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      nbfcData.callToAction.primary
                        ? 'bg-[#0B63E5] text-white hover:bg-blue-600 shadow-xs'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{nbfcData.callToAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE CALLOUT BANNERS FOR SPECIFIC ACTIONS
            ------------------------------------------------------------- */}

        {/* 1. REJECTED STATE */}
        {status === 'REJECTED' && (
          <div className="mb-6">
            <ActionRequiredCard
              title="Alternate Financing Evaluation in Progress"
              description={
                financing?.rejectionReason ||
                'The initial partner criteria could not be cleared. Our finance desk is exploring alternate RBI-approved lending partners for your enrollment.'
              }
              actionLabel="Nominate Alternate Co-Applicant"
              onAction={onSwitchCoApplicant}
            />

            <div className="flex flex-wrap gap-2 text-xs mt-3">
              <button
                type="button"
                onClick={onSwitchToDirectPay}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Switch to Direct Fee Payment
              </button>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-50 text-[#0B63E5] font-semibold hover:bg-blue-100 cursor-pointer"
              >
                Talk to Admissions Counselor
              </button>
            </div>
          </div>
        )}

        {/* 2. APPROVED / MANDATE SETUP PENDING */}
        {(status === 'APPROVED' || status === 'EMI_SETUP_PENDING') && (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 mb-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded-md border border-emerald-300">
                  Loan Approved
                </span>
                <h3 className="text-base font-bold text-emerald-950 mt-1">
                  Auto-Debit (e-NACH Mandate) Setup
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Your 0% interest educational financing is approved by {lenderName}. Our NBFC partner will connect with you to complete the auto-debit setup.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/90 border border-emerald-300/80 text-emerald-950 text-xs font-semibold">
              <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Our NBFC partner will connect with you to set up auto-debit</span>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            5-STAGE GENERIC NBFC CADENCE ROADMAP
            ------------------------------------------------------------- */}
        <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 text-left bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Financing Cadence &amp; Progression</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standard 5-stage educational loan journey with our partner lenders
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B63E5] border border-blue-100">
              Stage {currentCadenceStep} of 5
            </span>
          </div>

          <div className="space-y-4">
            {cadenceStages.map((stage) => {
              const isPast = stage.isCompleted;
              const isCurrent = stage.isCurrent;
              const isFuture = !isPast && !isCurrent;

              return (
                <div key={stage.step} className="flex items-start gap-3.5 relative">
                  {/* Vertical connecting line */}
                  {stage.step < cadenceStages.length && (
                    <div
                      className={`absolute left-[15px] top-8 bottom-[-16px] w-0.5 ${
                        isPast ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Icon Indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      isPast
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-[#0B63E5] text-white ring-4 ring-blue-100 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{stage.step}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${
                        isPast ? 'text-slate-900' :
                        isCurrent ? 'text-[#0B63E5]' :
                        'text-slate-500'
                      }`}>
                        Stage {stage.step}: {stage.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPast ? 'bg-emerald-50 text-emerald-700' :
                        isCurrent ? 'bg-blue-50 text-[#0B63E5] border border-blue-200 font-semibold' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {isPast ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${
                      isCurrent ? 'text-slate-700 font-medium' : 'text-slate-500'
                    }`}>
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ & CADENCE GUIDANCE ACCORDION */}
        <div className="border border-slate-200 rounded-2xl p-5 mb-6 text-left bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0B63E5]" />
            <span>Understanding Educational Financing &amp; Flow</span>
          </h3>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="border border-slate-200/80 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchLatestNbfcStatus(false)}
              disabled={isLoadingNbfc}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingNbfc ? 'animate-spin' : ''}`} />
              <span>{isLoadingNbfc ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>

            {status === 'DISBURSED' ? (
              <button
                id="nbfc-continue-to-class-btn"
                type="button"
                onClick={onComplete}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B63E5] text-white text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Class Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 text-xs font-semibold text-[#0B63E5] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Need Help? Contact Counselor</span>
              </button>
            )}
          </div>
        </div>

      </motion.div>

      {/* SUPPORT TICKETING MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Admissions Counselor Support Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit a support ticket to get immediate assistance on NBFC documentation or fee options.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Inquiry Category
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-[#0B63E5]"
                >
                  <option value="Financing Application Assistance">Financing Assistance</option>
                  <option value="Alternate Co-Applicant Nomination">Alternate Co-Applicant</option>
                  <option value="Switch to Direct Payment">Switch to Direct Payment</option>
                  <option value="Auto-Debit eNACH Help">Auto-Debit eNACH Help</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Message / Details
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:border-[#0B63E5]"
                />
              </div>

              {ticketSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {ticketSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-[#0B63E5] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
