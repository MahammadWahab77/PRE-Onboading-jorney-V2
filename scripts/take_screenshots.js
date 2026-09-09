import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const outputDir = path.resolve(process.cwd(), 'public/screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pagesToCapture = [
  {
    id: '01_auth_page',
    title: '1. Authentication & OTP Verification',
    path: '/enrollment/nw_rahul_genius_2026/auth',
    authFirst: false,
    resetBefore: true,
  },
  {
    id: '02_congratulations_page',
    title: '2. Congratulations & Offer Acceptance',
    path: '/enrollment/nw_rahul_genius_2026/congratulations',
    authFirst: true,
  },
  {
    id: '03_program_summary_page',
    title: '3. Program Fee & Scholarship Summary',
    path: '/enrollment/nw_rahul_genius_2026/program',
    authFirst: true,
  },
  {
    id: '04_payment_methods_page',
    title: '4. Payment Method Selection (Full Pay vs No-Cost EMI)',
    path: '/enrollment/nw_rahul_genius_2026/payment',
    authFirst: true,
  },
  {
    id: '05_payment_link_page',
    title: '5. Direct Payment Link & QR Code Checkout',
    path: '/enrollment/nw_rahul_genius_2026/pay',
    authFirst: true,
  },
  {
    id: '06_payment_success_page',
    title: '6. Payment Success Receipt',
    path: '/enrollment/nw_rahul_genius_2026/payment-success',
    authFirst: true,
  },
  {
    id: '07_emi_explainer_page',
    title: '7. No-Cost EMI Video Explainer Guide',
    path: '/enrollment/nw_rahul_genius_2026/emi',
    authFirst: true,
  },
  {
    id: '08_co_applicant_page',
    title: '8. Co-Applicant Details for Financing',
    path: '/enrollment/nw_rahul_genius_2026/co-applicant',
    authFirst: true,
  },
  {
    id: '09_kyc_slot_page',
    title: '9. KYC Date & Time Slot Selection',
    path: '/enrollment/nw_rahul_genius_2026/kyc-slot',
    authFirst: true,
  },
  {
    id: '10_kyc_readiness_page',
    title: '10. KYC Readiness & Document Checklist',
    path: '/enrollment/nw_rahul_genius_2026/kyc-readiness',
    authFirst: true,
  },
  {
    id: '11_kyc_confirmation_page',
    title: '11. KYC Appointment Confirmation',
    path: '/enrollment/nw_rahul_genius_2026/kyc-confirmation',
    authFirst: true,
  },
];

async function main() {
  console.log('Launching headless Chromium...');
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
  await page.setViewport({
    width: 1280,
    height: 900,
    deviceScaleFactor: 1.5,
  });

  for (const item of pagesToCapture) {
    console.log(`Processing: ${item.title}...`);

    if (item.resetBefore) {
      await fetch('http://localhost:3000/api/enrollment/nw_rahul_genius_2026/reset', {
        method: 'POST',
      }).catch(() => {});
    }

    if (item.authFirst) {
      await fetch('http://localhost:3000/api/enrollment/nw_rahul_genius_2026/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: '123456' }),
      }).catch(() => {});
    }

    const url = `http://localhost:3000${item.path}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });

    // Wait a brief moment for motion/react animations and state to stabilize
    await new Promise((r) => setTimeout(r, 800));

    const filePath = path.join(outputDir, `${item.id}.png`);
    await page.screenshot({
      path: filePath,
      fullPage: false,
    });
    console.log(`Saved screenshot: ${filePath}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
