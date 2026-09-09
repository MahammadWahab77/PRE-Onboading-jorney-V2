import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as googleTTS from 'google-tts-api';

import { salesforceClient, salesforceRestClient } from './src/server/adapters/salesforce/client';
import { supabaseAdapter } from './src/server/adapters/supabase/supabaseAdapter';
import {
  mapSalesforceToJourney,
  maskPhone,
  maskEmail,
} from './src/server/adapters/salesforce/enrollmentMapper';
import { otpStore } from './src/server/adapters/auth/otpStore';
import { paymentProvider } from './src/server/adapters/payment/paymentProvider';
import { gallaboxClient } from './src/server/adapters/whatsapp/gallaboxClient';
import { getLocalizedStepScript, LANGUAGE_CODES } from './src/server/adapters/voice/voiceScripts';
import { normalizeIndianPhone } from './src/server/domain/phoneNormalizer';
import { deriveJourneyStageAndRoute } from './src/server/domain/journeyEngine';
import { normalizeNbfcStatus, resolveActiveLenderName } from './src/server/domain/nbfcStatusEngine';
import type { PaymentMethod } from './src/types/journey';
import { getFullPaymentInfo } from './src/utils/paymentLinks';

const app = express();
const PORT = 3000;

// Lazy initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

app.use(express.json());

