/* ============================================
   LOVEFLIX — Utility Functions
   DOM helpers, formatters, lazy loading
   ============================================ */

const LoveFlixUtils = (() => {

  /* ---- DOM Helpers ---- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (key === 'dataset') Object.assign(el.dataset, val);
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  /* ---- Date & Time ---- */
  function daysBetween(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }

  /* ---- Formatting ---- */
  function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  function truncate(str, len = 50) {
    if (!str || str.length <= len) return str;
    return str.substring(0, len) + '...';
  }

  function slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /* ---- Performance Helpers ---- */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function throttle(fn, limit = 100) {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /* ---- Lazy Loading ---- */
  function initLazyLoading(selector = '[data-src]') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.dataset.src) {
            el.src = el.dataset.src;
            el.removeAttribute('data-src');
          }
          if (el.dataset.bgSrc) {
            el.style.backgroundImage = `url(${el.dataset.bgSrc})`;
            el.removeAttribute('data-bg-src');
          }
          el.classList.add('loaded');
          observer.unobserve(el);
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
    return observer;
  }

  /* ---- Local Storage ---- */
  function store(key, value) {
    try {
      localStorage.setItem(`loveflix_${key}`, JSON.stringify(value));
    } catch (e) { console.warn('localStorage error:', e); }
  }

  function retrieve(key, fallback = null) {
    try {
      const val = localStorage.getItem(`loveflix_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch (e) { return fallback; }
  }

  function removeStore(key) {
    localStorage.removeItem(`loveflix_${key}`);
  }

  /* ---- URL Helpers ---- */
  function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setUrlParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
  }

  /* ---- Generate Unique ID ---- */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /* ---- Shuffle Array ---- */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---- Particles Effect ---- */
  function createParticles(container, count = 30, type = 'heart') {
    const symbols = type === 'heart' ? ['❤', '💕', '💖', '✨', '💗'] : ['✨', '⭐', '🌟', '💫'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'floating-particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        font-size: ${Math.random() * 16 + 8}px;
        opacity: ${Math.random() * 0.4 + 0.1};
        pointer-events: none;
        z-index: 0;
        animation: float ${Math.random() * 4 + 3}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
      `;
      container.appendChild(p);
    }
  }

  /* ---- Confetti Effect ---- */
  function launchConfetti(duration = 3000) {
    const colors = ['#E50914', '#FF4D6D', '#FFD700', '#FFC2D1', '#FF6B9D'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < 80; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -20px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
        animation-delay: ${Math.random() * 1}s;
      `;
      container.appendChild(c);
    }

    setTimeout(() => container.remove(), duration + 1000);
  }

  /* ---- Heart Cursor Trail ---- */
  function initHeartTrail() {
    if (!window.LoveFlixConfig?.features?.enableHeartTrail) return;
    const hearts = ['❤', '💕', '💖'];
    let lastTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastTime < 100) return;
      lastTime = now;
      const heart = document.createElement('span');
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        pointer-events: none;
        font-size: 14px;
        z-index: 99999;
        animation: fadeInUp 1s ease forwards;
        opacity: 0.8;
      `;
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    });
  }

  return {
    $, $$, createElement,
    daysBetween, formatDate, timeAgo,
    formatDuration, formatFileSize, truncate, slugify,
    debounce, throttle,
    initLazyLoading,
    store, retrieve, removeStore,
    getUrlParam, setUrlParam,
    generateId, shuffle,
    createParticles, launchConfetti, initHeartTrail
  };
})();

window.LoveFlixUtils = LoveFlixUtils;
