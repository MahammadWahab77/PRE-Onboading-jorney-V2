import type { SalesforceOnboardingRecord } from './types';
import { supabaseAdapter } from '../supabase/supabaseAdapter';
import { salesforceRestClient } from './salesforceRestClient';
export { salesforceRestClient };

export interface SalesforceClientInterface {
  getRecordByToken(token: string): Promise<SalesforceOnboardingRecord | null>;
  getAuthoritativeEnrollmentRecord(token: string): Promise<SalesforceOnboardingRecord | null>;
  findRecordByMobile(cleanPhone: string): Promise<SalesforceOnboardingRecord | null>;
  updateRecord(
    token: string,
    updates: Partial<SalesforceOnboardingRecord>
  ): Promise<SalesforceOnboardingRecord | null>;
  createRecord?(
    record: SalesforceOnboardingRecord
  ): Promise<SalesforceOnboardingRecord>;
  resetToken(token: string): Promise<void>;
}

/**
 * Enterprise Client supporting Live Salesforce REST & Supabase
 * with zero-mock runtime fallback.
 */
class SalesforceClient implements SalesforceClientInterface {
  private inMemoryStore: Map<string, SalesforceOnboardingRecord> = new Map();

  constructor() {
    console.log(
      `[Data Adapter]\n` +
        `  DATA_SOURCE=${process.env.DATA_SOURCE || 'salesforce'}\n` +
        `  Salesforce configured=${salesforceRestClient.isConfigured}\n` +
        `  Supabase configured=${supabaseAdapter.ready}`
    );
  }

  /**
   * Authoritative Enrollment Record fetch.
   * When DATA_SOURCE=salesforce, directly queries live Salesforce REST API.
   * Does NOT fall through to stale Supabase/in-memory caches on empty or failed responses.
   */
  public async getAuthoritativeEnrollmentRecord(
    token: string
  ): Promise<SalesforceOnboardingRecord | null> {
    if (!token) return null;

    if (process.env.DATA_SOURCE === 'salesforce' || !process.env.DATA_SOURCE) {
      if (!salesforceRestClient.isConfigured) {
        throw new Error(
          'Salesforce credentials are not configured in environment (SF_CLIENT_ID / SF_CLIENT_SECRET missing).'
        );
      }

      try {
        const sfRecord = await salesforceRestClient.getRecordByToken(token);
        if (sfRecord) {
          this.inMemoryStore.set(token, sfRecord);
          return sfRecord;
        }
        // Salesforce query returned no record -> return null (404)
        return null;
      } catch (err: any) {
        console.error('[Salesforce] Authoritative live fetch failed for token:', token, err.message);
        throw new Error(`Authoritative Salesforce query failed: ${err.message}`);
      }
    }

    // Fallback for non-Salesforce environments
    return this.getRecordByToken(token);
  }

