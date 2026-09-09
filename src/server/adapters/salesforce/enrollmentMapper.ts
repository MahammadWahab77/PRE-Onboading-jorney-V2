import type {
  EnrollmentJourney,
  PaymentMethod,
  PaymentStatus,
  KycStatus,
} from '../../../types/journey';
import type { SalesforceOnboardingRecord } from './types';
import { mapNbfcStatus } from './nbfcStatusMapper';
import { resolveJourneyState } from '../../orchestrator/journeyOrchestrator';
import {
  resolveSalesforceStage,
  logEnrollmentSync,
  STEP_DEFINITIONS,
} from '../../domain/salesforceStageMapper';
import { getFullPaymentLink } from '../../../utils/paymentLinks';

export function maskPhone(phone?: string | null): string {
  if (!phone) return '+91 ••••••••••';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 5) return '+91 ••••••••••';
  const lastFour = clean.slice(-4);
  const firstTwo = clean.slice(0, 2);
  return `+91 ${firstTwo}•••••${lastFour}`;
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '••••••@nxtwave.in';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || 'u'}•••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}

export function mapPaymentMethod(raw?: string | null): PaymentMethod | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('no-cost') || lower.includes('emi')) return 'NO_COST_EMI';
  if (lower.includes('credit')) return 'CREDIT_CARD';
  if (lower.includes('full')) return 'FULL_PAYMENT';
  return 'FULL_PAYMENT';
}

export function mapPaymentStatus(
  statusRaw?: string | null,
  isPaid?: boolean,
  amountPaid = 0,
  amountPayable = 0
): PaymentStatus {
  if (isPaid || (amountPayable > 0 && amountPaid >= amountPayable)) return 'SUCCESS';
  if (!statusRaw) return 'NOT_STARTED';
  const lower = statusRaw.toLowerCase();
  if (lower.includes('success') || lower.includes('paid')) return 'SUCCESS';
  if (lower.includes('pending') || lower.includes('initiated')) return 'PENDING';
  if (lower.includes('failed')) return 'FAILED';
  if (lower.includes('expired')) return 'EXPIRED';
  return 'NOT_STARTED';
}

export function mapKycStatus(record: SalesforceOnboardingRecord): KycStatus {
  const onboardingStatus = (record.Onboarding_Status__c || '').trim().toLowerCase();

  // Onboarding_Status__c picklist overrides
  if (onboardingStatus === 'kyc submitted') {
    return 'SUBMITTED';
  }
  if (
    onboardingStatus === 'application in nbfc' ||
    onboardingStatus === 'emi setup done' ||
    onboardingStatus === 'full payment done' ||
    onboardingStatus === 'installments done'
  ) {
    return 'VERIFIED';
  }

  const subStatus = (record.KYC_Submission_Status__c || record.KYC_Submission_Status_PRE__c || '').toUpperCase();
  const callStatus = (record.KYC_Call_Status_PRE__c || '').toUpperCase();

  if (subStatus === 'VERIFIED' || callStatus === 'COMPLETED' || callStatus === 'VERIFIED') {
    return 'VERIFIED';
  }
  if (subStatus === 'ACTION_REQUIRED' || record.Documents_Requested_By_Reps__c) {
    return 'ACTION_REQUIRED';
  }
  if (subStatus === 'SUBMITTED' || callStatus === 'SCHEDULED' || record.KYC_Submission_Date_and_Time__c) {
    return 'SUBMITTED';
  }
  if (subStatus === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }
  if (subStatus === 'FAILED' || callStatus === 'FAILED') {
    return 'FAILED';
  }
  return 'NOT_STARTED';
}

export function mapOnboardingStatusToRoute(onboardingStatus?: string | null): string | null {
  if (!onboardingStatus) return null;
  const status = onboardingStatus.trim().toLowerCase();
  switch (status) {
    case 'yet to fill kyc':
    case 'kyc submitted':
      return 'kyc';
    case 'application in nbfc':
      return 'nbfc-status';
    case 'emi setup done':
    case 'full payment done':
    case 'installments done':
    case 'disbursed':
      return 'class-access';
    case 'yet to pay':
      return 'pay';
    case 'yet to assign':
    case 'yet to contact':
    case 'manager approval pending':
    case 'yet to decide':
    case 'dependency':
    case 'will do later':
      return 'program';
    default:
      return null;
  }
}

/**
 * Transforms an Enterprise Salesforce Onboarding Record into the Canonical EnrollmentJourney.
 */
