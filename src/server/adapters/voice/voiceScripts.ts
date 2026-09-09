/**
 * Multi-Language Voice Guidance Scripts for NxtWave PRE Onboarding
 * Supports Telugu, Hindi, Tamil, Kannada, and English based on Salesforce Preferred_Languages__c
 */

export interface StepGuidanceScript {
  title: string;
  speech: string;
  keyPoints: string[];
  faqSuggestions: string[];
}

export const LANGUAGE_CODES: Record<string, { code: string; bcp47: string; nativeName: string }> = {
  English: { code: 'en', bcp47: 'en-IN', nativeName: 'English' },
  Telugu: { code: 'te', bcp47: 'te-IN', nativeName: 'తెలుగు' },
  Hindi: { code: 'hi', bcp47: 'hi-IN', nativeName: 'हिन्दी' },
  Tamil: { code: 'ta', bcp47: 'ta-IN', nativeName: 'தமிழ்' },
  Kannada: { code: 'kn', bcp47: 'kn-IN', nativeName: 'ಕನ್ನಡ' },
  Malayalam: { code: 'ml', bcp47: 'ml-IN', nativeName: 'മലയാളം' },
  Marathi: { code: 'mr', bcp47: 'mr-IN', nativeName: 'मराठी' },
  Bengali: { code: 'bn', bcp47: 'bn-IN', nativeName: 'বাংলা' },
  Gujarati: { code: 'gu', bcp47: 'gu-IN', nativeName: 'ગુજરાતી' },
};

