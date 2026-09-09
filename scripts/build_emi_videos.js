import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const scenesData = [
  {
    id: 1,
    tag: 'THE CHALLENGE',
    title: 'Upfront Fee Roadblock',
    sub: 'Paying the full tuition on day one is a huge burden',
    accent: '#EF4444',
    bgAccent: '#FEF2F2',
    iconText: '!',
    body: `
      <rect x="60" y="300" width="480" height="180" rx="20" fill="#FFF1F2" stroke="#FECDD3" stroke-width="2"/>
      <text x="300" y="350" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#991B1B" text-anchor="middle" letter-spacing="2">TRADITIONAL UPFRONT TOTAL</text>
      <text x="300" y="420" font-family="Liberation Sans, sans-serif" font-size="54" font-weight="900" fill="#991B1B" text-anchor="middle">₹1,49,000</text>
      <text x="300" y="455" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#B91C1C" text-anchor="middle">100% REQUIRED BEFORE STARTING</text>
      
      <g transform="translate(60, 510)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#FEE2E2"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#EF4444" text-anchor="middle">✕</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">Huge lump-sum creates immediate financial stress</text>
      </g>
      <g transform="translate(60, 600)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#FEE2E2"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#EF4444" text-anchor="middle">✕</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">Students postpone or abandon tech career goals</text>
      </g>
    `,
    line1En: 'You want to join Nxtwave, but paying the entire',
    line2En: 'program fee upfront is a massive roadblock.',
    line1Te: 'మీరు నెక్స్ట్‌వేవ్‌లో చేరాలనుకుంటున్నారు, కానీ మొత్తం ఫీజును',
    line2Te: 'ఒకేసారి చెల్లించడం ఒక పెద్ద అడ్డంకిగా అనిపించవచ్చు.'
  },
  {
    id: 2,
    tag: 'THE CHECKOUT',
    title: 'Daunting Checkout Screen',
    sub: 'You do not have to face the payment hurdle alone',
    accent: '#F59E0B',
    bgAccent: '#FFFBEB',
    iconText: '🛒',
    body: `
      <!-- Mockup Checkout Window -->
      <g transform="translate(60, 290)">
        <rect width="480" height="390" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <rect width="480" height="46" rx="20" fill="#0A192F"/>
        <circle cx="25" cy="23" r="5" fill="#EF4444"/>
        <circle cx="42" cy="23" r="5" fill="#F59E0B"/>
        <circle cx="59" cy="23" r="5" fill="#10B981"/>
        <text x="240" y="29" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#94A3B8" text-anchor="middle">nxtwave.academy/checkout</text>
        
        <text x="40" y="90" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#64748B" letter-spacing="1">PROGRAM FEES SUMMARY</text>
        <text x="40" y="125" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="bold" fill="#0A192F">Advanced Full-Stack AI Specialization</text>
        <text x="40" y="155" font-family="Liberation Sans, sans-serif" font-size="14" fill="#64748B">Duration: 12 Months • 3,000+ Hiring Partners</text>
        
        <line x1="40" y1="185" x2="440" y2="185" stroke="#E2E8F0" stroke-width="1.5"/>
        
        <text x="40" y="225" font-family="Liberation Sans, sans-serif" font-size="15" fill="#64748B">Course Fee</text>
        <text x="440" y="225" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#0A192F" text-anchor="end">₹1,49,000</text>
        
        <rect x="40" y="270" width="400" height="60" rx="14" fill="#0B63E5"/>
        <text x="240" y="307" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PAY IN FULL: ₹1,49,000</text>
      </g>
    `,
    line1En: 'So when you stare at that daunting checkout screen,',
    line2En: 'you do not have to hunt for bank loans alone.',
    line1Te: 'చెక్‌అవుట్ స్క్రీన్‌ను చూసి మీరు ఆందోళన చెందాల్సిన',
    line2Te: 'పనిలేదు. మేము మీకు అండగా ఉంటాము.'
  },
  {
    id: 3,
    tag: 'THE SOLUTION',
    title: 'Specialized Financing Partners',
    sub: 'NxtWave teams up with RBI-approved NBFCs',
    accent: '#0B63E5',
    bgAccent: '#EFF6FF',
    iconText: '🤝',
    body: `
      <g transform="translate(60, 290)">
        <rect width="480" height="170" rx="20" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="2"/>
        <text x="240" y="45" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#0284C7" text-anchor="middle" letter-spacing="1">TRUSTED ECOSYSTEM</text>
        <text x="240" y="90" font-family="Liberation Sans, sans-serif" font-size="28" font-weight="900" fill="#0369A1" text-anchor="middle">NxtWave × NBFC Partners</text>
        <text x="240" y="125" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#0284C7" text-anchor="middle">Varthana • Jodo • LiquiLoans</text>
      </g>
      
      <g transform="translate(60, 485)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">✓</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">Zero bank visits — 100% digital approvals</text>
      </g>
      <g transform="translate(60, 575)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">✓</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">Tailored educational terms with low monthly dues</text>
      </g>
    `,
    line1En: 'Nxtwave teams up with specialized financing partners',
    line2En: 'to make your education accessible and affordable.',
    line1Te: 'బ్యాంక్ లోన్ల కోసం మీరు ఒక్కరే తిరగాల్సిన పనిలేదు.',
    line2Te: 'నెక్స్ట్‌వేవ్ ప్రముఖ ఫైనాన్సింగ్ భాగస్వాములతో పనిచేస్తుంది.'
  },
  {
    id: 4,
    tag: 'HOW IT WORKS',
    title: 'Equal Monthly Slices',
    sub: 'Total fee divided into 6 manageable parts',
    accent: '#F97316',
    bgAccent: '#FFF7ED',
    iconText: '🍰',
    body: `
      <!-- Total Bar -->
      <g transform="translate(60, 290)">
        <rect width="480" height="60" rx="14" fill="#0A192F"/>
        <text x="240" y="38" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">TOTAL PROGRAM FEE: ₹1,49,000</text>
      </g>
      
      <!-- Arrow down -->
      <text x="300" y="385" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="bold" fill="#F97316" text-anchor="middle">DIVIDED INTO 6 MONTHLY SLICES</text>
      
      <!-- 6 Equal Blocks (2 cols x 3 rows) -->
      <g transform="translate(60, 410)">
        <rect x="0" y="0" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="115" y="30" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 1</text>
        <text x="115" y="55" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>

        <rect x="250" y="0" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="365" y="30" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 2</text>
        <text x="365" y="55" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>

        <rect x="0" y="85" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="115" y="115" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 3</text>
        <text x="115" y="140" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>

        <rect x="250" y="85" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="365" y="115" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 4</text>
        <text x="365" y="140" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>

        <rect x="0" y="170" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="115" y="200" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 5</text>
        <text x="115" y="225" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>

        <rect x="250" y="170" width="230" height="70" rx="14" fill="#EA580C"/>
        <text x="365" y="200" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#FFEDD5" text-anchor="middle">MONTH 6</text>
        <text x="365" y="225" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">₹24,833</text>
      </g>
    `,
    line1En: 'Here is how it works: That solid block of your total',
    line2En: 'fee gets divided into equal monthly slices.',
    line1Te: 'ఇది ఎలా పనిచేస్తుందంటే: మీ మొత్తం ఫీజు సమానమైన',
    line2Te: 'నెలవారీ వాయిదాలుగా విభజించబడుతుంది.'
  },
  {
    id: 5,
    tag: 'TRANSPARENT VALUE',
    title: '0% Interest: No Extra Cost',
    sub: 'You pay only the exact fee — zero extra interest',
    accent: '#10B981',
    bgAccent: '#ECFDF5',
    iconText: '%',
    body: `
      <g transform="translate(60, 290)">
        <rect width="480" height="200" rx="20" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2"/>
        <text x="240" y="50" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#047857" text-anchor="middle" letter-spacing="2">ZERO INTEREST SUBSIDIZED BY NXTWAVE</text>
        <text x="240" y="115" font-family="Liberation Sans, sans-serif" font-size="64" font-weight="900" fill="#065F46" text-anchor="middle">0% INTEREST</text>
        <text x="240" y="160" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#047857" text-anchor="middle">NO HIDDEN CHARGES • NO SURCHARGES</text>
      </g>
      
      <g transform="translate(60, 520)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <text x="35" y="42" font-family="Liberation Sans, sans-serif" font-size="18" fill="#64748B">Original Course Fee:</text>
        <text x="445" y="42" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="bold" fill="#0A192F" text-anchor="end">₹1,49,000</text>
      </g>
      <g transform="translate(60, 605)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <text x="35" y="42" font-family="Liberation Sans, sans-serif" font-size="18" fill="#64748B">Total Paid Across 6 Months:</text>
        <text x="445" y="42" font-family="Liberation Sans, sans-serif" font-size="20" font-weight="bold" fill="#059669" text-anchor="end">₹1,49,000</text>
      </g>
    `,
    line1En: 'With a zero-percent interest payment plan, you pay',
    line2En: 'the exact original fee with zero extra interest.',
    line1Te: 'జీరో పర్సెంట్ ఇంట్రెస్ట్ ప్లాన్‌తో, మీరు అసలు ఫీజును',
    line2Te: 'మాత్రమే చెల్లిస్తారు. ఎలాంటి అదనపు వడ్డీ ఉండదు.'
  },
  {
    id: 6,
    tag: 'VERIFICATION STEP',
    title: 'The Co-Applicant Rule',
    sub: 'Most students need a working parent for approval',
    accent: '#8B5CF6',
    bgAccent: '#F5F3FF',
    iconText: '🔒',
    body: `
      <!-- Gate Card -->
      <g transform="translate(60, 290)">
        <rect width="480" height="380" rx="20" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="2"/>
        
        <!-- Student Box -->
        <g transform="translate(30, 30)">
          <rect width="420" height="85" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
          <text x="25" y="38" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#0A192F">Student / Learner</text>
          <text x="25" y="65" font-family="Liberation Sans, sans-serif" font-size="14" fill="#64748B">Typically no prior income history or credit score</text>
          <circle cx="385" cy="42" r="14" fill="#FEE2E2"/>
          <text x="385" y="48" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#EF4444" text-anchor="middle">✕</text>
        </g>

        <!-- Plus connector -->
        <text x="240" y="145" font-family="Liberation Sans, sans-serif" font-size="22" font-weight="bold" fill="#8B5CF6" text-anchor="middle">+</text>

        <!-- Co-Applicant Box -->
        <g transform="translate(30, 160)">
          <rect width="420" height="95" rx="14" fill="#F5F3FF" stroke="#C4B5FD" stroke-width="2"/>
          <text x="25" y="38" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#6D28D9">Earning Co-Applicant</text>
          <text x="25" y="65" font-family="Liberation Sans, sans-serif" font-size="14" fill="#7C3AED">Working Parent • Guardian • Active Bank Account</text>
          <circle cx="385" cy="48" r="16" fill="#DCFCE7"/>
          <text x="385" y="54" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#16A34A" text-anchor="middle">✓</text>
        </g>
        
        <!-- Result text -->
        <text x="240" y="300" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#4B5563" text-anchor="middle">Quick routine identity check (PAN / Aadhaar OTP)</text>
        <text x="240" y="330" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#059669" text-anchor="middle">Unlocks instant loan approval and e-NACH setup</text>
      </g>
    `,
    line1En: 'Because most students lack an income history, you need',
    line2En: 'an earning co-applicant, like a working parent.',
    line1Te: 'విద్యార్థులకు స్వంత ఆదాయం ఉండదు కాబట్టి, సంపాదిస్తున్న',
    line2Te: 'తల్లిదండ్రులను కో-అప్లికెంట్‌గా ఎంచుకోవాలి.'
  },
  {
    id: 7,
    tag: 'INDEPENDENCE',
    title: 'Strict Division of Roles',
    sub: 'NxtWave trains you • NBFC independently approves',
    accent: '#0284C7',
    bgAccent: '#F0F9FF',
    iconText: '⚖️',
    body: `
      <!-- Split Card -->
      <g transform="translate(60, 290)">
        <rect width="480" height="380" rx="20" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="2"/>
        
        <!-- Vertical Divider -->
        <line x1="240" y1="20" x2="240" y2="360" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,4"/>
        
        <!-- Left Side: NxtWave -->
        <g transform="translate(15, 30)">
          <rect width="210" height="50" rx="10" fill="#EFF6FF"/>
          <text x="105" y="32" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#0B63E5" text-anchor="middle">NXTWAVE</text>
          
          <text x="105" y="110" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#0A192F" text-anchor="middle">Role: Education</text>
          <text x="105" y="145" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Full-Stack Curriculum</text>
          <text x="105" y="175" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Mentorship &amp; Projects</text>
          <text x="105" y="205" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Placement Drives</text>
        </g>

        <!-- Right Side: NBFC -->
        <g transform="translate(255, 30)">
          <rect width="210" height="50" rx="10" fill="#ECFDF5"/>
          <text x="105" y="32" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#059669" text-anchor="middle">FINANCING NBFC</text>
          
          <text x="105" y="110" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#0A192F" text-anchor="middle">Role: Independent</text>
          <text x="105" y="145" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Evaluates Profile</text>
          <text x="105" y="175" font-family="Liberation Sans, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">Zero Bias Review</text>
          
          <!-- Approved Stamp -->
          <g transform="translate(30, 210) rotate(-10)">
            <rect width="150" height="50" rx="8" fill="none" stroke="#16A34A" stroke-width="3"/>
            <text x="75" y="33" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="900" fill="#16A34A" text-anchor="middle" letter-spacing="2">APPROVED</text>
          </g>
        </g>
      </g>
    `,
    line1En: 'Nxtwave provides the education, while the financing',
    line2En: 'partner independently evaluates and approves you.',
    line1Te: 'నెక్స్ట్‌వేవ్ కేవలం విద్యను మాత్రమే అందిస్తుంది.',
    line2Te: 'ఫైనాన్సింగ్ భాగస్వామి స్వతంత్రంగా ఆమోదం తెలుపుతుంది.'
  },
  {
    id: 8,
    tag: 'APPROVAL',
    title: 'Automated Repayment Setup',
    sub: 'Payments lock into a hassle-free digital schedule',
    accent: '#10B981',
    bgAccent: '#ECFDF5',
    iconText: '🔓',
    body: `
      <g transform="translate(60, 290)">
        <rect width="480" height="170" rx="20" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2"/>
        <text x="240" y="45" font-family="Liberation Sans, sans-serif" font-size="14" font-weight="bold" fill="#047857" text-anchor="middle" letter-spacing="1">INSTANT DIGITAL ACTIVATION</text>
        <text x="240" y="90" font-family="Liberation Sans, sans-serif" font-size="30" font-weight="900" fill="#065F46" text-anchor="middle">Automated e-NACH Setup</text>
        <text x="240" y="125" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#047857" text-anchor="middle">Hassle-free automated monthly debits</text>
      </g>
      
      <g transform="translate(60, 485)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">✓</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">No late fees — automated on your chosen date</text>
      </g>
      <g transform="translate(60, 575)">
        <rect width="480" height="70" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">✓</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#334155">Instant access to course portal and mentor support</text>
      </g>
    `,
    line1En: 'Once approved, the gate opens. Those monthly blocks',
    line2En: 'lock into an automated sequence for hassle-free repayment.',
    line1Te: 'ఆమోదం పొందిన వెంటనే, సులభమైన రీపేమెంట్ కోసం',
    line2Te: 'నెలవారీ వాయిదాలు ఆటోమేటిక్‌గా ప్రారంభమవుతాయి.'
  },
  {
    id: 9,
    tag: 'YOUR FUTURE',
    title: 'Focus on Your Tech Career',
    sub: 'Let the monthly plan handle finances while you learn',
    accent: '#0B63E5',
    bgAccent: '#EFF6FF',
    iconText: '🚀',
    body: `
      <g transform="translate(60, 290)">
        <rect width="480" height="200" rx="20" fill="#0A192F"/>
        <text x="240" y="55" font-family="Liberation Sans, sans-serif" font-size="15" font-weight="bold" fill="#60A5FA" text-anchor="middle" letter-spacing="2">LAUNCH YOUR TECH JOURNEY</text>
        <text x="240" y="115" font-family="Liberation Sans, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" text-anchor="middle">Zero Upfront Stress</text>
        <text x="240" y="155" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#93C5FD" text-anchor="middle">100% Focus on Mastering Tech Skills</text>
      </g>
      
      <g transform="translate(60, 520)">
        <rect width="480" height="70" rx="16" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">★</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#15803D">Comfortable monthly repayment</text>
      </g>
      <g transform="translate(60, 605)">
        <rect width="480" height="70" rx="16" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
        <circle cx="35" cy="35" r="14" fill="#DCFCE7"/>
        <text x="35" y="41" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#16A34A" text-anchor="middle">★</text>
        <text x="65" y="42" font-family="Liberation Sans, sans-serif" font-size="17" font-weight="bold" fill="#15803D">High-paying tech job placement support</text>
      </g>
    `,
    line1En: 'Instead of stressing over the total, you can rely on a monthly plan,',
    line2En: 'letting you focus entirely on your new tech career.',
    line1Te: 'ఒకేసారి ఫీజు భారం లేకుండా, సౌకర్యవంతమైన నెలవారీ ప్లాన్‌తో',
    line2Te: 'మీరు పూర్తిగా మీ టెక్ కెరీర్ నిర్మాణంపై దృష్టి పెట్టవచ్చు.'
  }
];

