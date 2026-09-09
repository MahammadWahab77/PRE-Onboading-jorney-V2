import React, { useState, useEffect, useCallback } from 'react';
import { getFullPaymentInfo } from '../../utils/paymentLinks';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  CreditCard,
  Building2,
  FileCheck,
  Send,
  X,
  Lock,
  ShieldCheck,
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
  Total_Amount_PRE__c?: number;
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
  { index: 1, name: 'Identity', key: 'identity' },
  { index: 2, name: 'Program', key: 'program' },
  { index: 3, name: 'Payment', key: 'payment' },
  { index: 4, name: 'Co-Applicant', key: 'co-applicant' },
  { index: 5, name: 'KYC', key: 'kyc' },
  { index: 6, name: 'NBFC Review', key: 'nbfc-review' },
  { index: 7, name: 'Class Access', key: 'class-access' },
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

export const AdminJourneyStepper: React.FC<{ activeIndex: number; currentStageName?: string }> = ({
  activeIndex,
  currentStageName,
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <span>Learner Journey Stages</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Step {activeIndex} of 7
          </span>
        </h4>
        {currentStageName && (
          <span className="text-xs font-mono text-slate-400">
            SF Stage: <strong className="text-blue-400">{currentStageName}</strong>
          </span>
        )}
      </div>

      <div className="space-y-2 font-mono text-xs">
        {JOURNEY_STEPS.map((step) => {
          const isCompleted = step.index < activeIndex;
          const isActive = step.index === activeIndex;
          const isUpcoming = step.index > activeIndex;

          return (
            <div
              key={step.index}
              className={`flex items-center justify-between py-2 px-3.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600/2 border border-blue-500/50 text-blue-200 font-semibold'
                  : isCompleted
                  ? 'bg-emerald-950/30 text-emerald-300/90'
                  : 'bg-slate-800/40 text-slate-400/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-sans font-medium">
                  Step {step.index} ({step.name})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {isCompleted && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    ✅ Completed
                  </span>
                )}
                {isActive && (
                  <span className="text-blue-400 flex items-center gap-1">
                    🔵 Active Current Step
                  </span>
                )}
                {isUpcoming && (
                  <span className="text-slate-400 flex items-center gap-1">
                    ⚪ Upcoming
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AdminRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminRecordItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [otpDispatchStatus, setOtpDispatchStatus] = useState<{
    phone?: string;
    otp?: string;
    loading?: boolean;
    success?: boolean;
    error?: string;
  } | null>(null);

  // Fetch recent records on mount
  const fetchRecent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/recent?limit=25');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load records');
      }
      setRecords(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Execute search query
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      fetchRecent();
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Search failed');
      }
      setRecords(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Search execution failed');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dispatch OTP without exposing unmasked phone in the frontend
  const handleSendOtp = async (identifier: string, name?: string) => {
    setOtpDispatchStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/send-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpDispatchStatus({
          loading: false,
          success: false,
          error: data.error || 'Dispatch failed',
        });
      } else {
        setOtpDispatchStatus({
          loading: false,
          phone: data.maskedPhone,
          otp: data.otp,
          success: true,
        });
      }
    } catch (err: any) {
      setOtpDispatchStatus({
        loading: false,
        success: false,
        error: err.message || 'Network error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
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
              <p className="text-xs text-slate-400">Live CRM UID Inspector & Admissions Tool</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PII Protection Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>PII Masked</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Salesforce Connected</span>
            </div>

            <button
              onClick={fetchRecent}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Learner Lookup by UID
            </h1>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Search live Salesforce CRM records across <strong>User ID (UUID)</strong>,{' '}
              <strong>Program Registered UID</strong>, <strong>Payment Order ID</strong>,{' '}
              <strong>Salesforce ID</strong>, or <strong>Mobile Number</strong>. All contact PII is strictly masked.
            </p>

            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by User ID (UUID), Program UID, Order ID, Phone, or Name..."
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:bg-white focus:border-[#0B63E5] focus:ring-3 focus:ring-blue-100 outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchRecent();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3.5 bg-[#0B63E5] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search</span>
              </button>
            </form>

            {/* Search Pills */}
            <div className="flex flex-wrap gap-2 mt-4 items-center text-xs text-slate-500">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Quick UID Queries:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('0531cc25-776d-4df4-9e7a-ee3d75f31e01');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer"
              >
                UID: 0531cc25...
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('339d457f-8e89-40f2-9d89-f415dc4fcf49');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer"
              >
                UID: 339d457f...
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('CCBP_PROD_');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition cursor-pointer"
              >
                Prefix: CCBP_PROD_
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xs font-semibold uppercase"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Results Count & Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-700">
            {isSearching ? (
              <span>Searching Salesforce...</span>
            ) : searchQuery ? (
              <span>
                Found <strong className="text-slate-900">{records.length}</strong> matching records for &ldquo;{searchQuery}&rdquo;
              </span>
            ) : (
              <span>
                Showing <strong className="text-slate-900">{records.length}</strong> recent onboardings
              </span>
            )}
          </div>
        </div>

        {/* Table of Records */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Learner / Contact</th>
                  <th className="py-3.5 px-4">UIDs & Identifiers</th>
                  <th className="py-3.5 px-4">Program & Fees</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">NBFC / Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B63E5] mb-2" />
                      <p>Loading live Salesforce records...</p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <p className="text-base font-semibold text-slate-700 mb-1">No records found</p>
                      <p className="text-xs text-slate-400">
                        Try searching with another UID, phone number, or student name.
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((item) => {
                    const rec = item.record;
                    const maskedPhone =
                      rec.Student_Number__c ||
                      rec.Student_WhatsApp_Number__c ||
                      rec.PHONE_NUMBER__c ||
                      rec.Parent_Guardian_Phone_Number_PRE__c ||
                      '';
                    const activeUid =
                      rec.userId__c || rec.Program_Registered_UID_PRE__c || rec.Id;
                    const portalHref = `/enrollment/${activeUid}/auth`;

                    return (
                      <tr
                        key={rec.Id}
                        className="hover:bg-slate-50/80 transition group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Learner Name & Masked Mobile */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-bold text-slate-900 group-hover:text-[#0B63E5] transition">
                            {rec.Name || 'Learner'}
                          </div>
                          {maskedPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>{maskedPhone}</span>
                            </div>
                          )}
                          {rec.Email_PRE__c && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span className="truncate">{rec.Email_PRE__c}</span>
                            </div>
                          )}
                        </td>

                        {/* UIDs & Order ID */}
                        <td className="py-4 px-4 align-top font-mono text-xs text-slate-600">
                          {rec.userId__c && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                                UID
                              </span>
                              <span className="truncate max-w-[150px]" title={rec.userId__c}>
                                {rec.userId__c}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(rec.userId__c!, `uid-${rec.Id}`);
                                }}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy UID"
                              >
                                {copiedId === `uid-${rec.Id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {rec.DP_Order_ID_PRE__c && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                DP
                              </span>
                              <span className="truncate max-w-[150px]">
                                {rec.DP_Order_ID_PRE__c}
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            SFID: {rec.Id}
                          </div>
                        </td>

                        {/* Program & Fees */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-slate-800 text-xs">
                            {rec.Program_PRE__c || 'Smart Program'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            Price: ₹{(rec.Product_Price__c || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                            Paid: ₹{(rec.Total_Amount_PRE__c || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="py-4 px-4 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              (rec.Total_Amount_PRE__c || 0) > 0 ||
                              rec.Current_Payment_Status__c === 'Success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {(rec.Total_Amount_PRE__c || 0) > 0 ? 'Down Payment Done' : 'Pending'}
                          </span>
                          {rec.Payment_Plan_PRE__c && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              {rec.Payment_Plan_PRE__c}
                            </div>
                          )}
                        </td>

                        {/* NBFC & Stage */}
                        <td className="py-4 px-4 align-top">
                          <div className="text-xs font-medium text-slate-700">
                            {rec.Choose_NBFC_PRE__c || rec.Disbursed_NBFC_Name__c || 'No NBFC chosen'}
                          </div>
                          {rec.Onboarding_Status__c && (
                            <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {rec.Onboarding_Status__c}
                            </span>
                          )}
                          {(() => {
                            const activeStepIndex = computeActiveStepIndex(rec, item.journey);
                            const activeStepObj = JOURNEY_STEPS.find((s) => s.index === activeStepIndex);
                            return (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                  <span>Step {activeStepIndex}/7</span>
                                  <span>•</span>
                                  <span>{activeStepObj?.name}</span>
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-4 px-4 align-top text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={portalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B63E5] hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                            title="Open Learner Portal in new tab"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              const fullUrl = `${window.location.origin}${portalHref}`;
                              copyToClipboard(fullUrl, `link-${rec.Id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                            title="Copy Portal URL"
                          >
                            {copiedId === `link-${rec.Id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detailed Record Inspector Modal (PII Masked) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B63E5] flex items-center justify-center font-bold text-white text-xs">
                  CRM
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedItem.record.Name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>SFID: {selectedItem.record.Id}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> PII Protected
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setOtpDispatchStatus(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Quick Actions Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Learner Portal Access
                  </div>
                  <div className="text-xs text-blue-700 font-mono">
                    {window.location.origin}
                    {selectedItem.portalUrl}/auth
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${selectedItem.portalUrl}/auth`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B63E5] hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs"
                  >
                    <span>Launch Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}${selectedItem.portalUrl}/auth`,
                        'modal-copy'
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {copiedId === 'modal-copy' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              {/* Visual 7-Stage Stepper Checklist */}
              <AdminJourneyStepper
                activeIndex={computeActiveStepIndex(selectedItem.record, selectedItem.journey)}
                currentStageName={selectedItem.record.Onboarding_Status__c || 'In Progress'}
              />

              {/* Trigger OTP Direct Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Direct WhatsApp Verification
                  </span>
                  {otpDispatchStatus?.loading && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Dispatching...
                    </span>
                  )}
                  {otpDispatchStatus?.success && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Sent OTP to {otpDispatchStatus.phone}:{' '}
                      <strong className="font-mono">{otpDispatchStatus.otp}</strong>
                    </span>
                  )}
                  {otpDispatchStatus?.error && (
                    <span className="text-xs text-red-600">{otpDispatchStatus.error}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Send the real WhatsApp OTP template message directly to the registered phone on file via Gallabox without exposing unmasked contact data.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={otpDispatchStatus?.loading}
                    onClick={() => {
                      const identifier =
                        selectedItem.record.userId__c || selectedItem.record.Id;
                      handleSendOtp(identifier, selectedItem.record.Name);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send WhatsApp OTP to Registered Number</span>
                  </button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Learner Info */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Learner Identity</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">Full Name</dt>
                      <dd className="text-slate-900 font-semibold">{selectedItem.record.Name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">User ID (UUID)</dt>
                      <dd className="font-mono text-slate-800 break-all">
                        {selectedItem.record.userId__c || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Program Registered UID</dt>
                      <dd className="font-mono text-slate-800 break-all">
                        {selectedItem.record.Program_Registered_UID_PRE__c || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1">
                        <span>Contact Mobile</span>
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      </dt>
                      <dd className="font-mono text-slate-900 font-semibold">
                        {selectedItem.record.Student_Number__c ||
                          selectedItem.record.Student_WhatsApp_Number__c ||
                          selectedItem.record.PHONE_NUMBER__c ||
                          'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1">
                        <span>Email</span>
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      </dt>
                      <dd className="text-slate-800">{selectedItem.record.Email_PRE__c || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Fees & Payment */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Program & Financials</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">Program</dt>
                      <dd className="text-slate-900 font-semibold">
                        {selectedItem.record.Program_PRE__c || 'NxtWave Smart Program'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Total Product Price</dt>
                      <dd className="text-slate-900 font-semibold">
                        ₹{(selectedItem.record.Product_Price__c || 0).toLocaleString('en-IN')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Amount Paid Till Now</dt>
                      <dd className="text-emerald-700 font-bold">
                        ₹{(selectedItem.record.Total_Amount_PRE__c || 0).toLocaleString('en-IN')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Remaining Amount</dt>
                      <dd className="text-slate-800">
                        ₹{(selectedItem.record.Remaining_Amount_To_Be_Paid_PRE__c || 0).toLocaleString('en-IN')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Payment Plan / Order ID</dt>
                      <dd className="font-mono text-slate-800">
                        {selectedItem.record.DP_Order_ID_PRE__c || selectedItem.record.Payment_Plan_PRE__c || 'N/A'}
                      </dd>
                    </div>
                    {(() => {
                      const fpInfo = getFullPaymentInfo(selectedItem.record.Program_PRE__c);
                      return (
                        <div className="pt-2 border-t border-slate-100">
                          <dt className="text-slate-400 font-medium">{fpInfo.label}</dt>
                          <dd className="mt-0.5">
                            <a
                              href={fpInfo.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0B63E5] hover:underline font-mono text-[11px] break-all inline-flex items-center gap-1"
                            >
                              <span>{fpInfo.link}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </dd>
                        </div>
                      );
                    })()}
                  </dl>
                </div>

                {/* Co-Applicant */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Co-Applicant Profile</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">Co-Applicant Name</dt>
                      <dd className="text-slate-900 font-semibold">
                        {selectedItem.record.Co_Applicant_Name__c || 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium flex items-center gap-1">
                        <span>Phone Number</span>
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      </dt>
                      <dd className="font-mono text-slate-800">
                        {selectedItem.record.Co_Applicant_Phone_Number_PRE__c || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Monthly Income</dt>
                      <dd className="text-slate-800 font-semibold">
                        {selectedItem.record.Co_Applicant_Monthly_Income_PRE__c
                          ? `₹${selectedItem.record.Co_Applicant_Monthly_Income_PRE__c.toLocaleString('en-IN')}`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">CIBIL Score Range</dt>
                      <dd className="text-slate-800">
                        {selectedItem.record.CIBIL_Score_Range_PRE__c || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* NBFC & KYC */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>NBFC & KYC Status</span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">Selected NBFC</dt>
                      <dd className="text-slate-900 font-semibold">
                        {selectedItem.record.Choose_NBFC_PRE__c ||
                          selectedItem.record.Disbursed_NBFC_Name__c ||
                          'None'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Disbursed Amount</dt>
                      <dd className="text-slate-800 font-semibold">
                        {selectedItem.record.Total_Disbursed_Loan_Amount__c
                          ? `₹${selectedItem.record.Total_Disbursed_Loan_Amount__c.toLocaleString('en-IN')}`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">KYC Submission Status</dt>
                      <dd className="text-slate-800">
                        {selectedItem.record.KYC_Submission_Status_PRE__c ||
                          (selectedItem.record.KYC_Submitted__c ? 'SUBMITTED' : 'NOT_STARTED')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">CRM Stage</dt>
                      <dd className="text-slate-800">
                        {selectedItem.record.Onboarding_Status__c || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Remarks if any */}
              {selectedItem.record.Remarks_PRE__c && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Counselor & System Remarks
                  </div>
                  <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedItem.record.Remarks_PRE__c}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setOtpDispatchStatus(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
