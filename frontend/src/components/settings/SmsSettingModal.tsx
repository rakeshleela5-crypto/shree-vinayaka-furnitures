import React, { useState } from 'react';
import type { SmsConfig } from '../../types/retailDaddy';

interface SmsSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SmsConfig;
  onSaveConfig?: (config: SmsConfig) => void;
  onSave?: (config: SmsConfig) => void;
}

export const SmsSettingModal: React.FC<SmsSettingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSave
}) => {
  if (!isOpen) return null;

  const [apiUrl, setApiUrl] = useState<string>(config.apiUrl);
  const [isEnabled, setIsEnabled] = useState<boolean>(config.isEnabled);
  const [isDefault, setIsDefault] = useState<boolean>(config.isDefault);
  const [autoSmsEnabled, setAutoSmsEnabled] = useState<boolean>(config.autoSmsEnabled);
  const [senderId, setSenderId] = useState<string>(config.senderId || 'SVFURN');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const updated: SmsConfig = {
      apiUrl,
      isEnabled,
      isDefault,
      autoSmsEnabled,
      senderId
    };
    if (onSave) onSave(updated);
    if (onSaveConfig) onSaveConfig(updated);
    showToast('✓ SMS Settings Saved Successfully!', 'success');
    setTimeout(() => onClose(), 800);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete and reset your SMS Gateway configuration?')) {
      const resetConfig: SmsConfig = {
        apiUrl: '',
        isEnabled: false,
        isDefault: false,
        autoSmsEnabled: false,
        senderId: ''
      };
      setApiUrl('');
      setIsEnabled(false);
      setIsDefault(false);
      setAutoSmsEnabled(false);
      setSenderId('');
      localStorage.setItem('rd_sms_config', JSON.stringify(resetConfig));
      if (onSave) onSave(resetConfig);
      if (onSaveConfig) onSaveConfig(resetConfig);
      showToast('✓ SMS configuration deleted and reset.', 'success');
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        {/* Title Bar matching Frame 0100 */}
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
          <span>SMS Gateway Configuration - Shree Vinayaka POS</span>
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
          SMS Setting
        </div>

        {/* Main Body */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: '14px', background: '#ffffff' }}>
          {/* Form Left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', width: '70px' }}>API URL :</span>
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                style={{
                  flex: 1,
                  border: '1px solid #94a3b8',
                  padding: '4px 6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  backgroundColor: '#bae6fd',
                  color: '#0f172a'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '70px', fontSize: '11px', fontWeight: 'bold' }}>Sender ID:</span>
              <input
                type="text"
                value={senderId}
                onChange={e => setSenderId(e.target.value)}
                style={{ width: '120px', padding: '3px 6px', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '78px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={e => setIsEnabled(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>IsEnabled</span>
              </label>

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
                  checked={autoSmsEnabled}
                  onChange={e => setAutoSmsEnabled(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Auto SMS Enabled</span>
              </label>
            </div>

            {/* Red helper text matching Frame 0100 */}
            <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold', marginTop: '6px', lineHeight: '1.4' }}>
              <div>Recipient = @MobileNo</div>
              <div>Message = @Message</div>
              <div style={{ wordBreak: 'break-all', marginTop: '4px', fontWeight: 'normal', color: '#991b1b' }}>
                Ex: http://127.0.0.1:9500/api?action=sendmessage&username=admin&password=1234&recipient=@MobileNo&messagetype=SMS:TEXT&Message=@Message
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setApiUrl('https://api.textlocal.in/send/?apikey=YOUR_KEY&numbers=@MobileNo&message=@Message&sender=RAINTE');
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
              onClick={handleDelete}
              style={{
                background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Bottom Table matching Frame 0100 (Orange header #ea580c) */}
        <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#ea580c', color: '#ffffff' }}>
                <th style={{ padding: '5px', textAlign: 'left' }}>API URL</th>
                <th style={{ padding: '5px', width: '80px', textAlign: 'center' }}>IsEnabled</th>
                <th style={{ padding: '5px', width: '80px', textAlign: 'center' }}>IsDefault</th>
                <th style={{ padding: '5px', width: '120px', textAlign: 'center' }}>Auto SMS Enabled</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '5px', fontFamily: 'monospace', fontSize: '10px', color: '#1e3a8a' }}>
                  {apiUrl.slice(0, 50)}...
                </td>
                <td style={{ padding: '5px', textAlign: 'center' }}>{isEnabled ? 'Yes' : 'No'}</td>
                <td style={{ padding: '5px', textAlign: 'center' }}>{isDefault ? 'Yes' : 'No'}</td>
                <td style={{ padding: '5px', textAlign: 'center' }}>{autoSmsEnabled ? 'Yes' : 'No'}</td>
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
