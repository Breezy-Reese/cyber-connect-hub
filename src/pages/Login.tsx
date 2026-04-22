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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminRememberMe, setAdminRememberMe] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    toast.success('Account created! You can now log in.');
    setRole('client');
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetSent(true);
    setLoading(false);
  };

  const accentColor = role === 'admin' ? '#7c3aed' : role === 'register' ? '#059669' : '#2563eb';
  const accentLight = role === 'admin' ? '#ede9fe' : role === 'register' ? '#d1fae5' : '#dbeafe';
  const accentMid = role === 'admin' ? '#8b5cf6' : role === 'register' ? '#10b981' : '#3b82f6';

  if (showForgot) {
    return (
      <div style={S.page}>
        <div style={S.bgDecor} />
        <div style={S.bgDecor2} />
        <div style={S.container}>
          <div style={S.brandRow}>
            <div style={{ ...S.brandIcon, background: '#dbeafe', borderColor: '#bfdbfe' }}>
              <Monitor size={22} color="#2563eb" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={S.brandName}>SHINESTAR</h1>
              <p style={S.brandSub}>Cyber Café Management</p>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ ...S.cardAccentBar, background: '#2563eb' }} />
            <button type="button" style={S.backBtn} onClick={() => { setShowForgot(false); setResetSent(false); }}>
              <ArrowLeft size={13} strokeWidth={2} />
              <span>Back to login</span>
            </button>
            <h2 style={S.sectionTitle}>Reset your password</h2>
            <p style={S.sectionSub}>Enter your registered email and we'll send you a reset link right away.</p>

            {resetSent ? (
              <div style={S.successBox}>
                <span style={S.successIcon}>✓</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#065f46', fontSize: '0.9rem' }}>Reset link sent!</p>
                  <p style={{ margin: 0, color: '#047857', fontSize: '0.8rem', marginTop: 2 }}>Check your inbox and follow the instructions.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={S.form}>
                <Field label="Email Address" icon={<Mail size={13} color="#94a3b8" />} accent="#2563eb">
                  <input type="email" required style={S.input} placeholder="you@example.com"
                    value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                </Field>
                <button type="submit" disabled={loading} style={{ ...S.submitBtn, background: '#2563eb', opacity: loading ? 0.6 : 1 }}>
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
    <div style={S.page}>
      <div style={S.bgDecor} />
      <div style={S.bgDecor2} />

      <div style={S.container}>
        {/* Brand */}
        <div style={S.brandRow}>
          <div style={{ ...S.brandIcon, background: accentLight, borderColor: `${accentColor}33` }}>
            <Monitor size={22} color={accentColor} strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ ...S.brandName, color: accentColor }}>{role === 'admin' ? 'SHINESTAR ADMIN' : 'SHINESTAR'}</h1>
            <p style={S.brandSub}>Cyber Café Management System</p>
          </div>
        </div>

        {/* Card */}
        <div style={S.card}>
          <div style={{ ...S.cardAccentBar, background: `linear-gradient(90deg, ${accentColor}, ${accentMid})` }} />

          {/* Role tabs */}
          <div style={S.tabs}>
            {([
              { key: 'client', icon: <Wifi size={13} strokeWidth={2} />, label: 'Client' },
              { key: 'register', icon: <UserPlus size={13} strokeWidth={2} />, label: 'Register' },
              { key: 'admin', icon: <Shield size={13} strokeWidth={2} />, label: 'Admin' },
            ] as const).map((t) => {
              const isActive = role === t.key;
              const tc = t.key === 'admin' ? '#7c3aed' : t.key === 'register' ? '#059669' : '#2563eb';
              const tl = t.key === 'admin' ? '#ede9fe' : t.key === 'register' ? '#d1fae5' : '#dbeafe';
              return (
                <button key={t.key} type="button" onClick={() => setRole(t.key)}
                  style={{
                    ...S.tab,
                    background: isActive ? tl : 'transparent',
                    color: isActive ? tc : '#94a3b8',
                    borderColor: isActive ? `${tc}55` : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                  {t.icon}&nbsp;{t.label}
                </button>
              );
            })}
          </div>

          {/* Badge */}
          <div style={{ ...S.badge, background: accentLight, borderColor: `${accentColor}33`, color: accentColor }}>
            <span style={{ ...S.badgeDot, background: accentColor }} />
            {role === 'client' && 'Client portal — public access'}
            {role === 'admin' && 'Admin panel — restricted access'}
            {role === 'register' && 'New account — create your profile'}
          </div>

          {/* ── CLIENT ── */}
          {role === 'client' && (
            <form onSubmit={handleSubmit} style={S.form}>
              <div style={S.subTabs}>
                {([
                  { key: 'password', icon: <KeyRound size={11} strokeWidth={2} />, label: 'Password' },
                  { key: 'ticket', icon: <Ticket size={11} strokeWidth={2} />, label: 'Ticket Code' },
                ] as const).map((t) => (
                  <button key={t.key} type="button" onClick={() => setLoginType(t.key)}
                    style={{
                      ...S.subTab,
                      background: loginType === t.key ? '#dbeafe' : '#f8fafc',
                      color: loginType === t.key ? '#2563eb' : '#94a3b8',
                      borderColor: loginType === t.key ? '#bfdbfe' : '#e2e8f0',
                      fontWeight: loginType === t.key ? 600 : 400,
                    }}>
                    {t.icon}&nbsp;{t.label}
                  </button>
                ))}
              </div>

              {loginType === 'password' ? (
                <>
                  <Field label="Username" icon={<User size={13} color="#94a3b8" />} accent="#2563eb">
                    <input type="text" required style={S.input} placeholder="Enter your username"
                      value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                  </Field>
                  <Field label="Password" icon={<Lock size={13} color="#94a3b8" />} accent="#2563eb">
                    <div style={S.inputWrap}>
                      <input type={showPassword ? 'text' : 'password'} required
                        style={{ ...S.input, paddingRight: '2.8rem' }} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                      <button type="button" style={S.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                      </button>
                    </div>
                  </Field>
                  <div style={S.rememberRow}>
                    <label style={S.rememberLabel}>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#2563eb', width: 14, height: 14 }} />
                      <span>Remember me</span>
                    </label>
                    <button type="button" style={{ ...S.forgotBtn, color: '#2563eb' }} onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </button>
                  </div>
                </>
              ) : (
                <Field label="Ticket Code" icon={<Ticket size={13} color="#94a3b8" />} accent="#2563eb">
                  <input type="text" required style={{ ...S.input, letterSpacing: '0.15em', fontWeight: 600 }}
                    placeholder="e.g. TKT-A3F9" value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())} />
                  <p style={S.hint}>Enter the code printed on your session ticket</p>
                </Field>
              )}

              <button type="submit" disabled={loading}
                style={{ ...S.submitBtn, background: '#2563eb', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Connecting...' : 'Start Session →'}
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {role === 'register' && (
            <form onSubmit={handleRegister} style={S.form}>
              <div style={S.twoCol}>
                <Field label="Username" icon={<User size={13} color="#94a3b8" />} accent="#059669">
                  <input type="text" required style={S.input} placeholder="Choose a username"
                    value={regUsername} onChange={(e) => setRegUsername(e.target.value)} autoComplete="username" />
                </Field>
                <Field label="Email Address" icon={<Mail size={13} color="#94a3b8" />} accent="#059669">
                  <input type="email" required style={S.input} placeholder="you@example.com"
                    value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="email" />
                </Field>
              </div>
              <Field label="Password" icon={<Lock size={13} color="#94a3b8" />} accent="#059669">
                <div style={S.inputWrap}>
                  <input type={showRegPassword ? 'text' : 'password'} required
                    style={{ ...S.input, paddingRight: '2.8rem' }} placeholder="••••••••"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowRegPassword(!showRegPassword)}>
                    {showRegPassword ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" icon={<Lock size={13} color="#94a3b8" />} accent="#059669">
                <div style={S.inputWrap}>
                  <input type={showRegConfirm ? 'text' : 'password'} required
                    style={{ ...S.input, paddingRight: '2.8rem' }} placeholder="••••••••"
                    value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowRegConfirm(!showRegConfirm)}>
                    {showRegConfirm ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                  </button>
                </div>
              </Field>

              {/* Password match indicator */}
              {regConfirmPassword.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem',
                  fontSize: '0.75rem', fontFamily: "'DM Mono', monospace",
                  color: regPassword === regConfirmPassword ? '#059669' : '#dc2626',
                }}>
                  <span>{regPassword === regConfirmPassword ? '✓' : '✗'}</span>
                  {regPassword === regConfirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ ...S.submitBtn, background: '#059669', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>
          )}

          {/* ── ADMIN ── */}
          {role === 'admin' && (
            <form onSubmit={handleSubmit} style={S.form}>
              <div style={S.warnBox}>
                <AlertTriangle size={14} color="#d97706" strokeWidth={2} />
                <span>Authorized personnel only. All access is logged and monitored.</span>
              </div>
              <Field label="Admin Username" icon={<User size={13} color="#94a3b8" />} accent="#7c3aed">
                <input type="text" required style={S.input} placeholder="Enter admin username"
                  value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} autoComplete="username" />
              </Field>
              <Field label="Password" icon={<Lock size={13} color="#94a3b8" />} accent="#7c3aed">
                <div style={S.inputWrap}>
                  <input type={showAdminPassword ? 'text' : 'password'} required
                    style={{ ...S.input, paddingRight: '2.8rem' }} placeholder="••••••••"
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowAdminPassword(!showAdminPassword)}>
                    {showAdminPassword ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                  </button>
                </div>
              </Field>
              <div style={S.rememberRow}>
                <label style={S.rememberLabel}>
                  <input type="checkbox" checked={adminRememberMe} onChange={(e) => setAdminRememberMe(e.target.checked)}
                    style={{ accentColor: '#7c3aed', width: 14, height: 14 }} />
                  <span>Remember me</span>
                </label>
              </div>
              <button type="submit" disabled={loading}
                style={{ ...S.submitBtn, background: '#7c3aed', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Verifying...' : 'Access Admin Panel →'}
              </button>
            </form>
          )}

          <p style={S.footer}>
            {role === 'client' && 'Need help? Contact the admin at the front desk.'}
            {role === 'admin' && 'Admin access is logged and monitored at all times.'}
            {role === 'register' && 'Already have an account? Switch to Client Login above.'}
          </p>
        </div>

        <p style={S.copyright}>© {new Date().getFullYear()} Shinestar Cyber Café · All rights reserved</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        button { transition: all 0.18s ease; }
        button:hover:not(:disabled) { filter: brightness(0.95); transform: translateY(-1px); }
        button:active:not(:disabled) { transform: translateY(0); }
        input:focus { border-color: currentColor !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
      `}</style>
    </div>
  );
};

/* ── Field helper ── */
const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; accent: string }> = ({ label, icon, children, accent }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.08em',
      textTransform: 'uppercase', marginBottom: '0.4rem',
      fontFamily: "'DM Mono', monospace", fontWeight: 500,
    }}>
      {icon}&nbsp;{label}
    </label>
    <div style={{ position: 'relative' }}>
      {React.cloneElement(children as React.ReactElement, {
        style: {
          ...(children as React.ReactElement).props.style,
          // pass accent color as CSS variable for focus ring
          ['--accent' as string]: accent,
        }
      })}
    </div>
  </div>
);

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0fdf4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1.5rem 1rem',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: '#0f172a',
    position: 'relative', overflow: 'hidden',
  },
  bgDecor: {
    position: 'fixed', top: '-20%', right: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'fixed', bottom: '-15%', left: '-8%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%', maxWidth: 460,
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
  },
  brandRow: {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    padding: '0 0.25rem',
  },
  brandIcon: {
    width: 46, height: 46, borderRadius: 12, border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  brandName: {
    fontSize: '1.35rem', fontWeight: 600, letterSpacing: '0.12em',
    margin: 0, fontFamily: "'DM Mono', monospace",
  },
  brandSub: {
    fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.06em',
    margin: 0, fontFamily: "'DM Mono', monospace",
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e8edf5',
    borderRadius: 20,
    padding: '2rem',
    boxShadow: '0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderRadius: '20px 20px 0 0',
  },
  tabs: {
    display: 'flex', gap: 4,
    background: '#f8fafc', borderRadius: 12, padding: 4,
    border: '1px solid #e8edf5', marginBottom: '1.25rem',
  },
  tab: {
    flex: 1, padding: '0.5rem 0.25rem',
    border: '1.5px solid', borderRadius: 9,
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
    letterSpacing: '0.02em', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: 'all 0.18s ease',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0.5rem 0.85rem', borderRadius: 10,
    marginBottom: '1.25rem', fontSize: '0.72rem',
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    fontFamily: "'DM Mono', monospace", border: '1px solid',
    fontWeight: 500,
  },
  badgeDot: {
    display: 'inline-block', width: 6, height: 6,
    borderRadius: '50%', flexShrink: 0,
  },
  subTabs: {
    display: 'flex', gap: 6, marginBottom: '1.25rem',
  },
  subTab: {
    flex: 1, padding: '0.45rem', borderRadius: 8,
    fontSize: '0.75rem', fontFamily: "'DM Mono', monospace",
    cursor: 'pointer', border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    letterSpacing: '0.04em', transition: 'all 0.18s ease',
  },
  form: { display: 'flex', flexDirection: 'column' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' },
  input: {
    width: '100%', padding: '0.65rem 0.9rem',
    background: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: 10, color: '#0f172a',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.18s, box-shadow 0.18s',
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute', right: 10, background: 'none',
    border: 'none', cursor: 'pointer', padding: 4,
    display: 'flex', alignItems: 'center',
  },
  rememberRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  rememberLabel: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: '0.8rem', color: '#64748b', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  forgotBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif",
    textDecoration: 'underline', textUnderlineOffset: 2,
    padding: 0,
  },
  hint: {
    fontSize: '0.72rem', color: '#94a3b8',
    fontFamily: "'DM Mono', monospace", marginTop: '0.35rem',
    letterSpacing: '0.03em',
  },
  warnBox: {
    background: '#fffbeb', border: '1.5px solid #fde68a',
    borderRadius: 10, padding: '0.6rem 0.9rem', marginBottom: '1rem',
    fontSize: '0.78rem', color: '#92400e',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', gap: 8,
  },
  submitBtn: {
    width: '100%', padding: '0.8rem',
    border: 'none', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '0.04em', cursor: 'pointer',
    color: '#ffffff', marginTop: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    transition: 'all 0.18s ease',
  },
  footer: {
    textAlign: 'center', marginTop: '1.25rem',
    fontSize: '0.73rem', color: '#94a3b8',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.02em',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#64748b',
    cursor: 'pointer', fontSize: '0.8rem', marginBottom: '1.25rem',
    display: 'flex', alignItems: 'center', gap: 5,
    fontFamily: "'DM Sans', sans-serif", padding: 0,
  },
  sectionTitle: {
    fontSize: '1.15rem', fontWeight: 600, color: '#0f172a',
    letterSpacing: '0.01em', marginBottom: '0.3rem', marginTop: 0,
  },
  sectionSub: {
    fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem',
    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6,
  },
  successBox: {
    background: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: 10, padding: '0.9rem 1rem',
    display: 'flex', alignItems: 'flex-start', gap: 10,
  },
  successIcon: {
    width: 24, height: 24, borderRadius: '50%',
    background: '#dcfce7', border: '1.5px solid #86efac',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', color: '#16a34a', fontWeight: 700,
    flexShrink: 0,
  },
  copyright: {
    textAlign: 'center', fontSize: '0.68rem',
    color: '#cbd5e1', fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.04em',
  },
};

export default Login;
