/* ============================================
   LOVEFLIX — LOVE CODE LOCK ENGINE v2
   Romantic passcode gate with full features
   ============================================ */

window.LoveCodeLock = (function () {
  'use strict';

  /* ── Constants ── */
  const LS_KEY       = 'lf_lc_unlocked_at';
  const LS_ATTEMPTS  = 'lf_lc_failed_attempts';
  const LS_COOLDOWN  = 'lf_lc_cooldown_until';
  const DEFAULT_CODE = '1234';

  /* ── State ── */
  let settings = {
    loveCodeEnabled: true,
    loveCode: DEFAULT_CODE,
    loveCodeTimeoutMinutes: 5,
    maxFailedAttempts: 5,
    cooldownMinutes: 2,
    lockTitle: 'LOVE CODE',
    lockSubtitle: 'Enter the code that unlocks our forever.',
    lockBackgroundUrl: '',
    heartbeatSoundEnabled: false,
    vibrationEnabled: true
  };

  let digits        = [];
  let verifying     = false;
  let inactiveTimer = null;
  let overlayEl     = null;
  let isShowing     = false;

  /* ── Load settings from Firestore ── */
  async function loadSettings() {
    try {
      const s = await window.LoveFlixStorage?.getSettings();
      if (s) {
        if (typeof s.loveCodeEnabled === 'boolean') settings.loveCodeEnabled = s.loveCodeEnabled;
        if (s.loveCode && /^\d{4}$/.test(s.loveCode))   settings.loveCode = s.loveCode;
        if (s.loveCodeTimeoutMinutes)  settings.loveCodeTimeoutMinutes = Number(s.loveCodeTimeoutMinutes);
        if (s.maxFailedAttempts)       settings.maxFailedAttempts       = Number(s.maxFailedAttempts);
        if (s.cooldownMinutes)         settings.cooldownMinutes         = Number(s.cooldownMinutes);
        if (s.lockTitle)               settings.lockTitle               = s.lockTitle;
        if (s.lockSubtitle)            settings.lockSubtitle            = s.lockSubtitle;
        if (s.lockBackgroundUrl)       settings.lockBackgroundUrl       = s.lockBackgroundUrl;
        if (typeof s.heartbeatSoundEnabled === 'boolean') settings.heartbeatSoundEnabled = s.heartbeatSoundEnabled;
        if (typeof s.vibrationEnabled === 'boolean')      settings.vibrationEnabled      = s.vibrationEnabled;
      }
    } catch (e) {
      console.warn('[LoveCode] Settings load failed, using defaults:', e.message);
    }
  }

  /* ── Session helpers ── */
  function getUnlockedAt()  { return Number(localStorage.getItem(LS_KEY) || 0); }
  function markUnlocked()   { localStorage.setItem(LS_KEY, Date.now()); }
  function clearUnlocked()  { localStorage.removeItem(LS_KEY); }

  function getFailedAttempts()   { return Number(localStorage.getItem(LS_ATTEMPTS) || 0); }
  function setFailedAttempts(n)  { localStorage.setItem(LS_ATTEMPTS, n); }
  function resetFailedAttempts() { localStorage.removeItem(LS_ATTEMPTS); }

  function getCooldownUntil()    { return Number(localStorage.getItem(LS_COOLDOWN) || 0); }
  function setCooldownUntil(ts)  { localStorage.setItem(LS_COOLDOWN, ts); }
  function clearCooldown()       { localStorage.removeItem(LS_COOLDOWN); }

  function isInCooldown() { return getCooldownUntil() > Date.now(); }

  function isUnlocked() {
    const at = getUnlockedAt();
    if (!at) return false;
    const elapsed = (Date.now() - at) / 60000;
    return elapsed < settings.loveCodeTimeoutMinutes;
  }

  /* ── Inactivity timer ── */
  function recordActivity() {
    if (!isShowing) markUnlocked();
    resetInactivityTimer();
  }

  function resetInactivityTimer() {
    clearTimeout(inactiveTimer);
    if (!isShowing) {
      inactiveTimer = setTimeout(() => {
        lockNow();
      }, settings.loveCodeTimeoutMinutes * 60 * 1000);
    }
  }

  function bindActivityEvents() {
    ['mousemove','click','keydown','touchstart','scroll'].forEach(ev => {
      window.addEventListener(ev, recordActivity, { passive: true });
    });
  }

  /* ── Build overlay DOM ── */
  function buildOverlay() {
    if (document.getElementById('lc-overlay')) {
      overlayEl = document.getElementById('lc-overlay');
      return;
    }

    const el = document.createElement('div');
    el.id = 'lc-overlay';
    el.className = 'lovecode-overlay lc-hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Enter Love Code');

    el.innerHTML = `
      <div class="lc-bg">
        ${settings.lockBackgroundUrl ? `<img class="lc-bg-media" src="${settings.lockBackgroundUrl}" alt="" aria-hidden="true">` : ''}
        <div class="lc-bg-overlay"></div>
        <div class="lc-bokeh lc-bokeh-1"></div>
        <div class="lc-bokeh lc-bokeh-2"></div>
        <div class="lc-bokeh lc-bokeh-3"></div>
      </div>
      <div class="lc-hearts-bg" id="lc-hearts-bg" aria-hidden="true"></div>
      <div class="lc-card" id="lc-card">
        <div class="lc-logo">LOVEFLIX</div>
        <span class="lc-heart-icon" aria-hidden="true">❤️</span>
        <h1 class="lc-title" id="lc-title">${settings.lockTitle}</h1>
        <p class="lc-subtitle" id="lc-subtitle">${settings.lockSubtitle}</p>
        <p class="lc-datetime" id="lc-datetime"></p>

        <div class="lc-slots" id="lc-slots" role="status" aria-label="Digits entered">
          ${[0,1,2,3].map(i => `
            <div class="lc-slot" id="lc-slot-${i}" aria-hidden="true">
              <div class="lc-slot-heart"></div>
              <span class="lc-slot-digit" id="lc-digit-${i}"></span>
            </div>
          `).join('')}
        </div>

        <div class="lc-error" id="lc-error" aria-live="assertive" role="alert"></div>

        <div class="lc-numpad" id="lc-numpad" role="group" aria-label="Number pad">
          ${[1,2,3,4,5,6,7,8,9].map(n => keyHTML(n)).join('')}
          <button class="lc-key lc-key-clear" id="lc-clear" aria-label="Clear all">
            <div class="lc-key-bg"></div>
            <span class="lc-key-label">CLEAR</span>
            <div class="lc-key-ripple"></div>
          </button>
          ${keyHTML(0)}
          <button class="lc-key lc-key-del" id="lc-del" aria-label="Delete last digit">
            <div class="lc-key-bg"></div>
            <span class="lc-key-label">⌫</span>
            <div class="lc-key-ripple"></div>
          </button>
        </div>

        <p class="lc-hint" id="lc-hint">Only our hearts know this secret 💕</p>
        <p class="lc-attempts" id="lc-attempts"></p>
      </div>
    `;

    document.body.appendChild(el);
    overlayEl = el;

    spawnFloatingHearts();
    spawnSparkles();
    startClock();
    wireNumpad();
  }

  function keyHTML(n) {
    return `
      <button class="lc-key" data-val="${n}" aria-label="${n}">
        <div class="lc-key-bg"></div>
        <span class="lc-key-label">${n}</span>
        <div class="lc-key-ripple"></div>
      </button>
    `;
  }

  /* ── Floating hearts ── */
  function spawnFloatingHearts() {
    const container = document.getElementById('lc-hearts-bg');
    if (!container) return;
    const hearts = ['❤️','💕','💗','💖','💓','🌹','✨'];
    for (let i = 0; i < 18; i++) {
      const h = document.createElement('span');
      h.className = 'lc-heart-float';
      h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      const size = 0.7 + Math.random() * 1.2;
      h.style.cssText = `
        left: ${Math.random() * 100}%;
        font-size: ${size}rem;
        animation-duration: ${6 + Math.random() * 10}s;
        animation-delay: ${Math.random() * 8}s;
      `;
      container.appendChild(h);
    }
  }

  /* ── Sparkles ── */
  function spawnSparkles() {
    const card = document.getElementById('lc-card');
    if (!card) return;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'lc-sparkle';
      s.style.cssText = `
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        width: ${2 + Math.random() * 4}px;
        height: ${2 + Math.random() * 4}px;
        animation-duration: ${1.5 + Math.random() * 3}s;
        animation-delay: ${Math.random() * 2}s;
        background: ${Math.random() > 0.5 ? '#ffd700' : '#ff6b9d'};
        position: absolute;
        pointer-events: none;
        z-index: 1;
      `;
      card.appendChild(s);
    }
  }

  /* ── Live clock ── */
  function startClock() {
    function tick() {
      const el = document.getElementById('lc-datetime');
      if (!el) return;
      const now = new Date();
      el.textContent = now.toLocaleString('en-US', {
        weekday:'long', month:'long', day:'numeric',
        hour:'2-digit', minute:'2-digit'
      });
    }
    tick();
    setInterval(tick, 30000);
  }

  /* ── Wire numpad events ── */
  function wireNumpad() {
    const numpad = document.getElementById('lc-numpad');
    if (!numpad) return;

    numpad.querySelectorAll('.lc-key[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        ripple(btn);
        pressDigit(btn.dataset.val);
      });
    });

    document.getElementById('lc-del')?.addEventListener('click', () => deleteDigit());
    document.getElementById('lc-clear')?.addEventListener('click', () => clearDigits());

    document.addEventListener('keydown', handleKeyboard);
  }

  function handleKeyboard(e) {
    if (!isShowing) return;
    if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
    else if (e.key === 'Backspace') deleteDigit();
    else if (e.key === 'Escape') clearDigits();
  }

  function ripple(btn) {
    const r = btn.querySelector('.lc-key-ripple');
    if (!r) return;
    btn.classList.remove('lc-rippling');
    btn.offsetHeight;
    btn.classList.add('lc-rippling');
    setTimeout(() => btn.classList.remove('lc-rippling'), 500);
  }

  /* ── Digit logic ── */
  function pressDigit(d) {
    if (verifying || isInCooldown()) return;
    if (digits.length >= 4) return;
    digits.push(d);
    updateSlots();
    if (digits.length === 4) setTimeout(verify, 250);
  }

  function deleteDigit() {
    if (verifying) return;
    if (digits.length > 0) { digits.pop(); updateSlots(); setError(''); }
  }

  function clearDigits() {
    if (verifying) return;
    digits = [];
    updateSlots();
    setError('');
  }

  function updateSlots() {
    for (let i = 0; i < 4; i++) {
      const slot  = document.getElementById(`lc-slot-${i}`);
      const digit = document.getElementById(`lc-digit-${i}`);
      if (!slot || !digit) continue;
      slot.classList.remove('filled','error','success');
      digit.textContent = '';
      if (i < digits.length) {
        slot.classList.add('filled');
        digit.textContent = digits[i];
      }
    }
  }

  function setError(msg, cls = '') {
    const el = document.getElementById('lc-error');
    if (!el) return;
    el.textContent = msg;
    el.className = 'lc-error' + (cls ? ` ${cls}` : '');
  }

  function updateAttemptsDisplay() {
    const el = document.getElementById('lc-attempts');
    if (!el) return;
    const fa = getFailedAttempts();
    const max = settings.maxFailedAttempts;
    if (fa > 0) el.textContent = `${fa} / ${max} attempts used`;
    else el.textContent = '';
  }

  /* ── Verify code ── */
  async function verify() {
    if (verifying) return;
    verifying = true;

    if (isInCooldown()) {
      showCooldownMessage();
      verifying = false;
      return;
    }

    const entered = digits.join('');
    if (entered === settings.loveCode) {
      await onSuccess();
    } else {
      await onError();
    }
  }

  async function onSuccess() {
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`lc-slot-${i}`);
      slot?.classList.remove('filled','error');
      slot?.classList.add('success');
    }
    resetFailedAttempts();
    clearCooldown();
    markUnlocked();
    burstParticles();
    playSuccessSound();

    const card = document.getElementById('lc-card');
    if (card) {
      const msg = document.createElement('div');
      msg.className = 'lc-success-overlay';
      msg.innerHTML = `
        <div class="lc-success-heart">💛</div>
        <div class="lc-success-text">Welcome back to our story.</div>
      `;
      card.appendChild(msg);
    }

    setTimeout(() => {
      hide();
      verifying = false;
      if (typeof window._lcOnUnlock === 'function') window._lcOnUnlock();
    }, 1400);
  }

  async function onError() {
    const fa = getFailedAttempts() + 1;
    setFailedAttempts(fa);

    // Mark slots error
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`lc-slot-${i}`);
      slot?.classList.add('error');
    }

    // Shake
    const slotsEl = document.getElementById('lc-slots');
    slotsEl?.classList.remove('lc-shake');
    slotsEl?.offsetHeight;
    slotsEl?.classList.add('lc-shake');

    // Vibrate
    if (settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([80, 40, 80]);

    const max = settings.maxFailedAttempts;
    if (fa >= max) {
      const until = Date.now() + settings.cooldownMinutes * 60 * 1000;
      setCooldownUntil(until);
      resetFailedAttempts();
      setError(`Too many attempts. Love rests for ${settings.cooldownMinutes} min.`, 'lc-cooldown');
      startCooldownCountdown();
    } else {
      setError(`That code doesn't match our hearts. 💔`);
    }

    updateAttemptsDisplay();

    setTimeout(() => {
      slotsEl?.classList.remove('lc-shake');
      digits = [];
      updateSlots();
      verifying = false;
    }, 700);
  }

  function showCooldownMessage() {
    const rem = Math.ceil((getCooldownUntil() - Date.now()) / 60000);
    setError(`Too many attempts. Please wait ${rem} min. 💤`, 'lc-cooldown');
    digits = [];
    updateSlots();
  }

  function startCooldownCountdown() {
    const interval = setInterval(() => {
      if (!isInCooldown()) {
        clearInterval(interval);
        setError('');
        updateAttemptsDisplay();
        return;
      }
      const secs = Math.ceil((getCooldownUntil() - Date.now()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setError(`Cooling down… ${m}:${String(s).padStart(2,'0')} ❄️`, 'lc-cooldown');
    }, 1000);
  }

  /* ── Heart burst particles ── */
  function burstParticles() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const emojis = ['❤️','💕','💖','✨','🌹','💗','⭐'];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      p.className = 'lc-burst-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
      const dist  = 80 + Math.random() * 200;
      const dx    = Math.cos(angle) * dist;
      const dy    = Math.sin(angle) * dist - 60;
      p.style.left = cx + 'px';
      p.style.top  = cy + 'px';
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      p.style.animationDelay = (Math.random() * 0.2) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  /* ── Optional sounds ── */
  function playSuccessSound() {
    if (!settings.heartbeatSoundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch (_) {}
  }

  /* ── Show / hide ── */
  function show() {
    if (isShowing) return;
    buildOverlay();

    // Apply dynamic settings to DOM
    const titleEl    = document.getElementById('lc-title');
    const subtitleEl = document.getElementById('lc-subtitle');
    if (titleEl)    titleEl.textContent    = settings.lockTitle;
    if (subtitleEl) subtitleEl.textContent = settings.lockSubtitle;

    digits = [];
    verifying = false;
    updateSlots();
    setError('');
    updateAttemptsDisplay();

    if (isInCooldown()) showCooldownMessage();

    overlayEl.classList.remove('lc-hidden');
    overlayEl.classList.add('lc-visible');
    isShowing = true;
    clearTimeout(inactiveTimer);
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    if (!overlayEl) return;
    overlayEl.classList.remove('lc-visible');
    overlayEl.classList.add('lc-hidden');
    isShowing = false;
    document.body.style.overflow = '';
    resetInactivityTimer();
  }

  /* ── Public: checkLoveCodeLock ── */
  async function checkLoveCodeLock(onUnlock) {
    await loadSettings();

    if (!settings.loveCodeEnabled) {
      if (typeof onUnlock === 'function') onUnlock();
      return;
    }

    window._lcOnUnlock = onUnlock;

    if (isUnlocked()) {
      resetInactivityTimer();
      bindActivityEvents();
      if (typeof onUnlock === 'function') onUnlock();
      return;
    }

    show();
  }

  /* ── Public: lockNow ── */
  function lockNow() {
    clearUnlocked();
    clearTimeout(inactiveTimer);
    show();
  }

  /* ── Public: showLoveCode (legacy compat for index.html intro) ── */
  window.showLoveCode = async function (onUnlock) {
    await loadSettings();
    window._lcOnUnlock = onUnlock || (() => { window.location.href = 'profiles.html'; });
    if (!settings.loveCodeEnabled) {
      if (typeof window._lcOnUnlock === 'function') window._lcOnUnlock();
      return;
    }
    show();
  };

  return {
    check: checkLoveCodeLock,
    lock: lockNow,
    show,
    hide,
    recordActivity
  };
})();
