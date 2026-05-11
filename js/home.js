/* ============================================
   LOVEFLIX — Homepage Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const { $, $$, daysBetween, debounce, initLazyLoading, createParticles } = window.LoveFlixUtils || {};
  const Storage = window.LoveFlixStorage;
  const Notify = window.LoveFlixNotify;

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
    const settings = await Storage?.getSettings();
    const startDate = settings?.relationshipStartDate || window.LoveFlixConfig?.relationship?.startDate || '2024-01-01';
    const days = daysBetween(startDate);
    daysEl.textContent = days.toLocaleString();
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
        bgMusic.play().catch(() => {});
        musicBtn.textContent = '🎵';
        musicBtn.classList.add('playing');
      } else {
        bgMusic.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.remove('playing');
      }
    });
  }

  // ---- Load hero ----
  const heroData = await Storage?.getHero();
  renderHero(heroData);

  // ---- Load media by category ----
  const categories = [
    'Popular on LoveFlix',
    'Our Best Memories',
    'Special Moments',
    'Timeline Highlights',
    'Surprises'
  ];

  const allMedia = await Storage?.getMedia() || [];
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

    // If no media at all, show all placeholder rows
    if (allMedia.length === 0) {
      // Already handled above with placeholders
    }
  }

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
        <h2 class="row-title">${title}</h2>
        <span class="row-see-all">See All ›</span>
      </div>
      <div class="row-carousel-wrap">
        <button class="row-arrow row-arrow-left" aria-label="Scroll left">‹</button>
        <div class="row-carousel" data-category="${title}"></div>
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

    container.appendChild(row);
  }

  function createMediaCard(item, index) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.title || 'Memory');

    const isPlaceholder = !item.url && !item.thumbnail;

    if (isPlaceholder) {
      card.classList.add('media-card-placeholder');
      const emojis = ['📸', '🎬', '💖', '🌅', '🎉', '✨'];
      card.innerHTML = `
        ${emojis[index % emojis.length]}
        <span>${item.title || 'Add Memory'}</span>
      `;
    } else {
      const thumbUrl = item.thumbnail || item.url;
      card.innerHTML = `
        <img class="media-card-img" data-src="${thumbUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%23222'/%3E%3C/svg%3E" alt="${item.title || ''}" loading="lazy">
        <div class="media-card-gradient"></div>
        <div class="media-card-play">▶</div>
        ${item.type ? `<span class="media-card-type">${item.type === 'video' ? '🎬 Video' : '📸 Photo'}</span>` : ''}
        <div class="media-card-info">
          <div class="media-card-title">${item.title || ''}</div>
          <div class="media-card-meta">${item.description || ''}</div>
        </div>
      `;
    }

    card.addEventListener('click', () => {
      if (!isPlaceholder) {
        window.location.href = `viewer.html?id=${item.id}`;
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

  function filterMedia(query) {
    if (!query) {
      document.querySelectorAll('.media-card').forEach(c => c.style.display = '');
      return;
    }
    const q = query.toLowerCase();
    document.querySelectorAll('.media-card').forEach(card => {
      const title = card.getAttribute('aria-label')?.toLowerCase() || '';
      card.style.display = title.includes(q) ? '' : 'none';
    });
  }
});
