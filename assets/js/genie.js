// genie.js — SVG Curtain Genie Effect for Certificate Modal
// Inspired by: https://jsbin.com/gedokogore/1
// Approach: modal slides up from corner, SVG curtain pulls away to reveal it

(function () {

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const certModal      = document.getElementById('certModal');
  const certModalInner = document.getElementById('certModalInner');
  const certBackdrop   = document.getElementById('certBackdrop');
  const certImg        = document.getElementById('certImg');
  const certName       = document.getElementById('certName');

  // ── Inject CSS ────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Modal starts hidden, scaled down at bottom-center */
    .cert-modal-inner {
      transform-origin: bottom center;
      transform: translateY(60px) scale(0.05, 0.05);
      opacity: 0;
    }

    /* Slide up animation — modal content reveals */
    .cert-modal-inner.genie-open {
      animation: genieSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* Slide down animation — modal content hides */
    .cert-modal-inner.genie-close {
      animation: genieSlideDown 0.35s cubic-bezier(0.55, 0, 1, 0.45) forwards;
    }

    /* Resting open state */
    .cert-modal-inner.genie-done {
      transform: translateY(0) scale(1, 1);
      opacity: 1;
    }

    @keyframes genieSlideUp {
      0%   { transform: translateY(60px) scale(0.05, 0.05); opacity: 0;    border-radius: 999px; }
      40%  { transform: translateY(20px) scale(0.5,  0.35); opacity: 0.7;  border-radius: 60px;  }
      70%  { transform: translateY(-6px) scale(1.02, 1.02); opacity: 1;    border-radius: 4px;   }
      85%  { transform: translateY(3px)  scale(0.99, 0.99); opacity: 1;    border-radius: 2px;   }
      100% { transform: translateY(0)    scale(1,    1);    opacity: 1;    border-radius: 0;     }
    }

    @keyframes genieSlideDown {
      0%   { transform: translateY(0)    scale(1,    1);    opacity: 1;    border-radius: 0;    }
      40%  { transform: translateY(10px) scale(0.85, 0.7);  opacity: 0.8;  border-radius: 20px; }
      100% { transform: translateY(60px) scale(0.05, 0.05); opacity: 0;    border-radius: 999px;}
    }

    /* SVG curtain — genie-shaped white blob that pulls away */
    #genie-curtain {
      position: fixed;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 8002;
      pointer-events: none;
      width: 120vw;
      height: 120vh;
      opacity: 0;
    }

    #genie-curtain.curtain-reveal {
      animation: curtainPullDown 0.6s cubic-bezier(0.99, 0.22, 1, -0.44) forwards;
      opacity: 1;
    }

    #genie-curtain.curtain-cover {
      animation: curtainPullUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 1;
    }

    @keyframes curtainPullDown {
      0%   { transform: translateX(-50%) translateY(0%);    }
      100% { transform: translateX(-50%) translateY(110%);  }
    }

    @keyframes curtainPullUp {
      0%   { transform: translateX(-50%) translateY(110%);  }
      100% { transform: translateX(-50%) translateY(0%);    }
    }
  `;
  document.head.appendChild(style);

  // ── SVG curtain element ───────────────────────────────────────────────────
  // A genie-shaped SVG blob — wide at top, tapers to a point at bottom
  const curtain = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  curtain.id = 'genie-curtain';
  curtain.setAttribute('viewBox', '0 0 1000 1000');
  curtain.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  curtain.innerHTML = `
    <path d="
      M 0,0
      L 1000,0
      L 1000,400
      C 1000,400 750,700 500,1000
      C 250,700 0,400 0,400
      Z
    " fill="var(--bg2, #1E1B18)"/>
  `;
  document.body.appendChild(curtain);

  // ── State ─────────────────────────────────────────────────────────────────
  let isAnimating = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resetClasses(el, ...classes) {
    el.classList.remove(...classes);
  }

  function onAnimEnd(el, fn) {
    el.addEventListener('animationend', fn, { once: true });
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  function openModal(src, title) {
    if (isAnimating) return;
    isAnimating = true;

    certImg.src = src;
    certName.textContent = title;
    document.body.style.overflow = 'hidden';

    // Show backdrop
    certBackdrop.classList.add('open');

    // Show modal container (but inner is still scaled tiny)
    certModal.style.pointerEvents = 'all';
    certModalInner.classList.remove('genie-close', 'genie-done');

    // Start curtain covering from bottom (pulls up to cover)
    resetClasses(curtain, 'curtain-reveal', 'curtain-cover');
    // No curtain needed on open — modal slides up directly

    // Slight delay so backdrop fades in first
    setTimeout(() => {
      certModalInner.classList.add('genie-open');

      onAnimEnd(certModalInner, () => {
        certModalInner.classList.remove('genie-open');
        certModalInner.classList.add('genie-done');
        isAnimating = false;
      });
    }, 80);
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  function closeModal() {
    if (isAnimating) return;
    isAnimating = true;

    // Curtain pulls down first to briefly cover the modal
    resetClasses(curtain, 'curtain-reveal', 'curtain-cover');

    // Slide modal down while curtain covers
    certModalInner.classList.remove('genie-done');
    certModalInner.classList.add('genie-close');

    onAnimEnd(certModalInner, () => {
      certModalInner.classList.remove('genie-close');

      // Hide everything
      certModal.style.pointerEvents = 'none';
      certBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      isAnimating = false;
    });
  }

  // ── Wire up ───────────────────────────────────────────────────────────────
  document.querySelectorAll('.cert-link').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.cert, el.dataset.name));
  });

  document.getElementById('certClose').addEventListener('click', closeModal);
  certBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();
