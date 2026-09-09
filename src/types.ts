/**
 * Central TypeScript Type Definitions for NxtWave PRE Learner Portal
 * Re-exports canonical journey types and maintains backward-compatibility aliases.
 */

export * from './types/journey';

import type {
  PaymentMethod,
  PaymentStatus,
  KycStatus,
  PortalRoute as CanonicalPortalRoute,
  EnrollmentJourney,
  FinancingDetails,
} from './types/journey';

// Backward compatibility types
export type PaymentMethodType = PaymentMethod;
export type PaymentStatusType = PaymentStatus;
export type KycStatusType = KycStatus;

export interface LearnerInfo {
  name?: string;
  mobileMasked: string;
  emailMasked?: string;
  preferredLanguage?: string;
}

export interface ProgramInfo {
  name: string;
  price: number;
  amountPayable: number;
  baseFee?: number;
  scholarshipAmount?: number;
  seatReservationPaid?: number;
}

export interface PaymentState {
  selectedMethod: PaymentMethod | null;
  status: PaymentStatus;
  amountPaid: number;
  receiptId?: string;
  paidAt?: string;
}

export interface EmiState {
  selected: boolean;
  amount: number;
  tenure: string | null;
  preferredTenureMonths?: number | null;
}

export interface CoApplicantState {
  exists: boolean;
  name: string;
  relation: string;
  mobileMasked: string;
  employmentType?: string;
  monthlyIncomeRange?: string;
  cibilScoreRange?: string;
}

export interface KycAppointment {
  slotId?: string;
  dateLabel?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  coApplicantName?: string;
  coApplicantRelation?: string;
}

export interface KycState {
  status: KycStatus;
  appointment?: KycAppointment | null;
  actionRequiredReason?: string;
  requestedDocuments?: string[];
  notes?: string;
}

export interface KycSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  dateLabel: string;
  available: boolean;
}

export interface EnrollmentState {
  journeyId: string;
  token: string;
  learner: LearnerInfo;
  program: ProgramInfo;
  payment: PaymentState;
  emi: EmiState;
  coApplicant: CoApplicantState;
  kyc: KycState;
  financing?: FinancingDetails;
  isAuthenticated: boolean;
  canonicalJourney?: EnrollmentJourney;
}

// Ensure PortalRoute covers all V3 routes plus legacy routes
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
  | 'class-access'
  | 'kyc-slot'
  | 'kyc-readiness'
  | 'kyc-confirmation';
