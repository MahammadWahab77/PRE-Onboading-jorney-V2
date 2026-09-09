import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const pagesData = [
  {
    step: 'Step 01',
    title: 'Authentication & OTP Verification',
    route: '/enrollment/nw_rahul_genius_2026/auth',
    file: '01_auth_page.png',
    highlights: [
      'Masked mobile security (+91 98•••••210)',
      '6-digit individual inputs with auto-focus & clipboard paste',
      'One-click Test Code auto-fill and resend countdown timer',
    ],
  },
  {
    step: 'Step 02',
    title: 'Congratulations & Offer Acceptance',
    route: '/enrollment/nw_rahul_genius_2026/congratulations',
    file: '02_congratulations_page.png',
    highlights: [
      'Personalized welcome badge for Rahul Kumar',
      'Curriculum highlights & guaranteed mentor support',
      'Acceptance CTA with celebratory confetti animations',
    ],
  },
  {
    step: 'Step 03',
    title: 'Program Fee & Merit Scholarship Summary',
    route: '/enrollment/nw_rahul_genius_2026/program',
    file: '03_program_summary_page.png',
    highlights: [
      'Base fee breakdown: ₹1,25,000 with ₹25,000 Merit Scholarship discount',
      'Final Payable Fee: ₹1,00,000 with transparent fee guarantee',
      'Complete syllabus outline, capstone projects, and placement eligibility',
    ],
  },
  {
    step: 'Step 04',
    title: 'Payment Method Selection',
    route: '/enrollment/nw_rahul_genius_2026/payment',
    file: '04_payment_methods_page.png',
    highlights: [
      'Side-by-side comparison: Full Payment vs. No-Cost EMI plans',
      'Flexible tenures: 6, 9, 12, or 18 months at 0% effective interest',
      'NBFC partner details and instant sanction eligibility check',
    ],
  },
  {
    step: 'Step 05',
    title: 'Direct Payment Link & QR Code Checkout',
    route: '/enrollment/nw_rahul_genius_2026/pay',
    file: '05_payment_link_page.png',
    highlights: [
      'Dynamic UPI QR code for Google Pay, PhonePe, and Paytm',
      'Instant payment link sharing & clipboard copy utility',
      'Simulated instant payment gateway confirmation button',
    ],
  },
  {
    step: 'Step 06',
    title: 'Payment Success Receipt',
    route: '/enrollment/nw_rahul_genius_2026/payment-success',
    file: '06_payment_success_page.png',
    highlights: [
      'Verified payment confirmation and reference ID generation',
      'Official transaction receipt breakdown with downloadable PDF option',
      'Cohort onboarding calendar & next step orientation schedule',
    ],
  },
  {
    step: 'Step 07',
    title: 'No-Cost EMI Video Explainer Guide',
    route: '/enrollment/nw_rahul_genius_2026/emi',
    file: '07_emi_explainer_page.png',
    highlights: [
      'Dedicated 9:16 vertical video explainer addressing parent questions',
      'Bilingual audio track toggle (English & Telugu)',
      'Synchronized subtitles/captions with automated voice agent pause on play',
    ],
  },
  {
    step: 'Step 08',
    title: 'Co-Applicant Details for Financing',
    route: '/enrollment/nw_rahul_genius_2026/co-applicant',
    file: '08_co_applicant_page.png',
    highlights: [
      'Parent/Guardian relationship selector (Father, Mother, Legal Guardian)',
      'Employment status (Salaried / Self-Employed) & monthly income range',
      'Instant validation against NBFC pre-approval guidelines',
    ],
  },
  {
    step: 'Step 09',
    title: 'KYC Date & Time Slot Selection',
    route: '/enrollment/nw_rahul_genius_2026/kyc-slot',
    file: '09_kyc_slot_page.png',
    highlights: [
      'Interactive date calendar picker with 3-day scheduling window',
      'Morning, Afternoon, and Evening slot options with live seat counters',
      'Automatic time-zone synchronization and reminder SMS setup',
    ],
  },
  {
    step: 'Step 10',
    title: 'KYC Readiness & Document Checklist',
    route: '/enrollment/nw_rahul_genius_2026/kyc-readiness',
    file: '10_kyc_readiness_page.png',
    highlights: [
      'Pre-verification checklist: Original PAN Card, Aadhaar phone for OTP',
      'Stable camera & well-lit room video KYC preparation guide',
      'Interactive checkmarks ensuring smooth verification call success',
    ],
  },
  {
    step: 'Step 11',
    title: 'KYC Appointment Confirmation',
    route: '/enrollment/nw_rahul_genius_2026/kyc-confirmation',
    file: '11_kyc_confirmation_page.png',
    highlights: [
      'Confirmed appointment summary with dedicated KYC verification officer',
      'One-click "Add to Google Calendar" integration',
      'Direct WhatsApp helpline & rescheduling flexibility option',
    ],
  },
];

