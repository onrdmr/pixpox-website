import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Gamepad2 } from 'lucide-react';

const Navbar = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/videos', label: t.nav.videos },
    { path: '/console', label: t.nav.console },
    { path: '/projects', label: t.nav.projects }
  ];

  return (
    <nav className="pixel-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Gamepad2 className="logo-icon" size={32} />
          <span className="logo-text">PIXPOX</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="lang-toggle"
          aria-label="Change language"
        >
          {language === 'tr' ? 'EN' : 'TR'}
        </button>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
