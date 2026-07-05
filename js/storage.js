/* ============================================
   LOVEFLIX — Firestore Storage Abstraction
   CRUD operations for all collections
   ============================================ */

const LoveFlixStorage = (() => {
  function getDb() {
    return window.LoveFlixFirebase?.getDb();
  }

  function colName(key) {
    return window.LoveFlixConfig?.collections?.[key] || key;
  }

  /* ---- Generic CRUD ---- */
  async function getAll(collection, orderBy = 'sortOrder', dir = 'asc') {
    const db = getDb();
    if (!db) return getDemoData(collection);
    try {
      const snap = await db.collection(colName(collection)).orderBy(orderBy, dir).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(`[Storage] getAll(${collection}):`, e);
      return getDemoData(collection);
    }
  }

  async function getById(collection, id) {
    const db = getDb();
    if (!db) return null;
    const doc = await db.collection(colName(collection)).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function getWhere(collection, field, op, value, orderBy = 'sortOrder') {
    const db = getDb();
    if (!db) return [];
    try {
      const snap = await db.collection(colName(collection)).where(field, op, value).orderBy(orderBy).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(`[Storage] getWhere(${collection}):`, e);
      return [];
    }
  }

  // Plain fetch without orderBy — includes docs that lack the sort field
  // (Firestore orderBy silently excludes them). Sorted client-side.
  async function getAllRaw(collection) {
    const db = getDb();
    if (!db) return getDemoData(collection);
    try {
      const snap = await db.collection(colName(collection)).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (e) {
      console.error(`[Storage] getAllRaw(${collection}):`, e);
      return [];
    }
  }

  async function add(collection, data) {
    const db = getDb();
    if (!db) { LoveFlixNotify?.warning('Database not connected'); return null; }
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(colName(collection)).add(data);
    return ref.id;
  }

  async function update(collection, id, data) {
    const db = getDb();
    if (!db) return false;
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection(colName(collection)).doc(id).update(data);
    return true;
  }

  async function remove(collection, id) {
    const db = getDb();
    if (!db) return false;
    await db.collection(colName(collection)).doc(id).delete();
    return true;
  }

  async function setDoc(collection, id, data) {
    const db = getDb();
    if (!db) return false;
    await db.collection(colName(collection)).doc(id).set(data, { merge: true });
    return true;
  }

  /* ---- Real-time Listeners ---- */
  function onSnapshot(collection, callback, orderBy = 'sortOrder') {
    const db = getDb();
    if (!db) return () => {};
    return db.collection(colName(collection)).orderBy(orderBy).onSnapshot(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(data);
    });
  }

  /* ---- Batch Operations ---- */
  async function batchUpdate(collection, updates) {
    const db = getDb();
    if (!db) return false;
    const batch = db.batch();
    updates.forEach(({ id, data }) => {
      const ref = db.collection(colName(collection)).doc(id);
      batch.update(ref, data);
    });
    await batch.commit();
    return true;
  }

  /* ---- Specialized Queries ---- */
  async function getProfiles() {
    return getAll('profiles', 'sortOrder');
  }

  async function getMedia(options = {}) {
    const db = getDb();
    if (!db) return getDemoData('media');
    try {
      let query = db.collection(colName('media'));
      if (options.category) query = query.where('category', '==', options.category);
      if (options.profileId) query = query.where('profileId', '==', options.profileId);
      if (options.featured) query = query.where('featured', '==', true);
      if (options.type) query = query.where('type', '==', options.type);
      query = query.orderBy(options.orderBy || 'sortOrder', options.dir || 'asc');
      if (options.limit) query = query.limit(options.limit);
      const snap = await query.get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[Storage] getMedia:', e);
      return getDemoData('media');
    }
  }

  async function getHero() {
    const db = getDb();
    if (!db) return getDemoData('hero');
    try {
      const snap = await db.collection(colName('hero')).limit(1).get();
      return snap.empty ? getDemoData('hero') : { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) {
      console.error('[Storage] getHero:', e);
      return getDemoData('hero');
    }
  }

  async function getSettings() {
    const db = getDb();
    if (!db) return getDemoData('settings');
    try {
      const doc = await db.collection(colName('settings')).doc('main').get();
      return doc.exists ? doc.data() : getDemoData('settings');
    } catch (e) {
      console.error('[Storage] getSettings:', e);
      return getDemoData('settings');
    }
  }

  async function getCredits() {
    return getAll('credits', 'sortOrder');
  }

  async function getAds() {
    const db = getDb();
    if (!db) return [];
    try {
      // Avoid compound query (where + orderBy on different fields) which needs composite index
      const snap = await db.collection(colName('ads')).where('active', '==', true).get();
      const ads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return ads.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (e) {
      console.error('[Storage] getAds:', e);
      return [];
    }
  }

  /* ---- JSON Export / Import ---- */
  async function exportAll() {
    const data = {};
    const collections = ['profiles', 'media', 'hero', 'credits', 'settings', 'ads'];
    for (const col of collections) {
      // getAllRaw: orderBy would silently drop docs without a sortOrder
      // field (hero/main, settings/main), losing them from backups.
      data[col] = await getAllRaw(col);
    }
    return data;
  }

  async function importAll(data) {
    const db = getDb();
    if (!db) return false;
    for (const [col, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          const { id, ...rest } = item;
          if (id) await setDoc(col, id, rest);
          else await add(col, rest);
        }
      } else if (typeof items === 'object') {
        await setDoc(col, 'main', items);
      }
    }
    return true;
  }

  /* ---- Demo Data Fallback ---- */
  function getDemoData(collection) {
    const demo = {
      profiles: [
        { id: '1', name: '1 Month', slug: '1-month', coverImage: '', sortOrder: 1, active: true },
        { id: '2', name: '3 Months', slug: '3-months', coverImage: '', sortOrder: 2, active: true },
        { id: '3', name: '6 Months', slug: '6-months', coverImage: '', sortOrder: 3, active: true },
        { id: '4', name: '1 Year', slug: '1-year', coverImage: '', sortOrder: 4, active: true },
        { id: '5', name: 'Forever', slug: 'forever', coverImage: '', sortOrder: 5, active: true }
      ],
      media: [
        { id: 'd1', title: 'Our First Photo Together', description: 'The moment it all began', type: 'image', url: '', thumbnail: '', category: 'Popular on LoveFlix', featured: true, sortOrder: 1, tags: ['love'] },
        { id: 'd2', title: 'Coffee Date', description: 'Our favorite café spot', type: 'image', url: '', thumbnail: '', category: 'Our Best Memories', featured: false, sortOrder: 2, tags: ['dates'] },
        { id: 'd3', title: 'Sunset Walk', description: 'Golden hour magic', type: 'image', url: '', thumbnail: '', category: 'Special Moments', featured: false, sortOrder: 3, tags: ['outdoors'] }
      ],
      hero: { title: 'Our Love Story', subtitle: 'Every moment with you is a memory I treasure forever', backgroundUrl: '', mediaType: 'image', buttonText: 'Play' },
      settings: {
        siteTitle: 'LOVEFLIX', tagline: 'Our Story. Our Memories. Our Forever.',
        introDuration: 4000, autoplay: true, backgroundMusic: true,
        relationshipStartDate: '2024-01-01', theme: 'dark', enableAds: false
      },
      credits: [
        { id: 'c1', role: 'Directed by', value: 'God', sortOrder: 1 },
        { id: 'c2', role: 'Boyfriend', value: 'Your Name', sortOrder: 2 },
        { id: 'c3', role: 'Girlfriend', value: 'Partner Name', sortOrder: 3 },
        { id: 'c4', role: 'Written by', value: 'Fate & Destiny', sortOrder: 4 },
        { id: 'c5', role: 'Produced by', value: 'Patience & Support', sortOrder: 5 },
        { id: 'c6', role: 'Director of Photography', value: 'Our Camera Rolls', sortOrder: 6 },
        { id: 'c7', role: 'Executive Producers', value: 'Shared Future Plans', sortOrder: 7 },
        { id: 'c8', role: 'Catering By', value: 'Midnight Cravings', sortOrder: 8 },
        { id: 'c9', role: 'Stunt Coordinators', value: 'Arguments & Fights', sortOrder: 9 },
        { id: 'c10', role: 'Wardrobe Designer', value: "Each Other's Hoodies", sortOrder: 10 }
      ],
      notes: [
        { id: 'n1', text: 'Every day with you feels like my favorite scene on repeat.', from: 'Your biggest fan', sortOrder: 1 },
        { id: 'n2', text: 'If our love were a movie, I would never press pause.', from: 'Me', sortOrder: 2 },
        { id: 'n3', text: 'You are the plot twist I never saw coming and never want to end.', from: 'Forever yours', sortOrder: 3 }
      ],
      ads: []
    };
    return demo[collection] || [];
  }

  return {
    getAll, getAllRaw, getById, getWhere, add, update, remove, setDoc,
    onSnapshot, batchUpdate,
    getProfiles, getMedia, getHero, getSettings, getCredits, getAds,
    exportAll, importAll, getDemoData
  };
})();

window.LoveFlixStorage = LoveFlixStorage;
