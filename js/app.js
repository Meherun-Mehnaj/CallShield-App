/* CallShield app: hash router, screens, demo-call simulation and on-device storage. */
(function () {
  'use strict';

  const D = window.CS_DATA;
  const L = window.CS_STR;
  const ICONS = window.CS_ICONS;
  const STORE_KEY = 'callshield.v2';
  const OLD_STORE_KEY = 'callshield.v1';
  const SECONDS_PER_STEP = 3;
  const WARN_STEP = 4;   // warning banner appears (12 s)
  const OTP_STEP = 5;    // fake bKash code SMS arrives (15 s)
  const LAST_STEP = 5;
  const FLAG_COLORS = { medium: '#E8A33D', high: '#F07A3A', critical: '#F2555A' };
  const LANG_OPTIONS = [['bn', 'বাংলা'], ['en', 'English'], ['both', 'বাংলা + EN']];

  const app = document.getElementById('app');

  // ---------- Helpers ----------
  function icon(name, size, cls) {
    const s = size || 20;
    return `<svg class="i ${cls || ''}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
  }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (secs) => num(pad(Math.floor(secs / 60)) + ':' + pad(secs % 60));
  function clockNow() { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------- Language ----------
  // 'en' shows English, 'bn' shows Bangla, 'both' shows Bangla with a smaller English line.
  const lang = () => S.settings.lang;
  const tx = (o) => (typeof o === 'string' ? o : lang() === 'en' ? o.en : o.bn);                         // primary text
  const sub = (o) => (lang() === 'both' && typeof o !== 'string' ? `<span class="alt-line">${o.en}</span>` : '');
  const duo = (o) => tx(o) + sub(o);                                                                     // primary + English line
  const pair = (o) => (lang() === 'both' ? `${o.bn} · ${o.en}` : tx(o));                                 // one line, for buttons
  const plain = (o) => (lang() === 'both' ? `${o.bn} / ${o.en}` : tx(o));                                // attributes and dialogs
  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  const num = (v) => (lang() === 'bn' ? String(v).replace(/[0-9]/g, (d) => BN_DIGITS[d]) : String(v));

  // ---------- Persistent state (this device only) ----------
  function defaults() {
    return {
      settings: {
        live: true, voice: true, contacts: true,
        predict: true, otpGuard: true, coach: true,
        speak: true, vibrate: true, lang: 'both', safeWord: ''
      },
      calls: D.seedCalls.map((c) => JSON.parse(JSON.stringify(c))),
      feedback: []
    };
  }
  function load() {
    const d = defaults();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return { settings: Object.assign(d.settings, saved.settings), calls: saved.calls || d.calls, feedback: saved.feedback || [] };
      }
      // Earlier version: keep settings and study feedback, start the call history fresh (it now has Bangla text).
      const old = localStorage.getItem(OLD_STORE_KEY);
      if (old) {
        const saved = JSON.parse(old);
        return { settings: Object.assign(d.settings, saved.settings), calls: d.calls, feedback: saved.feedback || [] };
      }
    } catch (e) { /* storage unavailable: fall back to defaults */ }
    return d;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }
  let S = load();

  // Transient UI state
  const ui = { filter: 'All', sheet: false, coach: false, warnLang: null, editingSafe: false, safeDraft: '', freshId: null };
  let call = null; // the running call, or the one that just ended
  let lastRoute = null;
  let toastTimer = null;

  // ---------- Router ----------
  const routes = { home, incoming, call: callScreen, warning, after, calls, learn, settings };

  function requested() {
    const r = location.hash.replace(/^#\/?/, '') || 'home';
    return routes[r] ? r : 'home';
  }
  function resolve(r) {
    const live = call && call.active;
    if ((r === 'call' || r === 'warning') && !live) return 'home';
    if (r === 'incoming' && live) return 'call';
    if (r === 'after' && !(call && !call.active)) return 'home';
    return r;
  }
  function go(r) {
    if (location.hash === '#/' + r) render();
    else location.hash = '#/' + r;
  }
  function render() {
    const want = requested();
    const r = resolve(want);
    if (r !== want) history.replaceState(null, '', '#/' + r);
    document.documentElement.lang = lang() === 'en' ? 'en' : 'bn';

    const oldScroller = app.querySelector('.scroll, .call-body');
    const keep = r === lastRoute && oldScroller ? oldScroller.scrollTop : 0;
    if (r === 'call') { call.shownFlags = -1; call.shownStage = -1; }

    app.innerHTML = routes[r]();

    const scroller = app.querySelector('.scroll, .call-body');
    if (scroller) scroller.scrollTop = keep;
    if (r === 'call') updateCall();
    syncOverlays();
    if (r !== lastRoute) {
      const h = app.querySelector('h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    lastRoute = r;
  }

  // ---------- Shared pieces ----------
  function tabbar(active) {
    const tabs = [['home', L.tabHome, 'home'], ['calls', L.tabCalls, 'clock'], ['learn', L.tabLearn, 'book'], ['settings', L.tabSettings, 'sliders']];
    return `<nav class="tabbar" aria-label="${plain(L.mainNav)}">${tabs.map(([r, label, ic]) =>
      `<a class="tab" href="#/${r}"${r === active ? ' aria-current="page"' : ''}>${icon(ic, 22)}<span>${duo(label)}</span></a>`).join('')}</nav>`;
  }
  function badgeOf(c) {
    const blocked = c.blocked ? ` · ${tx(L.bBlocked)}` : '';
    if (c.kind === 'scam') return { cls: 'scam', label: tx(L.bScam) + blocked };
    if (c.kind === 'warn') return { cls: 'warn', label: tx(L.bSusp) + blocked };
    if (c.unchecked) return { cls: 'neutral', label: tx(L.bUnchecked) };
    return { cls: 'safe', label: tx(L.bOk) };
  }
  const nameOf = (c) => esc(tx(c.name));
  const timeOf = (c) => (typeof c.time === 'string' ? esc(c.time) : `${tx(L[c.time.day])} ${num(c.time.hm)}`);
  const noteOf = (c) => (typeof c.note === 'string' ? esc(c.note) : duo(c.note));

  function toast(msg) {
    const old = app.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = duo(msg);
    app.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3600);
  }
  function speak(parts) {
    if (!('speechSynthesis' in window)) { toast(L.tNoTts); return; }
    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = synth.getVoices();
    let noBangla = false;
    parts.forEach((p) => {
      const u = new SpeechSynthesisUtterance(p.text);
      u.lang = p.lang === 'bn' ? 'bn-BD' : 'en-US';
      u.rate = 0.9;
      const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(p.lang));
      if (v) u.voice = v;
      else if (p.lang === 'bn' && voices.length) noBangla = true;
      synth.speak(u);
    });
    if (noBangla) toast(L.tNoBnVoice);
  }
  function speakParts(o) {
    const parts = [];
    if (o.lang !== 'en') parts.push({ text: o.bn, lang: 'bn' });
    if (o.lang !== 'bn') parts.push({ text: o.en, lang: 'en' });
    return parts;
  }
  function stopSpeech() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  function langSeg(current, action, extraCls) {
    return `<div class="seg ${extraCls || ''}" role="group" aria-label="${plain(L.appLang)}">${LANG_OPTIONS.map(([v, label]) =>
      `<button data-action="${action}" data-v="${v}" aria-pressed="${current === v}" lang="${v === 'en' ? 'en' : 'bn'}">${label}</button>`).join('')}</div>`;
  }

  // ---------- Screens ----------
  function home() {
    const st = S.settings;
    const flagged = S.calls.filter((c) => c.kind !== 'safe').length;
    const blocked = S.calls.filter((c) => c.blocked).length;
    const recent = S.calls.find((c) => c.kind !== 'safe');

    const status = st.live ? `
      <section class="card brand stack" style="gap:12px">
        <div class="row" style="gap:10px">${icon('shieldCheck', 28)}<h2 class="h2" style="font-size:19px">${duo(L.protOn)}</h2></div>
        <p style="font-size:15px;line-height:1.45">${duo(L.protOnBody)}</p>
        <div class="row" style="gap:8px;font-size:13px;color:var(--brand-on)">${icon('lock', 16)}<span>${tx(L.protAudio)}</span></div>
      </section>` : `
      <section class="card off stack" style="gap:12px">
        <div class="row" style="gap:10px;color:var(--ink-2)">${icon('shieldOff', 28)}<h2 class="h2" style="font-size:19px">${duo(L.protOff)}</h2></div>
        <p class="body">${duo(L.protOffBody)}</p>
        <button class="btn btn-primary" data-action="enable-live">${pair(L.turnOn)}</button>
      </section>`;

    const recentTitle = recent && (recent.kind === 'scam' ? (recent.blocked ? L.recentScamBlocked : L.recentScam) : L.recentSusp);
    const recentCard = recent ? `
      <a class="card tight" href="#/calls">
        <div class="dot-icon ${recent.kind === 'scam' ? 'danger' : 'warn'}">${icon('alert', 20)}</div>
        <div class="grow stack" style="gap:2px">
          <span class="strong" style="font-size:15px">${tx(recentTitle)}</span>
          <span class="small">${typeof recent.note === 'string' ? esc(recent.note) : tx(recent.note)} · ${timeOf(recent)}</span>
        </div>
        <span style="color:var(--muted);display:flex">${icon('chevronRight', 18)}</span>
      </a>` : '';

    return `<div class="screen">
      <main class="scroll">
        <header class="row">
          <div class="logo">${icon('shield', 22)}</div>
          <div class="stack" style="gap:0">
            <h1 style="font-family:var(--display);font-size:21px;font-weight:700;letter-spacing:-0.02em">CallShield</h1>
            <span class="small">${lang() === 'both' ? `${L.appSub.bn} · ${L.appSub.en}` : tx(L.appSub)}</span>
          </div>
        </header>
        ${status}
        <section class="card stack" style="gap:12px">
          <h2 class="h2">${duo(L.demoTitle)}</h2>
          <p class="body">${duo(L.demoBody)}</p>
          <button class="btn btn-primary" data-action="start-demo">${icon('phone', 20)}${pair(L.demoBtn)}</button>
        </section>
        <section class="stack">
          <h2 class="eyebrow">${pair(L.thisWeek)}</h2>
          <div class="stats">
            <div class="stat"><b>${num(S.calls.length)}</b><span>${duo(L.statChecked)}</span></div>
            <div class="stat warn"><b>${num(flagged)}</b><span>${duo(L.statWarnings)}</span></div>
            <div class="stat danger"><b>${num(blocked)}</b><span>${duo(L.statBlocked)}</span></div>
          </div>
        </section>
        ${recentCard}
        <section class="card muted-card stack" style="gap:6px;padding:16px">
          <span class="eyebrow" style="color:var(--brand)">${pair(L.remember)}</span>
          <p class="bn-big">${tx(L.rememberBody)}</p>
          ${lang() === 'both' ? `<p class="body" style="font-size:14px">${L.rememberBody.en}</p>` : ''}
        </section>
      </main>
      ${tabbar('home')}
    </div>`;
  }

  function incoming() {
    const on = S.settings.live;
    return `<div class="screen dark">
      <div class="call-top">
        <span class="small" style="font-size:15px">${pair(L.incoming)}</span>
        <div class="avatar-ring">${icon('user', 48)}</div>
        <h1 class="caller-number">${D.scenario.number}</h1>
        <span class="small" style="font-size:15px;margin-top:6px">${tx(L.notInContacts)}</span>
      </div>
      <section class="shield-note">
        <div class="shield-badge"${on ? '' : ' style="background:var(--dark-4)"'}>${icon(on ? 'shield' : 'shieldOff', 20)}</div>
        <div class="stack" style="gap:4px">
          <span class="strong" style="font-size:15px">${tx(on ? L.ready : L.offTitle)}</span>
          <span style="font-size:14px;line-height:1.45;color:var(--dark-ink-2)">${duo(on ? L.readyBody : L.offBody)}</span>
        </div>
      </section>
      <div class="answer-row">
        <div class="round-label"><button class="round end" data-action="decline" aria-label="${plain(L.declineCall)}">${icon('phone', 30, 'rot')}</button>${tx(L.decline)}</div>
        <div class="round-label"><button class="round accept" data-action="accept" aria-label="${plain(L.acceptCall)}">${icon('phone', 30)}</button>${tx(L.accept)}</div>
      </div>
    </div>`;
  }

  function callScreen() {
    const on = S.settings.live;
    return `<div class="screen dark">
      <header class="call-head">
        <div class="stack" style="gap:2px">
          <h1>${D.scenario.number}</h1>
          <span class="small" style="font-size:14px">${tx(L.onCall)} · <span id="clock">${fmt(0)}</span></span>
        </div>
        <button class="btn btn-ghost-dark" data-action="replay">${tx(L.replay)}</button>
      </header>
      <div class="call-body">
        ${on ? `
        <section class="card dark stack" style="padding:16px">
          <div class="row" style="gap:8px">
            <span style="color:#9CCFE0;display:flex">${icon('shield', 18)}</span>
            <span class="strong grow" style="font-size:14px;color:var(--dark-ink-2)">${pair(L.listening)}</span>
            <span class="pulse"></span>
          </div>
          <div class="row" style="justify-content:space-between;align-items:baseline">
            <span class="small" style="font-size:14px">${pair(L.scamRisk)}</span>
            <span class="risk-label" id="riskLabel"></span>
          </div>
          <div class="meter" id="riskMeter" role="meter" aria-label="${plain(L.scamRisk)}" aria-valuemin="0" aria-valuemax="100"><div id="riskFill"></div></div>
        </section>` : `
        <section class="card dark row" style="padding:16px;color:var(--dark-muted)">${icon('shieldOff', 20)}<span style="font-size:14px">${duo(L.callOffNote)}</span></section>`}
        <section class="card dark stack" style="padding:16px;gap:6px">
          <span class="eyebrow">${pair(L.callerSaying)}</span>
          <p class="saying" id="lineMain"></p>
          <p class="small" style="font-size:14px" id="lineAlt"></p>
        </section>
        ${on && S.settings.predict ? `
        <section class="card dark stack predict-card" id="predict" aria-live="polite"></section>` : ''}
        ${on && S.settings.coach ? `
        <button class="btn btn-coach" data-action="coach-open">${icon('help', 20)}${pair(L.whatToAsk)}</button>` : ''}
        ${on ? `
        <section class="stack" style="gap:8px">
          <span class="eyebrow">${pair(L.signs)} · <span id="flagCount">${num(0)}</span></span>
          <div class="stack" style="gap:8px" id="flags" aria-live="polite"></div>
        </section>` : ''}
      </div>
      <div id="warnSlot"></div>
      <footer class="call-controls">
        <button class="round small-round" data-action="mute" aria-pressed="${call.muted}" aria-label="${plain(L.mute)}">${icon('mic', 24)}</button>
        <button class="round end" data-action="hangup" aria-label="${plain(L.endCall)}">${icon('phone', 30, 'rot')}</button>
        <button class="round small-round" data-action="speaker" aria-pressed="${call.speaker}" aria-label="${plain(L.speaker)}">${icon('volume', 24)}</button>
      </footer>
    </div>`;
  }

  function warnBanner() {
    const title = tx({ en: D.warning.en.banner, bn: D.warning.bn.banner });
    const subline = lang() === 'both' ? L.bannerSub.en : tx(L.bannerSub);
    return `<section class="warn-banner" role="alert">
      <div class="row" style="align-items:flex-start">
        <div class="warn-icon">${icon('alert', 22)}</div>
        <div class="stack" style="gap:2px">
          <span style="font-size:17px;font-weight:700;color:var(--danger-ink)">${title}</span>
          <span style="font-size:14px;line-height:1.4;color:var(--ink-2)">${subline}</span>
        </div>
      </div>
      <div class="two-col">
        <a class="btn btn-outline-danger" href="#/warning" style="min-height:48px;font-size:15px">${pair(L.why)}</a>
        <button class="btn btn-danger" data-action="hangup" style="min-height:48px;font-size:15px">${pair(L.hangUp)}</button>
      </div>
    </section>`;
  }

  // The warning screen has its own language switch so it can be changed mid-call; it starts from the app language.
  function warning() {
    const wl = ui.warnLang || lang();
    const P = wl === 'en' ? D.warning.en : D.warning.bn;
    const A = wl === 'both' ? D.warning.en : null;
    const alt = (key) => (A ? `<span class="alt">${A[key]}</span>` : '');
    const reasons = activeReasons();

    const reasonHtml = reasons.map((r, i) => {
      const p = wl === 'en' ? r.en : r.bn;
      return `<article class="reason">
        <span class="num">${wl === 'bn' ? BN_DIGITS[i + 1] : i + 1}</span>
        <div class="stack" style="gap:4px">
          <span style="font-size:16px;font-weight:700;line-height:1.35">${p.title}${A ? `<br><span class="alt">${r.en.title}</span>` : ''}</span>
          <span style="font-size:14px;line-height:1.45;color:var(--ink-2)">${p.detail}</span>
          <span class="quote">${p.quote}${A ? `<br>${r.en.quote}` : ''}</span>
        </div>
      </article>`;
    }).join('');

    const safeTip = S.settings.safeWord ? `
      <div class="card tight row" style="border-color:#EBD9D5">
        <span style="color:var(--brand);display:flex">${icon('lock', 20)}</span>
        <span class="grow strong" style="font-size:15px">${P.safeWord}${alt('safeWord')}</span>
      </div>` : '';

    const sheet = ui.sheet ? `
      <div class="sheet-backdrop" data-action="close-sheet">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
          <h2 class="h3" id="sheetTitle" style="font-size:20px">${P.sheetTitle}</h2>
          <p class="body">${P.sheetBody}</p>
          ${A ? `<p class="small">${A.sheetBody}</p>` : ''}
          <button class="btn btn-primary lg" data-action="close-sheet">${P.sheetBack}</button>
          <button class="btn-link" data-action="continue-call">${P.sheetContinue}</button>
        </section>
      </div>` : '';

    return `<div class="screen alarm" lang="${wl === 'en' ? 'en' : 'bn'}">
      <header class="alarm-head">
        <button class="back" data-action="back-call">${icon('chevronLeft', 20)}${P.back}</button>
        ${langSeg(wl, 'wlang', 'alarm-seg')}
      </header>
      <main class="scroll" style="padding-top:8px;gap:18px">
        <section class="stack">
          <div class="row">
            <div class="alarm-icon">${icon('alert', 28)}</div>
            <span class="level-chip">${P.level}</span>
          </div>
          <h1 class="alarm-title">${P.headline}</h1>
          ${A ? `<p class="alt" style="font-size:16px;font-weight:600;margin-top:-4px">${A.headline}</p>` : ''}
          <p class="alarm-sub">${P.sub}</p>
          ${A ? `<p class="alt">${A.sub}</p>` : ''}
          <button class="speak-btn" data-action="speak">${icon('volume', 18)}${P.listen}</button>
        </section>
        <section class="stack">
          <h2 class="h3">${P.why}${A ? ` <span class="alt">· ${A.why}</span>` : ''}</h2>
          ${reasonHtml}
        </section>
        <section class="stack">
          <h2 class="h3">${P.todo}${A ? ` <span class="alt">· ${A.todo}</span>` : ''}</h2>
          <button class="btn btn-danger lg" data-action="hangup">${icon('phone', 22, 'rot')}${P.hangup}</button>
          <button class="btn btn-outline lg" data-action="verify" style="font-size:15px;font-weight:600">${icon('user', 20)}${P.verify}</button>
          ${S.settings.coach ? `<button class="btn btn-outline lg" data-action="coach-open" style="font-size:15px;font-weight:600">${icon('help', 20)}${P.coach}</button>` : ''}
          ${safeTip}
          <button class="btn-link" data-action="open-sheet">${P.trust}</button>
        </section>
      </main>
      ${sheet}
    </div>`;
  }

  function after() {
    const e = call.entry;
    const on = S.settings.live;
    const a = call.actions;
    const head = call.warned
      ? { cls: 'safe', ic: 'shieldCheck', title: L.safeTitle, body: L.safeBody }
      : { cls: 'neutral', ic: 'phone', title: L.endedTitle, body: on ? L.endedEarly : L.endedOff };

    const verifyCard = call.verify ? `
      <section class="card muted-card stack" style="gap:10px;padding:16px">
        <h2 class="h2" style="color:var(--brand)">${duo(L.verifyTitle)}</h2>
        <p class="body">${duo(L.verifyBody)}</p>
        <button class="btn btn-primary" data-action="call-saved">${icon('phone', 20)}${tx(L.verifyBtn)}</button>
      </section>` : '';

    const actionRow = (id, title, detail, label, doneLabel) => `
      <div class="list-row">
        <div class="grow stack" style="gap:0"><span class="strong" style="font-size:16px">${duo(title)}</span><span class="small">${tx(detail)}</span></div>
        <button class="btn btn-primary btn-pill" data-action="post" data-v="${id}" aria-pressed="${!!a[id]}">${tx(a[id] ? doneLabel : label)}</button>
      </div>`;

    const fb = call.fb;
    const chip = (kind, o) => `<button class="chip" data-action="fb" data-k="${kind}" data-v="${esc(o.v)}" aria-pressed="${fb[kind] === o.v}">${pair({ en: o.v, bn: o.bn })}</button>`;
    const feedback = on ? `
      <section class="card stack" style="gap:12px;padding:16px">
        <h2 class="h3" style="font-size:17px">${duo(call.warned ? L.fbQ1Warn : L.fbQ1)}</h2>
        <div class="chips${lang() === 'both' ? '' : ' grid3'}" role="group" aria-label="${plain(L.fbQ1)}">${D.helpOptions.map((o) => chip('help', o)).join('')}</div>
        <h2 class="h3" style="font-size:17px;margin-top:4px">${duo(L.fbQ2)}</h2>
        <div class="chips" role="group" aria-label="${plain(L.fbQ2)}">${D.reasonOptions.map((o) => chip('reason', o)).join('')}</div>
        ${fb.help && fb.reason ? `<p class="thanks">${duo(L.thanks)}</p>` : ''}
      </section>` : '';

    return `<div class="screen">
      <main class="scroll" style="padding-top:calc(40px + env(safe-area-inset-top));gap:18px">
        <section class="stack center" style="gap:8px">
          <div class="big-badge ${head.cls}">${icon(head.ic, 36)}</div>
          <span class="small" style="font-size:14px">${tx(L.callEnded)} · ${fmt(call.secs)} · ${esc(e.name)}</span>
          <h1 style="font-size:26px;font-weight:700;line-height:1.3">${duo(head.title)}</h1>
          <p class="body" style="font-size:16px">${duo(head.body)}</p>
        </section>
        ${verifyCard}
        <section class="card list">
          <h2 class="eyebrow">${pair(L.nextSteps)}</h2>
          ${actionRow('block', L.blockT, L.blockD, L.blockL, L.blockDone)}
          ${actionRow('report', L.reportT, L.reportD, L.reportL, L.reportDone)}
          ${actionRow('family', L.familyT, L.familyD, L.familyL, L.familyDone)}
        </section>
        ${feedback}
        <button class="btn btn-primary lg" data-action="done">${pair(L.done)}</button>
      </main>
    </div>`;
  }

  function calls() {
    const f = ui.filter;
    const list = S.calls.filter((c) => f === 'All' || (f === 'Flagged' ? c.kind !== 'safe' : c.kind === 'safe'));
    const rows = list.map((c) => {
      const b = badgeOf(c);
      const name = tx(c.name);
      const initial = name.startsWith('+') ? '?' : Array.from(name)[0];
      return `<li${c.id === ui.freshId ? ' class="fresh"' : ''}>
        <div class="av ${c.kind === 'safe' ? '' : c.kind}">${esc(initial)}</div>
        <div class="grow stack" style="gap:1px">
          <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
            <span class="strong ellipsis" style="font-size:15px">${nameOf(c)}</span>
            <span class="small" style="font-size:12px;flex-shrink:0">${timeOf(c)}</span>
          </div>
          <span class="small">${noteOf(c)}</span>
          <span class="badge ${b.cls}">${b.label}</span>
        </div>
      </li>`;
    }).join('');
    ui.freshId = null;
    const chip = (v, label) => `<button class="chip" data-action="filter" data-v="${v}" aria-pressed="${f === v}">${tx(label)}</button>`;

    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <h1 class="title">${duo(L.callsTitle)}</h1>
        <div class="chips" role="group" aria-label="${plain(L.filterCalls)}">${chip('All', L.fAll)}${chip('Flagged', L.fFlagged)}${chip('Safe', L.fSafe)}</div>
        ${rows ? `<ul class="log">${rows}</ul>` : `<p class="empty">${duo(L.noCalls)}</p>`}
      </main>
      ${tabbar('calls')}
    </div>`;
  }

  function learn() {
    const cards = D.tactics.map((k, i) => `
      <article class="tactic" data-open="${i === 0}">
        <button data-action="tactic" aria-expanded="${i === 0}">
          <span class="n">${num(i + 1)}</span>
          <span class="grow stack" style="gap:0">
            <span style="font-size:16px;font-weight:700">${tx(k)}</span>
            ${lang() === 'both' ? `<span class="small">${k.en}</span>` : ''}
          </span>
          ${icon('chevronDown', 20, 'chev')}
        </button>
        <div class="more">
          <p class="body" style="font-size:14px">${duo(k.what)}</p>
          <span class="quote">${lang() === 'en' ? k.example.en : k.example.bn}${lang() === 'both' ? `<br>${k.example.en}` : ''}</span>
          <div class="todo">${icon('check', 18)}<span>${duo(k.todo)}</span></div>
        </div>
      </article>`).join('');

    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <header class="stack" style="gap:4px">
          <h1 class="title">${tx(L.learnTitle)}</h1>
          ${lang() === 'both' ? `<span style="font-size:15px;font-weight:600;color:var(--muted)">${L.learnTitle.en}</span>` : ''}
          <p class="body" style="margin-top:4px">${duo(L.learnIntro)}</p>
        </header>
        <section class="card stack" style="gap:12px;padding:16px">
          <h2 class="h2">${duo(L.scriptTitle)}</h2>
          <ol class="script-steps">
            ${D.scenario.stages.map((s, i) => `<li><span class="n">${num(i + 1)}</span><span class="stack" style="gap:0"><span class="strong" style="font-size:14px">${tx(s)}</span>${lang() === 'both' ? `<span class="small" style="font-size:12px">${s.en}</span>` : ''}</span></li>`).join('')}
          </ol>
          <p class="body" style="font-size:14px">${duo(L.scriptBody)}</p>
        </section>
        ${cards}
        <a class="card brand" href="#/settings" style="padding:16px;color:#FFFFFF">
          ${icon('lock', 26)}
          <span class="grow stack" style="gap:0">
            <span style="font-size:16px;font-weight:700">${duo(S.settings.safeWord ? L.safeIsSet : L.safeSetUp)}</span>
            <span style="font-size:13px;color:var(--brand-on)">${tx(L.safeWhy)}</span>
          </span>
          ${icon('chevronRight', 18)}
        </a>
      </main>
      ${tabbar('learn')}
    </div>`;
  }

  function settings() {
    const st = S.settings;
    const sw = (key, label, detail) => `
      <div class="list-row">
        <div class="grow stack" style="gap:0"><span class="strong" style="font-size:15px">${duo(label)}</span><span class="small">${tx(detail)}</span></div>
        <button class="switch" data-action="toggle" data-k="${key}" aria-pressed="${!!st[key]}" aria-label="${plain(label)}"></button>
      </div>`;

    const safeEditor = ui.editingSafe ? `
      <div class="stack" style="gap:8px">
        <label for="safe-word" style="font-size:13px;font-weight:600;color:var(--ink-2)">${tx(L.safeLabel)}</label>
        <div class="row" style="gap:8px">
          <input id="safe-word" class="text-input" type="text" autocomplete="off" value="${esc(ui.safeDraft)}" placeholder="${esc(tx(L.safePh))}">
          <button class="btn btn-primary" data-action="safe-save" style="min-height:46px;border-radius:12px;font-size:14px">${tx(L.save)}</button>
        </div>
      </div>` : '';

    const fbCount = S.feedback.length;
    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <h1 class="title">${duo(L.setTitle)}</h1>
        <section class="card stack" style="gap:10px;padding:16px">
          <div class="row" style="gap:8px;align-items:flex-start">
            <div class="grow stack" style="gap:2px">
              <h2 class="strong" style="font-size:16px">${duo(L.appLang)}</h2>
              <span class="small">${tx(L.appLangD)}</span>
            </div>
          </div>
          ${langSeg(st.lang, 'lang')}
        </section>
        <section class="card list">
          <h2 class="eyebrow">${pair(L.protection)}</h2>
          ${sw('live', L.live, L.liveD)}
          ${sw('voice', L.voice, L.voiceD)}
          ${sw('contacts', L.contacts, L.contactsD)}
        </section>
        <section class="card list">
          <h2 class="eyebrow">${pair(L.smart)}</h2>
          ${sw('predict', L.predict, L.predictD)}
          ${sw('otpGuard', L.otpGuard, L.otpGuardD)}
          ${sw('coach', L.coach, L.coachD)}
        </section>
        <section class="card list">
          <h2 class="eyebrow">${pair(L.warnings)}</h2>
          ${sw('speak', L.speak, L.speakD)}
          ${sw('vibrate', L.vibrate, L.vibrateD)}
        </section>
        <section class="card list" style="padding-bottom:14px">
          <h2 class="eyebrow">${pair(L.family)}</h2>
          <div class="list-row" style="flex-direction:column;align-items:stretch;gap:10px">
            <div class="row">
              <div class="grow stack" style="gap:0">
                <span class="strong" style="font-size:15px">${duo(L.safeWord)}</span>
                <span class="small">${tx(st.safeWord ? L.safeOn : L.safeOff)}</span>
              </div>
              <button class="btn btn-outline btn-pill" data-action="safe-edit">${tx(ui.editingSafe ? L.cancel : (st.safeWord ? L.change : L.setUp))}</button>
            </div>
            ${safeEditor}
          </div>
          <div class="list-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <span class="strong" style="font-size:15px">${duo(L.trusted)}</span>
            <span class="small">${tx(L.trustedD)}</span>
            <div class="chips">${D.trustedContacts.map((c) => `<span class="tag">${esc(tx(c))}</span>`).join('')}</div>
          </div>
        </section>
        <section class="card muted-card row" style="align-items:flex-start;padding:16px">
          <span style="color:var(--brand);display:flex;margin-top:2px">${icon('lock', 22)}</span>
          <div class="stack" style="gap:4px">
            <span style="font-size:15px;font-weight:700;color:var(--brand)">${duo(L.privacy)}</span>
            <span class="body" style="font-size:14px">${tx(L.privacyD)}</span>
          </div>
        </section>
        <section class="card stack" style="gap:10px;padding:16px">
          <h2 class="eyebrow">${pair(L.study)}</h2>
          <p class="body" style="font-size:14px">${lang() === 'en' ? `${fbCount} ${(fbCount === 1 ? L.studyD1 : L.studyD).en}` : `${num(fbCount)}${L.studyD.bn}`}</p>
          <div class="two-col">
            <button class="btn btn-outline" data-action="export" style="font-size:14px">${icon('download', 18)}${tx(L.csv)}</button>
            <button class="btn btn-outline-danger" data-action="reset" style="font-size:14px">${tx(L.reset)}</button>
          </div>
        </section>
      </main>
      ${tabbar('settings')}
    </div>`;
  }

  // ---------- Demo call simulation ----------
  function callState() {
    const sc = D.scenario;
    const st = S.settings;
    const step = Math.min(LAST_STEP, Math.floor(call.secs / SECONDS_PER_STEP));
    const flags = [];
    for (let i = 0; i <= step; i++) {
      sc.flagsByStep[i].forEach((f) => {
        if (f.voice && !st.voice) return;
        if (f.otp && !st.otpGuard) return;
        flags.push(Object.assign({ t: i * SECONDS_PER_STEP }, f));
      });
    }
    if (call.dodge) flags.push(Object.assign({ t: call.dodge.at }, sc.dodgeFlag));
    flags.sort((a, b) => a.t - b.t);
    let risk = (st.voice ? sc.riskByStep : sc.riskByStepNoVoice)[step];
    if (call.dodge) risk = Math.min(99, risk + 10);
    // Right after a check question, the caller's dodge replaces the scripted line for a moment.
    const dodging = call.dodge && call.secs - call.dodge.at <= SECONDS_PER_STEP;
    const line = dodging ? sc.dodgeLine : sc.lines[step];
    const stage = Math.min(step, sc.stages.length - 1);
    return { step, flags, risk, line, stage };
  }
  function activeReasons() {
    return D.warning.reasons.filter((r) => (S.settings.voice || !r.voice) && (!r.otp || (call && call.otpArrived)));
  }
  function predictHtml(stage) {
    const sc = D.scenario;
    const p = sc.predictions[stage];
    const total = sc.stages.length;
    const head = {
      en: `Scam script · stage ${stage + 1} of ${total}: ${sc.stages[stage].en}`,
      bn: `প্রতারণার ছক · ধাপ ${num(stage + 1)}/${num(total)}: ${sc.stages[stage].bn}`
    };
    const bars = sc.stages.map((s, i) =>
      `<div class="stage${i < stage ? ' done' : i === stage ? ' now' : ''}"><span class="bar"></span><span class="lbl">${tx(s)}</span></div>`).join('');
    return `
      <div class="row" style="gap:8px;align-items:flex-start">
        <span style="color:#9CCFE0;display:flex">${icon('eye', 18)}</span>
        <span class="strong grow" style="font-size:14px;color:var(--dark-ink-2)">${duo(head)}</span>
      </div>
      <div class="stages" aria-hidden="true">${bars}</div>
      <span class="eyebrow" style="margin-top:4px">${pair(L.likelyNext)}</span>
      <p class="predict-text">${tx(p)}</p>
      ${lang() === 'both' ? `<p class="small" style="font-size:14px">${p.en}</p>` : ''}
      ${stage > 0 ? `<span class="came-true">${icon('check', 16)}${pair(L.cameTrue)}</span>` : ''}`;
  }
  function riskLevel(r) {
    if (r < 35) return [L.riskLow, '#5FB38A'];
    if (r < 60) return [L.riskMedium, '#E8A33D'];
    if (r < 85) return [L.riskHigh, '#F07A3A'];
    return [L.riskVeryHigh, '#F2555A'];
  }
  function updateCall() {
    if (lastRoute !== 'call' && requested() !== 'call') return;
    if (!call || !call.active) return;
    const $ = (id) => document.getElementById(id);
    if (!$('clock')) return;
    const { flags, risk, line, stage } = callState();

    $('clock').textContent = fmt(call.secs);
    if ($('lineMain').textContent !== tx(line)) {
      $('lineMain').textContent = tx(line);
      $('lineAlt').textContent = lang() === 'both' ? line.en : '';
    }
    if (!S.settings.live) return;

    const lv = riskLevel(risk);
    $('riskFill').style.width = risk + '%';
    $('riskFill').style.background = lv[1];
    $('riskLabel').textContent = tx(lv[0]);
    $('riskLabel').style.color = lv[1];
    $('riskMeter').setAttribute('aria-valuenow', risk);
    $('riskMeter').setAttribute('aria-valuetext', plain(lv[0]));

    if ($('predict') && call.shownStage !== stage) {
      $('predict').innerHTML = predictHtml(stage);
      call.shownStage = stage;
    }

    if (flags.length !== call.shownFlags) {
      const prev = call.shownFlags < 0 ? flags.length : call.shownFlags;
      const fresh = flags.length - prev;
      $('flags').innerHTML = flags.slice().reverse().map((f, i) => `
        <div class="flag${i < fresh ? ' new' : ''}">
          <span class="bullet" style="background:${FLAG_COLORS[f.level]}"></span>
          <div class="stack" style="gap:1px">
            <span style="font-size:15px;font-weight:600">${tx(f)}</span>
            ${lang() === 'both' ? `<span class="small">${f.en}</span>` : ''}
          </div>
        </div>`).join('');
      $('flagCount').textContent = num(flags.length);
      call.shownFlags = flags.length;
    }

    const slot = $('warnSlot');
    if (call.warned && !slot.firstElementChild) slot.innerHTML = warnBanner();
    if (!call.warned && slot.firstElementChild) slot.innerHTML = '';
  }
  function onWarn() {
    const st = S.settings;
    if (st.vibrate && navigator.vibrate) {
      try { navigator.vibrate([400, 150, 400, 150, 600]); } catch (e) { /* ignore */ }
    }
    if (st.speak) speak(speakParts({ lang: st.lang, bn: D.warning.bn.spoken, en: D.warning.en.spoken }));
  }
  function onOtp() {
    const st = S.settings;
    if (st.vibrate && navigator.vibrate) {
      try { navigator.vibrate([800, 200, 800, 200, 800]); } catch (e) { /* ignore */ }
    }
    if (st.speak) speak(speakParts(Object.assign({ lang: st.lang }, D.otpAlert.spoken)));
    syncOverlays();
    const title = document.getElementById('otpTitle');
    if (title) title.focus({ preventScroll: true });
  }
  function tick() {
    call.secs += 1;
    const { step } = callState();
    const st = S.settings;
    if (st.live && !call.warned && step >= WARN_STEP) {
      call.warned = true;
      onWarn();
    }
    if (st.live && st.otpGuard && !call.otpArrived && step >= OTP_STEP) {
      call.otpArrived = true;
      call.otpOpen = true;
      onOtp();
    }
    updateCall();
  }

  // ---------- Overlays shown on top of the call and warning screens ----------
  function otpHtml() {
    const o = D.otpAlert;
    return `<div class="overlay otp-alarm" role="alertdialog" aria-modal="true" aria-labelledby="otpTitle">
      <div class="sms">
        <div class="row" style="gap:10px">
          <span class="sms-icon">${icon('message', 16)}</span>
          <span class="strong grow" style="font-size:14px">${tx(o.sender)}</span>
          <span class="small" style="font-size:12px">${tx(L.now)}</span>
        </div>
        <p style="font-size:14px;line-height:1.45;margin-top:6px">${tx(o.sms)}</p>
      </div>
      <div class="otp-body">
        <div class="otp-icon">${icon('lock', 32)}</div>
        <h2 id="otpTitle" class="otp-title" tabindex="-1">${tx(o.title)}</h2>
        ${lang() === 'both' ? `<p class="otp-en">${o.title.en}</p>` : ''}
        <p class="otp-detail">${tx(o.detail)}</p>
        ${S.settings.predict ? `<span class="came-true light">${icon('check', 16)}${tx(L.predictedThis)}</span>` : ''}
      </div>
      <div class="stack otp-actions">
        <button class="btn btn-light lg" data-action="hangup" style="color:var(--danger-ink)">${icon('phone', 22, 'rot')}${pair(L.otpHangUp)}</button>
        <button class="btn btn-ghost-light" data-action="otp-dismiss">${pair(L.otpKeep)}</button>
      </div>
    </div>`;
  }
  function coachHtml() {
    const c = D.coach;
    const hasWord = !!S.settings.safeWord;
    const rows = c.questions.filter((q) => !q.safeWord || hasWord).map((q) => `
      <div class="coach-q">
        <div class="grow stack" style="gap:2px">
          <span class="strong" style="font-size:16px;line-height:1.4">${tx(q)}</span>
          ${lang() === 'both' ? `<span class="small">${q.en}</span>` : ''}
          ${q.tip ? `<span class="small" style="color:var(--brand)">${tx(q.tip)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-pill" data-action="coach-ask" data-v="${q.id}" aria-pressed="${!!call.asked[q.id]}">${tx(call.asked[q.id] ? L.asked : L.ask)}</button>
      </div>`).join('');
    return `<div class="overlay sheet-backdrop" data-action="coach-close">
      <section class="sheet coach-sheet" role="dialog" aria-modal="true" aria-labelledby="coachTitle">
        <h2 class="h3" id="coachTitle" tabindex="-1" style="font-size:20px">${duo(c.title)}</h2>
        <p class="body">${duo(c.intro)}</p>
        ${rows}
        ${hasWord ? '' : `<p class="small">${tx(L.coachTip)}</p>`}
        <button class="btn btn-outline" data-action="coach-close">${pair(L.close)}</button>
      </section>
    </div>`;
  }
  function syncOverlays() {
    app.querySelectorAll('.overlay').forEach((el) => el.remove());
    const r = resolve(requested());
    if (!call || !call.active || (r !== 'call' && r !== 'warning')) return;
    let html = '';
    if (ui.coach) html += coachHtml();
    if (call.otpOpen) html += otpHtml();
    if (html) app.insertAdjacentHTML('beforeend', html);
  }

  function stopTimer() { if (call && call.timer) { clearInterval(call.timer); call.timer = null; } }
  function freshCallState() {
    return {
      secs: 0, warned: false, otpArrived: false, otpOpen: false, dodge: null, asked: {},
      shownFlags: -1, shownStage: -1
    };
  }
  function startCall() {
    stopTimer();
    call = Object.assign(freshCallState(), { active: true, muted: false, speaker: false, actions: {}, fb: {}, verify: false, timer: null });
    call.timer = setInterval(tick, 1000);
    ui.warnLang = null;
    ui.sheet = false;
    ui.coach = false;
    go('call');
  }
  function hangUp(verify) {
    stopTimer();
    stopSpeech();
    const on = S.settings.live;
    const { flags } = callState();
    const kind = !on ? 'safe' : call.warned ? 'scam' : flags.length ? 'warn' : 'safe';
    const note = !on ? L.noteUnchecked : call.otpArrived ? L.noteOtp : call.warned ? L.noteWarned : L.noteEarly;
    const entry = { id: 'c' + Date.now(), name: D.scenario.number, note, time: { day: 'today', hm: clockNow() }, kind, unchecked: !on };
    S.calls.unshift(entry);
    save();
    call.active = false;
    call.entry = entry;
    call.verify = !!verify;
    call.otpOpen = false;
    ui.freshId = entry.id;
    ui.sheet = false;
    ui.coach = false;
    go('after');
  }
  function saveFeedback() {
    const fb = call.fb;
    if (!fb.help || !fb.reason) return;
    const row = {
      time: new Date().toISOString(),
      helped: fb.help,
      reason: fb.reason,
      warned: call.warned,
      callSeconds: call.secs,
      language: S.settings.lang,
      voiceCheck: S.settings.voice,
      prediction: S.settings.predict,
      codeAlarm: S.settings.otpGuard,
      coach: S.settings.coach,
      codeArrived: !!call.otpArrived,
      askedCheckQuestion: Object.keys(call.asked).length > 0
    };
    if (call.fbIndex === undefined) { S.feedback.push(row); call.fbIndex = S.feedback.length - 1; }
    else S.feedback[call.fbIndex] = row;
    save();
  }
  function exportCsv() {
    if (!S.feedback.length) { toast(L.tNoFb); return; }
    const cols = ['time', 'helped', 'reason', 'warned', 'callSeconds', 'language', 'voiceCheck',
      'prediction', 'codeAlarm', 'coach', 'codeArrived', 'askedCheckQuestion'];
    const cell = (v) => '"' + String(v === undefined ? '' : v).replace(/"/g, '""') + '"';
    const csv = [cols.join(',')].concat(S.feedback.map((r) => cols.map((c) => cell(r[c])).join(','))).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'callshield-feedback.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- Actions ----------
  const actions = {
    'start-demo': () => go('incoming'),
    'enable-live': () => { S.settings.live = true; save(); render(); },
    decline: () => go('home'),
    accept: startCall,
    replay: () => { stopSpeech(); Object.assign(call, freshCallState()); ui.coach = false; render(); },
    'coach-open': () => {
      ui.coach = true;
      syncOverlays();
      const t = document.getElementById('coachTitle');
      if (t) t.focus({ preventScroll: true });
    },
    'coach-close': (el, ev) => {
      if (el.classList.contains('sheet-backdrop') && ev.target !== el) return; // clicks inside the sheet
      ui.coach = false;
      syncOverlays();
    },
    'coach-ask': (el) => {
      call.asked[el.dataset.v] = true;
      if (!call.dodge) call.dodge = { at: call.secs };
      ui.coach = false;
      syncOverlays();
      updateCall();
      toast(L.tDodge);
    },
    'otp-dismiss': () => {
      call.otpOpen = false;
      syncOverlays();
      toast(L.tKeep);
    },
    hangup: () => hangUp(false),
    verify: () => hangUp(true),
    mute: (el) => { call.muted = !call.muted; el.setAttribute('aria-pressed', call.muted); },
    speaker: (el) => { call.speaker = !call.speaker; el.setAttribute('aria-pressed', call.speaker); },
    'back-call': () => { stopSpeech(); go('call'); },
    wlang: (el) => { ui.warnLang = el.dataset.v; stopSpeech(); render(); },
    speak: () => {
      const wl = ui.warnLang || lang();
      const reasons = activeReasons();
      const build = (l) => {
        const P = D.warning[l];
        return [P.headline, P.sub].concat(reasons.map((r) => r[l].title), [P.hangup]).join(l === 'bn' ? '। ' : '. ');
      };
      speak(speakParts({ lang: wl, bn: build('bn'), en: build('en') }));
    },
    'open-sheet': () => { ui.sheet = true; render(); },
    'close-sheet': (el, ev) => {
      if (el.classList.contains('sheet-backdrop') && ev.target !== el) return; // clicks inside the sheet
      ui.sheet = false;
      render();
    },
    'continue-call': () => { ui.sheet = false; go('call'); },
    'call-saved': () => toast(L.tCallSaved),
    post: (el) => {
      const id = el.dataset.v;
      const on = !call.actions[id];
      call.actions[id] = on;
      if (id === 'block') { call.entry.blocked = on; save(); }
      render();
      if (on && id === 'report') toast(L.tReport);
      if (on && id === 'family') toast(L.tFamily);
    },
    fb: (el) => { call.fb[el.dataset.k] = el.dataset.v; saveFeedback(); render(); },
    done: () => go('home'),
    filter: (el) => { ui.filter = el.dataset.v; render(); },
    tactic: (el) => {
      const card = el.closest('.tactic');
      const open = card.dataset.open !== 'true';
      app.querySelectorAll('.tactic').forEach((t) => {
        t.dataset.open = 'false';
        t.querySelector('button').setAttribute('aria-expanded', 'false');
      });
      card.dataset.open = String(open);
      el.setAttribute('aria-expanded', String(open));
    },
    toggle: (el) => { const k = el.dataset.k; S.settings[k] = !S.settings[k]; save(); render(); },
    lang: (el) => { S.settings.lang = el.dataset.v; save(); render(); },
    'safe-edit': () => {
      ui.editingSafe = !ui.editingSafe;
      ui.safeDraft = S.settings.safeWord;
      render();
      if (ui.editingSafe) { const i = document.getElementById('safe-word'); if (i) i.focus(); }
    },
    'safe-save': () => {
      S.settings.safeWord = ui.safeDraft.trim();
      ui.editingSafe = false;
      save();
      render();
      toast(S.settings.safeWord ? L.tSafeSaved : L.tSafeRemoved);
    },
    export: exportCsv,
    reset: () => {
      if (!window.confirm(plain(L.confirmReset))) return;
      stopTimer();
      call = null;
      const keepLang = S.settings.lang;
      S = defaults();
      S.settings.lang = keepLang;
      save();
      Object.assign(ui, { filter: 'All', sheet: false, coach: false, warnLang: null, editingSafe: false, safeDraft: '' });
      render();
      toast(L.tReset);
    }
  };

  app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el || !app.contains(el)) return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el, ev);
  });
  app.addEventListener('input', (ev) => {
    if (ev.target.id === 'safe-word') ui.safeDraft = ev.target.value;
  });
  app.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'safe-word' && ev.key === 'Enter') actions['safe-save']();
    if (ev.key === 'Escape' && ui.coach) { ui.coach = false; syncOverlays(); return; }
    if (ev.key === 'Escape' && ui.sheet) { ui.sheet = false; render(); }
  });
  window.addEventListener('hashchange', render);

  // Voices load asynchronously in some browsers; touching the list early warms it up.
  try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (e) { /* ignore */ }

  if ('serviceWorker' in navigator && window.isSecureContext && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }

  render();
})();
