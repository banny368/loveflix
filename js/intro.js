/* ============================================
   LOVEFLIX — Intro Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.querySelector('.intro-progress-bar');
  const skipBtn = document.querySelector('.intro-skip');
  const soundBtn = document.querySelector('.intro-sound');
  const logo = document.querySelector('.intro-logo');
  const duration = window.LoveFlixConfig?.app?.introDuration || 4000;

  let redirected = false;
  let startTime = Date.now();

  // Cinematic letter-by-letter logo reveal
  if (logo && !prefersReducedMotion()) {
    const text = logo.textContent;
    logo.textContent = '';
    logo.classList.add('split');
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'intro-letter';
      span.textContent = ch;
      span.style.animationDelay = (0.15 + i * 0.09) + 's';
      logo.appendChild(span);
    });
    // Particle burst at the reveal peak
    setTimeout(() => {
      if (window.LoveFlixUtils?.heartBurst) {
        const r = logo.getBoundingClientRect();
        window.LoveFlixUtils.heartBurst(r.left + r.width / 2, r.top + r.height / 2, 12);
      }
    }, 150 + text.length * 90 + 300);
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Create floating particles
  createSparkles();

  // Progress bar animation
  function updateProgress() {
    if (redirected) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / duration) * 100, 100);
    if (progressBar) progressBar.style.width = progress + '%';

    if (progress >= 100) {
      goToProfiles();
    } else {
      requestAnimationFrame(updateProgress);
    }
  }
  requestAnimationFrame(updateProgress);

  // Add glow class after initial animation
  setTimeout(() => {
    if (logo) logo.classList.add('glow');
  }, 2500);

  // Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', goToProfiles);
  }

  // Sound toggle
  let soundOn = false;
  let introAudio = null;
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundOn = !soundOn;
      if (soundOn && !introAudio) {
        introAudio = new Audio('assets/sounds/intro.mp3');
        introAudio.volume = 0.5;
        introAudio.play().then(() => {
          soundBtn.innerHTML = window.LFIcons?.get('volume') || '🔊';
        }).catch(() => {
          // No file? Synthesize a cinematic "ta-dum" instead — zero assets needed.
          introAudio = null;
          playTaDum();
          soundBtn.innerHTML = window.LFIcons?.get('volume') || '🔊';
        });
      } else if (introAudio) {
        introAudio.muted = !soundOn;
        soundBtn.innerHTML = window.LFIcons?.get(soundOn ? 'volume' : 'volumeMute') || (soundOn ? '🔊' : '🔇');
      } else {
        if (soundOn) playTaDum();
        soundBtn.innerHTML = window.LFIcons?.get(soundOn ? 'volume' : 'volumeMute') || (soundOn ? '🔊' : '🔇');
      }
    });
  }

  // Netflix-style "ta-dum" via WebAudio (same oscillator trick as the
  // LoveCode success chime) — works with no audio files at all.
  function playTaDum() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[87, 0, 0.9], [110, 0.02, 1.1], [174, 0.14, 1.3]].forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    } catch (_) {}
  }

  function goToProfiles() {
    if (redirected) return;
    redirected = true;
    if (introAudio) introAudio.pause();
    document.body.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(() => {
      document.body.style.animation = '';
      // Trigger LoveCode gate — lovecode.js will redirect to profiles.html on success
      if (typeof window.showLoveCode === 'function') {
        window.showLoveCode();
      } else {
        window.location.href = 'profiles.html';
      }
    }, 500);
  }

  function createSparkles() {
    const container = document.querySelector('.intro-particles');
    if (!container) return;
    const symbols = ['✨', '💖', '⭐', '💕', '🌟'];
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('span');
      p.className = 'intro-particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 4 + 's';
      p.style.animationDuration = (Math.random() * 3 + 3) + 's';
      p.style.fontSize = (Math.random() * 12 + 8) + 'px';
      container.appendChild(p);
    }
  }

  // Keyboard: Enter or Space to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToProfiles();
    }
  });
});
