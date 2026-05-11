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
    favorites: "favorites"
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

// Make config globally accessible
if (typeof window !== 'undefined') {
  window.LoveFlixConfig = LoveFlixConfig;
}
