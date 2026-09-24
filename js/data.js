/* CallShield content: icons, the demo scam scenario, warning copy, tactics and seed call history.
   Everything here is fictional sample data for the prototype. */

window.CS_ICONS = {
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/>',
  shieldCheck: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  shieldOff: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/><path d="M4 4l16 16"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  sliders: '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><circle cx="18" cy="18" r="2"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  volume: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17h.01"/>'
};

window.CS_DATA = {
  // The demo call: a cloned "Ammu" voice from an unknown number asks for a bKash code.
  scenario: {
    number: '+880 17•• ••• 482',
    contact: 'Ammu',
    lines: [
      { bn: 'হ্যালো বাবা, আমি আম্মু বলছি। এটা আমার নতুন নাম্বার।', en: "Hello dear, it's Mom. This is my new number." },
      { bn: 'আমি একটা বিপদে পড়েছি, এখনই টাকা লাগবে।', en: "I'm in trouble, I need money right now." },
      { bn: 'কাউকে বলো না, তোমার আব্বুকেও না।', en: "Don't tell anyone, not even your father." },
      { bn: 'তোমার বিকাশে একটা কোড যাবে, ওটা আমাকে বলো।', en: 'A code will come to your bKash. Tell it to me.' },
      { bn: 'হ্যালো? শুনছ? তাড়াতাড়ি করো, সময় নেই।', en: "Hello? Are you listening? Hurry, there's no time." },
      { bn: 'কোড এসেছে? নাম্বারগুলো পড়ে শোনাও!', en: 'Did the code come? Read me the numbers!' }
    ],
    // Signs detected at each step of the conversation. `voice` signs depend on the voice-clone setting,
    // `otp` signs on the code-arrival alarm setting.
    flagsByStep: [
      [{ bn: 'অচেনা নাম্বার, কিন্তু পরিবারের সদস্য দাবি', en: 'Unknown number claims to be family', level: 'medium' }],
      [{ bn: 'তাড়াহুড়া: এখনই টাকা চাইছে', en: 'Urgency: wants money right now', level: 'high' },
       { bn: 'কণ্ঠস্বর কৃত্রিম মনে হচ্ছে', en: 'Voice sounds machine-made (possible AI clone)', level: 'high', voice: true }],
      [{ bn: 'গোপন রাখতে বলছে', en: 'Secrecy: asks you not to tell anyone', level: 'high' }],
      [{ bn: 'বিকাশের কোড (OTP) চাইছে', en: 'Asks for your bKash code (OTP)', level: 'critical' }],
      [],
      [{ bn: 'কলের মধ্যেই বিকাশ কোড এসেছে', en: 'A bKash code arrived during this call', level: 'critical', otp: true }]
    ],
    riskByStep: [22, 55, 74, 93, 96, 99],
    riskByStepNoVoice: [22, 48, 68, 91, 94, 98],

    // Scam calls follow a script. Knowing the current stage lets CallShield warn about the next one.
    stages: [
      { bn: 'পরিচয় দাবি', en: 'Hook' },
      { bn: 'বিপদের গল্প', en: 'Crisis' },
      { bn: 'গোপন রাখা', en: 'Secrecy' },
      { bn: 'কোড নেওয়া', en: 'Take' }
    ],
    predictions: [
      { bn: 'এরপর সম্ভবত বলবে বিপদে পড়েছে, এখনই সাহায্য লাগবে।', en: "Next they'll probably say they're in trouble and need help fast." },
      { bn: 'এরপর সম্ভবত গোপন রাখতে বলবে, তারপর টাকা বা কোড চাইবে।', en: "Next they'll likely ask you to keep it secret, then ask for money or a code." },
      { bn: 'এরপর আপনার বিকাশে আসা কোড চাইবে। কোড কখনো বলবেন না।', en: "Next they'll ask for the code sent to your bKash. Never read it out." },
      { bn: 'কোড না পেলে আরও চাপ দেবে, রাগ বা কান্না করতে পারে। কল কেটে দিন।', en: "If you don't give it, they'll push harder or get upset. Hang up." }
    ],

    // What the scammer says when the user asks a check question from the challenge coach.
    dodgeLine: { bn: 'এত প্রশ্ন করার সময় নেই! তাড়াতাড়ি কোডটা বলো!', en: 'No time for questions! Just tell me the code, quickly!' },
    dodgeFlag: { bn: 'যাচাইয়ের প্রশ্ন এড়িয়ে গেছে', en: 'Avoided your check question', level: 'critical' }
  },

  otpAlert: {
    sms: {
      en: 'Your bKash verification code is ••••••. It is valid for 2 minutes. Never share this code with anyone.',
      bn: 'আপনার বিকাশ ভেরিফিকেশন কোড ••••••। এটি ২ মিনিট কার্যকর। এই কোড কাউকে দেবেন না।'
    },
    sender: { en: 'bKash', bn: 'বিকাশ' },
    title: { en: 'Stop! This is the code the caller wants', bn: 'থামুন! কলার ঠিক এই কোডটাই চাইছে' },
    detail: {
      en: 'A bKash code arrived while you are on a suspicious call. Anyone who asks for it is trying to take your money.',
      bn: 'সন্দেহজনক কলের মধ্যেই একটি বিকাশ কোড এসেছে। যে এটা চাইছে, সে আপনার টাকা নিতে চাইছে।'
    },
    spoken: { bn: 'থামুন। এই কোড কাউকে বলবেন না।', en: "Stop. Don't share this code with anyone." }
  },

  coach: {
    title: { bn: 'কলারকে যাচাই করুন', en: "Check who's really calling" },
    intro: {
      en: 'Ask something only the real Ammu would know. A scammer will dodge the question, rush you or get angry.',
      bn: 'এমন কিছু জিজ্ঞেস করুন যা শুধু আসল আম্মু জানেন। প্রতারক প্রশ্ন এড়িয়ে যাবে, তাড়া দেবে বা রেগে যাবে।'
    },
    questions: [
      { id: 'safe', safeWord: true, bn: 'আমাদের পারিবারিক গোপন শব্দটা কী?', en: "What's our family safe word?",
        tip: { en: 'Your family has a safe word set. This is the strongest check.', bn: 'আপনার পরিবারের গোপন শব্দ ঠিক করা আছে। এটাই সবচেয়ে শক্ত যাচাই।' } },
      { id: 'eid', bn: 'গত ঈদে বাসায় কী রান্না হয়েছিল?', en: 'What did we cook at home last Eid?' },
      { id: 'nick', bn: 'ছোটবেলায় আমাকে কী নামে ডাকতে?', en: 'What did you call me when I was little?' },
      { id: 'callback', bn: 'আমি তোমার পুরনো নাম্বারে ফোন দিচ্ছি।', en: "I'll call you back on your old number.",
        tip: { en: 'The real Ammu will say OK. A scammer will try to stop you.', bn: 'আসল আম্মু রাজি হবেন। প্রতারক আপনাকে থামাতে চাইবে।' } }
    ]
  },

  warning: {
    bn: {
      back: 'কলে ফিরুন', level: 'খুব বেশি ঝুঁকি',
      headline: 'সাবধান! এই কলটি প্রতারণা হতে পারে',
      sub: 'কলার নিজেকে আপনার আম্মু বলছে, কিন্তু কয়েকটি লক্ষণ মিলছে না।',
      listen: 'জোরে শুনুন', why: 'কেন আমরা এটা বলছি', todo: 'এখন কী করবেন',
      hangup: 'এখনই কল কেটে দিন', verify: 'আম্মুর সেভ করা নাম্বারে ফোন করে যাচাই করুন',
      coach: 'কলারকে কী জিজ্ঞেস করবেন',
      safeWord: 'পারিবারিক গোপন শব্দটি জিজ্ঞেস করুন',
      trust: 'আমি নিশ্চিত, কল চালিয়ে যাব',
      sheetTitle: 'চালিয়ে যাওয়ার আগে',
      sheetBody: 'যেই হোক, পিন বা ওটিপি কখনো বলবেন না। সন্দেহ হলে কল কেটে নিজে ফোন করুন।',
      sheetBack: 'ঠিক আছে, ফিরে যাই', sheetContinue: 'তবুও কল চালিয়ে যান',
      banner: 'সাবধান! কোড কাউকে বলবেন না',
      spoken: 'সাবধান। এই কলটি প্রতারণা হতে পারে। কোড কাউকে বলবেন না।'
    },
    en: {
      back: 'Back to call', level: 'VERY HIGH RISK',
      headline: 'Careful! This call is likely a scam',
      sub: "The caller says they are your mother, but several signs don't add up.",
      listen: 'Read aloud', why: 'Why we think so', todo: 'What to do now',
      hangup: 'Hang up now', verify: "Call Mom's saved number to check",
      coach: 'What to ask the caller',
      safeWord: 'Ask for your family safe word',
      trust: "I'm sure, continue the call",
      sheetTitle: 'Before you continue',
      sheetBody: 'Whoever it is, never share a PIN or OTP. If in doubt, hang up and call them yourself.',
      sheetBack: 'OK, go back', sheetContinue: 'Continue the call anyway',
      banner: "Careful! Don't share the code",
      spoken: "Careful. This call may be a scam. Don't share any code."
    },
    reasons: [
      { otp: true,
        bn: { title: 'কলের মধ্যেই আপনার বিকাশ কোড এসেছে', detail: 'কলার ঠিক এই কোডটাই চাইছে। এটা বললে আপনার টাকা চলে যাবে।', quote: '“কোড এসেছে? নাম্বারগুলো পড়ে শোনাও!”' },
        en: { title: 'A bKash code arrived during the call', detail: 'This is exactly the code the caller wants. Sharing it lets them take your money.', quote: '“Did the code come? Read me the numbers!”' } },
      { voice: false,
        bn: { title: 'আপনার বিকাশ কোড (OTP) চেয়েছে', detail: 'আসল পরিবারের সদস্য বা বিকাশ কখনো আপনার কোড চায় না।', quote: '“তোমার বিকাশে একটা কোড যাবে, ওটা আমাকে বলো।”' },
        en: { title: 'Asked for your bKash code (OTP)', detail: 'No real family member, and never bKash, needs your code.', quote: '“A code will come to your bKash. Tell it to me.”' } },
      { voice: false,
        bn: { title: 'এখনই টাকা চাইছে', detail: 'তাড়া দিয়ে ভাবার সময় না দেওয়া প্রতারকের পুরনো কৌশল।', quote: '“আমি একটা বিপদে পড়েছি, এখনই টাকা লাগবে।”' },
        en: { title: 'Wants money right now', detail: 'Rushing you so you have no time to think is a classic scam trick.', quote: "“I'm in trouble, I need money right now.”" } },
      { voice: false,
        bn: { title: 'কাউকে জানাতে নিষেধ করছে', detail: 'গোপন রাখতে বলে যাতে আপনি কারো কাছে যাচাই না করেন।', quote: '“কাউকে বলো না, তোমার আব্বুকেও না।”' },
        en: { title: 'Told you to keep it secret', detail: 'Secrecy stops you from checking with anyone else.', quote: "“Don't tell anyone, not even your father.”" } },
      { voice: true,
        bn: { title: 'কণ্ঠস্বর নকল হতে পারে', detail: 'অস্বাভাবিক বিরতি আর একঘেয়ে সুর। AI দিয়ে নকল করা কণ্ঠে এমন শোনায়। নাম্বারটিও অচেনা।', quote: '“এটা আমার নতুন নাম্বার।”' },
        en: { title: 'The voice may be fake', detail: 'Unnatural pauses and a flat tone are common in AI-cloned voices. The number is also unknown.', quote: '“This is my new number.”' } }
    ]
  },

  // Each tactic: name, what it is, an example line (what scammers actually say) and what to do.
  tactics: [
    { en: 'Urgency', bn: 'তাড়াহুড়া',
      what: { en: 'Pushes you to act now so you have no time to think or check.', bn: 'এখনই কিছু করতে চাপ দেয়, যাতে ভাবার বা যাচাই করার সময় না পান।' },
      example: { bn: '“এখনই না পাঠালে বড় বিপদ হবে!”', en: '“If you don\'t send it now, something terrible will happen!”' },
      todo: { en: 'Pause. Say you will call back. A real emergency can wait five minutes.', bn: 'থামুন। বলুন পরে ফোন দেবেন। সত্যিকারের বিপদ পাঁচ মিনিট অপেক্ষা করতে পারে।' } },
    { en: 'Secrecy', bn: 'গোপনীয়তা',
      what: { en: 'Tells you not to tell anyone, so nobody can warn you.', bn: 'কাউকে জানাতে নিষেধ করে, যাতে কেউ আপনাকে সাবধান করতে না পারে।' },
      example: { bn: '“কাউকে বলো না, এটা আমাদের মধ্যে থাক।”', en: '“Don\'t tell anyone, keep this between us.”' },
      todo: { en: 'Tell someone you trust right away.', bn: 'এখনই বিশ্বাসযোগ্য কাউকে জানান।' } },
    { en: 'False authority', bn: 'ভুয়া কর্তৃপক্ষ',
      what: { en: 'Pretends to be from bKash, Nagad, a bank or the police.', bn: 'বিকাশ, নগদ, ব্যাংক বা পুলিশ থেকে বলছে বলে ভান করে।' },
      example: { bn: '“আমি বিকাশ অফিস থেকে বলছি, আপনার অ্যাকাউন্ট বন্ধ হয়ে যাবে।”', en: '“I\'m calling from the bKash office. Your account will be blocked.”' },
      todo: { en: 'Hang up and call the official helpline yourself.', bn: 'কল কেটে নিজে অফিশিয়াল হেল্পলাইনে ফোন দিন।' } },
    { en: 'Asking for your code or PIN', bn: 'কোড বা পিন চাওয়া',
      what: { en: 'Asks for the OTP or PIN that lets them empty your account.', bn: 'ওটিপি বা পিন চায়, যা দিয়ে আপনার অ্যাকাউন্ট খালি করা যায়।' },
      example: { bn: '“আপনার ফোনে একটা কোড গেছে, একটু বলেন তো।”', en: '“A code was sent to your phone. Just read it to me.”' },
      todo: { en: 'Never share an OTP or PIN. No genuine caller will ask.', bn: 'ওটিপি বা পিন কখনো বলবেন না। আসল কেউ এটা চায় না।' } },
    { en: 'Family emergency with a cloned voice', bn: 'পরিবারের বিপদ (নকল কণ্ঠ)',
      what: { en: 'Uses AI to sound like a family member, often from a new number.', bn: 'AI দিয়ে পরিবারের কারো মতো গলা বানায়, প্রায়ই নতুন নাম্বার থেকে।' },
      example: { bn: '“আমি আম্মু, নতুন নাম্বার থেকে বলছি। টাকা লাগবে।”', en: '“It\'s Mom, calling from a new number. I need money.”' },
      todo: { en: 'Call their saved number, or ask your family safe word.', bn: 'তাদের সেভ করা নাম্বারে ফোন দিন, অথবা পারিবারিক গোপন শব্দ জিজ্ঞেস করুন।' } },
    { en: 'Prize or refund bait', bn: 'পুরস্কার বা ফেরতের লোভ',
      what: { en: 'Says you won money or are owed a refund, but must pay a fee first.', bn: 'বলে আপনি টাকা জিতেছেন বা টাকা ফেরত পাবেন, কিন্তু আগে ফি দিতে হবে।' },
      example: { bn: '“আপনি পুরস্কার জিতেছেন, শুধু ফি-টা পাঠান।”', en: '“You\'ve won a prize, just send the fee.”' },
      todo: { en: 'If you must pay to receive money, it is a scam.', bn: 'টাকা পেতে আগে টাকা দিতে হলে, সেটা প্রতারণা।' } }
  ],

  // `time.day` is a key into CS_STR (today, yesterday, mon, sun).
  seedCalls: [
    { id: 's1', name: '+880 18•• ••• 207', note: { en: 'Claimed to be a bKash officer · asked for PIN', bn: 'বিকাশ অফিসার দাবি করেছে · পিন চেয়েছে' }, time: { day: 'yesterday', hm: '19:03' }, kind: 'scam', blocked: true },
    { id: 's2', name: { en: 'Abbu', bn: 'আব্বু' }, note: { en: 'Saved contact · no warning signs', bn: 'সেভ করা কন্টাক্ট · কোনো সতর্ক লক্ষণ নেই' }, time: { day: 'yesterday', hm: '17:40' }, kind: 'safe' },
    { id: 's3', name: '+880 13•• ••• 915', note: { en: 'Said you won a prize · asked for a fee', bn: 'পুরস্কার জেতার কথা বলেছে · ফি চেয়েছে' }, time: { day: 'yesterday', hm: '14:20' }, kind: 'warn' },
    { id: 's4', name: { en: 'Rahim (Office)', bn: 'রহিম (অফিস)' }, note: { en: 'Saved contact · no warning signs', bn: 'সেভ করা কন্টাক্ট · কোনো সতর্ক লক্ষণ নেই' }, time: { day: 'mon', hm: '11:02' }, kind: 'safe' },
    { id: 's5', name: { en: 'Nusrat Apu', bn: 'নুসরাত আপু' }, note: { en: 'Saved contact · no warning signs', bn: 'সেভ করা কন্টাক্ট · কোনো সতর্ক লক্ষণ নেই' }, time: { day: 'sun', hm: '20:47' }, kind: 'safe' },
    { id: 's6', name: '+880 19•• ••• 338', note: { en: 'Short call · no warning signs', bn: 'ছোট কল · কোনো সতর্ক লক্ষণ নেই' }, time: { day: 'sun', hm: '12:10' }, kind: 'safe' }
  ],

  trustedContacts: [{ en: 'Ammu', bn: 'আম্মু' }, { en: 'Abbu', bn: 'আব্বু' }, { en: 'Nusrat Apu', bn: 'নুসরাত আপু' }],
  // `v` is what gets saved in the study CSV, so it stays in English whatever the app language.
  helpOptions: [{ v: 'Yes', bn: 'হ্যাঁ' }, { v: 'Not sure', bn: 'নিশ্চিত নই' }, { v: 'No', bn: 'না' }],
  reasonOptions: [
    { v: 'Code request', bn: 'কোড চাওয়া' }, { v: 'Code alarm', bn: 'কোড অ্যালার্ম' },
    { v: 'Prediction', bn: 'আগাম অনুমান' }, { v: 'Dodged question', bn: 'প্রশ্ন এড়ানো' },
    { v: 'Urgency', bn: 'তাড়াহুড়া' }, { v: 'Secrecy', bn: 'গোপন রাখা' }, { v: 'Fake voice', bn: 'নকল কণ্ঠ' }
  ]
};