function generateSvg(scene, lang = 'en') {
  const line1 = lang === 'te' ? scene.line1Te : scene.line1En;
  const line2 = lang === 'te' ? scene.line2Te : scene.line2En;

  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDFBF7" />
      <stop offset="100%" stop-color="#F4EFE6" />
    </linearGradient>
    <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.5" fill="#D9D2C5" />
    </pattern>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0A192F" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="720" height="1280" fill="url(#bg)" />
  <rect width="720" height="1280" fill="url(#dot-grid)" />

  <!-- Top Header Pill -->
  <g transform="translate(60, 50)">
    <rect width="600" height="54" rx="27" fill="#FFFFFF" stroke="#E2DCD5" stroke-width="2" filter="url(#shadow)"/>
    <text x="300" y="34" font-family="Liberation Sans, sans-serif" font-size="18" font-weight="bold" fill="#0B63E5" text-anchor="middle" letter-spacing="1">
      NXTWAVE ACADEMY • NO-COST EMI GUIDE
    </text>
  </g>

  <!-- Main Card Container -->
  <g transform="translate(60, 130)" filter="url(#shadow)">
    <rect width="600" height="780" rx="32" fill="#FFFFFF" stroke="#E2DCD5" stroke-width="2" />
    
    <!-- Tag Pill -->
    <g transform="translate(200, 35)">
      <rect width="200" height="34" rx="17" fill="${scene.bgAccent}" stroke="${scene.accent}" stroke-width="1.5"/>
      <text x="100" y="23" font-family="Liberation Sans, sans-serif" font-size="13" font-weight="bold" fill="${scene.accent}" text-anchor="middle" letter-spacing="1">${scene.tag}</text>
    </g>

    <!-- Title -->
    <text x="300" y="115" font-family="Liberation Sans, sans-serif" font-size="30" font-weight="bold" fill="#0A192F" text-anchor="middle">
      ${scene.title}
    </text>
    
    <!-- Subtitle -->
    <text x="300" y="150" font-family="Liberation Sans, sans-serif" font-size="16" fill="#64748B" text-anchor="middle">
      ${scene.sub}
    </text>

    <!-- Custom Scene Body -->
    ${scene.body}
  </g>

  <!-- Bottom Captions Box -->
  <g transform="translate(40, 950)">
    <rect width="640" height="250" rx="24" fill="#0A192F" />
    <text x="320" y="60" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="bold" fill="#60A5FA" text-anchor="middle" letter-spacing="1">
      EXPLAINER GUIDE • ${lang.toUpperCase()}
    </text>
    <text x="320" y="125" font-family="Liberation Sans, sans-serif" font-size="22" font-weight="500" fill="#F8FAFC" text-anchor="middle">
      ${line1}
    </text>
    <text x="320" y="170" font-family="Liberation Sans, sans-serif" font-size="22" font-weight="500" fill="#F8FAFC" text-anchor="middle">
      ${line2}
    </text>
  </g>
</svg>`;
}

async function buildAll() {
  const tmpDir = path.join('/tmp', 'emi_build');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const outVideosDir = path.join(process.cwd(), 'public', 'videos');
  if (!fs.existsSync(outVideosDir)) fs.mkdirSync(outVideosDir, { recursive: true });

  for (const lang of ['en', 'te']) {
    console.log(`Building video for ${lang}...`);
    const partFiles = [];

    for (const s of scenesData) {
      const svgContent = generateSvg(s, lang);
      const svgPath = path.join(tmpDir, `scene_${lang}_${s.id}.svg`);
      fs.writeFileSync(svgPath, svgContent);

      const audioPath = path.join(process.cwd(), 'public', 'audio', 'emi_scenes', `scene_${lang}_${s.id}.mp3`);
      const partPath = path.join(tmpDir, `part_${lang}_${s.id}.mp4`);

      console.log(`Rendering ${partPath}...`);
      execSync(`ffmpeg -loglevel error -loop 1 -i "${svgPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${partPath}" -y`, { maxBuffer: 50 * 1024 * 1024 });
      partFiles.push(partPath);
    }

    // Concatenate into final video
    const concatTxt = path.join(tmpDir, `concat_${lang}.txt`);
    const concatContent = partFiles.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatTxt, concatContent);

    const finalVideoName = lang === 'te' ? 'nxtwave_emi_explainer_te.mp4' : 'nxtwave_emi_explainer.mp4';
    const finalVideoPath = path.join(outVideosDir, finalVideoName);
    console.log(`Concatenating to ${finalVideoPath}...`);
    execSync(`ffmpeg -loglevel error -f concat -safe 0 -i "${concatTxt}" -c copy "${finalVideoPath}" -y`, { maxBuffer: 50 * 1024 * 1024 });
    console.log(`Finished ${finalVideoPath}!`);
  }

  // Generate WebVTT subtitles
  for (const lang of ['en', 'te']) {
    let currentTime = 0;
    let vtt = 'WEBVTT\n\n';

    for (let i = 0; i < scenesData.length; i++) {
      const s = scenesData[i];
      const audioPath = path.join(process.cwd(), 'public', 'audio', 'emi_scenes', `scene_${lang}_${s.id}.mp3`);
      const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`).toString().trim());

      const start = formatVttTime(currentTime);
      const end = formatVttTime(currentTime + dur);
      currentTime += dur;

      const line1 = lang === 'te' ? s.line1Te : s.line1En;
      const line2 = lang === 'te' ? s.line2Te : s.line2En;
      vtt += `${i + 1}\n${start} --> ${end}\n${line1} ${line2}\n\n`;
    }

    const vttName = lang === 'te' ? 'emi_subtitles_te.vtt' : 'emi_subtitles_en.vtt';
    fs.writeFileSync(path.join(outVideosDir, vttName), vtt);
    console.log(`Saved ${vttName}!`);
  }
}

function formatVttTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

buildAll().catch(console.error);
