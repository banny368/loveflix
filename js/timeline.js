/* ============================================
   LOVEFLIX — Timeline Page Logic (v3)
   Our story, episode by episode
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const Storage = window.LoveFlixStorage;
  const Utils = window.LoveFlixUtils;
  const esc = Utils?.escapeHtml || (s => s ?? '');

  // ---- Navbar scroll + progress ----
  const navbar = document.querySelector('.lf-navbar');
  const progressBar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = max > 0 ? (window.scrollY / max) * 100 + '%' : '0';
    }
  }, { passive: true });

  // ---- Mobile menu (same wiring as home) ----
  const mobileMenuBtn = document.getElementById('navbar-menu-btn');
  const mobileMenu = document.getElementById('navbar-mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
      mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
    });
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.textContent = '☰';
      }
    });
  }

  // ---- Page transitions ----
  if (Utils?.pageTransition) {
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        Utils.pageTransition(a.getAttribute('href'));
      });
    });
  }

  // ---- Load data ----
  let media = [];
  let settings = null;
  try {
    [media, settings] = await Promise.all([
      Storage?.getMedia().catch(() => []) || [],
      Storage?.getSettings().catch(() => null)
    ]);
  } catch (e) {
    console.warn('[Timeline] Load failed:', e);
  }
  media = media || [];

  const startDate = new Date(settings?.relationshipStartDate || window.LoveFlixConfig?.relationship?.startDate || '2024-01-01');

  // Effective date per item: memoryDate > createdAt (Firestore Timestamp) > none
  function itemDate(m) {
    if (m.memoryDate) {
      const d = new Date(m.memoryDate);
      if (!isNaN(d)) return d;
    }
    if (m.createdAt?.toDate) return m.createdAt.toDate();
    if (m.createdAt?.seconds) return new Date(m.createdAt.seconds * 1000);
    return null;
  }

  const dated = media
    .filter(m => m.url || m.thumbnail)
    .map(m => ({ item: m, date: itemDate(m) }))
    .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  const track = document.getElementById('timeline-track');
  if (!track) return;

  if (dated.length === 0) {
    track.innerHTML = `
      <div class="timeline-empty">
        <div style="font-size:3rem;margin-bottom:12px;">📖</div>
        <p>Your story is waiting to be written.</p>
        <p style="font-size:13px;color:var(--lf-text-muted);margin-top:6px;">Upload memories in the Admin panel — add a "Memory Date" to place them on the timeline.</p>
      </div>
    `;
    return;
  }

  // "Season" = which month of the relationship a memory falls in
  function seasonOf(date) {
    if (!date || isNaN(startDate)) return null;
    const months = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
    return Math.max(0, months) + 1;
  }

  // ---- Stats strip + season chips + filters (above the track) ----
  const photos = dated.filter(d => d.item.type !== 'video').length;
  const videos = dated.filter(d => d.item.type === 'video').length;
  const seasons = [...new Set(dated.map(d => seasonOf(d.date)).filter(s => s !== null))];

  const header = document.querySelector('.timeline-header');
  if (header) {
    const stats = document.createElement('div');
    stats.className = 'timeline-stats';
    stats.innerHTML = `
      <span><strong>${dated.length}</strong> episodes</span>
      <span><strong>${photos}</strong> photos</span>
      <span><strong>${videos}</strong> videos</span>
      <span><strong>${seasons.length}</strong> seasons</span>
    `;
    header.appendChild(stats);

    const toolbar = document.createElement('div');
    toolbar.className = 'timeline-toolbar';
    toolbar.innerHTML = `
      <div class="timeline-filters" role="group" aria-label="Filter memories">
        <button class="tl-chip active" data-filter="all">All</button>
        <button class="tl-chip" data-filter="image"><span class="lf-icon">${window.LFIcons?.get('image') || ''}</span> Photos</button>
        <button class="tl-chip" data-filter="video"><span class="lf-icon">${window.LFIcons?.get('film') || ''}</span> Videos</button>
      </div>
      ${seasons.length > 1 ? `
      <div class="timeline-seasons-nav" role="group" aria-label="Jump to season">
        ${seasons.map(s => `<button class="tl-chip tl-season-chip" data-season="${s}">S${s}</button>`).join('')}
      </div>` : ''}
    `;
    header.appendChild(toolbar);

    toolbar.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        toolbar.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
        const f = btn.dataset.filter;
        track.querySelectorAll('.timeline-entry').forEach(en => {
          en.style.display = (f === 'all' || en.dataset.type === f) ? '' : 'none';
        });
      });
    });
    toolbar.querySelectorAll('[data-season]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(`season-${btn.dataset.season}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  // ---- Episode 0: The Beginning ----
  if (!isNaN(startDate)) {
    const zero = document.createElement('div');
    zero.className = 'timeline-season timeline-episode-zero';
    zero.innerHTML = `<span>Episode 0</span><em>The Beginning — ${esc(Utils?.formatDate(startDate.toISOString()) || '')}</em>`;
    track.appendChild(zero);
  }

  let lastSeason = null;
  dated.forEach(({ item, date }, i) => {
    const season = seasonOf(date);
    if (season !== null && season !== lastSeason) {
      lastSeason = season;
      const marker = document.createElement('div');
      marker.className = 'timeline-season';
      marker.id = `season-${season}`;
      marker.innerHTML = `<span>Season ${season}</span><em>${season === 1 ? 'Where it all began' : `Month ${season} of us`}</em>`;
      track.appendChild(marker);
    }

    const side = i % 2 === 0 ? 'left' : 'right';
    const entry = document.createElement('article');
    entry.className = `timeline-entry timeline-${side}`;
    entry.dataset.type = item.type === 'video' ? 'video' : 'image';
    entry.innerHTML = `
      <div class="timeline-dot" aria-hidden="true">❤</div>
      <button class="timeline-card lf-glass" aria-label="${esc(item.title || 'Memory')}">
        <div class="timeline-thumb">
          <img src="${esc(item.thumbnail || item.url)}" alt="" loading="lazy">
          ${item.type === 'video' ? `<span class="timeline-badge"><span class="lf-icon">${window.LFIcons?.get('play') || '▶'}</span> Video</span>` : ''}
        </div>
        <div class="timeline-info">
          ${date ? `<time class="timeline-date">${esc(Utils?.formatDate(date.toISOString()) || '')}</time>` : ''}
          <h3 class="timeline-entry-title">${esc(item.title || 'Memory')}</h3>
          ${item.description ? `<p class="timeline-entry-desc">${esc(item.description)}</p>` : ''}
        </div>
      </button>
    `;
    entry.querySelector('.timeline-card').addEventListener('click', () => {
      (Utils?.pageTransition || (u => window.location.href = u))(`viewer.html?id=${encodeURIComponent(item.id)}`);
    });
    track.appendChild(entry);
  });

  document.getElementById('timeline-end').style.display = '';

  // Scroll-triggered entrances
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });

  track.querySelectorAll('.timeline-entry, .timeline-season').forEach(el => observer.observe(el));
});
