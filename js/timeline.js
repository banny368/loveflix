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

  let lastSeason = null;
  dated.forEach(({ item, date }, i) => {
    const season = seasonOf(date);
    if (season !== null && season !== lastSeason) {
      lastSeason = season;
      const marker = document.createElement('div');
      marker.className = 'timeline-season';
      marker.innerHTML = `<span>Season ${season}</span><em>${season === 1 ? 'Where it all began' : `Month ${season} of us`}</em>`;
      track.appendChild(marker);
    }

    const side = i % 2 === 0 ? 'left' : 'right';
    const entry = document.createElement('article');
    entry.className = `timeline-entry timeline-${side}`;
    entry.innerHTML = `
      <div class="timeline-dot" aria-hidden="true">❤</div>
      <button class="timeline-card lf-glass" aria-label="${esc(item.title || 'Memory')}">
        <div class="timeline-thumb">
          <img src="${esc(item.thumbnail || item.url)}" alt="" loading="lazy">
          ${item.type === 'video' ? '<span class="timeline-badge">▶ Video</span>' : ''}
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
