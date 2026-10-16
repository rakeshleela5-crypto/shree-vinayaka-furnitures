import React, { useState } from 'react';
import type { EmailConfig } from '../../types/retailDaddy';

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
  const [emailId, setEmailId] = useState<string>(config.emailId || 'raintech7559059967@gmail.com');
  const [password, setPassword] = useState<string>(config.password || '••••••••••••');
  const [port, setPort] = useState<number>(config.port || 587);
  const [tlsSslRequired, setTlsSslRequired] = useState<'Yes' | 'No'>(config.tlsSslRequired || 'Yes');
  const [isDefault, setIsDefault] = useState<boolean>(config.isDefault);
  const [isEnabled, setIsEnabled] = useState<boolean>(config.isEnabled);

  const handleServerChange = (val: EmailConfig['serverName']) => {
    setServerName(val);
    if (val === 'Gmail') {
      setSmtpAddress('smtp.gmail.com');
      setPort(587);
    } else if (val === 'Yahoo') {
      setSmtpAddress('smtp.mail.yahoo.com');
      setPort(465);
    } else if (val === 'Rediffmail') {
      setSmtpAddress('smtp.rediffmail.com');
      setPort(25);
    } else if (val === 'Hotmail(Outlook)') {
      setSmtpAddress('smtp.live.com');
      setPort(587);
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
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
    if (onSave) onSave(updated);
    if (onSaveConfig) onSaveConfig(updated);
    showToast('✓ Email Settings Saved Successfully!', 'success');
    setTimeout(() => onClose(), 800);
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
          width: '760px',
          backgroundColor: '#f1f5f9',
          border: '2px solid #1e40af',
          borderRadius: '4px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
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
          <span>Email Setting [Video 12 Frame 0108]</span>
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
              padding: '6px 12px',
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
            padding: '5px',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Email Setting
        </div>

        {/* Main Body Form */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '14px', background: '#ffffff' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Server Name :</span>
              <select
                value={serverName}
                onChange={e => handleServerChange(e.target.value as any)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px', backgroundColor: '#bae6fd' }}
              >
                <option value="Gmail">GMail</option>
                <option value="Yahoo">Yahoo</option>
                <option value="Rediffmail">Rediffmail</option>
                <option value="Hotmail(Outlook)">Hotmail(Outlook)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>SMTP Address :</span>
              <input
                type="text"
                value={smtpAddress}
                onChange={e => setSmtpAddress(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Email ID :</span>
              <input
                type="text"
                value={emailId}
                onChange={e => setEmailId(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Password :</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ flex: 1, border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>Port :</span>
              <input
                type="number"
                value={port}
                onChange={e => setPort(parseInt(e.target.value) || 587)}
                style={{ width: '80px', border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ffffcc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '130px' }}>TLS/SSL Required :</span>
              <select
                value={tlsSslRequired}
                onChange={e => setTlsSslRequired(e.target.value as any)}
                style={{ width: '80px', border: '1px solid #94a3b8', padding: '3px 6px', fontSize: '11px' }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '138px', marginTop: '4px' }}>
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
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setEmailId('');
                setPassword('');
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
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSave}
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

        {/* Bottom Table matching Frame 0108 (Orange header #ea580c) */}
        <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
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
                <td style={{ padding: '4px', fontWeight: 'bold' }}>{serverName}</td>
                <td style={{ padding: '4px' }}>{smtpAddress}</td>
                <td style={{ padding: '4px', color: '#1e40af' }}>{emailId}</td>
                <td style={{ padding: '4px', textAlign: 'center' }}>{port}</td>
                <td style={{ padding: '4px', textAlign: 'center' }}>{tlsSslRequired}</td>
                <td style={{ padding: '4px', textAlign: 'center' }}>{isEnabled ? 'Yes' : 'No'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{ background: '#e2e8f0', padding: '6px 12px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #cbd5e1' }}>
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
