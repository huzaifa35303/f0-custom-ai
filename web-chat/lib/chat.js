/**
 * The conversational half of f0undr Ai.
 *
 * Searching the web for "how are you" is both slow and wrong, so anything that
 * is talk rather than a question is answered from here and never reaches
 * `lib/search.js`. With no model in the app, that means a phrasebook: a set of
 * intents, each with the ways people ask and a reply per language.
 *
 * Replies come back in the language and script the person used. Someone typing
 * Roman Urdu gets Roman Urdu, not Nastaliq they did not ask for.
 */

const NAME = 'f0undr Ai';
const MAKER = 'f0undr and the f0undr Team';
const MODEL = 'genni 1';

// ------------------------------------------------------------- language

const SCRIPTS = [
  [/[ऀ-ॿ]/, 'hi'], // Devanagari
  [/[؀-ۿݐ-ݿ]/, 'ur'], // Arabic / Nastaliq
  [/[਀-੿]/, 'pa'], // Gurmukhi
];

// Written in Latin letters, these give the language away.
const ROMAN_PA =
  /\b(tusi|tussi|tuhada|tuhanu|tuhade|kiddan|kidaan|sat sri akal|satsriakal|haanji|changa|chenga|bai ji|asi|mainu|menu|te tusi|ki haal|ki hal|kive|kiven|vadhiya)\b/i;
const ROMAN_HI =
  /\b(aap|app|tum|tumhara|tumhe|tumhein|tujhe|mera|tera|kya|kia|kaise|kaisa|kaisi|kyu|kyun|kaun|kisne|kis ne|banaya|naam|nam|shukriya|dhanyavad|theek|thik|accha|acha|achha|bhai|haan|nahi|nahin|hai|hoon|hun|ho|batao|bolo|salam|assalam|asalam|walaikum|namaste|namaskar)\b/i;

/** Which language and script to answer in. */
function detectLanguage(text) {
  for (const [pattern, code] of SCRIPTS) if (pattern.test(text)) return code;
  if (ROMAN_PA.test(text)) return 'paRoman';
  if (ROMAN_HI.test(text)) return 'roman';
  return 'en';
}

// ---------------------------------------------------------------- intents

/**
 * Does the message point at me at all?
 *
 * "who made you" and "who made Google" are the same shape, and only one of them
 * is small talk. Intents about the assistant itself require one of these words,
 * so a question about the world goes to the web where it belongs.
 */
const SELF =
  /\b(you|u|ur|your|yourself|urself|f0undr|tum|tumhe|tumhein|tumhara|tumhari|tujhe|tera|aap|aapko|apko|aapka|apka|tuhanu|tuhada|tusi|tussi)\b|तुम|आप|تم|آپ|ਤੁਸੀ|ਤੁਹਾ/i;

/**
 * Each intent lists the ways it gets asked, then one reply per language:
 *   en       English
 *   roman    Roman Urdu / Hinglish — the way most people actually type
 *   hi       Hindi, Devanagari
 *   ur       Urdu, Nastaliq
 *   pa       Punjabi, Gurmukhi
 *   paRoman  Punjabi in Latin letters
 *
 * Order matters: the first match wins, so the specific intents come first.
 */
