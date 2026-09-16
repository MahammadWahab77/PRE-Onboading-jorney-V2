# PRE Onboarding Journey V3 - Architectural & Codebase Audit

**Date:** September 2026  
**Auditor:** Principal Solutions Architect & Full-Stack Lead Engineer  
**Repository Scope:** `NxtWave PRE Learner Onboarding Portal (V2 -> V3)`

---

## 1. Executive Summary

This document performs an exhaustive audit of the existing `PRE-Onboading-jorney-V2` codebase prior to initiating the V3 architecture overhaul. 

### Core Architectural Shift
* **Current V2 State:** The frontend controls the learner journey via static route history, local state variables, and client-side button navigation. Salesforce data is mocked ad-hoc directly in `server.ts` with camelCase and Salesforce fields intermixed, and KYC relies on a deprecated slot-booking system.
* **Target V3 State:** Salesforce and backend state act as the authoritative source of truth. A **Canonical Enrollment Journey Orchestrator** governs the progression, determining the learner's `currentStage`, `nextAction`, `progressPercent`, and `recommendedRoute`. The frontend acts as a pure presentation layer, protected by route guards.

---

## 2. Existing Architecture

```
[ Browser / React 19 Client ]
         |
         | HTTP REST (Ad-hoc endpoints)
         v
[ Express Server (server.ts) ]
         |
         +--> In-memory `journeyStore` (Single default object with mixed SF fields)
         +--> Google Gemini SDK (@google/genai) for Voice Agent
         +--> google-tts-api & Google Studio TTS for audio voiceovers
         +--> Static file serving (videos, screenshots, audio)
```

### Key Architectural Characteristics
1. **Frontend-Driven Routing:** `App.tsx` manually inspects `window.location.pathname`, stores `currentRoute` in React state, and allows client-side buttons to directly dictate the next screen (e.g. `navigateTo('kyc-slot')`, `navigateTo('program')`).
2. **Coupled Endpoint Design:** `server.ts` directly serves endpoints like `/api/enrollment/:token/kyc/slots`, `/api/enrollment/:token/pay/simulate`, and returns raw or lightly masked objects without a canonical domain model layer.
3. **No Domain Layer:** There is no abstraction separating raw Salesforce objects (`Academy_Onboarding_PRE__c`, `Co_Applicant_PRE_Pipeline__c`) from canonical domain entities (`LearnerProfile`, `ProgramDetails`, `PaymentDetails`, `CoApplicantDetails`, `KycDetails`, `FinancingDetails`).

---

## 3. Existing Routes

| V2 Route Path | Component | Purpose in V2 | Status in V3 |
| :--- | :--- | :--- | :--- |
| `/enrollment/:token/auth` | `AuthPage.tsx` | Assumes phone is known; displays 6-box OTP entry | **Refactor:** 2-Stage Auth (Enter 10-digit mobile -> verify OTP) |
| `/enrollment/:token/congratulations` | `CongratulationsPage.tsx` | Welcome screen with confetti & program badges | **Keep & Enhance:** Drive dynamic data from Salesforce |
| `/enrollment/:token/program` | `ProgramSummaryPage.tsx` | Large video player + curriculum & pricing overview | **Refactor:** Commercial clarity first (fee, scholarship, payable) |
| `/enrollment/:token/payment` | `PaymentMethodPage.tsx` | Select Full Pay, Credit Card, or No-Cost EMI | **Keep & Align:** Persist selection to Salesforce adapter |
| `/enrollment/:token/pay` | `PaymentLinkPage.tsx` | UPI QR Code, direct checkout, simulate payment | **Keep & Standardize:** Payment provider abstraction |
| `/enrollment/:token/payment-success` | `PaymentSuccessPage.tsx` | Transaction receipt card & next steps | **Keep & Standardize:** Connect with canonical payment model |
| `/enrollment/:token/emi` | `WhyNoCostEmiPage.tsx` | Video explainer on 0% interest financing | **Keep:** Remove guaranteed approval language |
| `/enrollment/:token/co-applicant` | `CoApplicantPage.tsx` | Parent/Guardian relationship and phone entry | **Enhance:** Expand into multi-section RCA with income, employment, CIBIL |
| `/enrollment/:token/kyc-slot` | `KycSlotPage.tsx` | Date & time slot picker for KYC video call | **DEPRECATE / REMOVE** (Slot booking obsolete in V3) |
| `/enrollment/:token/kyc-readiness` | `KycReadinessPage.tsx` | Document checklist before video call | **DEPRECATE / REMOVE** (Replaced by state-driven `/kyc`) |
| `/enrollment/:token/kyc-confirmation`| `KycConfirmationPage.tsx`| Confirmation card of booked slot | **DEPRECATE / REMOVE** (Replaced by state-driven `/kyc`) |
| *(New in V3)* `/enrollment/:token/kyc` | *New Component* | State-driven KYC tracker (Not Started, In Progress, Action Req, etc.) | **NEW** |
| *(New in V3)* `/enrollment/:token/nbfc-status` | *New Component* | Real-time NBFC financing application timeline & actions | **NEW** |
| *(New in V3)* `/enrollment/:token/class-access`| *New Component* | Final unlocked LMS portal & support ticketing access | **NEW** |

