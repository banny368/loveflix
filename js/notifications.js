/* ============================================
   LOVEFLIX — Toast Notifications
   ============================================ */

const LoveFlixNotify = (() => {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'lf-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:900;display:flex;flex-direction:column;gap:12px;max-width:400px;width:calc(100% - 40px);pointer-events:none;';
      document.body.appendChild(container);
    }
    return container;
  }

  const icons = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠', love: '❤'
  };
  const colors = {
    success: '#22C55E', error: '#EF4444', info: '#3B82F6', warning: '#F59E0B', love: '#E50914'
  };

  function show(message, type = 'info', duration = 0) {
    duration = duration || window.LoveFlixConfig?.app?.toastDuration || 4000;
    const c = ensureContainer();
    const accent = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `pointer-events:auto;display:flex;align-items:center;gap:12px;padding:14px 18px;background:rgba(30,30,30,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-left:3px solid ${accent};border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;position:relative;overflow:hidden;font-family:'Poppins',sans-serif;`;

    toast.innerHTML = `
      <span style="flex-shrink:0;font-size:18px;color:${accent};">${icons[type]}</span>
      <span style="flex:1;font-size:14px;color:#f5f5f5;line-height:1.4;">${message}</span>
      <button aria-label="Close" style="flex-shrink:0;background:none;border:none;color:#808080;cursor:pointer;padding:4px;font-size:18px;line-height:1;">&times;</button>
      <div style="position:absolute;bottom:0;left:0;height:3px;background:${accent};border-radius:0 0 0 12px;animation:progressBar ${duration}ms linear forwards;"></div>
    `;

    toast.querySelector('button').onclick = () => dismiss(toast);
    c.appendChild(toast);
    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;
    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }

  return {
    show, dismiss,
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
    love: (msg, dur) => show(msg, 'love', dur)
  };
})();

window.LoveFlixNotify = LoveFlixNotify;
