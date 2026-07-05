/* ============================================
   LOVEFLIX — Full-Screen Viewer Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const Storage = window.LoveFlixStorage;
  const Utils = window.LoveFlixUtils;

  const mediaWrap = document.getElementById('viewer-media');
  const titleEl = document.getElementById('viewer-title');
  const counterEl = document.getElementById('viewer-counter');
  const captionTitle = document.getElementById('caption-title');
  const captionDesc = document.getElementById('caption-desc');
  const slideshowBar = document.getElementById('slideshow-bar');
  const viewerPage = document.querySelector('.viewer-page');

  let allMedia = [];
  let currentIndex = 0;
  let slideshowTimer = null;
  let slideshowActive = false;
  let controlsTimer = null;

  // Load all media
  allMedia = await Storage?.getMedia() || Storage?.getDemoData('media') || [];

  // Find starting item from URL param
  const targetId = Utils?.getUrlParam('id');
  if (targetId) {
    const idx = allMedia.findIndex(m => m.id === targetId);
    if (idx >= 0) currentIndex = idx;
  }

  if (allMedia.length > 0) {
    buildFilmstrip();
    showMedia(currentIndex);
  } else {
    if (mediaWrap) mediaWrap.innerHTML = '<p style="color:#808080;font-size:18px;">No memories yet. Upload some in the Admin panel! 💕</p>';
  }

  /* ---- Filmstrip (quick-jump thumbnails) ---- */
  function buildFilmstrip() {
    const escf = Utils?.escapeHtml || (s => s ?? '');
    const strip = document.createElement('div');
    strip.className = 'viewer-filmstrip';
    strip.id = 'viewer-filmstrip';
    strip.setAttribute('aria-label', 'All memories');
    allMedia.forEach((m, i) => {
      const thumb = document.createElement('button');
      thumb.className = 'filmstrip-thumb';
      thumb.setAttribute('aria-label', m.title || `Memory ${i + 1}`);
      const src = m.thumbnail || m.url;
      thumb.innerHTML = src
        ? `<img src="${escf(src)}" alt="" loading="lazy">${m.type === 'video' ? '<span class="filmstrip-badge">▶</span>' : ''}`
        : '📸';
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = i;
        showMedia(i);
        if (slideshowActive) resetSlideshow();
      });
      strip.appendChild(thumb);
    });
    viewerPage?.insertBefore(strip, document.querySelector('.viewer-bottombar'));
  }

  function updateFilmstrip(index) {
    const strip = document.getElementById('viewer-filmstrip');
    if (!strip) return;
    strip.querySelectorAll('.filmstrip-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    strip.querySelectorAll('.filmstrip-thumb')[index]
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // ---- Navigation ----
  document.getElementById('prev-btn')?.addEventListener('click', () => navigate(-1));
  document.getElementById('next-btn')?.addEventListener('click', () => navigate(1));

  // Keyboard controls — while a video plays, the player owns Space/F/←/→
  // (seek); use Shift+←/→ to switch memories during playback.
  document.addEventListener('keydown', (e) => {
    const playerActive = window.LoveFlixPlayer?.isActive();
    switch(e.key) {
      case 'ArrowLeft':
        if (playerActive && !e.shiftKey) return;
        navigate(-1);
        break;
      case 'ArrowRight':
        if (playerActive && !e.shiftKey) return;
        navigate(1);
        break;
      case 'Escape': goBack(); break;
      case ' ':
        if (playerActive) return;
        e.preventDefault();
        toggleSlideshow();
        break;
      case 'f': case 'F':
        if (playerActive) return;
        toggleFullscreen();
        break;
    }
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  if (mediaWrap) {
    mediaWrap.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    mediaWrap.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        navigate(dx > 0 ? -1 : 1);
      }
    }, { passive: true });

    // Toggle controls on tap
    mediaWrap.addEventListener('click', () => {
      viewerPage?.classList.toggle('controls-hidden');
      resetControlsTimer();
    });
  }

  // Auto-hide controls
  function resetControlsTimer() {
    clearTimeout(controlsTimer);
    viewerPage?.classList.remove('controls-hidden');
    controlsTimer = setTimeout(() => {
      viewerPage?.classList.add('controls-hidden');
    }, 4000);
  }

  document.addEventListener('mousemove', () => resetControlsTimer());

  // ---- Action Buttons ----
  document.getElementById('like-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('liked');
    const icon = btn.querySelector('.viewer-action-icon');
    if (btn.classList.contains('liked')) {
      icon.textContent = '❤️';
      LoveFlixNotify?.love('Added to favorites! 💕');
      Utils?.heartBurst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight - 80);
    } else {
      icon.textContent = '♡';
    }
    // Save to localStorage
    const favorites = Utils?.retrieve('favorites') || [];
    const item = allMedia[currentIndex];
    if (item) {
      const idx = favorites.indexOf(item.id);
      if (idx >= 0) favorites.splice(idx, 1);
      else favorites.push(item.id);
      Utils?.store('favorites', favorites);
    }
  });

  document.getElementById('download-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = allMedia[currentIndex];
    if (!item?.url) return;
    try {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = item.title || 'loveflix-memory';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      LoveFlixNotify?.success('Download started!');
    } catch { LoveFlixNotify?.error('Download failed'); }
  });

  document.getElementById('share-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = allMedia[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title || 'LoveFlix Memory', url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(window.location.href);
      LoveFlixNotify?.success('Link copied! 📋');
    }
  });

  document.getElementById('slideshow-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSlideshow();
  });

  // ---- Core Functions ----
  function showMedia(index) {
    if (!mediaWrap || allMedia.length === 0) return;
    const item = allMedia[index];
    if (!item) return;

    mediaWrap.style.animation = 'none';
    mediaWrap.offsetHeight; // reflow
    mediaWrap.style.animation = '';

    const esc = Utils?.escapeHtml || (s => s ?? '');
    window.LoveFlixPlayer?.unmount();

    if (item.type === 'video' && item.url) {
      mediaWrap.innerHTML = '';
      if (window.LoveFlixPlayer) {
        LoveFlixPlayer.mount(mediaWrap, item, {
          getNext: () => allMedia.length > 1 ? allMedia[(index + 1) % allMedia.length] : null,
          onNext: () => navigate(1)
        });
      } else {
        mediaWrap.innerHTML = `<video src="${esc(item.url)}" controls autoplay playsinline style="max-width:100%;max-height:100%;"></video>`;
      }
    } else if (item.url) {
      const ambientSrc = item.thumbnail || item.url;
      mediaWrap.innerHTML = `
        <div class="viewer-ambient" style="background-image:url('${esc(ambientSrc)}')"></div>
        <img src="${esc(item.url)}" alt="${esc(item.title || 'Memory')}" style="max-width:100%;max-height:100%;object-fit:contain;position:relative;z-index:1;">
      `;
    } else {
      mediaWrap.innerHTML = `<div style="font-size:5rem;opacity:0.3;">📸</div>`;
    }

    // Update UI
    if (titleEl) titleEl.textContent = item.title || '';
    if (counterEl) counterEl.textContent = `${index + 1} / ${allMedia.length}`;
    if (captionTitle) captionTitle.textContent = item.title || '';
    if (captionDesc) captionDesc.textContent = item.description || '';
    const metaEl = document.getElementById('caption-meta');
    if (metaEl) {
      const bits = [];
      if (item.category) bits.push(esc(item.category));
      if (item.memoryDate) bits.push(esc(Utils?.formatDate(item.memoryDate) || item.memoryDate));
      metaEl.innerHTML = bits.map(b => `<span class="caption-chip">${b}</span>`).join('');
    }

    // Filmstrip highlight + recently-viewed tracking (for Continue Watching)
    updateFilmstrip(index);
    if (Utils && item.id) {
      const recent = (Utils.retrieve('recentlyViewed') || []).filter(r => r.id !== item.id);
      recent.unshift({ id: item.id, at: Date.now() });
      Utils.store('recentlyViewed', recent.slice(0, 12));
    }

    // Update URL without reload
    Utils?.setUrlParam('id', item.id);

    // Check if favorited
    const favorites = Utils?.retrieve('favorites') || [];
    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
      const isFav = favorites.includes(item.id);
      likeBtn.classList.toggle('liked', isFav);
      const icon = likeBtn.querySelector('.viewer-action-icon');
      if (icon) icon.textContent = isFav ? '❤️' : '♡';
    }
  }

  function navigate(dir) {
    currentIndex = (currentIndex + dir + allMedia.length) % allMedia.length;
    showMedia(currentIndex);
    if (slideshowActive) resetSlideshow();
  }

  function goBack() {
    stopSlideshow();
    window.LoveFlixPlayer?.unmount();
    // Direct/shared links have no history to go back to
    if (window.history.length <= 1) {
      window.location.href = 'home.html';
    } else {
      window.history.back();
    }
  }

  function toggleSlideshow() {
    if (slideshowActive) { stopSlideshow(); }
    else { startSlideshow(); }
  }

  function startSlideshow() {
    slideshowActive = true;
    const interval = window.LoveFlixConfig?.app?.slideshowInterval || 5000;
    const btn = document.getElementById('slideshow-btn');
    if (btn) btn.querySelector('.viewer-action-icon').textContent = '⏸';
    runSlideshowTick(interval);
    LoveFlixNotify?.info('Slideshow started');
  }

  function runSlideshowTick(interval) {
    let start = Date.now();
    function tick() {
      if (!slideshowActive) return;
      const elapsed = Date.now() - start;
      const progress = (elapsed / interval) * 100;
      if (slideshowBar) slideshowBar.style.width = Math.min(progress, 100) + '%';
      if (elapsed >= interval) {
        navigate(1);
        start = Date.now();
      }
      slideshowTimer = requestAnimationFrame(tick);
    }
    tick();
  }

  function stopSlideshow() {
    slideshowActive = false;
    cancelAnimationFrame(slideshowTimer);
    if (slideshowBar) slideshowBar.style.width = '0';
    const btn = document.getElementById('slideshow-btn');
    if (btn) btn.querySelector('.viewer-action-icon').textContent = '▶';
  }

  function resetSlideshow() {
    stopSlideshow();
    startSlideshow();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // Back button
  document.getElementById('back-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    goBack();
  });
});
