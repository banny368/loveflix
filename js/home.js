/* ============================================
   LOVEFLIX — Homepage Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const { $, $$, daysBetween, debounce, initLazyLoading, createParticles, escapeHtml, getUrlParam, retrieve } = window.LoveFlixUtils || {};
  const Storage = window.LoveFlixStorage;
  const Notify = window.LoveFlixNotify;
  const esc = escapeHtml || (s => s ?? '');

  // ---- Navbar scroll effect ----
  const navbar = document.querySelector('.lf-navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ---- Search toggle ----
  const searchWrap = document.querySelector('.navbar-search');
  const searchBtn = document.querySelector('.navbar-search-btn');
  const searchInput = document.querySelector('.navbar-search-input');
  if (searchBtn && searchWrap) {
    searchBtn.addEventListener('click', () => {
      searchWrap.classList.toggle('open');
      if (searchWrap.classList.contains('open')) searchInput?.focus();
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', debounce ? debounce((e) => filterMedia(e.target.value), 300) : () => {});
  }

  // ---- Mobile menu toggle ----
  const mobileMenuBtn = document.getElementById('navbar-menu-btn');
  const mobileMenu = document.getElementById('navbar-mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
      mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
    });
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.textContent = '☰';
      }
    });
    // Close when a menu link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.textContent = '☰';
      });
    });
  }

  // ---- Days counter ----
  const daysEl = document.getElementById('days-count');
  if (daysEl && daysBetween) {
    try {
      const settings = await Storage?.getSettings();
      const startDate = settings?.relationshipStartDate || window.LoveFlixConfig?.relationship?.startDate || '2024-01-01';
      const days = daysBetween(startDate);
      daysEl.textContent = days.toLocaleString();
    } catch (e) {
      console.warn('[Home] Days counter failed:', e);
    }
  }

  // ---- Background music ----
  const musicBtn = document.getElementById('music-toggle');
  let bgMusic = null;
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (!bgMusic) {
        bgMusic = new Audio('assets/music/background.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
      }
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          musicBtn.textContent = '🎵';
          musicBtn.classList.add('playing');
        }).catch(() => {
          musicBtn.textContent = '🔇';
          musicBtn.classList.remove('playing');
          Notify?.info('Music unavailable — add assets/music/background.mp3 🎵');
        });
      } else {
        bgMusic.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.remove('playing');
      }
    });
  }

  // ---- Load hero ----
  try {
    const heroData = await Storage?.getHero();
    renderHero(heroData);
  } catch (e) {
    console.warn('[Home] Hero load failed:', e);
  }

  // ---- Load media by category ----
  const categories = [
    'Popular on LoveFlix',
    'Our Best Memories',
    'Special Moments',
    'Timeline Highlights',
    'Surprises'
  ];

  let rawMedia = [];
  try {
    rawMedia = await Storage?.getMedia() || [];
  } catch (e) {
    console.warn('[Home] Media load failed:', e);
  }

  // ---- Profile filter (?profile=<slug> from profiles page) ----
  const profileSlug = getUrlParam ? (getUrlParam('profile') || '') : '';
  let allMedia = rawMedia;
  if (profileSlug) {
    // Untagged media (no profileId) shows under every profile
    allMedia = rawMedia.filter(m => !m.profileId || m.profileId === profileSlug);
    showProfileChip(profileSlug);
  }

  const contentArea = document.getElementById('home-content');

  if (contentArea) {
    for (const cat of categories) {
      const items = allMedia.filter(m => m.category === cat);
      if (items.length > 0 || allMedia.length === 0) {
        renderRow(contentArea, cat, items.length > 0 ? items : generatePlaceholders(cat));
      }
    }

    // If we have uncategorized media, show them too
    const categorized = new Set(categories);
    const other = allMedia.filter(m => !categorized.has(m.category));
    if (other.length > 0) {
      renderRow(contentArea, 'More Memories', other);
    }
  }

  // ---- Hero buttons ----
  document.getElementById('hero-play')?.addEventListener('click', () => {
    const target = allMedia.find(m => m.featured && m.url) || allMedia.find(m => m.url);
    if (target) {
      window.location.href = `viewer.html?id=${encodeURIComponent(target.id)}`;
    } else {
      Notify?.info('No memories uploaded yet — add some in the Admin panel! 💕');
    }
  });

  let myListActive = false;
  const heroListBtn = document.getElementById('hero-list');
  heroListBtn?.addEventListener('click', () => {
    const favorites = (retrieve && retrieve('favorites')) || [];
    if (!myListActive && favorites.length === 0) {
      Notify?.info('No favorites yet — tap ♡ Like in the viewer to build your list 💕');
      return;
    }
    myListActive = !myListActive;
    heroListBtn.textContent = myListActive ? '✕ Clear My List' : '♡ My List';
    applyCardFilter(card => !myListActive || favorites.includes(card.dataset.id));
    if (myListActive) Notify?.love(`Showing your ${favorites.length} favorite${favorites.length > 1 ? 's' : ''} ❤️`);
  });

  // Romantic quote
  renderQuote(contentArea);

  // Init lazy loading
  if (initLazyLoading) initLazyLoading();

  // Floating particles
  const particlesEl = document.querySelector('.home-particles');
  if (particlesEl && createParticles && window.LoveFlixConfig?.features?.enableParticles) {
    createParticles(particlesEl, 15, 'heart');
  }

  // Heart cursor trail
  if (window.LoveFlixUtils?.initHeartTrail) {
    window.LoveFlixUtils.initHeartTrail();
  }

  /* ---- Render Functions ---- */

  function renderHero(data) {
    if (!data) return;
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroMedia = document.getElementById('hero-media');

    if (heroTitle) heroTitle.textContent = data.title || 'Our Love Story';
    if (heroSubtitle) heroSubtitle.textContent = data.subtitle || 'Every moment with you is a memory I treasure forever';

    if (heroMedia && data.backgroundUrl) {
      if (data.mediaType === 'video') {
        heroMedia.outerHTML = `<video class="hero-media" id="hero-media" autoplay muted loop playsinline src="${data.backgroundUrl}"></video>`;
      } else {
        heroMedia.src = data.backgroundUrl;
      }
    }
  }

  function renderRow(container, title, items) {
    const row = document.createElement('section');
    row.className = 'content-row';
    row.innerHTML = `
      <div class="row-header">
        <h2 class="row-title">${esc(title)}</h2>
        <button class="row-see-all" aria-expanded="false">See All ›</button>
      </div>
      <div class="row-carousel-wrap">
        <button class="row-arrow row-arrow-left" aria-label="Scroll left">‹</button>
        <div class="row-carousel" data-category="${esc(title)}"></div>
        <button class="row-arrow row-arrow-right" aria-label="Scroll right">›</button>
      </div>
    `;

    const carousel = row.querySelector('.row-carousel');
    items.forEach((item, idx) => {
      carousel.appendChild(createMediaCard(item, idx));
    });

    // Arrow controls
    const leftBtn = row.querySelector('.row-arrow-left');
    const rightBtn = row.querySelector('.row-arrow-right');
    const scrollAmt = 800;
    leftBtn?.addEventListener('click', () => carousel.scrollBy({ left: -scrollAmt, behavior: 'smooth' }));
    rightBtn?.addEventListener('click', () => carousel.scrollBy({ left: scrollAmt, behavior: 'smooth' }));

    // See All — expand carousel into a wrapped grid
    const seeAllBtn = row.querySelector('.row-see-all');
    seeAllBtn?.addEventListener('click', () => {
      const expanded = row.classList.toggle('expanded');
      seeAllBtn.textContent = expanded ? 'Show Less ‹' : 'See All ›';
      seeAllBtn.setAttribute('aria-expanded', expanded);
    });

    container.appendChild(row);
  }

  function createMediaCard(item, index) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.title || 'Memory');
    card.dataset.id = item.id || '';

    const isPlaceholder = !item.url && !item.thumbnail;

    if (isPlaceholder) {
      card.classList.add('media-card-placeholder');
      const emojis = ['📸', '🎬', '💖', '🌅', '🎉', '✨'];
      card.innerHTML = `
        ${emojis[index % emojis.length]}
        <span>${esc(item.title || 'Add Memory')}</span>
      `;
    } else {
      const thumbUrl = item.thumbnail || item.url;
      card.innerHTML = `
        <img class="media-card-img" data-src="${esc(thumbUrl)}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23222'/%3E%3C/svg%3E" alt="${esc(item.title || '')}" loading="lazy">
        <div class="media-card-gradient"></div>
        <div class="media-card-play">▶</div>
        ${item.type ? `<span class="media-card-type">${item.type === 'video' ? '🎬 Video' : '📸 Photo'}</span>` : ''}
        <div class="media-card-info">
          <div class="media-card-title">${esc(item.title || '')}</div>
          <div class="media-card-meta">${esc(item.description || '')}</div>
        </div>
      `;
    }

    card.addEventListener('click', () => {
      if (!isPlaceholder) {
        window.location.href = `viewer.html?id=${encodeURIComponent(item.id)}`;
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') card.click();
    });

    return card;
  }

  function generatePlaceholders(category) {
    const titles = {
      'Popular on LoveFlix': ['First Date', 'Our Song', 'Beach Day', 'Movie Night', 'Surprise Gift'],
      'Our Best Memories': ['Anniversary', 'Birthday', 'Road Trip', 'Cooking Together', 'Dancing'],
      'Special Moments': ['First Kiss', 'Proposal', 'Travel', 'Festival', 'Celebration'],
      'Timeline Highlights': ['Month 1', 'Month 3', 'Month 6', 'Year 1', 'Forever'],
      'Surprises': ['Love Letter', 'Gift Box', 'Breakfast in Bed', 'Star Gazing', 'Picnic']
    };
    return (titles[category] || ['Memory 1', 'Memory 2', 'Memory 3']).map((t, i) => ({
      id: `placeholder-${i}`, title: t, type: 'image', url: '', thumbnail: '', category
    }));
  }

  function renderQuote(container) {
    if (!container) return;
    const quotes = [
      "Every love story is beautiful, but ours is my favorite.",
      "In all the world, there is no heart for me like yours.",
      "I love you not because of who you are, but because of who I am when I am with you.",
      "You are my today and all of my tomorrows.",
      "Together is a wonderful place to be."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const section = document.createElement('div');
    section.className = 'romantic-quote';
    section.innerHTML = `<p class="romantic-quote-text">"${quote}"</p>`;
    container.appendChild(section);
  }

  // Show/hide cards by predicate; hide rows that end up empty
  function applyCardFilter(predicate) {
    document.querySelectorAll('.content-row').forEach(row => {
      let visible = 0;
      row.querySelectorAll('.media-card').forEach(card => {
        const show = predicate(card);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      row.style.display = visible > 0 ? '' : 'none';
    });
  }

  function filterMedia(query) {
    const q = (query || '').toLowerCase();
    applyCardFilter(card => {
      if (!q) return true;
      const title = card.getAttribute('aria-label')?.toLowerCase() || '';
      return title.includes(q);
    });
  }

  function showProfileChip(slug) {
    const navLeft = document.querySelector('.navbar-left');
    if (!navLeft) return;
    const chip = document.createElement('a');
    chip.className = 'profile-chip';
    chip.href = 'profiles.html';
    chip.title = 'Switch profile';
    chip.textContent = `💕 ${slug.replace(/-/g, ' ')}`;
    navLeft.appendChild(chip);
    // Swap the slug for the real profile name once loaded
    Storage?.getProfiles().then(profiles => {
      const p = (profiles || []).find(x => x.slug === slug || x.id === slug);
      if (p?.name) chip.textContent = `💕 ${p.name}`;
    }).catch(() => {});
  }
});
