import type { NbfcStatus } from '../../types/journey';
import type { SalesforceOnboardingRecord } from '../adapters/salesforce/types';

export interface CadenceStageInfo {
  step: number;
  name: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface NormalizedNbfcStatusResponse {
  statusCode: NbfcStatus;
  statusLabel: string;
  activeLender: string;
  userMessage: string;
  guidanceMessage?: string;
  cadenceStep: number; // 1 = Consent/Initiation, 2 = Credit & Document Review, 3 = Sanction & Agreement, 4 = Auto-Debit Setup, 5 = Disbursed & Unlocked
  cadenceStages: CadenceStageInfo[];
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

export function getCadenceStages(activeStep: number, isRejected = false): CadenceStageInfo[] {
  return [
    {
      step: 1,
      name: 'Application & Consent',
      description: 'Educational EMI application initiated & consent link sent to co-applicant',
      isCompleted: activeStep > 1 && !isRejected,
      isCurrent: activeStep === 1 && !isRejected,
    },
    {
      step: 2,
      name: 'Document & Credit Review',
      description: 'Lender underwriting team reviews KYC, income details & credit bureau score',
      isCompleted: activeStep > 2 && !isRejected,
      isCurrent: activeStep === 2 && !isRejected,
    },
    {
      step: 3,
      name: 'Sanction & Video KYC',
      description: 'Loan sanctioned, digital agreement signing & quick Video KYC (if applicable)',
      isCompleted: activeStep > 3 && !isRejected,
      isCurrent: activeStep === 3 && !isRejected,
    },
    {
      step: 4,
      name: 'Auto-Debit (e-NACH) Setup',
      description: 'Our NBFC partner will connect with you to register monthly auto-debit (0% interest)',
      isCompleted: activeStep > 4 && !isRejected,
      isCurrent: activeStep === 4 && !isRejected,
    },
    {
      step: 5,
      name: 'Disbursement & Class Access',
      description: 'Facility disbursed directly to NxtWave and Genius LMS portal unlocked',
      isCompleted: activeStep === 5,
      isCurrent: activeStep === 5,
    },
  ];
}

/**
 * Resolves the active lender name:
 * 1. Disbursed_NBFC_Name__c (most authoritative — post-disbursal)
 * 2. Choose_NBFC_PRE__c (selected NBFC for active application)
 * 3. Child NBFC Name (e.g. from NBFC_Onboarding__c)
 * 4. "Finance partner is being assigned" fallback (never null/empty)
 */
export function resolveActiveLenderName(
  record?: Partial<SalesforceOnboardingRecord> | null,
  childRecord?: any | null
): string {
  if (!record && !childRecord) return FALLBACK_LENDER_NAME;
  const disbursed = (record?.Disbursed_NBFC_Name__c || '').trim();
  if (disbursed && disbursed.toLowerCase() !== 'null' && disbursed.toLowerCase() !== 'undefined') {
    return disbursed;
  }
  // 1. Authoritative: Active child record for this account (e.g. from NBFC_Onboarding__c)
  const childName = (childRecord?.Name || childRecord?.nbfcName || '').trim();
  if (childName && childName.toLowerCase() !== 'null' && childName.toLowerCase() !== 'undefined') {
    return childName;
  }
  // 2. Parent selection on Academy_Onboarding_PRE__c
  const chosen = (record?.Choose_NBFC_PRE__c || '').trim();
  if (chosen && chosen.toLowerCase() !== 'null' && chosen.toLowerCase() !== 'undefined') {
    return chosen;
  }
  return FALLBACK_LENDER_NAME;
}

/**
 * Normalizes heterogeneous Salesforce NBFC status fields into a canonical
 * user-facing status, messaging, ETA, CTA, and 5-stage cadence lifecycle.
 *
 * Inspects fields from both:
 * 1. Academy_Onboarding_PRE__c (Onboarding_Status__c, NBFC_Status__c, Status_Of_Decision_in_NBFC_PRE__c, etc.)
 * 2. NBFC_Onboarding__c child records (Northern_Arc_Overall_Stages__c, Gyandhan_Overall_Stages__c,
 *    Fibe_Overall_Stages__c, Auxilo_Overall_Stages__c, other_NBFC_PRE__c, etc.)
 */
export function normalizeNbfcStatus(
  record?: Partial<SalesforceOnboardingRecord> | null,
  childRecord?: any | null
): NormalizedNbfcStatusResponse {
  const activeLender = resolveActiveLenderName(record, childRecord);
  const lastUpdated = (record as any)?.LastModifiedDate || childRecord?.LastModifiedDate || new Date().toISOString();

  // Build composite raw status from all NBFC status fields on parent and child
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
    childRecord?.other_NBFC_PRE__c,
    childRecord?.Northern_Arc_Overall_Stages__c,
    childRecord?.Northern_Arc_Remarks__c,
    childRecord?.Gyandhan_Overall_Stages__c,
    childRecord?.Gyandhan_Sub_Status__c,
    childRecord?.Gyandhan_Remarks__c,
    childRecord?.Fibe_Overall_Stages__c,
    childRecord?.Fibe_Overall_Loan_Status__c,
    childRecord?.Fibe_Remarks__c,
    childRecord?.Auxilo_Overall_Stages__c,
    childRecord?.Techfino_Overall_Status__c,
    childRecord?.Bajaj_Overall_Status_Presa__c,
    childRecord?.NBFC_Stage_of_Reps__c,
    childRecord?.Application_Status_PRE__c,
    childRecord?.Post_Approval_Status_Pre__c,
    childRecord?.Post_Approval_For_NBFC_Pre__c,
  ].filter(Boolean);

  const rawStatus = rawParts.join(' | ').trim();
  const allLower = rawStatus.toLowerCase();

  // -------------------------------------------------------------
  // CADENCE STAGE 5: DISBURSED & UNLOCKED
  // -------------------------------------------------------------
  if (
    record?.LMS_Access_Status__c === 'Active' ||
    (typeof record?.Disbursed_Amount_PRE__c === 'number' && record.Disbursed_Amount_PRE__c > 0) ||
    allLower.includes('loan disbursed') ||
    allLower.includes('disbursed') ||
    allLower.includes('full payment done') ||
    allLower.includes('installments done')
  ) {
    return {
      statusCode: 'DISBURSED',
      statusLabel: 'Loan Disbursed & Classes Unlocked',
      activeLender,
      userMessage: `Your education financing has been fully disbursed by ${activeLender}. Your program curriculum and learner portal are now unlocked!`,
      guidanceMessage: 'You now have full access to your cohort, live classes, and curriculum modules. Welcome to NxtWave!',
      cadenceStep: 5,
      cadenceStages: getCadenceStages(5),
      callToAction: {
        label: 'Go to Class Access 🎉',
        action: 'GO_TO_CLASS_ACCESS',
        primary: true,
      },
      classAccessEta: 'Immediate (Active)',
      lastUpdated,
      rawStatus: rawStatus || 'Disbursed',
    };
  }

  // -------------------------------------------------------------
  // CADENCE STAGE 4: AUTO-DEBIT (e-NACH MANDATE) SETUP
  // -------------------------------------------------------------
  // A. Mandate / EMI Setup Completed
  if (
    allLower.includes('emi setup done') ||
    allLower.includes('mandate success') ||
    allLower.includes('mandate_success') ||
    allLower.includes('emandate done')
  ) {
    return {
      statusCode: 'EMI_SETUP_COMPLETED',
      statusLabel: 'Auto-Debit Configured (Finalizing Access)',
      activeLender,
      userMessage: `Congratulations! Your monthly auto-debit setup with ${activeLender} is confirmed. In 2-3 days we will complete the class access.`,
      guidanceMessage: 'In 2-3 days we will complete the class access and unlock your Genius LMS portal.',
      cadenceStep: 4,
      cadenceStages: getCadenceStages(4),
      callToAction: null,
      classAccessEta: 'In 2-3 days we will complete the class access',
      lastUpdated,
      rawStatus,
    };
  }

  // B. Mandate / EMI Setup in Progress / Pending
  if (
    allLower.includes('emi setup in progress') ||
    allLower.includes('emandate pending') ||
    allLower.includes('nach pending') ||
    allLower.includes('nach_pending') ||
    allLower.includes('mandate pending') ||
    allLower.includes('disbursement pending') ||
    allLower.includes('disbursement_pending')
  ) {
    return {
      statusCode: 'EMI_SETUP_PENDING',
      statusLabel: 'Auto-Debit (e-NACH Mandate) in Progress',
      activeLender,
      userMessage: `Your auto-debit authorization is currently being validated with your bank and ${activeLender}.`,
      guidanceMessage: 'Once your bank validates the mandate, your loan is sanctioned and your learning portal will unlock.',
      cadenceStep: 4,
      cadenceStages: getCadenceStages(4),
      callToAction: null,
      classAccessEta: 'Within 24 hours',
      lastUpdated,
      rawStatus,
    };
  }

  // C. Approved Ready for Mandate Setup
  if (
    allLower.includes('approved ready for emi setup') ||
    allLower.includes('approved ready for emi') ||
    allLower.includes('ready for emi setup') ||
    allLower.includes('approved- all post approval steps pending') ||
    allLower.includes('approved ready for emi setup')
  ) {
    return {
      statusCode: 'APPROVED',
      statusLabel: 'Loan Approved – Auto-Debit Setup',
      activeLender,
      userMessage: `Great news! Your 0% No-Cost EMI has been approved by ${activeLender}. Our NBFC partner will connect with you to set up your auto-debit (e-NACH).`,
      guidanceMessage: `Our NBFC partner ${activeLender} will connect with you to guide you through the auto-debit registration. No upfront charges or interest will be billed.`,
      cadenceStep: 4,
      cadenceStages: getCadenceStages(4),
      callToAction: null,
      classAccessEta: 'Within 24 hours after mandate setup',
      lastUpdated,
      rawStatus,
    };
  }

  // -------------------------------------------------------------
  // CADENCE STAGE 3: SANCTION & VIDEO KYC / AGREEMENT SIGNING
  // -------------------------------------------------------------
  if (
    allLower.includes('vkyc pending') ||
    allLower.includes('vkyc completed') ||
    allLower.includes('agreement signing') ||
    allLower.includes('e-signing done') ||
    allLower.includes('offer_accepted') ||
    allLower === 'approved' ||
    allLower === 'sanctioned' ||
    allLower === 'loan approved' ||
    (allLower.includes('approved') &&
      !allLower.includes('rejected') &&
      !allLower.includes('pending'))
  ) {
    return {
      statusCode: 'APPROVED',
      statusLabel: 'Loan Sanctioned – Final Verification',
      activeLender,
      userMessage: `Your financing application has been sanctioned by ${activeLender}. Our NBFC partner will connect with you for digital agreement signing and auto-debit setup.`,
      guidanceMessage: 'Keep your PAN card and Aadhaar-registered mobile handy for quick digital signing.',
      cadenceStep: 3,
      cadenceStages: getCadenceStages(3),
      callToAction: null,
      classAccessEta: 'Within 1–2 business days',
      lastUpdated,
      rawStatus,
    };
  }

  // -------------------------------------------------------------
  // REJECTED / ALTERNATIVE PARTNER REQUIRED
  // -------------------------------------------------------------
  if (
    allLower.includes('rejected') ||
    allLower.includes('declined') ||
    allLower.includes('dropped') ||
    allLower.includes('loan rejected') ||
    allLower.includes('not interested to shift nbfc')
  ) {
    return {
      statusCode: 'REJECTED',
      statusLabel: 'Evaluating Alternate Finance Partner',
      activeLender,
      userMessage: `Our initial lending partner was unable to approve this application under their criteria. Our dedicated admissions team is currently routing your file to an alternate partner.`,
      guidanceMessage: 'You can also nominate an alternate co-applicant with an active salary account or switch to direct fee payment anytime.',
      cadenceStep: 2,
      cadenceStages: getCadenceStages(2, true),
      callToAction: {
        label: 'Nominate Alternate Co-Applicant',
        action: 'CHANGE_CO_APPLICANT',
        primary: false,
      },
      classAccessEta: 'Evaluating alternate options',
      lastUpdated,
      rawStatus,
    };
  }

  // -------------------------------------------------------------
  // CADENCE STAGE 2: DOCUMENT & CREDIT REVIEW / UNDERWRITING
  // -------------------------------------------------------------
  // A. Documents Pending / Additional Details
  if (
    allLower.includes('documents pending') ||
    allLower.includes('docs pending') ||
    allLower.includes('document pending') ||
    allLower.includes('additional details required') ||
    allLower.includes('documents required') ||
    allLower.includes('bonafide pending')
  ) {
    return {
      statusCode: 'DOCUMENTS_REQUIRED',
      statusLabel: 'Additional Documents Required',
      activeLender,
      userMessage: `Our Team will connect with you for additional documents required by ${activeLender}.`,
      guidanceMessage: 'Our admissions desk will reach out via call or WhatsApp. Please keep your updated bank statement or ID proofs handy.',
      cadenceStep: 2,
      cadenceStages: getCadenceStages(2),
      callToAction: null,
      classAccessEta: 'Pending document verification',
      lastUpdated,
      rawStatus,
    };
  }

  // B. Credit Check / Underwriting Desk in Progress
  if (
    allLower.includes('under assessment') ||
    allLower.includes('underwriting') ||
    allLower.includes('credit verification') ||
    allLower.includes('credit review') ||
    allLower.includes('under credit review') ||
    allLower.includes('review in progress') ||
    allLower.includes('telereview') ||
    allLower.includes('pd pending') ||
    allLower.includes('approval pending') ||
    allLower.includes('internal hold') ||
    allLower.includes('sent for manual under writing') ||
    allLower.includes('in_credit_check')
  ) {
    return {
      statusCode: 'UNDER_REVIEW',
      statusLabel: 'Credit & Document Underwriting in Progress',
      activeLender,
      userMessage: `The credit verification desk at ${activeLender} is evaluating your co-applicant documentation and profile.`,
      guidanceMessage: 'Underwriting assessments are automated and usually completed within 24–48 hours. No action is required from your side.',
      cadenceStep: 2,
      cadenceStages: getCadenceStages(2),
      callToAction: {
        label: 'Refresh Status',
        action: 'REFRESH',
        primary: false,
      },
      classAccessEta: '2–3 business days',
      lastUpdated,
      rawStatus,
    };
  }

  // -------------------------------------------------------------
  // CADENCE STAGE 1: APPLICATION INITIATED & CONSENT
  // -------------------------------------------------------------
  // Matches: "Yet To Create Application", "Application in NBFC", "Choose Co-Applicant",
  // "Consent Pending", "Links Triggered", "Application Pending", etc.
  return {
    statusCode: 'APPLICATION_CREATED',
    statusLabel: 'Application Initiated with Partner Lender',
    activeLender,
    userMessage: `Your No-Cost EMI educational application has been created and initiated with ${activeLender}. Our admissions desk is coordinating the initial verification.`,
    guidanceMessage: `Your co-applicant may receive an SMS or WhatsApp link from ${activeLender} to confirm consent via OTP. Please ensure their phone is reachable.`,
    cadenceStep: 1,
    cadenceStages: getCadenceStages(1),
    callToAction: {
      label: 'Refresh Status',
      action: 'REFRESH',
      primary: false,
    },
    classAccessEta: '3–5 business days',
    lastUpdated,
    rawStatus: rawStatus || 'Application Initiated',
  };
}