export const LOCALIZED_STEP_SCRIPTS: Record<string, Record<string, StepGuidanceScript>> = {
  English: {
    auth: {
      title: 'Verification Step',
      speech: 'Welcome to NxtWave! Let us verify your registered mobile number to access your official enrollment portal.',
      keyPoints: [
        'Enter your 10-digit registered Indian mobile number',
        'Verify with the 6-digit WhatsApp code sent to your phone',
        'Direct connection to your admissions counselor record',
      ],
      faqSuggestions: [
        'Why do I need mobile verification?',
        'What if I did not receive the WhatsApp code?',
        'Can I change my registered phone number?',
      ],
    },
    congratulations: {
      title: 'Welcome & Next Steps',
      speech: 'Congratulations on taking this exciting step towards your tech career! Your NxtWave Genius enrollment journey is ready. Let us review your program details.',
      keyPoints: [
        'Your admission seat is reserved',
        'Review your program highlights and fee breakdown',
        'No immediate payment required on this screen',
      ],
      faqSuggestions: [
        'What is included in the Genius program?',
        'When does the upcoming cohort start?',
        'Can I talk to my counselor first?',
      ],
    },
    program: {
      title: 'Program Fee & Scholarship Breakdown',
      speech: 'Here is your transparent fee breakdown for NxtWave Genius. Review your merit scholarship, deduction of your seat reservation fee, and net amount payable.',
      keyPoints: [
        'Total Program Price: ₹1,60,000',
        'Merit Scholarship: -₹30,000',
        'Seat Reservation Paid: -₹18,000',
        'Net Amount Payable: ₹1,12,000 all inclusive',
      ],
      faqSuggestions: [
        'Are there any hidden charges or taxes?',
        'Can I get an official tax invoice?',
        'How does No-Cost EMI compare to full payment?',
      ],
    },
    payment: {
      title: 'Payment Method Selection',
      speech: 'Choose the payment option that suits your family best. You can pay the complete fee upfront, use a credit card, or choose an affordable No-Cost EMI plan with zero extra interest.',
      keyPoints: [
        'Full Payment: instant receipt & immediate LMS activation',
        'Credit Card: standard instant checkout',
        'No-Cost EMI: spread over 6 monthly installments with zero interest',
      ],
      faqSuggestions: [
        'How does No-Cost EMI work?',
        'Which option gives the quickest class access?',
        'Can I change payment method later?',
      ],
    },
    pay: {
      title: 'Secure Payment Checkout',
      speech: 'You are completing your tuition fee payment securely. Once completed, your enrollment receipt is generated and your class access is unlocked.',
      keyPoints: [
        '100% secure payment via RBI compliant gateway',
        'Instant receipt with tax breakdown',
        'Instant class access upon completion',
      ],
      faqSuggestions: [
        'Is my payment information safe?',
        'What payment methods are accepted?',
      ],
    },
    'payment-success': {
      title: 'Payment Confirmed',
      speech: 'Payment successful! Your course fee has been received and verified. Let us now unlock your learning portal and cohort access.',
      keyPoints: [
        'Payment transaction confirmed',
        'Official receipt generated',
        'Proceed to unlock class access',
      ],
      faqSuggestions: [
        'Where can I download my receipt?',
        'When will my LMS account be active?',
      ],
    },
    emi: {
      title: 'Why No-Cost EMI?',
      speech: 'With No-Cost EMI, you pay only the actual course fee divided into equal monthly installments. NxtWave covers the interest cost, so you pay zero extra interest.',
      keyPoints: [
        '₹0 additional interest or hidden charges',
        '6 easy monthly installments',
        'Fully RBI-compliant financing with verified NBFC partners',
      ],
      faqSuggestions: [
        'How is No-Cost EMI calculated?',
        'Who is eligible to be a co-applicant?',
      ],
    },
    'co-applicant': {
      title: 'Co-Applicant Information',
      speech: 'A co-applicant is an earning family member, like a parent or working sibling, who supports your EMI financing application. Please provide their details to continue.',
      keyPoints: [
        'Typically Father, Mother, or employed sibling',
        'Must have regular income or employment',
        'Only basic contact and income details needed right now',
      ],
      faqSuggestions: [
        'Can a retired parent be my co-applicant?',
        'Will my co-applicant get an SMS verification?',
      ],
    },
    kyc: {
      title: 'Digital KYC Verification',
      speech: 'Let us verify your identity and documents digitally. Have your PAN and Aadhaar details handy for a seamless verification.',
      keyPoints: [
        'Digital document check: PAN card & Aadhaar',
        'Upload clear, unblurred photos or PDFs',
        'Instant verification update once submitted',
      ],
      faqSuggestions: [
        'What if my Aadhaar is not linked to mobile?',
        'How long does KYC verification take?',
      ],
    },
    'nbfc-status': {
      title: 'Financing Status & Timeline',
      speech: 'Here is the live status of your education financing application with our partner NBFC. You can track review progress, complete auto-debit setup, and resolve any questions.',
      keyPoints: [
        'Live timeline tracking from review to disbursement',
        'Set up your auto-debit once approved',
        'Direct counselor assistance available if help is needed',
      ],
      faqSuggestions: [
        'How long does lender review take?',
        'How do I complete the EMI auto-debit mandate?',
      ],
    },
    'class-access': {
      title: 'Welcome to NxtWave Learning',
      speech: 'Congratulations! Your enrollment is 100% complete and your learning journey begins now. Access your student portal and orientation materials.',
      keyPoints: [
        'Official student LMS credentials unlocked',
        'Join your cohort community and orientation session',
        '24/7 student support and mentoring available',
      ],
      faqSuggestions: [
        'How do I log in to the learning portal?',
        'When is the orientation call scheduled?',
      ],
    },
  },

  Telugu: {
    auth: {
      title: 'మొబైల్ వెరిఫికేషన్',
      speech: 'NxtWave కి స్వాగతం! మీ అధికారిక అడ్మిషన్ పోర్టల్‌ని యాక్సెస్ చేయడానికి మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌ను ధృవీకరించండి.',
      keyPoints: [
        'మీ 10 అంకెల రిజిస్టర్డ్ మొబైల్ నంబర్‌ను నమోదు చేయండి',
        'వాట్సాప్‌లో వచ్చిన 6 అంకెల కోడ్‌తో వెరిఫై చేయండి',
        'మీ అడ్మిషన్ కౌన్సెలర్ రికార్డుకు నేరుగా కనెక్ట్ అవుతుంది',
      ],
      faqSuggestions: [
        'మొబైల్ వెరిఫికేషన్ ఎందుకు అవసరం?',
        'నాకు వాట్సాప్ కోడ్ రాకపోతే ఏం చేయాలి?',
      ],
    },
    congratulations: {
      title: 'స్వాగతం & తదుపరి వివరాలు',
      speech: 'మీ సాఫ్ట్‌వేర్ కెరీర్ వైపు అడుగు వేసినందుకు అభినందనలు! మీ NxtWave జీనియస్ అడ్మిషన్ సిద్ధంగా ఉంది. మీ ప్రోగ్రామ్ వివరాలను పరిశీలించండి.',
      keyPoints: [
        'మీ అడ్మిషన్ సీటు రిజర్వ్ చేయబడింది',
        'ఫీజు మరియు స్కాలర్‌షిప్ వివరాలను సమీక్షించండి',
        'ఈ పేజీలో ఎలాంటి చెల్లింపు అవసరం లేదు',
      ],
      faqSuggestions: [
        'జీనియస్ ప్రోగ్రామ్‌లో ఏమేమి ఉంటాయి?',
        'కొత్త బ్యాచ్ ఎప్పుడు ప్రారంభమవుతుంది?',
      ],
    },
    program: {
      title: 'ఫీజు & స్కాలర్‌షిప్ వివరాలు',
      speech: 'NxtWave జీనియస్ ఫీజు వివరాలు ఇక్కడ ఉన్నాయి. మీ మెరిట్ స్కాలర్‌షిప్ మరియు సీట్ రిజర్వేషన్ తగ్గింపు తర్వాత చెల్లించాల్సిన నికర మొత్తం ఇక్కడ చూడవచ్చు.',
      keyPoints: [
        'మొత్తం ప్రోగ్రామ్ ఫీజు: ₹1,60,000',
        'మెరిట్ స్కాలర్‌షిప్: -₹30,000',
        'సీట్ రిజర్వేషన్ చెల్లించినది: -₹18,000',
        'చెల్లించాల్సిన నికర మొత్తం: ₹1,12,000 (అన్ని పన్నులతో కలిపి)',
      ],
      faqSuggestions: [
        'ఏవైనా అదనపు ఛార్జీలు ఉన్నాయా?',
        'నో-కాస్ట్ ఈఎంఐ ఎలా పనిచేస్తుంది?',
      ],
    },
    payment: {
      title: 'చెల్లింపు పద్ధతి ఎంపిక',
      speech: 'మీ కుటుంబానికి అనువైన చెల్లింపు పద్ధతిని ఎంచుకోండి. మీరు పూర్తి ఫీజును ఒకేసారి చెల్లించవచ్చు లేదా వడ్డీ లేని నో-కాస్ట్ ఈఎంఐ ద్వారా నెలవారీ వాయిదాలలో చెల్లించవచ్చు.',
      keyPoints: [
        'పూర్తి చెల్లింపు: తక్షణ రసీదు మరియు వెంటనే క్లాస్ యాక్సెస్',
        'నో-కాస్ట్ ఈఎంఐ: 6 నెలల వాయిదాలు, సున్నా అదనపు వడ్డీ',
      ],
      faqSuggestions: [
        'నో-కాస్ట్ ఈఎంఐ ఎలా పనిచేస్తుంది?',
        'ఏ ఆప్షన్ ద్వారా త్వరగా క్లాసులు ప్రారంభమవుతాయి?',
      ],
    },
    pay: {
      title: 'సురక్షిత చెల్లింపు',
      speech: 'మీరు మీ ప్రోగ్రామ్ ఫీజును సురక్షితంగా చెల్లిస్తున్నారు. చెల్లింపు పూర్తయిన వెంటనే మీ అడ్మిషన్ రసీదు డౌన్‌లోడ్ అవుతుంది మరియు క్లాస్ యాక్సెస్ లభిస్తుంది.',
      keyPoints: [
        'ఆర్బీఐ నిబంధనల ప్రకారం 100% సురక్షిత చెల్లింపు',
        'పన్ను వివరాలతో కూడిన అధికారిక రసీదు',
      ],
      faqSuggestions: ['నా చెల్లింపు సమాచారం సురక్షితమేనా?'],
    },
    'payment-success': {
      title: 'చెల్లింపు విజయవంతమైంది',
      speech: 'చెల్లింపు విజయవంతంగా పూర్తయింది! మీ ఫీజు రికార్డు నమోదైంది. ఇప్పుడు మీ లెర్నింగ్ పోర్టల్ మరియు క్లాస్ యాక్సెస్ పొందండి.',
      keyPoints: ['చెల్లింపు ధృవీకరించబడింది', 'అధికారిక రసీదు సిద్ధంగా ఉంది'],
      faqSuggestions: ['రసీదును ఎక్కడ డౌన్‌లోడ్ చేయాలి?'],
    },
    emi: {
      title: 'నో-కాస్ట్ ఈఎంఐ ప్రత్యేకత ఏమిటి?',
      speech: 'నో-కాస్ట్ ఈఎంఐలో మీరు కోర్సు ఫీజును మాత్రమే సమాన నెలవారీ వాయిదాలలో చెల్లిస్తారు. వడ్డీ మొత్తాన్ని NxtWave భరిస్తుంది, కాబట్టి మీరు ఒక్క రూపాయి కూడా అదనపు వడ్డీ చెల్లించాల్సిన అవసరం లేదు.',
      keyPoints: [
        'సున్నా అదనపు వడ్డీ లేదా దాగివున్న ఛార్జీలు',
        '6 సులభమైన నెలవారీ వాయిదాలు',
        'ఆర్బీఐ గుర్తింపు పొందిన ఎన్‌బీఎఫ్‌సీ భాగస్వాములు',
      ],
      faqSuggestions: [
        'ఈఎంఐ మొత్తం ఎలా లెక్కించబడుతుంది?',
        'కో-అప్లికెంట్‌గా ఎవరు ఉండవచ్చు?',
      ],
    },
    'co-applicant': {
      title: 'కో-అప్లికెంట్ వివరాలు',
      speech: 'కో-అప్లికెంట్ అంటే మీ ఈఎంఐ లోన్ దరఖాస్తుకు మద్దతు ఇచ్చే సంపాదిస్తున్న కుటుంబ సభ్యుడు (తల్లిదండ్రులు లేదా ఉద్యోగం చేసే తోబుట్టువు). దయచేసి వారి ప్రాథమిక వివరాలను నమోదు చేయండి.',
      keyPoints: [
        'తండ్రి, తల్లి లేదా ఉద్యోగం చేస్తున్న తోబుట్టువు',
        'రెగ్యులర్ ఆదాయం లేదా వ్యాపారం కలిగి ఉండాలి',
      ],
      faqSuggestions: ['రిటైర్డ్ తల్లిదండ్రులు కో-అప్లికెంట్‌గా ఉండవచ్చా?'],
    },
    kyc: {
      title: 'డిజిటల్ కేవైసీ వెరిఫికేషన్',
      speech: 'మీ గుర్తింపు పత్రాలను డిజిటల్‌గా సులభంగా వెరిఫై చేద్దాం. వేగవంతమైన వెరిఫికేషన్ కోసం మీ పాన్ కార్డ్ మరియు ఆధార్ వివరాలను సిద్ధంగా ఉంచుకోండి.',
      keyPoints: [
        'పాన్ కార్డ్ మరియు ఆధార్ డిజిటల్ పరిశీలన',
        'స్పష్టమైన ఫోటోలు లేదా పీడీఎఫ్ అప్‌లోడ్ చేయండి',
      ],
      faqSuggestions: ['కేవైసీ పూర్తి కావడానికి ఎంత సమయం పడుతుంది?'],
    },
    'nbfc-status': {
      title: 'ఫైనాన్సింగ్ స్టేటస్ & టైమ్‌లైన్',
      speech: 'ఎన్‌బీఎఫ్‌సీ పార్టనర్ వద్ద మీ లోన్ అప్లికేషన్ యొక్క లైవ్ స్టేటస్ ఇక్కడ చూడవచ్చు. మీరు ఆటో-డెబిట్ ప్రక్రియను పూర్తి చేసి లోన్ అప్రూవల్ పొందవచ్చు.',
      keyPoints: [
        'దరఖాస్తు నుండి విడుదల వరకు లైవ్ ట్రాకింగ్',
        'అప్రూవల్ రాగానే ఆటో-డెబిట్ సెటప్ పూర్తి చేయండి',
      ],
      faqSuggestions: ['ఆటో-డెబిట్ ఎలా సెటప్ చేయాలి?'],
    },
    'class-access': {
      title: 'NxtWave లెర్నింగ్‌కు స్వాగతం',
      speech: 'అభినందనలు! మీ అడ్మిషన్ విజయవంతంగా పూర్తయింది. మీ క్లాస్ యాక్సెస్ అన్‌లాక్ అయింది. మీ స్టూడెంట్ పోర్టల్ మరియు ఓరియంటేషన్ వివరాలను ఇక్కడ పొందండి.',
      keyPoints: [
        'అధికారిక స్టూడెంట్ ఎల్‌ఎంఎస్ లాగిన్ యాక్సెస్ లభించింది',
        'మీ బ్యాచ్ కమ్యూనిటీ మరియు ఓరియంటేషన్ సెషన్‌లో చేరండి',
      ],
      faqSuggestions: ['లెర్నింగ్ పోర్టల్‌లోకి ఎలా లాగిన్ అవ్వాలి?'],
    },
  },

  Hindi: {
    auth: {
      title: 'मोबाइल सत्यापन',
      speech: 'NxtWave में आपका स्वागत है! अपने आधिकारिक नामांकन पोर्टल तक पहुंचने के लिए कृपया अपने पंजीकृत मोबाइल नंबर को सत्यापित करें।',
      keyPoints: [
        'अपना 10 अंकों का पंजीकृत भारतीय मोबाइल नंबर दर्ज करें',
        'व्हाट्सएप पर प्राप्त 6 अंकों के कोड से सत्यापित करें',
      ],
      faqSuggestions: ['मोबाइल सत्यापन क्यों आवश्यक है?'],
    },
    congratulations: {
      title: 'बधाई एवं अगले कदम',
      speech: 'अपने तकनीकी करियर की ओर यह कदम बढ़ाने के लिए बधाई! आपका NxtWave जीनियस नामांकन तैयार है। आइए अपनी कार्यक्रम जानकारी की समीक्षा करें।',
      keyPoints: [
        'आपकी सीट आरक्षित कर दी गई है',
        'कार्यक्रम हाइलाइट्स और शुल्क विवरण देखें',
      ],
      faqSuggestions: ['जीनियस प्रोग्राम में क्या शामिल है?'],
    },
    program: {
      title: 'शुल्क एवं छात्रवृत्ति विवरण',
      speech: 'NxtWave जीनियस का पारदर्शी शुल्क विवरण यहाँ है। अपनी मेरिट स्कॉलरशिप, सीट आरक्षण छूट और कुल देय राशि की समीक्षा करें।',
      keyPoints: [
        'कुल प्रोग्राम शुल्क: ₹1,60,000',
        'मेरिट छात्रवृत्ति: -₹30,000',
        'सीट आरक्षण भुगतान: -₹18,000',
        'कुल देय राशि: ₹1,12,000 (सभी कर सहित)',
      ],
      faqSuggestions: ['नो-कॉस्ट ईएमआई कैसे काम करती है?'],
    },
    payment: {
      title: 'भुगतान विकल्प का चयन',
      speech: 'वह विकल्प चुनें जो आपके परिवार के लिए सबसे उपयुक्त हो। आप पूरा शुल्क एक साथ दे सकते हैं या शून्य ब्याज पर नो-कॉस्ट ईएमआई चुन सकते हैं।',
      keyPoints: [
        'पूर्ण भुगतान: तत्काल रसीद और तुरंत क्लास एक्सेस',
        'नो-कॉस्ट ईएमआई: 6 आसान मासिक किस्तें बिना किसी ब्याज के',
      ],
      faqSuggestions: ['नो-कॉस्ट ईएमआई कैसे काम करती है?'],
    },
    pay: {
      title: 'सुरक्षित भुगतान',
      speech: 'आप अपने प्रोग्राम शुल्क का भुगतान सुरक्षित रूप से कर रहे हैं। पूर्ण होते ही आपकी आधिकारिक रसीद और क्लास एक्सेस अनलॉक हो जाएगी।',
      keyPoints: ['आरबीआई दिशानिर्देशों के अनुसार 100% सुरक्षित भुगतान'],
      faqSuggestions: ['क्या मेरी भुगतान जानकारी सुरक्षित है?'],
    },
    'payment-success': {
      title: 'भुगतान सफल',
      speech: 'भुगतान सफलतापूर्वक प्राप्त हुआ! आइए अब आपकी लर्निंग पोर्टल और कक्षाओं का एक्सेस अनलॉक करें।',
      keyPoints: ['लेन-देन सत्यापित किया गया', 'आधिकारिक रसीद उपलब्ध है'],
      faqSuggestions: ['रसीद कहाँ से डाउनलोड करें?'],
    },
    emi: {
      title: 'नो-कॉस्ट ईएमआई क्यों?',
      speech: 'नो-कॉस्ट ईएमआई के साथ आप केवल वास्तविक कोर्स शुल्क को समान मासिक किस्तों में चुकाते हैं। ब्याज का खर्च NxtWave वहन करता है।',
      keyPoints: [
        'शून्य अतिरिक्त ब्याज या छिपा हुआ शुल्क',
        '6 आसान मासिक किस्तें',
      ],
      faqSuggestions: ['सह-आवेदक कौन हो सकता है?'],
    },
    'co-applicant': {
      title: 'सह-आवेदक विवरण',
      speech: 'सह-आवेदक परिवार का एक कमाने वाला सदस्य (माता-पिता या कामकाजी भाई-बहन) होता है जो आपके ईएमआई लोन में सहायता करता है।',
      keyPoints: [
        'पिता, माता या कामकाजी भाई-बहन',
        'नियमित आय या व्यवसाय होना चाहिए',
      ],
      faqSuggestions: ['क्या रिटायर्ड माता-पिता सह-आवेदक बन सकते हैं?'],
    },
    kyc: {
      title: 'डिजिटल केवाईसी सत्यापन',
      speech: 'आइए अपनी पहचान और दस्तावेजों का डिजिटल सत्यापन करें। तुरंत प्रक्रिया के लिए अपना पैन कार्ड और आधार तैयार रखें।',
      keyPoints: ['पैन और आधार की डिजिटल जाँच'],
      faqSuggestions: ['केवाईसी में कितना समय लगता है?'],
    },
    'nbfc-status': {
      title: 'फाइनेंसिंग स्थिति एवं टाइमलाइन',
      speech: 'यहाँ हमारे एनबीएफसी पार्टनर के साथ आपके लोन आवेदन की लाइव स्थिति है। आप ऑटो-डेबिट सेटअप पूरा करके आगे बढ़ सकते हैं।',
      keyPoints: [
        'समीक्षा से लेकर स्वीकृति तक लाइव ट्रैकिंग',
        'स्वीकृति मिलने पर ऑटो-डेबिट सेटअप करें',
      ],
      faqSuggestions: ['ऑटो-डेबिट कैसे सेट करें?'],
    },
    'class-access': {
      title: 'NxtWave में आपका स्वागत है',
      speech: 'बधाई हो! आपका नामांकन 100% पूरा हो गया है। आपका लर्निंग पोर्टल अनलॉक हो चुका है। अपनी कक्षाओं और ओरिएंटेशन से जुड़ें।',
      keyPoints: [
        'आधिकारिक छात्र एलएमएस लॉगिन अनलॉक',
        'कम्युनिटी और ओरिएंटेशन सेशन से जुड़ें',
      ],
      faqSuggestions: ['लर्निंग पोर्टल में कैसे लॉगिन करें?'],
    },
  },
};

export function getLocalizedStepScript(step: string, preferredLanguage = 'English'): StepGuidanceScript {
  let normalized = 'English';
  const cleanLang = (preferredLanguage || '').split(';')[0].trim().toLowerCase();

  if (cleanLang.includes('telugu') || cleanLang === 'te') normalized = 'Telugu';
  else if (cleanLang.includes('hindi') || cleanLang === 'hi') normalized = 'Hindi';

  const langScripts = LOCALIZED_STEP_SCRIPTS[normalized] || LOCALIZED_STEP_SCRIPTS.English;
  return langScripts[step] || langScripts.auth || LOCALIZED_STEP_SCRIPTS.English[step];
}
