import { useState } from 'react';
import type { AutoBackupConfig } from '../../types/retailDaddy';

interface AutoBackupModalProps {
  isOpen: boolean;
  config: AutoBackupConfig;
  onSaveConfig: (updated: AutoBackupConfig) => void;
  onClose: () => void;
}

export function AutoBackupModal({
  isOpen,
  config,
  onSaveConfig,
  onClose
}: AutoBackupModalProps) {
  const [formData, setFormData] = useState<AutoBackupConfig>(config);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    config.backupHistory.length > 0 ? config.backupHistory[0].id : null
  );
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false);
  const [oauthStep, setOauthStep] = useState<'SELECT_ACCOUNT' | 'UNVERIFIED_WARNING' | 'PERMISSIONS' | 'SUCCESS'>('SELECT_ACCOUNT');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectFolder = () => {
    // Simulate Windows Directory Picker (Frame 0042 & 0060)
    const mockDrives = ['D:\\RetailDaddy_Backup', 'E:\\Store_Backups', 'F:\\USB_Drive_Backup'];
    const selected = mockDrives[Math.floor(Math.random() * mockDrives.length)];
    setFormData(prev => ({
      ...prev,
      destinationFolderPath: selected
    }));
    showToast(`📁 Selected Destination Folder: ${selected}`);
  };

  const handleSave = () => {
    onSaveConfig(formData);
    showToast('✅ Auto Backup Configuration Successfully Saved! [Video 08 Frame 0042]');
  };

  const handleNew = () => {
    setFormData(prev => ({
      ...prev,
      destinationFolderPath: 'D:\\New_Backup_Folder',
      autoOfflineBackupStatus: 'Enable',
      autoCloudBackupStatus: 'Enable'
    }));
    showToast('📄 Created New Backup Profile');
  };

  const handleUpdate = () => {
    onSaveConfig(formData);
    showToast('🔄 Backup Path & Schedule Updated Successfully');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this backup path?')) {
      setFormData(prev => ({
        ...prev,
        destinationFolderPath: '',
        autoOfflineBackupStatus: 'Disable'
      }));
      showToast('🗑️ Backup Path Removed');
    }
  };

  const startGoogleOAuth = () => {
    setOauthStep('SELECT_ACCOUNT');
    setShowGoogleOAuth(true);
  };

  const completeOAuth = () => {
    setFormData(prev => ({
      ...prev,
      connectedGoogleAccount: 'raintech7559059967@gmail.com',
      autoCloudBackupStatus: 'Enable'
    }));
    setShowGoogleOAuth(false);
    showToast('☁️ Google Drive Connected: raintech7559059967@gmail.com [Video 08 Frame 0125]');
  };

  return (
    <>
      <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
        <div
          className="rd-dialog"
          style={{
            width: '740px',
            maxWidth: '96vw',
            background: '#e0f2fe',
            border: '2px solid #1d4ed8',
            borderRadius: '4px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
          }}
        >
          {/* WINDOWS TITLEBAR (Video 08 Frame 0042) */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
              color: '#ffffff',
              padding: '4px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
              borderBottom: '1px solid #60a5fa'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
              <span>💾</span>
              <span>Auto Backup Configuration</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                _
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                □
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* BLUE HEADER BANNER (Video 08 Frame 0042) */}
          <div
            style={{
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              textAlign: 'center',
              padding: '6px',
              fontSize: '15px',
              fontWeight: '900',
              letterSpacing: '0.5px'
            }}
          >
            Auto Backup Configuration
          </div>

          {toastMessage && (
            <div
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              {toastMessage}
            </div>
          )}

          {/* MAIN BODY: 2-COLUMN GRID (Frame 0042) */}
          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 130px', gap: '14px', background: '#f8fafc' }}>
            {/* LEFT COLUMN: PATH, FOLDER BUTTON, STATUS DROPDOWNS & TABLE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Destination Folder Path */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '3px' }}>
                  Destination Folder Path
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formData.destinationFolderPath}
                    onChange={e => setFormData({ ...formData, destinationFolderPath: e.target.value })}
                    style={{
                      flex: 1,
                      height: '28px',
                      backgroundColor: '#cffafe', // Light cyan as seen in Frame 0042
                      border: '1px solid #0284c7',
                      borderRadius: '3px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. D:\RetailDaddy_Backup"
                  />
                  {/* Purple Select Folder Icon Button (Frame 0042) */}
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    style={{
                      background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
                      border: '1px solid #5b21b6',
                      borderRadius: '4px',
                      color: '#ffffff',
                      padding: '4px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      minWidth: '70px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Browse Directory on PC (Select D:\ Drive) [Video 08 Frame 0042]"
                  >
                    <span style={{ fontSize: '16px' }}>📁💾</span>
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Select Folder</span>
                  </button>
                </div>
              </div>

              {/* Status Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '3px' }}>
                    Auto Offline Backup Status :
                  </label>
                  <select
                    value={formData.autoOfflineBackupStatus}
                    onChange={e => setFormData({ ...formData, autoOfflineBackupStatus: e.target.value as any })}
                    style={{
                      width: '100%',
                      height: '26px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: formData.autoOfflineBackupStatus === 'Enable' ? '#dcfce7' : '#fee2e2',
                      color: formData.autoOfflineBackupStatus === 'Enable' ? '#166534' : '#991b1b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      padding: '0 6px'
                    }}
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '3px' }}>
                    Auto Cloud Backup Status :
                  </label>
                  <select
                    value={formData.autoCloudBackupStatus}
                    onChange={e => setFormData({ ...formData, autoCloudBackupStatus: e.target.value as any })}
                    style={{
                      width: '100%',
                      height: '26px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: formData.autoCloudBackupStatus === 'Enable' ? '#dcfce7' : '#fee2e2',
                      color: formData.autoCloudBackupStatus === 'Enable' ? '#166534' : '#991b1b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      padding: '0 6px'
                    }}
                  >
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                  </select>
                </div>
              </div>

              {/* Google Drive Account Link (Frame 0070 & 0125) */}
              <div
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
                    alt="Google Drive"
                    style={{ width: '22px', height: '22px' }}
                  />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                      Google Drive Cloud Account
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {formData.connectedGoogleAccount ? (
                        <span style={{ color: '#15803d', fontWeight: 'bold' }}>
                          ✓ Connected: {formData.connectedGoogleAccount}
                        </span>
                      ) : (
                        <span>Not connected. Connect to sync backups to GDClient/DATA.</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGoogleOAuth}
                  style={{
                    backgroundColor: formData.connectedGoogleAccount ? '#ffffff' : '#2563eb',
                    color: formData.connectedGoogleAccount ? '#1e40af' : '#ffffff',
                    border: formData.connectedGoogleAccount ? '1px solid #93c5fd' : 'none',
                    borderRadius: '3px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                  title="Connect personal Google Drive account [Video 08 Frame 0125]"
                >
                  {formData.connectedGoogleAccount ? 'Re-authorize 🔄' : 'Connect Account 🔑'}
                </button>
              </div>

              {/* Configuration History Grid (Frame 0042) */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                  Active Backup Configurations & History
                </label>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', maxHeight: '150px', overflowY: 'auto', background: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#1d4ed8', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #3b82f6' }}>Destination Folder Path</th>
                        <th style={{ padding: '5px 8px', borderRight: '1px solid #3b82f6', width: '130px' }}>Auto Offline Backup</th>
                        <th style={{ padding: '5px 8px', width: '120px' }}>Auto Cloud Backup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Active Profile */}
                      <tr
                        style={{
                          backgroundColor: '#e0f2fe',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          borderBottom: '1px solid #cbd5e1'
                        }}
                      >
                        <td style={{ padding: '5px 8px' }}>
                          💾 {formData.destinationFolderPath || 'D:\\RetailDaddy_Backup'}
                        </td>
                        <td style={{ padding: '5px 8px', color: formData.autoOfflineBackupStatus === 'Enable' ? '#166534' : '#991b1b' }}>
                          {formData.autoOfflineBackupStatus}
                        </td>
                        <td style={{ padding: '5px 8px', color: formData.autoCloudBackupStatus === 'Enable' ? '#166534' : '#991b1b' }}>
                          {formData.autoCloudBackupStatus}
                        </td>
                      </tr>

                      {/* Google Drive Archive Target */}
                      <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 8px', color: '#1e40af' }}>
                          ☁️ Google Drive: My Drive &gt; GDClient &gt; DATA
                        </td>
                        <td style={{ padding: '5px 8px', color: '#64748b' }}>-</td>
                        <td style={{ padding: '5px 8px', color: '#166534', fontWeight: 'bold' }}>Active</td>
                      </tr>

                      {/* Backup History Entries */}
                      {formData.backupHistory.map(rec => (
                        <tr
                          key={rec.id}
                          onClick={() => setSelectedRecordId(rec.id)}
                          style={{
                            backgroundColor: selectedRecordId === rec.id ? '#fef08a' : '#ffffff',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <td style={{ padding: '4px 8px', color: '#334155' }}>
                            📦 {rec.filename} ({rec.sizeKb} KB) - {rec.timestamp}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>
                            {rec.type === 'Offline' || rec.type === 'Dual' ? 'Saved (D:)' : '-'}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>
                            {rec.type === 'Cloud' || rec.type === 'Dual' ? 'Synced (GDrive)' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 4 GLOSSY BUTTONS (Frame 0042) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px' }}>
              {/* New */}
              <button
                type="button"
                onClick={handleNew}
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                  color: '#ffffff',
                  border: '1px solid #172554',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                New
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: '1px solid #166534',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Save
              </button>

              {/* Update */}
              <button
                type="button"
                onClick={handleUpdate}
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e40af',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Update
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: '1px solid #991b1b',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#eff6ff',
              borderTop: '1px solid #bfdbfe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>
              ⚡ Retail Daddy Disaster Recovery & Cloud Shield Rel 1.6
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '4px 18px',
                backgroundColor: '#cbd5e1',
                color: '#1e293b',
                border: '1px solid #94a3b8',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GOOGLE OAUTH SIMULATOR DIALOG (EXACT REPLICA OF VIDEO 08 FRAME 0125) */}
      {/* ============================================================== */}
      {showGoogleOAuth && (
        <div className="rd-modal-overlay" style={{ zIndex: 1300 }}>
          <div
            className="rd-dialog"
            style={{
              width: '480px',
              maxWidth: '92vw',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              fontFamily: 'Roboto, Segoe UI, sans-serif'
            }}
          >
            {/* Browser Tab Bar */}
            <div style={{ background: '#dee2e6', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #ced4da' }}>
              <span style={{ fontSize: '11px', color: '#495057' }}>🔒 accounts.google.com/signin/oauth</span>
              <button
                type="button"
                onClick={() => setShowGoogleOAuth(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {oauthStep === 'SELECT_ACCOUNT' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                      alt="Google"
                      style={{ width: '80px', marginBottom: '8px' }}
                    />
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#202124' }}>
                      Sign in with Google
                    </div>
                    <div style={{ fontSize: '12px', color: '#5f6368' }}>
                      to continue to Retail Daddy Store Backup
                    </div>
                  </div>

                  <div
                    onClick={() => setOauthStep('UNVERIFIED_WARNING')}
                    style={{
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#1a73e8',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                    >
                      R
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#202124' }}>
                        Raintech Software
                      </div>
                      <div style={{ fontSize: '12px', color: '#5f6368' }}>
                        raintech7559059967@gmail.com
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#5f6368', textAlign: 'center', marginTop: '14px' }}>
                    To continue, Google will share your name, email address, and profile picture with Retail Daddy.
                  </div>
                </div>
              )}

              {oauthStep === 'UNVERIFIED_WARNING' && (
                <div>
                  {/* Red Triangle Warning (Exact match of Video 08 Frame 0125) */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '42px', color: '#d93025', lineHeight: '1' }}>⚠️</div>
                    <div style={{ fontSize: '20px', fontWeight: '500', color: '#202124', marginTop: '8px' }}>
                      Google hasn't verified this app
                    </div>
                    <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                      The app is requesting access to sensitive info in your Google Account.
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => setOauthStep('PERMISSIONS')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1a73e8',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Go to raintech_Store1 (unsafe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGoogleOAuth(false)}
                      style={{
                        backgroundColor: '#1a73e8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      BACK TO SAFETY
                    </button>
                  </div>
                </div>
              )}

              {oauthStep === 'PERMISSIONS' && (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#202124', marginBottom: '10px' }}>
                    Retail Daddy wants to access your Google Account
                  </div>
                  <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '16px' }}>
                    This will allow Retail Daddy Store Backup to:
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
                      alt="Drive"
                      style={{ width: '20px', height: '20px' }}
                    />
                    <div style={{ fontSize: '12px', color: '#3c4043' }}>
                      <strong>See, edit, create, and delete only the specific Google Drive files you use with this app</strong>
                      <div style={{ fontSize: '11px', color: '#70757a' }}>Directory: My Drive &gt; GDClient &gt; DATA</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setShowGoogleOAuth(false)}
                      style={{ padding: '6px 16px', border: '1px solid #dadce0', borderRadius: '4px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={completeOAuth}
                      style={{ padding: '6px 20px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
