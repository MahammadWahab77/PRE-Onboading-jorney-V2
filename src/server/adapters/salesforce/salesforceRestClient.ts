import type { SalesforceOnboardingRecord } from './types';
import { normalizeIndianPhone, getIndianPhoneSearchVariants } from '../../domain/phoneNormalizer';
import { selectActiveRecord } from '../../domain/activeRecordResolver';

interface OAuthTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export class SalesforceRestClient {
  private loginUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.loginUrl = process.env.SF_LOGIN_URL || 'https://computing-ability-6555.my.salesforce.com';
    this.clientId = process.env.SF_CLIENT_ID || '';
    this.clientSecret = process.env.SF_CLIENT_SECRET || '';
  }

  public get isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Authenticate with Salesforce using OAuth 2.0 Client Credentials Flow
   */
  public async authenticate(): Promise<boolean> {
    if (!this.isConfigured) return false;

    // Return cached token if valid (5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return true;
    }

    try {
      console.log(`[Salesforce REST] 🔐 Authenticating with ${this.loginUrl}...`);
      const bodyParams = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const res = await fetch(`${this.loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        console.error('[Salesforce REST] OAuth authentication failed:', data.error, data.error_description);
        return false;
      }

      const tokenData = data as OAuthTokenResponse;
      this.accessToken = tokenData.access_token;
      this.instanceUrl = tokenData.instance_url;
      // Salesforce tokens typically expire in 2 hours
      this.tokenExpiresAt = Date.now() + 2 * 60 * 60 * 1000;

      console.log(`[Salesforce REST] ✅ Authenticated successfully. Instance: ${this.instanceUrl}`);
      return true;
    } catch (err: any) {
      console.error('[Salesforce REST] Exception during authentication:', err.message);
      return false;
    }
  }

  /**
   * Execute SOQL query against Salesforce REST API
   */
  public async query(soql: string): Promise<any[]> {
    const authed = await this.authenticate();
    if (!authed || !this.instanceUrl || !this.accessToken) {
      return [];
    }

    try {
      const url = `${this.instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(soql)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('[Salesforce REST] SOQL query error:', errorData);
        return [];
      }

      const data = await res.json();
      return data.records || [];
    } catch (err: any) {
      console.error('[Salesforce REST] Query exception:', err.message);
      return [];
    }
  }

  private readonly ACADEMY_PRE_FIELDS = `
    Id, Name, PHONE_NUMBER__c, Student_Number__c, Student_WhatsApp_Number__c,
    Parent_Guardian_Phone_Number_PRE__c, Email_PRE__c, Date_of_Birth__c, Gender__c,
    Program_PRE__c, Program_Registered_UID_PRE__c, userId__c,
    Product_Price__c, Total_Amount_to_be_Paid__c, Amount_Payable_PRE__c, Amount_to_be_Receive__c,
    Amount_Paid_Till_Now_To_Nxtwave_PRE__c, Total_Amount_PRE__c, Remaining_Amount_To_Be_Paid_PRE__c,
    Seat_Reservation_Amount_Paid__c,
    Payment_Plan_PRE__c, Current_Payment_Status__c, Down_Payment_Done_On_PRE__c, DP_Order_ID_PRE__c,
    Applied_Loan_Amount__c, Total_Tenure_PRE__c, EMI_Tenure_PRE__c, Eligible_NBFCs_PRE__c, Choose_NBFC_PRE__c,
    Effective_Approved_Amount__c, NBFC_Application_ID_PRE__c,
    Disbursed_Amount_PRE__c, Disbursed_Date_Time__c, Disbursed_NBFC_Name__c, Total_Disbursed_Loan_Amount__c,
    NBFC_Status__c, Status_Of_Decision_in_NBFC_PRE__c, Jodo_Status__c, Jodo_Approved__c, Jodo_Selected__c,
    Co_Applicant_Name__c, Co_Applicant_Phone_Number_PRE__c, Co_Applicant_Mail_ID_PRE__c,
    Relation_with_the_Co_Applicant__c, Co_Applicant_Age_PRE__c, Co_Applicant_Employment_Type_PRE__c,
    Co_applicant_Occupation_PRE__c, Co_Applicant_Monthly_Income_PRE__c, Co_Applicant_s_Monthly_Income_Range_PRE__c,
    CIBIL_Score_Range_PRE__c, Co_Applicant_State_PRE__c, Co_Applicant_Address_PRE__c,
    KYC_Submission_Status_PRE__c, KYC_Submission_Date_and_Time_PRE__c, KYC_Submitted__c,
    Onboarding_Status__c, Remarks_PRE__c, Stage_PRE__c,
    Preferred_Languages__c, Latest_Preferred_Language__c,
    CreatedDate, LastModifiedDate
  `.trim().replace(/\s+/g, ' ');

  private normalizeRecord(raw: any, token?: string): SalesforceOnboardingRecord {
    const isFullPaymentDone = Boolean(raw.Payment_Done_PRE__c);
    const prefLang = raw.Preferred_Languages__c || raw.Latest_Preferred_Language__c || 'English';
    return {
      ...raw,
      Student_Name__c: raw.Student_Name__c || raw.Name || 'Learner',
      Token__c: token || raw.userId__c || raw.Id,
      Stage_PRE__c: raw.Stage_PRE__c || null,
      Preferred_Languages__c: prefLang,
      Latest_Preferred_Language__c: raw.Latest_Preferred_Language__c || prefLang,
      Relation_With_The_Co_Applicant_PRE__c:
        raw.Relation_With_The_Co_Applicant_PRE__c || raw.Relation_with_the_Co_Applicant__c,
      Co_Applicant_Occupation_PRE__c:
        raw.Co_Applicant_Occupation_PRE__c || raw.Co_applicant_Occupation_PRE__c,
      Co_Applicant_Monthly_Income_Range_PRE__c:
        raw.Co_Applicant_Monthly_Income_Range_PRE__c || raw.Co_Applicant_s_Monthly_Income_Range_PRE__c,
      Payment_Status__c:
        raw.Payment_Status__c || (isFullPaymentDone ? 'Success' : raw.Current_Payment_Status__c || 'Pending'),
    };
  }

  public async getRecordByToken(token: string): Promise<SalesforceOnboardingRecord | null> {
    if (!token) return null;

    const sanitized = token.replace(/['"\\]/g, '');
    let whereClause: string;

    // Support legacy/demo token alias mapped to real live record
    if (sanitized === 'nw_rahul_genius_2026') {
      whereClause = "Id = 'a03IT00001HXuViYAL'";
    } else if (/^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(sanitized)) {
      // 15 or 18 character Salesforce ID
      whereClause = `Id = '${sanitized}'`;
    } else {
      // UUID, DP_Order_ID, or other custom identifier
      whereClause = `userId__c = '${sanitized}' OR Program_Registered_UID_PRE__c = '${sanitized}' OR DP_Order_ID_PRE__c = '${sanitized}'`;
    }

    const soql = `SELECT ${this.ACADEMY_PRE_FIELDS} FROM Academy_Onboarding_PRE__c WHERE ${whereClause} LIMIT 1`;
    const records = await this.query(soql);
    if (!records || records.length === 0) return null;

    const normalized = this.normalizeRecord(records[0], token);
    console.log('[EnrollmentSFRead]', {
      recordId: normalized.Id,
      onboardingStatus: normalized.Onboarding_Status__c,
      stagePre: normalized.Stage_PRE__c,
      lastModifiedDate: (normalized as any).LastModifiedDate || (records[0] as any).LastModifiedDate,
    });
    return normalized;
  }

  /**
   * Find all matching records for a phone number across all CRM mobile/phone fields
   */
  public async findRecordsByPhone(inputPhone: string): Promise<SalesforceOnboardingRecord[]> {
    const normalized = normalizeIndianPhone(inputPhone);
    if (!normalized) return [];

    const variants = getIndianPhoneSearchVariants(normalized);
    // Build precise IN clause for SOQL query
    const variantList = variants.map((v) => `'${v}'`).join(', ');

    const soql = `
      SELECT ${this.ACADEMY_PRE_FIELDS}
      FROM Academy_Onboarding_PRE__c
      WHERE Student_Number__c IN (${variantList})
         OR Student_WhatsApp_Number__c IN (${variantList})
         OR PHONE_NUMBER__c IN (${variantList})
         OR Parent_Guardian_Phone_Number_PRE__c IN (${variantList})
         OR Student_Number__c LIKE '%${normalized}%'
         OR Student_WhatsApp_Number__c LIKE '%${normalized}%'
         OR PHONE_NUMBER__c LIKE '%${normalized}%'
      ORDER BY LastModifiedDate DESC, CreatedDate DESC
      LIMIT 20
    `.trim().replace(/\s+/g, ' ');

    const rawRecords = await this.query(soql);
    return (rawRecords || []).map((rec: any) => this.normalizeRecord(rec, rec.userId__c || rec.Id));
  }

  /**
   * Finds the single authoritative active Salesforce record for a given phone number
   */
  public async findActiveRecordByPhone(inputPhone: string): Promise<{
    selected: SalesforceOnboardingRecord | null;
    isAmbiguous: boolean;
    candidateCount: number;
    eligibleCount: number;
    allRecords: SalesforceOnboardingRecord[];
  }> {
    const allRecords = await this.findRecordsByPhone(inputPhone);
    const resolution = selectActiveRecord(allRecords);

    return {
      selected: resolution.selected,
      isAmbiguous: resolution.isAmbiguous,
      candidateCount: resolution.candidateCount,
      eligibleCount: resolution.eligibleCount,
      allRecords,
    };
  }

  public async findRecordByMobile(cleanPhone: string): Promise<SalesforceOnboardingRecord | null> {
    const { selected } = await this.findActiveRecordByPhone(cleanPhone);
    return selected;
  }

  public async updateRecord(
    token: string,
    updates: Partial<SalesforceOnboardingRecord>
  ): Promise<SalesforceOnboardingRecord | null> {
    const existing = await this.getRecordByToken(token);
    if (!existing || !existing.Id) return null;

    // Filter out client/runtime-only properties that don't exist in Salesforce schema
    const sfPayload: Record<string, any> = { ...updates };
    delete sfPayload.Authentication_Verified__c;
    delete sfPayload.Token__c;
    delete sfPayload.Id;
    delete sfPayload.Name;
    delete sfPayload.CreatedDate;
    delete sfPayload.SystemModstamp;
    delete sfPayload.attributes;

    // If only local/session fields were updated, return the merged record immediately
    if (Object.keys(sfPayload).length === 0) {
      return {
        ...existing,
        ...updates,
      };
    }

    const authed = await this.authenticate();
    if (!authed || !this.instanceUrl || !this.accessToken) {
      return { ...existing, ...updates };
    }

    try {
      const url = `${this.instanceUrl}/services/data/v60.0/sobjects/Academy_Onboarding_PRE__c/${existing.Id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sfPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Salesforce REST] Update error:', errorData);
        // Return local merged record so user journey is never broken
        return {
          ...existing,
          ...updates,
        };
      }

      return {
        ...existing,
        ...updates,
      };
    } catch (err: any) {
      console.error('[Salesforce REST] Update exception:', err.message);
      return {
        ...existing,
        ...updates,
      };
    }
  }

  public async getRecentRecords(limit = 25): Promise<SalesforceOnboardingRecord[]> {
    const soql = `
      SELECT ${this.ACADEMY_PRE_FIELDS}
      FROM Academy_Onboarding_PRE__c
      ORDER BY CreatedDate DESC
      LIMIT ${Math.min(limit, 100)}
    `.trim().replace(/\s+/g, ' ');

    const records = await this.query(soql);
    return (records || []).map((r: any) => this.normalizeRecord(r, r.userId__c || r.Id));
  }

  public async searchRecords(searchTerm: string, limit = 25): Promise<SalesforceOnboardingRecord[]> {
    if (!searchTerm || !searchTerm.trim()) {
      return this.getRecentRecords(limit);
    }

    const term = searchTerm.trim().replace(/['"\\]/g, '');
    const cleanDigits = term.replace(/\D/g, '');

    const whereClauses: string[] = [];

    // 1. Salesforce 15/18 character ID
    if (/^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(term)) {
      whereClauses.push(`Id = '${term}'`);
    }

    // 2. Exact match on IDs / UIDs
    whereClauses.push(`userId__c = '${term}'`);
    whereClauses.push(`Program_Registered_UID_PRE__c = '${term}'`);
    whereClauses.push(`DP_Order_ID_PRE__c = '${term}'`);

    // 3. Substring match for UID / Name / Email
    if (term.length >= 3) {
      whereClauses.push(`userId__c LIKE '%${term}%'`);
      whereClauses.push(`Program_Registered_UID_PRE__c LIKE '%${term}%'`);
      whereClauses.push(`Name LIKE '%${term}%'`);
      whereClauses.push(`Email_PRE__c LIKE '%${term}%'`);
      whereClauses.push(`DP_Order_ID_PRE__c LIKE '%${term}%'`);
    }

    // 4. Phone search
    if (cleanDigits.length >= 4) {
      const phoneSlice = cleanDigits.slice(-10);
      whereClauses.push(`Student_Number__c LIKE '%${phoneSlice}%'`);
      whereClauses.push(`Student_WhatsApp_Number__c LIKE '%${phoneSlice}%'`);
      whereClauses.push(`PHONE_NUMBER__c LIKE '%${phoneSlice}%'`);
      whereClauses.push(`Parent_Guardian_Phone_Number_PRE__c LIKE '%${phoneSlice}%'`);
    }

    const soql = `
      SELECT ${this.ACADEMY_PRE_FIELDS}
      FROM Academy_Onboarding_PRE__c
      WHERE ${whereClauses.join(' OR ')}
      ORDER BY CreatedDate DESC
      LIMIT ${Math.min(limit, 100)}
    `.trim().replace(/\s+/g, ' ');

    const records = await this.query(soql);
    return (records || []).map((r: any) => this.normalizeRecord(r, r.userId__c || r.Id));
  }

  /**
   * Queries related NBFC_Onboarding__c records for a learner via SOQL.
   * Matches by student_phone_number__c or Academy_Onboarding_PRE_L__c lookup.
   */
  public async getNbfcRecordsForLearner(
    activeRecordId: string,
    phone?: string | null
  ): Promise<any[]> {
    if (!activeRecordId && !phone) return [];

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const clauses: string[] = [];
    if (activeRecordId) {
      clauses.push(`Academy_Onboarding_PRE_L__c = '${activeRecordId.replace(/['"\\]/g, '')}'`);
    }
    if (cleanPhone && cleanPhone.length >= 7) {
      clauses.push(`student_phone_number__c LIKE '%${cleanPhone}%'`);
    }

    if (clauses.length === 0) return [];

    const soql = `
      SELECT Id, Name, Master_App_ID__c, Master_Applied_Loan_Amount__c, Master_Approved_Loan_Amount__c, student_phone_number__c, Academy_Onboarding_PRE_L__c, Co_Applicant_Name_PRE__c, Co_Applicant_Phone_Number_PRE__c, Relation_With_The_Co_Applicant_PRE__c, CreatedDate, LastModifiedDate
      FROM NBFC_Onboarding__c
      WHERE ${clauses.join(' OR ')}
      ORDER BY CreatedDate DESC
      LIMIT 20
    `.trim().replace(/\s+/g, ' ');

    const records = await this.query(soql);
    return records || [];
  }
}

export const salesforceRestClient = new SalesforceRestClient();
