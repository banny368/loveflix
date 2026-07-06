/* ============================================
   LOVEFLIX — Configuration
   Firebase + Cloudinary + App Settings
   ============================================ */

const LoveFlixConfig = {
  // ---- Firebase Configuration ----
  // Replace with your own Firebase project credentials
  firebase: {
    apiKey: "AIzaSyC2OWqc6kkyupS3elDEabXxkw8Tx1GLY3k",
    authDomain: "loveflix-app-1769.firebaseapp.com",
    projectId: "loveflix-app-1769",
    storageBucket: "loveflix-app-1769.firebasestorage.app",
    messagingSenderId: "874040100266",
    appId: "1:874040100266:web:cc33ef8f2e1ee5645e57d3"
  },

  // ---- Cloudinary Configuration ----
  // Replace with your own Cloudinary credentials
  cloudinary: {
    cloudName: "ddmbdhanp",
    uploadPreset: "ml_default",
    folder: "loveflix",
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedImageFormats: ["jpg", "jpeg", "png", "webp", "gif"],
    allowedVideoFormats: ["mp4", "mov", "webm"],
    allowedAudioFormats: ["mp3", "m4a", "wav", "ogg"],
    thumbnailWidth: 400,
    thumbnailHeight: 225
  },

  // ---- Application Settings ----
  app: {
    siteName: "LOVEFLIX",
    tagline: "Our Story. Our Memories. Our Forever.",
    introDuration: 4000,        // ms before auto-redirect
    heroAutoplayInterval: 8000, // ms between hero slides
    slideshowInterval: 5000,    // ms between viewer slides
    toastDuration: 4000,        // ms toast stays visible
    cardsPerRow: 6,             // desktop cards per carousel page
    defaultTheme: "dark"
  },

  // ---- Relationship Info (editable via admin) ----
  relationship: {
    startDate: "2024-01-01",
    partnerA: "Your Name",
    partnerB: "Partner Name"
  },

  // ---- Firestore Collection Names ----
  collections: {
    profiles: "profiles",
    media: "media",
    hero: "hero",
    ads: "ads",
    credits: "credits",
    settings: "settings",
    favorites: "favorites",
    notes: "notes",
    chat: "chat"
  },

  // ---- Feature Flags ----
  features: {
    enableMusic: true,
    enableAds: false,
    enableConfetti: true,
    enableParticles: true,
    enableSurprises: true,
    enableHeartTrail: true
  }
};

// ---- Runtime Override (set from Admin → Connections) ----
// A static site can't rewrite this file, so admin-entered Firebase/
// Cloudinary values are stored per-browser and merged here at load,
// before firebase-config.js initializes. js/config.js above stays the
// permanent source of truth for visitors.
try {
  const override = JSON.parse(localStorage.getItem('loveflix_config_override') || 'null');
  if (override && typeof override === 'object') {
    if (override.firebase && typeof override.firebase === 'object') {
      Object.assign(LoveFlixConfig.firebase, override.firebase);
      LoveFlixConfig._firebaseOverridden = true;
    }
    if (override.cloudinary && typeof override.cloudinary === 'object') {
      Object.assign(LoveFlixConfig.cloudinary, override.cloudinary);
      LoveFlixConfig._cloudinaryOverridden = true;
    }
  }
} catch (e) {
  console.warn('[LoveFlix] Ignoring invalid config override:', e);
}

// Make config globally accessible
if (typeof window !== 'undefined') {
  window.LoveFlixConfig = LoveFlixConfig;
}
