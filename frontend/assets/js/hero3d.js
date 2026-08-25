/* Cute Crew — scroll-scrubbed hero.
 * Scrolling scrubs the fashion film's timeline like a hand-controlled video,
 * with a subtle Three.js layer of golden dust particles and soft light glows
 * for depth. Captions and the progress rail are driven by the same scroll. */

(function () {
  const wrap = document.getElementById('hero-wrap');
  const stick = document.getElementById('hero-sticky');
  const canvas = document.getElementById('hero-canvas');
  if (!wrap || !stick) return;

  const isMobile = window.innerWidth < 768;

  // ---------- scroll-scrubbed background video ----------
  const video = document.getElementById('hero-video');
  if (video) {
    video.addEventListener('error', () => { video.style.display = 'none'; });
    video.addEventListener('loadedmetadata', () => { try { video.currentTime = 0.01; } catch (e) {} });
  }

  // ---------- scroll + mouse ----------
  let progress = 0, smoothProg = 0;
  let mouseX = 0, mouseY = 0, smX = 0, smY = 0;

  function readScroll() {
    const rect = wrap.getBoundingClientRect();
    const total = wrap.offsetHeight - window.innerHeight;
    progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, total)));
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ---------- captions + progress rail ----------
  const captions = Array.from(stick.querySelectorAll('.hero-caption'));
  const progBar = stick.querySelector('.hero-progress i');
  let activeStep = -1;
  function updateOverlay() {
    const step = Math.min(captions.length - 1, Math.floor(smoothProg * captions.length * 0.999));
    if (step !== activeStep) {
      activeStep = step;
      captions.forEach((c, i) => c.classList.toggle('show', i === step));
    }
    if (progBar) progBar.style.height = `${(smoothProg * 100).toFixed(1)}%`;
  }

  // ---------- ambience layer (particles + glows only, no cards) ----------
  let renderer = null, scene, camera, particles, glows = [];
  if (canvas && window.THREE) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { renderer = null; }
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(isMobile ? 62 : 50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const glowGeo = new THREE.SphereGeometry(2.6, 24, 24);
    glows = [
      { color: 0xe6c586, x: -6, y: 3 },
      { color: 0xf7a8c4, x: 6, y: -2.5 },
      { color: 0x9cc6ff, x: -5, y: -3.5 }
    ].map((g, i) => {
      const m = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: g.color, transparent: true, opacity: 0.05 }));
      m.position.set(g.x, g.y, -8 - i * 10);
      scene.add(m);
      return m;
    });

    const P_COUNT = isMobile ? 160 : 380;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(P_COUNT * 3);
    for (let i = 0; i < P_COUNT; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 2] = 5 - Math.random() * 40;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xe6c586, size: 0.045, transparent: true, opacity: 0.5, sizeAttenuation: true }));
    scene.add(particles);
  }

  // ---------- resize ----------
  function resize() {
    if (!renderer) return;
    const w = stick.clientWidth, h = stick.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- loop (paused when hero is off screen) ----------
  let visible = true;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(wrap);

  const clock = window.THREE ? new THREE.Clock() : null;
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;

    smoothProg += (progress - smoothProg) * 0.06;    // buttery scrub
    smX += (mouseX - smX) * 0.05;
    smY += (mouseY - smY) * 0.05;

    // scrub the fashion film with scroll (all-keyframe encode makes seeks instant)
    if (video && video.style.display !== 'none' && video.readyState >= 2 && video.duration) {
      const target = smoothProg * (video.duration - 0.05);
      if (Math.abs(video.currentTime - target) > 0.015 && !video.seeking) {
        try { video.currentTime = target; } catch (e) {}
      }
    }

    updateOverlay();

    if (renderer) {
      const t = clock.getElapsedTime();
      camera.position.z = 5 - smoothProg * 30;       // dust drifts past for depth
      camera.position.x = smX * 0.55;
      camera.position.y = -smY * 0.35;
      glows.forEach((m, i) => {
        m.position.y += Math.sin(t * 0.3 + i * 2) * 0.002;
        m.position.z = -8 - i * 10 - smoothProg * 30; // glows travel with the camera
      });
      particles.rotation.z = t * 0.01;
      renderer.render(scene, camera);
    }
  }
  readScroll();
  tick();
})();
