// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Monitor, Shield, Ticket, KeyRound, User, Lock, AlertTriangle, Wifi } from 'lucide-react';

type Role = 'client' | 'admin';
type LoginType = 'password' | 'ticket';

const Login: React.FC = () => {
  const [role, setRole] = useState<Role>('client');
  const [loginType, setLoginType] = useState<LoginType>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let credentials: Record<string, string> = {};

    if (role === 'admin') {
      credentials = {
        username: adminUsername,
        password: adminPassword,
        loginType: 'password',
        role: 'admin',
      };
    } else if (loginType === 'password') {
      credentials = { username, password, loginType: 'password', role: 'client' };
    } else {
      credentials = { ticketCode, loginType: 'ticket', role: 'client' };
    }

    const result = await login(credentials);

    if (result.success) {
      toast.success('Login successful!');
      if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Scanline overlay */}
      <div style={styles.scanlines} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <Monitor size={26} color="#00d4ff" strokeWidth={1.5} />
          </div>
          <h1 style={styles.logoTitle}>SHINESTAR</h1>
          <p style={styles.logoSub}>Cyber Café Management System</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardGlow} />

          {/* Role tabs */}
          <div style={styles.tabs}>
            <button
              type="button"
              onClick={() => setRole('client')}
              style={{
                ...styles.tab,
                ...(role === 'client' ? styles.tabActiveClient : {}),
              }}
            >
              <Wifi size={14} />
              &nbsp;Client Login
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{
                ...styles.tab,
                ...(role === 'admin' ? styles.tabActiveAdmin : {}),
              }}
            >
              <Shield size={14} />
              &nbsp;Admin Login
            </button>
          </div>

          {/* Mode badge */}
          <div style={role === 'client' ? styles.badgeClient : styles.badgeAdmin}>
            <span style={role === 'client' ? styles.dotClient : styles.dotAdmin} />
            {role === 'client'
              ? 'Client portal — public access'
              : 'Admin panel — restricted access'}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* ── CLIENT SECTION ── */}
            {role === 'client' && (
              <>
                {/* Login type sub-tabs */}
                <div style={styles.subTabs}>
                  <button
                    type="button"
                    onClick={() => setLoginType('password')}
                    style={{
                      ...styles.subTab,
                      ...(loginType === 'password' ? styles.subTabActive : {}),
                    }}
                  >
                    <KeyRound size={12} /> Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType('ticket')}
                    style={{
                      ...styles.subTab,
                      ...(loginType === 'ticket' ? styles.subTabActive : {}),
                    }}
                  >
                    <Ticket size={12} /> Ticket Code
                  </button>
                </div>

                {loginType === 'password' ? (
                  <>
                    <Field label="Username" icon={<User size={14} />}>
                      <input
                        type="text"
                        required
                        style={styles.input}
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                      />
                    </Field>
                    <Field label="Password" icon={<Lock size={14} />}>
                      <input
                        type="password"
                        required
                        style={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Ticket Code" icon={<Ticket size={14} />}>
                    <input
                      type="text"
                      required
                      style={styles.input}
                      placeholder="e.g. TKT-A3F9"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    />
                    <p style={styles.hint}>Enter the code printed on your session ticket</p>
                  </Field>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.btn, ...styles.btnClient, ...(loading ? styles.btnDisabled : {}) }}
                >
                  {loading ? 'Connecting...' : 'Start Session →'}
                </button>
              </>
            )}

            {/* ── ADMIN SECTION ── */}
            {role === 'admin' && (
              <>
                <div style={styles.warnBox}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span>Authorized personnel only. Access is logged.</span>
                </div>

                <Field label="Admin Username" icon={<User size={14} />}>
                  <input
                    type="text"
                    required
                    style={styles.input}
                    placeholder="admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    autoComplete="username"
                  />
                </Field>
                <Field label="Password" icon={<Lock size={14} />}>
                  <input
                    type="password"
                    required
                    style={styles.input}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.btn, ...styles.btnAdmin, ...(loading ? styles.btnDisabled : {}) }}
                >
                  {loading ? 'Verifying...' : 'Access Admin Panel →'}
                </button>
              </>
            )}
          </form>

          <p style={styles.footer}>
            {role === 'client'
              ? 'Session in progress? Contact the admin for assistance.'
              : 'Admin access is logged and monitored.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Small helper component ── */
const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div style={styles.field}>
    <label style={styles.label}>
      {icon}&nbsp;{label}
    </label>
    {children}
  </div>
);

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  scanlines: {
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '1.75rem',
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.4)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.6rem',
  },
  logoTitle: {
    fontSize: '1.7rem',
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: '#00d4ff',
    textShadow: '0 0 24px rgba(0,212,255,0.4)',
    margin: 0,
  },
  logoSub: {
    fontSize: '0.72rem',
    color: '#64748b',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontFamily: "'Share Tech Mono', monospace",
    marginTop: '0.25rem',
  },
  card: {
    background: '#0f1525',
    border: '1px solid #1e2d4a',
    borderRadius: 16,
    padding: '1.75rem',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    background: '#0a0e1a',
    borderRadius: 10,
    padding: 4,
    border: '1px solid #1e2d4a',
    marginBottom: '1.25rem',
  },
  tab: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid transparent',
    borderRadius: 8,
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabActiveClient: {
    background: 'rgba(0,212,255,0.1)',
    color: '#00d4ff',
    borderColor: 'rgba(0,212,255,0.3)',
  },
  tabActiveAdmin: {
    background: 'rgba(124,58,237,0.15)',
    color: '#a78bfa',
    borderColor: 'rgba(124,58,237,0.4)',
  },
  badgeClient: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    marginBottom: '1.25rem',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Share Tech Mono', monospace",
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.2)',
    color: '#00d4ff',
  },
  badgeAdmin: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    marginBottom: '1.25rem',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Share Tech Mono', monospace",
    background: 'rgba(124,58,237,0.1)',
    border: '1px solid rgba(124,58,237,0.35)',
    color: '#a78bfa',
  },
  dotClient: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00d4ff',
    flexShrink: 0,
  },
  dotAdmin: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#a78bfa',
    flexShrink: 0,
  },
  subTabs: {
    display: 'flex',
    gap: 6,
    marginBottom: '1.25rem',
  },
  subTab: {
    flex: 1,
    padding: '0.4rem',
    borderRadius: 6,
    fontSize: '0.75rem',
    fontFamily: "'Share Tech Mono', monospace",
    cursor: 'pointer',
    border: '1px solid #1e2d4a',
    background: 'transparent',
    color: '#64748b',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    letterSpacing: '0.05em',
  },
  subTabActive: {
    borderColor: 'rgba(0,212,255,0.4)',
    background: 'rgba(0,212,255,0.08)',
    color: '#00d4ff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.72rem',
    color: '#64748b',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.35rem',
    fontFamily: "'Share Tech Mono', monospace",
  },
  input: {
    width: '100%',
    padding: '0.65rem 1rem',
    background: '#0a0e1a',
    border: '1px solid #1e2d4a',
    borderRadius: 8,
    color: '#e2e8f0',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '0.7rem',
    color: '#4a5568',
    fontFamily: "'Share Tech Mono', monospace",
    marginTop: '0.3rem',
    letterSpacing: '0.05em',
  },
  warnBox: {
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8,
    padding: '0.55rem 0.85rem',
    marginBottom: '1rem',
    fontSize: '0.75rem',
    color: '#f59e0b',
    fontFamily: "'Share Tech Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '0.04em',
  },
  btn: {
    width: '100%',
    padding: '0.75rem',
    border: 'none',
    borderRadius: 8,
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '0.5rem',
    textTransform: 'uppercase' as const,
  },
  btnClient: {
    background: 'linear-gradient(90deg, #0284c7, #00d4ff)',
    color: '#0a0e1a',
  },
  btnAdmin: {
    background: 'linear-gradient(90deg, #5b21b6, #7c3aed)',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.25rem',
    fontSize: '0.7rem',
    color: '#374151',
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: '0.05em',
  },
};

export default Login;
