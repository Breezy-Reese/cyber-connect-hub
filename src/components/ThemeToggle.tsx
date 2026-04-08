// src/components/ThemeToggle.tsx
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.4rem 0.75rem',
        border: `1px solid ${isDark ? '#1e2d4a' : '#d1d5db'}`,
        borderRadius: 8,
        background: isDark ? 'rgba(0,212,255,0.05)' : 'rgba(0,0,0,0.05)',
        color: isDark ? '#94a3b8' : '#4b5563',
        cursor: 'pointer',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
        transition: 'all 0.2s',
      }}
    >
      {isDark ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          LIGHT
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          DARK
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
