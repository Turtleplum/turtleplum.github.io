// genie.js — Scale from click point animation

(function () {

  const certModal      = document.getElementById('certModal');
  const certModalInner = document.getElementById('certModalInner');
  const certBackdrop   = document.getElementById('certBackdrop');
  const certImg        = document.getElementById('certImg');
  const certName       = document.getElementById('certName');

  // Inject animation CSS — overrides any conflicting index.html styles
  const style = document.createElement('style');
  style.textContent = `
    #certModalInner {
      opacity: 0 !important;
      visibility: hidden !important;
      transform: scale(0.05) !important;
      transform-origin: center center;
      transition: none !important;
    }
    #certModalInner.modal-open {
      visibility: visible !important;
      animation: modalScaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
    }
    #certModalInner.modal-close {
      visibility: visible !important;
      animation: modalScaleOut 0.25s cubic-bezier(0.55, 0, 1, 0.45) forwards !important;
    }
    #certModalInner.modal-done {
      opacity: 1 !important;
      visibility: visible !important;
      transform: scale(1) !important;
    }
    @keyframes modalScaleIn {
      0%   { opacity: 0; transform: scale(0.05); border-radius: 50%;  }
      60%  { opacity: 1; transform: scale(1.04); border-radius: 4px;  }
      80%  { opacity: 1; transform: scale(0.97); border-radius: 2px;  }
      100% { opacity: 1; transform: scale(1);    border-radius: 0;    }
    }
    @keyframes modalScaleOut {
      0%   { opacity: 1; transform: scale(1);    border-radius: 0;    }
      100% { opacity: 0; transform: scale(0.05); border-radius: 50%;  }
    }
  `;
  document.head.appendChild(style);

  let isAnimating = false;

  function openModal(src, title, originX, originY) {
    if (isAnimating) return;
    isAnimating = true;

    certImg.src = src;
    certName.textContent = title;
    document.body.style.overflow = 'hidden';

    // Set transform-origin to click position relative to modal
    certModalInner.style.transformOrigin = `${originX} ${originY}`;

    certBackdrop.classList.add('open');
    certModal.style.pointerEvents = 'all';

    certModalInner.classList.remove('modal-close', 'modal-done');
    certModalInner.classList.add('modal-open');

    certModalInner.addEventListener('animationend', function onOpen() {
      certModalInner.removeEventListener('animationend', onOpen);
      certModalInner.classList.remove('modal-open');
      certModalInner.classList.add('modal-done');
      isAnimating = false;
    });
  }

  function closeModal() {
    if (isAnimating) return;
    isAnimating = true;

    certModalInner.classList.remove('modal-done');
    certModalInner.classList.add('modal-close');

    certModalInner.addEventListener('animationend', function onClose() {
      certModalInner.removeEventListener('animationend', onClose);
      certModalInner.classList.remove('modal-close');
      certModal.style.pointerEvents = 'none';
      certBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      isAnimating = false;
    });
  }

  document.querySelectorAll('.cert-link').forEach(el => {
    el.addEventListener('click', function(e) {
      const vw = window.innerWidth;
      const modalW = Math.min(1000, vw - 64);
      const modalLeft = (vw - modalW) / 2;
      const relX = Math.round(((e.clientX - modalLeft) / modalW) * 100);
      const relY = Math.round((e.clientY / window.innerHeight) * 100);
      const ox = Math.max(0, Math.min(100, relX)) + '%';
      const oy = Math.max(0, Math.min(100, relY)) + '%';
      openModal(el.dataset.cert, el.dataset.name, ox, oy);
    });
  });

  document.getElementById('certClose').addEventListener('click', closeModal);
  certBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();
