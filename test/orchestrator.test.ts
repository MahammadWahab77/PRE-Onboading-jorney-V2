import assert from 'node:assert';
import { MOCK_SALESFORCE_FIXTURES } from '../src/server/adapters/salesforce/mockFixtures';
import { mapSalesforceToJourney } from '../src/server/adapters/salesforce/enrollmentMapper';
import { mapNbfcStatus } from '../src/server/adapters/salesforce/nbfcStatusMapper';
import { resolveJourneyState } from '../src/server/orchestrator/journeyOrchestrator';

console.log('--- RUNNING ORCHESTRATOR & FIXTURE RESOLUTION TESTS ---');

// 1. Unauthenticated test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_unauthenticated;
  const journey = mapSalesforceToJourney(rec, 'nw_unauthenticated');
  assert.strictEqual(journey.authenticated, false);
  assert.strictEqual(journey.journey.currentStage, 'AUTHENTICATION');
  assert.strictEqual(journey.journey.recommendedRoute, 'auth');
  assert.strictEqual(journey.journey.nextAction, 'VERIFY_MOBILE');
  console.log('✓ 1. nw_unauthenticated passed');
}

// 2. Auth success fresh test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_auth_success_fresh;
  const journey = mapSalesforceToJourney(rec, 'nw_auth_success_fresh');
  assert.strictEqual(journey.authenticated, true);
  assert.strictEqual(journey.journey.currentStage, 'PROGRAM_REVIEW');
  assert.strictEqual(journey.journey.recommendedRoute, 'program');
  console.log('✓ 2. nw_auth_success_fresh passed');
}

// 3. Direct pay pending test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_direct_pay_pending;
  const journey = mapSalesforceToJourney(rec, 'nw_direct_pay_pending');
  assert.strictEqual(journey.authenticated, true);
  assert.strictEqual(journey.journey.currentStage, 'PAYMENT_PENDING');
  assert.strictEqual(journey.journey.recommendedRoute, 'pay');
  assert.strictEqual(journey.journey.nextAction, 'COMPLETE_PAYMENT');
  console.log('✓ 3. nw_direct_pay_pending passed');
}

// 4. Direct pay success test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_direct_pay_success;
  const journey = mapSalesforceToJourney(rec, 'nw_direct_pay_success');
  assert.strictEqual(journey.authenticated, true);
  assert.strictEqual(journey.journey.currentStage, 'CLASS_ACCESS');
  assert.strictEqual(journey.journey.recommendedRoute, 'class-access');
  console.log('✓ 4. nw_direct_pay_success passed');
}

// 5. EMI started, no co-applicant test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_started_no_coapplicant;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_started_no_coapplicant');
  assert.strictEqual(journey.journey.currentStage, 'CO_APPLICANT');
  assert.strictEqual(journey.journey.recommendedRoute, 'co-applicant');
  assert.strictEqual(journey.journey.nextAction, 'COMPLETE_CO_APPLICANT');
  console.log('✓ 5. nw_emi_started_no_coapplicant passed');
}

// 6. EMI co-applicant saved, KYC pending test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_coapplicant_saved;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_coapplicant_saved');
  assert.strictEqual(journey.journey.currentStage, 'KYC');
  assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
  assert.strictEqual(journey.journey.nextAction, 'COMPLETE_KYC');
  console.log('✓ 6. nw_emi_coapplicant_saved passed');
}

// 7. EMI KYC in progress test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_kyc_in_progress;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_kyc_in_progress');
  assert.strictEqual(journey.journey.currentStage, 'KYC');
  assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
  console.log('✓ 7. nw_emi_kyc_in_progress passed');
}

// 8. EMI KYC action required test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_kyc_action_required;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_kyc_action_required');
  assert.strictEqual(journey.journey.currentStage, 'KYC');
  assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
  assert.strictEqual(journey.journey.nextAction, 'SUBMIT_DOCUMENTS');
  console.log('✓ 8. nw_emi_kyc_action_required passed');
}

// 9. EMI NBFC under review test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_nbfc_under_review;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_nbfc_under_review');
  assert.strictEqual(journey.journey.currentStage, 'NBFC_REVIEW');
  assert.strictEqual(journey.journey.recommendedRoute, 'nbfc-status');
  assert.strictEqual(journey.journey.nextAction, 'WAIT_FOR_NBFC');
  console.log('✓ 9. nw_emi_nbfc_under_review passed');
}

// 10. EMI NBFC approved test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_nbfc_approved;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_nbfc_approved');
  assert.strictEqual(journey.journey.currentStage, 'EMI_SETUP');
  assert.strictEqual(journey.journey.recommendedRoute, 'nbfc-status');
  assert.strictEqual(journey.journey.nextAction, 'COMPLETE_EMI_SETUP');
  console.log('✓ 10. nw_emi_nbfc_approved passed');
}

// 11. EMI NBFC rejected test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_nbfc_rejected;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_nbfc_rejected');
  assert.strictEqual(journey.journey.currentStage, 'NBFC_REVIEW');
  assert.strictEqual(journey.journey.recommendedRoute, 'nbfc-status');
  assert.strictEqual(journey.journey.nextAction, 'CHANGE_CO_APPLICANT');
  console.log('✓ 11. nw_emi_nbfc_rejected passed');
}

