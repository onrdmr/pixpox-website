// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockVideos } from '../mock/mockData';
import VideoCard from '../components/VideoCard';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGooglePlay, faAppStoreIos, faWindows } from '@fortawesome/free-brands-svg-icons'

import { Download, PlayCircle, Sparkles, Zap, Trophy, X } from 'lucide-react';

const cursorImages = [
  'https://video.pixpox.tech/Thumbnail/sword-attack.gif'
];

const Home = () => {
  const { t } = useLanguage();

  const [cursorImg] = useState(cursorImages[0]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [inHero, setInHero] = useState(false);

  const heroRef = useRef(null);
  const dialogRef = useRef(null); // 1) dialog referansı

  const dialogDownloadRef = useRef(null); // 1) dialog referansı

  // Fare takibi
  useEffect(() => {
    const onMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      setInHero(inside);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // 2) Dialog aç/kapat
  const openDialog = () => dialogRef.current?.showModal();
  const openDialogDownload = () => dialogDownloadRef.current?.showModal();
  const closeDialog = () => dialogRef.current?.close();
  const closeDialogDownload = () => dialogDownloadRef.current?.close();

  // En çok pixlenen 6 video
  const topPixedVideos = [...mockVideos]
    .sort((a, b) => b.pix - a.pix)
    .slice(0, 6);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <a
          href="https://buymeacoffee.com/pixpox"
          target="_blank"
          rel="noopener noreferrer"
          className="support-me"
        >
          ☕ Support Me
        </a>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>8-BIT POWERED</span>
          </div>
          <h1 className="hero-title">{t.hero.title}</h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <p className="hero-description">{t.hero.description}</p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={openDialogDownload}>
              <Download size={20} />
              {t.hero.downloadApp}
            </button>

            {/* 3) Tıklayınca dialog açılıyor */}
            <button className="btn-secondary" onClick={openDialog}>
              <PlayCircle size={20} />
              {t.hero.watchVideo}
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual" ref={heroRef}>
          <div className="pixel-row">
            <div className="pixel-grid">
              <div className="pixel-item pixel-1">
                <Zap size={32} />
              </div>
              <div className="pixel-item pixel-2">
                <Trophy size={32} />
              </div>
              <div className="pixel-item pixel-3">
                <Sparkles size={32} />
              </div>
            </div>
          </div>

          {inHero && (
            <img
              src={cursorImg}
              alt="cursor"
              style={{
                position: 'fixed',
                top: mousePos.y,
                left: mousePos.x,
                width: 160,
                height: 160,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
              }}
            />
          )}
        </div>
      </section>

      {/* … Diğer section’lar (features, video gallery) … */}
 <section className="features-section">
        <div className="feature-box">
          <div className="feature-icon">
            <PlayCircle size={32} />
          </div>
          <h3>Video + Oyun</h3>
          <p>Video izlerken oyun oynayın</p>
        </div>
        <div className="feature-box">
          <div className="feature-icon">
            <Zap size={32} />
          </div>
          <h3>Al & Sat</h3>
          <p>Videoları beğen veya beğenme</p>
        </div>
        <div className="feature-box">
          <div className="feature-icon">
            <Trophy size={32} />
          </div>
          <h3>Paylaş & Kazan</h3>
          <p>Başarılarınızı paylaşın</p>
        </div>
      </section>

      {/* Video Gallery - Most Pixed */}
      <section className="video-gallery-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.videoGallery.title}</h2>
            <p className="section-subtitle">{t.videoGallery.subtitle}</p>
          </div>
          <button className="btn-view-all" onClick={() => (window.location.href = '/videos')}>
            {t.videoGallery.viewAll}
          </button>
        </div>
        <div className="video-grid">
          {topPixedVideos.map((video, idx) => (
            <VideoCard key={`${video.id}-${idx}`} video={video} />
          ))}
        </div>
      </section>
      {/* 4) HTML5 <dialog> elementi */}
      <dialog ref={dialogRef} className="video-dialog">
        <button className="dialog-close" onClick={closeDialog} aria-label="Kapat">
          <X size={20} />
        </button>

        <h2>Tanıtım Videosu</h2>

        {/* YouTube Embed */}
        <div className="video-wrapper">
          <iframe width="1573" height="885" src="https://www.youtube.com/embed/2bRADOrC1zs" title="Pixpox (Pixelart Tiktok)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </dialog>

      <dialog ref={dialogDownloadRef} className="video-dialog">
        <button className="dialog-close" onClick={closeDialogDownload} aria-label="Kapat">
          <X size={20} />
        </button>

        <h2>Yakında Storedayız</h2>

        <div className="platform-buttons">

          {/* Android */}
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="platform-btn"
          >
            <FontAwesomeIcon icon={faGooglePlay} className="platform-icon" size='5x'/>
            {/* <span>Android</span> */}
          </a>

          {/* iOS */}
          <a
            href="https://apps.apple.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="platform-btn"
          >
            <FontAwesomeIcon icon={faAppStoreIos} className="platform-icon" size='5x'/>
            {/* <span>iOS</span> */}
          </a>

          {/* PC */}
          <a href="/download/windows-app.exe" className="platform-btn">
            <FontAwesomeIcon icon={faWindows} className="platform-icon" size='5x'/>
            {/* <span>PC</span> */}
          </a>

        </div>
      </dialog>


    </div>
  );
};

export default Home;