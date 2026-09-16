import React, { useState } from 'react';
import type { EnrollmentState, PortalRoute } from '../../types';
import { NxtWaveHeader } from '../NxtWaveHeader';
import { ProgressIndicator } from '../ProgressIndicator';
import { AuthPage } from '../pages/AuthPage';
import { CongratulationsPage } from '../pages/CongratulationsPage';
import { ProgramSummaryPage } from '../pages/ProgramSummaryPage';
import { PaymentMethodPage } from '../pages/PaymentMethodPage';
import { PaymentLinkPage } from '../pages/PaymentLinkPage';
import { CoApplicantPage } from '../pages/CoApplicantPage';
import { KycPage } from '../pages/KycPage';
import { NbfcStatusPage } from '../pages/NbfcStatusPage';
import { ClassAccessPage } from '../pages/ClassAccessPage';
import {
  Search,
  RefreshCw,
  Lock,
  ShieldCheck,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface SalesforceRecord {
  Id: string;
  Name: string;
  Token__c?: string;
  userId__c?: string;
  Program_Registered_UID_PRE__c?: string;
  DP_Order_ID_PRE__c?: string;
  Student_Number__c?: string;
  Student_WhatsApp_Number__c?: string;
  PHONE_NUMBER__c?: string;
  Parent_Guardian_Phone_Number_PRE__c?: string;
  Email_PRE__c?: string;
  Program_PRE__c?: string;
  Product_Price__c?: number;
  Payment_Plan_Discount__c?: number;
  Total_Amount_PRE__c?: number;
  Amount_to_be_Receive__c?: number;
  Remaining_Amount_To_Be_Paid_PRE__c?: number;
  Amount_Payable_PRE__c?: number;
  Payment_Plan_PRE__c?: string;
  Current_Payment_Status__c?: string;
  Choose_NBFC_PRE__c?: string;
  Disbursed_NBFC_Name__c?: string;
  Total_Disbursed_Loan_Amount__c?: number;
  Total_Tenure_PRE__c?: number;
  Co_Applicant_Name__c?: string;
  Co_Applicant_Phone_Number_PRE__c?: string;
  Co_Applicant_Mail_ID_PRE__c?: string;
  Co_Applicant_Monthly_Income_PRE__c?: number;
  CIBIL_Score_Range_PRE__c?: string;
  KYC_Submission_Status_PRE__c?: string;
  KYC_Submitted__c?: boolean;
  Onboarding_Status__c?: string;
  Remarks_PRE__c?: string;
}

interface AdminRecordItem {
  record: SalesforceRecord;
  journey: any;
  portalUrl: string;
}

export const JOURNEY_STEPS = [
  { index: 1, name: 'Identity', route: 'auth' as PortalRoute },
  { index: 2, name: 'Program', route: 'program' as PortalRoute },
  { index: 3, name: 'Payment', route: 'pay' as PortalRoute },
  { index: 4, name: 'Co-Applicant', route: 'co-applicant' as PortalRoute },
  { index: 5, name: 'KYC', route: 'kyc' as PortalRoute },
  { index: 6, name: 'NBFC Review', route: 'nbfc-status' as PortalRoute },
  { index: 7, name: 'Class Access', route: 'class-access' as PortalRoute },
];

export function computeActiveStepIndex(record: SalesforceRecord, journey?: any): number {
  if (journey && journey.journey && typeof journey.journey.stepIndex === 'number') {
    return journey.journey.stepIndex;
  }

  const status = (record.Onboarding_Status__c || '').trim().toLowerCase();

  if (['full payment done', 'installments done', 'disbursed'].includes(status)) {
    return 7;
  }

  if (
    [
      'application in nbfc',
      'nbfc approved',
      'application submitted',
      'emi setup done',
      'not interested to shift nbfc',
    ].includes(status)
  ) {
    return 6;
  }

  if (
    ['yet to fill kyc', 'kyc pending', 'kyc submitted'].includes(status) ||
    record.KYC_Submitted__c ||
    (record.KYC_Submission_Status_PRE__c &&
      record.KYC_Submission_Status_PRE__c.toUpperCase() === 'SUBMITTED')
  ) {
    return 5;
  }

  if (
    status === 'co-applicant' ||
    record.Co_Applicant_Name__c ||
    record.Co_Applicant_Phone_Number_PRE__c
  ) {
    return 4;
  }

  if (
    ['yet to pay', 'payment pending'].includes(status) ||
    (record.Total_Amount_PRE__c && record.Total_Amount_PRE__c > 0) ||
    record.Current_Payment_Status__c === 'Success'
  ) {
    return 3;
  }

  if (
    [
      'yet to assign',
      'yet to contact',
      'manager approval pending',
      'yet to decide',
      'dependency',
      'will do later',
      'program selection',
    ].includes(status)
  ) {
    return 2;
  }

  return 2;
}

export function buildEnrollmentState(rec: SalesforceRecord, journeyData?: any): EnrollmentState {
  const canonical = journeyData?.journey || journeyData || {};
  const activeUid = rec.userId__c || rec.Program_Registered_UID_PRE__c || rec.Id;
  const activeToken = rec.Token__c || activeUid;

  const sfBaseFee = rec.Product_Price__c || canonical.program?.baseFee || 180000;
  const sfScholarship = rec.Payment_Plan_Discount__c ?? canonical.program?.scholarshipAmount ?? 0;
  const sfSeatPaid = rec.Total_Amount_PRE__c ?? canonical.program?.seatReservationPaid ?? 0;
  const sfAmountToBeReceived = rec.Amount_to_be_Receive__c ?? canonical.program?.amountToBeReceived ?? canonical.program?.amountPayable ?? rec.Amount_Payable_PRE__c ?? Math.max(0, sfBaseFee - sfScholarship);
  const sfRemainingAmount = rec.Remaining_Amount_To_Be_Paid_PRE__c ?? canonical.program?.remainingAmountPayable ?? 32000;

  return {
    journeyId: canonical.journeyId || activeUid,
    token: activeToken,
    learner: {
      name: canonical.learner?.name || rec.Name || 'Learner',
      mobileMasked: '••••••••••',
      emailMasked: canonical.learner?.emailMasked || rec.Email_PRE__c || '',
      preferredLanguage: canonical.learner?.preferredLanguage || 'English',
    },
    program: {
      name: canonical.program?.name || rec.Program_PRE__c || 'NxtWave Smart Program',
      price: sfAmountToBeReceived,
      amountPayable: sfAmountToBeReceived,
      baseFee: sfBaseFee,
      scholarshipAmount: sfScholarship,
      seatReservationPaid: sfSeatPaid,
      amountToBeReceived: sfAmountToBeReceived,
      remainingAmountPayable: sfRemainingAmount,
    },
    payment: {
      selectedMethod:
        canonical.financing && canonical.financing.status !== 'NOT_STARTED'
          ? 'NO_COST_EMI'
          : 'FULL_PAYMENT',
      status:
        canonical.payment?.status ||
        (rec.Total_Amount_PRE__c && rec.Total_Amount_PRE__c > 0 ? 'SUCCESS' : 'NOT_STARTED'),
      amountPaid: canonical.payment?.amountPaid || rec.Total_Amount_PRE__c || 0,
      receiptId: canonical.payment?.receiptId || rec.DP_Order_ID_PRE__c,
    },
    emi: {
      selected: false,
      amount: 0,
      tenure: '6 Months',
    },
    coApplicant: {
      exists: Boolean(canonical.coApplicant?.name || rec.Co_Applicant_Name__c),
      name: canonical.coApplicant?.name || rec.Co_Applicant_Name__c || '',
      relation: canonical.coApplicant?.relation || 'Parent',
      mobileMasked: '••••••••••',
    },
    kyc: {
      status:
        canonical.kyc?.status ||
        (rec.KYC_Submission_Status_PRE__c === 'SUBMITTED' || rec.KYC_Submitted__c
          ? 'SUBMITTED'
          : 'NOT_STARTED'),
      appointment: null,
    },
    financing: {
      applicationId: canonical.financing?.applicationId || rec.DP_Order_ID_PRE__c || 'N/A',
      lenderName:
        canonical.financing?.lenderName ||
        canonical.financing?.nbfcName ||
        rec.Choose_NBFC_PRE__c ||
        rec.Disbursed_NBFC_Name__c ||
        'Northern Arc',
      status: canonical.financing?.status || (rec.Disbursed_NBFC_Name__c ? 'DISBURSED' : 'NOT_STARTED'),
      appliedAmount: canonical.financing?.appliedAmount || 0,
      approvedAmount: canonical.financing?.approvedAmount || 0,
      rejectionReason: canonical.financing?.rejectionReason,
    },
    isAuthenticated: true,
    canonicalJourney: canonical.journey ? canonical : { journey: canonical },
  };
}

export const AdminPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Searched User Record
  const [selectedItem, setSelectedItem] = useState<AdminRecordItem | null>(null);
  const [previewRoute, setPreviewRoute] = useState<PortalRoute>('program');

  // Search by UID
  const handleUidSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      setError('Please enter a valid User UID or Salesforce ID');
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'UID Search failed');
      }

      if (!data.data || data.data.length === 0) {
        throw new Error(`No learner record found matching UID "${q}"`);
      }

      const matchedItem: AdminRecordItem = data.data[0];
      setSelectedItem(matchedItem);

      // Automatically jump to the exact step where progress is stopped
      const stoppedStepIndex = computeActiveStepIndex(matchedItem.record, matchedItem.journey);
      const matchedStep = JOURNEY_STEPS.find((s) => s.index === stoppedStepIndex);
      setPreviewRoute(matchedStep ? matchedStep.route : 'program');
    } catch (err: any) {
      setError(err.message || 'Error executing UID search');
      setSelectedItem(null);
    } finally {
      setIsSearching(false);
    }
  };

  // If a user record is found, immediately display their read-only User UI at the stopped stage
  if (selectedItem) {
    const rec = selectedItem.record;
    const activeUid = rec.userId__c || rec.Program_Registered_UID_PRE__c || rec.Id;
    const userState = buildEnrollmentState(rec, selectedItem.journey);
    const userToken = rec.Token__c || activeUid;
    const stoppedStepIndex = computeActiveStepIndex(rec, selectedItem.journey);
    const stoppedStepObj = JOURNEY_STEPS.find((s) => s.index === stoppedStepIndex);

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        {/* Sticky Top Admin Banner */}
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left Title & UID Metadata */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-400" />
                  <span>Search Another UID</span>
                </button>

                <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-white">{rec.Name || 'Learner'}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-400/30">
                      UID: {activeUid}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-[10px] border border-amber-400/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> READ-ONLY ADMIN VIEW
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>
                      Progress Stopped At:{' '}
                      <strong className="text-amber-400 font-bold">
                        Step {stoppedStepIndex}/7 ({stoppedStepObj?.name})
                      </strong>
                    </span>
                    <span>•</span>
                    <span>CRM Status: <strong className="text-blue-400">{rec.Onboarding_Status__c || 'In Progress'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Search Input inside Top Header */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUidSearch();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter UID..."
                    className="w-48 sm:w-64 pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 font-mono outline-none focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Load UID'}
                </button>
              </form>
            </div>

            {/* Stage Tabs (Defaults to Stopped Stage) */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
                Inspect Stage:
              </span>
              {JOURNEY_STEPS.map((step) => {
                const isActive = previewRoute === step.route;
                const isStoppedStage = step.index === stoppedStepIndex;

                return (
                  <button
                    key={step.index}
                    type="button"
                    onClick={() => setPreviewRoute(step.route)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-[#0B63E5] text-white font-bold shadow-xs'
                        : isStoppedStage
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/50 hover:bg-amber-900/60'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>Step {step.index}: {step.name}</span>
                    {isStoppedStage && (
                      <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-400 text-slate-950 font-bold">
                        STOPPED HERE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Read-Only Shield Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>
            <strong>Read-Only Mode Enforced:</strong> Displaying exact learner experience for UID{' '}
            <strong className="font-mono">{activeUid}</strong> at Step {stoppedStepIndex} ({stoppedStepObj?.name}). All user actions are disabled.
          </span>
        </div>

        {/* Rendered User UI Canvas */}
        <div className="pointer-events-none select-none opacity-95 flex-1">
          <NxtWaveHeader
            currentRoute={previewRoute}
            learnerName={userState.learner?.name || 'Learner'}
            onOpenSupport={() => {}}
          />

          <ProgressIndicator
            currentRoute={previewRoute}
            paymentMethod={userState.payment.selectedMethod}
          />

          <main className="py-4 sm:py-6 max-w-4xl mx-auto px-4">
            {previewRoute === 'auth' && (
              <AuthPage
                state={userState}
                token={userToken}
                onSuccess={() => {}}
                onTokenResolved={() => {}}
              />
            )}

            {previewRoute === 'program' && (
              <ProgramSummaryPage
                state={userState}
                onNext={() => {}}
                onBack={() => {}}
              />
            )}

            {previewRoute === 'payment' && (
              <PaymentMethodPage
                state={userState}
                token={userToken}
                onSelectMethod={() => {}}
                onBack={() => {}}
              />
            )}

            {previewRoute === 'pay' && (
              <PaymentLinkPage
                state={userState}
                token={userToken}
                onPaymentSuccess={() => {}}
                onBack={() => {}}
              />
            )}

            {previewRoute === 'co-applicant' && (
              <CoApplicantPage
                state={userState}
                token={userToken}
                onSuccess={() => {}}
                onBack={() => {}}
              />
            )}

            {previewRoute === 'kyc' && (
              <KycPage
                state={userState}
                token={userToken}
                onUpdateJourney={() => {}}
                onContinue={() => {}}
                onBack={() => {}}
                onSwitchToDirectPay={() => {}}
                onSwitchCoApplicant={() => {}}
              />
            )}

            {previewRoute === 'nbfc-status' && (
              <NbfcStatusPage
                state={userState}
                token={userToken}
                onUpdateJourney={() => {}}
                onComplete={() => {}}
                onBack={() => {}}
                onSwitchCoApplicant={() => {}}
                onSwitchToDirectPay={() => {}}
              />
            )}

            {previewRoute === 'class-access' && (
              <ClassAccessPage
                state={userState}
                token={userToken}
                onResetSession={() => {}}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Initial UID Search Input Screen (No Table, No Rows)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-[#0A192F] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B63E5] flex items-center justify-center font-bold text-white shadow-xs">
              NW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  NxtWave PRE Onboarding
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Learner UI Progress Inspector</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Read-Only Admin</span>
          </div>
        </div>
      </header>

      {/* Main Container - Centered Search Card */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B63E5] flex items-center justify-center mx-auto mb-6 shadow-xs border border-blue-100">
            <Search className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Inspect Learner Progress by UID
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Enter a learner&rsquo;s <strong>User ID (UUID)</strong>, <strong>Program Registered UID</strong>, or <strong>Salesforce ID</strong> to immediately display the exact user UI where their onboarding progress is stopped.
          </p>

          {/* UID Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUidSearch();
            }}
            className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Learner UID (e.g. 0531cc25-776d-4df4-9e7a-ee3d75f31e01)..."
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 font-mono text-sm focus:bg-white focus:border-[#0B63E5] focus:ring-4 focus:ring-blue-100 outline-none transition shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-8 py-4 bg-[#0B63E5] hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Inspect UI</span>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 max-w-xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Sample UID Pills */}
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mr-1">
              Sample UID Queries:
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('0531cc25-776d-4df4-9e7a-ee3d75f31e01');
                handleUidSearch('0531cc25-776d-4df4-9e7a-ee3d75f31e01');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0B63E5] text-slate-700 font-mono font-medium border border-slate-200 transition cursor-pointer"
            >
              0531cc25-776d-4df4-9e7a-ee3d75f31e01
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('339d457f-8e89-40f2-9d89-f415dc4fcf49');
                handleUidSearch('339d457f-8e89-40f2-9d89-f415dc4fcf49');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0B63E5] text-slate-700 font-mono font-medium border border-slate-200 transition cursor-pointer"
            >
              339d457f-8e89-40f2-9d89-f415dc4fcf49
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} NxtWave Disruptive Technologies • Admin UID Inspector</p>
      </footer>
    </div>
  );
};
