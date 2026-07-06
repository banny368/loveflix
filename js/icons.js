/* ============================================
   LOVEFLIX — Premium SVG Icon System (v4)
   Lucide-style: 24x24, stroke currentColor 1.8,
   round caps. No emoji in UI chrome.
   ============================================ */

const LFIcons = (() => {
  const wrap = (inner, filled = false) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const icons = {
    home: wrap('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    timeline: wrap('<path d="M12 6.5C10.6 4.9 8.6 4 6.5 4 4.6 4 3 4.6 3 4.6V19s1.6-.6 3.5-.6c2.1 0 4.1.9 5.5 2.5 1.4-1.6 3.4-2.5 5.5-2.5 1.9 0 3.5.6 3.5.6V4.6S19.4 4 17.5 4c-2.1 0-4.1.9-5.5 2.5Z"/><path d="M12 6.5V21"/>'),
    credits: wrap('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m3 7 2.8-4 4.2 1-2.8 4"/><path d="m10 4 4.2 1-2.8 4"/><path d="m17.2 5.9 3.8 1.1"/>'),
    profiles: wrap('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 15.2c2.4.3 4 2 4 4.3"/>'),
    chat: wrap('<path d="M21 12a8 8 0 0 1-8 8H4l1.7-3.4A8 8 0 1 1 21 12Z"/><path d="M12 14.4s-2.8-1.7-2.8-3.6c0-1 .8-1.8 1.7-1.8.5 0 .9.2 1.1.6.2-.4.6-.6 1.1-.6.9 0 1.7.8 1.7 1.8 0 1.9-2.8 3.6-2.8 3.6Z"/>'),
    dice: wrap('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    envelope: wrap('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    search: wrap('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>'),
    menu: wrap('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>'),
    close: wrap('<path d="m6 6 12 12"/><path d="M18 6 6 18"/>'),
    music: wrap('<path d="M9 18V6l10-2v11.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>'),
    musicOff: wrap('<path d="M9 10.5V18"/><path d="M9 6l10-2v7"/><circle cx="6.5" cy="18" r="2.5"/><path d="m3 3 18 18"/>'),
    play: wrap('<path d="M7 5.5v13a.6.6 0 0 0 .9.5l10.6-6.5a.6.6 0 0 0 0-1L7.9 5a.6.6 0 0 0-.9.5Z"/>', true),
    playOutline: wrap('<path d="M7 5.5v13a.6.6 0 0 0 .9.5l10.6-6.5a.6.6 0 0 0 0-1L7.9 5a.6.6 0 0 0-.9.5Z"/>'),
    pause: wrap('<rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/>', true),
    volume: wrap('<path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M17.6 6.4a7.6 7.6 0 0 1 0 11.2"/>'),
    volumeMute: wrap('<path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z"/><path d="m15.5 9.5 5 5"/><path d="m20.5 9.5-5 5"/>'),
    fullscreen: wrap('<path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5V8"/><path d="M16 3h3.5A1.5 1.5 0 0 1 21 4.5V8"/><path d="M8 21H4.5A1.5 1.5 0 0 1 3 19.5V16"/><path d="M16 21h3.5a1.5 1.5 0 0 0 1.5-1.5V16"/>'),
    pip: wrap('<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><rect x="12.5" y="11.5" width="7" height="5" rx="1" fill="currentColor" stroke="none"/>'),
    back: wrap('<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>'),
    forward: wrap('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    rewind10: wrap('<path d="M4 9a9 9 0 1 1-1 6.5"/><path d="M4 4v5h5"/><text x="9" y="16" font-size="7.5" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="bold">10</text>'),
    forward10: wrap('<path d="M20 9a9 9 0 1 0 1 6.5"/><path d="M20 4v5h-5"/><text x="8" y="16" font-size="7.5" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="bold">10</text>'),
    download: wrap('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>'),
    share: wrap('<circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="5.5" r="2.6"/><circle cx="17.5" cy="18.5" r="2.6"/><path d="m8.4 10.8 6.8-4"/><path d="m8.4 13.2 6.8 4"/>'),
    heart: wrap('<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.7 3.6 4.5 6.8 4.5c2 0 3.6 1 4.4 2.5.8-1.5 2.4-2.5 4.4-2.5 3.2 0 5.3 3.2 4.1 6.3C21.5 15.4 12 20 12 20Z"/>'),
    heartFill: wrap('<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.7 3.6 4.5 6.8 4.5c2 0 3.6 1 4.4 2.5.8-1.5 2.4-2.5 4.4-2.5 3.2 0 5.3 3.2 4.1 6.3C21.5 15.4 12 20 12 20Z"/>', true),
    slideshow: wrap('<circle cx="12" cy="12" r="9"/><path d="M10 8.8v6.4a.5.5 0 0 0 .8.4l4.8-3.2a.5.5 0 0 0 0-.8L10.8 8.4a.5.5 0 0 0-.8.4Z"/>'),
    edit: wrap('<path d="M17 3.5 20.5 7 8.5 19H5v-3.5L17 3.5Z"/><path d="m14.5 6 3.5 3.5"/>'),
    star: wrap('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z"/>'),
    starFill: wrap('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z"/>', true),
    trash: wrap('<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6 7v13h12V7"/><path d="M10 11v5"/><path d="M14 11v5"/>'),
    plus: wrap('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    calendar: wrap('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10h17"/>'),
    settings: wrap('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/><path d="m5 5 2.1 2.1"/><path d="m16.9 16.9 2.1 2.1"/><path d="m19 5-2.1 2.1"/><path d="m7.1 16.9L5 19"/>'),
    dashboard: wrap('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>'),
    upload: wrap('<path d="M12 16V5"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>'),
    image: wrap('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 3 3 3.5-3.5L20 17"/>'),
    film: wrap('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M3.5 9H8"/><path d="M3.5 15H8"/><path d="M16 9h4.5"/><path d="M16 15h4.5"/>'),
    shield: wrap('<path d="M12 3 5 6v5c0 4.4 2.9 8.2 7 9.5 4.1-1.3 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 11.5 2 2 4-4"/>'),
    plug: wrap('<path d="M9 7V3.5"/><path d="M15 7V3.5"/><path d="M6.5 7h11v4a5.5 5.5 0 0 1-11 0V7Z"/><path d="M12 16.5v4"/>'),
    lock: wrap('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>'),
    save: wrap('<path d="M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 4v5h7V4"/><rect x="8" y="14" width="8" height="6"/>'),
    send: wrap('<path d="m21 3-9.5 9.5"/><path d="M21 3 14 21l-2.5-8.5L3 10l18-7Z"/>'),
    check: wrap('<path d="m4.5 12.5 5 5 10-11"/>'),
    logout: wrap('<path d="M9 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4h4"/><path d="m15 8 4.5 4L15 16"/><path d="M19.5 12H9"/>'),
    external: wrap('<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5"/>'),
    copy: wrap('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    test: wrap('<path d="M9.5 3h5"/><path d="M10.5 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19L13.5 9V3"/><path d="M7.5 15h9"/>'),
    sparkle: wrap('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>'),
    eye: wrap('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
    refresh: wrap('<path d="M20 5v5h-5"/><path d="M4 19v-5h5"/><path d="M5.5 9A7.5 7.5 0 0 1 19 7.5L20 10"/><path d="M18.5 15A7.5 7.5 0 0 1 5 16.5L4 14"/>')
  };

  function get(name) {
    return icons[name] || '';
  }

  // Replace every [data-icon="name"] element's content with its SVG
  function boot() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const svg = get(el.dataset.icon);
      if (svg) el.innerHTML = svg;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return { get, boot };
})();

window.LFIcons = LFIcons;
