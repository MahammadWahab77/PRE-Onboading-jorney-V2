import type { NbfcStatus } from '../../types/journey';
import type { SalesforceOnboardingRecord } from '../adapters/salesforce/types';

export interface NormalizedNbfcStatusResponse {
  statusCode: NbfcStatus;
  statusLabel: string;
  activeLender: string;
  userMessage: string;
  callToAction: {
    label: string;
    action: 'SETUP_EMI' | 'RETRY_DOCUMENTS' | 'CHANGE_CO_APPLICANT' | 'GO_TO_CLASS_ACCESS' | 'REFRESH' | 'NONE';
    primary: boolean;
  } | null;
  classAccessEta: string | null;
  lastUpdated: string;
  rawStatus: string | null;
}

export const FALLBACK_LENDER_NAME = 'Finance partner is being assigned';

/**
 * Resolves the active lender name:
 * 1. Disbursed_NBFC_Name__c (most authoritative — post-disbursal)
 * 2. Choose_NBFC_PRE__c (selected NBFC for active application)
 * 3. "Finance partner is being assigned" fallback (never null/empty)
 */
export function resolveActiveLenderName(record?: Partial<SalesforceOnboardingRecord> | null): string {
  if (!record) return FALLBACK_LENDER_NAME;
  const disbursed = (record.Disbursed_NBFC_Name__c || '').trim();
  if (disbursed && disbursed.toLowerCase() !== 'null' && disbursed.toLowerCase() !== 'undefined') {
    return disbursed;
  }
  const chosen = (record.Choose_NBFC_PRE__c || '').trim();
  if (chosen && chosen.toLowerCase() !== 'null' && chosen.toLowerCase() !== 'undefined') {
    return chosen;
  }
  return FALLBACK_LENDER_NAME;
}

/**
 * Normalizes heterogeneous Salesforce NBFC status fields into a canonical
 * user-facing status, messaging, ETA, and CTA.
 *
 * Handles exact Salesforce strings including:
 *   "NBFC Status: Approved Ready For EMI Setup"
 *   "NBFC Status: EMI Setup in Progress"
 *   "NBFC Status: Documents Pending"
 *   "NBFC Status: Rejected"
 *
 * When NBFC was rejected, shows "We are checking another finance option for you"
 * rather than a hard failure screen.
 */
