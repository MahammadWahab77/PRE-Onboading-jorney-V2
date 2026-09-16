import type { PortalRoute, JourneyStage } from '../types/journey';

export interface ResolveOnboardingResult {
  success: boolean;
  code?: string;
  message?: string;
  student?: {
    phone: string;
    name: string;
    maskedPhone: string;
  };
  salesforce?: {
    recordId: string;
    object: string;
    status: string;
    stagePre: string | null;
    lastModifiedDate: string | null;
    createdDate: string | null;
    candidateCount: number;
    isAmbiguous: boolean;
  };
  journey?: {
    stage: JourneyStage;
    route: string;
    targetRoute: PortalRoute;
    token: string;
    authRequired: boolean;
  };
}

/** Client SDK to resolve onboarding journey from phone number */
export async function resolveOnboarding(phone: string): Promise<ResolveOnboardingResult> {
  console.log('[ONBOARDING] phone entered:', phone);
  console.log('[ONBOARDING] SF lookup started');

  const res = await fetch('/api/onboarding/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await res.json();
  console.log('[ONBOARDING] SF response received:', data);

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to resolve onboarding session');
  }

  console.log('[ONBOARDING] selected active record:', data.salesforce?.recordId, 'status:', data.salesforce?.status);
  console.log('[ONBOARDING] derived journey stage:', data.journey?.stage, 'navigating to:', data.journey?.route);

  return data;
}
