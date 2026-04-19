import React, { useEffect, useRef } from "react";
import "./Intro.css";
import { RPLeaderboard } from "../components/RPLeaderboard";

const Intro = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initApp = () => {
      // @ts-expect-error - gsap is loaded from CDN
      if (!window.gsap || !window.THREE || !window.ScrollTrigger) {
        setTimeout(initApp, 100);
        return;
      }

      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;
      const THREE = window.THREE;

      gsap.registerPlugin(ScrollTrigger);

      // ─── UTILS: Text Splitter ───
      function splitText(selector) {
        const el = document.querySelector(selector);
        if (!el) return [];
        const text = el.textContent || "";
        el.innerHTML = "";
        return text.split("").map((char) => {
          const span = document.createElement("span");
          if (char === " ") {
            span.innerHTML = "&nbsp;";
          } else {
            span.textContent = char;
          }
          span.style.display = "inline-block";
          el.appendChild(span);
          return span;
        });
      }

      splitText(".hero-title .line2");
      splitText(".hero-sub");

      // ─── HERO STARFIELD (Three.js) ───
      (function initHeroScene() {
        const canvas = document.getElementById("hero-canvas");
        if (!canvas) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 20, 100);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5;

        // Starfield
        for (let layer = 0; layer < 3; layer++) {
          const count = 3000;
          const geo = new THREE.BufferGeometry();
          const pos = new Float32Array(count * 3);
          const cols = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            const r = 200 + Math.random() * 600;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
            pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
            pos[i * 3 + 2] = r * Math.cos(ph);
            const c = new THREE.Color();
            c.setHSL(Math.random() < 0.8 ? 0 : Math.random() < 0.5 ? 0.55 : 0.75, 0.5, 0.7 + Math.random() * 0.3);
            cols[i * 3] = c.r;
            cols[i * 3 + 1] = c.g;
            cols[i * 3 + 2] = c.b;
          }
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
          const mat = new THREE.PointsMaterial({
            size: 1.5 - layer * 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const stars = new THREE.Points(geo, mat);
          stars.userData = { layer };
          scene.add(stars);
        }

        // Nebula planes
        const nebGeo = new THREE.PlaneGeometry(800, 400, 1, 1);
        const nebMat = new THREE.MeshBasicMaterial({
          color: 0x7c3aed,
          transparent: true,
          opacity: 0.04,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const neb = new THREE.Mesh(nebGeo, nebMat);
        neb.position.z = -300;
        scene.add(neb);
        const neb2Mat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.03,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const neb2 = new THREE.Mesh(nebGeo.clone(), neb2Mat);
        neb2.position.set(100, -50, -400);
        neb2.rotation.z = 0.3;
        scene.add(neb2);

        function animate() {
          requestAnimationFrame(animate);
          const t = Date.now() * 0.001;
          scene.children.forEach((child) => {
            if (child.isPoints) {
              child.rotation.y = t * 0.02 * (1 - child.userData.layer * 0.3);
              child.rotation.x = Math.sin(t * 0.01) * 0.1;
            }
          });
          camera.position.x = Math.sin(t * 0.1) * 3;
          camera.position.y = 20 + Math.cos(t * 0.15) * 2;
          camera.lookAt(0, 0, -200);
          renderer.render(scene, camera);
        }
        animate();

        window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      })();

      // ─── CHARACTER SECTION (Platform + Lights) ───
      (function initCharScene() {
        const canvas = document.getElementById("character-canvas");
        if (!canvas) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 2, 6);
        camera.lookAt(0, 1, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Lights
        const purpleLight = new THREE.PointLight(0x7c3aed, 3, 15);
        purpleLight.position.set(-3, 3, 2);
        scene.add(purpleLight);
        const cyanLight = new THREE.PointLight(0x06b6d4, 3, 15);
        cyanLight.position.set(3, 3, 2);
        scene.add(cyanLight);
        const topSpot = new THREE.SpotLight(0xa855f7, 4, 20, Math.PI / 6);
        topSpot.position.set(0, 8, 0);
        topSpot.target.position.set(0, 0, 0);
        scene.add(topSpot);
        scene.add(topSpot.target);
        const ambient = new THREE.AmbientLight(0x1a1a3e, 1.5);
        scene.add(ambient);

        const frontLight = new THREE.DirectionalLight(0xffddaa, 2);
        frontLight.position.set(0, 3, 10);
        scene.add(frontLight);

        // Platform
        const platGeo = new THREE.CylinderGeometry(2, 2, 0.05, 64);
        const platMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1f, metalness: 0.8, roughness: 0.3 });
        const platform = new THREE.Mesh(platGeo, platMat);
        platform.position.y = -0.025;
        scene.add(platform);

        // Halo Ring Cyan
        const ringGeo = new THREE.TorusGeometry(2.2, 0.03, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 3,
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        scene.add(ring);

        // Halo Ring Purple
        const ring2Geo = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
        const ring2Mat = new THREE.MeshStandardMaterial({
          color: 0x7c3aed,
          emissive: 0x7c3aed,
          emissiveIntensity: 2,
          transparent: true,
          opacity: 0.6,
        });
        const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = 0.01;
        scene.add(ring2);

        // Character Group
        const charGroup = new THREE.Group();
        scene.add(charGroup);

        let mixer;
        let sittingAction;

        const clock = new THREE.Clock();

        // Use standard GLTFLoader from three.js examples
        const loader = new THREE.GLTFLoader();
        loader.load(
          "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
          function (gltf) {
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(0, 0, 0);
            model.rotation.set(0, 0, 0);

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            charGroup.add(model);
            charGroup.position.set(0, 0, 0);

            mixer = new THREE.AnimationMixer(model);
            if (gltf.animations && gltf.animations.length > 0) {
              const idleClip = gltf.animations.find((clip) => clip.name === "Idle") || gltf.animations[0];
              sittingAction = mixer.clipAction(idleClip);
              sittingAction.play();

              const animations = gltf.animations;
              
              const btnSit = document.getElementById("btn-sit");
              if (btnSit) {
                btnSit.onclick = () => {
                  if (mixer) {
                    mixer.stopAllAction();
                    const sitClip = animations.find((clip) => clip.name === "Sitting") || animations.find((clip) => clip.name === "Idle") || animations[0];
                    const action = mixer.clipAction(sitClip);
                    action.reset().play();
                  }
                };
              }

              const btnDance = document.getElementById("btn-dance");
              if (btnDance) {
                btnDance.onclick = () => {
                  if (mixer) {
                    mixer.stopAllAction();
                    const danceClip = animations.find((clip) => clip.name === "Dance") || animations.find((clip) => clip.name === "Wave") || animations[1] || animations[0];
                    const action = mixer.clipAction(danceClip);
                    action.reset().play();
                  }
                };
              }
            }

            const l = document.getElementById("loader");
            if (l) l.classList.add("hidden");
            const charInfo = document.getElementById("char-info");
            if (charInfo) charInfo.style.opacity = "1";
          },
          () => {},
          function () {
            const l = document.getElementById("loader");
            if (l) l.classList.add("hidden");
            const charInfo = document.getElementById("char-info");
            if (charInfo) charInfo.style.opacity = "1";
          }
        );

        // Grid floor
        const gridHelper = new THREE.GridHelper(20, 30, 0x7c3aed, 0x06b6d4);
        gridHelper.position.y = -0.02;
        gridHelper.material.opacity = 0.08;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        function animate() {
          requestAnimationFrame(animate);
          const t = Date.now() * 0.001;
          const delta = clock.getDelta();
          if (mixer) mixer.update(delta);
          ring.rotation.z = t * 0.3;
          ring2.rotation.z = -t * 0.2;
          purpleLight.intensity = 2.5 + Math.sin(t * 2) * 0.5;
          cyanLight.intensity = 2.5 + Math.cos(t * 2) * 0.5;
          renderer.render(scene, camera);
        }
        animate();

        window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });

        ScrollTrigger.create({
          trigger: "#character-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            camera.position.z = 6 - p * 2;
          },
        });
      })();

      // ─── HERO ANIMATIONS ───
      gsap.from(".hero-title .line1", { opacity: 0, y: -40, duration: 1.5, delay: 1, ease: "bounce.out" });
      gsap.from(".hero-tag", { opacity: 0, y: -20, duration: 1, delay: 1.4 });
      gsap.from(".hero-stat", { opacity: 0, y: 40, stagger: 0.15, duration: 1, delay: 1.6 });

      // Counter animations
      function animateCounter(el, target, suffix = "") {
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.5,
          delay: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.floor(obj.val).toLocaleString() + suffix;
          },
        });
      }
      animateCounter(document.getElementById("stat-chars"), 24);
      animateCounter(document.getElementById("stat-viewers"), 12847);
      animateCounter(document.getElementById("stat-reis"), 89400, " R");

      // Scroll hint fade
      gsap.to("#scroll-hint", { opacity: 0, scrollTrigger: { trigger: "#hero", start: "top top", end: "10% top", scrub: true } });

      // ─── DASHBOARD TITLE ANIMATION (Character Section) ───
      ScrollTrigger.create({
        trigger: "#character-section",
        start: "top 80%",
        end: "40% center",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          const wrap = document.getElementById("dashboard-title-wrap");
          if (wrap) {
            wrap.style.opacity = String(Math.min(p * 2, 1));
          }
          
          const lines = document.querySelectorAll(".dashboard-title-line");
          lines.forEach((line, i) => {
            const lineProgress = Math.max(0, Math.min(1, (p - i * 0.1) * 2));
            line.style.opacity = String(lineProgress);
            line.style.transform = `translateY(${30 - lineProgress * 30}px) scale(${0.9 + lineProgress * 0.1})`;
          });

          const desc = document.querySelector(".dashboard-desc-scroll");
          if (desc) {
            const descProgress = Math.max(0, Math.min(1, (p - 0.4) * 2));
            desc.style.opacity = String(descProgress);
            desc.style.transform = `translateY(${20 - descProgress * 20}px)`;
          }
        }
      });

      // ─── CIRCULAR GALLERY ───
      const characters = [
        { name: "AI-Chan", role: "Primary Agent", tag: "Active", img: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=400&q=80" },
        { name: "Zeka Reis", role: "Prediction Oracle", tag: "Beta", img: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=400&q=80" },
        { name: "Neuro-sama", role: "Stream AI", tag: "Live", img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=400&q=80" },
        { name: "MetaGuard", role: "Security Agent", tag: "Active", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80" },
        { name: "Pixie", role: "Physical Twin", tag: "Sync", img: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80" },
        { name: "DataMuse", role: "Analytics AI", tag: "Active", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
      ];

      (function initGallery() {
        const track = document.getElementById("gallery-track");
        if (!track) return;
        const angleStep = 360 / characters.length;

        characters.forEach((ch, i) => {
          const card = document.createElement("div");
          card.className = "gallery-card";
          card.style.transform = `rotateY(${i * angleStep}deg) translateZ(400px)`;
          card.innerHTML = `
            <img src="${ch.img}" alt="${ch.name}">
            <div class="gallery-card-info">
              <h3>${ch.name}</h3>
              <p>${ch.role}</p>
              <span class="card-tag">${ch.tag}</span>
            </div>`;
          track.appendChild(card);
        });

        let rotation = 0;
        let autoRotate = true;

        function updateGallery() {
          if (track) track.style.transform = `rotateY(${rotation}deg)`;
          if (autoRotate) rotation += 0.15;
          requestAnimationFrame(updateGallery);
        }
        updateGallery();

        ScrollTrigger.create({
          trigger: "#gallery",
          start: "top 80%",
          end: "bottom 20%",
          onUpdate: (self) => {
            autoRotate = false;
            rotation = self.progress * 360;
            // @ts-expect-error - window timer
            clearTimeout(window._galleryTimer);
            // @ts-expect-error - window timer
            window._galleryTimer = setTimeout(() => (autoRotate = true), 1000);
          },
        });
      })();

      // ─── BENTO GRID ───
      const bentoItems = [
        { icon: "📊", title: "Tahmin Pazari", meta: "REIS Economy", desc: "Kullanicilar yayin sirasinda olacak olaylari tahmin eder ve REIS kazanir.", tags: ["Polymarket", "Web3"], span: false, status: "LIVE" },
        { icon: "🧠", title: "Memory Graph", meta: "Neo4j", desc: "AI karakterleri gecmis sohbetleri ve iliskileri hatirlar. Gercek bir kisilik olusturur.", tags: ["Neo4j", "LangChain"], span: true, status: "ACTIVE" },
        { icon: "🎭", title: "Mixamo Animations", meta: "2000+ Clips", desc: "Karakterler Mixamo animasyonlariyla canlanir. Dans, oturma, el sallama ve daha fazlasi.", tags: ["FBX", "3D"], span: false, status: "READY" },
        { icon: "🤖", title: "Gemini Brain", meta: "Multi-modal", desc: "Google Gemini ile metin, goruntu ve ses anlama. Gercek zamanli tepkiler.", tags: ["Vision", "Audio"], span: false, status: "ACTIVE" },
        { icon: "🎮", title: "Physical Twin", meta: "ESP32", desc: "AI karakterinin fiziksel oyuncak versiyonu. Gercek dunyada etkilesim.", tags: ["IoT", "Hardware"], span: true, status: "BETA" },
        { icon: "💎", title: "REIS Token", meta: "Solana", desc: "Platform ekonomisinin kalbi. Stake, vote ve reward mekanizmalari.", tags: ["SPL", "DeFi"], span: false, status: "SOON" }
      ];

      (function initBento() {
        const grid = document.getElementById("bento-grid");
        if (!grid) return;
        bentoItems.forEach((item) => {
          const card = document.createElement("div");
          card.className = `bento-card${item.span ? " span-2" : ""}`;
          card.innerHTML = `
            <div class="bento-icon">${iconMap[item.icon] || "📦"}</div>
            <span class="bento-status">${item.status}</span>
            <h3 class="bento-title">${item.title}<span class="bento-meta">${item.meta}</span></h3>
            <p class="bento-desc">${item.desc}</p>
            <div class="bento-tags">
              ${item.tags.map((t) => `<span class="bento-tag">${t}</span>`).join("")}
            </div>`;
          grid.appendChild(card);

          card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          });
        });

        gsap.from(".bento-card", {
          scrollTrigger: { trigger: "#bento-grid", start: "top 80%" },
          opacity: 0,
          y: 60,
          stagger: 0.1,
          duration: 0.8,
        });
      })();

      // ─── NAVBAR HIDE ON SCROLL ───
      let lastScroll = 0;
      window.addEventListener("scroll", () => {
        const currentScroll = window.scrollY;
        const navbar = document.getElementById("navbar");
        if (navbar) {
          if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add("hide");
          } else {
            navbar.classList.remove("hide");
          }
        }
        lastScroll = currentScroll;
      });

      // ─── LOADER ───
      const hideLoader = () => {
        const l = document.getElementById("loader");
        if (l && !l.classList.contains("hidden")) {
          l.classList.add("hidden");
          // Show content after loader hides
          setTimeout(() => {
            document.querySelector(".navbar")?.classList.add("loaded");
            document.getElementById("hero")?.classList.add("loaded");
            document.querySelector(".hero-content")?.classList.add("loaded");
          }, 100);
        }
      };

      window.addEventListener("load", () => {
        setTimeout(hideLoader, 5000);
      });

      // Fallback if window load already fired
      if (document.readyState === "complete") {
        setTimeout(hideLoader, 5000);
      }

      // Fetch live stats from backend
      async function fetchLiveStats() {
        try {
          const res = await fetch("https://api.pixpox.tech/api/stats/live");
          const json = await res.json();
          if (json.success && json.data) {
            const { aiCharacters, liveViewers, reisStaked, isLive } = json.data;
            animateNumber("stat-chars", aiCharacters, "");
            animateNumber("stat-viewers", liveViewers, "");
            animateNumber("stat-reis", reisStaked, " R");
            
            const liveBadge = document.getElementById("live-badge");
            if (liveBadge) {
              if (isLive) {
                liveBadge.classList.add("active");
                liveBadge.innerHTML = '<span class="live-dot"></span>LIVE';
              } else {
                liveBadge.classList.remove("active");
                liveBadge.innerHTML = '<span class="live-dot offline"></span>OFFLINE';
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch live stats:", err);
        }
      }

      function animateNumber(elementId, target, suffix = "") {
        const el = document.getElementById(elementId);
        if (!el) return;
        const currentText = el.textContent || "0";
        const start = parseInt(currentText.replace(/[^0-9]/g, "") || "0", 10);
        const duration = 1500;
        const startTime = performance.now();
        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(start + (target - start) * easeProgress);
          el.textContent = current.toLocaleString("tr-TR") + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }

      fetchLiveStats();
      const statsInterval = setInterval(fetchLiveStats, 30000);
      return () => clearInterval(statsInterval);
    };

    const cleanup = initApp();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="intro-page dark">
      <div className="intro-container">
        <div className="circuit-bg"></div>

      <div id="loader" className="loader-overlay">
        <div className="loader-ring"></div>
        <div className="loader-text">PIXPOX</div>
      </div>

      <nav className="navbar" id="navbar">
        <div className="nav-logo">
          <svg viewBox="0 0 36 36" fill="none">
            <rect x="2" y="2" width="32" height="32" rx="8" stroke="url(#ng)" strokeWidth="2" />
            <path d="M12 12h5v5h-5zM19 12h5v5h-5zM12 19h5v5h-5zM19 19h5v5h-5z" fill="url(#ng)" opacity=".6" />
            <path d="M14 14h8v8h-8z" fill="url(#ng)" />
            <defs>
              <linearGradient id="ng" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#06b6d4" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <span className="nav-logo-text">PixPox</span>
        </div>
        <div className="nav-links">
          <span className="live-badge" id="live-badge">
            <span className="live-dot"></span>...
          </span>
          <a href="#character-section">Characters</a>
          <a href="#anim-picker">Animations</a>
          <a href="#rp-dashboard">Dashboard</a>
          <a href="/game">Game</a>
          <a href="https://kick.com/zekareis" target="_blank" rel="noopener noreferrer" className="nav-cta">
            Launch App
          </a>
        </div>
      </nav>

      <section id="hero">
        <canvas id="hero-canvas"></canvas>
        <div className="hero-overlay"></div>
        <div className="hero-content" id="hero-content">
          <div className="hero-tag">
            <span className="live-dot" style={{ background: "var(--cyan)" }}></span>
            AI PERSONALITY ENGINE
          </div>
          <h1 className="hero-title">
            <span className="line1">PIXPOX</span>
            <span className="line2">Where AI Meets Reality</span>
          </h1>
          <p className="hero-sub">
            Yapay zekanin kisilik motoru. 3D karakterler, canli yayin ekonomisi ve tahmin pazari - hepsi tek platformda.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-val" id="stat-chars">0</div>
              <div className="hero-stat-label">AI Characters</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val" id="stat-viewers">0</div>
              <div className="hero-stat-label">Live Viewers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val" id="stat-reis">0</div>
              <div className="hero-stat-label">REIS Staked</div>
            </div>
          </div>
        </div>
        <div className="scroll-hint" id="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      <section id="character-section">
        <div id="character-canvas-wrap">
          <canvas id="character-canvas"></canvas>
          <div className="dashboard-title-wrap" id="dashboard-title-wrap">
            <div className="dashboard-label">Dashboard</div>
            <h2 className="dashboard-title-scroll">
              <span className="dashboard-title-line">Akilli</span>
              <span className="dashboard-title-line">Yayinci</span>
              <span className="dashboard-title-line accent">Isletim</span>
              <span className="dashboard-title-line accent">Sistemi</span>
            </h2>
            <p className="dashboard-desc-scroll">
              Neo4j ile gecmisi hatirlayan, Gemini ile dusunen, Mixamo ile hareket eden - tam bir AI Personality Engine.
            </p>
          </div>
          <div className="character-info" id="char-info">
            <div className="character-name">AI-CHAN</div>
            <div className="character-role">Primary VTuber Agent</div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <button className="action-btn" id="btn-sit">Sit</button>
              <button className="action-btn" id="btn-dance">Break Dance</button>
            </div>
          </div>
        </div>
      </section>

      <section id="anim-picker">
        <div className="section-label">Ajanlar</div>
        <h2 className="anim-picker-title">Agentic Yapi ile AI Karakterine Hayat Ver</h2>
        <p className="anim-picker-sub">Yayin icin kullandigim ajanlar</p>
        <div className="gallery-wrap" id="gallery">
          <div className="gallery-track" id="gallery-track"></div>
        </div>
      </section>

      <section className="section" id="rp-dashboard">
        <div className="section-label">Live Economy</div>
        <h2 className="section-title">Reis Puan (RP)<br />Leaderboard</h2>
        <p className="section-desc">
          Kick yayininda izleyiciler sohbete katilarak, bahis oynayarak ve hediye gondererek Reis Puan (RP) kazanir.
        </p>
        <RPLeaderboard />
        <div className="rp-commands">
          <h3 className="commands-title">Kullanilabilir Komutlar</h3>
          <div className="commands-grid">
            <div className="command-card"><code>!rp</code><span>Mevcut RP puaninizi goruntuler</span></div>
            <div className="command-card"><code>!bahis [miktar]</code><span>Belirtilen miktarda bahis oynar</span></div>
            <div className="command-card"><code>!transfer [user]</code><span>RP transfer eder</span></div>
            <div className="command-card"><code>!sira</code><span>Siramanizi gosterir</span></div>
            <div className="command-card"><code>!hediye</code><span>Rastgele hediye gonderir</span></div>
            <div className="command-card"><code>!gunluk</code><span>Gunluk bonus RP toplar</span></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">PixPox</div>
        <p className="footer-desc">AI Personality Engine - Dijital ve fiziksel dunyayi birlestiren hibrit ekosistem.</p>
        <div className="footer-social">
          <a href="https://kick.com/zekareis" target="_blank" rel="noopener noreferrer">K</a>
          <a href="https://github.com/onrdmr" target="_blank" rel="noopener noreferrer">GH</a>
          <a href="https://linkedin.com/in/onur-demir-98b8a6172" target="_blank" rel="noopener noreferrer">LI</a>
          <a href="https://x.com/zeka_reiss" target="_blank" rel="noopener noreferrer">X</a>
        </div>
        <div className="footer-links">
          <a href="https://kick.com/zekareis">Kick</a>
          <a href="/game">Game</a>
          <a href="https://github.com/onrdmr">GitHub</a>
        </div>
        <div className="footer-copy">© 2026 PixPox.tech - Tum haklari saklidir.</div>
      </footer>
    </div>
  );
};

export default Intro;
