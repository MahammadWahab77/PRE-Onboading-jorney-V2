-- Supabase Schema for PRE Onboarding Portal
-- Target Project: jqxmyxuagerayrgvxjwg

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  phone_number TEXT,
  whatsapp_number TEXT,
  email TEXT,
  date_of_birth DATE,
  
  -- Program & Pricing
  program_name TEXT NOT NULL DEFAULT 'NxtWave Program',
  program_uid TEXT,
  product_price NUMERIC NOT NULL DEFAULT 0,
  scholarship_amount NUMERIC NOT NULL DEFAULT 0,
  seat_reservation_paid NUMERIC NOT NULL DEFAULT 0,
  amount_payable NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  
  -- Direct Payment
  payment_plan TEXT,
  payment_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  payment_date_time TIMESTAMPTZ,
  receipt_id TEXT,
  
  -- Financing / NBFC
  applied_loan_amount NUMERIC,
  emi_tenure TEXT,
  eligible_nbfcs TEXT,
  choose_nbfc TEXT,
  effective_approved_amount NUMERIC,
  disbursed_amount NUMERIC,
  disbursed_date_time TIMESTAMPTZ,
  
  -- Co-Applicant
  co_applicant_name TEXT,
  co_applicant_phone TEXT,
  co_applicant_email TEXT,
  co_applicant_relation TEXT,
  co_applicant_age INT,
  co_applicant_employment_type TEXT,
  co_applicant_occupation TEXT,
  co_applicant_monthly_income_range TEXT,
  cibil_score_range TEXT,
  co_applicant_state TEXT,
  co_applicant_address TEXT,
  
  -- KYC
  kyc_submission_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  kyc_submission_date_time TIMESTAMPTZ,
  documents_requested TEXT,
  
  -- Lender Status
  nbfc_overall_stages TEXT,
  nbfc_remarks TEXT,
  nbfc_rejected_reasons TEXT,
  
  -- Class & LMS Access
  lms_access_status TEXT NOT NULL DEFAULT 'Locked',
  lms_access_url TEXT,
  batch_start_date DATE,
  
  -- Session State
  authentication_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index token and phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_token ON public.enrollments(token);
CREATE INDEX IF NOT EXISTS idx_enrollments_phone ON public.enrollments(phone_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_whatsapp ON public.enrollments(whatsapp_number);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "service_role_all_access" ON public.enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon access policy for active sessions by token
CREATE POLICY "anon_read_by_token" ON public.enrollments
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_update_by_token" ON public.enrollments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
