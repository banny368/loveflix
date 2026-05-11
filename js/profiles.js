/* ============================================
   LOVEFLIX — Profiles Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('profiles-grid');
  const adminHint = document.getElementById('admin-hint');
  const logoEl = document.getElementById('profiles-logo');

  // ---- Synchronous UI Setup (runs immediately, never blocked) ----

  // Create floating particles
  const particlesContainer = document.querySelector('.profiles-particles');
  if (particlesContainer && window.LoveFlixUtils) {
    LoveFlixUtils.createParticles(particlesContainer, 20, 'heart');
  }

  // Manage Profiles button → admin login
  const manageBtn = document.getElementById('manage-profiles-btn');
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      window.location.href = 'admin-login.html';
    });
  }

  // Hidden admin access — triple-click bottom-right button
  if (adminHint) {
    let clickCount = 0;
    let clickTimer = null;
    adminHint.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        clickCount = 0;
        window.location.href = 'admin-login.html';
      }
      clickTimer = setTimeout(() => clickCount = 0, 1500);
    });
  }

  // Logo long-press → admin (mobile friendly)
  if (logoEl) {
    let pressTimer = null;
    logoEl.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => window.location.href = 'admin-login.html', 2000);
    });
    logoEl.addEventListener('mouseup', () => clearTimeout(pressTimer));
    logoEl.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    logoEl.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => window.location.href = 'admin-login.html', 2000);
    }, { passive: true });
    logoEl.addEventListener('touchend', () => clearTimeout(pressTimer));
  }

  // ---- Async Data Loading (separate from UI setup) ----
  loadProfiles();

  async function loadProfiles() {
    let profiles = [];
    try {
      const fetched = await window.LoveFlixStorage?.getProfiles();
      // Fall back to demo data if Firestore returned empty or failed
      profiles = (fetched && fetched.length > 0)
        ? fetched
        : window.LoveFlixStorage?.getDemoData('profiles') || [];
    } catch (e) {
      console.warn('[Profiles] Using demo data:', e.message);
      profiles = window.LoveFlixStorage?.getDemoData('profiles') || [];
    }
    renderProfiles(profiles);
  }

  function renderProfiles(profiles) {
    if (!grid) return;
    grid.innerHTML = '';

    if (!profiles || profiles.length === 0) {
      grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;width:100%;padding:32px;">No profiles found.</p>';
      return;
    }

    const emojis = ['💕', '💖', '❤️', '💗', '💞'];

    profiles.filter(p => p.active !== false).forEach((profile, i) => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View ${profile.name} memories`);

      const avatarContent = profile.coverImage
        ? `<img src="${profile.coverImage}" alt="${profile.name}" loading="lazy">`
        : `<div class="profile-avatar-placeholder">${emojis[i % emojis.length]}</div>`;

      card.innerHTML = `
        <div class="profile-avatar">${avatarContent}</div>
        <span class="profile-name">${profile.name}</span>
      `;

      // Click → go to home with profile filter
      card.addEventListener('click', () => selectProfile(profile));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectProfile(profile);
        }
      });

      grid.appendChild(card);
    });
  }

  function selectProfile(profile) {
    // Store selected profile
    if (window.LoveFlixUtils) {
      LoveFlixUtils.store('selectedProfile', profile.slug || profile.id);
    }

    // Confetti on select
    if (window.LoveFlixUtils && window.LoveFlixConfig?.features?.enableConfetti) {
      LoveFlixUtils.launchConfetti(2000);
    }

    // Transition to home
    document.body.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(() => {
      window.location.href = `home.html?profile=${profile.slug || profile.id}`;
    }, 500);
  }
});

