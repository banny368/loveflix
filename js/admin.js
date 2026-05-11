/* ============================================
   LOVEFLIX — Admin Dashboard Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const Auth   = window.LoveFlixAuth;
  const Storage = window.LoveFlixStorage;
  const Cloud   = window.LoveFlixCloud;
  const Notify  = window.LoveFlixNotify;
  const Utils   = window.LoveFlixUtils;

  // =============================================
  // SIDEBAR NAVIGATION — Pure click-based
  // =============================================
  function showSection(targetId) {
    // Hide all sections, show only the target
    document.querySelectorAll('.admin-section').forEach(s => {
      if (s.id === targetId) {
        s.style.display = 'block';
        s.classList.add('active');
      } else {
        s.style.display = 'none';
        s.classList.remove('active');
      }
    });

    // Update sidebar link highlights
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
      link.classList.toggle('active', link.dataset.section === targetId);
    });

    // Update topbar title
    const activeLink = document.querySelector(`.sidebar-link[data-section="${targetId}"]`);
    const topbarTitle = document.getElementById('admin-topbar-title');
    if (topbarTitle && activeLink) {
      const iconSpan = activeLink.querySelector('.sidebar-link-icon');
      const text = iconSpan
        ? activeLink.textContent.replace(iconSpan.textContent, '').trim()
        : activeLink.textContent.trim();
      topbarTitle.textContent = text;
    }

    // Close mobile sidebar
    document.querySelector('.admin-sidebar')?.classList.remove('open');
    document.querySelector('.admin-sidebar-overlay')?.classList.remove('active');
  }

  // Attach click handlers to sidebar nav links
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      if (target) showSection(target);
    });
  });

  // Show dashboard by default on load
  showSection('section-dashboard');

  // Mobile sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.querySelector('.admin-sidebar')?.classList.toggle('open');
    document.querySelector('.admin-sidebar-overlay')?.classList.toggle('active');
  });
  document.querySelector('.admin-sidebar-overlay')?.addEventListener('click', () => {
    document.querySelector('.admin-sidebar')?.classList.remove('open');
    document.querySelector('.admin-sidebar-overlay')?.classList.remove('active');
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => Auth?.logout());

  // Export / Import buttons
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-btn')?.addEventListener('click', () =>
    document.getElementById('import-file')?.click()
  );
  document.getElementById('import-file')?.addEventListener('change', importData);

  // =============================================
  // AUTH + DATA LOAD (async, non-blocking)
  // =============================================
  (async () => {
    await Auth?.requireAuth('admin-login.html');
    loadStats();
    setupUploadZone();
    loadMediaTable();
    loadProfilesManager();
    loadHeroManager();
    loadCreditsManager();
    loadSettingsManager();
    loadLoveCodeManager();
  })();


  // ---- Export / Import ----
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
  document.getElementById('import-file')?.addEventListener('change', importData);

  /* ============================================
     Stats Dashboard
     ============================================ */
  async function loadStats() {
    try {
      const [mediaRaw, profilesRaw, settings] = await Promise.all([
        Storage?.getMedia().catch(() => []),
        Storage?.getProfiles().catch(() => []),
        Storage?.getSettings().catch(() => null)
      ]);

      const media = mediaRaw || [];
      // Use real profiles if any, else demo data count for a meaningful display
      const profiles = (profilesRaw && profilesRaw.length > 0)
        ? profilesRaw
        : (Storage?.getDemoData('profiles') || []);

      const photos = media.filter(m => m.type === 'image').length;
      const videos = media.filter(m => m.type === 'video').length;

      const startDate = settings?.relationshipStartDate
        || window.LoveFlixConfig?.relationship?.startDate
        || '2024-01-01';
      const days = Utils?.daysBetween(startDate) || 0;

      setText('stat-total', media.length);
      setText('stat-photos', photos);
      setText('stat-videos', videos);
      setText('stat-profiles', profiles.length);
      setText('stat-days', days.toLocaleString());
    } catch (e) {
      console.error('Stats load error:', e);
    }
  }

  /* ============================================
     Media Upload
     ============================================ */
  function setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('upload-input');
    if (!zone || !fileInput) return;

    // Click to upload
    zone.addEventListener('click', () => fileInput.click());

    // Drag and drop
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    const progressWrap = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-bar');
    const progressText = document.getElementById('upload-text');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (progressWrap) progressWrap.classList.add('active');
      if (progressText) progressText.textContent = `Uploading ${file.name} (${i + 1}/${files.length})...`;

      try {
        const type = Cloud?.getFileType(file.name) || 'image';
        const result = await Cloud?.upload(file, (pct) => {
          if (progressBar) progressBar.style.width = pct + '%';
        }, type === 'video' ? 'video' : 'image');

        if (result) {
          // Save to Firestore
          const title = document.getElementById('upload-title')?.value || file.name.split('.')[0];
          const category = document.getElementById('upload-category')?.value || 'Our Best Memories';
          const desc = document.getElementById('upload-desc')?.value || '';

          await Storage?.add('media', {
            title: title,
            description: desc,
            type: type,
            url: result.url,
            thumbnail: result.thumbnail,
            cloudinaryPublicId: result.publicId,
            category: category,
            featured: false,
            sortOrder: Date.now(),
            duration: result.duration,
            tags: [],
            profileId: ''
          });

          Notify?.success(`"${title}" uploaded successfully! 🎉`);
        }
      } catch (err) {
        Notify?.error(`Upload failed: ${err.message}`);
      }
    }

    if (progressWrap) progressWrap.classList.remove('active');
    if (progressBar) progressBar.style.width = '0%';

    // Clear form
    document.getElementById('upload-title').value = '';
    document.getElementById('upload-desc').value = '';
    document.getElementById('upload-input').value = '';

    // Refresh table
    loadMediaTable();
    loadStats();
  }

  /* ============================================
     Media Table
     ============================================ */
  async function loadMediaTable() {
    const tbody = document.getElementById('media-tbody');
    if (!tbody) return;

    const media = await Storage?.getMedia() || [];
    tbody.innerHTML = '';

    if (media.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--lf-text-muted);">No media uploaded yet. Start uploading! 📸</td></tr>';
      return;
    }

    media.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img class="admin-table-thumb" src="${item.thumbnail || item.url || ''}" alt="" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2234%22%3E%3Crect fill=%22%23333%22 width=%2260%22 height=%2234%22/%3E%3C/svg%3E'"></td>
        <td>${Utils?.truncate(item.title, 30) || '—'}</td>
        <td>${item.type || '—'}</td>
        <td>${item.category || '—'}</td>
        <td>${item.featured ? '⭐' : '—'}</td>
        <td>
          <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="toggleFeatured('${item.id}', ${!item.featured})">☆</button>
          <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteMedia('${item.id}')">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Global functions for inline handlers
  window.deleteMedia = async (id) => {
    if (!confirm('Delete this memory?')) return;
    await Storage?.remove('media', id);
    Notify?.success('Deleted');
    loadMediaTable();
    loadStats();
  };

  window.toggleFeatured = async (id, val) => {
    await Storage?.update('media', id, { featured: val });
    Notify?.info(val ? 'Marked as featured ⭐' : 'Unfeatured');
    loadMediaTable();
  };

  /* ============================================
     Profiles Manager — Full CRUD
     ============================================ */
  async function loadProfilesManager() {
    const container = document.getElementById('profiles-list');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--lf-text-muted);text-align:center;padding:24px;">Loading... 💕</p>';

    let profiles = [];
    try {
      // Add 5-second timeout to prevent hanging
      const fetchWithTimeout = Promise.race([
        Storage?.getProfiles() || Promise.resolve([]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      profiles = await fetchWithTimeout || [];
    } catch (e) {
      console.warn('[Admin] getProfiles failed or timed out:', e.message);
      profiles = [];
    }

    container.innerHTML = '';
    window._profileCount = profiles.length + 1; // Track for sort order default

    if (profiles.length === 0) {
      container.innerHTML = '<p style="color:var(--lf-text-muted);text-align:center;padding:24px;">No profiles yet. Click "+ Add Profile" to create your first milestone! 💕</p>';
    } else {
      profiles.forEach(p => {
        const card = document.createElement('div');
        card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:10px;';
        const avatar = p.coverImage
          ? `<img src="${p.coverImage}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
          : `<span style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(229,9,20,0.1);border-radius:8px;font-size:22px;flex-shrink:0;">💕</span>`;
        card.innerHTML = `
          ${avatar}
          <div style="flex:1;min-width:0;">
            <div style="color:var(--lf-text-primary);font-weight:500;">${p.name}</div>
            <div style="color:var(--lf-text-muted);font-size:12px;margin-top:2px;">
              Slug: ${p.slug || '—'} &nbsp;|&nbsp;
              <span style="color:${p.active !== false ? '#4ade80' : '#f87171'}">${p.active !== false ? '● Active' : '● Hidden'}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="editProfile('${p.id}')">✏️ Edit</button>
            <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteProfile('${p.id}', '${p.name.replace(/'/g, "\\'")}')">✕</button>
          </div>
        `;
        container.appendChild(card);
      });
    }
  }

  // Profile Modal
  function openProfileModal(profile) {

    // Remove old modal if exists
    document.getElementById('profile-modal-overlay')?.remove();

    const isEdit = !!profile;
    const overlay = document.createElement('div');
    overlay.id = 'profile-modal-overlay';
    overlay.className = 'admin-modal-overlay active';
    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <div class="admin-modal-header">
          <h2 class="admin-modal-title" id="profile-modal-title">${isEdit ? '✏️ Edit Profile' : '+ New Profile'}</h2>
          <button class="admin-modal-close" id="profile-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="pm-name">Profile Name *</label>
          <input class="admin-form-input" id="pm-name" placeholder="e.g. 1 Month, Our First Year..." value="${profile?.name || ''}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="pm-slug">URL Slug *</label>
          <input class="admin-form-input" id="pm-slug" placeholder="e.g. 1-month, first-year" value="${profile?.slug || ''}">
          <small style="color:var(--lf-text-muted);font-size:11px;margin-top:4px;display:block;">Auto-generated from name. Use lowercase letters, numbers, and hyphens only.</small>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="pm-cover">Cover Image URL</label>
          <input class="admin-form-input" id="pm-cover" placeholder="https://... (leave empty for emoji)" value="${profile?.coverImage || ''}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="pm-order">Sort Order</label>
          <input class="admin-form-input" type="number" id="pm-order" placeholder="1, 2, 3..." value="${profile?.sortOrder ?? (window._profileCount || 1)}">
        </div>
        <div class="admin-form-group" style="display:flex;align-items:center;gap:12px;">
          <label class="admin-form-label" style="margin:0;" for="pm-active">Active (visible to viewers)</label>
          <input type="checkbox" id="pm-active" ${profile?.active !== false ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:var(--lf-red);">
        </div>
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn-secondary" id="profile-modal-cancel">Cancel</button>
          <button class="admin-btn admin-btn-primary" id="profile-modal-save">💾 ${isEdit ? 'Update Profile' : 'Add Profile'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-generate slug from name
    const nameInput = document.getElementById('pm-name');
    const slugInput = document.getElementById('pm-slug');
    nameInput?.addEventListener('input', () => {
      if (!isEdit || !slugInput.value) {
        slugInput.value = nameInput.value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }
    });

    // Close handlers
    const closeModal = () => overlay.remove();
    document.getElementById('profile-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('profile-modal-cancel')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    // Save handler
    document.getElementById('profile-modal-save')?.addEventListener('click', async () => {
      const name = document.getElementById('pm-name')?.value.trim();
      const slug = document.getElementById('pm-slug')?.value.trim();
      if (!name) { Notify?.warning('Profile name is required.'); return; }
      if (!slug) { Notify?.warning('URL slug is required.'); return; }

      const data = {
        name,
        slug,
        coverImage: document.getElementById('pm-cover')?.value.trim() || '',
        sortOrder: parseInt(document.getElementById('pm-order')?.value) || Date.now(),
        active: document.getElementById('pm-active')?.checked ?? true
      };

      try {
        const saveBtn = document.getElementById('profile-modal-save');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

        if (isEdit) {
          await Storage?.update('profiles', profile.id, data);
          Notify?.success(`Profile "${name}" updated! 💕`);
        } else {
          await Storage?.add('profiles', data);
          Notify?.success(`Profile "${name}" added! 💕`);
        }
        closeModal();
        loadProfilesManager();
        loadStats();
      } catch (err) {
        Notify?.error('Save failed: ' + err.message);
        const saveBtn = document.getElementById('profile-modal-save');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = isEdit ? '💾 Update Profile' : '💾 Add Profile'; }
      }
    });
  }

  // Global handlers for inline onclick attributes
  window.openProfileModal = openProfileModal;
  window.editProfile = async (id) => {
    const profiles = await Storage?.getProfiles() || [];
    const profile = profiles.find(p => p.id === id);
    if (profile) openProfileModal(profile);
  };

  window.deleteProfile = async (id, name) => {
    if (!confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    try {
      await Storage?.remove('profiles', id);
      Notify?.success(`Profile "${name}" deleted.`);
      loadProfilesManager();
      loadStats();
    } catch (err) {
      Notify?.error('Delete failed: ' + err.message);
    }
  };

  /* ============================================
     Hero Manager — with Upload + Preview
     ============================================ */
  async function loadHeroManager() {
    const hero = await Storage?.getHero();
    if (hero) {
      setText('hero-title-input', hero.title, true);
      setText('hero-subtitle-input', hero.subtitle, true);
      setText('hero-bg-url', hero.backgroundUrl, true);
      if (hero.mediaType) {
        const sel = document.getElementById('hero-media-type');
        if (sel) sel.value = hero.mediaType;
      }
      // Show preview if a URL is set
      updateHeroPreview(hero.backgroundUrl, hero.mediaType || 'image');
    }

    // Hero upload zone
    const heroZone = document.getElementById('hero-upload-zone');
    const heroInput = document.getElementById('hero-upload-input');
    if (heroZone && heroInput) {
      heroZone.addEventListener('click', () => heroInput.click());
      heroZone.addEventListener('dragover', (e) => { e.preventDefault(); heroZone.classList.add('drag-over'); });
      heroZone.addEventListener('dragleave', () => heroZone.classList.remove('drag-over'));
      heroZone.addEventListener('drop', (e) => {
        e.preventDefault();
        heroZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) uploadHeroFile(file);
      });
      heroInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) uploadHeroFile(file);
      });
    }

    // Live preview when URL is typed
    document.getElementById('hero-bg-url')?.addEventListener('input', (e) => {
      const type = document.getElementById('hero-media-type')?.value || 'image';
      updateHeroPreview(e.target.value, type);
    });
    document.getElementById('hero-media-type')?.addEventListener('change', (e) => {
      const url = document.getElementById('hero-bg-url')?.value;
      updateHeroPreview(url, e.target.value);
    });
  }

  function updateHeroPreview(url, type) {
    const wrap = document.getElementById('hero-preview-wrap');
    const img = document.getElementById('hero-preview-img');
    const vid = document.getElementById('hero-preview-vid');
    const empty = document.getElementById('hero-preview-empty');
    if (!wrap) return;

    if (url) {
      wrap.style.display = 'block';
      if (type === 'video') {
        if (img) img.style.display = 'none';
        if (empty) empty.style.display = 'none';
        if (vid) { vid.src = url; vid.style.display = 'block'; }
      } else {
        if (vid) { vid.style.display = 'none'; vid.src = ''; }
        if (empty) empty.style.display = 'none';
        if (img) { img.src = url; img.style.display = 'block'; }
      }
    } else {
      wrap.style.display = 'none';
      if (img) { img.style.display = 'none'; img.src = ''; }
      if (vid) { vid.style.display = 'none'; vid.src = ''; }
      if (empty) empty.style.display = 'flex';
    }
  }

  async function uploadHeroFile(file) {
    const progress = document.getElementById('hero-upload-progress');
    const bar = document.getElementById('hero-upload-bar');
    const text = document.getElementById('hero-upload-text');
    const urlInput = document.getElementById('hero-bg-url');
    const typeSelect = document.getElementById('hero-media-type');

    if (progress) progress.classList.add('active');
    if (text) text.textContent = `Uploading ${file.name}...`;

    try {
      const fileType = Cloud?.getFileType(file.name) || 'image';
      const result = await Cloud?.upload(file, (pct) => {
        if (bar) bar.style.width = pct + '%';
      }, fileType === 'video' ? 'video' : 'image');

      if (result) {
        const url = result.url;
        const type = result.resourceType === 'video' ? 'video' : 'image';

        // Auto-fill URL field and media type
        if (urlInput) urlInput.value = url;
        if (typeSelect) typeSelect.value = type;

        // Show preview
        updateHeroPreview(url, type);

        // Auto-save to Firestore
        const data = {
          title: document.getElementById('hero-title-input')?.value || 'Our Love Story',
          subtitle: document.getElementById('hero-subtitle-input')?.value || '',
          backgroundUrl: url,
          mediaType: type,
          buttonText: 'Play'
        };
        await Storage?.setDoc('hero', 'main', data);
        Notify?.success('Hero background uploaded & saved! 🎬');
      }
    } catch (err) {
      Notify?.error('Upload failed: ' + err.message);
    } finally {
      if (progress) progress.classList.remove('active');
      if (bar) bar.style.width = '0%';
      if (text) text.textContent = 'Uploading...';
    }
  }

  document.getElementById('hero-save')?.addEventListener('click', async () => {
    const data = {
      title: document.getElementById('hero-title-input')?.value || '',
      subtitle: document.getElementById('hero-subtitle-input')?.value || '',
      backgroundUrl: document.getElementById('hero-bg-url')?.value || '',
      mediaType: document.getElementById('hero-media-type')?.value || 'image',
      buttonText: 'Play'
    };
    await Storage?.setDoc('hero', 'main', data);
    updateHeroPreview(data.backgroundUrl, data.mediaType);
    Notify?.success('Hero banner updated! 🎬');
  });

  /* ============================================
     Credits Manager
     ============================================ */
  async function loadCreditsManager() {
    const container = document.getElementById('credits-list');
    if (!container) return;
    const credits = await Storage?.getCredits() || [];
    container.innerHTML = '';
    credits.forEach(c => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:12px;margin-bottom:8px;align-items:center;';
      row.innerHTML = `
        <input class="admin-form-input" value="${c.role}" style="flex:1;" data-id="${c.id}" data-field="role">
        <input class="admin-form-input" value="${c.value}" style="flex:1;" data-id="${c.id}" data-field="value">
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCredit('${c.id}')">✕</button>
      `;
      container.appendChild(row);
    });
  }

  document.getElementById('credits-save')?.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#credits-list input');
    const updates = {};
    inputs.forEach(input => {
      const id = input.dataset.id;
      const field = input.dataset.field;
      if (!updates[id]) updates[id] = {};
      updates[id][field] = input.value;
    });
    for (const [id, data] of Object.entries(updates)) {
      await Storage?.update('credits', id, data);
    }
    Notify?.success('Credits saved! 🎬');
  });

  document.getElementById('credit-add')?.addEventListener('click', async () => {
    await Storage?.add('credits', { role: 'New Role', value: 'Name', sortOrder: Date.now() });
    loadCreditsManager();
    Notify?.info('Credit added');
  });

  window.deleteCredit = async (id) => {
    await Storage?.remove('credits', id);
    loadCreditsManager();
  };

  /* ============================================
     Settings Manager (with LoveCode)
     ============================================ */
  async function loadSettingsManager() {
    const settings = await Storage?.getSettings();
    if (!settings) return;
    setText('setting-site-title', settings.siteTitle, true);
    setText('setting-tagline', settings.tagline, true);
    setText('setting-start-date', settings.relationshipStartDate, true);
    setText('setting-intro-duration', settings.introDuration, true);

    // Load LoveCode (mask it)
    const lcInput = document.getElementById('setting-lovecode');
    if (lcInput && settings.loveCode) {
      lcInput.value = settings.loveCode;
    }

    // Toggle visibility button
    const toggleBtn = document.getElementById('lovecode-toggle-vis');
    if (toggleBtn && lcInput) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = lcInput.type === 'password';
        lcInput.type = isHidden ? 'text' : 'password';
        toggleBtn.textContent = isHidden ? '🙈' : '👁️';
      });
    }

    // Allow only numeric digits in the LoveCode input
    if (lcInput) {
      lcInput.addEventListener('input', () => {
        lcInput.value = lcInput.value.replace(/\D/g, '').slice(0, 4);
      });
    }
  }

  document.getElementById('settings-save')?.addEventListener('click', async () => {
    const lcInput = document.getElementById('setting-lovecode');
    const loveCode = lcInput?.value?.trim() || '';

    // Validate: must be exactly 4 digits if provided
    if (loveCode && !/^\d{4}$/.test(loveCode)) {
      Notify?.error('LoveCode must be exactly 4 digits (0–9)');
      lcInput.focus();
      return;
    }

    const data = {
      siteTitle: document.getElementById('setting-site-title')?.value || 'LOVEFLIX',
      tagline: document.getElementById('setting-tagline')?.value || '',
      relationshipStartDate: document.getElementById('setting-start-date')?.value || '2024-01-01',
      introDuration: parseInt(document.getElementById('setting-intro-duration')?.value) || 4000,
      theme: 'dark'
    };

    // Only save LoveCode if a valid value was entered
    if (loveCode) data.loveCode = loveCode;

    await Storage?.setDoc('settings', 'main', data);
    Notify?.success(loveCode ? `Settings saved! LoveCode set to ${loveCode} 🔐` : 'Settings saved! ⚙️');
  });

  /* ============================================
     Export / Import
     ============================================ */
  async function exportData() {
    try {
      const data = await Storage?.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loveflix-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Notify?.success('Backup exported! 💾');
    } catch (e) {
      Notify?.error('Export failed: ' + e.message);
    }
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!confirm('This will merge imported data. Continue?')) return;
      await Storage?.importAll(data);
      Notify?.success('Data imported! 🎉');
      loadStats();
      loadMediaTable();
      loadCreditsManager();
      loadProfilesManager();
    } catch (e) {
      Notify?.error('Import failed: ' + e.message);
    }
  }

  /* ---- Helpers ---- */
  function setText(id, value, isInput = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isInput) el.value = value || '';
    else el.textContent = value || '0';
  }

  /* ============================================
     Love Code Security Manager
     ============================================ */
  async function loadLoveCodeManager() {
    const settings = await Storage?.getSettings().catch(() => null);
    if (!settings) return;

    // Populate fields
    const enabled = settings.loveCodeEnabled !== false;
    const cb = document.getElementById('lc-enabled');
    if (cb) cb.checked = enabled;

    setText('lc-code', settings.loveCode || '', true);
    setText('lc-timeout', settings.loveCodeTimeoutMinutes ?? 5, true);
    setText('lc-max-attempts', settings.maxFailedAttempts ?? 5, true);
    setText('lc-cooldown', settings.cooldownMinutes ?? 2, true);
    setText('lc-title-text', settings.lockTitle || 'LOVE CODE', true);
    setText('lc-subtitle-text', settings.lockSubtitle || 'Enter the code that unlocks our forever.', true);
    setText('lc-bg-url', settings.lockBackgroundUrl || '', true);

    const soundCb = document.getElementById('lc-sound');
    if (soundCb) soundCb.checked = !!settings.heartbeatSoundEnabled;
    const vibCb = document.getElementById('lc-vibration');
    if (vibCb) vibCb.checked = settings.vibrationEnabled !== false;

    // Toggle visibility button
    const visBtn = document.getElementById('lc-code-vis');
    const codeInput = document.getElementById('lc-code');
    if (visBtn && codeInput) {
      visBtn.addEventListener('click', () => {
        const hidden = codeInput.type === 'password';
        codeInput.type = hidden ? 'text' : 'password';
        visBtn.textContent = hidden ? '🙈' : '👁️';
      });
      // Numeric only
      codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4);
      });
    }

    // Save
    document.getElementById('lc-save-btn')?.addEventListener('click', async () => {
      const code = (document.getElementById('lc-code')?.value || '').trim();
      if (code && !/^\d{4}$/.test(code)) {
        Notify?.error('Love Code must be exactly 4 digits.');
        return;
      }
      const data = {
        loveCodeEnabled: document.getElementById('lc-enabled')?.checked ?? true,
        loveCodeTimeoutMinutes: parseInt(document.getElementById('lc-timeout')?.value) || 5,
        maxFailedAttempts: parseInt(document.getElementById('lc-max-attempts')?.value) || 5,
        cooldownMinutes: parseInt(document.getElementById('lc-cooldown')?.value) || 2,
        lockTitle: document.getElementById('lc-title-text')?.value || 'LOVE CODE',
        lockSubtitle: document.getElementById('lc-subtitle-text')?.value || 'Enter the code that unlocks our forever.',
        lockBackgroundUrl: document.getElementById('lc-bg-url')?.value || '',
        heartbeatSoundEnabled: document.getElementById('lc-sound')?.checked ?? false,
        vibrationEnabled: document.getElementById('lc-vibration')?.checked ?? true,
      };
      if (code) data.loveCode = code;

      try {
        await Storage?.setDoc('settings', 'main', data);
        Notify?.success(code ? `Love Code saved! 🔐 Code: ${code}` : 'Love Code settings saved! 💕');
      } catch (e) {
        Notify?.error('Save failed: ' + e.message);
      }
    });

    // Lock Now
    document.getElementById('lc-lock-now-btn')?.addEventListener('click', () => {
      localStorage.removeItem('lf_lc_unlocked_at');
      Notify?.info('Locked! The next visitor will see the Love Code screen. 🔒');
    });

    // Test Lock Screen
    document.getElementById('lc-test-btn')?.addEventListener('click', () => {
      window.LoveCodeLock?.show();
    });
  }
});

