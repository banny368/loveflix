/* ============================================
   LOVEFLIX — Authentication Module
   Firebase Auth (Email/Password)
   ============================================ */

const LoveFlixAuth = (() => {
  function getAuth() {
    return window.LoveFlixFirebase?.getAuth();
  }

  async function login(email, password) {
    const auth = getAuth();
    if (!auth) throw new Error('Firebase not configured');
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function logout() {
    const auth = getAuth();
    if (!auth) return;
    await auth.signOut();
    window.location.href = 'admin-login.html';
  }

  function getCurrentUser() {
    const auth = getAuth();
    return auth?.currentUser || null;
  }

  function onAuthStateChanged(callback) {
    const auth = getAuth();
    if (!auth) { callback(null); return () => {}; }
    return auth.onAuthStateChanged(callback);
  }

  /**
   * Guard a page — redirect to login if not authenticated.
   * Adds a grace period to allow Firebase to restore a persisted session.
   */
  function requireAuth(redirectUrl = 'admin-login.html') {
    return new Promise((resolve) => {
      const auth = getAuth();
      if (!auth) {
        console.warn('[Auth] Firebase not configured. Allowing demo access.');
        resolve(null);
        return;
      }

      // Allow local file:// access without auth (development mode)
      if (window.location.protocol === 'file:') {
        console.warn('[Auth] Local file:// detected. Bypassing auth guard for development.');
        resolve(null);
        return;
      }

      // Firebase restores persisted sessions asynchronously.
      // We wait up to 3 seconds before deciding the user is not logged in.
      let resolved = false;
      let redirectTimer = null;

      const unsub = auth.onAuthStateChanged(user => {
        if (resolved) return;

        if (user) {
          // User is authenticated — proceed immediately
          resolved = true;
          clearTimeout(redirectTimer);
          unsub();
          resolve(user);
        } else {
          // User is null — may still be loading from persistence.
          // Wait briefly before redirecting to allow session restoration.
          if (!redirectTimer) {
            redirectTimer = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                unsub();
                window.location.href = redirectUrl;
              }
            }, 2000); // 2 second grace period for session restoration
          }
        }
      });
    });
  }


  /**
   * Redirect away from login page if already logged in
   */
  function redirectIfAuth(targetUrl = 'admin.html') {
    const auth = getAuth();
    if (!auth) return;
    auth.onAuthStateChanged(user => {
      if (user) window.location.href = targetUrl;
    });
  }

  return {
    login, logout, getCurrentUser,
    onAuthStateChanged, requireAuth, redirectIfAuth
  };
})();

window.LoveFlixAuth = LoveFlixAuth;
