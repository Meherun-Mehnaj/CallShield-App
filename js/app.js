/* CallShield app: hash router, screens, demo-call simulation and on-device storage. */
(function () {
  'use strict';

  const D = window.CS_DATA;
  const SCENARIOS = window.CS_SCENARIOS;
  const ICONS = window.CS_ICONS;
  const STORE_KEY = 'callshield.v1';
  const SECONDS_PER_STEP = 3;
  const WARN_STEP = 4;   // warning banner appears (12 s)
  const OTP_STEP = 5;    // fake bKash code SMS arrives (15 s)
  const LAST_STEP = 5;
  const FLAG_COLORS = { medium: '#E8A33D', high: '#F07A3A', critical: '#F2555A' };

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
  const fmt = (secs) => pad(Math.floor(secs / 60)) + ':' + pad(secs % 60);
  function clockNow() { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------- Persistent state (this device only) ----------
  function defaults() {
    return {
      settings: {
        live: true, voice: true, contacts: true,
        predict: true, otpGuard: true, coach: true,
        speak: true, vibrate: true, lang: 'both', safeWord: ''
      },
      calls: D.seedCalls.map((c) => Object.assign({}, c)),
      feedback: []
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const d = defaults();
        return { settings: Object.assign(d.settings, saved.settings), calls: saved.calls || d.calls, feedback: saved.feedback || [] };
      }
    } catch (e) { /* storage unavailable: fall back to defaults */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }
  let S = load();

  // Transient UI state
  const ui = { filter: 'All', sheet: false, coach: false, warnLang: null, editingSafe: false, safeDraft: '', freshId: null, sid: SCENARIOS[0].id };
  let call = null; // the running call, or the one that just ended
  let lastRoute = null;
  let toastTimer = null;

  // The demo scam call in use: the running (or last) call's, else the one picked on Home.
  function sc() {
    const id = call ? call.sid : ui.sid;
    return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  }
  const alertOf = (s) => Object.assign({}, D.otpAlert, s.alert || {});
  // Shared warning-screen text plus this scenario's own headline, banner, verify line and so on.
  const warnText = (s, l) => Object.assign({}, D.warnUI[l], s.warning[l]);

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
    const tabs = [['home', 'Home', 'home'], ['calls', 'Calls', 'clock'], ['learn', 'Learn', 'book'], ['settings', 'Settings', 'sliders']];
    return `<nav class="tabbar" aria-label="Main">${tabs.map(([r, label, ic]) =>
      `<a class="tab" href="#/${r}"${r === active ? ' aria-current="page"' : ''}>${icon(ic, 22)}${label}</a>`).join('')}</nav>`;
  }
  function badgeOf(c) {
    if (c.kind === 'scam') return { cls: 'scam', label: c.blocked ? 'Scam · blocked' : 'Scam' };
    if (c.kind === 'warn') return { cls: 'warn', label: c.blocked ? 'Suspicious · blocked' : 'Suspicious' };
    if (c.unchecked) return { cls: 'neutral', label: 'Not checked' };
    return { cls: 'safe', label: 'No issues' };
  }
  function toast(msg) {
    const old = app.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    app.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }
  function speak(parts) {
    if (!('speechSynthesis' in window)) { toast('Read aloud is not supported in this browser.'); return; }
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
    if (noBangla) toast('This device has no Bangla voice, so Bangla may not be read correctly.');
  }
  function stopSpeech() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

  // ---------- Screens ----------
  function home() {
    const st = S.settings;
    const flagged = S.calls.filter((c) => c.kind !== 'safe').length;
    const blocked = S.calls.filter((c) => c.blocked).length;
    const recent = S.calls.find((c) => c.kind !== 'safe');

    const status = st.live ? `
      <section class="card brand stack" style="gap:12px">
        <div class="row" style="gap:10px">${icon('shieldCheck', 28)}<h2 class="h2" style="font-size:19px">Protection is on</h2></div>
        <p style="font-size:15px;line-height:1.45">CallShield listens for scam signals during calls and warns you in plain Bangla if something is wrong.</p>
        <div class="row" style="gap:8px;font-size:13px;color:var(--brand-on)">${icon('lock', 16)}<span>Audio is checked on your phone and never saved</span></div>
      </section>` : `
      <section class="card off stack" style="gap:12px">
        <div class="row" style="gap:10px;color:var(--ink-2)">${icon('shieldOff', 28)}<h2 class="h2" style="font-size:19px">Protection is off</h2></div>
        <p class="body">Calls are not being checked for scams right now.</p>
        <button class="btn btn-primary" data-action="enable-live">Turn protection on</button>
      </section>`;

    const recentCard = recent ? `
      <a class="card tight" href="#/calls">
        <div class="dot-icon ${recent.kind === 'scam' ? 'danger' : 'warn'}">${icon('alert', 20)}</div>
        <div class="grow stack" style="gap:2px">
          <span class="strong" style="font-size:15px">${recent.kind === 'scam' ? (recent.blocked ? 'Scam call blocked' : 'Scam call detected') : 'Suspicious call'}</span>
          <span class="small">${esc(recent.note)} · ${esc(recent.time)}</span>
        </div>
        <span style="color:var(--muted);display:flex">${icon('chevronRight', 18)}</span>
      </a>` : '';

    return `<div class="screen">
      <main class="scroll">
        <header class="row">
          <div class="logo">${icon('shield', 22)}</div>
          <div class="stack" style="gap:0">
            <h1 style="font-family:var(--display);font-size:21px;font-weight:700;letter-spacing:-0.02em">CallShield</h1>
            <span class="small">কলশিল্ড · scam call warnings</span>
          </div>
        </header>
        ${status}
        <section class="card stack" style="gap:6px;padding:16px 16px 8px">
          <h2 class="h2">Try a demo scam call</h2>
          <p class="body" style="font-size:14px">Choose who is calling. See how CallShield spots the trick and warns you.</p>
          <ul class="demo-list">
            ${SCENARIOS.map((s) => `
            <li>
              <button class="demo-pick" data-action="start-demo" data-v="${s.id}">
                <span class="demo-icon">${icon(s.icon, 20)}</span>
                <span class="grow stack" style="gap:1px">
                  <span class="strong" style="font-size:16px">${s.title.bn}</span>
                  <span class="small">${s.title.en} · ${s.blurb.en}</span>
                </span>
                <span class="demo-go">${icon('phone', 18)}</span>
              </button>
            </li>`).join('')}
          </ul>
        </section>
        <section class="stack">
          <h2 class="eyebrow">This week</h2>
          <div class="stats">
            <div class="stat"><b>${S.calls.length}</b><span>calls checked</span></div>
            <div class="stat warn"><b>${flagged}</b><span>warnings</span></div>
            <div class="stat danger"><b>${blocked}</b><span>blocked</span></div>
          </div>
        </section>
        ${recentCard}
        <section class="card muted-card stack" style="gap:6px;padding:16px">
          <span class="eyebrow" style="color:var(--brand)">Remember</span>
          <p class="bn-big">বিকাশ, নগদ বা ব্যাংক কখনো ফোনে পিন বা ওটিপি চায় না।</p>
          <p class="body" style="font-size:14px">bKash, Nagad and banks never ask for your PIN or OTP on a call.</p>
        </section>
      </main>
      ${tabbar('home')}
    </div>`;
  }

  function incoming() {
    const on = S.settings.live;
    return `<div class="screen dark">
      <div class="call-top">
        <span class="small" style="font-size:15px">Incoming call</span>
        <div class="avatar-ring">${icon('user', 48)}</div>
        <h1 class="caller-number">${sc().number}</h1>
        <span class="small" style="font-size:15px;margin-top:6px">Mobile · Not in your contacts</span>
      </div>
      <section class="shield-note">
        <div class="shield-badge"${on ? '' : ' style="background:var(--dark-4)"'}>${icon(on ? 'shield' : 'shieldOff', 20)}</div>
        <div class="stack" style="gap:4px">
          <span class="strong" style="font-size:15px">${on ? 'CallShield is ready' : 'CallShield is off'}</span>
          <span style="font-size:14px;line-height:1.45;color:var(--dark-ink-2)">${on ? 'অচেনা নাম্বার। কথা বলার সময় আমরা কলটি পরীক্ষা করব।' : 'এই কলটি পরীক্ষা করা হবে না।'}</span>
          <span class="small">${on ? 'Unknown number. We will check this call while you talk.' : 'This call will not be checked. Turn protection on in Settings.'}</span>
        </div>
      </section>
      <div class="answer-row">
        <div class="round-label"><button class="round end" data-action="decline" aria-label="Decline call">${icon('phone', 30, 'rot')}</button>Decline</div>
        <div class="round-label"><button class="round accept" data-action="accept" aria-label="Accept call">${icon('phone', 30)}</button>Accept</div>
      </div>
    </div>`;
  }

  function callScreen() {
    const on = S.settings.live;
    return `<div class="screen dark">
      <header class="call-head">
        <div class="stack" style="gap:2px">
          <h1>${sc().number}</h1>
          <span class="small" style="font-size:14px">On call · <span id="clock">00:00</span></span>
          <span class="demo-tag">Demo: ${sc().title.en}</span>
        </div>
        <button class="btn btn-ghost-dark" data-action="replay">Replay demo</button>
      </header>
      <div class="call-body">
        ${on ? `
        <section class="card dark stack" style="padding:16px">
          <div class="row" style="gap:8px">
            <span style="color:#9CCFE0;display:flex">${icon('shield', 18)}</span>
            <span class="strong grow" style="font-size:14px;color:var(--dark-ink-2)">CallShield is listening</span>
            <span class="pulse"></span>
          </div>
          <div class="row" style="justify-content:space-between;align-items:baseline">
            <span class="small" style="font-size:14px">Scam risk</span>
            <span class="risk-label" id="riskLabel">Low</span>
          </div>
          <div class="meter" id="riskMeter" role="meter" aria-label="Scam risk" aria-valuemin="0" aria-valuemax="100"><div id="riskFill"></div></div>
        </section>` : `
        <section class="card dark row" style="padding:16px;color:var(--dark-muted)">${icon('shieldOff', 20)}<span style="font-size:14px">CallShield is off. This call is not being checked.</span></section>`}
        <section class="card dark stack" style="padding:16px;gap:6px">
          <span class="eyebrow">Caller is saying</span>
          <p class="saying" id="lineBn"></p>
          <p class="small" style="font-size:14px" id="lineEn"></p>
        </section>
        ${on && S.settings.predict ? `
        <section class="card dark stack predict-card" id="predict" aria-live="polite"></section>` : ''}
        ${on && S.settings.coach ? `
        <button class="btn btn-coach" data-action="coach-open">${icon('help', 20)}কী জিজ্ঞেস করবেন? · What to ask them</button>` : ''}
        ${on ? `
        <section class="stack" style="gap:8px">
          <span class="eyebrow">Signs we noticed · <span id="flagCount">0</span></span>
          <div class="stack" style="gap:8px" id="flags" aria-live="polite"></div>
        </section>` : ''}
      </div>
      <div id="warnSlot"></div>
      <footer class="call-controls">
        <button class="round small-round" data-action="mute" aria-pressed="${call.muted}" aria-label="Mute">${icon('mic', 24)}</button>
        <button class="round end" data-action="hangup" aria-label="End call">${icon('phone', 30, 'rot')}</button>
        <button class="round small-round" data-action="speaker" aria-pressed="${call.speaker}" aria-label="Speaker">${icon('volume', 24)}</button>
      </footer>
    </div>`;
  }

  function warnBanner() {
    const lang = S.settings.lang;
    const w = sc().warning;
    const title = lang === 'en' ? w.en.banner : w.bn.banner;
    const sub = lang === 'bn' ? w.bn.bannerSub : w.en.bannerSub;
    return `<section class="warn-banner" role="alert">
      <div class="row" style="align-items:flex-start">
        <div class="warn-icon">${icon('alert', 22)}</div>
        <div class="stack" style="gap:2px">
          <span style="font-size:17px;font-weight:700;color:var(--danger-ink)">${title}</span>
          <span style="font-size:14px;line-height:1.4;color:var(--ink-2)">${sub}</span>
        </div>
      </div>
      <div class="two-col">
        <a class="btn btn-outline-danger" href="#/warning" style="min-height:48px;font-size:15px">কেন? · Why?</a>
        <button class="btn btn-danger" data-action="hangup" style="min-height:48px;font-size:15px">Hang up</button>
      </div>
    </section>`;
  }

  function warning() {
    const lang = ui.warnLang || S.settings.lang;
    const s = sc();
    const P = warnText(s, lang === 'en' ? 'en' : 'bn');
    const A = lang === 'both' ? warnText(s, 'en') : null;
    const alt = (key) => (A ? `<span class="alt">${A[key]}</span>` : '');
    const reasons = activeReasons();
    const segBtn = (v, label) => `<button data-action="wlang" data-v="${v}" aria-pressed="${lang === v}">${label}</button>`;

    const reasonHtml = reasons.map((r, i) => {
      const p = lang === 'en' ? r.en : r.bn;
      return `<article class="reason">
        <span class="num">${i + 1}</span>
        <div class="stack" style="gap:4px">
          <span style="font-size:16px;font-weight:700;line-height:1.35">${p.title}${A ? `<br><span class="alt">${r.en.title}</span>` : ''}</span>
          <span style="font-size:14px;line-height:1.45;color:var(--ink-2)">${p.detail}</span>
          <span class="quote">${p.quote}${A ? `<br>${r.en.quote}` : ''}</span>
        </div>
      </article>`;
    }).join('');

    const safeTip = S.settings.safeWord && s.voice ? `
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

    return `<div class="screen alarm" lang="${lang === 'en' ? 'en' : 'bn'}">
      <header class="alarm-head">
        <button class="back" data-action="back-call">${icon('chevronLeft', 20)}${P.back}</button>
        <div class="seg alarm-seg" role="group" aria-label="Language">
          ${segBtn('bn', 'বাংলা')}${segBtn('en', 'EN')}${segBtn('both', 'Both')}
        </div>
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
    const next = sc().after;
    const head = call.warned
      ? { cls: 'safe', ic: 'shieldCheck', bn: 'আপনি নিরাপদ আছেন', en: 'You stayed safe. No money or code was shared.' }
      : { cls: 'neutral', ic: 'phone', bn: 'কল শেষ হয়েছে', en: on ? 'You ended the call before a code was asked for. Good instinct.' : 'This call was not checked because protection was off.' };

    const verifyCard = call.verify ? `
      <section class="card muted-card stack" style="gap:10px;padding:16px">
        <h2 class="h2" style="color:var(--brand)">${next.verifyTitle}</h2>
        <p class="body">${next.verifyBody}</p>
        <button class="btn btn-primary" data-action="call-saved">${icon('phone', 20)}${next.verifyBtn}</button>
      </section>` : '';

    const actionRow = (id, title, detail, label, doneLabel) => `
      <div class="list-row">
        <div class="grow stack" style="gap:0"><span class="strong" style="font-size:16px">${title}</span><span class="small">${detail}</span></div>
        <button class="btn btn-primary btn-pill" data-action="post" data-v="${id}" aria-pressed="${!!a[id]}">${a[id] ? doneLabel : label}</button>
      </div>`;

    const fb = call.fb;
    const chip = (kind, v) => `<button class="chip" data-action="fb" data-k="${kind}" data-v="${esc(v)}" aria-pressed="${fb[kind] === v}">${v}</button>`;
    const feedback = on ? `
      <section class="card stack" style="gap:12px;padding:16px">
        <h2 class="h3" style="font-size:17px">${call.warned ? 'Did the warning help you decide?' : 'Did CallShield help on this call?'}</h2>
        <div class="chips grid3" role="group" aria-label="Did it help">${D.helpOptions.map((v) => chip('help', v)).join('')}</div>
        <h2 class="h3" style="font-size:17px;margin-top:4px">Which sign convinced you most?</h2>
        <div class="chips" role="group" aria-label="Most convincing sign">${D.reasonOptions.map((v) => chip('reason', v)).join('')}</div>
        ${fb.help && fb.reason ? '<p class="thanks">Thank you. Your answers help make CallShield warnings clearer.</p>' : ''}
      </section>` : '';

    return `<div class="screen">
      <main class="scroll" style="padding-top:calc(40px + env(safe-area-inset-top));gap:18px">
        <section class="stack center" style="gap:8px">
          <div class="big-badge ${head.cls}">${icon(head.ic, 36)}</div>
          <span class="small" style="font-size:14px">Call ended · ${fmt(call.secs)} · ${esc(e.name)}</span>
          <h1 style="font-size:26px;font-weight:700;line-height:1.3">${head.bn}</h1>
          <p class="body" style="font-size:16px">${head.en}</p>
        </section>
        ${verifyCard}
        <section class="card list">
          <h2 class="eyebrow">Next steps</h2>
          ${actionRow('block', 'Block this number', "It won't be able to call you again", 'Block', 'Blocked')}
          ${actionRow('report', 'Report to bKash', 'Helpline 16247 · shares number and time only', 'Report', 'Reported')}
          ${actionRow('family', 'Warn your family', next.familyNote, 'Send alert', 'Sent')}
        </section>
        ${feedback}
        <button class="btn btn-primary lg" data-action="done">Done</button>
      </main>
    </div>`;
  }

  function calls() {
    const f = ui.filter;
    const list = S.calls.filter((c) => f === 'All' || (f === 'Flagged' ? c.kind !== 'safe' : c.kind === 'safe'));
    const rows = list.map((c) => {
      const b = badgeOf(c);
      const initial = c.name.startsWith('+') ? '?' : c.name[0];
      return `<li${c.id === ui.freshId ? ' class="fresh"' : ''}>
        <div class="av ${c.kind === 'safe' ? '' : c.kind}">${esc(initial)}</div>
        <div class="grow stack" style="gap:1px">
          <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
            <span class="strong ellipsis" style="font-size:15px">${esc(c.name)}</span>
            <span class="small" style="font-size:12px;flex-shrink:0">${esc(c.time)}</span>
          </div>
          <span class="small">${esc(c.note)}</span>
          <span class="badge ${b.cls}">${b.label}</span>
        </div>
      </li>`;
    }).join('');
    ui.freshId = null;
    const chip = (v) => `<button class="chip" data-action="filter" data-v="${v}" aria-pressed="${f === v}">${v}</button>`;

    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <h1 class="title">Calls</h1>
        <div class="chips" role="group" aria-label="Filter calls">${chip('All')}${chip('Flagged')}${chip('Safe')}</div>
        ${rows ? `<ul class="log">${rows}</ul>` : '<p class="empty">No calls in this view.</p>'}
      </main>
      ${tabbar('calls')}
    </div>`;
  }

  function learn() {
    const cards = D.tactics.map((k, i) => `
      <article class="tactic" data-open="${i === 0}">
        <button data-action="tactic" aria-expanded="${i === 0}">
          <span class="n">${i + 1}</span>
          <span class="grow stack" style="gap:0">
            <span style="font-size:16px;font-weight:700">${k.bn}</span>
            <span class="small">${k.en}</span>
          </span>
          ${icon('chevronDown', 20, 'chev')}
        </button>
        <div class="more">
          <p class="body" style="font-size:14px">${k.what}</p>
          <span class="quote">${k.example}</span>
          <div class="todo">${icon('check', 18)}<span>${k.todo}</span></div>
        </div>
      </article>`).join('');

    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <header class="stack" style="gap:4px">
          <h1 class="title">Know the tricks</h1>
          <span style="font-size:17px;font-weight:600">প্রতারকের কৌশল চিনুন</span>
          <p class="body" style="margin-top:4px">Scammers reuse the same few tricks. If you hear one on a call, slow down.</p>
        </header>
        <section class="card stack" style="gap:12px;padding:16px">
          <h2 class="h2">Scam calls follow a script</h2>
          <ol class="script-steps">
            ${D.scriptStages.map((s, i) => `<li><span class="n">${i + 1}</span><span class="stack" style="gap:0"><span class="strong" style="font-size:14px">${s.bn}</span><span class="small" style="font-size:12px">${s.en}</span></span></li>`).join('')}
          </ol>
          <p class="body" style="font-size:14px">If you know which step a call is at, you can guess what comes next. CallShield does this for you during a call and warns you before the request comes.</p>
        </section>
        ${cards}
        <a class="card brand" href="#/settings" style="padding:16px;color:#FFFFFF">
          ${icon('lock', 26)}
          <span class="grow stack" style="gap:0">
            <span style="font-size:16px;font-weight:700">${S.settings.safeWord ? 'Family safe word is set' : 'Set a family safe word'}</span>
            <span style="font-size:13px;color:var(--brand-on)">A cloned voice can copy how Ammu sounds, but not a secret only your family knows.</span>
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
        <div class="grow stack" style="gap:0"><span class="strong" style="font-size:15px">${label}</span><span class="small">${detail}</span></div>
        <button class="switch" data-action="toggle" data-k="${key}" aria-pressed="${!!st[key]}" aria-label="${label}"></button>
      </div>`;
    const langBtn = (v, label) => `<button data-action="lang" data-v="${v}" aria-pressed="${st.lang === v}">${label}</button>`;

    const safeEditor = ui.editingSafe ? `
      <div class="stack" style="gap:8px">
        <label for="safe-word" style="font-size:13px;font-weight:600;color:var(--ink-2)">Choose a word only your family knows</label>
        <div class="row" style="gap:8px">
          <input id="safe-word" class="text-input" type="text" autocomplete="off" value="${esc(ui.safeDraft)}" placeholder="e.g. a childhood pet's name">
          <button class="btn btn-primary" data-action="safe-save" style="min-height:46px;border-radius:12px;font-size:14px">Save</button>
        </div>
      </div>` : '';

    return `<div class="screen">
      <main class="scroll" style="gap:14px">
        <h1 class="title">Settings</h1>
        <section class="card list">
          <h2 class="eyebrow">Protection</h2>
          ${sw('live', 'Real-time call protection', 'Check calls for scam signals while you talk')}
          ${sw('voice', 'AI voice-clone check', 'Flag voices that sound machine-made')}
          ${sw('contacts', 'Check saved contacts too', 'Scammers can fake a familiar voice or name')}
        </section>
        <section class="card list">
          <h2 class="eyebrow">Smart help during calls</h2>
          ${sw('predict', 'Predict the next move', 'Warn you what the caller will likely ask before they ask it')}
          ${sw('otpGuard', 'Code-arrival alarm', 'Full-screen alert if a bKash or Nagad code arrives during a suspicious call')}
          ${sw('coach', 'Challenge coach', 'Suggest questions only the real person could answer')}
        </section>
        <section class="card list">
          <h2 class="eyebrow">Warnings</h2>
          <div class="list-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <span class="strong" style="font-size:15px">Warning language</span>
            <div class="seg" role="group" aria-label="Warning language">${langBtn('bn', 'বাংলা')}${langBtn('en', 'English')}${langBtn('both', 'Both')}</div>
          </div>
          ${sw('speak', 'Read warnings aloud', "Hear the warning even if you can't look at the screen")}
          ${sw('vibrate', 'Strong vibration', 'A long buzz when a warning appears')}
        </section>
        <section class="card list" style="padding-bottom:14px">
          <h2 class="eyebrow">Family</h2>
          <div class="list-row" style="flex-direction:column;align-items:stretch;gap:10px">
            <div class="row">
              <div class="grow stack" style="gap:0">
                <span class="strong" style="font-size:15px">Family safe word</span>
                <span class="small">${st.safeWord ? 'Set. CallShield will remind you to ask for it.' : 'Not set yet'}</span>
              </div>
              <button class="btn btn-outline btn-pill" data-action="safe-edit">${ui.editingSafe ? 'Cancel' : (st.safeWord ? 'Change' : 'Set up')}</button>
            </div>
            ${safeEditor}
          </div>
          <div class="list-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <span class="strong" style="font-size:15px">Trusted contacts</span>
            <span class="small">If someone claims to be one of them from a new number, CallShield will suggest calling their saved number.</span>
            <div class="chips">${D.trustedContacts.map((n) => `<span class="tag">${esc(n)}</span>`).join('')}</div>
          </div>
        </section>
        <section class="card muted-card row" style="align-items:flex-start;padding:16px">
          <span style="color:var(--brand);display:flex;margin-top:2px">${icon('lock', 22)}</span>
          <div class="stack" style="gap:4px">
            <span style="font-size:15px;font-weight:700;color:var(--brand)">Your privacy</span>
            <span class="body" style="font-size:14px">Calls are checked on your phone. Audio is never recorded, saved or uploaded.</span>
          </div>
        </section>
        <section class="card stack" style="gap:10px;padding:16px">
          <h2 class="eyebrow">Study data</h2>
          <p class="body" style="font-size:14px">${S.feedback.length} feedback ${S.feedback.length === 1 ? 'response' : 'responses'} saved on this device from demo calls.</p>
          <div class="two-col">
            <button class="btn btn-outline" data-action="export" style="font-size:14px">${icon('download', 18)}Download CSV</button>
            <button class="btn btn-outline-danger" data-action="reset" style="font-size:14px">Reset demo</button>
          </div>
        </section>
      </main>
      ${tabbar('settings')}
    </div>`;
  }

  // ---------- Demo call simulation ----------
  function callState() {
    const s = sc();
    const st = S.settings;
    const step = Math.min(LAST_STEP, Math.floor(call.secs / SECONDS_PER_STEP));
    const flags = [];
    for (let i = 0; i <= step; i++) {
      s.flagsByStep[i].forEach((f) => {
        if (f.voice && !st.voice) return;
        if (f.otp && !st.otpGuard) return;
        flags.push(Object.assign({ t: i * SECONDS_PER_STEP }, f));
      });
    }
    if (call.dodge) flags.push(Object.assign({ t: call.dodge.at }, D.dodgeFlag));
    flags.sort((a, b) => a.t - b.t);
    let risk = (!st.voice && s.riskByStepNoVoice ? s.riskByStepNoVoice : s.riskByStep)[step];
    if (call.dodge) risk = Math.min(99, risk + 10);
    // Right after a check question, the caller's dodge replaces the scripted line for a moment.
    const dodging = call.dodge && call.secs - call.dodge.at <= SECONDS_PER_STEP;
    const line = dodging ? s.dodgeLine : s.lines[step];
    const stage = Math.min(step, s.stages.length - 1);
    return { step, flags, risk, line, stage };
  }
  function activeReasons() {
    return sc().warning.reasons.filter((r) => (S.settings.voice || !r.voice) && (!r.otp || (call && call.otpArrived)));
  }
  function predictHtml(stage) {
    const s = sc();
    const p = s.predictions[stage];
    const bars = s.stages.map((g, i) =>
      `<div class="stage${i < stage ? ' done' : i === stage ? ' now' : ''}"><span class="bar"></span><span class="lbl">${g.bn}</span></div>`).join('');
    return `
      <div class="row" style="gap:8px">
        <span style="color:#9CCFE0;display:flex">${icon('eye', 18)}</span>
        <span class="strong grow" style="font-size:14px;color:var(--dark-ink-2)">Scam script · stage ${stage + 1} of ${s.stages.length}: ${s.stages[stage].en}</span>
      </div>
      <div class="stages" aria-hidden="true">${bars}</div>
      <span class="eyebrow" style="margin-top:4px">এরপর সম্ভবত · Likely next</span>
      <p class="predict-text">${p.bn}</p>
      <p class="small" style="font-size:14px">${p.en}</p>
      ${stage > 0 ? `<span class="came-true">${icon('check', 16)}আগের অনুমান মিলে গেছে · Last prediction came true</span>` : ''}`;
  }
  function riskLevel(r) {
    if (r < 35) return ['Low', '#5FB38A'];
    if (r < 60) return ['Medium', '#E8A33D'];
    if (r < 85) return ['High', '#F07A3A'];
    return ['Very high', '#F2555A'];
  }
  function updateCall() {
    if (lastRoute !== 'call' && requested() !== 'call') return;
    if (!call || !call.active) return;
    const $ = (id) => document.getElementById(id);
    if (!$('clock')) return;
    const { flags, risk, line, stage } = callState();

    $('clock').textContent = fmt(call.secs);
    if ($('lineBn').textContent !== line.bn) {
      $('lineBn').textContent = line.bn;
      $('lineEn').textContent = line.en;
    }
    if (!S.settings.live) return;

    const lv = riskLevel(risk);
    $('riskFill').style.width = risk + '%';
    $('riskFill').style.background = lv[1];
    $('riskLabel').textContent = lv[0];
    $('riskLabel').style.color = lv[1];
    $('riskMeter').setAttribute('aria-valuenow', risk);
    $('riskMeter').setAttribute('aria-valuetext', lv[0]);

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
            <span style="font-size:15px;font-weight:600">${f.bn}</span>
            <span class="small">${f.en}</span>
          </div>
        </div>`).join('');
      $('flagCount').textContent = flags.length;
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
    if (st.speak) {
      const w = sc().warning;
      const parts = [];
      if (st.lang !== 'en') parts.push({ text: w.bn.spoken, lang: 'bn' });
      if (st.lang !== 'bn') parts.push({ text: w.en.spoken, lang: 'en' });
      speak(parts);
    }
  }
  function onOtp() {
    const st = S.settings;
    if (st.vibrate && navigator.vibrate) {
      try { navigator.vibrate([800, 200, 800, 200, 800]); } catch (e) { /* ignore */ }
    }
    if (st.speak) {
      const spoken = alertOf(sc()).spoken;
      const parts = [];
      if (st.lang !== 'en') parts.push({ text: spoken.bn, lang: 'bn' });
      if (st.lang !== 'bn') parts.push({ text: spoken.en, lang: 'en' });
      speak(parts);
    }
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
    const o = alertOf(sc());
    return `<div class="overlay otp-alarm" role="alertdialog" aria-modal="true" aria-labelledby="otpTitle">
      <div class="sms">
        <div class="row" style="gap:10px">
          <span class="sms-icon">${icon('message', 16)}</span>
          <span class="strong grow" style="font-size:14px">${o.sender}</span>
          <span class="small" style="font-size:12px">now</span>
        </div>
        <p style="font-size:14px;line-height:1.45;margin-top:6px">${o.sms}</p>
      </div>
      <div class="otp-body">
        <div class="otp-icon">${icon(o.icon, 32)}</div>
        <h2 id="otpTitle" class="otp-title" tabindex="-1">${o.bn}</h2>
        <p class="otp-en">${o.en}</p>
        <p class="otp-detail">${o.detail}</p>
        ${S.settings.predict ? `<span class="came-true light">${icon('check', 16)}${o.predicted}</span>` : ''}
      </div>
      <div class="stack otp-actions">
        <button class="btn btn-light lg" data-action="hangup" style="color:var(--danger-ink)">${icon('phone', 22, 'rot')}এখনই কল কাটুন · Hang up now</button>
        <button class="btn btn-ghost-light" data-action="otp-dismiss">${o.keep}</button>
      </div>
    </div>`;
  }
  function coachHtml() {
    const c = Object.assign({}, D.coach, sc().coach);
    const hasWord = !!S.settings.safeWord;
    const usesSafeWord = c.questions.some((q) => q.safeWord);
    const rows = c.questions.filter((q) => !q.safeWord || hasWord).map((q) => `
      <div class="coach-q">
        <div class="grow stack" style="gap:2px">
          <span class="strong" style="font-size:16px;line-height:1.4">${q.bn}</span>
          <span class="small">${q.en}</span>
          ${q.tip ? `<span class="small" style="color:var(--brand)">${q.tip}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-pill" data-action="coach-ask" data-v="${q.id}" aria-pressed="${!!call.asked[q.id]}">${call.asked[q.id] ? 'Asked' : 'Ask'}</button>
      </div>`).join('');
    return `<div class="overlay sheet-backdrop" data-action="coach-close">
      <section class="sheet coach-sheet" role="dialog" aria-modal="true" aria-labelledby="coachTitle">
        <h2 class="h3" id="coachTitle" tabindex="-1" style="font-size:20px">${c.title.bn}</h2>
        <p class="small" style="margin-top:-8px">${c.title.en}</p>
        <p class="body">${c.intro}</p>
        ${rows}
        ${hasWord || !usesSafeWord ? '' : '<p class="small">Tip: set a family safe word in Settings. It is the strongest check against a cloned voice.</p>'}
        <button class="btn btn-outline" data-action="coach-close">Close</button>
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
    call = Object.assign(freshCallState(), { sid: ui.sid, active: true, muted: false, speaker: false, actions: {}, fb: {}, verify: false, timer: null });
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
    const s = sc();
    const end = !on ? 'not checked'
      : call.otpArrived ? s.log.alert
      : call.warned ? s.log.warned
      : 'you hung up early';
    const note = s.log.claim + ' · ' + end;
    const entry = { id: 'c' + Date.now(), name: s.number, note, time: 'Today ' + clockNow(), kind, unchecked: !on };
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
      scenario: call.sid,
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
    if (!S.feedback.length) { toast('No feedback yet. Finish a demo call and answer the two questions first.'); return; }
    const cols = ['time', 'scenario', 'helped', 'reason', 'warned', 'callSeconds', 'language', 'voiceCheck',
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
    'start-demo': (el) => { ui.sid = el.dataset.v || SCENARIOS[0].id; go('incoming'); },
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
      toast('They avoided your question. A real caller would just answer. That is another scam sign.');
    },
    'otp-dismiss': () => {
      call.otpOpen = false;
      syncOverlays();
      toast('Good. Keep the code to yourself. CallShield is still listening.');
    },
    hangup: () => hangUp(false),
    verify: () => hangUp(true),
    mute: (el) => { call.muted = !call.muted; el.setAttribute('aria-pressed', call.muted); },
    speaker: (el) => { call.speaker = !call.speaker; el.setAttribute('aria-pressed', call.speaker); },
    'back-call': () => { stopSpeech(); go('call'); },
    wlang: (el) => { ui.warnLang = el.dataset.v; stopSpeech(); render(); },
    speak: () => {
      const lang = ui.warnLang || S.settings.lang;
      const reasons = activeReasons();
      const build = (l) => {
        const P = warnText(sc(), l);
        return [P.headline, P.sub].concat(reasons.map((r) => r[l].title), [P.hangup]).join(l === 'bn' ? '। ' : '. ');
      };
      const parts = [];
      if (lang !== 'en') parts.push({ text: build('bn'), lang: 'bn' });
      if (lang !== 'bn') parts.push({ text: build('en'), lang: 'en' });
      speak(parts);
    },
    'open-sheet': () => { ui.sheet = true; render(); },
    'close-sheet': (el, ev) => {
      if (el.classList.contains('sheet-backdrop') && ev.target !== el) return; // clicks inside the sheet
      ui.sheet = false;
      render();
    },
    'continue-call': () => { ui.sheet = false; go('call'); },
    'call-saved': () => toast(sc().after.verifyToast),
    post: (el) => {
      const id = el.dataset.v;
      const on = !call.actions[id];
      call.actions[id] = on;
      if (id === 'block') { call.entry.blocked = on; save(); }
      if (on && id === 'report') toast('Demo only: this would report the number to bKash (16247).');
      if (on && id === 'family') toast('Demo only: this would send an alert to Abbu and Nusrat Apu.');
      render();
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
      toast(S.settings.safeWord ? 'Family safe word saved on this phone.' : 'Family safe word removed.');
    },
    export: exportCsv,
    reset: () => {
      if (!window.confirm('Reset all demo data? This clears the call history, settings and saved feedback on this device.')) return;
      stopTimer();
      call = null;
      S = defaults();
      save();
      Object.assign(ui, { filter: 'All', sheet: false, warnLang: null, editingSafe: false, safeDraft: '' });
      render();
      toast('Demo data reset.');
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