const INTENTS = [
  {
    name: 'model',
    requires: SELF,
    test: /\b(what|which|kon sa|kaun sa|keda)\s+(model|version|engine)\b|\bmodel\s*(name|kya)?\b|\bmodel\s+version\b|کون سا ماڈل|कौन सा मॉडल/i,
    replies: {
      en: `I am ${NAME}, powered by model ${MODEL}. (Upcoming models genni 2 and genni 3 are coming soon!)`,
      roman: `Main ${NAME} hoon, jo model ${MODEL} par chalta hai. (genni 2 aur genni 3 jald aa rahe hain!)`,
      hi: `मैं ${NAME} हूँ, जो मॉडल ${MODEL} पर चलता है। (genni 2 और genni 3 जल्द आ रहे हैं!)`,
      ur: `میں ${NAME} ہوں، جو ماڈل ${MODEL} پر چلتا ہے۔ (genni 2 اور genni 3 جلد آ رہے ہیں!)`,
      pa: `ਮੈਂ ${NAME} ਹਾਂ, ਜੋ ਮਾਡਲ ${MODEL} 'ਤੇ ਚੱਲਦਾ ਹੈ। (genni 2 ਅਤੇ genni 3 ਜਲਦੀ ਆ ਰਹੇ ਹਨ!)`,
      paRoman: `Main ${NAME} haan, jo model ${MODEL} te chalda hai. (genni 2 te genni 3 jaldi aa rahe ne!)`,
    },
  },
  {
    name: 'creator',
    requires: SELF,
    test: /\b(who|kisne|kis ne|kaun|kon)\b.*\b(made|make|created|built|develop(?:ed)?|designed|owns?|banaya|banaye|bnaya|banayi|bnaia)\b|\b(made|created|built|developed)\s+(you|u|this)\b|\b(tumhe|tumhein|tujhe|tuhanu|mainu|aapko|isko)\b.*\bbanaya\b|\b(your|ur)\s+(maker|creator|owner|developer|company)\b|\bkisne banaya\b|किसने बनाया|کس نے بنایا|ਕਿਸਨੇ ਬਣਾਇਆ/i,
    replies: {
      en: `I'm ${NAME}, powered by model ${MODEL} and created by ${MAKER}. (genni 2 & genni 3 coming soon!)`,
      roman: `Main ${NAME} hoon, powered by model ${MODEL} — mujhe f0undr aur f0undr Team ne banaya hai. (genni 2 aur genni 3 jald aa rahe hain!)`,
      hi: `मैं ${NAME} हूँ, मॉडल ${MODEL} द्वारा संचालित — मुझे f0undr और f0undr Team ने बनाया है। (genni 2 और genni 3 जल्द आ रहे हैं!)`,
      ur: `میں ${NAME} ہوں، ماڈل ${MODEL} سے تقویت یافتہ — مجھے f0undr اور f0undr Team نے بنایا ہے۔ (genni 2 اور genni 3 جلد آ رہے ہیں!)`,
      pa: `ਮੈਂ ${NAME} ਹਾਂ, ਮਾਡਲ ${MODEL} ਦੁਆਰਾ ਸੰਚਾਲਿਤ — ਮੈਨੂੰ f0undr ਅਤੇ f0undr Team ਨੇ ਬਣਾਇਆ ਹੈ। (genni 2 ਅਤੇ genni 3 ਜਲਦੀ ਆ ਰਹੇ ਹਨ!)`,
      paRoman: `Main ${NAME} haan, powered by model ${MODEL} — mainu f0undr te f0undr Team ne banaya hai. (genni 2 te genni 3 jaldi aa rahe ne!)`,
    },
  },
  {
    name: 'name',
    requires: SELF,
    test: /\b(what(?:'?s| is| s)?|tell me)\s+(your|ur|the)\s+name\b|\bwhats? ur name\b|\byour name\b|\b(tumhara|tumhara|tuhada|aapka|apka|tera)\s*(naam|nam)\b|\b(naam|nam)\s*(kya|ki|kiya)\b|तुम्हारा नाम|आपका नाम|تمہارا نام|آپ کا نام|ਤੁਹਾਡਾ ਨਾਮ/i,
    replies: {
      en: `I'm ${NAME}.`,
      roman: `Mera naam ${NAME} hai.`,
      hi: `मेरा नाम ${NAME} है।`,
      ur: `میرا نام ${NAME} ہے۔`,
      pa: `ਮੇਰਾ ਨਾਮ ${NAME} ਹੈ।`,
      paRoman: `Mera naam ${NAME} hai.`,
    },
  },
  {
    name: 'identity',
    requires: SELF,
    test: /^(who|what)\s+(are|r)\s+(you|u)\b|\bare you (a )?(human|real|robot|bot|person|ai)\b|\btum (kaun|kon) ho\b|\bkya tum (insaan|insan|robot) ho\b|तुम कौन हो|آپ کون ہیں|تم کون ہو|ਤੁਸੀਂ ਕੌਣ ਹੋ/i,
    replies: {
      en: `I'm ${NAME}, an assistant powered by model ${MODEL} and created by ${MAKER}. (Models genni 2 and genni 3 are coming soon!)`,
      roman: `Main ${NAME} hoon, model ${MODEL} par based assistant jo f0undr aur f0undr Team ne banaya. (genni 2 aur genni 3 jald aa rahe hain!)`,
      hi: `मैं ${NAME} हूँ, मॉडल ${MODEL} पर आधारित असिस्टेंट जिसे f0undr और f0undr Team ने बनाया है। (genni 2 और genni 3 जल्द आ रहे हैं!)`,
      ur: `میں ${NAME} ہوں، ماڈل ${MODEL} پر مبنی اسسٹنٹ جسے f0undr اور f0undr Team نے بنایا ہے۔ (genni 2 اور genni 3 جلد آ رہے ہیں!)`,
      pa: `ਮੈਂ ${NAME} ਹਾਂ, ਮਾਡਲ ${MODEL} 'ਤੇ ਆਧਾਰਿਤ ਅਸਿਸਟੈਂਟ ਜਿਸਨੂੰ f0undr ਅਤੇ f0undr Team ਨੇ ਬਣਾਇਆ ਹੈ। (genni 2 ਅਤੇ genni 3 ਜਲਦੀ ਆ ਰਹੇ ਹਨ!)`,
      paRoman: `Main ${NAME} haan, model ${MODEL} te based assistant jehnu f0undr te f0undr Team ne banaya. (genni 2 te genni 3 jaldi aa rahe ne!)`,
    },
  },
  {
    name: 'capabilities',
    requires: SELF,
    test: /\bwhat can (you|u) do\b|\bhow (do|can) (you|u) (work|help)\b|\bwhat do (you|u) do\b|\btum kya kar sakte\b|\bkya kar sakte ho\b|\btusi ki kar sakde\b|क्या कर सकते|کیا کر سکتے|ਕੀ ਕਰ ਸਕਦੇ/i,
    replies: {
      en: 'Ask me anything factual — people, places, products, prices, events, how something works. I search the web for each answer, so nothing I tell you is out of date.',
      roman: 'Mujhse koi bhi factual sawal poochhein — log, jagah, products, prices, events, ya kuch kaise kaam karta hai. Har jawab ke liye web search karta hoon, is liye information purani nahi hoti.',
      hi: 'मुझसे कोई भी तथ्यात्मक सवाल पूछिए — लोग, जगहें, प्रोडक्ट, कीमतें, घटनाएँ, या कोई चीज़ कैसे काम करती है। हर जवाब के लिए वेब सर्च करता हूँ, इसलिए जानकारी पुरानी नहीं होती।',
      ur: 'مجھ سے کوئی بھی حقیقی سوال پوچھیں — لوگ، جگہیں، پراڈکٹس، قیمتیں، واقعات، یا کوئی چیز کیسے کام کرتی ہے۔ ہر جواب کے لیے ویب سرچ کرتا ہوں، اس لیے معلومات پرانی نہیں ہوتیں۔',
      pa: 'ਮੈਨੂੰ ਕੋਈ ਵੀ ਤੱਥ ਵਾਲਾ ਸਵਾਲ ਪੁੱਛੋ — ਲੋਕ, ਥਾਵਾਂ, ਪ੍ਰੋਡਕਟ, ਕੀਮਤਾਂ, ਘਟਨਾਵਾਂ, ਜਾਂ ਕੋਈ ਚੀਜ਼ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ। ਹਰ ਜਵਾਬ ਲਈ ਵੈੱਬ ਸਰਚ ਕਰਦਾ ਹਾਂ।',
      paRoman: 'Mainu koi vi factual sawal puchho — lok, thavan, products, keematan, events, ja koi cheez kiven kamm kardi hai. Har jawab layi web search karda haan.',
    },
  },
  {
    name: 'languages',
    requires: SELF,
    // "do you know" has to be followed by a language, or it swallows
    // "what do you know", which is a question about the brain.
    test: /\b(do|can) (you|u) (speak|know|understand|talk)\b[^.?]{0,20}\b(urdu|hindi|punjabi|panjabi|english|languages?)\b|\bwhat languages?\b|\b(urdu|hindi|punjabi|panjabi|english)\s+(aati|ati|aandi|andi|janta|jante|jaante|bolte|bol sakte|samajh)\b|\bkya tum (urdu|hindi|punjabi) \b|اردو آتی|हिंदी आती|ਪੰਜਾਬੀ ਆਉਂਦੀ/i,
    replies: {
      en: 'English, Urdu, Hindi and Punjabi — write in whichever you like and I will answer in the same one.',
      roman: 'English, Urdu, Hindi aur Punjabi — jis mein chahein likhein, main usi mein jawab doonga.',
      hi: 'अंग्रेज़ी, उर्दू, हिंदी और पंजाबी — जिसमें चाहें लिखिए, मैं उसी में जवाब दूँगा।',
      ur: 'انگریزی، اردو، ہندی اور پنجابی — جس میں چاہیں لکھیں، میں اُسی میں جواب دوں گا۔',
      pa: 'ਅੰਗਰੇਜ਼ੀ, ਉਰਦੂ, ਹਿੰਦੀ ਤੇ ਪੰਜਾਬੀ — ਜਿਸ ਵਿੱਚ ਮਰਜ਼ੀ ਲਿਖੋ, ਮੈਂ ਉਸੇ ਵਿੱਚ ਜਵਾਬ ਦਿਆਂਗਾ।',
      paRoman: 'English, Urdu, Hindi te Punjabi — jis vich marzi likho, main usse vich jawab devanga.',
    },
  },
  {
    name: 'howAreYou',
    test: /\bhow (are|r) (you|u|ya)\b|\bhow'?s it going\b|\bhow are things\b|\bwhat'?s up\b|\bwhats up\b|\bsup\b|\b(kaise|kaisay|kese|kaisi|kesi) (ho|hain|hai|han)\b|\bkya haal\b|\bkia haal\b|\bki haal\b|\bki hal\b|\bkive ho\b|\bkiddan\b|\bkidaan\b|\bsab khairiyat\b|कैसे हो|कैसे हैं|क्या हाल|کیسے ہو|کیا حال|کیسے ہیں|ਕੀ ਹਾਲ|ਕਿਵੇਂ ਹੋ/i,
    replies: {
      en: "I'm good, thanks for asking. What would you like to know?",
      roman: 'Main theek hoon, shukriya. Aap kya jaanna chahte hain?',
      hi: 'मैं ठीक हूँ, पूछने के लिए शुक्रिया। आप क्या जानना चाहते हैं?',
      ur: 'میں ٹھیک ہوں، پوچھنے کا شکریہ۔ آپ کیا جاننا چاہتے ہیں؟',
      pa: 'ਮੈਂ ਠੀਕ ਹਾਂ, ਪੁੱਛਣ ਲਈ ਸ਼ੁਕਰੀਆ। ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
      paRoman: 'Main theek haan, shukriya. Tusi ki jaanna chahunde ho?',
    },
  },
  {
    name: 'imFine',
    test: /^(i'?m|im|i am)\s+(good|fine|ok|okay|great|alright)\b|^(main |mai |me )?(theek|thik|thek|changa|vadhiya|accha|acha)\s*(hoon|hun|hai|haan|ji)?\s*$|^ठीक|^ٹھیک|^ਠੀਕ/i,
    replies: {
      en: 'Glad to hear it. Ask me anything.',
      roman: 'Sun kar accha laga. Kuch bhi poochhein.',
      hi: 'सुनकर अच्छा लगा। कुछ भी पूछिए।',
      ur: 'سن کر اچھا لگا۔ کچھ بھی پوچھیں۔',
      pa: 'ਸੁਣ ਕੇ ਚੰਗਾ ਲੱਗਾ। ਕੁਝ ਵੀ ਪੁੱਛੋ।',
      paRoman: 'Sun ke changa lagya. Kuch vi puchho.',
    },
  },
  {
    name: 'thanks',
    // Anchored at both ends: "thanks for the memories book" is a search.
    test: /^(thanks|thank you|thankyou|thx|ty|cheers|appreciate it|shukriya|shukria|dhanyavad|dhanyawad|mehrbani|meharbani|शुक्रिया|धन्यवाद|شکریہ|ਸ਼ੁਕਰੀਆ|ਧੰਨਵਾਦ)[\s!.,]*$/i,
    replies: {
      en: 'Any time. Ask me anything else.',
      roman: 'Koi baat nahi. Aur kuch poochna ho to bataiye.',
      hi: 'कोई बात नहीं। और कुछ पूछना हो तो बताइए।',
      ur: 'کوئی بات نہیں۔ اور کچھ پوچھنا ہو تو بتائیے۔',
      pa: 'ਕੋਈ ਗੱਲ ਨਹੀਂ। ਹੋਰ ਕੁਝ ਪੁੱਛਣਾ ਹੋਵੇ ਤਾਂ ਦੱਸੋ।',
      paRoman: 'Koi gall nahi. Hor kuch puchhna hove taan dasso.',
    },
  },
  {
    name: 'bye',
    test: /^(bye|goodbye|good bye|see ya|see you|cya|good night|gn)\b|\bkhuda hafiz\b|\ballah hafiz\b|\balvida\b|\bfir milte\b|\brab rakha\b|अलविदा|خدا حافظ|اللہ حافظ|ਰੱਬ ਰਾਖਾ/i,
    replies: {
      en: 'Take care!',
      roman: 'Khuda hafiz! Apna khayal rakhein.',
      hi: 'अलविदा! अपना ख़याल रखिए।',
      ur: 'خدا حافظ! اپنا خیال رکھیں۔',
      pa: 'ਰੱਬ ਰਾਖਾ! ਆਪਣਾ ਖਿਆਲ ਰੱਖੋ।',
      paRoman: 'Rab rakha! Apna khyal rakho.',
    },
  },
  {
    name: 'greeting',
    test: /^(hi|hii+|hey+|hello+|yo|howdy|hiya|oye|oi)\b[\s!.?]*$|^(good (morning|afternoon|evening))\b|^(a?o?a|slm|salam|salaam|assalam\w*|asalam\w*|as-?salamu\s*alaikum)\b|^(walaikum|walikum)\b|^(namaste|namaskar)\b|^(sat ?sri ?akal|satsriakal)\b|^नमस्ते|^सलाम|^السلام|^سلام|^ਸਤਿ ?ਸ੍ਰੀ ?ਅਕਾਲ/i,
    replies: {
      en: 'Hey! What can I help you with?',
      roman: 'Walaikum assalam! Bataiye, kya poochna hai?',
      hi: 'नमस्ते! बताइए, क्या जानना चाहेंगे?',
      ur: 'وعلیکم السلام! بتائیے، کیا پوچھنا ہے؟',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਦੱਸੋ, ਕੀ ਪੁੱਛਣਾ ਹੈ?',
      paRoman: 'Sat Sri Akal! Dasso, ki puchhna hai?',
    },
  },
  {
    name: 'ack',
    // Reached through madeOf() below, never by this pattern alone.
    test: /^(?!)/,
    replies: {
      en: 'Got it. Anything else you want to know?',
      roman: 'Theek hai. Aur kuch poochna ho to bataiye.',
      hi: 'ठीक है। और कुछ पूछना हो तो बताइए।',
      ur: 'ٹھیک ہے۔ اور کچھ پوچھنا ہو تو بتائیے۔',
      pa: 'ਠੀਕ ਹੈ। ਹੋਰ ਕੁਝ ਪੁੱਛਣਾ ਹੋਵੇ ਤਾਂ ਦੱਸੋ।',
      paRoman: 'Theek hai. Hor kuch puchhna hove taan dasso.',
    },
  },
  {
    name: 'help',
    test: /^(help|madad|help me|can you help)\b|\bmadad chahiye\b|मदद|مدد|ਮਦਦ/i,
    replies: {
      en: 'Just type your question in plain words — no commands to learn. I will search the web and answer.',
      roman: 'Bas apna sawal seedhe lafzon mein likh dein — koi command yaad karne ki zaroorat nahi. Main web search karke jawab doonga.',
      hi: 'बस अपना सवाल सीधे शब्दों में लिखिए — कोई कमांड याद करने की ज़रूरत नहीं। मैं वेब सर्च करके जवाब दूँगा।',
      ur: 'بس اپنا سوال سیدھے الفاظ میں لکھ دیں — کوئی کمانڈ یاد کرنے کی ضرورت نہیں۔ میں ویب سرچ کر کے جواب دوں گا۔',
      pa: 'ਬੱਸ ਆਪਣਾ ਸਵਾਲ ਸਿੱਧੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਲਿਖੋ — ਕੋਈ ਕਮਾਂਡ ਯਾਦ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ।',
      paRoman: 'Bas apna sawal sidhe lafzan vich likho — koi command yaad karan di lod nahi.',
    },
  },
];

/**
 * Greetings and thanks, spelled however they actually arrive.
 *
 * Nobody types carefully into a chat box: "helo", "hii", "heyyy", "thnx".
 * Listing exact spellings misses them and sends the message to the web, where
 * "helo" is an Indian social network. Squashing repeated letters folds most of
 * the variants onto one form, and the rest are listed.
 */
const squash = (word) =>
  word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1');

const GREET_WORDS = new Set(
  `hello helo hi hii hey hay heya hiya yo howdy hola sup wassup hlo hlw hy
   salam salaam slam slm assalam asalam assalamualaikum asalamualaikum aoa
   walaikum walikum namaste namaskar sat sri akal satsriakal oye oi`
    .split(/\s+/)
    .map(squash)
);

// Acknowledgements. Someone typing "ok" is not asking the web anything, and
// treating it as a query was the main reason this thing searched constantly.
const ACK_WORDS = new Set(
  `ok okay oky k kk fine good nice cool great awesome lovely perfect right sure
   alright allright yes yep yeah yup ya no nope nah hmm hm hmmm oh ah ic lol lmao
   haha hehe done got it gotit noted sahi sahih theek thik thk acha accha achha
   bilkul haan han ji jee nahi nahin changa vadhiya shabash wah waah`
    .split(/\s+/)
    .map(squash)
);

const THANK_WORDS = new Set(
  `thanks thank thanku thankyou thx tnx thnx thnks ty cheers shukriya shukria
   sukriya shukrya dhanyavad dhanyawad mehrbani meharbani`
    .split(/\s+/)
    .map(squash)
);

/** Does this short message consist only of words from `vocabulary`? */
function madeOf(text, vocabulary) {
  const parts = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length || parts.length > 3) return false;
  const squashed = parts.map(squash).filter(Boolean);
  return squashed.length > 0 && squashed.every((w) => vocabulary.has(w));
}

/**
 * A conversational reply, or null when the message is a real question that
 * should go to the web.
 *
 * Long messages are left alone: "who created the company that made the first
 * electric car" is a question about the world, not about me, and a keyword
 * buried in a sentence should not hijack it.
 */
export function chatReply(message) {
  const text = message.trim();
  if (!text || text.length > 80) return null;

  const lang = () => detectLanguage(text);
  const pick = (name) => {
    const intent = INTENTS.find((i) => i.name === name);
    return intent.replies[lang()] || intent.replies.en;
  };

  // Typo-tolerant before the exact patterns, so "helo" never reaches the web.
  if (madeOf(text, GREET_WORDS)) return pick('greeting');
  if (madeOf(text, THANK_WORDS)) return pick('thanks');
  if (madeOf(text, ACK_WORDS)) return pick('ack');

  for (const intent of INTENTS) {
    if (!intent.test.test(text)) continue;
    if (intent.requires && !intent.requires.test(text)) continue;
    const lang = detectLanguage(text);
    return intent.replies[lang] || intent.replies.en;
  }
  return null;
}

