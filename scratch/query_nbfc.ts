import 'dotenv/config';
import { salesforceRestClient } from '../src/server/adapters/salesforce/salesforceRestClient';

async function testUserQueries() {
  const sfId = 'a03fv0000014m0zAAA';
  const phone = '9515622271';

  // Query 2: Active Academy Onboarding record
  const activeRecords = await salesforceRestClient.query(`SELECT Id, Name, PHONE_NUMBER__c, Onboarding_Status__c, Choose_NBFC_PRE__c, Disbursed_NBFC_Name__c FROM Academy_Onboarding_PRE__c WHERE Id = '${sfId}' AND Active__c = true`);
  console.log('--- Query 2 (Active Main Record) ---', activeRecords);

  // Query 1: All NBFC records for student phone or linked lookup
  const nbfcRecords = await salesforceRestClient.query(`SELECT Id, Name, Master_App_ID__c, Master_Applied_Loan_Amount__c, Master_Approved_Loan_Amount__c, student_phone_number__c, Academy_Onboarding_PRE_L__c, Co_Applicant_Name_PRE__c, Co_Applicant_Phone_Number_PRE__c, Relation_With_The_Co_Applicant_PRE__c FROM NBFC_Onboarding__c WHERE student_phone_number__c = '${phone}' OR Academy_Onboarding_PRE_L__c = '${sfId}'`);
  console.log('--- Query 1 (All Related NBFC Onboarding Records) ---', nbfcRecords);
}

testUserQueries();
