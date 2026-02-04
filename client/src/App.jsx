import { useState, useEffect } from 'react';
import './index.css';
import { api } from './api';
import { getCurrentUser, logout, initDemoData } from './mockBlockchain';
import StudentDashboard from './components/StudentDashboard';
import OrgDashboard from './components/OrgDashboard';

// Custom SVG Icons
const Icons = {
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shield-grad)" />
    </svg>
  ),
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Key: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 7l.5 1L15 10l1.5-1.5L18 10l-1.5 1.5L18 13l-1 1-2-2-1.5 1.5-2-2-1.5 1.5z" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
};

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [studentName, setStudentName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [activeRole, setActiveRole] = useState('student');
  const [notification, setNotification] = useState(null);
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    initDemoData();
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setRole(savedUser.role);
    }

    api.healthCheck().then(healthy => {
      setIsHealthy(healthy);
      if (!healthy) {
        showNotification('⚠️ Backend server is not reachable.', 'error');
      }
    });
  }, []);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAuth = async (selectedRole) => {
    const name = selectedRole === 'student' ? studentName : orgName;

    if (!name || !password) {
      showNotification('Please enter credentials', 'error');
      return;
    }

    try {
      if (isRegister) {
        await api.register(name, password, selectedRole);
        showNotification('Registration successful! Please login.', 'success');
        setIsRegister(false);
        setPassword('');
        return;
      } else {
        const response = await api.login(name, password, selectedRole);
        const authenticatedUser = response.user;
        localStorage.setItem('ssdc_current_user', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        setRole(selectedRole);
        showNotification('Login successful!', 'success');
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setRole(null);
    setPassword('');
    showNotification('Logged out successfully', 'success');
  };

  const handleBack = () => {
    setRole(null);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      {notification && (
        <div className="animate-fade" style={{
          position: 'fixed',
          top: '2.5rem',
          left: 0,
          width: '100%',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            padding: '1.25rem 2.5rem',
            background: notification.type === 'error' ? 'var(--error)' : 'var(--success)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '1rem',
            textAlign: 'center',
            letterSpacing: '0.025em',
            border: '2px solid rgba(255,255,255,0.2)',
            pointerEvents: 'auto',
            minWidth: '320px',
            maxWidth: '90%'
          }}>
            {notification.message}
          </div>
        </div>
      )}

      <header style={{
        padding: '3.5rem 0',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        marginBottom: '4rem'
      }}>
        <div /> {/* Left spacer */}
        <div
          onClick={handleBack}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            textAlign: 'center'
          }}
        >
          <h1 style={{
            margin: 0,
            fontSize: '5rem',
            letterSpacing: '0.15em',
            fontWeight: '900',
            lineHeight: 1
          }} className="text-gradient">
            DATA GUARD
          </h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
          {user && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--surface-light)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)'
              }}>
                <Icons.User />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700' }}>{user.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleLogout}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                <Icons.Logout />
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {!role ? (
          <section style={{ padding: '0 0 4rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
              gap: '6rem',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{
                  fontSize: '4.5rem',
                  color: 'var(--primary)',
                  letterSpacing: '0.05em',
                  fontWeight: '800',
                  margin: 0,
                  lineHeight: '1.1'
                }}>
                  Secure <br />
                  Credential <br />
                  System
                </h2>
                <div style={{ display: 'flex', gap: '3rem', marginTop: '3rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', fontSize: '1.5rem', margin: '0 0 0.25rem' }}>100%</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600' }}>Data Ownership</p>
                  </div>
                </div>
              </div>

              <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  background: 'var(--surface-light)',
                  padding: '4px',
                  borderRadius: '12px',
                  marginBottom: '2.5rem'
                }}>
                  <button
                    onClick={() => setActiveRole('student')}
                    style={{
                      flex: 1,
                      background: activeRole === 'student' ? 'var(--primary)' : 'transparent',
                      border: 'none',
                      color: activeRole === 'student' ? 'white' : 'var(--text-dim)',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}
                  >Student Portal</button>
                  <button
                    onClick={() => setActiveRole('org')}
                    style={{
                      flex: 1,
                      background: activeRole === 'org' ? 'var(--primary)' : 'transparent',
                      border: 'none',
                      color: activeRole === 'org' ? 'white' : 'var(--text-dim)',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}
                  >Organization</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <label>{activeRole === 'student' ? 'Full Name' : 'Organization Name'}</label>
                    <input
                      type="text"
                      value={activeRole === 'student' ? studentName : orgName}
                      onChange={(e) => activeRole === 'student' ? setStudentName(e.target.value) : setOrgName(e.target.value)}
                      placeholder={activeRole === 'student' ? "e.g. John Doe" : "e.g. Acme Corp"}
                    />
                  </div>

                  <div>
                    <label>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth(activeRole)}
                      placeholder="••••••••"
                    />
                  </div>

                  <button className="btn btn-primary" onClick={() => handleAuth(activeRole)} style={{ padding: '1rem' }}>
                    {isRegister ? 'Initialize Account' : 'Login'}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {isRegister ? 'Already verified?' : 'New to Data Guard?'}
                    </span>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        marginLeft: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => setIsRegister(!isRegister)}
                    >
                      {isRegister ? 'Sign In' : 'Create Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2.5rem',
              marginTop: '8rem'
            }}>
              {[
                { title: 'End-to-End Encryption', desc: 'Standard encryption for all document storage and transit.', icon: <Icons.Shield /> },
                { title: 'Granular Access', desc: 'You control exactly who sees what, with time-bound revocable permissions.', icon: <Icons.Lock /> },
                { title: 'Auditability', desc: 'Complete logs of all access requests and verifications stored on-chain.', icon: <Icons.FileText /> }
              ].map((item, i) => (
                <div key={i} className="glass glass-hover" style={{ padding: '2rem' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>{item.icon}</div>
                  <h4 style={{ marginBottom: '1rem' }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ) : role === 'student' ? (
          <StudentDashboard user={user} onBack={handleBack} onNotify={showNotification} />
        ) : role === 'org' ? (
          <OrgDashboard user={user} onBack={handleBack} onNotify={showNotification} />
        ) : (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <h2>System Error: Role "{role}" not recognized</h2>
            <button className="btn btn-primary" onClick={handleLogout}>Reset Session</button>
          </div>
        )}
      </main>

      <footer style={{
        padding: '3rem 0',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem', margin: 0, fontWeight: '600', letterSpacing: '0.05em' }}>
          Secure Credential Ecosystem
        </p>
      </footer>
    </div>
  );
}

export default App;
