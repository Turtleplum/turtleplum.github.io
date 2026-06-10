// genie.js — CSS Genie Effect for Certificate Modal

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
    .cert-modal-inner {
      transform-origin: bottom center;
      transform: translateY(60px) scaleY(0.02) scaleX(0.1);
      opacity: 0;
      visibility: hidden;
    }

    .cert-modal-inner.genie-open {
      visibility: visible;
      animation: genieOpen 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .cert-modal-inner.genie-close {
      visibility: visible;
      animation: genieClose 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards;
    }

    .cert-modal-inner.genie-done {
      visibility: visible;
      transform: translateY(0) scaleY(1) scaleX(1);
      opacity: 1;
    }

    @keyframes genieOpen {
      0%   { transform: translateY(60px) scaleY(0.02) scaleX(0.1);   opacity: 0;   border-radius: 999px; }
      30%  { transform: translateY(30px) scaleY(0.2)  scaleX(0.45);  opacity: 0.6; border-radius: 80px;  }
      60%  { transform: translateY(-5px) scaleY(1.03) scaleX(1.02);  opacity: 1;   border-radius: 6px;   }
      80%  { transform: translateY(3px)  scaleY(0.98) scaleX(0.99);  opacity: 1;   border-radius: 2px;   }
      100% { transform: translateY(0)    scaleY(1)    scaleX(1);     opacity: 1;   border-radius: 0;     }
    }

    @keyframes genieClose {
      0%   { transform: translateY(0)    scaleY(1)    scaleX(1);    opacity: 1; border-radius: 0;     }
      40%  { transform: translateY(15px) scaleY(0.5)  scaleX(0.6);  opacity: 0.7; border-radius: 30px; }
      100% { transform: translateY(60px) scaleY(0.02) scaleX(0.1);  opacity: 0; border-radius: 999px; }
    }
  `;
  document.head.appendChild(style);

  // ── State ─────────────────────────────────────────────────────────────────
  let isAnimating = false;

  // ── Open ──────────────────────────────────────────────────────────────────
  function openModal(src, title) {
    if (isAnimating) return;
    isAnimating = true;

    certImg.src = src;
    certName.textContent = title;
    document.body.style.overflow = 'hidden';

    certBackdrop.classList.add('open');
    certModal.style.pointerEvents = 'all';

    certModalInner.classList.remove('genie-close', 'genie-done');
    certModalInner.classList.add('genie-open');

    certModalInner.addEventListener('animationend', function onOpen() {
      certModalInner.removeEventListener('animationend', onOpen);
      certModalInner.classList.remove('genie-open');
      certModalInner.classList.add('genie-done');
      isAnimating = false;
    });
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  function closeModal() {
    if (isAnimating) return;
    isAnimating = true;

    certModalInner.classList.remove('genie-done');
    certModalInner.classList.add('genie-close');

    certModalInner.addEventListener('animationend', function onClose() {
      certModalInner.removeEventListener('animationend', onClose);
      certModalInner.classList.remove('genie-close');
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
