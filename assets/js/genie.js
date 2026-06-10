// genie.js — WebGL Genie Effect for Certificate Modal

(function () {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const certModal      = document.getElementById('certModal');
  const certModalInner = document.getElementById('certModalInner');
  const certBackdrop   = document.getElementById('certBackdrop');
  const certImg        = document.getElementById('certImg');
  const certName       = document.getElementById('certName');

  // ── Create WebGL canvas ───────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'genie-canvas';
  canvas.style.cssText = `
    position: fixed; inset: 0; z-index: 8001;
    pointer-events: none; display: none;
    width: 100%; height: 100%;
  `;
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // ── Shaders ───────────────────────────────────────────────────────────────
  const VS = `
    attribute vec2 aPos;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() {
      vUv = aUv;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const FS = `
    precision mediump float;
    uniform sampler2D uTex;
    uniform float uP;       // progress: 0=open, 1=genie'd
    uniform vec2  uTarget;  // normalized target point (0-1)
    varying vec2 vUv;

    void main() {
      float p = clamp(uP, 0.0, 1.0);
      float bot = 1.0 - vUv.y; // stronger effect at bottom

      // Vertical squeeze toward target y
      float sy = mix(1.0, 0.02, p);
      float cy = mix(0.5, uTarget.y, p);

      // Horizontal squeeze — bottom narrows more than top
      float sx = mix(1.0, 0.04, p * (0.4 + 0.6 * bot));
      float cx = mix(0.5, uTarget.x, p * (0.3 + 0.7 * bot));

      vec2 uv;
      uv.x = (vUv.x - cx) / sx + cx;
      uv.y = (vUv.y - cy) / sy + cy;

      float alpha = 1.0 - smoothstep(0.82, 1.0, p);

      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0);
      } else {
        vec4 col = texture2D(uTex, uv);
        gl_FragColor = vec4(col.rgb, col.a * alpha);
      }
    }
  `;

  // ── Compile shaders ───────────────────────────────────────────────────────
  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // ── Fullscreen quad ───────────────────────────────────────────────────────
  const verts = new Float32Array([
    -1,-1, 0,0,
     1,-1, 1,0,
    -1, 1, 0,1,
     1, 1, 1,1,
  ]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aUv  = gl.getAttribLocation(prog, 'aUv');
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(aUv,  2, gl.FLOAT, false, 16, 8);

  const uTex    = gl.getUniformLocation(prog, 'uTex');
  const uP      = gl.getUniformLocation(prog, 'uP');
  const uTarget = gl.getUniformLocation(prog, 'uTarget');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ── Texture from modal snapshot ───────────────────────────────────────────
  function createTexture() {
    const rect = certModalInner.getBoundingClientRect();
    const dpr  = window.devicePixelRatio;
    const w = Math.round(rect.width  * dpr);
    const h = Math.round(rect.height * dpr);

    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = getComputedStyle(certModalInner).backgroundColor || '#1E1B18';
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (certImg.complete && certImg.naturalWidth > 0) {
      const ir = certImg.getBoundingClientRect();
      ctx.drawImage(certImg, ir.left - rect.left, ir.top - rect.top, ir.width, ir.height);
    }

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  function resizeCanvas() {
    canvas.width  = window.innerWidth  * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ── Animation loop ────────────────────────────────────────────────────────
  let animating    = false;
  let animDir      = 1;     // 1=closing (0→1), -1=opening (1→0)
  let animProgress = 0;
  let lastTime     = 0;
  let currentTex   = null;
  const DURATION   = 600;  // ms

  function easeInOutCubic(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
  }

  function renderFrame(ts) {
    if (!animating) return;

    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    const step = delta / DURATION;
    animProgress = animDir === 1
      ? Math.min(1, animProgress + step)
      : Math.max(0, animProgress - step);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uP, easeInOutCubic(animProgress));
    gl.uniform2f(uTarget, 0.5, 0.0);
    gl.uniform1i(uTex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const done = (animDir === 1 && animProgress >= 1) ||
                 (animDir === -1 && animProgress <= 0);

    if (done) {
      animating = false;
      lastTime  = 0;
      canvas.style.display = 'none';

      if (animDir === 1) {
        // Closed
        certModal.classList.remove('open');
        certBackdrop.classList.remove('open');
        certModalInner.classList.remove('ready');
        document.body.style.overflow = '';
      } else {
        // Opened
        certModalInner.classList.add('ready');
      }

      if (currentTex) { gl.deleteTexture(currentTex); currentTex = null; }
      return;
    }

    requestAnimationFrame(renderFrame);
  }

  // ── Open / Close ──────────────────────────────────────────────────────────
  async function openModal(src, title) {
    if (animating) return;
    certImg.src = src;
    certName.textContent = title;
    document.body.style.overflow = 'hidden';

    // Show modal fully to snapshot it
    certModal.classList.add('open');
    certBackdrop.classList.add('open');
    certModalInner.classList.add('ready');

    // Wait for image
    await new Promise(res => {
      if (certImg.complete && certImg.naturalWidth > 0) return res();
      certImg.onload = res; certImg.onerror = res;
    });

    // Wait two frames for paint
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

    // Snapshot then hide real modal
    resizeCanvas();
    currentTex = createTexture();
    gl.bindTexture(gl.TEXTURE_2D, currentTex);
    certModalInner.classList.remove('ready');
    canvas.style.display = 'block';

    animDir      = -1;   // opening: progress 1 → 0
    animProgress = 1.0;
    animating    = true;
    lastTime     = 0;
    requestAnimationFrame(renderFrame);
  }

  function closeModal() {
    if (animating) return;
    resizeCanvas();
    currentTex = createTexture();
    gl.bindTexture(gl.TEXTURE_2D, currentTex);
    certModalInner.classList.remove('ready');
    canvas.style.display = 'block';

    animDir      = 1;    // closing: progress 0 → 1
    animProgress = 0.0;
    animating    = true;
    lastTime     = 0;
    requestAnimationFrame(renderFrame);
  }

  // ── Wire up ───────────────────────────────────────────────────────────────
  document.querySelectorAll('.cert-link').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.cert, el.dataset.name));
  });
  document.getElementById('certClose').addEventListener('click', closeModal);
  certBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();
