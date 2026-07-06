/* ============================================
   LOVEFLIX — Custom Video Player (v3)
   Netflix-style controls for the viewer
   ============================================ */

const LoveFlixPlayer = (() => {
  let current = null; // { root, video, cleanups: [], hideTimer, upnextTimer }

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    current?.cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  function isActive() {
    return !!current;
  }

  function unmount() {
    if (!current) return;
    clearTimeout(current.hideTimer);
    clearInterval(current.upnextTimer);
    current.cleanups.forEach(fn => { try { fn(); } catch {} });
    try { current.video.pause(); current.video.removeAttribute('src'); current.video.load(); } catch {}
    current.root.remove();
    current = null;
  }

  function mount(container, item, opts = {}) {
    unmount();
    const esc = window.LoveFlixUtils?.escapeHtml || (s => s ?? '');
    const Cloud = window.LoveFlixCloud;
    const src = Cloud?.streamingUrl(item.url) || item.url;
    const poster = item.thumbnail || '';

    const root = document.createElement('div');
    root.className = 'lf-player';
    root.innerHTML = `
      <div class="lf-player-ambient" style="${poster ? `background-image:url('${esc(poster)}')` : ''}"></div>
      <video class="lf-player-video" playsinline preload="metadata" ${poster ? `poster="${esc(poster)}"` : ''}></video>
      <div class="lf-player-spinner" aria-hidden="true"><span>❤</span></div>
      <div class="lf-player-flash" aria-hidden="true">▶</div>
      <div class="lf-seek-ind lf-seek-back" aria-hidden="true">${window.LFIcons?.get('rewind10') || '⟲'}</div>
      <div class="lf-seek-ind lf-seek-fwd" aria-hidden="true">${window.LFIcons?.get('forward10') || '⟳'}</div>

      <div class="lf-player-controls">
        <div class="lf-progress-wrap" role="slider" aria-label="Seek" tabindex="0">
          <div class="lf-progress-track">
            <div class="lf-progress-buffered"></div>
            <div class="lf-progress-played"><div class="lf-progress-thumb"></div></div>
          </div>
          <div class="lf-progress-tooltip">0:00</div>
        </div>
        <div class="lf-controls-row">
          <button class="lf-ctrl lf-play" aria-label="Play or pause">${window.LFIcons?.get('play') || '▶'}</button>
          <div class="lf-volume-wrap">
            <button class="lf-ctrl lf-mute" aria-label="Mute or unmute">🔊</button>
            <input type="range" class="lf-volume" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          </div>
          <span class="lf-time"><span class="lf-time-cur">0:00</span><span class="lf-time-sep"> / </span><span class="lf-time-dur">0:00</span></span>
          <div class="lf-controls-spacer"></div>
          <div class="lf-speed-wrap">
            <button class="lf-ctrl lf-speed-btn" aria-label="Playback speed">1x</button>
            <div class="lf-speed-menu" role="menu">
              ${SPEEDS.map(s => `<button role="menuitem" data-speed="${s}" class="${s === 1 ? 'active' : ''}">${s}x</button>`).join('')}
            </div>
          </div>
          <button class="lf-ctrl lf-pip" aria-label="Picture in picture" style="display:none;">${window.LFIcons?.get('pip') || '⧉'}</button>
          <button class="lf-ctrl lf-fs" aria-label="Fullscreen">${window.LFIcons?.get('fullscreen') || '⛶'}</button>
        </div>
      </div>

      <div class="lf-upnext" aria-hidden="true">
        <div class="lf-upnext-card">
          <div class="lf-upnext-label">Up Next</div>
          <img class="lf-upnext-thumb" alt="">
          <div class="lf-upnext-title"></div>
          <div class="lf-upnext-actions">
            <button class="lf-upnext-play"><span class="lf-icon">${window.LFIcons?.get('play') || '▶'}</span> Play now <span class="lf-upnext-count">(5)</span></button>
            <button class="lf-upnext-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(root);
    const video = root.querySelector('.lf-player-video');
    current = { root, video, cleanups: [], hideTimer: null, upnextTimer: null };
    video.src = src;

    const q = sel => root.querySelector(sel);
    const playBtn = q('.lf-play');
    const muteBtn = q('.lf-mute');
    const volSlider = q('.lf-volume');
    const timeCur = q('.lf-time-cur');
    const timeDur = q('.lf-time-dur');
    const progressWrap = q('.lf-progress-wrap');
    const played = q('.lf-progress-played');
    const buffered = q('.lf-progress-buffered');
    const tooltip = q('.lf-progress-tooltip');
    const speedBtn = q('.lf-speed-btn');
    const speedMenu = q('.lf-speed-menu');
    const pipBtn = q('.lf-pip');
    const fsBtn = q('.lf-fs');
    const spinner = q('.lf-player-spinner');
    const flash = q('.lf-player-flash');
    const upnext = q('.lf-upnext');

    /* ---- Core transport ---- */
    function flashIcon(symbol) {
      flash.innerHTML = symbol;
      flash.classList.remove('show');
      void flash.offsetHeight;
      flash.classList.add('show');
    }

    function togglePlay() {
      if (video.paused) {
        video.play().catch(() => {});
        flashIcon(window.LFIcons?.get('play') || '▶');
      } else {
        video.pause();
        flashIcon(window.LFIcons?.get('pause') || '⏸');
      }
    }

    function seekBy(delta) {
      video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
      const ind = q(delta < 0 ? '.lf-seek-back' : '.lf-seek-fwd');
      ind.classList.remove('show');
      void ind.offsetHeight;
      ind.classList.add('show');
    }

    /* ---- Controls visibility ---- */
    function showControls() {
      root.classList.remove('controls-hidden');
      clearTimeout(current.hideTimer);
      if (!video.paused) {
        current.hideTimer = setTimeout(() => root.classList.add('controls-hidden'), 3000);
      }
    }

    on(root, 'mousemove', showControls);
    on(root, 'touchstart', showControls, { passive: true });

    /* ---- Video events ---- */
    on(video, 'play', () => { playBtn.innerHTML = window.LFIcons?.get('pause') || '⏸'; showControls(); hideUpNext(); });
    on(video, 'pause', () => { playBtn.innerHTML = window.LFIcons?.get('play') || '▶'; showControls(); });
    on(video, 'waiting', () => spinner.classList.add('show'));
    on(video, 'playing', () => spinner.classList.remove('show'));
    on(video, 'canplay', () => spinner.classList.remove('show'));
    on(video, 'loadedmetadata', () => { timeDur.textContent = fmt(video.duration); });
    on(video, 'timeupdate', () => {
      timeCur.textContent = fmt(video.currentTime);
      if (video.duration) {
        played.style.width = (video.currentTime / video.duration) * 100 + '%';
      }
    });
    on(video, 'progress', () => {
      try {
        if (video.buffered.length && video.duration) {
          const end = video.buffered.end(video.buffered.length - 1);
          buffered.style.width = (end / video.duration) * 100 + '%';
        }
      } catch {}
    });
    on(video, 'ended', () => {
      playBtn.innerHTML = window.LFIcons?.get('play') || '▶';
      root.classList.remove('controls-hidden');
      showUpNext();
      if (typeof opts.onEnded === 'function') opts.onEnded();
    });

    /* ---- Click / tap gestures on the video surface ---- */
    let lastTap = 0;
    let lastTapX = 0;
    on(video, 'click', (e) => {
      e.stopPropagation();
      const now = Date.now();
      const isTouch = matchMedia('(hover: none)').matches;
      if (isTouch && now - lastTap < 320) {
        // double-tap: seek by side
        const rect = root.getBoundingClientRect();
        const x = (e.clientX || lastTapX) - rect.left;
        seekBy(x < rect.width / 2 ? -10 : 10);
        lastTap = 0;
        return;
      }
      lastTap = now;
      lastTapX = e.clientX;
      if (isTouch) {
        // single tap just reveals controls; play/pause via button
        showControls();
      } else {
        togglePlay();
      }
    });
    on(video, 'dblclick', (e) => {
      e.stopPropagation();
      if (!matchMedia('(hover: none)').matches) toggleFullscreen();
    });

    /* ---- Buttons ---- */
    on(playBtn, 'click', (e) => { e.stopPropagation(); togglePlay(); });
    on(muteBtn, 'click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      muteBtn.innerHTML = window.LFIcons?.get(video.muted ? 'volumeMute' : 'volume') || (video.muted ? '🔇' : '🔊');
      volSlider.value = video.muted ? 0 : video.volume;
    });
    on(volSlider, 'input', () => {
      video.volume = Number(volSlider.value);
      video.muted = video.volume === 0;
      muteBtn.innerHTML = window.LFIcons?.get(video.muted ? 'volumeMute' : 'volume') || (video.muted ? '🔇' : '🔊');
    });
    on(speedBtn, 'click', (e) => { e.stopPropagation(); speedMenu.classList.toggle('open'); });
    speedMenu.querySelectorAll('[data-speed]').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        const s = Number(btn.dataset.speed);
        video.playbackRate = s;
        speedBtn.textContent = s + 'x';
        speedMenu.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        speedMenu.classList.remove('open');
      });
    });
    if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
      pipBtn.style.display = '';
      on(pipBtn, 'click', async (e) => {
        e.stopPropagation();
        try {
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else await video.requestPictureInPicture();
        } catch {}
      });
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) root.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.();
    }
    on(fsBtn, 'click', (e) => { e.stopPropagation(); toggleFullscreen(); });

    /* ---- Seek bar (pointer-based scrubbing + hover tooltip) ---- */
    function posToTime(clientX) {
      const rect = progressWrap.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return { ratio, time: ratio * (video.duration || 0) };
    }

    let scrubbing = false;
    on(progressWrap, 'pointerdown', (e) => {
      e.stopPropagation();
      scrubbing = true;
      progressWrap.setPointerCapture(e.pointerId);
      const { time } = posToTime(e.clientX);
      video.currentTime = time;
    });
    on(progressWrap, 'pointermove', (e) => {
      const { ratio, time } = posToTime(e.clientX);
      tooltip.textContent = fmt(time);
      tooltip.style.left = ratio * 100 + '%';
      if (scrubbing) video.currentTime = time;
    });
    on(progressWrap, 'pointerup', () => { scrubbing = false; });
    on(progressWrap, 'pointercancel', () => { scrubbing = false; });

    /* ---- Keyboard (document-level, removed on unmount) ---- */
    on(document, 'keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          video.muted = !video.muted;
          muteBtn.innerHTML = window.LFIcons?.get(video.muted ? 'volumeMute' : 'volume') || (video.muted ? '🔇' : '🔊');
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowleft':
          if (!e.shiftKey) { e.preventDefault(); seekBy(-10); }
          break;
        case 'arrowright':
          if (!e.shiftKey) { e.preventDefault(); seekBy(10); }
          break;
        case 'arrowup':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          volSlider.value = video.volume;
          break;
        case 'arrowdown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          volSlider.value = video.volume;
          break;
      }
    });

    /* ---- Up Next ---- */
    function showUpNext() {
      const next = typeof opts.getNext === 'function' ? opts.getNext() : null;
      if (!next) return;
      upnext.querySelector('.lf-upnext-thumb').src = next.thumbnail || next.url || '';
      upnext.querySelector('.lf-upnext-title').textContent = next.title || 'Next memory';
      upnext.classList.add('show');
      upnext.setAttribute('aria-hidden', 'false');
      let remaining = 5;
      const countEl = upnext.querySelector('.lf-upnext-count');
      countEl.textContent = `(${remaining})`;
      clearInterval(current.upnextTimer);
      current.upnextTimer = setInterval(() => {
        remaining--;
        countEl.textContent = `(${remaining})`;
        if (remaining <= 0) {
          hideUpNext();
          opts.onNext?.();
        }
      }, 1000);
    }

    function hideUpNext() {
      clearInterval(current?.upnextTimer);
      upnext.classList.remove('show');
      upnext.setAttribute('aria-hidden', 'true');
    }

    on(upnext.querySelector('.lf-upnext-play'), 'click', (e) => {
      e.stopPropagation();
      hideUpNext();
      opts.onNext?.();
    });
    on(upnext.querySelector('.lf-upnext-cancel'), 'click', (e) => {
      e.stopPropagation();
      hideUpNext();
    });

    // Prevent clicks inside controls from toggling the viewer's chrome
    on(root.querySelector('.lf-player-controls'), 'click', (e) => e.stopPropagation());

    // Autoplay (muted-free attempt; browsers may require interaction)
    video.play().catch(() => { root.classList.remove('controls-hidden'); });

    return current;
  }

  return { mount, unmount, isActive };
})();

window.LoveFlixPlayer = LoveFlixPlayer;
