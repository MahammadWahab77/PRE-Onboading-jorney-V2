import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SalesforceOnboardingRecord } from '../salesforce/types';

export class SupabaseAdapter {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://jqxmyxuagerayrgvxjwg.supabase.co';
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
      this.isConfigured = true;
    }
  }

  public get ready(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public async getRecordByToken(token: string): Promise<SalesforceOnboardingRecord | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('enrollments')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Error fetching enrollment by token:', error.message);
        return null;
      }
      if (!data) return null;

      return this.mapRowToRecord(data);
    } catch (err: any) {
      console.error('[Supabase] Exception fetching token:', err.message);
      return null;
    }
  }

  public async findRecordByMobile(cleanPhone: string): Promise<SalesforceOnboardingRecord | null> {
    if (!this.client) return null;

    const formatted = cleanPhone.replace(/\D/g, '').slice(-10);
    try {
      const { data, error } = await this.client
        .from('enrollments')
        .select('*')
        .or(`phone_number.ilike.%${formatted}%,whatsapp_number.ilike.%${formatted}%`)
        .limit(1);

      if (error) {
        console.error('[Supabase] Error finding enrollment by mobile:', error.message);
        return null;
      }

      if (!data || data.length === 0) return null;
      return this.mapRowToRecord(data[0]);
    } catch (err: any) {
      console.error('[Supabase] Exception finding mobile:', err.message);
      return null;
    }
  }

  public async updateRecord(
    token: string,
    updates: Partial<SalesforceOnboardingRecord>
  ): Promise<SalesforceOnboardingRecord | null> {
    if (!this.client) return null;

    const rowUpdates = this.mapRecordToRow(updates);
    rowUpdates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await this.client
        .from('enrollments')
        .update(rowUpdates)
        .eq('token', token)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating enrollment record:', error.message);
        return null;
      }

      return this.mapRowToRecord(data);
    } catch (err: any) {
      console.error('[Supabase] Exception updating record:', err.message);
      return null;
    }
  }
  public async getNbfcRecordsForLearner(
    activeRecordId: string,
    phone?: string | null
  ): Promise<any[]> {
    if (!this.client) return [];

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    try {
      let query = this.client.from('nbfc_onboarding').select('*');

      if (activeRecordId && cleanPhone && cleanPhone.length >= 7) {
        query = query.or(`academy_onboarding_pre_l_c.eq.${activeRecordId},student_phone_number_c.ilike.%${cleanPhone}%`);
      } else if (activeRecordId) {
        query = query.eq('academy_onboarding_pre_l_c', activeRecordId);
      } else if (cleanPhone && cleanPhone.length >= 7) {
        query = query.ilike('student_phone_number_c', `%${cleanPhone}%`);
      } else {
        return [];
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

      if (error) {
        console.error('[Supabase] Error fetching NBFC records:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((row: any) => ({
        Id: row.id,
        Name: row.name || 'Partner NBFC',
        Master_App_ID__c: row.master_app_id_c || null,
        Master_Applied_Loan_Amount__c: Number(row.master_applied_loan_amount_c) || 0,
        Master_Approved_Loan_Amount__c: Number(row.master_approved_loan_amount_c) || 0,
        student_phone_number__c: row.student_phone_number_c || null,
        Academy_Onboarding_PRE_L__c: row.academy_onboarding_pre_l_c || null,
        Co_Applicant_Name_PRE__c: row.co_applicant_name_pre_c || null,
        Co_Applicant_Phone_Number_PRE__c: row.co_applicant_phone_number_pre_c || null,
        Relation_With_The_Co_Applicant_PRE__c: row.relation_with_the_co_applicant_pre_c || null,
        Active__c: Boolean(row.active_c),
      }));
    } catch (err: any) {
      console.error('[Supabase] Exception fetching NBFC records:', err.message);
      return [];
    }
  }

  public mapRowToRecord(row: any): SalesforceOnboardingRecord {
    return {
      Id: row.id,
      Name: `PRE-${row.token}`,
      Token__c: row.token,
      Student_Name__c: row.student_name,
      PHONE_NUMBER__c: row.phone_number,
      Student_WhatsApp_Number__c: row.whatsapp_number,
      Student_Number__c: row.phone_number,
      Email_PRE__c: row.email,
      Date_of_Birth__c: row.date_of_birth,
      Program_PRE__c: row.program_name || 'NxtWave Program',
      Program_Registered_UID_PRE__c: row.program_uid,
      Product_Price__c: Number(row.product_price) || 0,
      Scholarship_Amount__c: Number(row.scholarship_amount) || 0,
      Seat_Reservation_Amount_Paid__c: Number(row.seat_reservation_paid) || 0,
      Amount_Payable_PRE__c: Number(row.amount_payable) || 0,
      Amount_Paid_Till_Now_To_Nxtwave_PRE__c: Number(row.amount_paid) || 0,
      Payment_Plan_PRE__c: row.payment_plan,
      Payment_Status__c: row.payment_status,
      Payment_Date_Time__c: row.payment_date_time,
      Receipt_Id__c: row.receipt_id,
      Applied_Loan_Amount__c: Number(row.applied_loan_amount) || undefined,
      EMI_Tenure_PRE__c: row.emi_tenure,
      Eligible_NBFCs_PRE__c: row.eligible_nbfcs,
      Choose_NBFC_PRE__c: row.choose_nbfc,
      Effective_Approved_Amount__c: Number(row.effective_approved_amount) || undefined,
      Disbursed_Amount_PRE__c: Number(row.disbursed_amount) || undefined,
      Disbursed_Date_Time__c: row.disbursed_date_time,
      Co_Applicant_Name__c: row.co_applicant_name,
      Co_Applicant_Phone_Number_PRE__c: row.co_applicant_phone,
      Co_Applicant_Mail_ID_PRE__c: row.co_applicant_email,
      Relation_With_The_Co_Applicant_PRE__c: row.co_applicant_relation,
      Co_Applicant_Age_PRE__c: row.co_applicant_age,
      Co_Applicant_Employment_Type_PRE__c: row.co_applicant_employment_type,
      Co_Applicant_Occupation_PRE__c: row.co_applicant_occupation,
      Co_Applicant_Monthly_Income_Range_PRE__c: row.co_applicant_monthly_income_range,
      CIBIL_Score_Range_PRE__c: row.cibil_score_range,
      Co_Applicant_State_PRE__c: row.co_applicant_state,
      Co_Applicant_Address_PRE__c: row.co_applicant_address,
      KYC_Submission_Status__c: row.kyc_submission_status || 'NOT_STARTED',
      KYC_Submission_Status_PRE__c: row.kyc_submission_status || 'NOT_STARTED',
      KYC_Submission_Date_and_Time__c: row.kyc_submission_date_time,
      Documents_Requested_By_Reps__c: row.documents_requested,
      Northern_Arc_Overall_Stages__c: row.nbfc_overall_stages,
      Northern_Arc_Remarks__c: row.nbfc_remarks,
      Northern_Arc_Rejected_Reasons__c: row.nbfc_rejected_reasons,
      LMS_Access_Status__c: row.lms_access_status || 'Locked',
      LMS_Access_URL__c: row.lms_access_url,
      Batch_Start_Date__c: row.batch_start_date,
      Authentication_Verified__c: Boolean(row.authentication_verified),
    };
  }

  public mapRecordToRow(record: Partial<SalesforceOnboardingRecord>): Record<string, any> {
    const row: Record<string, any> = {};

    if (record.Student_Name__c !== undefined) row.student_name = record.Student_Name__c;
    if (record.PHONE_NUMBER__c !== undefined) row.phone_number = record.PHONE_NUMBER__c;
    if (record.Student_WhatsApp_Number__c !== undefined) row.whatsapp_number = record.Student_WhatsApp_Number__c;
    if (record.Email_PRE__c !== undefined) row.email = record.Email_PRE__c;
    if (record.Date_of_Birth__c !== undefined) row.date_of_birth = record.Date_of_Birth__c;
    if (record.Program_PRE__c !== undefined) row.program_name = record.Program_PRE__c;
    if (record.Program_Registered_UID_PRE__c !== undefined) row.program_uid = record.Program_Registered_UID_PRE__c;
    if (record.Product_Price__c !== undefined) row.product_price = record.Product_Price__c;
    if (record.Scholarship_Amount__c !== undefined) row.scholarship_amount = record.Scholarship_Amount__c;
    if (record.Seat_Reservation_Amount_Paid__c !== undefined) row.seat_reservation_paid = record.Seat_Reservation_Amount_Paid__c;
    if (record.Amount_Payable_PRE__c !== undefined) row.amount_payable = record.Amount_Payable_PRE__c;
    if (record.Amount_Paid_Till_Now_To_Nxtwave_PRE__c !== undefined) row.amount_paid = record.Amount_Paid_Till_Now_To_Nxtwave_PRE__c;
    if (record.Payment_Plan_PRE__c !== undefined) row.payment_plan = record.Payment_Plan_PRE__c;
    if (record.Payment_Status__c !== undefined) row.payment_status = record.Payment_Status__c;
    if (record.Payment_Date_Time__c !== undefined) row.payment_date_time = record.Payment_Date_Time__c;
    if (record.Receipt_Id__c !== undefined) row.receipt_id = record.Receipt_Id__c;
    if (record.Applied_Loan_Amount__c !== undefined) row.applied_loan_amount = record.Applied_Loan_Amount__c;
    if (record.EMI_Tenure_PRE__c !== undefined) row.emi_tenure = record.EMI_Tenure_PRE__c;
    if (record.Choose_NBFC_PRE__c !== undefined) row.choose_nbfc = record.Choose_NBFC_PRE__c;
    if (record.Effective_Approved_Amount__c !== undefined) row.effective_approved_amount = record.Effective_Approved_Amount__c;
    if (record.Disbursed_Amount_PRE__c !== undefined) row.disbursed_amount = record.Disbursed_Amount_PRE__c;
    if (record.Disbursed_Date_Time__c !== undefined) row.disbursed_date_time = record.Disbursed_Date_Time__c;
    if (record.Co_Applicant_Name__c !== undefined) row.co_applicant_name = record.Co_Applicant_Name__c;
    if (record.Co_Applicant_Phone_Number_PRE__c !== undefined) row.co_applicant_phone = record.Co_Applicant_Phone_Number_PRE__c;
    if (record.Co_Applicant_Mail_ID_PRE__c !== undefined) row.co_applicant_email = record.Co_Applicant_Mail_ID_PRE__c;
    if (record.Relation_With_The_Co_Applicant_PRE__c !== undefined) row.co_applicant_relation = record.Relation_With_The_Co_Applicant_PRE__c;
    if (record.Co_Applicant_Age_PRE__c !== undefined) row.co_applicant_age = record.Co_Applicant_Age_PRE__c;
    if (record.Co_Applicant_Employment_Type_PRE__c !== undefined) row.co_applicant_employment_type = record.Co_Applicant_Employment_Type_PRE__c;
    if (record.Co_Applicant_Occupation_PRE__c !== undefined) row.co_applicant_occupation = record.Co_Applicant_Occupation_PRE__c;
    if (record.Co_Applicant_Monthly_Income_Range_PRE__c !== undefined) row.co_applicant_monthly_income_range = record.Co_Applicant_Monthly_Income_Range_PRE__c;
    if (record.CIBIL_Score_Range_PRE__c !== undefined) row.cibil_score_range = record.CIBIL_Score_Range_PRE__c;
    if (record.Co_Applicant_State_PRE__c !== undefined) row.co_applicant_state = record.Co_Applicant_State_PRE__c;
    if (record.Co_Applicant_Address_PRE__c !== undefined) row.co_applicant_address = record.Co_Applicant_Address_PRE__c;
    if (record.KYC_Submission_Status__c !== undefined) row.kyc_submission_status = record.KYC_Submission_Status__c;
    if (record.KYC_Submission_Status_PRE__c !== undefined) row.kyc_submission_status = record.KYC_Submission_Status_PRE__c;
    if (record.Northern_Arc_Overall_Stages__c !== undefined) row.nbfc_overall_stages = record.Northern_Arc_Overall_Stages__c;
    if (record.Northern_Arc_Remarks__c !== undefined) row.nbfc_remarks = record.Northern_Arc_Remarks__c;
    if (record.Northern_Arc_Rejected_Reasons__c !== undefined) row.nbfc_rejected_reasons = record.Northern_Arc_Rejected_Reasons__c;
    if (record.LMS_Access_Status__c !== undefined) row.lms_access_status = record.LMS_Access_Status__c;
    if (record.LMS_Access_URL__c !== undefined) row.lms_access_url = record.LMS_Access_URL__c;
    if (record.Authentication_Verified__c !== undefined) row.authentication_verified = record.Authentication_Verified__c;

    return row;
  }
}

export const supabaseAdapter = new SupabaseAdapter();
