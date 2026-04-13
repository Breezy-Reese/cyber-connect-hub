// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Monitor, Shield, Ticket, KeyRound, User, Lock,
  AlertTriangle, Wifi, Mail, Eye, EyeOff, UserPlus, ArrowLeft,
} from 'lucide-react';

type Role = 'client' | 'admin' | 'register';
type LoginType = 'password' | 'ticket';

const Login: React.FC = () => {
  const [role, setRole] = useState<Role>('client');
  const [loginType, setLoginType] = useState<LoginType>('password');

  // Client login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  // Admin login
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminRememberMe, setAdminRememberMe] = useState(false);

  // Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let credentials: Record<string, string> = {};

    if (role === 'admin') {
      credentials = { username: adminUsername, password: adminPassword, loginType: 'password', role: 'admin' };
    } else if (loginType === 'password') {
      credentials = { username, password, loginType: 'password', role: 'client' };
    } else {
      credentials = { ticketCode, loginType: 'ticket', role: 'client' };
    }

    const result = await login(credentials);

    if (result.success) {
      toast.success('Login successful!');
      navigate(result.user?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  // ── Register submit ───────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    // TODO: call your register API here
    toast.success('Account created! You can now log in.');
    setRole('client');
    setLoading(false);
  };

  // ── Forgot password submit ────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: call your password-reset API here
    setResetSent(true);
    setLoading(false);
  };

  // ── Forgot password overlay ───────────────────────────────────────────────
  if (showForgot) {
    return (
      <div style={styles.page}>
        <div style={styles.scanlines} />
        <div style={styles.container}>
          <div style={styles.logoWrap}>
            <div style={styles.logoIcon}><Monitor size={26} color="#00d4ff" strokeWidth={1.5} /></div>
            <h1 style={styles.logoTitle}>SHINESTAR</h1>
            <p style={styles.logoSub}>Cyber Café Management System</p>
          </div>
          <div style={styles.card}>
            <div style={styles.cardGlow} />
            <button type="button" style={styles.backBtn} onClick={() => { setShowForgot(false); setResetSent(false); }}>
              <ArrowLeft size={14} /> Back to login
            </button>
            <h2 style={styles.fpTitle}>Reset Password</h2>
            <p style={styles.fpSub}>Enter your registered email and we'll send you a reset link.</p>

            {resetSent ? (
              <div style={styles.successBox}>
                ✓ Reset link sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={styles.form}>
                <Field label="Email Address" icon={<Mail size={14} />}>
                  <input
                    type="email" required style={styles.input}
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </Field>
                <button type="submit" disabled={loading} style={{ ...styles.btn, ...styles.btnClient, ...(loading ? styles.btnDisabled : {}) }}>
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.scanlines} />
      <div style={styles.container}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}><Monitor size={26} color="#00d4ff" strokeWidth={1.5} /></div>
          <h1 style={styles.logoTitle}>SHINESTAR</h1>
          <p style={styles.logoSub}>Cyber Café Management System</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardGlow} />

          {/* Role tabs */}
          <div style={styles.tabs}>
            <button type="button" onClick={() => setRole('client')}
              style={{ ...styles.tab, ...(role === 'client' ? styles.tabActiveClient : {}) }}>
              <Wifi size={13} />&nbsp;Client
            </button>
            <button type="button" onClick={() => setRole('register')}
              style={{ ...styles.tab, ...(role === 'register' ? styles.tabActiveReg : {}) }}>
              <UserPlus size={13} />&nbsp;Register
            </button>
            <button type="button" onClick={() => setRole('admin')}
              style={{ ...styles.tab, ...(role === 'admin' ? styles.tabActiveAdmin : {}) }}>
              <Shield size={13} />&nbsp;Admin
            </button>
          </div>

          {/* Mode badge */}
          {role === 'client' && (
            <div style={styles.badgeClient}>
              <span style={styles.dotClient} />
              Client portal — public access
            </div>
          )}
          {role === 'admin' && (
            <div style={styles.badgeAdmin}>
              <span style={styles.dotAdmin} />
              Admin panel — restricted access
            </div>
          )}
          {role === 'register' && (
            <div style={styles.badgeReg}>
              <span style={styles.dotReg} />
              New account — create your profile
            </div>
          )}

          {/* ── CLIENT ── */}
          {role === 'client' && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.subTabs}>
                <button type="button" onClick={() => setLoginType('password')}
                  style={{ ...styles.subTab, ...(loginType === 'password' ? styles.subTabActive : {}) }}>
                  <KeyRound size={11} /> Password
                </button>
                <button type="button" onClick={() => setLoginType('ticket')}
                  style={{ ...styles.subTab, ...(loginType === 'ticket' ? styles.subTabActive : {}) }}>
                  <Ticket size={11} /> Ticket Code
                </button>
              </div>

              {loginType === 'password' ? (
                <>
                  <Field label="Username" icon={<User size={14} />}>
                    <input type="text" required style={styles.input} placeholder="Enter username"
                      value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                  </Field>
                  <Field label="Password" icon={<Lock size={14} />}>
                    <div style={styles.inputWrap}>
                      <input
                        type={showPassword ? 'text' : 'password'} required
                        style={{ ...styles.input, paddingRight: '2.5rem' }}
                        placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  <div style={styles.rememberRow}>
                    <label style={styles.rememberLabel}>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      &nbsp;Remember me
                    </label>
                    <button type="button" style={styles.forgotBtn} onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </button>
                  </div>
                </>
              ) : (
                <Field label="Ticket Code" icon={<Ticket size={14} />}>
                  <input type="text" required style={styles.input} placeholder="e.g. TKT-A3F9"
                    value={ticketCode} onChange={(e) => setTicketCode(e.target.value.toUpperCase())} />
                  <p style={styles.hint}>Enter the code printed on your session ticket</p>
                </Field>
              )}

              <button type="submit" disabled={loading}
                style={{ ...styles.btn, ...styles.btnClient, ...(loading ? styles.btnDisabled : {}) }}>
                {loading ? 'Connecting...' : 'Start Session →'}
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {role === 'register' && (
            <form onSubmit={handleRegister} style={styles.form}>
              <Field label="Username" icon={<User size={14} />}>
                <input type="text" required style={styles.input} placeholder="Choose a username"
                  value={regUsername} onChange={(e) => setRegUsername(e.target.value)} autoComplete="username" />
              </Field>
              <Field label="Email Address" icon={<Mail size={14} />}>
                <input type="email" required style={styles.input} placeholder="you@example.com"
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Password" icon={<Lock size={14} />}>
                <div style={styles.inputWrap}>
                  <input
                    type={showRegPassword ? 'text' : 'password'} required
                    style={{ ...styles.input, paddingRight: '2.5rem' }}
                    placeholder="••••••••" value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)} autoComplete="new-password"
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowRegPassword(!showRegPassword)}>
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" icon={<Lock size={14} />}>
                <div style={styles.inputWrap}>
                  <input
                    type={showRegConfirm ? 'text' : 'password'} required
                    style={{ ...styles.input, paddingRight: '2.5rem' }}
                    placeholder="••••••••" value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)} autoComplete="new-password"
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowRegConfirm(!showRegConfirm)}>
                    {showRegConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <button type="submit" disabled={loading}
                style={{ ...styles.btn, ...styles.btnReg, ...(loading ? styles.btnDisabled : {}) }}>
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>
          )}

          {/* ── ADMIN ── */}
          {role === 'admin' && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.warnBox}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span>Authorized personnel only. Access is logged.</span>
              </div>
              <Field label="Admin Username" icon={<User size={14} />}>
                <input type="text" required style={styles.input} placeholder="admin"
                  value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} autoComplete="username" />
              </Field>
              <Field label="Password" icon={<Lock size={14} />}>
                <div style={styles.inputWrap}>
                  <input
                    type={showAdminPassword ? 'text' : 'password'} required
                    style={{ ...styles.input, paddingRight: '2.5rem' }}
                    placeholder="••••••••" value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)} autoComplete="current-password"
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowAdminPassword(!showAdminPassword)}>
                    {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <div style={styles.rememberRow}>
                <label style={styles.rememberLabel}>
                  <input type="checkbox" checked={adminRememberMe} onChange={(e) => setAdminRememberMe(e.target.checked)} />
                  &nbsp;Remember me
                </label>
              </div>
              <button type="submit" disabled={loading}
                style={{ ...styles.btn, ...styles.btnAdmin, ...(loading ? styles.btnDisabled : {}) }}>
                {loading ? 'Verifying...' : 'Access Admin Panel →'}
              </button>
            </form>
          )}

          <p style={styles.footer}>
            {role === 'client' && 'Session in progress? Contact the admin for assistance.'}
            {role === 'admin' && 'Admin access is logged and monitored.'}
            {role === 'register' && 'Already have an account? Switch to Client Login.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Field helper ── */
const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div style={styles.field}>
    <label style={styles.label}>{icon}&nbsp;{label}</label>
    {children}
  </div>
);

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
    position: 'relative', overflow: 'hidden',
  },
  scanlines: {
    position: 'fixed', inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)',
    pointerEvents: 'none', zIndex: 0,
  },
  container: { width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 },
  logoWrap: { textAlign: 'center', marginBottom: '1.75rem' },
  logoIcon: {
    width: 52, height: 52, borderRadius: 12,
    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.4)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem',
  },
  logoTitle: { fontSize: '1.7rem', fontWeight: 600, letterSpacing: '0.15em', color: '#00d4ff', textShadow: '0 0 24px rgba(0,212,255,0.4)', margin: 0 },
  logoSub: { fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono', monospace", marginTop: '0.25rem' },
  card: { background: '#0f1525', border: '1px solid #1e2d4a', borderRadius: 16, padding: '1.75rem', position: 'relative', overflow: 'hidden' },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)' },
  tabs: { display: 'flex', gap: 6, background: '#0a0e1a', borderRadius: 10, padding: 4, border: '1px solid #1e2d4a', marginBottom: '1.25rem' },
  tab: {
    flex: 1, padding: '0.5rem',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent', borderRadius: 8,
    fontFamily: "'Rajdhani', sans-serif", fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.05em',
    cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  tabActiveClient: { background: 'rgba(0,212,255,0.1)',    color: '#00d4ff', borderColor: 'rgba(0,212,255,0.3)' },
  tabActiveAdmin:  { background: 'rgba(124,58,237,0.15)',  color: '#a78bfa', borderColor: 'rgba(124,58,237,0.4)' },
  tabActiveReg:    { background: 'rgba(16,185,129,0.12)',  color: '#34d399', borderColor: 'rgba(16,185,129,0.35)' },
  badgeClient: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.9rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: "'Share Tech Mono', monospace", background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' },
  badgeAdmin:  { display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.9rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: "'Share Tech Mono', monospace", background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' },
  badgeReg:    { display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.9rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: "'Share Tech Mono', monospace", background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' },
  dotClient: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', flexShrink: 0 },
  dotAdmin:  { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 },
  dotReg:    { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 },
  subTabs: { display: 'flex', gap: 6, marginBottom: '1.25rem' },
  subTab: { flex: 1, padding: '0.4rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: "'Share Tech Mono', monospace", cursor: 'pointer', borderWidth: '1px', borderStyle: 'solid', borderColor: '#1e2d4a', background: 'transparent', color: '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, letterSpacing: '0.05em' },
  subTabActive: { borderColor: 'rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.08)', color: '#00d4ff' },
  form: { display: 'flex', flexDirection: 'column' },
  field: { marginBottom: '1rem' },
  label: { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '0.35rem', fontFamily: "'Share Tech Mono', monospace" },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: { width: '100%', padding: '0.65rem 1rem', background: '#0a0e1a', border: '1px solid #1e2d4a', borderRadius: 8, color: '#e2e8f0', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' },
  eyeBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex', alignItems: 'center' },
  rememberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' },
  rememberLabel: { display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.05em' },
  forgotBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#00d4ff', fontSize: '0.75rem', fontFamily: "'Share Tech Mono', monospace", textDecoration: 'underline', textUnderlineOffset: 2 },
  hint: { fontSize: '0.7rem', color: '#4a5568', fontFamily: "'Share Tech Mono', monospace", marginTop: '0.3rem', letterSpacing: '0.05em' },
  warnBox: { background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '0.55rem 0.85rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#f59e0b', fontFamily: "'Share Tech Mono', monospace", display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.04em' },
  btn: { width: '100%', padding: '0.75rem', border: 'none', borderRadius: 8, fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem', textTransform: 'uppercase' as const },
  btnClient: { background: 'linear-gradient(90deg, #0284c7, #00d4ff)', color: '#0a0e1a' },
  btnAdmin:  { background: 'linear-gradient(90deg, #5b21b6, #7c3aed)', color: '#fff' },
  btnReg:    { background: 'linear-gradient(90deg, #065f46, #10b981)', color: '#fff' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  footer: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.7rem', color: '#374151', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.05em' },
  // Forgot password styles
  backBtn: { background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '0.78rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Share Tech Mono', monospace" },
  fpTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.05em', marginBottom: '0.3rem' },
  fpSub: { fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem', fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.5 },
  successBox: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#34d399', fontFamily: "'Share Tech Mono', monospace', marginTop: '0.75rem" },
};

export default Login;
