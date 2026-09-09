/**
 * Canonical Types for PRE Onboarding Journey V3
 * Unified domain representation of the learner enrollment journey.
 */

export type JourneyStage =
  | 'AUTHENTICATION'
  | 'ENROLLMENT_CONFIRMED'
  | 'PROGRAM_REVIEW'
  | 'PAYMENT_SELECTION'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'EMI_EXPLAINER'
  | 'CO_APPLICANT'
  | 'KYC'
  | 'NBFC_APPLICATION'
  | 'NBFC_REVIEW'
  | 'EMI_SETUP'
  | 'DISBURSEMENT'
  | 'CLASS_ACCESS'
  | 'COMPLETED';

export type JourneyNextAction =
  | 'VERIFY_MOBILE'
  | 'VIEW_PROGRAM'
  | 'SELECT_PAYMENT'
  | 'COMPLETE_PAYMENT'
  | 'SELECT_CO_APPLICANT'
  | 'COMPLETE_CO_APPLICANT'
  | 'COMPLETE_KYC'
  | 'SUBMIT_DOCUMENTS'
  | 'WAIT_FOR_NBFC'
  | 'CHANGE_CO_APPLICANT'
  | 'CHANGE_PAYMENT_METHOD'
  | 'COMPLETE_EMI_SETUP'
  | 'OPEN_CLASS_ACCESS'
  | 'CONTACT_SUPPORT'
  | 'NONE';

export type PaymentMethod = 'FULL_PAYMENT' | 'CREDIT_CARD' | 'NO_COST_EMI';

export type PaymentStatus =
  | 'NOT_STARTED'
  | 'METHOD_SELECTED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED';

export type KycStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ACTION_REQUIRED'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'FAILED';

export type NbfcStatus =
  | 'NOT_STARTED'
  | 'APPLICATION_CREATED'
  | 'KYC_PENDING'
  | 'KYC_COMPLETED'
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EMI_SETUP_PENDING'
  | 'EMI_SETUP_COMPLETED'
  | 'DISBURSEMENT_PENDING'
  | 'DISBURSED';

export type ClassAccessStatus = 'LOCKED' | 'PENDING' | 'ACTIVE';

export type PortalRoute =
  | 'auth'
  | 'congratulations'
  | 'program'
  | 'payment'
  | 'pay'
  | 'payment-success'
  | 'emi'
  | 'co-applicant'
  | 'kyc'
  | 'nbfc-status'
  | 'class-access';

export interface LearnerProfile {
  name: string;
  firstName: string;
  mobileMasked: string;
  emailMasked?: string;
  registrationId?: string;
  preferredLanguage?: string;
}

export interface ProgramDetails {
  name: string;
  code: string;
  baseFee: number;
  scholarshipAmount: number;
  scholarshipType?: string;
  seatReservationPaid: number;
  amountPayable: number;
  totalProgramPrice: number;
  currency: string;
}

export interface PaymentDetails {
  method: PaymentMethod | null;
  status: PaymentStatus;
  amountPaid: number;
  receiptId?: string;
  paidAt?: string;
  paymentUrl?: string;
}

export interface CoApplicantDetails {
  completed: boolean;
  relation?: string;
  name?: string;
  mobileMasked?: string;
  emailMasked?: string;
  age?: number;
  employmentType?: 'Salaried' | 'Self Employed' | 'Business' | 'Other';
  occupation?: string;
  companyName?: string;
  employmentDurationYears?: number;
  monthlyIncome?: number;
  monthlyIncomeRange?: string;
  cibilScoreRange?: '750+' | '700 - 749' | '650 - 699' | 'Below 650' | 'Don’t Know';
  state?: string;
  address?: string;
  bankName?: string;
  documentReadiness?: {
    pan: boolean;
    aadhaarFront: boolean;
    aadhaarBack: boolean;
    bankStatement: boolean;
    incomeProof: boolean;
    employmentProof: boolean;
  };
}

export interface KycDetails {
  status: KycStatus;
  currentStep?: string;
  submittedAt?: string;
  verifiedAt?: string;
  actionRequiredReason?: string;
  requestedDocuments?: string[];
  notes?: string;
}

export interface FinancingDetails {
  applied: boolean;
  appliedAmount?: number;
  nbfcName?: string;
  lenderName?: string;
  applicationId?: string;
  status: NbfcStatus;
  statusLabel: string;

  // Salesforce-driven learner financing amounts. Unknown values stay undefined/null.
  productPrice?: number;
  totalAmountPayable?: number;
  amountPaid?: number;
  remainingAmount?: number;
  amountToReceive?: number;
  totalTenureMonths?: number | null;
  estimatedMonthlyAmount?: number | null;
  preferredTenureMonths?: number | null;

  // Existing NBFC lifecycle fields retained for downstream status/class-access flows.
  approvedAmount?: number;
  approvedTenure?: string;
  emiAmountMonthly?: number;
  emiTenure?: string;
  disbursedAmount?: number;
  disbursedAt?: string;
  emiSetupCompletedAt?: string;
  rejectionReason?: string;
  coApplicantName?: string;
  coApplicantRelationship?: string;
  coApplicantPhone?: string;
  rejectionResolutionAction?:
    | 'CHANGE_CO_APPLICANT'
    | 'TRY_ALTERNATE_NBFC'
    | 'RETRY_DOCUMENTS'
    | 'CHANGE_PAYMENT_METHOD'
    | 'PRE_SUPPORT_REQUIRED';
}

export interface ClassAccessDetails {
  status: ClassAccessStatus;
  lmsUrl?: string;
  programTitle: string;
  batchStartDate?: string;
  unlockedAt?: string;
  supportUrl?: string;
}

export interface JourneyMeta {
  currentStage: JourneyStage;
  nextAction: JourneyNextAction;
  progressPercent: number;
  recommendedRoute: PortalRoute;
  resolvedStep?: string;
  completedSteps?: string[];
  stepIndex?: number;
  lastUpdated: string;
}

export interface EnrollmentJourney {
  journeyId: string;
  token: string;
  authenticated: boolean;
  authentication?: { verified: boolean };
  learner: LearnerProfile;
  program: ProgramDetails;
  payment: PaymentDetails;
  coApplicant?: CoApplicantDetails;
  kyc: KycDetails;
  financing?: FinancingDetails;
  classAccess: ClassAccessDetails;
  journey: JourneyMeta;
}

export interface JourneyResolution {
  currentStage: JourneyStage;
  nextAction: JourneyNextAction;
  progressPercent: number;
  recommendedRoute: PortalRoute;
}

export interface SupportTicketPayload {
  category:
    | 'Class Access Issue'
    | 'Payment Issue'
    | 'EMI Issue'
    | 'KYC Issue'
    | 'NBFC Issue'
    | 'Other';
  description: string;
  token: string;
  learnerName?: string;
  contactNumber?: string;
}
