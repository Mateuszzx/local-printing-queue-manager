import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const { pathname } = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <header className="header">
      <nav className="nav">
        <div className="logo">STL Print Queue</div>
        <div className="nav-links">
          <Link className={pathname === '/' ? 'active' : ''} to="/">Upload</Link>
          <Link className={pathname === '/dashboard' ? 'active' : ''} to="/dashboard">Dashboard</Link>
          <Link className={pathname === '/settings' ? 'active' : ''} to="/settings">Settings</Link>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>
    </header>
  );
}
