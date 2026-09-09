/**
 * Program-authoritative Full Payment Registration Links
 */

export interface FullPaymentLinkInfo {
  link: string;
  label: string;
  programKey: 'genius' | 'smart' | 'edge';
}

export function getFullPaymentInfo(programName?: string): FullPaymentLinkInfo {
  const norm = (programName || '').trim().toLowerCase();

  if (norm.includes('edge')) {
    return {
      link: 'https://accounts.ccbp.in/register/academy-edge-full-payment',
      label: 'Edge Full Payment Link',
      programKey: 'edge',
    };
  }

  if (norm.includes('smart')) {
    return {
      link: 'https://accounts.ccbp.in/register/academy-smart-career-plus-full-payment',
      label: 'Full Payment Smart Career Plus Link',
      programKey: 'smart',
    };
  }

  // Default / Genius
  return {
    link: 'https://accounts.ccbp.in/register/academy-genius-career-plus-full-payment',
    label: 'Full Payment Genius Career Plus Link',
    programKey: 'genius',
  };
}

export function getFullPaymentLink(programName?: string): string {
  return getFullPaymentInfo(programName).link;
}
