import type { PortalRoute } from '../../types/journey';

export interface StageDefinition {
  stepIndex: number; // 1..7
  stepId: 'identity' | 'program' | 'payment' | 'co-applicant' | 'kyc' | 'nbfc-review' | 'class-access';
  canonicalRoute: PortalRoute;
  label: string;
  completedSteps: string[];
}

export const STEP_DEFINITIONS: Record<StageDefinition['stepId'], StageDefinition> = {
  identity: {
    stepIndex: 1,
    stepId: 'identity',
    canonicalRoute: 'auth',
    label: 'Identity',
    completedSteps: [],
  },
  program: {
    stepIndex: 2,
    stepId: 'program',
    canonicalRoute: 'program',
    label: 'Program',
    completedSteps: ['identity'],
  },
  payment: {
    stepIndex: 3,
    stepId: 'payment',
    canonicalRoute: 'pay',
    label: 'Payment',
    completedSteps: ['identity', 'program'],
  },
  'co-applicant': {
    stepIndex: 4,
    stepId: 'co-applicant',
    canonicalRoute: 'co-applicant',
    label: 'Co-Applicant',
    completedSteps: ['identity', 'program', 'payment'],
  },
  kyc: {
    stepIndex: 5,
    stepId: 'kyc',
    canonicalRoute: 'kyc',
    label: 'KYC',
    completedSteps: ['identity', 'program', 'payment', 'co-applicant'],
  },
  'nbfc-review': {
    stepIndex: 6,
    stepId: 'nbfc-review',
    canonicalRoute: 'nbfc-status',
    label: 'NBFC Review',
    completedSteps: ['identity', 'program', 'payment', 'co-applicant', 'kyc'],
  },
  'class-access': {
    stepIndex: 7,
    stepId: 'class-access',
    canonicalRoute: 'class-access',
    label: 'Class Access',
    completedSteps: ['identity', 'program', 'payment', 'co-applicant', 'kyc', 'nbfc-review'],
  },
};

/** Normalizes a Salesforce stage string */
export function normalizeStage(value?: string | null): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

/**
 * Centralized Salesforce Stage Map
 * Maps normalized Onboarding_Status__c picklist values to StageDefinition
 */
const SALESFORCE_STAGE_MAP: Record<string, StageDefinition> = {
  // Identify / Program Selection
  'yet to assign': STEP_DEFINITIONS.program,
  'yet to contact': STEP_DEFINITIONS.program,
  'manager approval pending': STEP_DEFINITIONS.program,
  'yet to decide': STEP_DEFINITIONS.program,
  'dependency': STEP_DEFINITIONS.program,
  'will do later': STEP_DEFINITIONS.program,
  'program selection': STEP_DEFINITIONS.program,

  // Payment
  'yet to pay': STEP_DEFINITIONS.payment,
  'payment pending': STEP_DEFINITIONS.payment,

  // Co-Applicant
  'co-applicant': STEP_DEFINITIONS['co-applicant'],

  // KYC
  'yet to fill kyc': STEP_DEFINITIONS.kyc,
  'kyc pending': STEP_DEFINITIONS.kyc,
  'kyc submitted': STEP_DEFINITIONS.kyc,

  // NBFC Review (Application in NBFC, etc.)
  'application in nbfc': STEP_DEFINITIONS['nbfc-review'],
  'nbfc approved': STEP_DEFINITIONS['nbfc-review'],
  'application submitted': STEP_DEFINITIONS['nbfc-review'],
  'not interested to shift nbfc': STEP_DEFINITIONS['nbfc-review'],

  // Class Access (Full Payment, Installments, Disbursed, EMI Setup Done)
  'emi setup done': STEP_DEFINITIONS['class-access'],
  'full payment done': STEP_DEFINITIONS['class-access'],
  'installments done': STEP_DEFINITIONS['class-access'],
  'disbursed': STEP_DEFINITIONS['class-access'],

  // Support / Exception stages -> stay on program step with support messaging
  'not interested in program': STEP_DEFINITIONS.program,
  'asking for refund': STEP_DEFINITIONS.program,
  'asking for closure': STEP_DEFINITIONS.program,
  'foreclosure done': STEP_DEFINITIONS.program,
  'refund approved': STEP_DEFINITIONS.program,
  'lead lost': STEP_DEFINITIONS.program,
  'yet to find rca': STEP_DEFINITIONS.program,
};

export interface ResolvedStageResult {
  stageDefinition: StageDefinition;
  salesforceStage: string;
  normalizedStage: string;
  isKnown: boolean;
}

/**
 * Resolves a Salesforce Onboarding_Status__c value into a StageDefinition.
 * Logs a warning if an unknown stage is encountered.
 */
export function resolveSalesforceStage(
  rawStage?: string | null,
  recordId?: string
): ResolvedStageResult {
  const normalized = normalizeStage(rawStage);

  if (!normalized) {
    return {
      stageDefinition: STEP_DEFINITIONS.program,
      salesforceStage: rawStage || 'UNKNOWN',
      normalizedStage: '',
      isKnown: false,
    };
  }

  const mapped = SALESFORCE_STAGE_MAP[normalized];
  if (mapped) {
    return {
      stageDefinition: mapped,
      salesforceStage: rawStage!,
      normalizedStage: normalized,
      isKnown: true,
    };
  }

  // Log visible warning for unknown stage
  console.warn(
    `[EnrollmentSync] ⚠️ UNKNOWN SALESFORCE STAGE: "${rawStage}" (normalized: "${normalized}") for recordId: ${recordId || 'N/A'}`
  );

  return {
    stageDefinition: STEP_DEFINITIONS.program,
    salesforceStage: rawStage!,
    normalizedStage: normalized,
    isKnown: false,
  };
}

/**
 * Log structured debug info as required by specification
 */
export function logEnrollmentSync(params: {
  recordId: string;
  salesforceStage: string;
  normalizedStage: string;
  resolvedStep: string;
  active: boolean;
  routeBefore?: string;
  routeAfter?: string;
  lastModifiedDate?: string | null;
}): void {
  console.log(
    `[EnrollmentSync]\n` +
      `  recordId: ${params.recordId}\n` +
      `  salesforceStage: "${params.salesforceStage}"\n` +
      `  normalizedStage: "${params.normalizedStage}"\n` +
      `  resolvedStep: "${params.resolvedStep}"\n` +
      `  active: ${params.active}\n` +
      `  routeBefore: "${params.routeBefore || 'N/A'}"\n` +
      `  routeAfter: "${params.routeAfter || 'N/A'}"\n` +
      `  lastModifiedDate: "${params.lastModifiedDate || 'N/A'}"`
  );
}