  public async getRecordByToken(token: string): Promise<SalesforceOnboardingRecord | null> {
    if (!token) return null;

    // 1. Query Live Salesforce REST API if enabled
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const sfRecord = await salesforceRestClient.getRecordByToken(token);
        if (sfRecord) {
          this.inMemoryStore.set(token, sfRecord);
          return sfRecord;
        }
      } catch (err: any) {
        console.error('[Salesforce] Live fetch failed:', err.message);
      }
    }

    // 2. Query Supabase database if configured
    if (supabaseAdapter.ready) {
      const dbRecord = await supabaseAdapter.getRecordByToken(token);
      if (dbRecord) {
        this.inMemoryStore.set(token, dbRecord);
        return dbRecord;
      }
    }

    // 3. Query in-memory runtime store
    const memRecord = this.inMemoryStore.get(token);
    if (memRecord) {
      return JSON.parse(JSON.stringify(memRecord));
    }

    // 4. Return null if token does not exist in any system
    return null;
  }

  public async findActiveRecordByPhone(inputPhone: string): Promise<{
    selected: SalesforceOnboardingRecord | null;
    isAmbiguous: boolean;
    candidateCount: number;
    eligibleCount: number;
    allRecords: SalesforceOnboardingRecord[];
  }> {
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const result = await salesforceRestClient.findActiveRecordByPhone(inputPhone);
        if (result.selected) {
          this.inMemoryStore.set(result.selected.Token__c || result.selected.Id, result.selected);
        }
        return result;
      } catch (err: any) {
        console.error('[Salesforce] findActiveRecordByPhone failed:', err.message);
      }
    }

    const fallbackRecord = await this.findRecordByMobile(inputPhone);
    return {
      selected: fallbackRecord,
      isAmbiguous: false,
      candidateCount: fallbackRecord ? 1 : 0,
      eligibleCount: fallbackRecord ? 1 : 0,
      allRecords: fallbackRecord ? [fallbackRecord] : [],
    };
  }

  public async findRecordsByPhone(inputPhone: string): Promise<SalesforceOnboardingRecord[]> {
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        return await salesforceRestClient.findRecordsByPhone(inputPhone);
      } catch (err: any) {
        console.error('[Salesforce] findRecordsByPhone failed:', err.message);
      }
    }
    const single = await this.findRecordByMobile(inputPhone);
    return single ? [single] : [];
  }

  public async findRecordByMobile(
    cleanPhone: string
  ): Promise<SalesforceOnboardingRecord | null> {
    const formatted = cleanPhone.replace(/\D/g, '');
    if (!formatted || formatted.length < 10) return null;

    // 1. Query Live Salesforce REST API if enabled
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const sfRecord = await salesforceRestClient.findRecordByMobile(formatted);
        if (sfRecord) {
          this.inMemoryStore.set(sfRecord.Token__c || sfRecord.Id, sfRecord);
          return sfRecord;
        }
      } catch (err: any) {
        console.error('[Salesforce] Live mobile search failed:', err.message);
      }
    }

    // 2. Query Supabase database
    if (supabaseAdapter.ready) {
      const dbRecord = await supabaseAdapter.findRecordByMobile(formatted);
      if (dbRecord) {
        this.inMemoryStore.set(dbRecord.Token__c || dbRecord.Id, dbRecord);
        return dbRecord;
      }
    }

    // 3. Query in-memory store
    for (const record of this.inMemoryStore.values()) {
      const p1 = (record.Student_WhatsApp_Number__c || '').replace(/\D/g, '');
      const p2 = (record.Student_Number__c || '').replace(/\D/g, '');
      const p3 = (record.PHONE_NUMBER__c || '').replace(/\D/g, '');
      const p4 = (record.Parent_Guardian_Phone_Number_PRE__c || '').replace(/\D/g, '');
      if (
        p1.endsWith(formatted.slice(-10)) ||
        p2.endsWith(formatted.slice(-10)) ||
        p3.endsWith(formatted.slice(-10)) ||
        p4.endsWith(formatted.slice(-10))
      ) {
        return JSON.parse(JSON.stringify(record));
      }
    }

    // 4. Return null if mobile is not found
    return null;
  }

  public async updateRecord(
    token: string,
    updates: Partial<SalesforceOnboardingRecord>
  ): Promise<SalesforceOnboardingRecord | null> {
    // 1. Update Live Salesforce REST API if enabled
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const sfUpdated = await salesforceRestClient.updateRecord(token, updates);
        if (sfUpdated) {
          this.inMemoryStore.set(token, sfUpdated);
          return sfUpdated;
        }
      } catch (err: any) {
        console.error('[Salesforce] Live update failed:', err.message);
      }
    }

    // 2. Update Supabase
    if (supabaseAdapter.ready) {
      const updated = await supabaseAdapter.updateRecord(token, updates);
      if (updated) {
        this.inMemoryStore.set(token, updated);
        return updated;
      }
    }

    // 3. Update in-memory
    const existing = this.inMemoryStore.get(token);
    if (!existing) {
      return null;
    }

    const updated: SalesforceOnboardingRecord = {
      ...existing,
      ...updates,
    };
    this.inMemoryStore.set(token, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  public async createRecord(
    record: SalesforceOnboardingRecord
  ): Promise<SalesforceOnboardingRecord> {
    this.inMemoryStore.set(record.Token__c || record.Id, record);
    return record;
  }

  public async resetToken(token: string): Promise<void> {
    this.inMemoryStore.delete(token);
  }

  public async getRecentRecords(limit = 25): Promise<SalesforceOnboardingRecord[]> {
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const records = await salesforceRestClient.getRecentRecords(limit);
        for (const r of records) {
          this.inMemoryStore.set(r.Token__c || r.Id, r);
        }
        return records;
      } catch (err: any) {
        console.error('[Salesforce] getRecentRecords failed:', err.message);
      }
    }
    return Array.from(this.inMemoryStore.values()).slice(0, limit);
  }

  public async searchRecords(searchTerm: string, limit = 25): Promise<SalesforceOnboardingRecord[]> {
    if (process.env.DATA_SOURCE === 'salesforce' && salesforceRestClient.isConfigured) {
      try {
        const records = await salesforceRestClient.searchRecords(searchTerm, limit);
        for (const r of records) {
          this.inMemoryStore.set(r.Token__c || r.Id, r);
        }
        return records;
      } catch (err: any) {
        console.error('[Salesforce] searchRecords failed:', err.message);
      }
    }

    const term = (searchTerm || '').toLowerCase();
    return Array.from(this.inMemoryStore.values())
      .filter((r) => {
        return (
          r.Id?.toLowerCase().includes(term) ||
          r.userId__c?.toLowerCase().includes(term) ||
          r.Program_Registered_UID_PRE__c?.toLowerCase().includes(term) ||
          r.Name?.toLowerCase().includes(term) ||
          r.Student_Number__c?.includes(term) ||
          r.PHONE_NUMBER__c?.includes(term)
        );
      })
      .slice(0, limit);
  }
}

export const salesforceClient = new SalesforceClient();
