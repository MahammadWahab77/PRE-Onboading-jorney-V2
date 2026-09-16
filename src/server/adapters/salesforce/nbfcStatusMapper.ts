import type { NbfcStatus } from '../../../types/journey';
import type { SalesforceOnboardingRecord } from './types';

export interface MappedNbfcResult {
  status: NbfcStatus;
  statusLabel: string;
  lenderName: string;
  rejectionReason?: string;
  rejectionResolutionAction?:
    | 'CHANGE_CO_APPLICANT'
    | 'TRY_ALTERNATE_NBFC'
    | 'RETRY_DOCUMENTS'
    | 'CHANGE_PAYMENT_METHOD'
    | 'PRE_SUPPORT_REQUIRED';
}

/**
 * Maps heterogeneous lender stages into canonical NbfcStatus.
 */
export function mapNbfcStatus(record: SalesforceOnboardingRecord): MappedNbfcResult {
  const lender = record.Choose_NBFC_PRE__c || 'Northern Arc';

  let canonicalStatus: NbfcStatus = 'APPLICATION_CREATED';
  let label = 'Application Created';
  let rejectionReason: string | undefined;
  let resolutionAction: MappedNbfcResult['rejectionResolutionAction'];

  switch (lender) {
    case 'Northern Arc': {
      const stage = record.Northern_Arc_Overall_Stages__c || 'Application Form Filled';
      rejectionReason = record.Northern_Arc_Rejected_Reasons__c || record.Northern_Arc_Remarks__c;

      if (stage.includes('Loan Disbursed') || stage.includes('Disbursed')) {
        canonicalStatus = 'DISBURSED';
        label = 'Loan Disbursed';
      } else if (stage.includes('Disbursement Pending')) {
        canonicalStatus = 'DISBURSEMENT_PENDING';
        label = 'Disbursement Pending';
      } else if (stage.includes('EMI Setup Done') || stage.includes('Mandate Success')) {
        canonicalStatus = 'EMI_SETUP_COMPLETED';
        label = 'Auto-Debit Configured';
      } else if (stage.includes('EMI Setup Pending') || stage.includes('Mandate Pending')) {
        canonicalStatus = 'EMI_SETUP_PENDING';
        label = 'Auto-Debit Setup Pending';
      } else if (stage.includes('Loan Rejected') || stage.includes('Rejected')) {
        canonicalStatus = 'REJECTED';
        label = 'Application Not Approved';
      } else if (stage.includes('Loan Approved') || stage.includes('Approved')) {
        canonicalStatus = 'APPROVED';
        label = 'Loan Approved';
      } else if (stage.includes('Review In Progress') || stage.includes('Under Review')) {
        canonicalStatus = 'UNDER_REVIEW';
        label = 'Under Lender Review';
      } else if (stage.includes('KYC Done')) {
        canonicalStatus = 'KYC_COMPLETED';
        label = 'KYC Completed';
      } else if (stage.includes('KYC Pending')) {
        canonicalStatus = 'KYC_PENDING';
        label = 'KYC Verification Pending';
      } else {
        canonicalStatus = 'APPLICATION_CREATED';
        label = 'Application Created';
      }
      break;
    }

    case 'Fibe': {
      const stage = record.Fibe_Overall_Stages__c || record.Fibe_Overall_Loan_Status__c || 'LEAD_CREATED';
      if (stage === 'DISBURSED') {
        canonicalStatus = 'DISBURSED';
        label = 'Loan Disbursed';
      } else if (stage === 'NACH_PENDING') {
        canonicalStatus = 'EMI_SETUP_PENDING';
        label = 'NACH Mandate Pending';
      } else if (stage === 'APPROVED') {
        canonicalStatus = 'APPROVED';
        label = 'Loan Approved';
      } else if (stage === 'REJECTED') {
        canonicalStatus = 'REJECTED';
        label = 'Application Declined';
      } else if (stage === 'UNDERWRITING') {
        canonicalStatus = 'UNDER_REVIEW';
        label = 'Underwriting In Progress';
      } else if (stage === 'DOCS_PENDING') {
        canonicalStatus = 'DOCUMENTS_REQUIRED';
        label = 'Documents Pending';
      } else {
        canonicalStatus = 'APPLICATION_CREATED';
        label = 'Lead Created';
      }
      break;
    }

    case 'Finz': {
      const stage = record.Finz_Overall_Stages__c || 'INITIATED';
      if (stage === 'DISBURSED') {
        canonicalStatus = 'DISBURSED';
        label = 'Loan Disbursed';
      } else if (stage === 'MANDATE_PENDING') {
        canonicalStatus = 'EMI_SETUP_PENDING';
        label = 'Mandate Pending';
      } else if (stage === 'SANCTIONED') {
        canonicalStatus = 'APPROVED';
        label = 'Sanctioned';
      } else if (stage === 'DECLINED') {
        canonicalStatus = 'REJECTED';
        label = 'Declined';
      } else if (stage === 'IN_CREDIT_CHECK') {
        canonicalStatus = 'UNDER_REVIEW';
        label = 'Credit Check In Progress';
      } else if (stage === 'KYC_WAITING') {
        canonicalStatus = 'KYC_PENDING';
        label = 'Waiting for KYC';
      } else {
        canonicalStatus = 'APPLICATION_CREATED';
        label = 'Application Initiated';
      }
      break;
    }

    case 'Gyandhan': {
      const stage = record.Gyandhan_Overall_Stages__c || 'LEAD_SUBMITTED';
      if (stage === 'DISBURSED') {
        canonicalStatus = 'DISBURSED';
        label = 'Loan Disbursed';
      } else if (stage === 'DISBURSEMENT_INITIATED') {
        canonicalStatus = 'DISBURSEMENT_PENDING';
        label = 'Disbursement Initiated';
      } else if (stage === 'OFFER_ACCEPTED') {
        canonicalStatus = 'APPROVED';
        label = 'Offer Accepted & Approved';
      } else if (stage === 'REJECTED') {
        canonicalStatus = 'REJECTED';
        label = 'Application Rejected';
      } else if (stage === 'CREDIT_EVALUATION') {
        canonicalStatus = 'UNDER_REVIEW';
        label = 'Credit Evaluation';
      } else if (stage === 'DOCS_COLLECTED') {
        canonicalStatus = 'DOCUMENTS_SUBMITTED';
        label = 'Documents Submitted';
      } else {
        canonicalStatus = 'APPLICATION_CREATED';
        label = 'Lead Submitted';
      }
      break;
    }

    case 'Jodo': {
      const stage = record.JODO_NBFC_Status__c || 'DRAFT';
      if (stage === 'DISBURSED') {
        canonicalStatus = 'DISBURSED';
        label = 'Disbursed';
      } else if (stage === 'MANDATE_SUCCESS') {
        canonicalStatus = 'EMI_SETUP_COMPLETED';
        label = 'Mandate Registered';
      } else if (stage === 'APPROVED') {
        canonicalStatus = 'APPROVED';
        label = 'Approved';
      } else if (stage === 'REJECTED') {
        canonicalStatus = 'REJECTED';
        label = 'Rejected';
      } else if (stage === 'UNDER_REVIEW') {
        canonicalStatus = 'UNDER_REVIEW';
        label = 'Review In Progress';
      } else if (stage === 'KYC_PENDING') {
        canonicalStatus = 'KYC_PENDING';
        label = 'KYC Pending';
      } else {
        canonicalStatus = 'APPLICATION_CREATED';
        label = 'Application Draft';
      }
      break;
    }

    default:
      canonicalStatus = 'APPLICATION_CREATED';
      label = 'Application Created';
  }

  // Handle rejection resolution mapping
  if (canonicalStatus === 'REJECTED') {
    const reasonLower = (rejectionReason || '').toLowerCase();
    if (reasonLower.includes('cibil') || reasonLower.includes('credit score') || reasonLower.includes('income')) {
      resolutionAction = 'CHANGE_CO_APPLICANT';
    } else if (reasonLower.includes('pincode') || reasonLower.includes('geo') || reasonLower.includes('serviceable')) {
      resolutionAction = 'TRY_ALTERNATE_NBFC';
    } else if (reasonLower.includes('document') || reasonLower.includes('statement') || reasonLower.includes('blur')) {
      resolutionAction = 'RETRY_DOCUMENTS';
    } else {
      resolutionAction = 'CHANGE_CO_APPLICANT';
    }
  }

  return {
    status: canonicalStatus,
    statusLabel: label,
    lenderName: lender,
    rejectionReason,
    rejectionResolutionAction: resolutionAction,
  };
}
