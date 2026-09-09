import type { SalesforceOnboardingRecord } from '../adapters/salesforce/types';

/** Statuses that indicate dead, disqualified, or non-actionable leads in CRM */
const INELIGIBLE_STATUSES = new Set([
  'irrelevant lead',
  'closed lost',
  'dropped',
  'junk lead',
  'cancelled',
  'duplicate',
]);

/** Returns true if record is an active/eligible onboarding candidate */
export function isEligibleOnboardingRecord(record: SalesforceOnboardingRecord): boolean {
  if (!record || !record.Id) return false;
  const status = (record.Onboarding_Status__c || '').trim().toLowerCase();
  if (INELIGIBLE_STATUSES.has(status)) return false;
  return true;
}

/** Selects the single most active/relevant onboarding record from candidates */
export function selectActiveRecord(records: SalesforceOnboardingRecord[]): {
  selected: SalesforceOnboardingRecord | null;
  isAmbiguous: boolean;
  candidateCount: number;
  eligibleCount: number;
} {
  if (!records || records.length === 0) {
    return { selected: null, isAmbiguous: false, candidateCount: 0, eligibleCount: 0 };
  }

  const eligible = records.filter(isEligibleOnboardingRecord);

  // If eligible records exist, prioritize them; else fall back to most recent candidate
  const candidatePool = eligible.length > 0 ? eligible : records;

  // Sort by LastModifiedDate desc, then CreatedDate desc
  const sorted = [...candidatePool].sort((a, b) => {
    const timeA = new Date((a as any).LastModifiedDate || (a as any).CreatedDate || 0).getTime();
    const timeB = new Date((b as any).LastModifiedDate || (b as any).CreatedDate || 0).getTime();
    return timeB - timeA;
  });

  const selected = sorted[0] || null;
  const isAmbiguous = eligible.length > 1;

  return {
    selected,
    isAmbiguous,
    candidateCount: records.length,
    eligibleCount: eligible.length,
  };
}
