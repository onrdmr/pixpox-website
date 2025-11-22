import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Cpu, Gauge, Wifi, Gamepad2 } from 'lucide-react';

const Console = () => {
  const { t } = useLanguage();

  const specs = [
    { icon: <Cpu size={24} />, label: 'Processor', value: 'Custom ARM Cortex' },
    { icon: <Gauge size={24} />, label: 'Performance', value: '60 FPS @ 1080p' },
    { icon: <Wifi size={24} />, label: 'Connectivity', value: 'WiFi 6 + Bluetooth 5.2' },
    { icon: <Gamepad2 size={24} />, label: 'Controllers', value: '4 Wireless Controllers' }
  ];

  return (
    <div className="page-container">
      <div className="console-hero">
        <div className="console-content">
          <h1 className="console-title">{t.console.title}</h1>
          <p className="console-description">{t.console.description}</p>
          <div className="console-features">
            <div className="feature-tag">8-BIT INSPIRED</div>
            <div className="feature-tag">RETRO DESIGN</div>
            <div className="feature-tag">MODERN TECH</div>
          </div>
        </div>
        <div className="console-image">
          <img 
            src="https://video.pixpox.tech/Thumbnail/bodypark.png?w=800&h=600&fit=crop" 
            alt="Gaming Console"
            loading="lazy"
          />
        </div>
      </div>

      <div className="specs-section">
        <h2 className="section-title">Teknik Özellikler</h2>
        <div className="specs-grid">
          {specs.map((spec, index) => (
            <div key={index} className="spec-card">
              <div className="spec-icon">{spec.icon}</div>
              <div className="spec-content">
                <h3 className="spec-label">{spec.label}</h3>
                <p className="spec-value">{spec.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gallery-section">
        <h2 className="section-title">Galeri</h2>
        <div className="image-gallery">
          <img src="https://video.pixpox.tech/Thumbnail/pixie.webp?w=600&h=400&fit=crop" alt="Console angle 1" loading="lazy" />
          <img src="https://video.pixpox.tech/Thumbnail/Console.jpg?w=600&h=400&fit=crop" alt="Console angle 2" loading="lazy" />
          <img src="https://video.pixpox.tech/Thumbnail/twister-os.png?w=600&h=400&fit=crop" alt="Console angle 3" loading="lazy" />
        </div>
      </div>
    </div>
  );
};

export default Console;
