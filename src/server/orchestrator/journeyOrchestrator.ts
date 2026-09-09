import type {
  JourneyStage,
  JourneyNextAction,
  PortalRoute,
  JourneyResolution,
  EnrollmentJourney,
} from '../../types/journey';

/**
 * Pure business function to resolve a learner's canonical journey state.
 * Evaluates the authoritative state and returns stage, action, progress %, and recommended route.
 */
export function resolveJourneyState(journey: EnrollmentJourney): JourneyResolution {
  // 1. Authentication Check
  if (!journey.authenticated) {
    return {
      currentStage: 'AUTHENTICATION',
      nextAction: 'VERIFY_MOBILE',
      progressPercent: 10,
      recommendedRoute: 'auth',
    };
  }

  const payment = journey.payment;
  const isEmi = payment.method === 'NO_COST_EMI';
  const isDirectPay = payment.method === 'FULL_PAYMENT' || payment.method === 'CREDIT_CARD';

  // 2. Class Access Check (Highest precedence if active)
  if (journey.classAccess?.status === 'ACTIVE') {
    return {
      currentStage: 'CLASS_ACCESS',
      nextAction: 'OPEN_CLASS_ACCESS',
      progressPercent: 100,
      recommendedRoute: 'class-access',
    };
  }

  // 3. Direct Payment Journey Flow
  if (isDirectPay) {
    if (payment.status === 'SUCCESS' || payment.amountPaid >= journey.program.amountPayable) {
      return {
        currentStage: 'PAYMENT_COMPLETED',
        nextAction: 'OPEN_CLASS_ACCESS',
        progressPercent: 90,
        recommendedRoute: 'payment-success',
      };
    }

    return {
      currentStage: 'PAYMENT_PENDING',
      nextAction: 'COMPLETE_PAYMENT',
      progressPercent: 50,
      recommendedRoute: 'pay',
    };
  }

  // 4. EMI Journey Flow
  if (isEmi) {
    const coApplicant = journey.coApplicant;
    const kyc = journey.kyc;
    const financing = journey.financing;

    // A. Co-Applicant details required
    if (!coApplicant || !coApplicant.completed) {
      return {
        currentStage: 'CO_APPLICANT',
        nextAction: 'COMPLETE_CO_APPLICANT',
        progressPercent: 35,
        recommendedRoute: 'co-applicant',
      };
    }

    // B. KYC Stage (Not Verified)
    if (!kyc || kyc.status !== 'VERIFIED') {
      if (kyc?.status === 'ACTION_REQUIRED') {
        return {
          currentStage: 'KYC',
          nextAction: 'SUBMIT_DOCUMENTS',
          progressPercent: 48,
          recommendedRoute: 'kyc',
        };
      }
      if (kyc?.status === 'SUBMITTED' || kyc?.status === 'IN_PROGRESS') {
        return {
          currentStage: 'KYC',
          nextAction: 'WAIT_FOR_NBFC',
          progressPercent: 52,
          recommendedRoute: 'kyc',
        };
      }
      return {
        currentStage: 'KYC',
        nextAction: 'COMPLETE_KYC',
        progressPercent: 45,
        recommendedRoute: 'kyc',
      };
    }

    // C. NBFC Financing Stage
    if (financing) {
      if (financing.status === 'DISBURSED') {
        return {
          currentStage: 'CLASS_ACCESS',
          nextAction: 'OPEN_CLASS_ACCESS',
          progressPercent: 95,
          recommendedRoute: 'class-access',
        };
      }

      if (financing.status === 'DISBURSEMENT_PENDING') {
        return {
          currentStage: 'DISBURSEMENT',
          nextAction: 'WAIT_FOR_NBFC',
          progressPercent: 90,
          recommendedRoute: 'nbfc-status',
        };
      }

      if (financing.status === 'EMI_SETUP_COMPLETED') {
        return {
          currentStage: 'DISBURSEMENT',
          nextAction: 'WAIT_FOR_NBFC',
          progressPercent: 85,
          recommendedRoute: 'nbfc-status',
        };
      }

      if (financing.status === 'EMI_SETUP_PENDING') {
        return {
          currentStage: 'EMI_SETUP',
          nextAction: 'COMPLETE_EMI_SETUP',
          progressPercent: 78,
          recommendedRoute: 'nbfc-status',
        };
      }

      if (financing.status === 'REJECTED') {
        const action =
          financing.rejectionResolutionAction === 'CHANGE_PAYMENT_METHOD'
            ? 'CHANGE_PAYMENT_METHOD'
            : 'CHANGE_CO_APPLICANT';
        return {
          currentStage: 'NBFC_REVIEW',
          nextAction: action,
          progressPercent: 60,
          recommendedRoute: 'nbfc-status',
        };
      }

      if (financing.status === 'DOCUMENTS_REQUIRED') {
        return {
          currentStage: 'NBFC_REVIEW',
          nextAction: 'SUBMIT_DOCUMENTS',
          progressPercent: 62,
          recommendedRoute: 'nbfc-status',
        };
      }

      if (financing.status === 'APPROVED') {
        return {
          currentStage: 'NBFC_REVIEW',
          nextAction: 'COMPLETE_EMI_SETUP',
          progressPercent: 75,
          recommendedRoute: 'nbfc-status',
        };
      }

      // UNDER_REVIEW / APPLICATION_CREATED / KYC_COMPLETED
      return {
        currentStage: 'NBFC_REVIEW',
        nextAction: 'WAIT_FOR_NBFC',
        progressPercent: 68,
        recommendedRoute: 'nbfc-status',
      };
    }

    // Default to NBFC status if KYC is verified but financing object pending
    return {
      currentStage: 'NBFC_APPLICATION',
      nextAction: 'WAIT_FOR_NBFC',
      progressPercent: 65,
      recommendedRoute: 'nbfc-status',
    };
  }

  // 5. Initial Onboarding (Authenticated, No payment method selected yet)
  return {
    currentStage: 'PROGRAM_REVIEW',
    nextAction: 'SELECT_PAYMENT',
    progressPercent: 25,
    recommendedRoute: 'program',
  };
}