export function normalizeNbfcStatus(record?: Partial<SalesforceOnboardingRecord> | null): NormalizedNbfcStatusResponse {
  const activeLender = resolveActiveLenderName(record);
  const lastUpdated = (record as any)?.LastModifiedDate || new Date().toISOString();

  // Build composite raw status from all NBFC status fields (for matching)
  const rawParts = [
    record?.Onboarding_Status__c,
    record?.Jodo_Status__c,
    record?.NBFC_Status__c,
    record?.Status_Of_Decision_in_NBFC_PRE__c,
    record?.Northern_Arc_Overall_Stages__c,
    record?.Fibe_Overall_Stages__c,
    (record as any)?.Fibe_Overall_Loan_Status__c,
    record?.Finz_Overall_Stages__c,
    record?.Gyandhan_Overall_Stages__c,
    record?.JODO_NBFC_Status__c,
  ].filter(Boolean);

  const rawStatus = rawParts.join(' | ').trim();
  const allLower = rawStatus.toLowerCase();

  // 1. DISBURSED (highest priority — class access already active)
  if (
    record?.LMS_Access_Status__c === 'Active' ||
    (typeof record?.Disbursed_Amount_PRE__c === 'number' && record.Disbursed_Amount_PRE__c > 0) ||
    allLower.includes('disbursed')
  ) {
    return {
      statusCode: 'DISBURSED',
      statusLabel: 'Loan Disbursed',
      activeLender,
      userMessage: `Your education financing has been fully disbursed by ${activeLender}. Your program classes and learning portal are now unlocked!`,
      callToAction: null,
      classAccessEta: 'Immediate (Active)',
      lastUpdated,
      rawStatus: rawStatus || 'Disbursed',
    };
  }

  // 2. APPROVED READY FOR EMI SETUP
  //    Matches: "NBFC Status: Approved Ready For EMI Setup", "Loan Approved", "Approved", etc.
  if (
    allLower.includes('approved ready for emi setup') ||
    allLower.includes('approved ready for emi') ||
    allLower.includes('ready for emi setup') ||
    allLower.includes('offer_accepted')
  ) {
    return {
      statusCode: 'APPROVED',
      statusLabel: 'Loan Approved – Ready for EMI Setup',
      activeLender,
      userMessage: `Congratulations! Your financing application is approved by ${activeLender}. Please authorize auto-debit (e-NACH Mandate) to activate your enrollment.`,
      callToAction: {
        label: 'Continue EMI Setup',
        action: 'SETUP_EMI',
        primary: true,
      },
      classAccessEta: 'Within 2–3 days after EMI setup',
      lastUpdated,
      rawStatus,
    };
  }

  // Generic approved (lender-level stage: "Loan Approved", "Approved", "Sanctioned", "APPROVED")
  if (
    allLower === 'loan approved' ||
    allLower === 'approved' ||
    allLower === 'sanctioned' ||
    (allLower.includes('approved') &&
      !allLower.includes('emi setup') &&
      !allLower.includes('documents') &&
      !allLower.includes('rejected') &&
      !allLower.includes('pending'))
  ) {
    return {
      statusCode: 'APPROVED',
      statusLabel: 'Loan Approved – Ready for EMI Setup',
      activeLender,
      userMessage: `Congratulations! Your financing application is approved by ${activeLender}. Please set up your auto-debit (e-NACH Mandate) to complete enrollment.`,
      callToAction: {
        label: 'Continue EMI Setup',
        action: 'SETUP_EMI',
        primary: true,
      },
      classAccessEta: 'Within 2–3 days after EMI setup',
      lastUpdated,
      rawStatus,
    };
  }

  // 3. EMI SETUP DONE / MANDATE SUCCESS (Class Access Granted)
  if (
    allLower.includes('emi setup done') ||
    allLower.includes('mandate success') ||
    allLower.includes('mandate_success')
  ) {
    return {
      statusCode: 'EMI_SETUP_COMPLETED',
      statusLabel: 'EMI Setup Completed (Class Access Granted)',
      activeLender,
      userMessage: `Congratulations! Your EMI auto-debit setup with ${activeLender} is complete and your class access has been granted! 🎉`,
      callToAction: {
        label: 'Go to Class Access 🎉',
        action: 'GO_TO_CLASS_ACCESS',
        primary: true,
      },
      classAccessEta: 'Class Access Granted 🎉',
      lastUpdated,
      rawStatus,
    };
  }

  // 4. EMI SETUP IN PROGRESS
  if (
    allLower.includes('emi setup in progress') ||
    allLower.includes('mandate pending') ||
    allLower.includes('nach_pending') ||
    allLower.includes('disbursement pending') ||
    allLower.includes('disbursement_pending')
  ) {
    return {
      statusCode: 'EMI_SETUP_COMPLETED',
      statusLabel: 'EMI Setup in Progress',
      activeLender,
      userMessage: `Your auto-debit mandate is being verified by ${activeLender}. Class access will be granted shortly.`,
      callToAction: null,
      classAccessEta: 'Within 24 hours',
      lastUpdated,
      rawStatus,
    };
  }

  // 4. DOCUMENTS PENDING
  //    Matches: "NBFC Status: Documents Pending", "Docs Pending", "DOCS_PENDING", "Additional Details Required"
  if (
    allLower.includes('documents pending') ||
    allLower.includes('docs pending') ||
    allLower.includes('document pending') ||
    allLower.includes('docs_pending') ||
    allLower.includes('additional details required') ||
    allLower.includes('documents required') ||
    allLower.includes('kyc_waiting')
  ) {
    return {
      statusCode: 'DOCUMENTS_REQUIRED',
      statusLabel: 'Additional Documents Required',
      activeLender,
      userMessage: 'Additional verification documents are required to complete your financing approval. Please upload the requested documents promptly.',
      callToAction: {
        label: 'Upload Required Documents',
        action: 'RETRY_DOCUMENTS',
        primary: true,
      },
      classAccessEta: 'Pending document verification',
      lastUpdated,
      rawStatus,
    };
  }

  // 5. REJECTED — show Alternative NBFC in Progress (NOT a hard failure)
  //    Matches: "NBFC Status: Rejected", "Loan Rejected", "Rejected", "Declined", "REJECTED", "DECLINED"
  if (
    allLower.includes('rejected') ||
    allLower.includes('declined') ||
    allLower.includes('loan rejected')
  ) {
    return {
      statusCode: 'REJECTED',
      statusLabel: 'Alternative Finance Partner in Progress',
      activeLender,
      userMessage: 'We are checking another finance option for you. Our admissions desk is routing your application to an alternate lending partner.',
      callToAction: {
        label: 'Change Co-Applicant / Explore Options',
        action: 'CHANGE_CO_APPLICANT',
        primary: false,
      },
      classAccessEta: 'Evaluating alternate finance options',
      lastUpdated,
      rawStatus,
    };
  }

  // 6. UNDER REVIEW / PROCESSING — reassuring fallback for any intermediate / unmapped state
  return {
    statusCode: 'UNDER_REVIEW',
    statusLabel: 'Finance Application Processing',
    activeLender,
    userMessage: "We're processing your finance application with our lending partner. Status updates will appear here automatically.",
    callToAction: {
      label: 'Refresh Status',
      action: 'REFRESH',
      primary: false,
    },
    classAccessEta: '3–5 business days',
    lastUpdated,
    rawStatus: rawStatus || 'Application Under Review',
  };
}