---

## 4. Current API Endpoints in `server.ts`

| Method | Endpoint | Description | V3 Assessment |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/enrollment/:token` | Fetches learner & program info | **Refactor:** Upgrade to unified `/api/enrollment/:token/journey` |
| `POST` | `/api/enrollment/:token/otp/send` | Sends OTP (hardcoded `123456`) | **Refactor:** Decouple OTP from SF; move to secure `OtpSessionStore` |
| `POST` | `/api/enrollment/:token/otp/verify` | Validates 6-digit OTP | **Refactor:** Secure session generation; tokenized learner lookup |
| `GET` | `/api/enrollment/:token/payment` | Gets payment state & methods | **Preserve/Integrate:** Standardize with canonical payment mapper |
| `POST` | `/api/enrollment/:token/payment-method` | Updates `Payment_Plan_PRE__c` | **Preserve:** Keep endpoint, route through Salesforce adapter |
| `POST` | `/api/enrollment/:token/payment-link` | Generates UPI link & QR | **Preserve:** Payment provider abstraction |
| `GET` | `/api/enrollment/:token/status` | Polls payment status | **Preserve:** Return canonical payment status |
| `POST` | `/api/enrollment/:token/pay/simulate` | Simulates payment success | **Preserve (Mock mode):** Update mock SF state & journey |
| `GET` | `/api/enrollment/:token/emi` | Returns EMI amount & availability | **Preserve:** Harmonize with journey model |
| `GET` | `/api/enrollment/:token/co-applicant` | Gets co-applicant details | **Refactor:** Support full RCA model (identity, income, CIBIL) |
| `POST` | `/api/enrollment/:token/co-applicant` | Saves co-applicant details | **Refactor:** Validate & map to Salesforce fields via adapter |
| `GET` | `/api/enrollment/:token/kyc/slots` | Returns mock KYC time slots | **DEPRECATE:** Slot booking is obsolete |
| `POST` | `/api/enrollment/:token/kyc/book` | Books mock KYC time slot | **DEPRECATE:** Slot booking is obsolete |
| `GET` | `/api/enrollment/:token/kyc/confirmation` | Returns booked slot | **DEPRECATE:** Slot booking is obsolete |
| `GET` | `/api/voice-guide/step-script/:step` | Gets AI script for voice guidance | **Preserve & Align:** Add scripts for new V3 routes |
| `POST` | `/api/voice-guide/ask` | AI question answering with Gemini | **Preserve:** Retain multi-model fallback chain |
| `POST` | `/api/enrollment/:token/reset` | Resets journey state for testing | **Preserve:** Maintain for testing fixtures & demo reset |
| `GET` | `/api/video-narration/:lang/:sceneId` | Serves scene audio narration | **Preserve:** Essential multimedia asset |
| `POST` | `/api/tts/gemini` | Generates female TTS voiceover | **Preserve:** Voice agent feature |

---

## 5. Component Inventory

### Reusable Components (Keep & Adapt)
1. `NxtWaveHeader.tsx`: Responsive navigation header with secure logo, learner name, counselor helpline trigger.
2. `SupportModal.tsx`: Counselor contact modal with WhatsApp, phone, and callback options.
3. `VoiceAgent.tsx`: Interactive voice assistant supporting speech synthesis, Gemini Q&A, and step guidance.
4. `CoApplicantVideoPlayer.tsx`: 9:16 vertical video player for parent explainer with bilingual subtitles.
5. `ProgramCurriculumVideoPlayer.tsx`: Curriculum explanation video player.
6. `PaymentLinkPage.tsx`: UPI QR code, copy-link utility, and payment provider UI.
7. `PaymentSuccessPage.tsx`: Transaction confirmation card with receipt details.
8. `WhyNoCostEmiPage.tsx`: Comprehensive explainer for 0% interest financing.

### Obsolete Components (To Be Retired)
1. `KycSlotPage.tsx`: Obsolete because KYC is now state-driven by NBFC/Salesforce, not calendar booking.
2. `KycReadinessPage.tsx`: Subsumed into state-driven `/kyc` checklist and document upload actions.
3. `KycConfirmationPage.tsx`: Subsumed into state-driven `/kyc` and `/nbfc-status`.

### New Components Required for V3
1. `KycPage.tsx`: State-driven KYC component rendering according to `KycStatus` (`NOT_STARTED`, `IN_PROGRESS`, `ACTION_REQUIRED`, `SUBMITTED`, `VERIFIED`, `FAILED`).
2. `NbfcStatusPage.tsx`: Canonical NBFC application tracker with vertical timeline, lender badge, applied amount, and rejection resolution paths.
3. `ClassAccessPage.tsx`: Unlocked learning portal access card with configurable `LMS_ACCESS_URL` and support ticket integration.
4. `ActionRequiredCard.tsx`: Reusable high-visibility card for missing documents, invalid proofs, or co-applicant review actions.
5. Dynamic `ProgressIndicator.tsx`: Dynamic stage indicators tailoring path for Direct Pay (4 steps) vs. EMI (7 steps).

---

## 6. Hardcoded Values & Mock Assumptions

1. **Hardcoded Learner & Program Details:**
   - Rahul Kumar, `9876543210`, `Genius`, ₹1,00,000 are hardcoded in `initialEnrollmentState` in `src/App.tsx`.
   - Fee calculations did not explicitly separate Program Base Price (e.g. ₹1,60,000), Merit Scholarship (e.g. -₹30,000), Seat Reservation Paid (e.g. -₹18,000), and Net Payable (₹1,12,000).
2. **Master Test OTP in Production Code:**
   - In `server.ts`, OTP `'123456'` was hardcoded as a master bypass regardless of environment.
   - OTP expiration and sessions were mixed into the Salesforce journey database structure (`Current_OTP__c`, `OTP_Expires_At__c`).
3. **Guaranteed Financing Language:**
   - In `CoApplicantPage.tsx` (line 173): *"Zero loan defaults ensures guaranteed approval"*. This violates NBFC compliance and must be removed.
4. **LMS and Support URLs:**
   - Hardcoded in buttons rather than reading from `LMS_ACCESS_URL` and `SUPPORT_PORTAL_URL` environment variables.

---

## 7. Salesforce Field Names Identified in Codebase

The following Salesforce CRM fields are currently present in `server.ts` and will be formally mapped:

* `Id`
* `Name` (Journey Record Name)
* `Student_PRE__c`
* `Student_Name__c`
* `Student_Number__c`
* `Student_WhatsApp_Number__c`
* `PHONE_NUMBER__c`
* `Email_PRE__c`
* `Date_of_Birth__c`
* `Program_PRE__c`
* `Program_Registered_UID_PRE__c`
* `Product_Price__c`
* `Amount_Payable_PRE__c`
* `Amount_to_be_Receive__c`
* `Amount_Paid_Till_Now_To_Nxtwave_PRE__c`
* `Payment_Plan_PRE__c`
* `Payment_Status__c`
* `Payment_Done_PRE__c`
* `Current_Payment_Status__c`
* `Current_Payment_Status_Date_Time__c`
* `Payment_Date_Time__c`
* `Receipt_Id__c`
* `Applied_Loan_Amount__c`
* `EMI_Tenure_PRE__c`
* `Eligible_NBFCs_PRE__c`
* `Choose_NBFC_PRE__c`
* `Co_Applicant_Name__c`
* `Co_Applicant_Phone_Number_PRE__c`
* `Co_Applicant_Mail_ID_PRE__c`
* `Relation_With_The_Co_Applicant_PRE__c`
* `Co_Applicant_Employment_Type_PRE__c`
* `Co_Applicant_Monthly_Income_PRE__c`
* `Co_applicant_Occupation_PRE__c`
* `Co_Applicant_Address_PRE__c`
* `KYC_Call_Status_PRE__c`
* `KYC_Submission_Status_PRE__c`
* `KYC_Submission_Date_and_Time__c`
* `KYC_Slot_Id__c`
* `KYC_Scheduled_Start__c`
* `KYC_Scheduled_End__c`
* `Authentication_Verified__c`

### Fields to add in V3 Adapter
* `Scholarship_Amount__c` / `Merit_Scholarship_Amount_PRE__c`
* `Seat_Reservation_Amount_Paid__c`
* `Co_Applicant_Age_PRE__c`
* `Co_Applicant_Monthly_Income_Range_PRE__c`
* `CIBIL_Score_Range_PRE__c`
* `Co_Applicant_State_PRE__c`
* `Documents_Requested_By_Reps__c`
* `ADDITIONAL_DETAILS_REQUIRED_PRE_PRE__c`
* Lender-specific statuses:
  - `Northern_Arc_Overall_Stages__c`, `Northern_Arc_Remarks__c`, `Northern_Arc_Rejected_Reasons__c`
  - `Fibe_Overall_Loan_Status__c`, `Fibe_Overall_Stages__c`
  - `Finz_Overall_Stages__c`, `Gyandhan_Overall_Stages__c`, `JODO_NBFC_Status__c`
* `Effective_Approved_Amount__c`, `Disbursed_Amount_PRE__c`, `Disbursed_Date_Time__c`

---

## 8. Security & Privacy Audit

1. **PII Masking:** Mobile and email masking exists in helpers, but raw values could leak if Salesforce records are returned directly. V3 will enforce strict canonical response transformers that never serialize raw PII.
2. **OTP Security:** OTP must not be stored inside Salesforce records. Storing it in CRM violates separation of concerns and CRM logging auditability. A dedicated `OtpSessionStore` (with in-memory fallback for local dev) must be introduced.
3. **Internal PRE Remarks:** Ensure internal counselor notes (e.g. `Remarks_PRE__c`, `BDM_Audit_Remarks__c`) are stripped at the adapter boundary so learners only see user-friendly action guidance.
4. **Route Guard Enforcement:** V2 allowed client-side tampering with URL routes (e.g., navigating to `/payment-success` or `/kyc-confirmation` manually). V3 server-side state resolution must reject unauthorized stage navigation.

---

## 9. Recommended Migration Approach

### Phase 1: Canonical Domain Modeling (`src/types/journey.ts`)
Define unambiguous domain models:
- `LearnerProfile`, `ProgramDetails`, `PaymentDetails`, `CoApplicantDetails`, `KycDetails`, `FinancingDetails`, `ClassAccessDetails`.
- Enums: `JourneyStage`, `JourneyNextAction`, `KycStatus`, `NbfcStatus`, `ClassAccessStatus`.
- Main entity: `EnrollmentJourney`.

### Phase 2: Salesforce & External Adapters Layer (`src/server/adapters/`)
- `salesforce/client.ts`: Configurable client handling `DATA_SOURCE=mock` vs `DATA_SOURCE=salesforce`.
- `salesforce/enrollmentMapper.ts`: Converts raw Salesforce objects to canonical `EnrollmentJourney`.
- `salesforce/nbfcStatusMapper.ts`: Maps heterogeneous NBFC statuses (Northern Arc, Fibe, Finz, Gyandhan, Jodo) into canonical `NbfcStatus`.
- `auth/otpStore.ts`: Independent OTP session management with attempt limits and expiry.
- `payment/paymentProvider.ts`: Abstract payment provider interface.

### Phase 3: Journey Orchestration Engine (`src/server/orchestrator/journeyOrchestrator.ts`)
- Implements `resolveJourneyState(journey: EnrollmentJourney): JourneyResolution`.
- Pure business function calculating `currentStage`, `nextAction`, `progressPercent`, and `recommendedRoute`.
- Covered by comprehensive unit tests.

### Phase 4: Server Endpoints Refactoring (`server.ts`)
- `GET /api/enrollment/:token/journey`: Authoritative state endpoint.
- `POST /api/auth/send-otp` & `POST /api/auth/verify-otp`.
- `POST /api/enrollment/:token/payment-method`.
- `POST /api/enrollment/:token/co-applicant`.
- `POST /api/enrollment/:token/kyc/action`.
- `GET /api/enrollment/:token/nbfc-status`.
- `POST /api/enrollment/:token/support-ticket`.

### Phase 5: Client-Side V3 Pages & Components
- Update `App.tsx` with dynamic route guarding driven by backend `recommendedRoute`.
- Revamp `AuthPage.tsx` into 2-stage authentication.
- Redesign `ProgramSummaryPage.tsx` to highlight commercial fee/scholarship transparency.
- Build `KycPage.tsx` (state-driven, replacing slot booking).
- Build `NbfcStatusPage.tsx` with timeline and rejection mitigation.
- Build `ClassAccessPage.tsx` with LMS unlock and support ticketing.
- Build `ActionRequiredCard.tsx`.
- Update `ProgressIndicator.tsx` to dynamically branch for Direct Pay vs. EMI.

---

## 10. Audit Sign-Off
All 13 audit inspection points have been addressed. The V3 refactor proceeds directly to domain type definitions, adapters, orchestrator, and UI implementation.
