/* ============================================
   LOVEFLIX — Loader & Skeleton Screens
   ============================================ */

const LoveFlixLoader = (() => {
  let loaderEl = null;

  function show(message = 'Loading Our Memories...') {
    if (loaderEl) return;
    loaderEl = document.createElement('div');
    loaderEl.id = 'lf-loader';
    loaderEl.setAttribute('aria-label', 'Loading');
    loaderEl.innerHTML = `
      <div class="lf-loader-inner">
        <div class="lf-loader-logo">LOVEFLIX</div>
        <div class="lf-loader-hearts">
          <span class="lf-loader-heart" style="animation-delay:0s">❤</span>
          <span class="lf-loader-heart" style="animation-delay:0.2s">❤</span>
          <span class="lf-loader-heart" style="animation-delay:0.4s">❤</span>
        </div>
        <p class="lf-loader-msg">${message}</p>
      </div>
    `;
    loaderEl.style.cssText = `position:fixed;inset:0;z-index:1000;background:#141414;display:flex;align-items:center;justify-content:center;`;

    const style = document.createElement('style');
    style.textContent = `
      .lf-loader-inner{text-align:center;}
      .lf-loader-logo{font-family:'Bebas Neue',sans-serif;font-size:3rem;color:#E50914;letter-spacing:0.15em;margin-bottom:24px;text-shadow:0 0 20px rgba(229,9,20,0.5);}
      .lf-loader-hearts{display:flex;gap:12px;justify-content:center;margin-bottom:20px;}
      .lf-loader-heart{font-size:24px;animation:pulse 1s ease-in-out infinite;}
      .lf-loader-msg{font-family:'Poppins',sans-serif;color:#b3b3b3;font-size:14px;font-style:italic;}
    `;
    loaderEl.appendChild(style);
    document.body.appendChild(loaderEl);
  }

  function hide() {
    if (!loaderEl) return;
    loaderEl.style.animation = 'fadeOut 0.4s ease forwards';
    setTimeout(() => { loaderEl?.remove(); loaderEl = null; }, 400);
  }

  function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'skeleton-card anim-shimmer';
    card.style.cssText = `width:var(--lf-card-width,240px);height:var(--lf-card-height,135px);border-radius:8px;flex-shrink:0;`;
    return card;
  }

  function createSkeletonRow(count = 6) {
    const row = document.createElement('div');
    row.className = 'skeleton-row';
    row.style.cssText = 'padding:0 var(--lf-page-padding);margin-bottom:2rem;';

    const title = document.createElement('div');
    title.className = 'anim-shimmer';
    title.style.cssText = 'width:200px;height:24px;border-radius:4px;margin-bottom:12px;';
    row.appendChild(title);

    const cards = document.createElement('div');
    cards.style.cssText = 'display:flex;gap:8px;overflow:hidden;';
    for (let i = 0; i < count; i++) cards.appendChild(createSkeletonCard());
    row.appendChild(cards);
    return row;
  }

  function createSkeletonHero() {
    const hero = document.createElement('div');
    hero.className = 'skeleton-hero anim-shimmer';
    hero.style.cssText = 'width:100%;height:70vh;border-radius:0;';
    return hero;
  }

  return { show, hide, createSkeletonCard, createSkeletonRow, createSkeletonHero };
})();

window.LoveFlixLoader = LoveFlixLoader;
