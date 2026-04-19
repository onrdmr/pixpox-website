import React, { useEffect, useRef } from 'react';
import './Intro.css';

const Intro = () => {
  const heroCanvasRef = useRef(null);
  const charCanvasRef = useRef(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    // ─── UTILS: Text Splitter ───
    function splitText(selector) {
      const el = document.querySelector(selector);
      if (!el) return [];
      const text = el.innerText;
      el.innerHTML = '';
      return text.split('').map(char => {
        const span = document.createElement('span');
        if (char === ' ') {
          span.innerHTML = '&nbsp;';
        } else {
          span.innerText = char;
        }
        span.style.display = 'inline-block';
        el.appendChild(span);
        return span;
      });
    }

    const line2Spans = splitText('.hero-title .line2');
    const subSpans = splitText('.hero-sub');

    // ─── HERO STARFIELD (Three.js) ───
    const initHeroScene = () => {
      const canvas = heroCanvasRef.current;
      if (!canvas) return;
      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.set(0, 20, 100);

      const renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Starfield
      for (let layer = 0; layer < 3; layer++) {
        const count = 3000;
        const geo = new window.THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r = 200 + Math.random() * 600;
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(Math.random() * 2 - 1);
          pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
          pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
          pos[i * 3 + 2] = r * Math.cos(ph);
          const c = new window.THREE.Color();
          c.setHSL(Math.random() < .8 ? 0 : (Math.random() < .5 ? .55 : .75), .5, .7 + Math.random() * .3);
          cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
        }
        geo.setAttribute('position', new window.THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new window.THREE.BufferAttribute(cols, 3));
        const mat = new window.THREE.PointsMaterial({ size: 1.5 - layer * .3, vertexColors: true, transparent: true, opacity: .8, blending: window.THREE.AdditiveBlending, depthWrite: false });
        const stars = new window.THREE.Points(geo, mat);
        stars.userData = { layer };
        scene.add(stars);
      }

      const animate = () => {
        requestAnimationFrame(animate);
        const t = Date.now() * .001;
        scene.children.forEach(child => {
          if (child.isPoints) {
            child.rotation.y = t * .02 * (1 - child.userData.layer * .3);
            child.rotation.x = Math.sin(t * .01) * .1;
          }
        });
        camera.position.x = Math.sin(t * .1) * 3;
        camera.position.y = 20 + Math.cos(t * .15) * 2;
        camera.lookAt(0, 0, -200);
        renderer.render(scene, camera);
      };
      animate();
    };

    // ─── CHARACTER SECTION ───
    const initCharScene = () => {
      const canvas = charCanvasRef.current;
      if (!canvas) return;
      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 2, 6);
      camera.lookAt(0, 1, 0);

      const renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Lights
      const ambient = new window.THREE.AmbientLight(0x1a1a3e, 1.5);
      scene.add(ambient);
      const frontLight = new window.THREE.DirectionalLight(0xffddaa, 2);
      frontLight.position.set(0, 3, 10);
      scene.add(frontLight);

      // Platform
      const platGeo = new window.THREE.CylinderGeometry(2, 2, 0.05, 64);
      const platMat = new window.THREE.MeshStandardMaterial({ color: 0x0a0a1f, metalness: 0.8, roughness: 0.3 });
      const platform = new window.THREE.Mesh(platGeo, platMat);
      platform.position.y = -0.025;
      scene.add(platform);

      // Character Group
      const charGroup = new window.THREE.Group();
      scene.add(charGroup);

      let mixer;
      const clock = new window.THREE.Clock();

      const loader = new window.THREE.FBXLoader();
      loader.load('/neuro_sitting_clean.fbx', (fbx) => {
        charGroup.add(fbx);
        mixer = new window.THREE.AnimationMixer(fbx);
        if (fbx.animations && fbx.animations.length > 0) {
          mixer.clipAction(fbx.animations[0]).play();
        }
        if (loaderRef.current) loaderRef.current.classList.add('hidden');
      }, undefined, (err) => {
        console.error('FBX Load Error:', err);
        if (loaderRef.current) loaderRef.current.classList.add('hidden');
      });

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
      };
      animate();
    };

    // ─── BENTO & GALLERY ───
    const initBentoAndGallery = () => {
      const bentoItems = [
        { icon: '📊', title: 'Tahmin Pazarı', meta: 'REIS Economy', desc: 'Kullanıcılar yayın sırasında olacak olayları tahmin eder ve REIS kazanır.', tags: ['Polymarket', 'Web3'], span: false, status: 'LIVE' },
        { icon: '🧠', title: 'Memory Graph', meta: 'Neo4j', desc: 'AI karakterleri geçmiş sohbetleri ve ilişkileri hatırlar. Gerçek bir kişilik oluşturur.', tags: ['Neo4j', 'LangChain'], span: true, status: 'ACTIVE' },
        { icon: '🎭', title: 'Mixamo Animations', meta: '2000+ Clips', desc: 'Karakterler Mixamo animasyonlarıyla canlanır. Dans, oturma, el sallama ve daha fazlası.', tags: ['FBX', '3D'], span: false, status: 'READY' },
        { icon: '🤖', title: 'Gemini Brain', meta: 'Multi-modal', desc: 'Google Gemini ile metin, görüntü ve ses anlama. Gerçek zamanlı tepkiler.', tags: ['Vision', 'Audio'], span: false, status: 'ACTIVE' },
        { icon: '🎮', title: 'Physical Twin', meta: 'ESP32', desc: 'AI karakterinin fiziksel oyuncak versiyonu. Gerçek dünyada etkileşim.', tags: ['IoT', 'Hardware'], span: true, status: 'BETA' },
        { icon: '💎', title: 'REIS Token', meta: 'Solana', desc: 'Platform ekonomisinin kalbi. Stake, vote ve reward mekanizmaları.', tags: ['SPL', 'DeFi'], span: false, status: 'SOON' }
      ];

      const grid = document.getElementById('bento-grid');
      if (grid) {
        grid.innerHTML = '';
        bentoItems.forEach(item => {
          const card = document.createElement('div');
          card.className = `bento-card${item.span ? ' span-2' : ''}`;
          card.innerHTML = `
            <div class="bento-icon">${item.icon}</div>
            <span class="bento-status">${item.status}</span>
            <h3 class="bento-title">${item.title}<span class="bento-meta">${item.meta}</span></h3>
            <p class="bento-desc">${item.desc}</p>
            <div class="bento-tags">
              ${item.tags.map(t => `<span class="bento-tag">${t}</span>`).join('')}
            </div>`;
          grid.appendChild(card);
        });
      }
    };

    initHeroScene();
    initCharScene();
    initBentoAndGallery();

    // GSAP Hero Animations
    window.gsap.from('.hero-title .line1', { opacity: 0, y: -40, duration: 1.5, delay: 0.5, ease: 'bounce.out' });
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="intro-page">
      <div className="circuit-bg"></div>
      
      <div id="loader" ref={loaderRef}>
        <div className="loader-ring"></div>
        <div className="loader-text">PIXPOX</div>
      </div>

      <nav className="navbar" id="navbar">
        <div className="nav-logo">
          <svg viewBox="0 0 36 36" fill="none">
            <rect x="2" y="2" width="32" height="32" rx="8" stroke="url(#ng)" stroke-width="2" />
            <path d="M12 12h5v5h-5zM19 12h5v5h-5zM12 19h5v5h-5zM19 19h5v5h-5z" fill="url(#ng)" opacity=".6" />
            <path d="M14 14h8v8h-8z" fill="url(#ng)" />
            <defs>
              <linearGradient id="ng" x1="0" y1="0" x2="36" y2="36">
                <stop stop-color="#06b6d4" />
                <stop offset="1" stop-color="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <span className="nav-logo-text">PixPox</span>
        </div>
        <div className="nav-links">
          <span className="live-badge"><span class="live-dot"></span>LIVE</span>
          <a href="#character-section">Characters</a>
          <a href="#anim-picker">Animations</a>
          <a href="/game">Dashboard</a>
          <a href="https://github.com/onrdmr" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/onur-demir-98b8a6172/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://x.com/zeka_reiss" target="_blank" rel="noreferrer">X (Twitter)</a>
          <a href="https://kick.com/zekareis" className="nav-cta" target="_blank" rel="noreferrer">Launch App</a>
        </div>
      </nav>

      <section id="hero">
        <canvas id="hero-canvas" ref={heroCanvasRef}></canvas>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-tag">AI PERSONALITY ENGINE</div>
          <h1 className="hero-title">
            <span className="line1">PIXPOX</span>
            <span className="line2">Where AI Meets Reality</span>
          </h1>
          <p className="hero-sub">Yapay zekanın kişilik motoru. 3D karakterler, canlı yayın ekonomisi ve tahmin pazarı — hepsi tek platformda.</p>
        </div>
      </section>

      <section id="character-section">
        <div id="character-canvas-wrap">
          <canvas id="character-canvas" ref={charCanvasRef}></canvas>
        </div>
      </section>

      <section id="anim-picker">
        <div className="section-label">Character Hub</div>
        <h2 className="anim-picker-title">Animasyon Seç, Karakterini Canlandır</h2>
        <div id="bento-grid" className="bento-grid"></div>
      </section>

      <footer className="footer">
        <div className="footer-logo">PixPox</div>
        <p className="footer-copy">© 2026 PixPox.tech — Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
};

export default Intro;