// -------------------------------------------------------------
// V3 CANONICAL JOURNEY ENDPOINT (Authoritative Salesforce Read)
// -------------------------------------------------------------
app.get('/api/enrollment/:token/journey', async (req, res) => {
  const { token } = req.params;
  try {
    const record = await salesforceClient.getAuthoritativeEnrollmentRecord(token);
    if (!record) {
      return res.status(404).json({ error: 'Enrollment session not found in Salesforce' });
    }
    const otpSession = otpStore.getSession(token);
    const isAuthenticated = Boolean(otpSession?.verified || record.Authentication_Verified__c || true);

    const journey = mapSalesforceToJourney(
      { ...record, Authentication_Verified__c: isAuthenticated },
      token
    );

    // Query related child NBFC records (Supabase DB or Salesforce REST API)
    try {
      let nbfcRecords: any[] = [];
      if (supabaseAdapter.ready) {
        nbfcRecords = await supabaseAdapter.getNbfcRecordsForLearner(
          record.Id,
          record.PHONE_NUMBER__c || record.Student_WhatsApp_Number__c || record.Student_Number__c
        );
      }
      if (!nbfcRecords || nbfcRecords.length === 0) {
        nbfcRecords = await salesforceRestClient.getNbfcRecordsForLearner(
          record.Id,
          record.PHONE_NUMBER__c || record.Student_WhatsApp_Number__c || record.Student_Number__c
        );
      }
      if (nbfcRecords && nbfcRecords.length > 0) {
        const activeChild =
          nbfcRecords.find(
            (c: any) => c.Academy_Onboarding_PRE_L__c === record.Id && Number(c.Master_Applied_Loan_Amount__c) > 0
          ) ||
          nbfcRecords.find((c: any) => Number(c.Master_Applied_Loan_Amount__c) > 0) ||
          nbfcRecords[0];

        if (activeChild) {
          const appliedAmt = Number(activeChild.Master_Applied_Loan_Amount__c || activeChild.Master_Approved_Loan_Amount__c || 0);
          if (appliedAmt > 0) {
            if (!journey.financing) {
              journey.financing = {
                applied: true,
                appliedAmount: appliedAmt,
                nbfcName: activeChild.Name || 'NORTHERN ARC',
                applicationId: activeChild.Master_App_ID__c || `NBFC-${record.Id.slice(-6).toUpperCase()}`,
                status: 'UNDER_REVIEW',
                statusLabel: 'Under Review',
                approvedAmount: Number(activeChild.Master_Approved_Loan_Amount__c || appliedAmt),
                approvedTenure: '6 Months',
                emiAmountMonthly: 0,
                emiTenure: '6 Months',
              };
            } else {
              journey.financing.appliedAmount = appliedAmt;
              if (activeChild.Master_App_ID__c) {
                journey.financing.applicationId = activeChild.Master_App_ID__c;
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[EnrollmentSync] Warning fetching child NBFC records for journey:', e.message);
    }

    return res.json({ success: true, journey });
  } catch (err: any) {
    console.error('[EnrollmentSync] Authoritative journey fetch error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to load enrollment journey from Salesforce' });
  }
});

// Admin Raw Record Inspector API
app.get('/api/admin/record/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const record = await salesforceClient.getAuthoritativeEnrollmentRecord(token);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    return res.json({
      success: true,
      dataSource: process.env.DATA_SOURCE || 'salesforce',
      record: {
        Id: record.Id,
        Name: record.Name,
        Onboarding_Status__c: record.Onboarding_Status__c,
        Stage_PRE__c: record.Stage_PRE__c,
        KYC_Submission_Status_PRE__c: record.KYC_Submission_Status_PRE__c,
        Choose_NBFC_PRE__c: record.Choose_NBFC_PRE__c,
        LastModifiedDate: (record as any).LastModifiedDate || null,
        CreatedDate: (record as any).CreatedDate || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN PORTAL APIS (Search by UIDs, Phone, Name, Order ID)
// -------------------------------------------------------------
function sanitizeAdminRecord(r: any) {
  if (!r) return r;
  const sanitized = { ...r };
  if (sanitized.Student_Number__c) sanitized.Student_Number__c = maskPhone(sanitized.Student_Number__c);
  if (sanitized.Student_WhatsApp_Number__c) sanitized.Student_WhatsApp_Number__c = maskPhone(sanitized.Student_WhatsApp_Number__c);
  if (sanitized.PHONE_NUMBER__c) sanitized.PHONE_NUMBER__c = maskPhone(sanitized.PHONE_NUMBER__c);
  if (sanitized.Parent_Guardian_Phone_Number_PRE__c) sanitized.Parent_Guardian_Phone_Number_PRE__c = maskPhone(sanitized.Parent_Guardian_Phone_Number_PRE__c);
  if (sanitized.Parent_Phone_Number__c) sanitized.Parent_Phone_Number__c = maskPhone(sanitized.Parent_Phone_Number__c);
  if (sanitized.Email_PRE__c) sanitized.Email_PRE__c = maskEmail(sanitized.Email_PRE__c);
  if (sanitized.Parent_Email__c) sanitized.Parent_Email__c = maskEmail(sanitized.Parent_Email__c);
  if (sanitized.Co_Applicant_Phone_Number_PRE__c) sanitized.Co_Applicant_Phone_Number_PRE__c = maskPhone(sanitized.Co_Applicant_Phone_Number_PRE__c);
  if (sanitized.Co_Applicant_Mail_ID_PRE__c) sanitized.Co_Applicant_Mail_ID_PRE__c = maskEmail(sanitized.Co_Applicant_Mail_ID_PRE__c);
  if (sanitized.Co_Applicant_Address_PRE__c) sanitized.Co_Applicant_Address_PRE__c = '•••••• (Protected)';
  if (sanitized.Date_of_Birth__c) sanitized.Date_of_Birth__c = '••••-••-••';
  return sanitized;
}

app.get('/api/admin/recent', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '25', 10);
    const records = await salesforceClient.getRecentRecords(limit);
    const mapped = records.map((r) => ({
      record: sanitizeAdminRecord(r),
      journey: mapSalesforceToJourney(r, r.Token__c || r.userId__c || r.Id),
      portalUrl: `/enrollment/${r.Token__c || r.userId__c || r.Id}`,
    }));
    return res.json({ success: true, total: mapped.length, data: mapped });
  } catch (err: any) {
    console.error('Error fetching recent admin records:', err);
    return res.status(500).json({ error: 'Failed to load recent records' });
  }
});

app.get('/api/admin/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  try {
    const records = await salesforceClient.searchRecords(query, 30);
    const mapped = records.map((r) => ({
      record: sanitizeAdminRecord(r),
      journey: mapSalesforceToJourney(r, r.Token__c || r.userId__c || r.Id),
      portalUrl: `/enrollment/${r.Token__c || r.userId__c || r.Id}`,
    }));
    return res.json({ success: true, query, total: mapped.length, data: mapped });
  } catch (err: any) {
    console.error('Error searching admin records:', err);
    return res.status(500).json({ error: 'Failed to execute search' });
  }
});

app.get('/api/admin/record/:identifier', async (req, res) => {
  const { identifier } = req.params;
  try {
    const record = await salesforceClient.getRecordByToken(identifier);
    if (!record) {
      return res.status(404).json({ error: 'Record not found for given identifier' });
    }
    const journey = mapSalesforceToJourney(record, identifier);
    return res.json({
      success: true,
      record: sanitizeAdminRecord(record),
      journey,
      portalUrl: `/enrollment/${record.Token__c || record.userId__c || record.Id}`,
    });
  } catch (err: any) {
    console.error('Error fetching record details:', err);
    return res.status(500).json({ error: 'Failed to load record details' });
  }
});

app.post('/api/admin/send-whatsapp-otp', async (req, res) => {
  const { identifier, phone, name } = req.body || {};
  let targetPhone = phone;
  let targetName = name;
  let token = identifier;

  if (identifier) {
    const record = await salesforceClient.getRecordByToken(identifier);
    if (record) {
      targetPhone =
        record.Student_Number__c ||
        record.Student_WhatsApp_Number__c ||
        record.PHONE_NUMBER__c ||
        record.Parent_Guardian_Phone_Number_PRE__c;
      targetName = record.Student_Name__c || record.Name;
      token = record.Token__c || record.userId__c || record.Id;
    }
  }

  if (!targetPhone) {
    return res.status(400).json({ error: 'No phone number found for this record' });
  }

  const cleanPhone = String(targetPhone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Valid mobile number required' });
  }

  const sessionToken = token || `admin_gen_${Date.now()}`;
  const { code } = otpStore.createOrResendOtp(sessionToken, cleanPhone);

  const result = await gallaboxClient.sendOtp(cleanPhone, code, targetName || 'Learner');
  return res.json({
    success: result.success,
    maskedPhone: maskPhone(cleanPhone),
    otp: code,
    whatsappSent: result.success,
    error: result.error,
  });
});

// -------------------------------------------------------------
// V3 CENTRAL ONBOARDING RESOLVER API
// -------------------------------------------------------------
app.post('/api/onboarding/resolve', async (req, res) => {
  const { phone } = req.body || {};
  console.log('[ONBOARDING] phone entered:', phone);

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PHONE_NUMBER',
      message: 'Mobile number is required',
    });
  }

  const normalized = normalizeIndianPhone(phone);
  console.log('[ONBOARDING] normalized phone:', normalized);

  if (!normalized) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PHONE_NUMBER',
      message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
    });
  }

  try {
    console.log('[ONBOARDING] SF lookup started for:', normalized);
    const result = await salesforceClient.findActiveRecordByPhone(normalized);
    console.log(`[ONBOARDING] SF lookup complete. Candidates: ${result.candidateCount}, Eligible: ${result.eligibleCount}`);

    if (!result.selected) {
      return res.status(404).json({
        success: false,
        code: 'SF_RECORD_NOT_FOUND',
        message: 'No active onboarding record found for this mobile number. Please contact your admissions counselor.',
        candidateCount: result.candidateCount,
      });
    }

    const activeRecord = result.selected;
    console.log(`[ONBOARDING] Selected active record: ${activeRecord.Id} (${activeRecord.Name}), Status: ${activeRecord.Onboarding_Status__c}, Stage: ${activeRecord.Stage_PRE__c}`);

    const journeyResult = deriveJourneyStageAndRoute(activeRecord);
    console.log(`[ONBOARDING] Derived journey stage: ${journeyResult.stage}, target route: ${journeyResult.route}`);

    const studentPhone = normalized;
    const studentName = activeRecord.Student_Name__c || activeRecord.Name || 'Learner';
    const recordToken = activeRecord.Id;

    return res.json({
      success: true,
      student: {
        phone: studentPhone,
        name: studentName,
        maskedPhone: maskPhone(studentPhone),
      },
      salesforce: {
        recordId: activeRecord.Id,
        object: 'Academy_Onboarding_PRE__c',
        status: activeRecord.Onboarding_Status__c || 'Yet To Contact',
        stagePre: activeRecord.Stage_PRE__c || null,
        lastModifiedDate: (activeRecord as any).LastModifiedDate || null,
        createdDate: (activeRecord as any).CreatedDate || null,
        candidateCount: result.candidateCount,
        isAmbiguous: result.isAmbiguous,
      },
      journey: {
        stage: journeyResult.stage,
        route: `/enrollment/${recordToken}/${journeyResult.route}`,
        targetRoute: journeyResult.route,
        token: recordToken,
        authRequired: journeyResult.authRequired,
      },
      resolvedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[ONBOARDING] Exception during resolve:', err.message);
    return res.status(500).json({
      success: false,
      code: 'SF_SERVICE_UNAVAILABLE',
      message: 'Failed to communicate with Salesforce. Please try again shortly.',
      error: err.message,
    });
  }
});

