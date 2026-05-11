/* ============================================
   LOVEFLIX — Firebase Initialization
   Firestore + Auth via CDN
   ============================================ */

// Firebase is loaded via CDN script tags in HTML.
// This module initializes and exports the instances.

let db = null;
let auth = null;
let firebaseReady = false;

/**
 * Initialize Firebase services
 */
function initFirebase() {
  try {
    const config = window.LoveFlixConfig?.firebase;
    if (!config || config.apiKey === "YOUR_FIREBASE_API_KEY") {
      console.warn('[LoveFlix] Firebase not configured. Running in demo mode.');
      firebaseReady = false;
      return false;
    }

    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    // Initialize Firestore
    db = firebase.firestore();
    db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn('[LoveFlix] Firestore persistence unavailable (multiple tabs).');
      } else if (err.code === 'unimplemented') {
        console.warn('[LoveFlix] Firestore persistence not supported in this browser.');
      }
    });

    // Initialize Auth
    auth = firebase.auth();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    firebaseReady = true;
    console.log('[LoveFlix] Firebase initialized successfully.');
    return true;
  } catch (error) {
    console.error('[LoveFlix] Firebase initialization failed:', error);
    firebaseReady = false;
    return false;
  }
}

/**
 * Get Firestore instance
 */
function getDb() {
  return db;
}

/**
 * Get Auth instance
 */
function getAuth() {
  return auth;
}

/**
 * Check if Firebase is ready
 */
function isFirebaseReady() {
  return firebaseReady;
}

/**
 * Check connection status
 */
function onConnectionChange(callback) {
  if (!db) return;
  // Use a simple online/offline check for GitHub Pages compatibility
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  callback(navigator.onLine);
}

// Auto-initialize immediately when script loads (not in DOMContentLoaded)
// This prevents race conditions with other DOMContentLoaded handlers
if (typeof firebase !== 'undefined') {
  initFirebase();
} else {
  // Fallback: wait for DOM if firebase somehow not yet available
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') initFirebase();
  });
}

// Expose globally
window.LoveFlixFirebase = {
  init: initFirebase,
  getDb,
  getAuth,
  isReady: isFirebaseReady,
  onConnectionChange
};
