/* Demo scam calls. Each one is a scripted call CallShield "listens" to: what the caller says, the signs it
   detects at each step, the scam-script stage and prediction, the warning it shows, and what to do next.
   The bKash-agent and police scripts come from the team's Demo Guide (survey examples); the others follow the
   tactic list in the guide. All numbers and names are fictional. */
(function () {
  // Shown when a bKash code arrives mid-call (only when the code-arrival alarm is on).
  const CODE_ARRIVED = { bn: 'কলের মধ্যেই বিকাশ কোড এসেছে', en: 'A bKash code arrived during this call', level: 'critical', otp: true };

  window.CS_SCENARIOS = [
    // ------------------------------------------------------------------ 1. Cloned voice of a family member
    {
      id: 'family',
      icon: 'user',
      title: { bn: 'নকল কণ্ঠে “আম্মু”', en: 'Cloned voice: “Mom”' },
      blurb: { bn: 'AI কণ্ঠে আম্মু সেজে বিকাশ কোড চায়', en: 'An AI-cloned voice pretends to be your mother and asks for a code' },
      number: '+880 17•• ••• 482',
      voice: true,
      lines: [
        { bn: 'হ্যালো বাবা, আমি আম্মু বলছি। এটা আমার নতুন নাম্বার।', en: "Hello dear, it's Mom. This is my new number." },
        { bn: 'আমি একটা বিপদে পড়েছি, এখনই টাকা লাগবে।', en: "I'm in trouble, I need money right now." },
        { bn: 'কাউকে বলো না, তোমার আব্বুকেও না।', en: "Don't tell anyone, not even your father." },
        { bn: 'তোমার বিকাশে একটা কোড যাবে, ওটা আমাকে বলো।', en: 'A code will come to your bKash. Tell it to me.' },
        { bn: 'হ্যালো? শুনছ? তাড়াতাড়ি করো, সময় নেই।', en: "Hello? Are you listening? Hurry, there's no time." },
        { bn: 'কোড এসেছে? নাম্বারগুলো পড়ে শোনাও!', en: 'Did the code come? Read me the numbers!' }
      ],
      flagsByStep: [
        [{ bn: 'অচেনা নাম্বার, কিন্তু পরিবারের সদস্য দাবি', en: 'Unknown number claims to be family', level: 'medium' }],
        [{ bn: 'তাড়াহুড়া: এখনই টাকা চাইছে', en: 'Urgency: wants money right now', level: 'high' },
         { bn: 'কণ্ঠস্বর কৃত্রিম মনে হচ্ছে', en: 'Voice sounds machine-made (possible AI clone)', level: 'high', voice: true }],
        [{ bn: 'গোপন রাখতে বলছে', en: 'Secrecy: asks you not to tell anyone', level: 'high' }],
        [{ bn: 'বিকাশের কোড (OTP) চাইছে', en: 'Asks for your bKash code (OTP)', level: 'critical' }],
        [],
        [CODE_ARRIVED]
      ],
      riskByStep: [22, 55, 74, 93, 96, 99],
      riskByStepNoVoice: [22, 48, 68, 91, 94, 98],
      stages: [
        { bn: 'পরিচয় দাবি', en: 'Hook' }, { bn: 'বিপদের গল্প', en: 'Crisis' },
        { bn: 'গোপন রাখা', en: 'Secrecy' }, { bn: 'কোড নেওয়া', en: 'Take' }
      ],
      predictions: [
        { bn: 'এরপর সম্ভবত বলবে বিপদে পড়েছে, এখনই সাহায্য লাগবে।', en: "Next they'll probably say they're in trouble and need help fast." },
        { bn: 'এরপর সম্ভবত গোপন রাখতে বলবে, তারপর টাকা বা কোড চাইবে।', en: "Next they'll likely ask you to keep it secret, then ask for money or a code." },
        { bn: 'এরপর আপনার বিকাশে আসা কোড চাইবে। কোড কখনো বলবেন না।', en: "Next they'll ask for the code sent to your bKash. Never read it out." },
        { bn: 'কোড না পেলে আরও চাপ দেবে, রাগ বা কান্না করতে পারে। কল কেটে দিন।', en: "If you don't give it, they'll push harder or get upset. Hang up." }
      ],
      dodgeLine: { bn: 'এত প্রশ্ন করার সময় নেই! তাড়াতাড়ি কোডটা বলো!', en: 'No time for questions! Just tell me the code, quickly!' },
      warning: {
        bn: {
          headline: 'সাবধান! এই কলটি প্রতারণা হতে পারে',
          sub: 'কলার নিজেকে আপনার আম্মু বলছে, কিন্তু কয়েকটি লক্ষণ মিলছে না।',
          banner: 'সাবধান! কোড কাউকে বলবেন না',
          bannerSub: 'খুব বেশি ঝুঁকি। কলার আপনার বিকাশ কোড চেয়েছে।',
          spoken: 'সাবধান। এই কলটি প্রতারণা হতে পারে। কোড কাউকে বলবেন না।',
          verify: 'আম্মুর সেভ করা নাম্বারে ফোন করে যাচাই করুন'
        },
        en: {
          headline: 'Careful! This call is likely a scam',
          sub: "The caller says they are your mother, but several signs don't add up.",
          banner: "Careful! Don't share the code",
          bannerSub: 'Very high scam risk. The caller asked for your bKash code.',
          spoken: "Careful. This call may be a scam. Don't share any code.",
          verify: "Call Mom's saved number to check"
        },
        reasons: [
          { otp: true,
            bn: { title: 'কলের মধ্যেই আপনার বিকাশ কোড এসেছে', detail: 'কলার ঠিক এই কোডটাই চাইছে। এটা বললে আপনার টাকা চলে যাবে।', quote: '“কোড এসেছে? নাম্বারগুলো পড়ে শোনাও!”' },
            en: { title: 'A bKash code arrived during the call', detail: 'This is exactly the code the caller wants. Sharing it lets them take your money.', quote: '“Did the code come? Read me the numbers!”' } },
          { bn: { title: 'আপনার বিকাশ কোড (OTP) চেয়েছে', detail: 'আসল পরিবারের সদস্য বা বিকাশ কখনো আপনার কোড চায় না।', quote: '“তোমার বিকাশে একটা কোড যাবে, ওটা আমাকে বলো।”' },
            en: { title: 'Asked for your bKash code (OTP)', detail: 'No real family member, and never bKash, needs your code.', quote: '“A code will come to your bKash. Tell it to me.”' } },
          { bn: { title: 'এখনই টাকা চাইছে', detail: 'তাড়া দিয়ে ভাবার সময় না দেওয়া প্রতারকের পুরনো কৌশল।', quote: '“আমি একটা বিপদে পড়েছি, এখনই টাকা লাগবে।”' },
            en: { title: 'Wants money right now', detail: 'Rushing you so you have no time to think is a classic scam trick.', quote: "“I'm in trouble, I need money right now.”" } },
          { bn: { title: 'কাউকে জানাতে নিষেধ করছে', detail: 'গোপন রাখতে বলে যাতে আপনি কারো কাছে যাচাই না করেন।', quote: '“কাউকে বলো না, তোমার আব্বুকেও না।”' },
            en: { title: 'Told you to keep it secret', detail: 'Secrecy stops you from checking with anyone else.', quote: "“Don't tell anyone, not even your father.”" } },
          { voice: true,
            bn: { title: 'কণ্ঠস্বর নকল হতে পারে', detail: 'অস্বাভাবিক বিরতি আর একঘেয়ে সুর। AI দিয়ে নকল করা কণ্ঠে এমন শোনায়। নাম্বারটিও অচেনা।', quote: '“এটা আমার নতুন নাম্বার।”' },
            en: { title: 'The voice may be fake', detail: 'Unnatural pauses and a flat tone are common in AI-cloned voices. The number is also unknown.', quote: '“This is my new number.”' } }
        ]
      },
      coach: {
        intro: 'Ask something only the real Ammu would know. A scammer will dodge the question, rush you or get angry.',
        questions: [
          { id: 'safe', safeWord: true, bn: 'আমাদের পারিবারিক গোপন শব্দটা কী?', en: "What's our family safe word?", tip: 'Your family has a safe word set. This is the strongest check.' },
          { id: 'eid', bn: 'গত ঈদে বাসায় কী রান্না হয়েছিল?', en: 'What did we cook at home last Eid?' },
          { id: 'nick', bn: 'ছোটবেলায় আমাকে কী নামে ডাকতে?', en: 'What did you call me when I was little?' },
          { id: 'callback', bn: 'আমি তোমার পুরনো নাম্বারে ফোন দিচ্ছি।', en: "I'll call you back on your old number.", tip: 'The real Ammu will say OK. A scammer will try to stop you.' }
        ]
      },
      after: {
        verifyTitle: 'Now check with Ammu',
        verifyBody: 'Call her on the number saved in your contacts. If she is fine, the call was a scam.',
        verifyBtn: 'Call Ammu (saved number)',
        verifyToast: "Demo only: this would open your dialer with Ammu's saved number.",
        familyNote: 'Tell them a fake “Ammu” voice is calling'
      },
      log: { claim: 'Said “I\'m Ammu”', warned: 'asked for bKash code', alert: 'wanted the bKash code that arrived' }
    },

    // ------------------------------------------------------------------ 2. Fake bKash agent (Demo Guide, scenario 1)
    {
      id: 'agent',
      icon: 'shield',
      title: { bn: 'ভুয়া বিকাশ এজেন্ট', en: 'Fake bKash agent' },
      blurb: { bn: '“অ্যাকাউন্ট বন্ধ হয়ে যাবে” বলে ওটিপি চায়', en: 'Threatens to suspend your account and asks for the OTP' },
      number: '+880 19•• ••• 614',
      lines: [
        { bn: 'আসসালামু আলাইকুম, আমি বিকাশ কাস্টমার কেয়ার থেকে বলছি।', en: 'Hello, I am calling from bKash customer care.' },
        { bn: 'আপনার অ্যাকাউন্টে কিছু সন্দেহজনক লেনদেন পাওয়া গেছে।', en: 'We found some suspicious transactions on your account.' },
        { bn: 'এখনই ভেরিফাই না করলে আজকের মধ্যে অ্যাকাউন্ট বন্ধ হয়ে যাবে।', en: "If you don't verify now, your account will be suspended today." },
        { bn: 'আপনার ফোনে একটা ওটিপি কোড গেছে, ওটা বলুন, আমি ঠিক করে দিচ্ছি।', en: 'An OTP code was sent to your phone. Tell me and I will fix it.' },
        { bn: 'লাইনে থাকুন, সময় খুব কম।', en: 'Please stay on the line, there is very little time.' },
        { bn: 'কোডটা এসেছে? ছয় সংখ্যার কোডটা পড়ুন।', en: 'Has the code arrived? Read me the six digits.' }
      ],
      flagsByStep: [
        [{ bn: 'সাধারণ মোবাইল নাম্বার থেকে বিকাশ দাবি', en: 'Claims to be bKash from an ordinary mobile number', level: 'medium' }],
        [{ bn: 'ভুয়া কর্তৃপক্ষ: বিকাশ কর্মী সেজেছে', en: 'False authority: pretending to be bKash staff', level: 'high' }],
        [{ bn: 'অ্যাকাউন্ট বন্ধের হুমকি', en: 'Threat: account will be suspended', level: 'high' },
         { bn: 'তাড়াহুড়া: “আজকের মধ্যে”', en: 'Urgency: “today”', level: 'high' }],
        [{ bn: 'ওটিপি কোড চাইছে', en: 'Asks for your OTP code', level: 'critical' }],
        [],
        [CODE_ARRIVED]
      ],
      riskByStep: [30, 58, 80, 94, 96, 99],
      stages: [
        { bn: 'বিকাশ দাবি', en: 'Hook' }, { bn: 'সমস্যার গল্প', en: 'Problem' },
        { bn: 'হুমকি', en: 'Threat' }, { bn: 'কোড নেওয়া', en: 'Take' }
      ],
      predictions: [
        { bn: 'এরপর সম্ভবত বলবে আপনার অ্যাকাউন্টে সমস্যা হয়েছে।', en: "Next they'll probably say something is wrong with your account." },
        { bn: 'এরপর সম্ভবত অ্যাকাউন্ট বন্ধের ভয় দেখাবে, যাতে তাড়াহুড়া করেন।', en: "Next they'll likely threaten to block your account so you rush." },
        { bn: 'এরপর ওটিপি বা পিন চাইবে। বিকাশ কখনো ফোনে কোড চায় না।', en: "Next they'll ask for your OTP or PIN. bKash never asks for codes on a call." },
        { bn: 'কোড না পেলে আরও চাপ দেবে। কল কেটে ১৬২৪৭ নাম্বারে নিজে ফোন দিন।', en: "If you don't give it, they'll push harder. Hang up and call 16247 yourself." }
      ],
      dodgeLine: { bn: 'এত কথা বলার সময় নেই, কোডটা না দিলে অ্যাকাউন্ট বন্ধ হয়ে যাবে!', en: 'No time for this. Give the code or your account will be blocked!' },
      warning: {
        bn: {
          headline: 'সাবধান! এটি ভুয়া বিকাশ কর্মীর কল হতে পারে',
          sub: 'কলার নিজেকে বিকাশ কাস্টমার কেয়ার বলছে, কিন্তু আসল বিকাশ কখনো ফোনে কোড চায় না।',
          banner: 'সাবধান! বিকাশ কখনো কোড চায় না',
          bannerSub: 'খুব বেশি ঝুঁকি। কলার আপনার ওটিপি কোড চেয়েছে।',
          spoken: 'সাবধান। বিকাশ কখনো ফোনে কোড চায় না। কোড বলবেন না।',
          verify: 'কল কেটে বিকাশ হেল্পলাইন ১৬২৪৭ নাম্বারে নিজে ফোন দিন'
        },
        en: {
          headline: 'Careful! This may be a fake bKash agent',
          sub: 'The caller says they are bKash customer care, but the real bKash never asks for your code on a call.',
          banner: 'Careful! bKash never asks for codes',
          bannerSub: 'Very high scam risk. The caller asked for your OTP code.',
          spoken: "Careful. bKash never asks for your code on a call. Don't share it.",
          verify: 'Hang up and call the bKash helpline 16247 yourself'
        },
        reasons: [
          { otp: true,
            bn: { title: 'কলের মধ্যেই আপনার বিকাশ কোড এসেছে', detail: 'কলার ঠিক এই কোডটাই চাইছে। এটা দিলে আপনার অ্যাকাউন্ট তার হাতে চলে যাবে।', quote: '“কোডটা এসেছে? ছয় সংখ্যার কোডটা পড়ুন।”' },
            en: { title: 'A bKash code arrived during the call', detail: 'This is the code the caller wants. Sharing it hands them your account.', quote: '“Has the code arrived? Read me the six digits.”' } },
          { bn: { title: 'ওটিপি কোড চেয়েছে', detail: 'বিকাশ, নগদ বা কোনো ব্যাংক কখনো ফোনে কোড বা পিন চায় না।', quote: '“আপনার ফোনে একটা ওটিপি কোড গেছে, ওটা বলুন।”' },
            en: { title: 'Asked for your OTP code', detail: 'bKash, Nagad and banks never ask for a code or PIN on a call.', quote: '“An OTP code was sent to your phone. Tell me.”' } },
          { bn: { title: 'অ্যাকাউন্ট বন্ধের ভয় দেখিয়েছে', detail: 'ভয় দেখিয়ে তাড়াহুড়া করানো প্রতারকের পুরনো কৌশল।', quote: '“এখনই ভেরিফাই না করলে আজকের মধ্যে অ্যাকাউন্ট বন্ধ হয়ে যাবে।”' },
            en: { title: 'Threatened to suspend your account', detail: 'Scaring you into rushing is a classic scam trick.', quote: "“If you don't verify now, your account will be suspended today.”" } },
          { bn: { title: 'সাধারণ নাম্বার থেকে বিকাশ দাবি', detail: 'বিকাশের আসল হেল্পলাইন ১৬২৪৭। “বিকাশ অফিস” সাধারণ মোবাইল নাম্বার থেকে কল করে না।', quote: '“আমি বিকাশ কাস্টমার কেয়ার থেকে বলছি।”' },
            en: { title: 'Claims to be bKash from an ordinary number', detail: "bKash's real helpline is 16247. bKash does not call you from a normal mobile number.", quote: '“I am calling from bKash customer care.”' } }
        ]
      },
      coach: {
        intro: 'Ask for details a real bKash employee would give, and that you can check yourself. A scammer will dodge or rush you.',
        questions: [
          { id: 'staffid', bn: 'আপনার নাম আর কর্মী আইডি কী? আমি ১৬২৪৭ এ ফোন করে যাচাই করব।', en: "What's your name and staff ID? I'll check by calling 16247." },
          { id: 'visit', bn: 'আমি নিজে বিকাশ কাস্টমার কেয়ারে গিয়ে কথা বলব।', en: "I'll visit a bKash customer care centre myself.", tip: 'A real agent will say that is fine.' },
          { id: 'callback', bn: 'আমি কল কেটে ১৬২৪৭ নাম্বারে ফোন দিচ্ছি।', en: "I'll hang up and call 16247 myself.", tip: 'The real bKash will agree. A scammer will try to stop you.' }
        ]
      },
      after: {
        verifyTitle: 'Call the official helpline',
        verifyBody: 'Call bKash on 16247 yourself and ask whether anything is wrong with your account.',
        verifyBtn: 'Call 16247 (bKash helpline)',
        verifyToast: 'Demo only: this would open your dialer with 16247.',
        familyNote: 'Tell them a fake “bKash agent” is calling'
      },
      log: { claim: 'Claimed to be bKash customer care', warned: 'asked for OTP', alert: 'wanted the bKash code that arrived' }
    },

    // ------------------------------------------------------------------ 3. Fake police officer (Demo Guide, scenario 2)
    {
      id: 'police',
      icon: 'alert',
      title: { bn: 'ভুয়া পুলিশ', en: 'Fake police officer' },
      blurb: { bn: 'মামলার ভয় দেখিয়ে ওটিপি চায়', en: 'Threatens a legal case and asks for the OTP' },
      number: '+880 13•• ••• 771',
      lines: [
        { bn: 'আমি থানা থেকে বলছি, আমি একজন পুলিশ অফিসার।', en: "I'm calling from the police station. I am a police officer." },
        { bn: 'আপনার নামে একটা অবৈধ বিকাশ লেনদেনের মামলা হয়েছে।', en: 'A case has been filed against you for an illegal bKash transaction.' },
        { bn: 'এটা এখনই মেটাতে হবে, না হলে আজই গ্রেফতার হতে পারেন। কাউকে জানাবেন না।', en: "This must be settled now or you could be arrested today. Don't tell anyone." },
        { bn: 'যাচাইয়ের জন্য আপনার ফোনে আসা ওটিপি কোডটা আমাকে দিন।', en: 'For verification, give me the OTP that comes to your phone.' },
        { bn: 'দেরি করলে মামলা আরও জটিল হবে।', en: 'If you delay, the case will get worse.' },
        { bn: 'কোড এসেছে? এখনই বলুন, না হলে ওয়ারেন্ট জারি হবে।', en: 'Has the code come? Tell me now or a warrant will be issued.' }
      ],
      flagsByStep: [
        [{ bn: 'অচেনা নাম্বার থেকে পুলিশ দাবি', en: 'Unknown number claims to be the police', level: 'medium' }],
        [{ bn: 'ভুয়া কর্তৃপক্ষ: মামলার ভয় দেখাচ্ছে', en: 'False authority: legal threat', level: 'high' }],
        [{ bn: 'গ্রেফতারের হুমকি ও তাড়াহুড়া', en: 'Threat of arrest and urgency', level: 'high' },
         { bn: 'গোপন রাখতে বলছে', en: 'Secrecy: asks you not to tell anyone', level: 'high' }],
        [{ bn: 'ওটিপি কোড চাইছে', en: 'Asks for your OTP code', level: 'critical' }],
        [],
        [CODE_ARRIVED]
      ],
      riskByStep: [28, 60, 82, 94, 96, 99],
      stages: [
        { bn: 'পুলিশ দাবি', en: 'Hook' }, { bn: 'মামলার গল্প', en: 'Crisis' },
        { bn: 'ভয় ও গোপনীয়তা', en: 'Threat' }, { bn: 'কোড নেওয়া', en: 'Take' }
      ],
      predictions: [
        { bn: 'এরপর সম্ভবত বলবে আপনার নামে মামলা বা অভিযোগ আছে।', en: "Next they'll probably say there is a case or complaint against you." },
        { bn: 'এরপর গ্রেফতারের ভয় দেখাবে এবং কাউকে জানাতে নিষেধ করবে।', en: "Next they'll threaten arrest and tell you not to tell anyone." },
        { bn: 'এরপর “যাচাইয়ের জন্য” ওটিপি কোড চাইবে। পুলিশ কখনো কোড চায় না।', en: 'Next they\'ll ask for an OTP "for verification". Police never ask for codes.' },
        { bn: 'কোড না পেলে ওয়ারেন্টের ভয় দেখাবে। কল কেটে ৯৯৯ বা নিকটস্থ থানায় যোগাযোগ করুন।', en: "If you refuse, they'll threaten a warrant. Hang up and call 999 or your local station." }
      ],
      dodgeLine: { bn: 'প্রশ্ন করবেন না! সহযোগিতা না করলে এখনই গ্রেফতার করা হবে!', en: "Don't ask questions! If you don't cooperate you'll be arrested right now!" },
      warning: {
        bn: {
          headline: 'সাবধান! এটি ভুয়া পুলিশের কল হতে পারে',
          sub: 'কলার নিজেকে পুলিশ বলছে, কিন্তু আসল পুলিশ কখনো ফোনে ওটিপি বা টাকা চায় না।',
          banner: 'সাবধান! পুলিশ কখনো কোড চায় না',
          bannerSub: 'খুব বেশি ঝুঁকি। কলার ভয় দেখিয়ে আপনার ওটিপি চেয়েছে।',
          spoken: 'সাবধান। পুলিশ কখনো ফোনে কোড চায় না। কোড বলবেন না।',
          verify: 'কল কেটে ৯৯৯ বা নিকটস্থ থানায় নিজে যোগাযোগ করুন'
        },
        en: {
          headline: 'Careful! This may be a fake police officer',
          sub: 'The caller says they are the police, but real police never ask for an OTP or money on a call.',
          banner: 'Careful! Police never ask for codes',
          bannerSub: 'Very high scam risk. The caller used threats to ask for your OTP.',
          spoken: "Careful. Police never ask for your code on a call. Don't share it.",
          verify: 'Hang up and call 999 or your local police station yourself'
        },
        reasons: [
          { otp: true,
            bn: { title: 'কলের মধ্যেই আপনার বিকাশ কোড এসেছে', detail: 'কলার ঠিক এই কোডটাই চাইছে। এটা দিলে আপনার টাকা চলে যাবে।', quote: '“কোড এসেছে? এখনই বলুন, না হলে ওয়ারেন্ট জারি হবে।”' },
            en: { title: 'A bKash code arrived during the call', detail: 'This is the code the caller wants. Sharing it lets them take your money.', quote: '“Has the code come? Tell me now or a warrant will be issued.”' } },
          { bn: { title: 'ওটিপি কোড চেয়েছে', detail: 'পুলিশ, বিকাশ বা কোনো সরকারি অফিস কখনো ফোনে কোড চায় না।', quote: '“যাচাইয়ের জন্য আপনার ফোনে আসা ওটিপি কোডটা আমাকে দিন।”' },
            en: { title: 'Asked for your OTP code', detail: 'Police, bKash and government offices never ask for a code on a call.', quote: '“For verification, give me the OTP that comes to your phone.”' } },
          { bn: { title: 'গ্রেফতারের ভয় দেখিয়েছে', detail: 'আসল মামলা নোটিশে আসে। ফোনে কোড বা টাকা দিয়ে মামলা মেটানো যায় না।', quote: '“এখনই মেটাতে হবে, না হলে আজই গ্রেফতার হতে পারেন।”' },
            en: { title: 'Threatened you with arrest', detail: 'Real cases come by official notice. They are never settled by giving a code or money on the phone.', quote: '“This must be settled now or you could be arrested today.”' } },
          { bn: { title: 'কাউকে জানাতে নিষেধ করেছে', detail: 'গোপন রাখতে বলে যাতে আপনি পরিবার বা আইনজীবীর সাথে কথা না বলেন।', quote: '“কাউকে জানাবেন না।”' },
            en: { title: 'Told you to keep it secret', detail: 'Secrecy stops you from checking with your family or a lawyer.', quote: "“Don't tell anyone.”" } }
        ]
      },
      coach: {
        intro: 'Ask for details you can check with the real police. A scammer will refuse or get angry.',
        questions: [
          { id: 'badge', bn: 'কোন থানা? আপনার নাম আর ব্যাজ নাম্বার কী?', en: "Which station? What's your name and badge number?" },
          { id: 'visit', bn: 'আমি নিজে থানায় এসে কথা বলব।', en: "I'll come to the station in person.", tip: 'Real police will agree. A scammer will insist on the phone.' },
          { id: 'lawyer', bn: 'আমি আগে পরিবার আর আইনজীবীর সাথে কথা বলব।', en: "I'll talk to my family and a lawyer first." }
        ]
      },
      after: {
        verifyTitle: 'Check with the real police',
        verifyBody: 'Call 999 or visit your local police station and ask about the “case”. There almost certainly isn’t one.',
        verifyBtn: 'Call 999',
        verifyToast: 'Demo only: this would open your dialer with 999.',
        familyNote: 'Tell them a fake “police officer” is calling'
      },
      log: { claim: 'Claimed to be the police', warned: 'asked for OTP', alert: 'wanted the bKash code that arrived' }
    },

    // ------------------------------------------------------------------ 4. "I sent money by mistake" with a fake SMS
    {
      id: 'mistake',
      icon: 'message',
      title: { bn: '“ভুল করে টাকা পাঠিয়েছি”', en: '“I sent money by mistake”' },
      blurb: { bn: 'ভুয়া এসএমএস দেখিয়ে টাকা ফেরত চায়', en: 'Sends a fake payment SMS and asks you to send it back' },
      number: '+880 16•• ••• 309',
      lines: [
        { bn: 'ভাই, আমি ভুল করে আপনার নাম্বারে ৫,০০০ টাকা পাঠিয়ে ফেলেছি।', en: 'Brother, I sent 5,000 Taka to your number by mistake.' },
        { bn: 'আপনার ফোনে মেসেজ গেছে, একটু দেখেন।', en: 'A message has gone to your phone, please check.' },
        { bn: 'টাকাটা আমার মায়ের চিকিৎসার, খুব জরুরি। দয়া করে এখনই ফেরত দিন।', en: "It's for my mother's treatment, it's urgent. Please send it back now." },
        { bn: 'এই নাম্বারে ৫,০০০ টাকা সেন্ড মানি করে দেন।', en: 'Just send 5,000 Taka back to this number.' },
        { bn: 'ভাই, প্লিজ, আমি খুব বিপদে আছি।', en: "Brother, please, I'm in real trouble." },
        { bn: 'মেসেজটা পেয়েছেন তো? এখনই পাঠান।', en: 'You got the message, right? Send it now.' }
      ],
      flagsByStep: [
        [{ bn: 'অচেনা নাম্বার: ভুল করে টাকা পাঠানোর দাবি', en: 'Unknown number claims they sent money by mistake', level: 'medium' }],
        [{ bn: 'অ্যাপের ব্যালেন্স নয়, এসএমএস দেখতে বলছে', en: 'Points you to an SMS, not your real balance', level: 'high' }],
        [{ bn: 'আবেগের চাপ ও তাড়াহুড়া', en: 'Emotional pressure and urgency', level: 'high' }],
        [{ bn: 'টাকা ফেরত পাঠাতে বলছে', en: 'Asks you to send money back', level: 'critical' }],
        [],
        [{ bn: 'সাধারণ নাম্বার থেকে “টাকা এসেছে” এসএমএস', en: '“Money received” SMS came from an ordinary number', level: 'critical', otp: true }]
      ],
      riskByStep: [30, 55, 72, 92, 95, 99],
      stages: [
        { bn: 'ভুলের দাবি', en: 'Hook' }, { bn: 'ভুয়া প্রমাণ', en: 'Fake proof' },
        { bn: 'আবেগের চাপ', en: 'Pressure' }, { bn: 'টাকা নেওয়া', en: 'Take' }
      ],
      predictions: [
        { bn: 'এরপর সম্ভবত ফোনের মেসেজ দেখতে বলবে।', en: "Next they'll probably tell you to check an SMS on your phone." },
        { bn: 'এরপর কষ্টের গল্প বলে তাড়া দেবে। মেসেজ নয়, বিকাশ অ্যাপে ব্যালেন্স দেখুন।', en: "Next they'll tell a sad story to rush you. Check your balance in the bKash app, not the SMS." },
        { bn: 'এরপর টাকা “ফেরত” পাঠাতে বলবে। আসল ভুল লেনদেন বিকাশ নিজেই ফেরত দেয়।', en: 'Next they\'ll ask you to "return" the money. bKash reverses real mistakes itself.' },
        { bn: 'না পাঠালে বারবার অনুরোধ করবে বা রাগ করবে। কল কেটে ১৬২৪৭ এ জানান।', en: "If you don't send it, they'll keep begging or get angry. Hang up and tell 16247." }
      ],
      dodgeLine: { bn: 'এত যাচাই লাগবে না ভাই, শুধু টাকাটা পাঠান!', en: 'No need to check, brother, just send the money!' },
      // Instead of a bKash code, this trick uses a fake "money received" SMS.
      alert: {
        icon: 'alert',
        sender: '+880 16•• ••• 309',
        sms: 'You have received Tk 5,000.00 from 01•••••••••. Fee Tk 0.00. Balance Tk 5,240.00. TrxID 9BD7K2Q1',
        bn: 'থামুন! এই এসএমএস ভুয়া',
        en: 'Stop! This SMS is fake',
        detail: 'This “money received” message came from an ordinary phone number, not from bKash. Open the bKash app and check your real balance before sending anything.',
        predicted: 'CallShield predicted this trick',
        keep: 'আমি টাকা পাঠাব না · I won\'t send money',
        spoken: { bn: 'থামুন। এই মেসেজটি ভুয়া। টাকা পাঠাবেন না।', en: "Stop. This message is fake. Don't send any money." }
      },
      warning: {
        bn: {
          headline: 'সাবধান! এটি “ভুল করে টাকা পাঠানো” প্রতারণা হতে পারে',
          sub: 'কলার বলছে ভুল করে আপনাকে টাকা পাঠিয়েছে, কিন্তু আপনার অ্যাকাউন্টে আসলে টাকা নাও আসতে পারে।',
          banner: 'সাবধান! আগে অ্যাপে ব্যালেন্স দেখুন',
          bannerSub: 'খুব বেশি ঝুঁকি। কলার আপনাকে টাকা পাঠাতে বলছে।',
          spoken: 'সাবধান। টাকা পাঠানোর আগে বিকাশ অ্যাপে ব্যালেন্স দেখুন।',
          verify: 'বিকাশ অ্যাপ খুলে আসল ব্যালেন্স দেখুন'
        },
        en: {
          headline: 'Careful! This may be a “sent by mistake” scam',
          sub: 'The caller says they sent you money by mistake, but the money may never have reached your account.',
          banner: 'Careful! Check your balance in the app first',
          bannerSub: 'Very high scam risk. The caller wants you to send money.',
          spoken: 'Careful. Check your balance in the bKash app before sending any money.',
          verify: 'Open the bKash app and check your real balance'
        },
        reasons: [
          { otp: true,
            bn: { title: 'সাধারণ নাম্বার থেকে “টাকা এসেছে” মেসেজ', detail: 'আসল বিকাশ মেসেজ “bKash” নামে আসে, কোনো মোবাইল নাম্বার থেকে না।', quote: '“মেসেজটা পেয়েছেন তো? এখনই পাঠান।”' },
            en: { title: '“Money received” SMS from an ordinary number', detail: 'Real bKash messages come from “bKash”, never from a mobile number.', quote: '“You got the message, right? Send it now.”' } },
          { bn: { title: 'টাকা ফেরত পাঠাতে বলছে', detail: 'সত্যিকারের ভুল লেনদেন হলে বিকাশ নিজেই ফেরত দেয়। আপনাকে পাঠাতে হয় না।', quote: '“এই নাম্বারে ৫,০০০ টাকা সেন্ড মানি করে দেন।”' },
            en: { title: 'Asked you to send money back', detail: 'If a real transfer was a mistake, bKash reverses it. You never need to send it yourself.', quote: '“Just send 5,000 Taka back to this number.”' } },
          { bn: { title: 'আবেগ দিয়ে তাড়া দিচ্ছে', detail: 'কষ্টের গল্প বলে ভাবার সময় না দেওয়া প্রতারকের কৌশল।', quote: '“টাকাটা আমার মায়ের চিকিৎসার, খুব জরুরি।”' },
            en: { title: 'Rushing you with a sad story', detail: 'A heartbreaking story leaves you no time to check.', quote: "“It's for my mother's treatment, it's urgent.”" } },
          { bn: { title: 'অ্যাপ নয়, মেসেজ দেখতে বলছে', detail: 'মেসেজ সহজেই নকল করা যায়। শুধু বিকাশ অ্যাপের ব্যালেন্সই বিশ্বাস করুন।', quote: '“আপনার ফোনে মেসেজ গেছে, একটু দেখেন।”' },
            en: { title: 'Points you to an SMS, not the app', detail: 'SMS messages are easy to fake. Only trust the balance in the bKash app.', quote: '“A message has gone to your phone, please check.”' } }
        ]
      },
      coach: {
        intro: 'Say things a real person who made a mistake would accept. A scammer will push you to send the money yourself.',
        questions: [
          { id: 'app', bn: 'আমি আগে বিকাশ অ্যাপে ব্যালেন্স দেখে নিই।', en: 'Let me check my balance in the bKash app first.' },
          { id: 'reverse', bn: 'আপনি ১৬২৪৭ এ ফোন করে ভুল লেনদেন ফেরত চান।', en: 'Please call 16247 and ask bKash to reverse it.', tip: 'A real sender will agree. A scammer will refuse.' },
          { id: 'trx', bn: 'লেনদেনের TrxID কত? আমি অ্যাপে মিলিয়ে দেখব।', en: "What's the TrxID? I'll match it in the app." }
        ]
      },
      after: {
        verifyTitle: 'Check your real balance',
        verifyBody: 'Open the bKash app and look at your balance and transactions. If no money arrived, the call was a scam.',
        verifyBtn: 'Open bKash app',
        verifyToast: 'Demo only: this would open the bKash app.',
        familyNote: 'Tell them about the fake “money sent by mistake” call'
      },
      log: { claim: 'Said they sent money by mistake', warned: 'asked you to send it back', alert: 'sent a fake payment SMS' }
    },

    // ------------------------------------------------------------------ 5. Fake lottery / prize
    {
      id: 'prize',
      icon: 'check',
      title: { bn: 'ভুয়া লটারি পুরস্কার', en: 'Fake lottery prize' },
      blurb: { bn: 'পুরস্কারের লোভ দেখিয়ে ফি আর কোড চায়', en: 'Offers a prize, then asks for a fee and your code' },
      number: '+880 18•• ••• 552',
      lines: [
        { bn: 'অভিনন্দন! আপনি বিকাশ ঈদ অফারে ৫০,০০০ টাকা জিতেছেন।', en: "Congratulations! You've won 50,000 Taka in the bKash Eid offer." },
        { bn: 'পুরস্কারটা আজকের মধ্যেই নিতে হবে, না হলে বাতিল হয়ে যাবে।', en: 'You must claim the prize today or it will be cancelled.' },
        { bn: 'শুধু ৫০০ টাকা প্রসেসিং ফি পাঠাতে হবে। কাউকে বলবেন না, অফারটা সীমিত।', en: "You only need to send a 500 Taka processing fee. Don't tell anyone, the offer is limited." },
        { bn: 'আর আপনার ফোনে একটা কোড যাবে, সেটা বললেই টাকা ঢুকে যাবে।', en: 'A code will come to your phone. Tell me and the money will arrive.' },
        { bn: 'দেরি করবেন না, আরও অনেকে অপেক্ষায় আছে।', en: "Don't delay, many others are waiting." },
        { bn: 'কোড এসেছে? বলুন, পুরস্কার এখনই পাঠাচ্ছি।', en: "Has the code come? Tell me and I'll send the prize now." }
      ],
      flagsByStep: [
        [{ bn: 'অপ্রত্যাশিত পুরস্কারের খবর', en: 'A surprise prize you never entered for', level: 'medium' }],
        [{ bn: 'তাড়াহুড়া: “আজকের মধ্যেই”', en: 'Urgency: “today only”', level: 'high' }],
        [{ bn: 'পুরস্কার পেতে আগে ফি চাইছে', en: 'Asks for a fee before paying the prize', level: 'high' },
         { bn: 'গোপন রাখতে বলছে', en: 'Secrecy: asks you not to tell anyone', level: 'high' }],
        [{ bn: 'ওটিপি কোড চাইছে', en: 'Asks for your OTP code', level: 'critical' }],
        [],
        [CODE_ARRIVED]
      ],
      riskByStep: [26, 52, 80, 94, 96, 99],
      stages: [
        { bn: 'পুরস্কারের লোভ', en: 'Hook' }, { bn: 'সময়ের চাপ', en: 'Pressure' },
        { bn: 'ফি ও গোপনীয়তা', en: 'Fee' }, { bn: 'কোড নেওয়া', en: 'Take' }
      ],
      predictions: [
        { bn: 'এরপর সম্ভবত বলবে আজকের মধ্যেই পুরস্কার নিতে হবে।', en: "Next they'll probably say you must claim it today." },
        { bn: 'এরপর পুরস্কার পেতে আগে ফি চাইবে এবং গোপন রাখতে বলবে।', en: "Next they'll ask for a fee first and tell you to keep it secret." },
        { bn: 'এরপর আপনার ফোনে আসা কোড চাইবে। টাকা পেতে কখনো কোড লাগে না।', en: "Next they'll ask for the code sent to your phone. Receiving money never needs a code." },
        { bn: 'না দিলে “অফার শেষ হয়ে যাচ্ছে” বলে চাপ দেবে। কল কেটে দিন।', en: "If you refuse, they'll say the offer is ending. Hang up." }
      ],
      dodgeLine: { bn: 'এত প্রশ্ন করলে অফার বাতিল হয়ে যাবে! তাড়াতাড়ি কোডটা বলুন!', en: 'Ask more questions and the offer is cancelled! Quickly, the code!' },
      warning: {
        bn: {
          headline: 'সাবধান! এটি ভুয়া পুরস্কারের কল হতে পারে',
          sub: 'কলার বলছে আপনি পুরস্কার জিতেছেন, কিন্তু টাকা পেতে আগে টাকা বা কোড দিতে হলে সেটা প্রতারণা।',
          banner: 'সাবধান! পুরস্কার পেতে কোড লাগে না',
          bannerSub: 'খুব বেশি ঝুঁকি। কলার ফি আর আপনার কোড চেয়েছে।',
          spoken: 'সাবধান। আসল পুরস্কার পেতে কখনো ফি বা কোড লাগে না।',
          verify: 'বিকাশ অ্যাপে বা ১৬২৪৭ এ অফারটি যাচাই করুন'
        },
        en: {
          headline: 'Careful! This may be a fake prize call',
          sub: "The caller says you won a prize, but if you must pay or share a code to receive money, it's a scam.",
          banner: 'Careful! Prizes never need a code',
          bannerSub: 'Very high scam risk. The caller asked for a fee and your code.',
          spoken: 'Careful. A real prize never needs a fee or a code.',
          verify: 'Check the offer in the bKash app or call 16247'
        },
        reasons: [
          { otp: true,
            bn: { title: 'কলের মধ্যেই আপনার বিকাশ কোড এসেছে', detail: 'কলার ঠিক এই কোডটাই চাইছে। এটা দিলে পুরস্কার নয়, আপনার টাকাই চলে যাবে।', quote: '“কোড এসেছে? বলুন, পুরস্কার এখনই পাঠাচ্ছি।”' },
            en: { title: 'A bKash code arrived during the call', detail: 'This is the code the caller wants. Sharing it sends your money away, not a prize to you.', quote: "“Has the code come? Tell me and I'll send the prize now.”" } },
          { bn: { title: 'ওটিপি কোড চেয়েছে', detail: 'টাকা পাঠাতে বা পুরস্কার দিতে আপনার কোড লাগে না। কোড দিলে আপনার টাকাই চলে যাবে।', quote: '“আপনার ফোনে একটা কোড যাবে, সেটা বললেই টাকা ঢুকে যাবে।”' },
            en: { title: 'Asked for your OTP code', detail: 'Nobody needs your code to send you money. Sharing it lets them take yours.', quote: '“A code will come to your phone. Tell me and the money will arrive.”' } },
          { bn: { title: 'পুরস্কারের জন্য আগে ফি চেয়েছে', detail: 'টাকা পেতে আগে টাকা দিতে হলে, সেটা প্রতারণা।', quote: '“শুধু ৫০০ টাকা প্রসেসিং ফি পাঠাতে হবে।”' },
            en: { title: 'Asked for a fee before the prize', detail: 'If you must pay to receive money, it is a scam.', quote: '“You only need to send a 500 Taka processing fee.”' } },
          { bn: { title: 'হঠাৎ পুরস্কার আর সময়ের চাপ', detail: 'যে লটারিতে অংশ নেননি, সেটা জেতা যায় না। “আজকের মধ্যেই” বলে তাড়া দিচ্ছে।', quote: '“পুরস্কারটা আজকের মধ্যেই নিতে হবে।”' },
            en: { title: 'Surprise prize with a deadline', detail: "You can't win a draw you never entered. The deadline is there to rush you.", quote: '“You must claim the prize today or it will be cancelled.”' } }
        ]
      },
      coach: {
        intro: 'Ask for details you can check in the official app. A scammer will rush you or say the offer is ending.',
        questions: [
          { id: 'where', bn: 'অফারটা বিকাশ অ্যাপে কোথায় দেখা যাবে?', en: 'Where can I see this offer in the bKash app?' },
          { id: 'deduct', bn: 'ফি-টা পুরস্কার থেকে কেটে বাকিটা পাঠান।', en: 'Take the fee out of the prize and send me the rest.', tip: 'A real company could do this. A scammer never will.' },
          { id: 'callback', bn: 'আমি ১৬২৪৭ এ ফোন করে আগে যাচাই করি।', en: "I'll call 16247 to check first." }
        ]
      },
      after: {
        verifyTitle: 'Check the offer yourself',
        verifyBody: 'Look for the offer in the bKash app or call 16247. Real offers never need a fee or your code.',
        verifyBtn: 'Call 16247 (bKash helpline)',
        verifyToast: 'Demo only: this would open your dialer with 16247.',
        familyNote: 'Tell them about the fake prize call'
      },
      log: { claim: 'Said you won a prize', warned: 'asked for a fee and OTP', alert: 'wanted the bKash code that arrived' }
    }
  ];
})();
