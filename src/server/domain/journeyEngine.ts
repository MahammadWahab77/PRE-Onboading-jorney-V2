import type { SalesforceOnboardingRecord } from '../adapters/salesforce/types';
import type { PortalRoute, JourneyStage } from '../../types/journey';
import { mapSalesforceToJourney } from '../adapters/salesforce/enrollmentMapper';
import { resolveSalesforceStage } from './salesforceStageMapper';

export interface JourneyStageResult {
  stage: JourneyStage;
  route: PortalRoute;
  authRequired: boolean;
  resolvedStep: string;
  completedSteps: string[];
  stepIndex: number;
  normalizedModel: {
    recordId: string;
    studentName: string;
    phone: string;
    onboardingStatus: string;
    stagePre: string | null;
    paymentPlan: string | null;
    kycStatus: string;
    nbfcStatus: string | null;
    lmsAccessStatus: string | null;
    preferredLanguage: string;
    lastModifiedDate: string | null;
  };
}

/** Centralized business engine to derive exact journey stage and route from Salesforce record */
export function deriveJourneyStageAndRoute(record: SalesforceOnboardingRecord): JourneyStageResult {
  const journey = mapSalesforceToJourney({ ...record, Authentication_Verified__c: true }, record.Id);
  const targetRoute = (journey.journey?.recommendedRoute || 'program') as PortalRoute;
  const sfResolved = resolveSalesforceStage(record.Onboarding_Status__c, record.Id);

  return {
    stage: journey.journey?.currentStage || 'PROGRAM_REVIEW',
    route: targetRoute,
    authRequired: !Boolean(record.Authentication_Verified__c),
    resolvedStep: sfResolved.stageDefinition.stepId,
    completedSteps: sfResolved.stageDefinition.completedSteps,
    stepIndex: sfResolved.stageDefinition.stepIndex,
    normalizedModel: {
      recordId: record.Id,
      studentName: record.Student_Name__c || record.Name || 'Learner',
      phone: record.Student_WhatsApp_Number__c || record.Student_Number__c || record.PHONE_NUMBER__c || '',
      onboardingStatus: record.Onboarding_Status__c || 'Yet To Contact',
      stagePre: record.Stage_PRE__c || null,
      paymentPlan: record.Payment_Plan_PRE__c || null,
      kycStatus: journey.kyc?.status || 'NOT_STARTED',
      nbfcStatus: journey.financing?.status || null,
      lmsAccessStatus: (record as any).LMS_Access_Status__c || null,
      preferredLanguage: journey.learner?.preferredLanguage || 'English',
      lastModifiedDate: (record as any).LastModifiedDate || null,
    },
  };
}
