import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Github, Twitter, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">{t.footer.brand}</h3>
          <p className="footer-text">
            Video izlerken oyun oyna, beğendiğini Pixle, beğenmediğini Poxla!
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">{t.footer.contact}</h4>
          <div className="social-links">
            <a href="https://github.com/onrdmr" className="social-link" aria-label="Github">
              <Github size={20} />
            </a>
            <a href="https://x.com/onrdmr__" className="social-link" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="mailto:onur.demir.cse@gmail.com" className="social-link" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {currentYear} {t.footer.brand}. {t.footer.rights}
        </p>
        <div className="footer-made">
          Made with <Heart size={14} fill="currentColor" /> by gaming enthusiasts
        </div>
      </div>
    </footer>
  );
};

export default Footer;
