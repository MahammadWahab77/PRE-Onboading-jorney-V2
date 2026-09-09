import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';

const scenesEn = [
  { id: 1, text: 'You want to join Nxtwave, but paying the entire program fee upfront is a massive roadblock.' },
  { id: 2, text: 'So when you stare at that daunting checkout screen, you do not have to hunt for bank loans alone.' },
  { id: 3, text: 'Nxtwave teams up with specialized financing partners to make your education accessible.' },
  { id: 4, text: 'Here is how it works: That solid block of your total fee gets divided into equal monthly slices.' },
  { id: 5, text: 'With a zero-percent interest payment plan, you pay the exact original fee. There is absolutely no extra interest added over time.' },
  { id: 6, text: 'Because most students lack an income history, you need an earning co-applicant, like a working parent, plus routine identity verification.' },
  { id: 7, text: 'This is where we draw a strict line: Nxtwave solely provides the education, while the financing partner independently evaluates and approves your application.' },
  { id: 8, text: 'Once approved, the gate opens. Those monthly blocks lock into an automated sequence for hassle-free repayment.' },
  { id: 9, text: 'Instead of stressing over how to pay that giant day-one total all by yourself, you can rely on a comfortable monthly plan, letting you focus entirely on your new tech career.' }
];

const scenesTe = [
  { id: 1, text: 'మీరు నెక్స్ట్‌వేవ్‌లో చేరాలనుకుంటున్నారు, కానీ మొత్తం ఫీజును ఒకేసారి చెల్లించడం ఒక పెద్ద అడ్డంకిగా అనిపించవచ్చు.' },
  { id: 2, text: 'చెక్‌అవుట్ స్క్రీన్‌ను చూసి మీరు ఆందోళన చెందాల్సిన పనిలేదు.' },
  { id: 3, text: 'బ్యాంక్ లోన్ల కోసం మీరు ఒక్కరే తిరగాల్సిన అవసరం లేదు. నెక్స్ట్‌వేవ్ ప్రముఖ ఫైనాన్సింగ్ భాగస్వాములతో కలిసి పనిచేస్తుంది.' },
  { id: 4, text: 'ఇది ఎలా పనిచేస్తుందంటే: మీ మొత్తం ఫీజు సమానమైన నెలవారీ వాయిదాలుగా విభజించబడుతుంది.' },
  { id: 5, text: 'జీరో పర్సెంట్ ఇంట్రెస్ట్ ప్లాన్‌తో, మీరు అసలు ఫీజును మాత్రమే చెల్లిస్తారు. ఎలాంటి అదనపు వడ్డీ ఉండదు.' },
  { id: 6, text: 'విద్యార్థులకు స్వంత ఆదాయం ఉండదు కాబట్టి, సంపాదిస్తున్న తల్లిదండ్రులను కో-అప్లికెంట్‌గా ఎంచుకోవాలి మరియు గుర్తింపు ధృవీకరణ పూర్తి చేయాలి.' },
  { id: 7, text: 'నెక్స్ట్‌వేవ్ కేవలం విద్యను మాత్రమే అందిస్తుంది. ఫైనాన్సింగ్ భాగస్వామి స్వతంత్రంగా మీ ప్రొఫైల్‌ను పరిశీలించి ఆమోదం తెలుపుతుంది.' },
  { id: 8, text: 'ఆమోదం పొందిన వెంటనే, సులభమైన రీపేమెంట్ కోసం నెలవారీ వాయిదాలు ఆటోమేటిక్‌గా ప్రారంభమవుతాయి.' },
  { id: 9, text: 'ఒకేసారి ఫీజు భారం లేకుండా, సౌకర్యవంతమైన నెలవారీ ప్లాన్‌తో మీరు పూర్తిగా మీ టెక్ కెరీర్ నిర్మాణంపై దృష్టి పెట్టవచ్చు.' }
];

async function generateAll() {
  const outDir = path.join(process.cwd(), 'public', 'audio', 'emi_scenes');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const s of scenesEn) {
    const chunks = await googleTTS.getAllAudioBase64(s.text, { lang: 'en', slow: false });
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c.base64, 'base64')));
    fs.writeFileSync(path.join(outDir, `scene_en_${s.id}.mp3`), buf);
    console.log(`Saved scene_en_${s.id}.mp3, size: ${buf.length}`);
  }

  for (const s of scenesTe) {
    const chunks = await googleTTS.getAllAudioBase64(s.text, { lang: 'te', slow: false });
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c.base64, 'base64')));
    fs.writeFileSync(path.join(outDir, `scene_te_${s.id}.mp3`), buf);
    console.log(`Saved scene_te_${s.id}.mp3, size: ${buf.length}`);
  }

  console.log('All EMI audio clips generated successfully!');
}

generateAll().catch(console.error);