function getImageBase64(filename) {
  const filePath = path.resolve(process.cwd(), 'public/screenshots', filename);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

function generateHtml() {
  const pagesHtml = pagesData
    .map((item, idx) => {
      const base64Img = getImageBase64(item.file);
      return `
    <div class="page page-content">
      <div class="page-header">
        <div class="header-left">
          <span class="step-badge">${item.step}</span>
          <span class="page-title">${item.title}</span>
        </div>
        <div class="header-right">
          <span class="route-badge">${item.route}</span>
        </div>
      </div>

      <div class="highlights-row">
        ${item.highlights.map((h) => `<span class="highlight-chip"><span class="chip-dot"></span>${h}</span>`).join('')}
      </div>

      <div class="image-wrapper">
        <img class="screenshot-img" src="${base64Img}" alt="${item.title}" />
      </div>

      <div class="page-footer">
        <span>NxtWave CCBP 4.0 — Learner Enrollment Portal</span>
        <span>Page ${idx + 2} of ${pagesData.length + 1}</span>
      </div>
    </div>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NxtWave Learner Enrollment Portal - Screenshots</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #334155;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 297mm;
      height: 210mm;
      position: relative;
      page-break-after: always;
      overflow: hidden;
      background: #f8fafc;
      padding: 10mm 12mm 8mm 12mm;
      display: flex;
      flex-direction: column;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #0b1329 0%, #1e293b 50%, #0f172a 100%);
      color: #ffffff;
      padding: 18mm 20mm;
      justify-content: space-between;
    }

    .cover-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      font-weight: 800;
      font-size: 18px;
      padding: 8px 16px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }

    .brand-sub {
      font-size: 13px;
      color: #94a3b8;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .cover-center {
      margin: auto 0;
    }

    .cover-category {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.12);
      border: 1px solid rgba(96, 165, 250, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #60a5fa, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-desc {
      font-size: 16px;
      color: #cbd5e1;
      max-width: 680px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 18px;
      border-radius: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .meta-value {
      font-size: 13px;
      color: #f1f5f9;
      font-weight: 700;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 12px;
    }

    /* Content Pages */
    .page-content {
      background: #f8fafc;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .step-badge {
      background: #1e293b;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .page-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .route-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
    }

    .highlights-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .highlight-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #475569;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 500;
    }

    .chip-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #3b82f6;
    }

    .image-wrapper {
      flex: 1;
      min-height: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 6px;
      box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }

    .screenshot-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 6px;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover-page">
    <div class="cover-brand">
      <div class="logo-badge">NxtWave</div>
      <div class="brand-sub">CCBP 4.0 Academy · Verified Enrollment Experience</div>
    </div>

    <div class="cover-center">
      <div class="cover-category">Production UI / UX Specification & Walkthrough</div>
      <h1 class="cover-title">Learner Enrollment Portal<br><span>Complete 11-Step Journey Walkthrough</span></h1>
      <p class="cover-desc">
        Full visual documentation and high-resolution interface captures for the end-to-end learner onboarding flow.
        Includes Mobile OTP authentication, fee breakdown with merit scholarships, No-Cost EMI video explainer, parent co-applicant underwriting, and Video KYC slot appointment scheduling.
      </p>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Sample Learner</span>
          <span class="meta-value">Rahul Kumar</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Selected Cohort</span>
          <span class="meta-value">NxtWave Genius (Batch 2026)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Session Token</span>
          <span class="meta-value">nw_rahul_genius_2026</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Portal Status</span>
          <span class="meta-value" style="color: #4ade80;">Active & Verified</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>NxtWave Admissions & Technology Architecture</span>
      <span>11 Interface Screens · High Definition PDF Export</span>
    </div>
  </div>

  <!-- CONTENT PAGES (11 SCREENSHOTS) -->
  ${pagesHtml}

</body>
</html>
  `;
}

async function run() {
  console.log('Generating HTML layout with embedded screenshots...');
  const html = generateHtml();
  const tempHtmlPath = path.resolve(process.cwd(), 'public/screenshots_pdf_template.html');
  fs.writeFileSync(tempHtmlPath, html);

  console.log('Launching headless Chromium to render PDF...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Brief pause for fonts & layout stabilization
  await new Promise((r) => setTimeout(r, 1000));

  const pdfPath = path.resolve(process.cwd(), 'public/NxtWave_Enrollment_Portal_Screenshots.pdf');
  console.log('Rendering PDF to:', pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log('PDF rendered successfully! Size:', (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2), 'MB');
}

run().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
