# ❤️ LOVEFLIX

**Your Love Story, Streaming Forever.**

> _"Our Story. Our Memories. Our Forever."_

A premium Netflix-inspired romantic web application for uploading and showcasing couple photos and videos as a cinematic anniversary experience. Fully deployable on GitHub Pages — no backend server required.

---

## ✨ Features

- **🎬 Netflix Intro Animation** — Cinematic LOVEFLIX logo reveal with sparkles and progress bar
- **👤 Profile Selection** — "Who's Watching Our Story?" milestone cards (1 Month, 3 Months, 6 Months, 1 Year, Forever)
- **🏠 Netflix-Style Homepage** — Hero banner, horizontal carousels, hover previews, days-together counter
- **🖼️ Full-Screen Viewer** — Image & video display with slideshow, keyboard/touch navigation, download & share
- **🎭 Movie Credits** — Auto-scrolling cinematic credits with starry background
- **🔐 Admin Dashboard** — Glassmorphism UI for uploading media, managing content, and configuring settings
- **☁️ Cloud Storage** — Firebase Firestore database + Cloudinary media hosting
- **📱 Fully Responsive** — Mobile-first design for all screen sizes
- **💕 Romantic Effects** — Floating heart particles, confetti celebrations, heart cursor trail

---

## 🗂️ Project Structure

```
loveflix/
├── index.html              # Intro animation
├── profiles.html           # Profile selection
├── home.html               # Main homepage
├── viewer.html             # Full-screen media viewer
├── credits.html            # Movie ending credits
├── admin-login.html        # Admin login
├── admin.html              # Admin dashboard
├── 404.html                # Custom error page
├── css/
│   ├── variables.css       # Design tokens
│   ├── reset.css           # CSS reset
│   ├── animations.css      # Keyframe animations
│   ├── intro.css           # Intro page styles
│   ├── profiles.css        # Profiles page styles
│   ├── home.css            # Homepage styles
│   ├── viewer.css          # Viewer styles
│   ├── credits.css         # Credits styles
│   ├── admin.css           # Admin styles
│   └── responsive.css      # Responsive breakpoints
├── js/
│   ├── config.js           # Firebase + Cloudinary config
│   ├── firebase-config.js  # Firebase initialization
│   ├── cloudinary.js       # Cloudinary upload integration
│   ├── auth.js             # Authentication module
│   ├── storage.js          # Firestore CRUD operations
│   ├── utils.js            # Utility functions
│   ├── notifications.js    # Toast notification system
│   ├── loader.js           # Loading screens
│   ├── intro.js            # Intro page logic
│   ├── profiles.js         # Profiles page logic
│   ├── home.js             # Homepage logic
│   ├── viewer.js           # Viewer logic
│   ├── credits.js          # Credits page logic
│   └── admin.js            # Admin dashboard logic
├── assets/
│   ├── music/              # Background music (add your own)
│   └── sounds/             # Sound effects (add your own)
├── data/
│   └── sample-data.json    # Sample data for setup
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🚀 Setup Guide

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., "loveflix")
3. **Enable Authentication:**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Go to Users tab → Add user (your admin email/password)
4. **Create Firestore Database:**
   - Go to Firestore Database → Create database
   - Start in **test mode** (you can add security rules later)
5. **Get your config:**
   - Go to Project Settings → General → Your apps → Web app
   - Click "Add app" → Register app
   - Copy the `firebaseConfig` object

### 2. Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. Go to **Settings → Upload**
3. Scroll to **Upload presets** → **Add upload preset**
   - Set **Signing Mode** to **Unsigned**
   - Set a folder name (e.g., "loveflix")
   - Save the preset name
4. Note your **Cloud Name** from the Dashboard

### 3. Configure the App

Open `js/config.js` and replace the placeholder values:

```javascript
firebase: {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
},
cloudinary: {
  cloudName: "your-cloud-name",
  uploadPreset: "your-upload-preset",
}
```

### 4. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push all project files:
   ```bash
   git init
   git add .
   git commit -m "Initial LoveFlix deployment"
   git remote add origin https://github.com/YOUR_USERNAME/loveflix.git
   git push -u origin main
   ```
3. Go to **Settings → Pages**
4. Set source to **Deploy from a branch** → **main** → **/ (root)**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/loveflix/`

---

## 🔒 Firestore Security Rules

Add these rules in Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access
    match /{collection}/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🎵 Adding Music

Place your audio files in the `assets/` folders:
- `assets/sounds/intro.mp3` — Intro page sound
- `assets/music/background.mp3` — Homepage background music
- `assets/music/credits.mp3` — Credits page music

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase not connecting | Check `js/config.js` credentials |
| Upload fails | Verify Cloudinary unsigned preset |
| Admin login fails | Ensure Firebase Auth user exists |
| Pages show demo data | Normal when Firebase isn't configured |
| No music plays | Add MP3 files to assets folder |
| 404 on GitHub Pages | Ensure `404.html` is in root |

---

## 💡 Future Enhancements

- Progressive Web App (PWA) support
- Push notifications
- QR code sharing
- Guest password access
- Relationship milestone calculator
- Download all memories as ZIP
- Surprise pop-up love messages
- Offline support

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

Made with ❤️ for the one you love.
