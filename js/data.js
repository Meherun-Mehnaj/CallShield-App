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
  // The demo calls themselves live in scenarios.js. This is what they share.

  // The general shape of a scam call, shown on the Learn tab.
  scriptStages: [
    { bn: 'পরিচয় দাবি', en: 'Hook' },
    { bn: 'চাপ বা বিপদের গল্প', en: 'Pressure' },
    { bn: 'গোপন রাখা বা হুমকি', en: 'Isolate' },
    { bn: 'টাকা বা কোড নেওয়া', en: 'Take' }
  ],

  // Added when the person asks a check question from the challenge coach and the caller dodges it.
  dodgeFlag: { bn: 'যাচাইয়ের প্রশ্ন এড়িয়ে গেছে', en: 'Avoided your check question', level: 'critical' },

  // Default mid-call alarm: a bKash code arrives. A scenario can replace it with its own `alert`.
  otpAlert: {
    icon: 'lock',
    sender: 'bKash',
    sms: 'Your bKash verification code is ••••••. It is valid for 2 minutes. Never share this code with anyone.',
    bn: 'থামুন! কলার ঠিক এই কোডটাই চাইছে',
    en: 'Stop! This is the code the caller wants',
    detail: 'A bKash code arrived while you are on a suspicious call. Anyone who asks for it is trying to take your money.',
    predicted: 'CallShield predicted this request',
    keep: 'আমি কোড বলব না · I won\'t share it',
    spoken: { bn: 'থামুন। এই কোড কাউকে বলবেন না।', en: "Stop. Don't share this code with anyone." }
  },

  coach: {
    title: { bn: 'কলারকে যাচাই করুন', en: "Check who's really calling" }
  },

  // Warning-screen text shared by every scenario (each scenario adds its own headline, reasons and so on).
  warnUI: {
    bn: {
      back: 'কলে ফিরুন', level: 'খুব বেশি ঝুঁকি',
      listen: 'জোরে শুনুন', why: 'কেন আমরা এটা বলছি', todo: 'এখন কী করবেন',
      hangup: 'এখনই কল কেটে দিন',
      coach: 'কলারকে কী জিজ্ঞেস করবেন',
      safeWord: 'পারিবারিক গোপন শব্দটি জিজ্ঞেস করুন',
      trust: 'আমি নিশ্চিত, কল চালিয়ে যাব',
      sheetTitle: 'চালিয়ে যাওয়ার আগে',
      sheetBody: 'যেই হোক, পিন বা ওটিপি কখনো বলবেন না। সন্দেহ হলে কল কেটে নিজে ফোন করুন।',
      sheetBack: 'ঠিক আছে, ফিরে যাই', sheetContinue: 'তবুও কল চালিয়ে যান'
    },
    en: {
      back: 'Back to call', level: 'VERY HIGH RISK',
      listen: 'Read aloud', why: 'Why we think so', todo: 'What to do now',
      hangup: 'Hang up now',
      coach: 'What to ask the caller',
      safeWord: 'Ask for your family safe word',
      trust: "I'm sure, continue the call",
      sheetTitle: 'Before you continue',
      sheetBody: 'Whoever it is, never share a PIN or OTP. If in doubt, hang up and call them yourself.',
      sheetBack: 'OK, go back', sheetContinue: 'Continue the call anyway'
    }
  },

  tactics: [
    { bn: 'তাড়াহুড়া', en: 'Urgency', what: 'Pushes you to act now so you have no time to think or check.', example: '“এখনই না পাঠালে বড় বিপদ হবে!”', todo: 'Pause. Say you will call back. A real emergency can wait five minutes.' },
    { bn: 'গোপনীয়তা', en: 'Secrecy', what: 'Tells you not to tell anyone, so nobody can warn you.', example: '“কাউকে বলো না, এটা আমাদের মধ্যে থাক।”', todo: 'Tell someone you trust right away.' },
    { bn: 'ভুয়া কর্তৃপক্ষ', en: 'False authority', what: 'Pretends to be from bKash, Nagad, a bank or the police.', example: '“আমি বিকাশ অফিস থেকে বলছি, আপনার অ্যাকাউন্ট বন্ধ হয়ে যাবে।”', todo: 'Hang up and call the official helpline yourself.' },
    { bn: 'কোড বা পিন চাওয়া', en: 'Asking for your code or PIN', what: 'Asks for the OTP or PIN that lets them empty your account.', example: '“আপনার ফোনে একটা কোড গেছে, একটু বলেন তো।”', todo: 'Never share an OTP or PIN. No genuine caller will ask.' },
    { bn: 'পরিবারের বিপদ (নকল কণ্ঠ)', en: 'Family emergency with a cloned voice', what: 'Uses AI to sound like a family member, often from a new number.', example: '“আমি আম্মু, নতুন নাম্বার থেকে বলছি। টাকা লাগবে।”', todo: 'Call their saved number, or ask your family safe word.' },
    { bn: 'পুরস্কার বা ফেরতের লোভ', en: 'Prize or refund bait', what: 'Says you won money or are owed a refund, but must pay a fee first.', example: '“আপনি পুরস্কার জিতেছেন, শুধু ফি-টা পাঠান।”', todo: 'If you must pay to receive money, it is a scam.' },
    { bn: 'ভুল করে টাকা পাঠানো (ভুয়া এসএমএস)', en: '“Sent by mistake” with a fake SMS', what: 'Sends a fake “money received” SMS from an ordinary number, then asks you to send the money back.', example: '“ভাই, ভুল করে আপনার নাম্বারে টাকা চলে গেছে, ফেরত দেন।”', todo: 'Check your balance in the bKash app. Real mistakes are reversed by bKash, not by you.' }
  ],

  seedCalls: [
    { id: 's1', name: '+880 18•• ••• 207', note: 'Claimed to be a bKash officer · asked for PIN', time: 'Yesterday 19:03', kind: 'scam', blocked: true },
    { id: 's2', name: 'Abbu', note: 'Saved contact · no warning signs', time: 'Yesterday 17:40', kind: 'safe' },
    { id: 's3', name: '+880 13•• ••• 915', note: 'Said you won a prize · asked for a fee', time: 'Yesterday 14:20', kind: 'warn' },
    { id: 's4', name: 'Rahim (Office)', note: 'Saved contact · no warning signs', time: 'Mon 11:02', kind: 'safe' },
    { id: 's5', name: 'Nusrat Apu', note: 'Saved contact · no warning signs', time: 'Sun 20:47', kind: 'safe' },
    { id: 's6', name: '+880 19•• ••• 338', note: 'Short call · no warning signs', time: 'Sun 12:10', kind: 'safe' }
  ],

  trustedContacts: ['Ammu', 'Abbu', 'Nusrat Apu'],
  helpOptions: ['Yes', 'Not sure', 'No'],
  reasonOptions: ['Code request', 'Code alarm', 'Prediction', 'Dodged question', 'Urgency', 'Secrecy', 'Threat', 'Fake authority', 'Fake SMS', 'Fee request', 'Fake voice']
};
