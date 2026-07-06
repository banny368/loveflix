/* ============================================
   LOVEFLIX — Credits Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const Storage = window.LoveFlixStorage;
  const creditsContainer = document.getElementById('credits-items');
  const scrollInner = document.querySelector('.credits-scroll-inner');
  const starsContainer = document.querySelector('.credits-stars');
  const particlesContainer = document.querySelector('.credits-particles');
  const musicBtn = document.getElementById('credits-music');

  // Create starry background
  createStars();

  // Create floating particles
  if (particlesContainer && window.LoveFlixUtils) {
    LoveFlixUtils.createParticles(particlesContainer, 15, 'sparkle');
  }

  // Load credits from Firestore — fall back to demo data on error OR
  // when the collection is empty, so the page never scrolls blank.
  let credits = [];
  try {
    credits = await Storage?.getCredits();
  } catch (e) {
    console.warn('[Credits] Load failed, using demo data:', e);
  }
  if (!credits || credits.length === 0) {
    credits = Storage?.getDemoData('credits') || [];
  }

  // Render credits
  renderCredits(credits);

  // Pause/Resume on click
  let isPaused = false;
  document.addEventListener('click', (e) => {
    if (e.target.closest('.credits-back') || e.target.closest('.credits-music')) return;
    isPaused = !isPaused;
    scrollInner?.classList.toggle('paused', isPaused);
    const hint = document.querySelector('.credits-pause-hint');
    if (hint) hint.textContent = isPaused ? 'Click to resume' : 'Click to pause';
  });

  // Pause/Resume with Space
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      isPaused = !isPaused;
      scrollInner?.classList.toggle('paused', isPaused);
    }
    if (e.key === 'Escape') {
      window.location.href = 'home.html';
    }
  });

  // Music — prefer the track configured in Admin → Settings
  let creditsMusic = null;
  let musicUrl = 'assets/music/credits.mp3';
  try {
    const settings = await Storage?.getSettings();
    if (settings?.backgroundMusicUrl) musicUrl = settings.backgroundMusicUrl;
  } catch {}
  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!creditsMusic) {
        creditsMusic = new Audio(musicUrl);
        creditsMusic.loop = true;
        creditsMusic.volume = 0.4;
      }
      if (creditsMusic.paused) {
        creditsMusic.play().then(() => {
          musicBtn.innerHTML = window.LFIcons?.get('music') || '🎵';
        }).catch(() => {
          musicBtn.innerHTML = window.LFIcons?.get('musicOff') || '🔇';
          creditsMusic = null;
          console.warn('[Credits] Music unavailable — set a track in Admin → Settings → Music');
        });
      } else {
        creditsMusic.pause();
        musicBtn.innerHTML = window.LFIcons?.get('musicOff') || '🔇';
      }
    });
  }

  // Back button
  document.getElementById('credits-back')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (creditsMusic) creditsMusic.pause();
    window.location.href = 'home.html';
  });

  function renderCredits(credits) {
    if (!creditsContainer) return;
    const esc = window.LoveFlixUtils?.escapeHtml || (s => s ?? '');
    creditsContainer.innerHTML = '';
    credits.forEach(credit => {
      const item = document.createElement('div');
      item.className = 'credit-item';
      item.innerHTML = `
        <div class="credit-role">${esc(credit.role)}</div>
        <div class="credit-value">${esc(credit.value)}</div>
      `;
      creditsContainer.appendChild(item);

      // Add divider every 3 items
      if (credits.indexOf(credit) % 3 === 2 && credits.indexOf(credit) < credits.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'credits-heart-divider';
        divider.textContent = '❤️';
        creditsContainer.appendChild(divider);
      }
    });
  }

  function createStars() {
    if (!starsContainer) return;
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'credits-star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (Math.random() * 3 + 2) + 's';
      star.style.opacity = Math.random() * 0.7 + 0.1;
      star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px';
      starsContainer.appendChild(star);
    }
  }
});