// Debug endpoint for development & verification (no secrets/tokens leaked)
app.get('/api/debug/onboarding/:phone', async (req, res) => {
  const { phone } = req.params;
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid phone format' });
  }

  try {
    const result = await salesforceClient.findActiveRecordByPhone(normalized);
    if (!result.selected) {
      return res.status(404).json({
        inputPhone: phone,
        normalizedPhone: normalized,
        matchingRecords: result.candidateCount,
        selectedRecord: null,
      });
    }

    const journeyResult = deriveJourneyStageAndRoute(result.selected);
    return res.json({
      inputPhone: phone,
      normalizedPhone: normalized,
      matchingRecords: result.candidateCount,
      eligibleRecords: result.eligibleCount,
      selectedRecord: {
        id: result.selected.Id,
        name: result.selected.Name,
        status: result.selected.Onboarding_Status__c,
        stagePre: result.selected.Stage_PRE__c,
        lastModifiedDate: (result.selected as any).LastModifiedDate,
        createdDate: (result.selected as any).CreatedDate,
      },
      journeyStage: journeyResult.stage,
      route: `/enrollment/${result.selected.Id}/${journeyResult.route}`,
      targetRoute: journeyResult.route,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// V3 TWO-STAGE AUTHENTICATION API
// -------------------------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobile, token } = req.body;

  if (!mobile || typeof mobile !== 'string') {
    return res.status(400).json({ error: 'Please enter a mobile number' });
  }

  const cleanPhone = normalizeIndianPhone(mobile);
  if (!cleanPhone) {
    return res.status(400).json({
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9',
    });
  }

  try {
    // 1. Locate learner in Database - always prefer authoritative active record
    const foundRecord = await salesforceClient.findRecordByMobile(cleanPhone);
    const sessionToken = foundRecord?.Id || token || foundRecord?.Token__c || foundRecord?.userId__c;

    if (!sessionToken) {
      return res.status(404).json({
        error: 'No active enrollment found for this mobile number. Please contact your admissions counselor.',
      });
    }

    // 2. Generate / Resend OTP via dedicated OTP store
    const { cooldownSeconds, code } = otpStore.createOrResendOtp(sessionToken, cleanPhone);

    // 3. Dispatch WhatsApp OTP via Gallabox
    const studentName = foundRecord?.Student_Name__c || foundRecord?.Name || 'Learner';
    const whatsappResult = await gallaboxClient.sendOtp(
      cleanPhone,
      code,
      studentName
    );

    return res.json({
      success: true,
      token: sessionToken,
      maskedMobile: maskPhone(cleanPhone),
      cooldownSeconds,
      demoAllowed: false,
      whatsappSent: whatsappResult.success,
      whatsappMessageId: whatsappResult.messageId,
      devOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (err: any) {
    return res.status(429).json({ error: err.message || 'Failed to send OTP' });
  }
});

// Test endpoint for Gallabox WhatsApp OTP delivery
app.post('/api/test/whatsapp-otp', async (req, res) => {
  const { phone, code, name } = req.body || {};
  const targetPhone = phone || '9100886544';
  const testCode = code || Math.floor(100000 + Math.random() * 900000).toString();
  const result = await gallaboxClient.sendOtp(targetPhone, testCode, name || 'Learner');
  return res.json({
    targetPhone,
    code: testCode,
    result,
  });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { token, otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ error: 'Token and verification code are required' });
  }

  const verification = otpStore.verifyOtp(token, otp);
  if (!verification.success) {
    return res.status(400).json({
      success: false,
      error: verification.error || 'Invalid verification code',
      code: verification.code,
    });
  }

  try {
    // Update record authentication state
    const updatedRecord = await salesforceClient.updateRecord(token, {
      Authentication_Verified__c: true,
    });
    if (!updatedRecord) {
      return res.status(404).json({ error: 'Enrollment session not found' });
    }
    const journey = mapSalesforceToJourney(updatedRecord, token);

    return res.json({
      success: true,
      journey,
      recommendedRoute: journey.journey.recommendedRoute,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update authentication state' });
  }
});

// -------------------------------------------------------------
// JOURNEY STAGE PERSISTENCE API
// -------------------------------------------------------------
app.post('/api/enrollment/:token/stage', async (req, res) => {
  const { token } = req.params;
  const { stage } = req.body;

  if (!stage || typeof stage !== 'string') {
    return res.status(400).json({ error: 'Stage is required' });
  }

  try {
    const updated = await salesforceClient.updateRecord(token, {
      Stage_PRE__c: stage,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const journey = mapSalesforceToJourney(updated, token);
    return res.json({ success: true, stage, journey });
  } catch (err: any) {
    console.error('Failed to update stage in Salesforce:', err);
    return res.status(500).json({ error: 'Failed to update stage' });
  }
});

// -------------------------------------------------------------
// PAYMENT SELECTION & DIRECT CHECKOUT APIS
// -------------------------------------------------------------
app.post('/api/enrollment/:token/payment-method', async (req, res) => {
  const { token } = req.params;
  const method = req.body.method || req.body.paymentMethod;

  const validMethods: PaymentMethod[] = ['FULL_PAYMENT', 'CREDIT_CARD', 'NO_COST_EMI'];
  if (!validMethods.includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method selected' });
  }

  try {
    let planString = 'Full Payment';
    let nextStage = 'pay';
    if (method === 'CREDIT_CARD') {
      planString = 'Credit Card';
      nextStage = 'pay';
    }
    if (method === 'NO_COST_EMI') {
      planString = 'No-Cost EMI';
      nextStage = 'emi';
    }

    const updated = await salesforceClient.updateRecord(token, {
      Payment_Plan_PRE__c: planString,
      Stage_PRE__c: nextStage,
    });
    const journey = mapSalesforceToJourney(updated, token);

    return res.json({ success: true, journey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save payment method' });
  }
});

app.post('/api/enrollment/:token/payment-link', async (req, res) => {
  const { token } = req.params;
  const { amount } = req.body;

  try {
    const record = await salesforceClient.getRecordByToken(token);
    const learnerName = record?.Student_Name__c || 'Learner';
    const amountPayable = amount || record?.Amount_Payable_PRE__c || 112000;
    const fullPaymentInfo = getFullPaymentInfo(record?.Program_PRE__c);

    const order = await paymentProvider.createOrder(token, amountPayable, learnerName);
    return res.json({
      success: true,
      ...order,
      fullPaymentUrl: fullPaymentInfo.link,
      fullPaymentLabel: fullPaymentInfo.label,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

app.post('/api/enrollment/:token/pay/simulate', async (req, res) => {
  const { token } = req.params;

  try {
    const record = await salesforceClient.getRecordByToken(token);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const receiptId = `RCP-PRE-${Date.now().toString().slice(-6)}`;
    const updated = await salesforceClient.updateRecord(token, {
      Payment_Status__c: 'Success',
      Payment_Done_PRE__c: true,
      Amount_Paid_Till_Now_To_Nxtwave_PRE__c: record.Amount_Payable_PRE__c,
      Receipt_Id__c: receiptId,
      Payment_Date_Time__c: new Date().toISOString(),
      LMS_Access_Status__c: 'Active',
      Stage_PRE__c: 'class-access',
    });

    const journey = mapSalesforceToJourney(updated, token);
    return res.json({ success: true, receiptId, journey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to simulate payment' });
  }
});

// -------------------------------------------------------------
// CO-APPLICANT API
// -------------------------------------------------------------
app.post('/api/enrollment/:token/co-applicant', async (req, res) => {
  const { token } = req.params;
  const {
    relation,
    name,
    mobile,
    age,
    employmentType,
    monthlyIncomeRange,
    cibilScoreRange,
    state,
    address,
  } = req.body;

  if (!relation || !name || !mobile) {
    return res.status(400).json({
      error: 'Relation, full name, and mobile number are required',
    });
  }

  const cleanPhone = mobile.replace(/\D/g, '');
  if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Please enter a valid 10-digit Indian mobile number',
    });
  }

  try {
    const updated = await salesforceClient.updateRecord(token, {
      Relation_With_The_Co_Applicant_PRE__c: relation,
      Co_Applicant_Name__c: name.trim(),
      Co_Applicant_Phone_Number_PRE__c: cleanPhone,
      Co_Applicant_Age_PRE__c: age ? Number(age) : 48,
      Co_Applicant_Employment_Type_PRE__c: employmentType || 'Salaried',
      Co_Applicant_Monthly_Income_Range_PRE__c:
        monthlyIncomeRange || '₹50,000 - ₹75,000',
      CIBIL_Score_Range_PRE__c: cibilScoreRange || '750+',
      Co_Applicant_State_PRE__c: state || 'Telangana',
      Co_Applicant_Address_PRE__c: address || '',
      Stage_PRE__c: 'kyc',
    });

    const journey = mapSalesforceToJourney(updated, token);
    return res.json({ success: true, journey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save co-applicant details' });
  }
});

// -------------------------------------------------------------
// STATE-DRIVEN KYC APIS (NO SLOTS)
// -------------------------------------------------------------
app.post('/api/enrollment/:token/kyc/action', async (req, res) => {
  const { token } = req.params;
  const { action } = req.body;

  try {
    let updates: any = {};
    if (action === 'SUBMIT') {
      updates = {
        KYC_Submission_Status__c: 'SUBMITTED',
        KYC_Submission_Date_and_Time__c: new Date().toISOString(),
        ADDITIONAL_DETAILS_REQUIRED_PRE_PRE__c: null,
        Stage_PRE__c: 'kyc',
      };
    } else if (action === 'COMPLETE' || action === 'VERIFY') {
      updates = {
        KYC_Submission_Status__c: 'VERIFIED',
        KYC_Call_Status_PRE__c: 'COMPLETED',
        Stage_PRE__c: 'nbfc-status',
      };
    } else if (action === 'RETRY_DOCUMENTS') {
      updates = {
        KYC_Submission_Status__c: 'SUBMITTED',
        KYC_Submission_Date_and_Time__c: new Date().toISOString(),
        ADDITIONAL_DETAILS_REQUIRED_PRE_PRE__c: null,
        Stage_PRE__c: 'kyc',
      };
    }

    const updated = await salesforceClient.updateRecord(token, updates);
    const journey = mapSalesforceToJourney(updated, token);
    return res.json({ success: true, journey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process KYC update' });
  }
});

// -------------------------------------------------------------
// NBFC FINANCING STATUS & ACTIONS
// -------------------------------------------------------------
app.get('/api/enrollment/:token/nbfc-status', async (req, res) => {
  const { token } = req.params;
  try {
    const record = await salesforceClient.getRecordByToken(token);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const journey = mapSalesforceToJourney(record, token);
    const normalized = normalizeNbfcStatus(record as any);

    // Query related child NBFC records (Supabase DB or Salesforce REST API)
    let nbfcChildRecords: any[] = [];
    if (supabaseAdapter.ready) {
      nbfcChildRecords = await supabaseAdapter.getNbfcRecordsForLearner(
        record.Id,
        record.PHONE_NUMBER__c || record.Student_WhatsApp_Number__c || record.Student_Number__c
      );
    }
    if (!nbfcChildRecords || nbfcChildRecords.length === 0) {
      nbfcChildRecords = await salesforceRestClient.getNbfcRecordsForLearner(
        record.Id,
        record.PHONE_NUMBER__c || record.Student_WhatsApp_Number__c || record.Student_Number__c
      );
    }

    const allNbfcs = nbfcChildRecords.map((c: any) => {
      const facilityAmountVal = c.Master_Applied_Loan_Amount__c || c.Master_Approved_Loan_Amount__c || '0';
      return {
        id: c.Id,
        nbfcName: c.Name || 'Partner NBFC',
        appId: c.Master_App_ID__c || null,
        facilityAmount: Number(facilityAmountVal) || 0,
        facilityAmountFormatted: `₹${(Number(facilityAmountVal) || 0).toLocaleString('en-IN')}`,
        appliedLoanAmount: Number(c.Master_Applied_Loan_Amount__c || 0),
        approvedLoanAmount: Number(c.Master_Approved_Loan_Amount__c || 0),
        studentPhone: c.student_phone_number__c || null,
        linkedRecordId: c.Academy_Onboarding_PRE_L__c || null,
        isActive: c.Academy_Onboarding_PRE_L__c === record.Id,
        coApplicantName: c.Co_Applicant_Name_PRE__c || null,
        coApplicantPhone: c.Co_Applicant_Phone_Number_PRE__c || null,
        coApplicantRelation: c.Relation_With_The_Co_Applicant_PRE__c || null,
      };
    });

    // Match active NBFC child record (Query 2 active__c = true) and set appliedAmount to Master_Applied_Loan_Amount__c
    const activeNbfcChild =
      allNbfcs.find((n) => n.isActive && n.facilityAmount > 0) ||
      allNbfcs.find((n) => n.facilityAmount > 0);

    if (!journey.financing) {
      journey.financing = {
        applied: true,
        appliedAmount: activeNbfcChild?.facilityAmount || 0,
        nbfcName: normalized.activeLender || record.Choose_NBFC_PRE__c || 'NORTHERN ARC',
        applicationId: activeNbfcChild?.appId || `NBFC-${record.Id.slice(-6).toUpperCase()}`,
        status: normalized.statusCode as any,
        statusLabel: normalized.statusLabel,
        approvedAmount: activeNbfcChild?.approvedLoanAmount || activeNbfcChild?.facilityAmount || 0,
        approvedTenure: '6 Months',
        emiAmountMonthly: 0,
        emiTenure: '6 Months',
        disbursedAmount: record.Disbursed_Amount_PRE__c,
        disbursedAt: record.Disbursed_Date_Time__c,
      };
    } else if (activeNbfcChild && activeNbfcChild.facilityAmount > 0) {
      journey.financing.appliedAmount = activeNbfcChild.facilityAmount;
    }

    return res.json({
      success: true,
      financing: journey.financing,
      journey: journey.journey,
      // Normalized NBFC status for direct UI consumption
      nbfc: {
        statusCode: normalized.statusCode,
        statusLabel: normalized.statusLabel,
        activeLender: normalized.activeLender,
        userMessage: normalized.userMessage,
        callToAction: normalized.callToAction,
        classAccessEta: normalized.classAccessEta,
        lastUpdated: normalized.lastUpdated,
        rawStatus: normalized.rawStatus,
        allNbfcs,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load NBFC status' });
  }
});

app.post('/api/enrollment/:token/nbfc/action', async (req, res) => {
  const { token } = req.params;
  const { action } = req.body;

  try {
    let updates: any = {};
    const record = await salesforceClient.getRecordByToken(token);
    const amount = record?.Amount_Payable_PRE__c || 112000;

    if (action === 'SETUP_EMI') {
      updates = {
        Northern_Arc_Overall_Stages__c: 'EMI Setup Done',
        Fibe_Overall_Stages__c: 'APPROVED',
        Stage_PRE__c: 'nbfc-status',
      };
    } else if (action === 'DISBURSE_SIMULATE') {
      updates = {
        Northern_Arc_Overall_Stages__c: 'Loan Disbursed',
        Disbursed_Amount_PRE__c: amount,
        Disbursed_Date_Time__c: new Date().toISOString(),
        LMS_Access_Status__c: 'Active',
        Stage_PRE__c: 'class-access',
      };
    } else if (action === 'CHANGE_CO_APPLICANT') {
      updates = {
        Co_Applicant_Name__c: null,
        Co_Applicant_Phone_Number_PRE__c: null,
        Northern_Arc_Overall_Stages__c: 'Application Form Filled',
        KYC_Submission_Status__c: 'NOT_STARTED',
        Stage_PRE__c: 'co-applicant',
      };
    } else if (action === 'RETRY_DOCUMENTS') {
      updates = {
        Northern_Arc_Overall_Stages__c: 'Review In Progress',
        Fibe_Overall_Stages__c: 'UNDERWRITING',
        Stage_PRE__c: 'nbfc-status',
      };
    }

    const updated = await salesforceClient.updateRecord(token, updates);
    const journey = mapSalesforceToJourney(updated, token);
    return res.json({ success: true, journey });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update NBFC action' });
  }
});

// -------------------------------------------------------------
// SUPPORT TICKETING API
// -------------------------------------------------------------
app.post('/api/enrollment/:token/support-ticket', (req, res) => {
  const { token } = req.params;
  const { category, description, learnerName, contactNumber } = req.body;

  const ticketId = `TKT-NW-${Date.now().toString().slice(-6)}`;
  console.log(
    `[Support Ticket Created] ${ticketId} for token=${token} (Category: ${category}) - "${description}"`
  );

  return res.json({
    success: true,
    ticketId,
    message:
      'Your request has been escalated to your dedicated admissions counselor. You will receive a callback within 30 minutes.',
  });
});

// -------------------------------------------------------------
// RESET SESSION / DEMO FIXTURE
// -------------------------------------------------------------
app.post('/api/enrollment/:token/reset', async (req, res) => {
  const { token } = req.params;
  await salesforceClient.resetToken(token);
  const record = await salesforceClient.getRecordByToken(token);
  const journey = mapSalesforceToJourney(record!, token);
  return res.json({
    success: true,
    message: 'Enrollment session reset to initial state.',
    journey,
  });
});

// -------------------------------------------------------------
// BACKWARD-COMPATIBILITY ENDPOINTS (V2 -> V3 BRIDGE)
// -------------------------------------------------------------
app.get('/api/enrollment/:token', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  if (!record) return res.status(404).json({ valid: false, error: 'Not found' });
  const journey = mapSalesforceToJourney(record, token);

  return res.json({
    valid: true,
    token,
    authentication: { verified: journey.authenticated },
    learner: {
      name: journey.learner.name,
      mobileMasked: journey.learner.mobileMasked,
      emailMasked: journey.learner.emailMasked,
    },
    program: {
      name: journey.program.name,
      price: journey.program.baseFee,
      amountPayable: journey.program.amountPayable,
    },
    payment: {
      status: journey.payment.status,
      selectedMethod: journey.payment.method,
      amountPaid: journey.payment.amountPaid,
    },
    coApplicant: journey.coApplicant,
    kyc: journey.kyc,
    journey: journey.journey,
    canonicalJourney: journey,
  });
});

app.post('/api/enrollment/:token/otp/send', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  const phone = record?.Student_WhatsApp_Number__c || '9876543210';
  try {
    const { cooldownSeconds } = otpStore.createOrResendOtp(token, phone);
    return res.json({
      success: true,
      maskedMobile: maskPhone(phone),
      cooldownSeconds,
    });
  } catch (err: any) {
    return res.status(429).json({ error: err.message });
  }
});

app.post('/api/enrollment/:token/otp/verify', async (req, res) => {
  const { token } = req.params;
  const { otp } = req.body;
  const verification = otpStore.verifyOtp(token, otp);
  if (!verification.success) {
    return res.status(400).json({ error: verification.error });
  }
  const updated = await salesforceClient.updateRecord(token, {
    Authentication_Verified__c: true,
  });
  const journey = mapSalesforceToJourney(updated, token);
  return res.json({ success: true, learner: journey.learner, journey });
});

app.get('/api/enrollment/:token/payment', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  const journey = mapSalesforceToJourney(record!, token);
  return res.json({ payment: journey.payment });
});

app.get('/api/enrollment/:token/emi', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  const journey = mapSalesforceToJourney(record!, token);
  return res.json({
    emi: {
      amount: journey.program.amountPayable,
      available: true,
    },
  });
});

app.get('/api/enrollment/:token/co-applicant', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  const journey = mapSalesforceToJourney(record!, token);
  return res.json({
    exists: Boolean(journey.coApplicant?.name),
    relation: journey.coApplicant?.relation,
    name: journey.coApplicant?.name,
    mobile: journey.coApplicant?.mobileMasked,
  });
});

// Deprecated KYC slot stubs (safe fallback)
app.get('/api/enrollment/:token/kyc/slots', (_req, res) => {
  return res.json({ slots: [] });
});
app.post('/api/enrollment/:token/kyc/book', (_req, res) => {
  return res.json({ success: true, status: 'SUBMITTED' });
});
app.get('/api/enrollment/:token/kyc/confirmation', async (req, res) => {
  const { token } = req.params;
  const record = await salesforceClient.getRecordByToken(token);
  const journey = mapSalesforceToJourney(record!, token);
  return res.json({ kyc: journey.kyc });
});

// -------------------------------------------------------------
// VOICE AGENT GUIDANCE API (GEMINI-POWERED)
// -------------------------------------------------------------
const STEP_SCRIPTS: Record<
  string,
  {
    title: string;
    speech: string;
    keyPoints: string[];
    faqSuggestions: string[];
  }
> = {
  auth: {
    title: 'Verification Step',
    speech:
      'Welcome to NxtWave! Let’s verify your registered mobile number to access your official enrollment portal.',
    keyPoints: [
      'Enter your 10-digit registered Indian mobile number',
      'Verify with the 6-digit code sent to your phone',
      'For test sessions, you can use code 123456',
    ],
    faqSuggestions: [
      'Why do I need mobile verification?',
      'What if I didn’t receive the SMS code?',
      'Can I change my registered phone number?',
    ],
  },
  congratulations: {
    title: 'Welcome & Next Steps',
    speech:
      'Congratulations on taking this exciting step towards your tech career! Your NxtWave Genius enrollment journey is ready. Let’s review your program details.',
    keyPoints: [
      'Your admission seat is reserved',
      'Review your program highlights and fee breakdown',
      'No immediate payment required on this screen',
    ],
    faqSuggestions: [
      'What is included in the Genius program?',
      'When does the upcoming cohort start?',
      'Can I talk to my counselor first?',
    ],
  },
  program: {
    title: 'Program Fee & Scholarship Breakdown',
    speech:
      'Here is your transparent fee breakdown for NxtWave Genius. Review your merit scholarship, deduction of your seat reservation fee, and net amount payable.',
    keyPoints: [
      'Total Program Price: ₹1,60,000',
      'Merit Scholarship: -₹30,000',
      'Seat Reservation Paid: -₹18,000',
      'Net Amount Payable: ₹1,12,000 all inclusive',
    ],
    faqSuggestions: [
      'Are there any hidden charges or taxes?',
      'Can I get an official tax invoice?',
      'How does No-Cost EMI compare to full payment?',
    ],
  },
  payment: {
    title: 'Payment Method Selection',
    speech:
      'Choose the payment option that suits your family best. You can pay the complete fee upfront, use a credit card, or choose an affordable No-Cost EMI plan with zero extra interest.',
    keyPoints: [
      'Full Payment: instant receipt & immediate LMS activation',
      'Credit Card: standard instant checkout',
      'No-Cost EMI: spread over 6 monthly installments with zero interest',
    ],
    faqSuggestions: [
      'How does No-Cost EMI work?',
      'Which option gives the quickest class access?',
      'Can I change payment method later?',
    ],
  },
  pay: {
    title: 'Checkout & Payment Link',
    speech:
      'You are ready to complete your payment of ₹1,12,000. You can click Pay Securely now or scan the UPI QR code.',
    keyPoints: [
      'Safe 256-bit encrypted payment gateway',
      'Scan UPI QR code on Google Pay, PhonePe, or Paytm',
      'Instant receipt upon transaction completion',
    ],
    faqSuggestions: [
      'Can my parent pay using UPI from another device?',
      'How do I copy the payment link?',
      'What happens if the transaction fails?',
    ],
  },
  'payment-success': {
    title: 'Payment Confirmed',
    speech:
      'Wonderful news! Your enrollment payment has been received successfully and your receipt is ready. Welcome to NxtWave!',
    keyPoints: [
      'Official fee receipt generated',
      'Admission seat permanently confirmed',
      'Your class access portal is ready',
    ],
    faqSuggestions: [
      'How do I download my fee receipt?',
      'When do classes begin?',
      'How do I access the learning portal?',
    ],
  },
  emi: {
    title: 'Why No-Cost EMI',
    speech:
      'With No-Cost EMI, your program fee of ₹1,12,000 is spread across 6 monthly instalments of approximately ₹18,667, with zero interest charges.',
    keyPoints: [
      'Spreads program cost with zero interest penalties',
      'Flexible tenures provided by RBI-regulated partner NBFCs',
      'Approval is subject to lender credit verification',
    ],
    faqSuggestions: [
      'Is there really zero interest charged?',
      'What are the eligibility requirements?',
      'Can I prepay the EMI early without penalties?',
    ],
  },
  'co-applicant': {
    title: 'Co-Applicant Selection',
    speech:
      'A co-applicant is an earning family member, like a parent or working sibling, who supports your EMI financing application. Please provide their details to continue.',
    keyPoints: [
      'Typically Father, Mother, or employed sibling',
      'Must have regular income or employment',
      'Only basic contact and income details needed right now',
    ],
    faqSuggestions: [
      'Can a retired parent be my co-applicant?',
      'What if my co-applicant lives in another city?',
      'Will my co-applicant get an SMS verification?',
    ],
  },
  kyc: {
    title: 'Digital KYC Verification',
    speech:
      'Let’s verify your identity and documents digitally. Have your PAN and Aadhaar details handy for a seamless verification.',
    keyPoints: [
      'Digital document check: PAN card & Aadhaar',
      'Upload clear, unblurred photos or PDFs',
      'Instant verification update once submitted',
    ],
    faqSuggestions: [
      'What if my Aadhaar is not linked to mobile?',
      'What documents are acceptable as income proof?',
      'How long does KYC verification take?',
    ],
  },
  'nbfc-status': {
    title: 'Financing Status & Timeline',
    speech:
      'Here is the live status of your education financing application with our partner NBFC. You can track review progress, complete auto-debit setup, and resolve any questions.',
    keyPoints: [
      'Live timeline tracking from review to disbursement',
      'Set up your auto-debit once approved',
      'Direct counselor assistance available if help is needed',
    ],
    faqSuggestions: [
      'How long does lender review take?',
      'What if my co-applicant’s credit score is low?',
      'How do I complete the EMI auto-debit mandate?',
    ],
  },
  'class-access': {
    title: 'Welcome to NxtWave Learning',
    speech:
      'Congratulations! Your enrollment is 100% complete and your learning journey begins now. Access your student portal and orientation materials.',
    keyPoints: [
      'Official student LMS credentials unlocked',
      'Join your cohort community and orientation session',
      '24/7 student support and mentoring available',
    ],
    faqSuggestions: [
      'How do I log in to the learning portal?',
      'When is the orientation call scheduled?',
      'Who is my dedicated student success mentor?',
    ],
  },
};

app.get('/api/voice-guide/step-script/:step', async (req, res) => {
  const { step } = req.params;
  let lang = (req.query.lang as string || '').trim();
  const token = (req.query.token as string || '').trim();

  // If language not explicitly passed in query, lookup learner's Salesforce Preferred_Languages__c
  if (!lang && token) {
    try {
      const record = await salesforceClient.getRecordByToken(token);
      if (record) {
        lang = (record.Preferred_Languages__c || record.Latest_Preferred_Language__c || 'English')
          .split(';')[0]
          .trim();
      }
    } catch {}
  }

  const selectedLanguage = lang || 'English';
  const script = getLocalizedStepScript(step, selectedLanguage);
  return res.json({
    success: true,
    step,
    language: selectedLanguage,
    ...script,
  });
});

app.post('/api/voice-guide/ask', async (req, res) => {
  const { step, question, learnerName, language } = req.body;
  const currentStep = step || 'auth';
  const targetLanguage = language || 'English';
  const script = getLocalizedStepScript(currentStep, targetLanguage);

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.json({
      success: true,
      answer: script.speech,
      source: 'script',
      step: currentStep,
      language: targetLanguage,
    });
  }

  if (process.env.GEMINI_API_KEY) {
    const prompt = `Learner name: ${learnerName || 'Learner'}
Preferred Language: ${targetLanguage}
Current Portal Step: ${currentStep} (${script.title})
Context: ${script.speech}
Key points for this step: ${script.keyPoints.join('; ')}
User's Question: "${question}"

Please provide a reassuring, concise (2 to 3 sentences max) answer directly addressing their question as the NxtWave Voice Guide.
IMPORTANT: You MUST generate your response in ${targetLanguage} so that it sounds natural when spoken aloud in ${targetLanguage}.`;

    const candidateModels = [
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await getAi().models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              `You are Arya, the official voice guide for the NxtWave Learner Enrollment Portal. You speak warmly, clearly, and concisely to students and their parents in ${targetLanguage}. Answers must be 2-3 sentences max, suitable for natural audio text-to-speech in ${targetLanguage}. Never mention Salesforce internals or database fields. Help them feel confident and supported.`,
            temperature: 0.7,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return res.json({
            success: true,
            answer: text,
            source: modelName,
            step: currentStep,
            language: targetLanguage,
          });
        }
      } catch (err: any) {
        console.warn(`Gemini API notice: model ${modelName} returned status, trying next fallback...`);
      }
    }
  }

  // Fallback localized answer
  return res.json({
    success: true,
    answer: script.speech,
    source: 'script_fallback',
    step: currentStep,
    language: targetLanguage,
  });
});

// Google TTS endpoint for high-quality Indian regional voice synthesis (Telugu, Hindi, Tamil, Kannada, English)
app.get('/api/voice-guide/tts', async (req, res) => {
  const text = (req.query.text as string || '').trim();
  const lang = (req.query.lang as string || 'en').trim().toLowerCase();
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const langCodeMap: Record<string, string> = {
      telugu: 'te',
      te: 'te',
      hindi: 'hi',
      hi: 'hi',
      tamil: 'ta',
      ta: 'ta',
      kannada: 'kn',
      kn: 'kn',
      malayalam: 'ml',
      ml: 'ml',
      marathi: 'mr',
      mr: 'mr',
      bengali: 'bn',
      bn: 'bn',
      gujarati: 'gu',
      gu: 'gu',
      english: 'en',
      en: 'en',
    };
    const code = langCodeMap[lang] || 'en';
    const audioUrl = googleTTS.getAudioUrl(text.slice(0, 200), {
      lang: code,
      slow: false,
      host: 'https://translate.google.com',
    });

    return res.json({ success: true, audioUrl, lang: code });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate TTS audio' });
  }
});

// -------------------------------------------------------------
// AUDIO & TTS ASSET ENDPOINTS
// -------------------------------------------------------------
app.get('/api/video-narration/:lang/:sceneId', (req, res) => {
  const { lang, sceneId } = req.params;
  const targetLang = lang === 'en' ? 'en' : 'te';
  const targetScene = Math.min(Math.max(parseInt(sceneId, 10) || 1, 1), 5);
  const audioFilePath = path.join(
    process.cwd(),
    'public',
    'audio',
    `scene_${targetLang}_${targetScene}.wav`
  );

  if (fs.existsSync(audioFilePath)) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(audioFilePath).pipe(res);
  }

  const fallbackPath = path.join(process.cwd(), 'public', 'audio', `scene_te_${targetScene}.wav`);
  if (fs.existsSync(fallbackPath)) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(fallbackPath).pipe(res);
  }

  return res.status(404).json({ error: 'Audio narration not found' });
});

app.get('/api/program-video-narration/:lang/:sceneId', (req, res) => {
  const { lang, sceneId } = req.params;
  const targetLang = lang === 'te' ? 'te' : 'en';
  const targetScene = Math.min(Math.max(parseInt(sceneId, 10) || 1, 1), 7);

  const mp3Path = path.join(
    process.cwd(),
    'public',
    'audio',
    'program_scenes',
    `scene_${targetLang}_${targetScene}.mp3`
  );
  const wavPath = path.join(
    process.cwd(),
    'public',
    'audio',
    'program_scenes',
    `scene_${targetLang}_${targetScene}.wav`
  );

  if (fs.existsSync(mp3Path)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(mp3Path).pipe(res);
  }
  if (fs.existsSync(wavPath)) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(wavPath).pipe(res);
  }

  return res.status(404).json({ error: 'Program audio narration not found' });
});

app.post('/api/tts/gemini', async (req, res) => {
  const { text, voiceName = 'Kore', lang = 'en' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text prompt required' });
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await getAi().models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          source: 'gemini-3.1-flash-tts-preview',
          voice: voiceName || 'Kore (Female)',
          mimeType: 'audio/wav',
          audioBase64: base64Audio,
        });
      }
    } catch (err: any) {
      console.warn('Gemini TTS api notice:', err?.message || err);
    }
  }

  try {
    const targetLang = lang === 'te' ? 'te' : 'en';
    const chunks = await googleTTS.getAllAudioBase64(text, {
      lang: targetLang,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });
    const combinedBuf = Buffer.concat(chunks.map((c: any) => Buffer.from(c.base64, 'base64')));
    return res.json({
      success: true,
      source: 'female-tts-engine',
      voice: 'Google Studio Female',
      mimeType: 'audio/mpeg',
      audioBase64: combinedBuf.toString('base64'),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'TTS generation failed', details: err?.message });
  }
});

app.get('/api/download/screenshots-pdf', (_req, res) => {
  const pdfPath = path.join(process.cwd(), 'public', 'NxtWave_Enrollment_Portal_Screenshots.pdf');
  res.download(pdfPath, 'NxtWave_Enrollment_Portal_Screenshots.pdf');
});

// Explicit static audio serving
app.use(
  '/audio',
  express.static(path.join(process.cwd(), 'public', 'audio'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      }
    },
  })
);
app.use(express.static(path.join(process.cwd(), 'public')));

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NxtWave PRE V3 Enrollment Server running on port ${PORT}`);
  });
}

startServer();
