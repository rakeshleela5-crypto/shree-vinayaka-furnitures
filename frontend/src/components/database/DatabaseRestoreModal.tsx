import { useState, useRef } from 'react';
import type { DatabaseSnapshot } from '../../types/retailDaddy';

interface DatabaseRestoreModalProps {
  isOpen: boolean;
  onRestoreComplete: (snapshot: Partial<DatabaseSnapshot>) => void;
  onClose: () => void;
}

interface BackupFileItem {
  id: string;
  name: string;
  dateModified: string;
  type: string;
  sizeKb: number;
  source: 'D_DRIVE' | 'CLOUDFLARE_R2' | 'GOOGLE_DRIVE';
}

export function DatabaseRestoreModal({
  isOpen,
  onRestoreComplete,
  onClose
}: DatabaseRestoreModalProps) {
  const [step, setStep] = useState<'CONFIRM' | 'FILE_PICKER' | 'RESTORING' | 'SUCCESS'>('CONFIRM');
  const [selectedFile, setSelectedFile] = useState<string>('svf-store-backups/DATA/data_20250228140109.zip');
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStatus, setRestoreStatus] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudflare R2 Cloud & Local Volume Backups
  const backupFiles: BackupFileItem[] = [
    {
      id: 'f-r2-1',
      name: 'svf-store-backups/DATA/data_20250228140109.zip',
      dateModified: '28/02/2025 02:01 PM',
      type: 'Cloudflare R2 Object Store',
      sizeKb: 1420,
      source: 'CLOUDFLARE_R2'
    },
    {
      id: 'f-r2-2',
      name: 'svf-store-backups/DATA/data_20250228140010.zip',
      dateModified: '28/02/2025 02:00 PM',
      type: 'Cloudflare R2 Object Store',
      sizeKb: 1390,
      source: 'CLOUDFLARE_R2'
    },
    {
      id: 'f1',
      name: 'backup_data_rnd.db',
      dateModified: '28/02/2025 02:01 PM',
      type: 'Local DB File (D:\\ Drive)',
      sizeKb: 4976,
      source: 'D_DRIVE'
    },
    {
      id: 'f2',
      name: 'data_20250228135000.zip',
      dateModified: '28/02/2025 01:50 PM',
      type: 'Compressed (Google Drive)',
      sizeKb: 1410,
      source: 'GOOGLE_DRIVE'
    },
    {
      id: 'f3',
      name: 'Raintech_DB1.bak',
      dateModified: '28/02/2025 02:01 PM',
      type: 'SQL Server BAK File',
      sizeKb: 35368,
      source: 'D_DRIVE'
    }
  ];

  if (!isOpen) return null;

  const handleStartRestore = () => {
    setStep('RESTORING');
    setRestoreProgress(10);
    setRestoreStatus('Connecting to Railway PostgreSQL database & Cloudflare R2...');

    setTimeout(() => {
      setRestoreProgress(35);
      setRestoreStatus('Unpacking archive & restoring PostgreSQL schema...');
    }, 500);

    setTimeout(() => {
      setRestoreProgress(65);
      setRestoreStatus('Restoring product catalog (48 items) & stock quantities...');
    }, 1000);

    setTimeout(() => {
      setRestoreProgress(90);
      setRestoreStatus('Restoring customer accounts, ledgers & sales invoices...');
    }, 1500);

    setTimeout(() => {
      setRestoreProgress(100);
      setRestoreStatus('PostgreSQL database on Railway successfully verified & restored!');
      setStep('SUCCESS');
    }, 2000);
  };

  const handleFinalOk = () => {
    // Generate complete restored snapshot data
    // Check if there is stored blob in localStorage or use master data
    let restoredSnapshot: Partial<DatabaseSnapshot> = {};
    try {
      const storedBlob = localStorage.getItem('rd_backup_database_blob');
      if (storedBlob) {
        restoredSnapshot = JSON.parse(storedBlob);
      }
    } catch (e) {
      console.warn('Could not parse local backup blob', e);
    }

    onRestoreComplete(restoredSnapshot);
    onClose();
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          localStorage.setItem('rd_backup_database_blob', JSON.stringify(parsed));
          setUploadNotice(`✓ Loaded custom backup file: ${file.name}`);
          setTimeout(() => setUploadNotice(null), 4000);
        } catch {
          // Keep default simulated restore
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* STEP 1: INITIAL RESTORE CONFIRMATION POPUP (FRAME 0216)         */}
      {/* ============================================================== */}
      {step === 'CONFIRM' && (
        <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="rd-dialog"
            style={{
              width: '420px',
              backgroundColor: '#ffffff',
              border: '2px solid #1e40af',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              borderRadius: '4px',
              overflow: 'hidden',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
                color: '#ffffff',
                padding: '4px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <span>Database Restore</span>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ fontSize: '32px', color: '#2563eb' }}>❓</div>
              <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: '1.5' }}>
                <strong>Do you really want to restore database?</strong>
                <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                  ⚠️ Warning: Restoring will overwrite existing records with the backup file data.
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('FILE_PICKER')}
                style={{
                  padding: '5px 22px',
                  background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: '1px solid #166534',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '5px 20px',
                  backgroundColor: '#cbd5e1',
                  color: '#1e293b',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: WINDOWS FILE PICKER DIALOG (EXACT MATCH FRAME 0220)    */}
      {/* ============================================================== */}
      {step === 'FILE_PICKER' && (
        <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="rd-dialog"
            style={{
              width: '680px',
              maxWidth: '96vw',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              borderRadius: '4px',
              overflow: 'hidden',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '4px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b' }}>
                <span>📁</span>
                <span>Open</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Breadcrumb Bar (Frame 0220: This PC > New Volume (D:) > backup) */}
            <div style={{ padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Look in:</span>
              <div
                style={{
                  flex: 1,
                  height: '24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 6px',
                  fontSize: '11px',
                  color: uploadNotice ? '#15803d' : '#0f172a',
                  fontWeight: uploadNotice ? 'bold' : 'normal'
                }}
              >
                {uploadNotice || '🖥️ This PC > New Volume (D:) > backup'}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomFileUpload}
                accept=".json,.db,.bak,.rdb,.zip"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  border: '1px solid #94a3b8',
                  background: '#f1f5f9',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                title="Browse local drive for backup file"
              >
                Browse PC...
              </button>
            </div>

            {/* File List Grid (Frame 0220) */}
            <div style={{ height: '220px', overflowY: 'auto', padding: '4px', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '4px 6px', width: '220px' }}>Name</th>
                    <th style={{ padding: '4px 6px', width: '150px' }}>Date modified</th>
                    <th style={{ padding: '4px 6px', width: '140px' }}>Type</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {backupFiles.map(file => (
                    <tr
                      key={file.id}
                      onClick={() => setSelectedFile(file.name)}
                      onDoubleClick={handleStartRestore}
                      style={{
                        backgroundColor: selectedFile === file.name ? '#bae6fd' : 'transparent',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <td style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{file.source === 'CLOUDFLARE_R2' ? '🟧' : file.source === 'GOOGLE_DRIVE' ? '☁️' : '💾'}</span>
                        <span style={{ fontWeight: selectedFile === file.name ? 'bold' : 'normal', color: '#0f172a' }}>
                          {file.name}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', color: '#64748b' }}>{file.dateModified}</td>
                      <td style={{ padding: '4px 6px', color: '#64748b' }}>{file.type}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#64748b' }}>
                        {file.sizeKb.toLocaleString()} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Controls (Frame 0220) */}
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', color: '#334155' }}>File name:</label>
                <input
                  type="text"
                  value={selectedFile}
                  onChange={e => setSelectedFile(e.target.value)}
                  style={{ height: '24px', border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '11px' }}
                />
                <button
                  type="button"
                  onClick={handleStartRestore}
                  style={{
                    height: '26px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #1d4ed8',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Open
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: '#334155' }}>Files of type:</label>
                <select
                  style={{ height: '24px', border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '11px', backgroundColor: '#ffffff' }}
                >
                  <option>DB Backup File (*.bak; *.db; *.rdb; *.json; *.zip)</option>
                  <option>All Files (*.*)</option>
                </select>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    height: '26px',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: RESTORE EXECUTION PROGRESS                             */}
      {/* ============================================================== */}
      {step === 'RESTORING' && (
        <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="rd-dialog"
            style={{
              width: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              padding: '24px',
              textAlign: 'center',
              fontFamily: 'Segoe UI, sans-serif'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
              Restoring Database: {selectedFile}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
              {restoreStatus}
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${restoreProgress}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #15803d 100%)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 4: SUCCESS CONFIRMATION MODAL (EXACT MATCH FRAME 0240)    */}
      {/* ============================================================== */}
      {step === 'SUCCESS' && (
        <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="rd-dialog"
            style={{
              width: '320px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              borderRadius: '4px',
              overflow: 'hidden',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
            }}
          >
            {/* Titlebar: Terminal Setting (Frame 0240) */}
            <div
              style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '4px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#475569'
              }}
            >
              <span>Terminal Setting</span>
              <button
                type="button"
                onClick={handleFinalOk}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Info Message Body (Frame 0240) */}
            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  flexShrink: 0
                }}
              >
                i
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                Successfully Updated
              </div>
            </div>

            {/* OK Button (Frame 0240) */}
            <div style={{ padding: '8px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={handleFinalOk}
                style={{
                  minWidth: '75px',
                  padding: '4px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
