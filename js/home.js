/* ============================================
   LOVEFLIX — Homepage Logic (v3)
   Netflix-grade browsing: detail modal, rows,
   surprise, countdown, notes, skeletons
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const { daysBetween, debounce, initLazyLoading, createParticles, escapeHtml, getUrlParam, retrieve, store, formatDate, heartBurst, typewriter, launchConfetti, pageTransition } = window.LoveFlixUtils || {};
  const Storage = window.LoveFlixStorage;
  const Notify = window.LoveFlixNotify;
  const Loader = window.LoveFlixLoader;
  const esc = escapeHtml || (s => s ?? '');

  let settings = null;
  let rawMedia = [];
  let allMedia = [];

  // ---- Navbar scroll effect + progress bar ----
  const navbar = document.querySelector('.lf-navbar');
  const progressBar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = max > 0 ? (window.scrollY / max) * 100 + '%' : '0';
    }
  }, { passive: true });

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
      mobileMenuBtn.innerHTML = window.LFIcons?.get(isOpen ? 'close' : 'menu') || (isOpen ? '✕' : '☰');
    });
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.innerHTML = window.LFIcons?.get('menu') || '☰';
      }
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.innerHTML = window.LFIcons?.get('menu') || '☰';
      });
    });
  }

  // ---- Smooth page transitions for internal links ----
  if (pageTransition) {
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || a.target === '_blank') return;
        e.preventDefault();
        pageTransition(a.getAttribute('href'));
      });
    });
  }

  // ---- Loading skeletons while data is in flight ----
  const contentArea = document.getElementById('home-content');
  if (contentArea && Loader) {
    for (let i = 0; i < 3; i++) contentArea.appendChild(Loader.createSkeletonRow(6));
  }

  // ---- Settings (days counter, countdown, music) ----
  try {
    settings = await Storage?.getSettings();
  } catch (e) {
    console.warn('[Home] Settings load failed:', e);
  }
  const startDate = settings?.relationshipStartDate || window.LoveFlixConfig?.relationship?.startDate || '2024-01-01';

  const daysEl = document.getElementById('days-count');
  if (daysEl && daysBetween) {
    daysEl.textContent = daysBetween(startDate).toLocaleString();
  }
  document.getElementById('days-counter')?.addEventListener('click', () => openStatsModal());

  // ---- Anniversary countdown chip ----
  initCountdownChip(startDate);

  // ---- Background music (Cloudinary URL from settings, file fallback) ----
  const musicBtn = document.getElementById('music-toggle');
  let bgMusic = null;
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (!bgMusic) {
        const src = settings?.backgroundMusicUrl || 'assets/music/background.mp3';
        bgMusic = new Audio(src);
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
      }
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          musicBtn.innerHTML = window.LFIcons?.get('music') || '🎵';
          musicBtn.classList.add('playing');
        }).catch(() => {
          musicBtn.innerHTML = window.LFIcons?.get('musicOff') || '🔇';
          musicBtn.classList.remove('playing');
          bgMusic = null;
          Notify?.info('No music yet — add a track in Admin → Settings → Music');
        });
      } else {
        bgMusic.pause();
        musicBtn.innerHTML = window.LFIcons?.get('musicOff') || '🔇';
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

  // ---- Load media ----
  const categories = [
    'Popular on LoveFlix',
    'Our Best Memories',
    'Special Moments',
    'Timeline Highlights',
    'Surprises'
  ];

  try {
    rawMedia = await Storage?.getMedia() || [];
  } catch (e) {
    console.warn('[Home] Media load failed:', e);
  }

  // ---- Profile filter (?profile=<slug> from profiles page) ----
  const profileSlug = getUrlParam ? (getUrlParam('profile') || '') : '';
  allMedia = rawMedia;
  if (profileSlug) {
    allMedia = rawMedia.filter(m => !m.profileId || m.profileId === profileSlug);
    showProfileChip(profileSlug);
  }

  // ---- Render all rows ----
  if (contentArea) {
    contentArea.innerHTML = '';

    // Continue Watching (from viewer history)
    const recent = (retrieve && retrieve('recentlyViewed')) || [];
    const recentItems = recent
      .map(r => allMedia.find(m => m.id === r.id))
      .filter(Boolean);
    if (recentItems.length > 0) {
      renderRow(contentArea, 'Continue Watching', recentItems, 'row-continue');
    }

    // My List (favorites from viewer likes)
    renderMyListRow();

    for (const cat of categories) {
      const items = allMedia.filter(m => m.category === cat);
      if (items.length > 0 || allMedia.length === 0) {
        renderRow(contentArea, cat, items.length > 0 ? items : generatePlaceholders(cat));
      }
    }

    const categorized = new Set(categories);
    const other = allMedia.filter(m => !categorized.has(m.category));
    if (other.length > 0) {
      renderRow(contentArea, 'More Memories', other);
    }

    renderQuote(contentArea);
  }

  // ---- Hero buttons ----
  document.getElementById('hero-play')?.addEventListener('click', () => {
    const target = allMedia.find(m => m.featured && m.url) || allMedia.find(m => m.url);
    if (target) {
      (pageTransition || (u => window.location.href = u))(`viewer.html?id=${encodeURIComponent(target.id)}`);
    } else {
      Notify?.info('No memories uploaded yet — add some in the Admin panel! 💕');
    }
  });

  document.getElementById('hero-list')?.addEventListener('click', () => {
    const row = document.getElementById('row-my-list');
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('row-highlight');
      setTimeout(() => row.classList.remove('row-highlight'), 1600);
    } else {
      Notify?.info('No favorites yet — tap ♡ Like in the viewer to build your list 💕');
    }
  });

  // ---- Surprise Me 🎲 ----
  function surpriseMe() {
    const candidates = allMedia.filter(m => m.url);
    if (candidates.length === 0) {
      Notify?.info('Upload some memories first — then I can surprise you! 💕');
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (window.LoveFlixConfig?.features?.enableConfetti && launchConfetti) launchConfetti(1800);
    Notify?.love('Here comes a surprise… 🎲');
    setTimeout(() => {
      (pageTransition || (u => window.location.href = u))(`viewer.html?id=${encodeURIComponent(pick.id)}`);
    }, 900);
  }
  document.getElementById('fab-surprise')?.addEventListener('click', surpriseMe);
  document.getElementById('bn-surprise')?.addEventListener('click', surpriseMe);

  // ---- Love Note 💌 ----
  document.getElementById('fab-note')?.addEventListener('click', openLoveNote);

  // Init lazy loading
  if (initLazyLoading) initLazyLoading();

  // Floating particles
  const particlesEl = document.querySelector('.home-particles');
  if (particlesEl && createParticles && window.LoveFlixConfig?.features?.enableParticles) {
    createParticles(particlesEl, 15, 'heart');
  }

  // Heart cursor trail
  window.LoveFlixUtils?.initHeartTrail?.();

  /* ============================================
     Render Functions
     ============================================ */

  function renderHero(data) {
    if (!data) return;
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroMedia = document.getElementById('hero-media');

    if (heroTitle) heroTitle.textContent = data.title || 'Our Love Story';
    if (heroSubtitle) heroSubtitle.textContent = data.subtitle || 'Every moment with you is a memory I treasure forever';

    if (heroMedia && data.backgroundUrl) {
      if (data.mediaType === 'video') {
        // YouTube-style: banner becomes a full-width 16:9 stage
        document.getElementById('hero-banner')?.classList.add('hero-video');
        heroMedia.outerHTML = `<video class="hero-media" id="hero-media" autoplay muted loop playsinline src="${esc(data.backgroundUrl)}"></video>`;
        addHeroMutePill();
      } else {
        heroMedia.src = data.backgroundUrl;
        heroMedia.classList.add('kenburns');
      }
    } else if (heroMedia) {
      heroMedia.classList.add('kenburns');
    }
  }

  function addHeroMutePill() {
    const banner = document.getElementById('hero-banner');
    const video = document.getElementById('hero-media');
    if (!banner || !video || video.tagName !== 'VIDEO') return;
    const pill = document.createElement('button');
    pill.className = 'hero-mute-pill';
    pill.setAttribute('aria-label', 'Toggle hero sound');
    pill.innerHTML = window.LFIcons?.get('volumeMute') || '🔇';
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      pill.innerHTML = window.LFIcons?.get(video.muted ? 'volumeMute' : 'volume') || (video.muted ? '🔇' : '🔊');
    });
    banner.appendChild(pill);
  }

  function renderMyListRow() {
    const favorites = (retrieve && retrieve('favorites')) || [];
    const favItems = favorites.map(id => allMedia.find(m => m.id === id)).filter(Boolean);
    if (favItems.length > 0 && contentArea) {
      renderRow(contentArea, '❤️ My List', favItems, 'row-my-list');
    }
  }

  function renderRow(container, title, items, rowId = '') {
    const row = document.createElement('section');
    row.className = 'content-row';
    if (rowId) row.id = rowId;
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

    const leftBtn = row.querySelector('.row-arrow-left');
    const rightBtn = row.querySelector('.row-arrow-right');
    const scrollAmt = 800;
    leftBtn?.addEventListener('click', () => carousel.scrollBy({ left: -scrollAmt, behavior: 'smooth' }));
    rightBtn?.addEventListener('click', () => carousel.scrollBy({ left: scrollAmt, behavior: 'smooth' }));

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
        <div class="media-card-play">${window.LFIcons?.get("play") || "▶"}</div>
        ${item.type ? `<span class="media-card-type"><span class="lf-icon">${window.LFIcons?.get(item.type === 'video' ? 'film' : 'image') || ''}</span> ${item.type === 'video' ? 'Video' : 'Photo'}</span>` : ''}
        <div class="media-card-info">
          <div class="media-card-title">${esc(item.title || '')}</div>
          <div class="media-card-meta">${esc(item.description || '')}</div>
        </div>
      `;

      // Desktop: live muted preview for videos after a short hover
      if (item.type === 'video' && item.url && matchMedia('(hover: hover)').matches) {
        let previewTimer = null;
        let previewVideo = null;
        card.addEventListener('mouseenter', () => {
          previewTimer = setTimeout(() => {
            previewVideo = document.createElement('video');
            previewVideo.className = 'media-card-preview';
            previewVideo.src = window.LoveFlixCloud?.streamingUrl(item.url) || item.url;
            previewVideo.muted = true;
            previewVideo.loop = true;
            previewVideo.playsInline = true;
            previewVideo.play().catch(() => {});
            card.appendChild(previewVideo);
          }, 800);
        });
        card.addEventListener('mouseleave', () => {
          clearTimeout(previewTimer);
          previewVideo?.remove();
          previewVideo = null;
        });
      }
    }

    card.addEventListener('click', () => {
      if (!isPlaceholder) openDetailModal(item);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') card.click();
    });

    return card;
  }

  /* ---- Netflix-style detail modal ---- */
  function openDetailModal(item) {
    document.getElementById('detail-modal-overlay')?.remove();
    const favorites = (retrieve && retrieve('favorites')) || [];
    const isFav = favorites.includes(item.id);
    const similar = allMedia
      .filter(m => m.id !== item.id && m.category === item.category && (m.url || m.thumbnail))
      .slice(0, 6);

    const overlay = document.createElement('div');
    overlay.id = 'detail-modal-overlay';
    overlay.className = 'detail-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="detail-modal lf-glass">
        <button class="detail-close" aria-label="Close">✕</button>
        <div class="detail-hero">
          ${item.type === 'video' && item.url
            ? `<video class="detail-hero-media" src="${esc(window.LoveFlixCloud?.streamingUrl(item.url) || item.url)}" muted loop autoplay playsinline ${item.thumbnail ? `poster="${esc(item.thumbnail)}"` : ''}></video>`
            : `<img class="detail-hero-media" src="${esc(item.url || item.thumbnail || '')}" alt="${esc(item.title || '')}">`}
          <div class="detail-hero-fade"></div>
          <h2 class="detail-title">${esc(item.title || 'Memory')}</h2>
        </div>
        <div class="detail-body">
          <div class="detail-actions">
            <button class="hero-btn hero-btn-play lf-btn-shine detail-play"><span class="lf-icon">${window.LFIcons?.get('play') || '▶'}</span> Play</button>
            <button class="hero-btn hero-btn-list detail-like"><span class="lf-icon">${window.LFIcons?.get(isFav ? 'heartFill' : 'heart') || '♡'}</span> ${isFav ? 'Liked' : 'Like'}</button>
          </div>
          <div class="detail-meta">
            ${item.category ? `<span class="caption-chip">${esc(item.category)}</span>` : ''}
            ${item.memoryDate ? `<span class="caption-chip">📅 ${esc(formatDate ? formatDate(item.memoryDate) : item.memoryDate)}</span>` : ''}
            ${item.type ? `<span class="caption-chip">${item.type === 'video' ? '🎬 Video' : '📸 Photo'}</span>` : ''}
          </div>
          ${item.description ? `<p class="detail-desc">${esc(item.description)}</p>` : ''}
          ${similar.length > 0 ? `
            <div class="detail-similar-label">More like this</div>
            <div class="detail-similar"></div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.detail-close')?.addEventListener('click', close);

    overlay.querySelector('.detail-play')?.addEventListener('click', () => {
      (pageTransition || (u => window.location.href = u))(`viewer.html?id=${encodeURIComponent(item.id)}`);
    });

    overlay.querySelector('.detail-like')?.addEventListener('click', (e) => {
      const favs = (retrieve && retrieve('favorites')) || [];
      const idx = favs.indexOf(item.id);
      if (idx >= 0) {
        favs.splice(idx, 1);
        e.currentTarget.innerHTML = `<span class="lf-icon">${window.LFIcons?.get('heart') || '♡'}</span> Like`;
      } else {
        favs.push(item.id);
        e.currentTarget.innerHTML = `<span class="lf-icon">${window.LFIcons?.get('heartFill') || '❤️'}</span> Liked`;
        heartBurst?.(e.clientX, e.clientY);
      }
      store?.('favorites', favs);
    });

    const similarGrid = overlay.querySelector('.detail-similar');
    if (similarGrid) {
      similar.forEach(s => {
        const mini = document.createElement('button');
        mini.className = 'detail-similar-card';
        mini.setAttribute('aria-label', s.title || 'Memory');
        mini.innerHTML = `
          <img src="${esc(s.thumbnail || s.url)}" alt="" loading="lazy">
          <span>${esc(s.title || '')}</span>
        `;
        mini.addEventListener('click', () => { close(); openDetailModal(s); });
        similarGrid.appendChild(mini);
      });
    }
  }

  /* ---- Anniversary countdown ---- */
  function initCountdownChip(dateStr) {
    const chip = document.getElementById('hero-countdown');
    if (!chip) return;
    const start = new Date(dateStr);
    if (isNaN(start)) return;
    const now = new Date();

    // Next monthiversary (same day-of-month) and next yearly anniversary
    const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    let next = null;
    for (let add = 0; add <= 2 && !next; add++) {
      const cand = new Date(start);
      cand.setMonth(start.getMonth() + monthsPassed + add);
      if (cand > now) next = { date: cand, months: monthsPassed + add };
    }
    if (!next) return;

    const days = Math.ceil((next.date - now) / 86400000);
    const m = next.months;
    const label = m % 12 === 0
      ? `${m / 12} year${m / 12 > 1 ? 's' : ''}`
      : `${m} month${m > 1 ? 's' : ''}`;
    chip.textContent = days === 0 ? `💍 Today: ${label} together! 🎉` : `💍 ${days} day${days > 1 ? 's' : ''} until ${label}`;
    chip.style.display = '';
    chip.addEventListener('click', () => openStatsModal());
    if (days === 0 && launchConfetti) launchConfetti(3000);
  }

  /* ---- Stats modal ---- */
  function openStatsModal() {
    document.getElementById('stats-modal-overlay')?.remove();
    const days = daysBetween ? daysBetween(startDate) : 0;
    const photos = rawMedia.filter(m => m.type === 'image').length;
    const videos = rawMedia.filter(m => m.type === 'video').length;
    const favs = ((retrieve && retrieve('favorites')) || []).length;

    const overlay = document.createElement('div');
    overlay.id = 'stats-modal-overlay';
    overlay.className = 'detail-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <div class="stats-modal lf-glass">
        <button class="detail-close" aria-label="Close">✕</button>
        <div class="stats-heart">💕</div>
        <h2 class="stats-title">Our Story in Numbers</h2>
        <div class="stats-grid">
          <div class="stats-cell"><strong>${days.toLocaleString()}</strong><span>days together</span></div>
          <div class="stats-cell"><strong>${rawMedia.length}</strong><span>memories</span></div>
          <div class="stats-cell"><strong>${photos}</strong><span>photos</span></div>
          <div class="stats-cell"><strong>${videos}</strong><span>videos</span></div>
          <div class="stats-cell"><strong>${favs}</strong><span>favorites</span></div>
          <div class="stats-cell"><strong>∞</strong><span>love</span></div>
        </div>
        <p class="stats-since">Since ${esc(formatDate ? formatDate(startDate) : startDate)}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.detail-close')?.addEventListener('click', close);
    launchConfetti?.(1500);
  }

  /* ---- Love note modal ---- */
  async function openLoveNote() {
    let notes = [];
    try {
      notes = await Storage?.getAll('notes', 'sortOrder') || [];
    } catch (e) {
      console.warn('[Home] Notes load failed:', e);
    }
    if (!notes || notes.length === 0) {
      notes = Storage?.getDemoData('notes') || [];
    }
    if (notes.length === 0) {
      Notify?.info('No love notes yet — write one in Admin → Love Notes 💌');
      return;
    }
    const note = notes[Math.floor(Math.random() * notes.length)];

    document.getElementById('note-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'note-modal-overlay';
    overlay.className = 'detail-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <div class="note-modal lf-glass">
        <button class="detail-close" aria-label="Close">✕</button>
        <div class="note-envelope">💌</div>
        <p class="note-text" id="note-text"></p>
        <p class="note-from" id="note-from"></p>
      </div>
    `;
    document.body.appendChild(overlay);
    heartBurst?.(window.innerWidth / 2, window.innerHeight / 2, 14);

    const textEl = overlay.querySelector('#note-text');
    const fromEl = overlay.querySelector('#note-from');
    if (typewriter && textEl) {
      typewriter(textEl, note.text || '', 32);
    } else if (textEl) {
      textEl.textContent = note.text || '';
    }
    setTimeout(() => {
      if (fromEl && note.from) fromEl.textContent = `— ${note.from}`;
    }, (note.text || '').length * 32 + 300);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.detail-close')?.addEventListener('click', close);
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

  /* ---- Placeholders / search / profile chip ---- */
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
    Storage?.getProfiles().then(profiles => {
      const p = (profiles || []).find(x => x.slug === slug || x.id === slug);
      if (p?.name) chip.textContent = `💕 ${p.name}`;
    }).catch(() => {});
  }
});
