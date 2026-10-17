import React, { useState, useEffect } from 'react';
import type { EmailConfig } from '../../types/retailDaddy';
import { fetchEmailConfig, saveEmailConfig, testSmtpConnection } from '../../api/client';

interface EmailSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmailConfig;
  onSaveConfig?: (config: EmailConfig) => void;
  onSave?: (config: EmailConfig) => void;
}

export const EmailSettingModal: React.FC<EmailSettingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSave
}) => {
  if (!isOpen) return null;

  const [serverName, setServerName] = useState<EmailConfig['serverName']>(config.serverName || 'Gmail');
  const [smtpAddress, setSmtpAddress] = useState<string>(config.smtpAddress || 'smtp.gmail.com');
  const [emailId, setEmailId] = useState<string>(
    config.emailId && !config.emailId.includes('raintech')
      ? config.emailId
      : 'shreevinayakafurnitures@gmail.com'
  );
  const [password, setPassword] = useState<string>(config.password || '');
  const [port, setPort] = useState<number>(config.port || 587);
  const [tlsSslRequired, setTlsSslRequired] = useState<'Yes' | 'No'>(config.tlsSslRequired || 'Yes');
  const [isDefault, setIsDefault] = useState<boolean>(config.isDefault ?? true);
  const [isEnabled, setIsEnabled] = useState<boolean>(config.isEnabled ?? true);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showGmailHelp, setShowGmailHelp] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync with backend on open
  useEffect(() => {
    let active = true;
    const loadBackendConfig = async () => {
      try {
        const backendData = await fetchEmailConfig();
        if (backendData && active) {
          if (backendData.server_name) setServerName(backendData.server_name as any);
          if (backendData.smtp_address) setSmtpAddress(backendData.smtp_address);
          if (backendData.email_id) setEmailId(backendData.email_id);
          if (backendData.port) setPort(backendData.port);
          if (backendData.tls_ssl_required) setTlsSslRequired(backendData.tls_ssl_required as any);
          if (backendData.is_default !== undefined) setIsDefault(backendData.is_default);
          if (backendData.is_enabled !== undefined) setIsEnabled(backendData.is_enabled);
          if (backendData.has_password && !password) {
            setPassword('••••••••••••');
          }
        }
      } catch (e) {
        console.warn('Using local email config:', e);
      }
    };
    loadBackendConfig();
    return () => { active = false; };
  }, [isOpen]);

  const handleServerChange = (val: EmailConfig['serverName']) => {
    setServerName(val);
    if (val === 'Gmail') {
      setSmtpAddress('smtp.gmail.com');
      setPort(587);
      setTlsSslRequired('Yes');
    } else if (val === 'Yahoo') {
      setSmtpAddress('smtp.mail.yahoo.com');
      setPort(465);
      setTlsSslRequired('Yes');
    } else if (val === 'Rediffmail') {
      setSmtpAddress('smtp.rediffmail.com');
      setPort(25);
      setTlsSslRequired('No');
    } else if (val === 'Hotmail(Outlook)') {
      setSmtpAddress('smtp.live.com');
      setPort(587);
      setTlsSslRequired('Yes');
    }
  };

  const handleTestConnection = async () => {
    if (!emailId.trim()) {
      showToast('Please enter an Email ID.', 'error');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter your password / Google App Password.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSmtpConnection({
        serverName,
        smtpAddress,
        emailId,
        password,
        port,
        tlsSslRequired
      });

      setTestResult(res);
      if (res.success) {
        showToast('✓ SMTP Connection & Login Successful!', 'success');
      } else {
        showToast('⚠️ SMTP Connection Test Failed. See details below.', 'error');
        if (serverName === 'Gmail' || emailId.includes('gmail.com')) {
          setShowGmailHelp(true);
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection.'
      });
      showToast('Connection test failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updated: EmailConfig = {
      serverName,
      smtpAddress,
      emailId,
      password,
      port,
      tlsSslRequired,
      isDefault,
      isEnabled
    };

    try {
      await saveEmailConfig({
        serverName,
        smtpAddress,
        emailId,
        password,
        port,
        tlsSslRequired,
        isDefault,
        isEnabled,
        senderName: 'Shree Vinayaka Furnitures'
      });
      localStorage.setItem('rd_email_config', JSON.stringify(updated));
      if (onSave) onSave(updated);
      if (onSaveConfig) onSaveConfig(updated);
      showToast('✓ Email Settings Saved to Database & Local Cache!', 'success');
      setTimeout(() => onClose(), 900);
    } catch (err: any) {
      console.error('Error saving email config:', err);
      // Fallback local save if offline
      localStorage.setItem('rd_email_config', JSON.stringify(updated));
      if (onSave) onSave(updated);
      if (onSaveConfig) onSaveConfig(updated);
      showToast('✓ Email Settings Saved locally!', 'success');
      setTimeout(() => onClose(), 900);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '780px',
          maxWidth: '96vw',
          backgroundColor: '#f1f5f9',
          border: '2px solid #1e40af',
          borderRadius: '4px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Title Bar matching Frame 0108 */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
            color: '#ffffff',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          <span>Email & SMTP Settings</span>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '1px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {toast && (
          <div
            style={{
              padding: '7px 12px',
              backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Header Strip */}
        <div
          style={{
            background: '#1d4ed8',
            color: '#ffffff',
            textAlign: 'center',
            padding: '6px',
            fontWeight: 'bold',
            fontSize: '13px',
            letterSpacing: '0.3px'
          }}
        >
          Email & Gmail SMTP Dispatch Configuration
        </div>

        {/* Main Body Form */}
        <div style={{ padding: '14px 18px', display: 'flex', gap: '16px', background: '#ffffff' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Server Name :</span>
              <select
                value={serverName}
                onChange={e => handleServerChange(e.target.value as any)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', backgroundColor: '#bae6fd', fontWeight: 600 }}
              >
                <option value="Gmail">GMail (smtp.gmail.com)</option>
                <option value="Yahoo">Yahoo (smtp.mail.yahoo.com)</option>
                <option value="Rediffmail">Rediffmail (smtp.rediffmail.com)</option>
                <option value="Hotmail(Outlook)">Hotmail/Outlook (smtp.live.com)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>SMTP Address :</span>
              <input
                type="text"
                value={smtpAddress}
                onChange={e => setSmtpAddress(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Email ID :</span>
              <input
                type="text"
                value={emailId}
                placeholder="e.g. shreevinayakafurnitures@gmail.com"
                onChange={e => setEmailId(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>
                Password / App Key :
              </span>
              <input
                type="password"
                value={password}
                placeholder="16-character Google App Password"
                onChange={e => setPassword(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Port :</span>
              <input
                type="number"
                value={port}
                onChange={e => setPort(parseInt(e.target.value) || 587)}
                style={{ width: '90px', border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
              <span style={{ fontSize: '10px', color: '#64748b' }}>(Default: 587 for TLS, 465 for SSL)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>TLS/SSL Required :</span>
              <select
                value={tlsSslRequired}
                onChange={e => setTlsSslRequired(e.target.value as any)}
                style={{ width: '90px', border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px' }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginLeft: '138px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>IsDefault</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={e => setIsEnabled(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>IsEnabled</span>
              </label>

              <button
                type="button"
                onClick={() => setShowGmailHelp(!showGmailHelp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {showGmailHelp ? 'Hide Gmail Instructions' : 'ℹ️ How to set up Gmail'}
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {/* Real SMTP Connection Test Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              style={{
                background: isTesting ? '#94a3b8' : 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '7px 8px',
                borderRadius: '3px',
                border: 'none',
                cursor: isTesting ? 'wait' : 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              {isTesting ? 'Testing...' : '⚡ Test Connection'}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmailId('');
                setPassword('');
                setTestResult(null);
              }}
              style={{
                background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              New
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: isSaving ? '#94a3b8' : 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: isSaving ? 'wait' : 'pointer',
                fontSize: '11px'
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Update
            </button>
            <button
              type="button"
              disabled
              style={{
                background: '#cbd5e1',
                color: '#94a3b8',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'not-allowed',
                fontSize: '11px'
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Live Test Results Banner */}
        {testResult && (
          <div
            style={{
              margin: '0 16px 8px 16px',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: '1.4',
              backgroundColor: testResult.success ? '#dcfce7' : '#fef2f2',
              border: `1px solid ${testResult.success ? '#86efac' : '#fecaca'}`,
              color: testResult.success ? '#166534' : '#991b1b'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{testResult.success ? '✓ SMTP Handshake Passed!' : '⚠️ Connection / Authentication Failed:'}</span>
            </div>
            <div>{testResult.message}</div>
          </div>
        )}

        {/* Google App Password Guide (When toggled or on fail) */}
        {showGmailHelp && (
          <div
            style={{
              margin: '0 16px 8px 16px',
              padding: '10px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#1e3a8a'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>
              🔑 Quick Steps to Connect Gmail (Google 2-Step Verification):
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.5' }}>
              <li>
                Open your Google Account: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>myaccount.google.com/security</a>
              </li>
              <li>Ensure <b>2-Step Verification</b> is turned <b>ON</b>.</li>
              <li>
                Visit the Google App Passwords page: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>myaccount.google.com/apppasswords</a>
              </li>
              <li>Type an App name like <b>"Shree Vinayaka POS"</b> and click <b>Create</b>.</li>
              <li>Copy the generated <b>16-character code</b> (e.g. <code>abcd efgh ijkl mnop</code>) and paste it into the <b>Password</b> field above!</li>
            </ol>
          </div>
        )}

        {/* Bottom Table matching Frame 0108 (Orange header #ea580c) */}
        <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#ea580c', color: '#ffffff' }}>
                <th style={{ padding: '4px', textAlign: 'left' }}>Server Name</th>
                <th style={{ padding: '4px', textAlign: 'left' }}>SMTP Address</th>
                <th style={{ padding: '4px', textAlign: 'left' }}>Email ID</th>
                <th style={{ padding: '4px', width: '50px', textAlign: 'center' }}>Port</th>
                <th style={{ padding: '4px', width: '70px', textAlign: 'center' }}>TLS/SSL</th>
                <th style={{ padding: '4px', width: '60px', textAlign: 'center' }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '5px 4px', fontWeight: 'bold' }}>{serverName}</td>
                <td style={{ padding: '5px 4px' }}>{smtpAddress}</td>
                <td style={{ padding: '5px 4px', color: '#1e40af', fontWeight: 600 }}>{emailId}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{port}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{tlsSslRequired}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                  <span style={{ color: isEnabled ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                    {isEnabled ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{ background: '#e2e8f0', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Active Store Email: <b>{emailId}</b>
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              padding: '5px 16px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
