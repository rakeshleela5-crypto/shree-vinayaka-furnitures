import React, { useState } from 'react';
import type { CompanyProfile, SupportedLanguage, UserRecord } from '../../types/retailDaddy';

interface LoginModalProps {
  isOpen: boolean;
  companies: CompanyProfile[];
  currentCompany: CompanyProfile;
  onSelectCompany: (company: CompanyProfile) => void;
  users: UserRecord[];
  onLoginSuccess: (user: UserRecord) => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenCreateCompany: () => void;
  onOpenChangePassword: () => void;
  onOpenUserControl: () => void;
  onOpenVirtualKeyboard: (focusedField: 'username' | 'password') => void;
  activeVirtualKey?: { char?: string; backspace?: boolean; clear?: boolean; enter?: boolean };
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  companies,
  currentCompany,
  onSelectCompany,
  users,
  onLoginSuccess,
  currentLanguage,
  onSelectLanguage,
  onOpenCreateCompany,
  onOpenChangePassword,
  onOpenUserControl,
  onOpenVirtualKeyboard,
  activeVirtualKey,
  onClose
}) => {
  const [userName, setUserName] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password'>('username');
  const [attempts, setAttempts] = useState<number>(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle virtual key input if passed down
  React.useEffect(() => {
    if (!activeVirtualKey) return;
    if (activeVirtualKey.char !== undefined) {
      if (activeInput === 'username') {
        setUserName(prev => prev + activeVirtualKey.char);
      } else {
        setPassword(prev => prev + activeVirtualKey.char);
      }
    } else if (activeVirtualKey.backspace) {
      if (activeInput === 'username') {
        setUserName(prev => prev.slice(0, -1));
      } else {
        setPassword(prev => prev.slice(0, -1));
      }
    } else if (activeVirtualKey.clear) {
      if (activeInput === 'username') {
        setUserName('');
      } else {
        setPassword('');
      }
    } else if (activeVirtualKey.enter) {
      handleLogin();
    }
  }, [activeVirtualKey]);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const user = users.find(
      u => u.userId.toLowerCase() === userName.trim().toLowerCase()
    );

    if (!user) {
      setErrorMessage('User Name does not exist!');
      setAttempts(prev => Math.max(0, prev - 1));
      return;
    }

    if (!user.isActive) {
      setErrorMessage('This user account is disabled / inactive.');
      return;
    }

    // Validate credentials: match user.password if configured, or standard role credentials
    const uid = user.userId.toLowerCase();
    const isStandardAdmin = (uid === 'admin' || uid === 'sadmin') && (password === 'admin' || password === 'admin123' || password === 'sadmin');
    const isStandardStaff = (uid === 'ashok' && password === '11') || ((uid === 'sm' || uid === 'moder') && password === '1234');
    const isLocalMatch = Boolean(user.password && user.password === password);

    if (!isLocalMatch && !isStandardAdmin && !isStandardStaff) {
      const remaining = attempts - 1;
      setAttempts(Math.max(0, remaining));
      setErrorMessage(`Invalid Password! Attempts remaining: ${Math.max(0, remaining)}`);
      return;
    }

    // Success
    setAttempts(3);
    setErrorMessage(null);
    onLoginSuccess(user);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      {/* Login Card Matching Video 11 Frame 0015 */}
      <div
        style={{
          width: '640px',
          maxWidth: '96vw',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.1)',
          position: 'relative',
          padding: '24px 28px 16px 28px',
          fontFamily: 'Segoe UI, Tahoma, sans-serif',
          userSelect: 'none'
        }}
      >
        {/* Top-Left Blue Ribbon Banner: "Good Morning, Welcome Back!" */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '6px 28px 6px 16px',
            fontSize: '12px',
            fontWeight: 'bold',
            fontStyle: 'italic',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          Good Morning, Welcome Back!
        </div>

        {/* Top-Right Language Dropdown Selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <select
            value={currentLanguage}
            onChange={e => onSelectLanguage(e.target.value as SupportedLanguage)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '3px',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="ENGLISH">ENGLISH</option>
            <option value="Bangla">Bangla</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Hindi">Hindi</option>
            <option value="Kannada">Kannada</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Marathi">Marathi</option>
            <option value="Oriya">Oriya</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Urdu">Urdu</option>
          </select>
        </div>

        {/* Main Content: Left Badge + Right Form Fields */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '24px' }}>
          {/* Left Column: 3D Gold Circular Shree Vinayaka Furnitures Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '210px',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '175px',
                height: '175px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #2a2a2a 0%, #000000 70%, #151515 100%)',
                border: '6px solid #d4af37',
                boxShadow: '0 0 0 2px #5a450c, inset 0 0 15px rgba(212,175,55,0.6), 0 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <div
                style={{
                  color: '#f59e0b',
                  fontSize: '13px',
                  fontFamily: "'Segoe UI', Georgia, serif",
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                SHREE VINAYAKA
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontFamily: "'Segoe UI', Tahoma, sans-serif",
                  fontWeight: '900',
                  letterSpacing: '1.5px',
                  lineHeight: '1.2',
                  marginTop: '2px',
                  textShadow: '0 2px 5px rgba(0,0,0,0.9)'
                }}
              >
                FURNITURES
              </div>
              <div
                style={{
                  color: '#d4af37',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  marginTop: '4px'
                }}
              >
                ENTERPRISE ERP
              </div>
            </div>
            <div
              style={{
                marginTop: '12px',
                color: '#0369a1',
                fontSize: '13px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              Shree Vinayaka Furnitures ERP
            </div>
          </div>

          {/* Right Column: Company Name, User Name, Password, Buttons */}
          <form onSubmit={handleLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMessage && (
              <div
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #f87171',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ⚠ {errorMessage}
              </div>
            )}

            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                Company Name :
              </label>
              <select
                value={currentCompany.name}
                onChange={e => {
                  const comp = companies.find(c => c.name === e.target.value);
                  if (comp) onSelectCompany(comp);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  backgroundColor: '#e2e8f0',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                User Name :
              </label>
              <input
                type="text"
                value={userName}
                onFocus={() => setActiveInput('username')}
                onChange={e => setUserName(e.target.value)}
                placeholder="Enter the User Name"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  fontSize: '13px',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                Password :
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onFocus={() => setActiveInput('password')}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  style={{
                    width: '100%',
                    padding: '7px 36px 7px 10px',
                    border: '1px solid #94a3b8',
                    borderRadius: '3px',
                    fontSize: '13px',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    fontSize: '15px',
                    cursor: 'pointer',
                    color: '#0284c7'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Big Pill Buttons: [ 👤 Login ] and [ Exit ⏻ ] matching Frame 0015 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(to bottom, #22c55e, #16a34a)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(22, 163, 74, 0.3)'
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    fontSize: '11px'
                  }}
                >
                  👤
                </span>
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  else if (confirm('Exit application?')) window.close();
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(to bottom, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)'
                }}
              >
                <span>Exit</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    fontSize: '11px'
                  }}
                >
                  ⏻
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer matching Frame 0015 & Frame 0316 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
            Attempt: {attempts}
          </div>

          {/* 4-Button Quick Utility Group in Blue Box matching Frame 0316 */}
          <div
            style={{
              display: 'flex',
              border: '1px solid #0284c7',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#f0f9ff'
            }}
          >
            {/* 1. Create Company */}
            <button
              type="button"
              onClick={onOpenCreateCompany}
              title="🏢 Create New Company / Database [Frame 0090]"
              style={{
                background: 'none',
                border: 'none',
                borderRight: '1px solid #bae6fd',
                padding: '6px 10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🏢
            </button>

            {/* 2. Change Password */}
            <button
              type="button"
              onClick={onOpenChangePassword}
              title="🔑 Change Password [Frame 0290]"
              style={{
                background: 'none',
                border: 'none',
                borderRight: '1px solid #bae6fd',
                padding: '6px 10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔑
            </button>

            {/* 3. User Control & Permissions */}
            <button
              type="button"
              onClick={onOpenUserControl}
              title="🔒 User Control & 51 Permissions [Frame 0065]"
              style={{
                background: 'none',
                border: 'none',
                borderRight: '1px solid #bae6fd',
                padding: '6px 10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔒
            </button>

            {/* 4. On-Screen Touch Virtual Keyboard */}
            <button
              type="button"
              onClick={() => onOpenVirtualKeyboard(activeInput)}
              title="⌨️ On-Screen Touch Virtual Keyboard [Frame 0315]"
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ⌨️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