// 12. EMI disbursed test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_emi_disbursed;
  const journey = mapSalesforceToJourney(rec, 'nw_emi_disbursed');
  assert.strictEqual(journey.journey.currentStage, 'CLASS_ACCESS');
  assert.strictEqual(journey.journey.recommendedRoute, 'class-access');
  console.log('✓ 12. nw_emi_disbursed passed');
}

// 13. Class access active test
{
  const rec = MOCK_SALESFORCE_FIXTURES.nw_class_access_active;
  const journey = mapSalesforceToJourney(rec, 'nw_class_access_active');
  assert.strictEqual(journey.journey.currentStage, 'CLASS_ACCESS');
  assert.strictEqual(journey.journey.recommendedRoute, 'class-access');
  assert.strictEqual(journey.journey.progressPercent, 100);
  console.log('✓ 13. nw_class_access_active passed');
}

// Test Lender Mapping
{
  const res = mapNbfcStatus({
    Id: 'test1',
    Name: 'test',
    Product_Price__c: 160000,
    Amount_Payable_PRE__c: 112000,
    Amount_Paid_Till_Now_To_Nxtwave_PRE__c: 18000,
    Student_Name__c: 'Test',
    Program_PRE__c: 'Genius',
    Choose_NBFC_PRE__c: 'Fibe',
    Fibe_Overall_Stages__c: 'NACH_PENDING',
  });
  assert.strictEqual(res.status, 'EMI_SETUP_PENDING');
  console.log('✓ 14. Fibe lender mapping test passed');
}

// 15. Persisted Stage_PRE__c resume test
{
  const rec = {
    ...MOCK_SALESFORCE_FIXTURES.nw_auth_success_fresh,
    Stage_PRE__c: 'kyc',
  };
  const journey = mapSalesforceToJourney(rec, 'nw_auth_success_fresh');
  assert.strictEqual(journey.authenticated, true);
  assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
  console.log('✓ 15. Persisted Stage_PRE__c resume test passed');
}

// 16. Onboarding_Status__c picklist mapping test
{
  const kycSubRec = {
    ...MOCK_SALESFORCE_FIXTURES.nw_auth_success_fresh,
    Payment_Plan_PRE__c: 'No-Cost EMI',
    Co_Applicant_Name__c: 'Father Test',
    Co_Applicant_Phone_Number_PRE__c: '9876543210',
    Onboarding_Status__c: 'KYC Submitted',
  };
  const jKyc = mapSalesforceToJourney(kycSubRec, 'test_kyc_sub');
  assert.strictEqual(jKyc.kyc?.status, 'SUBMITTED');

  const nbfcRec = {
    ...MOCK_SALESFORCE_FIXTURES.nw_auth_success_fresh,
    Payment_Plan_PRE__c: 'No-Cost EMI',
    Co_Applicant_Name__c: 'Father Test',
    Co_Applicant_Phone_Number_PRE__c: '9876543210',
    Onboarding_Status__c: 'Application in NBFC',
  };
  const jNbfc = mapSalesforceToJourney(nbfcRec, 'test_nbfc');
  assert.strictEqual(jNbfc.kyc?.status, 'VERIFIED');

  console.log('✓ 16. Onboarding_Status__c stage mapping test passed');
}

// 17. Specific lead a03fv0000014m0zAAA test (Stale Stage_PRE__c = "congratulations" + Onboarding_Status__c = "KYC Submitted")
{
  const rec = {
    Id: 'a03fv0000014m0zAAA',
    Name: 'Test12345',
    Onboarding_Status__c: 'KYC Submitted',
    Stage_PRE__c: 'congratulations',
    Payment_Plan_PRE__c: 'No-Cost EMI',
    Co_Applicant_Name__c: 'Test CoApplicant',
    Co_Applicant_Phone_Number_PRE__c: '9100886544',
    Authentication_Verified__c: true,
  };
  const journey = mapSalesforceToJourney(rec as any, 'a03fv0000014m0zAAA');
  assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
  assert.strictEqual(journey.journey.resolvedStep, 'kyc');
  assert.strictEqual(journey.journey.stepIndex, 5);
  assert.deepStrictEqual(journey.journey.completedSteps, [
    'identity',
    'program',
    'payment',
    'co-applicant',
  ]);
  console.log('✓ 17. Lead a03fv0000014m0zAAA sync to /kyc passed');
}

// 18. Case & whitespace variation test for Onboarding_Status__c = "KYC Submitted"
{
  const variations = ['KYC Submitted', 'kyc submitted', ' KYC Submitted '];
  for (const statusVar of variations) {
    const rec = {
      Id: 'a03fv0000014m0zAAA',
      Onboarding_Status__c: statusVar,
      Stage_PRE__c: 'congratulations',
      Authentication_Verified__c: true,
    };
    const journey = mapSalesforceToJourney(rec as any, 'a03fv0000014m0zAAA');
    assert.strictEqual(journey.kyc?.status, 'SUBMITTED');
    assert.strictEqual(journey.journey.recommendedRoute, 'kyc');
    assert.strictEqual(journey.journey.resolvedStep, 'kyc');
    assert.strictEqual(journey.journey.stepIndex, 5);
  }
  console.log('✓ 18. Case and whitespace variations for KYC Submitted passed');
}

console.log('ALL 18 SUITES PASSED CLEANLY! ✨');
