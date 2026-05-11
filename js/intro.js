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
      soundBtn.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn && !introAudio) {
        introAudio = new Audio('assets/sounds/intro.mp3');
        introAudio.volume = 0.5;
        introAudio.play().catch(() => {});
      } else if (introAudio) {
        introAudio.muted = !soundOn;
      }
    });
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
