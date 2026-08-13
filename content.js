// HEY GUYS ITS ME, BROKER. I.. forgot what i wanted to say

// im too lazy to comment out the code so have fun reading this
// if you have any contributions to make please do :D

(() => {
  const IMAGE_COUNT = 20;

  const images = [];

  for (let i = 1; i <= IMAGE_COUNT; i++) {
    images.push(chrome.runtime.getURL(`images/${i}.png`));
  }

  function isYouTubeThumb(src) {
    if (!src) return false;
    let u;
    try {
      u = new URL(src, location.href);
    } catch (e) {
      return false;
    }
    if (!/(^|\.)ytimg\.com$/.test(u.hostname)) return false;
    if (u.pathname.includes('/sb/')) return false;
    return u.pathname.includes('/vi/') || u.pathname.includes('/vi_webp/');
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function ensurePositioned(el) {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') {
      el.style.position = 'relative';
    }
  }

  function createOverlay() {
    const overlay = document.createElement('img');
    overlay.className = 'ytr-overlay-img';
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      pointerEvents: 'none',
      zIndex: '5'
    });
    return overlay;
  }

  function applyToImg(img) {
    const src = img.currentSrc || img.getAttribute('src') || '';
    if (!isYouTubeThumb(src)) return;
    if (img.dataset.ytrOverlay === 'true') return;

    const parent = img.parentElement;
    if (!parent) return;

    ensurePositioned(parent);

    const overlay = createOverlay();
    overlay.src = pickRandom(images);
    parent.appendChild(overlay);

    img.dataset.ytrOverlay = 'true';
  }

  function scanAndReplace(imgs) {
    imgs.forEach(applyToImg);
  }

  let pending = new Set();
  let scheduled = false;

  function schedule(el) {
    pending.add(el);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }

  function flush() {
    scheduled = false;
    const imgs = Array.from(pending);
    pending.clear();
    scanAndReplace(imgs);
  }

  function onMutations(mutations) {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.target.tagName === 'IMG') {
        schedule(m.target);
      } else if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG') schedule(node);
          if (node.querySelectorAll) {
            const imgs = node.querySelectorAll('img');
            if (imgs.length) imgs.forEach((i) => schedule(i));
          }
        });
      }
    }
  }

  function startObserving() {
    const observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset']
    });
  }

  function initialScan() {
    scanAndReplace(document.querySelectorAll('img'));
  }

  startObserving();

  if (document.readyState !== 'loading') {
    initialScan();
  } else {
    document.addEventListener('DOMContentLoaded', initialScan);
  }

  document.addEventListener('yt-navigate-finish', initialScan);
  window.addEventListener('load', initialScan);
})();