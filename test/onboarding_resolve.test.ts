import assert from 'node:assert';
import { normalizeIndianPhone, getIndianPhoneSearchVariants } from '../src/server/domain/phoneNormalizer';
import { selectActiveRecord, isEligibleOnboardingRecord } from '../src/server/domain/activeRecordResolver';
import { deriveJourneyStageAndRoute } from '../src/server/domain/journeyEngine';

console.log('--- RUNNING ONBOARDING RESOLVE UNIT TESTS ---');

// 1. Phone Normalizer Tests
{
  assert.strictEqual(normalizeIndianPhone('9100886544'), '9100886544');
  assert.strictEqual(normalizeIndianPhone('+919100886544'), '9100886544');
  assert.strictEqual(normalizeIndianPhone('+91 9100886544'), '9100886544');
  assert.strictEqual(normalizeIndianPhone('919100886544'), '9100886544');
  assert.strictEqual(normalizeIndianPhone('09100886544'), '9100886544');
  assert.strictEqual(normalizeIndianPhone('12345'), '');
  assert.strictEqual(normalizeIndianPhone(''), '');
  const variants = getIndianPhoneSearchVariants('+919100886544');
  assert(variants.includes('9100886544'));
  assert(variants.includes('+919100886544'));
  console.log('✓ 1. Phone normalization tests passed');
}

// 2. Eligibility & Active Record Selection Tests
{
  const irrelevant = { Id: 'rec1', Name: 'Old Lead', Onboarding_Status__c: 'Irrelevant Lead', CreatedDate: '2025-01-01' } as any;
  const activeLead = { Id: 'a03fv0000014m0zAAA', Name: 'Test12345', Onboarding_Status__c: 'Yet To Contact', LastModifiedDate: '2026-09-07' } as any;
  assert.strictEqual(isEligibleOnboardingRecord(irrelevant), false);
  assert.strictEqual(isEligibleOnboardingRecord(activeLead), true);

  const selection = selectActiveRecord([irrelevant, activeLead]);
  assert.strictEqual(selection.selected?.Id, 'a03fv0000014m0zAAA');
  assert.strictEqual(selection.candidateCount, 2);
  assert.strictEqual(selection.eligibleCount, 1);
  console.log('✓ 2. Active record selection tests passed');
}

// 3. Journey Engine Tests
{
  const activeLead = {
    Id: 'a03fv0000014m0zAAA',
    Name: 'Test12345',
    Onboarding_Status__c: 'Yet To Contact',
    Student_WhatsApp_Number__c: '9100886544',
    Payment_Plan_PRE__c: 'Downpayment + EMI',
    Product_Price__c: 180000,
    Amount_Payable_PRE__c: 162000,
    Preferred_Languages__c: 'Hindi',
  } as any;

  const derived = deriveJourneyStageAndRoute(activeLead);
  assert.strictEqual(derived.normalizedModel.recordId, 'a03fv0000014m0zAAA');
  assert.strictEqual(derived.normalizedModel.onboardingStatus, 'Yet To Contact');
  assert.strictEqual(derived.authRequired, true);
  console.log('✓ 3. Journey engine tests passed');
}

console.log('ALL ONBOARDING RESOLUTION TESTS PASSED! ✨');