export function mapSalesforceToJourney(
  record: SalesforceOnboardingRecord,
  sessionToken: string
): EnrollmentJourney {
  const rawStudentName = record.Student_Name__c || record.Name;
  const learnerName =
    typeof rawStudentName === 'string'
      ? rawStudentName
      : typeof rawStudentName === 'object' && rawStudentName && (rawStudentName as any).name
      ? String((rawStudentName as any).name)
      : 'Learner';
  const firstName =
    typeof learnerName === 'string' && typeof learnerName.split === 'function'
      ? learnerName.split(' ')[0] || 'Learner'
      : 'Learner';

  const toNonNegativeAmount = (value?: number | null): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

  const sourceProductPrice = toNonNegativeAmount(record.Product_Price__c);
  const sourceTotalAmountPayable =
    toNonNegativeAmount(record.Total_Amount_to_be_Paid__c) ??
    toNonNegativeAmount(record.Amount_Payable_PRE__c);
  const sourceAmountPaid = toNonNegativeAmount(record.Amount_Paid_Till_Now_To_Nxtwave_PRE__c);
  const sourceRemainingAmount = toNonNegativeAmount(record.Remaining_Amount_To_Be_Paid_PRE__c);

  const productPrice = sourceProductPrice ?? 0;
  const totalAmountPayable = sourceTotalAmountPayable ?? 0;
  const amountPaid = sourceAmountPaid ?? 0;
  const calculatedRemainingAmount =
    sourceTotalAmountPayable !== undefined
      ? Math.max(0, totalAmountPayable - amountPaid)
      : undefined;
  const remainingAmount = sourceRemainingAmount ?? calculatedRemainingAmount;
  const amountToReceive =
    toNonNegativeAmount(record.Amount_to_be_Receive__c) ?? sourceTotalAmountPayable;
  const totalTenureMonths =
    typeof record.Total_Tenure_PRE__c === 'number' &&
    Number.isFinite(record.Total_Tenure_PRE__c) &&
    record.Total_Tenure_PRE__c > 0
      ? Math.round(record.Total_Tenure_PRE__c)
      : null;
  const estimatedMonthlyAmount =
    totalTenureMonths && remainingAmount !== undefined && remainingAmount > 0
      ? Math.round(remainingAmount / totalTenureMonths)
      : null;

  if (
    process.env.NODE_ENV !== 'production' &&
    sourceRemainingAmount !== undefined &&
    calculatedRemainingAmount !== undefined &&
    Math.abs(sourceRemainingAmount - calculatedRemainingAmount) > 1
  ) {
    console.warn('[EnrollmentFinance] Salesforce remaining amount differs from calculated remaining amount; using Salesforce value.', {
      recordId: record.Id,
      salesforceRemainingAmount: sourceRemainingAmount,
      calculatedRemainingAmount,
    });
  }

  const baseFee = productPrice;
  const scholarshipAmount =
    record.Scholarship_Amount__c || record.Merit_Scholarship_Amount_PRE__c || record.Payment_Plan_Discount__c || 0;
  const seatReservationPaid = toNonNegativeAmount(record.Seat_Reservation_Amount_Paid__c) ?? 0;
  const amountPayable = totalAmountPayable;

  const paymentMethod = mapPaymentMethod(record.Payment_Plan_PRE__c);
  const paymentStatus = mapPaymentStatus(
    record.Payment_Status__c || record.Current_Payment_Status__c,
    record.Payment_Done_PRE__c,
    amountPaid,
    amountPayable
  );

  const kycStatus = mapKycStatus(record);

  // Parse requested documents if any
  let requestedDocuments: string[] = [];
  if (record.Documents_Requested_By_Reps__c) {
    requestedDocuments = record.Documents_Requested_By_Reps__c
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  } else if (kycStatus === 'ACTION_REQUIRED') {
    requestedDocuments = ['Latest 3-Month Bank Statement (PDF)', 'Co-Applicant PAN Card Clear Photo'];
  }

  // Co-applicant mapping
  const hasCoApplicant = Boolean(
    record.Co_Applicant_Name__c && record.Co_Applicant_Phone_Number_PRE__c
  );
  const coApplicant = {
    completed: hasCoApplicant,
    relation: record.Relation_With_The_Co_Applicant_PRE__c || 'Father',
    name: record.Co_Applicant_Name__c || '',
    mobileMasked: maskPhone(record.Co_Applicant_Phone_Number_PRE__c),
    emailMasked: maskEmail(record.Co_Applicant_Mail_ID_PRE__c),
    age: record.Co_Applicant_Age_PRE__c || 48,
    employmentType: (record.Co_Applicant_Employment_Type_PRE__c as any) || 'Salaried',
    occupation: record.Co_Applicant_Occupation_PRE__c || 'Private Sector Employee',
    monthlyIncome: record.Co_Applicant_Monthly_Income_PRE__c || 55000,
    monthlyIncomeRange: record.Co_Applicant_Monthly_Income_Range_PRE__c || '₹50,000 - ₹75,000',
    cibilScoreRange: (record.CIBIL_Score_Range_PRE__c as any) || '750+',
    state: record.Co_Applicant_State_PRE__c || 'Telangana',
    address: record.Co_Applicant_Address_PRE__c || '',
    documentReadiness: {
      pan: true,
      aadhaarFront: true,
      aadhaarBack: true,
      bankStatement: true,
      incomeProof: true,
      employmentProof: true,
    },
  };

  // Financing / NBFC mapping. Salesforce remains authoritative for amounts and confirmed tenure.
  let financing;
  if (paymentMethod === 'NO_COST_EMI' || record.Applied_Loan_Amount__c) {
    const mappedNbfc = mapNbfcStatus(record);
    const appliedAmount = toNonNegativeAmount(record.Applied_Loan_Amount__c);
    const approvedAmount = toNonNegativeAmount(record.Effective_Approved_Amount__c);
    const confirmedTenureLabel = totalTenureMonths ? `${totalTenureMonths} Months` : undefined;
    const approvedOrLater = [
      'APPROVED',
      'EMI_SETUP_PENDING',
      'EMI_SETUP_COMPLETED',
      'DISBURSEMENT_PENDING',
      'DISBURSED',
    ].includes(mappedNbfc.status);

    financing = {
      applied: true,
      appliedAmount,
      nbfcName: mappedNbfc.lenderName || undefined,
      lenderName: mappedNbfc.lenderName || undefined,
      applicationId: record.NBFC_Application_ID_PRE__c || undefined,
      status: mappedNbfc.status,
      statusLabel: mappedNbfc.statusLabel,
      productPrice: sourceProductPrice,
      totalAmountPayable: sourceTotalAmountPayable,
      amountPaid,
      remainingAmount,
      amountToReceive,
      totalTenureMonths,
      estimatedMonthlyAmount,
      preferredTenureMonths: null,
      approvedAmount,
      approvedTenure: approvedOrLater ? confirmedTenureLabel : undefined,
      emiAmountMonthly: estimatedMonthlyAmount ?? undefined,
      emiTenure: confirmedTenureLabel,
      disbursedAmount: record.Disbursed_Amount_PRE__c,
      disbursedAt: record.Disbursed_Date_Time__c,
      rejectionReason: mappedNbfc.rejectionReason,
      rejectionResolutionAction: mappedNbfc.rejectionResolutionAction,
    };
  }

  // Class access
  const rawStatusLower = (record.Onboarding_Status__c || record.Northern_Arc_Overall_Stages__c || '').toLowerCase();
  const isEmiSetupDone = rawStatusLower.includes('emi setup done') || rawStatusLower.includes('mandate success');

  const isClassUnlocked =
    record.LMS_Access_Status__c === 'Active' ||
    (paymentMethod !== 'NO_COST_EMI' && paymentStatus === 'SUCCESS') ||
    financing?.status === 'DISBURSED' ||
    isEmiSetupDone;

  const classAccess = {
    status: (isClassUnlocked ? 'ACTIVE' : 'LOCKED') as 'ACTIVE' | 'LOCKED',
    lmsUrl: process.env.LMS_ACCESS_URL || record.LMS_Access_URL__c || 'https://learning.nxtwave.in',
    programTitle: record.Program_PRE__c || 'NxtWave Genius',
    batchStartDate: record.Batch_Start_Date__c || '15 September 2026',
    unlockedAt: isClassUnlocked ? new Date().toISOString() : undefined,
    supportUrl: process.env.SUPPORT_PORTAL_URL || 'https://help.nxtwave.in',
  };

  // Build draft journey for orchestrator resolution
  const draftJourney: EnrollmentJourney = {
    journeyId: record.Id,
    token: sessionToken,
    authenticated: Boolean(record.Authentication_Verified__c),
    learner: {
      name: learnerName,
      firstName,
      mobileMasked: maskPhone(
        record.Student_WhatsApp_Number__c ||
          record.Student_Number__c ||
          record.PHONE_NUMBER__c ||
          record.Parent_Guardian_Phone_Number_PRE__c
      ),
      emailMasked: maskEmail(record.Email_PRE__c),
      registrationId: record.Program_Registered_UID_PRE__c || record.userId__c || record.Name,
      preferredLanguage: (record.Preferred_Languages__c || record.Latest_Preferred_Language__c || 'English')
        .split(';')[0]
        .trim(),
    },
    program: {
      name: record.Program_PRE__c || 'Genius',
      code: 'GENIUS_PRE_2026',
      baseFee,
      scholarshipAmount,
      scholarshipType: 'Merit Scholarship',
      seatReservationPaid,
      amountPayable,
      totalProgramPrice: baseFee,
      currency: 'INR',
    },
    payment: {
      method: paymentMethod,
      status: paymentStatus,
      amountPaid: record.Amount_Paid_Till_Now_To_Nxtwave_PRE__c || 0,
      receiptId: record.Receipt_Id__c,
      paidAt: record.Payment_Date_Time__c,
      paymentUrl: getFullPaymentLink(record.Program_PRE__c),
    },
    coApplicant: hasCoApplicant ? coApplicant : undefined,
    kyc: {
      status: kycStatus,
      submittedAt: record.KYC_Submission_Date_and_Time__c,
      actionRequiredReason:
        record.ADDITIONAL_DETAILS_REQUIRED_PRE_PRE__c || record.Remarks_PRE__c,
      requestedDocuments,
    },
    financing,
    classAccess,
    journey: {
      currentStage: 'AUTHENTICATION',
      nextAction: 'VERIFY_MOBILE',
      progressPercent: 10,
      recommendedRoute: 'auth',
      lastUpdated: new Date().toISOString(),
    },
  };

  // 1. Resolve Salesforce Stage authoritative definition
  const sfResolved = resolveSalesforceStage(record.Onboarding_Status__c, record.Id);
  const sfStepIndex = sfResolved.stageDefinition.stepIndex;

  // Compute canonical journey stage & recommended route
  const resolution = resolveJourneyState(draftJourney);

  let recommendedRoute = resolution.recommendedRoute;

  // Primary: If Salesforce Onboarding_Status__c maps to a known step, use its canonical route as authoritative
  if (draftJourney.authenticated && sfResolved.isKnown) {
    if (!isClassUnlocked || sfResolved.stageDefinition.canonicalRoute === 'class-access') {
      recommendedRoute = sfResolved.stageDefinition.canonicalRoute as any;
    }
  }

  // Secondary: Allow Stage_PRE__c ONLY if Onboarding_Status__c is unknown and saved index is valid
  if (draftJourney.authenticated && record.Stage_PRE__c && !sfResolved.isKnown) {
    const saved = record.Stage_PRE__c.trim().toLowerCase();
    const routeToStepIndex: Record<string, number> = {
      auth: 1,
      program: 2,
      congratulations: 2,
      pay: 3,
      payment: 3,
      emi: 3,
      'co-applicant': 4,
      kyc: 5,
      'nbfc-status': 6,
      'nbfc-review': 6,
      'class-access': 7,
      'payment-success': 7,
    };
    const savedIndex = routeToStepIndex[saved];
    if (savedIndex !== undefined && savedIndex >= sfStepIndex) {
      if (!isClassUnlocked) {
        recommendedRoute = (saved === 'congratulations' ? 'program' : saved) as any;
      }
    }
  }

  // Structured logging for debug/sync auditing
  logEnrollmentSync({
    recordId: record.Id,
    salesforceStage: sfResolved.salesforceStage,
    normalizedStage: sfResolved.normalizedStage,
    resolvedStep: sfResolved.stageDefinition.stepId,
    active: true,
    routeBefore: record.Stage_PRE__c || 'N/A',
    routeAfter: recommendedRoute,
    lastModifiedDate: (record as any).LastModifiedDate || null,
  });

  draftJourney.journey = {
    currentStage: resolution.currentStage,
    nextAction: resolution.nextAction,
    progressPercent: resolution.progressPercent,
    recommendedRoute,
    resolvedStep: sfResolved.stageDefinition.stepId,
    completedSteps: sfResolved.stageDefinition.completedSteps,
    stepIndex: sfResolved.stageDefinition.stepIndex,
    lastUpdated: new Date().toISOString(),
  };

  return draftJourney;
}
