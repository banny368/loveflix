/* ============================================
   LOVEFLIX — Couple Chat (v4)
   Realtime Firestore chat for the two of you
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const Storage = window.LoveFlixStorage;
  const Utils = window.LoveFlixUtils;
  const Notify = window.LoveFlixNotify;
  const esc = Utils?.escapeHtml || (s => s ?? '');

  const messagesEl = document.getElementById('chat-messages');
  const loadingEl = document.getElementById('chat-loading');
  const composer = document.getElementById('chat-composer');
  const input = document.getElementById('chat-input');
  const identityOverlay = document.getElementById('identity-overlay');
  const identityName = document.getElementById('chat-identity-name');

  // ---- Mobile menu (shared wiring) ----
  const mobileMenuBtn = document.getElementById('navbar-menu-btn');
  const mobileMenu = document.getElementById('navbar-mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
      mobileMenuBtn.innerHTML = window.LFIcons?.get(isOpen ? 'close' : 'menu') || '☰';
    });
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.innerHTML = window.LFIcons?.get('menu') || '☰';
      }
    });
  }

  // ---- Identity ----
  let identity = Utils?.retrieve('chatIdentity') || null;

  async function partnerNames() {
    let a = window.LoveFlixConfig?.relationship?.partnerA || 'Partner 1';
    let b = window.LoveFlixConfig?.relationship?.partnerB || 'Partner 2';
    try {
      const s = await Storage?.getSettings();
      if (s?.partnerA) a = s.partnerA;
      if (s?.partnerB) b = s.partnerB;
    } catch {}
    return [a, b];
  }

  async function openIdentityPicker() {
    const [a, b] = await partnerNames();
    const options = document.getElementById('identity-options');
    if (options) {
      options.innerHTML = '';
      [a, b].forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'identity-option';
        btn.textContent = name;
        btn.addEventListener('click', () => {
          options.querySelectorAll('.identity-option').forEach(o => o.classList.toggle('selected', o === btn));
          const custom = document.getElementById('identity-custom');
          if (custom) custom.value = name;
        });
        options.appendChild(btn);
      });
    }
    identityOverlay.style.display = '';
  }

  document.getElementById('identity-save')?.addEventListener('click', () => {
    const name = document.getElementById('identity-custom')?.value.trim();
    if (!name) { Notify?.warning('Pick or type your name first 💕'); return; }
    identity = {
      name,
      deviceId: identity?.deviceId || (Utils?.generateId ? Utils.generateId() : String(Date.now()))
    };
    Utils?.store('chatIdentity', identity);
    if (identityName) identityName.textContent = identity.name;
    identityOverlay.style.display = 'none';
    input?.focus();
  });

  document.getElementById('chat-identity-btn')?.addEventListener('click', openIdentityPicker);

  if (identity?.name) {
    if (identityName) identityName.textContent = identity.name;
  } else {
    openIdentityPicker();
  }

  // ---- Messages (realtime) ----
  const db = window.LoveFlixFirebase?.getDb();
  if (!db) {
    if (loadingEl) {
      loadingEl.innerHTML = 'Chat needs your database connection.<br><span style="font-size:12px;color:var(--lf-text-muted);">Set up Firebase in Admin → Connections, then publish the updated Database Rules.</span>';
    }
    composer?.classList.add('disabled');
    if (input) input.disabled = true;
  } else {
    let firstRender = true;
    Storage.onSnapshot('chat', (messages) => {
      renderMessages(messages || [], firstRender);
      firstRender = false;
    }, 'sortOrder');
  }

  function dayLabel(ts) {
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
    if (!d) return null;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const same = (x, y) => x.toDateString() === y.toDateString();
    if (same(d, today)) return 'Today';
    if (same(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function timeLabel(ts) {
    const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : null);
    return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  }

  function renderMessages(messages, jump) {
    if (!messagesEl) return;
    loadingEl?.remove();
    messagesEl.innerHTML = '';

    if (messages.length === 0) {
      messagesEl.innerHTML = `
        <div class="chat-empty">
          <div class="chat-empty-heart">💌</div>
          <p>No messages yet.</p>
          <p class="chat-empty-hint">Say something sweet — it appears instantly on their side too.</p>
        </div>`;
      return;
    }

    let lastDay = null;
    messages.forEach(m => {
      const day = dayLabel(m.createdAt);
      if (day && day !== lastDay) {
        lastDay = day;
        const sep = document.createElement('div');
        sep.className = 'chat-day';
        sep.innerHTML = `<span>${esc(day)}</span>`;
        messagesEl.appendChild(sep);
      }

      const mine = identity && (m.deviceId === identity.deviceId || m.sender === identity.name);
      const row = document.createElement('div');
      row.className = `chat-row ${mine ? 'mine' : 'theirs'}`;
      row.innerHTML = `
        <div class="chat-bubble">
          ${mine ? '' : `<div class="chat-sender">${esc(m.sender || '?')}</div>`}
          <div class="chat-text">${esc(m.text || '')}</div>
          <div class="chat-time">${esc(timeLabel(m.createdAt))}</div>
        </div>
      `;
      messagesEl.appendChild(row);
    });

    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: jump ? 'auto' : 'smooth' });
  }

  // ---- Send ----
  let sending = false;
  composer?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input?.value.trim();
    if (!text || sending) return;
    if (!identity?.name) { openIdentityPicker(); return; }
    if (!db) return;

    sending = true;
    input.value = '';
    try {
      await Storage.add('chat', {
        text,
        sender: identity.name,
        deviceId: identity.deviceId,
        sortOrder: Date.now()
      });
      const rect = document.getElementById('chat-send')?.getBoundingClientRect();
      if (rect) Utils?.heartBurst(rect.left + rect.width / 2, rect.top, 6);
    } catch (err) {
      input.value = text; // give the message back
      const msg = err?.message || '';
      if (/insufficient permissions|permission/i.test(msg)) {
        Notify?.error('Chat is blocked by database rules — open Admin → Connections → Database Rules and publish the updated rules (they include chat now). 🛡️');
      } else {
        Notify?.error('Could not send: ' + msg);
      }
    } finally {
      sending = false;
    }
  });
});
