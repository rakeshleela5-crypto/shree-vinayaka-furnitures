import React, { useState } from 'react';
import { X, CheckCircle2, Plus } from 'lucide-react';
import type { ColumnIndexConfig } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnIndexConfig[];
  onSaveColumns: (cols: ColumnIndexConfig[]) => void;
}

export const IndexSettingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  columns,
  onSaveColumns
}) => {
  const [cols, setCols] = useState<ColumnIndexConfig[]>(columns);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleUpdate = (_name: string) => {
    onSaveColumns(cols);
    setToastMessage('Record updated successfully!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDelete = (name: string) => {
    setCols(prev => prev.filter(c => c.name !== name));
  };

  const handleIndexChange = (name: string, newIdx: number) => {
    setCols(prev =>
      prev.map(c => (c.name === name ? { ...c, columnIndex: newIdx } : c))
    );
  };

  const handleRequiredToggle = (name: string, req: boolean) => {
    setCols(prev =>
      prev.map(c => (c.name === name ? { ...c, required: req } : c))
    );
  };

  const filtered = cols.filter(
    c =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '680px', width: '92%' }}>
        <div
          className="pos-modal-header"
          style={{ background: '#f8fafc', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
              SALE PANEL INDEX SETTING
            </span>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc' }}>
          {toastMessage && (
            <div
              style={{
                position: 'fixed',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '8px',
                padding: '24px 32px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 1000,
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#0284c7', marginBottom: '8px' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto' }} />
              </div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e293b' }}>{toastMessage}</h4>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                style={{
                  padding: '6px 24px',
                  background: '#e2e8f0',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          )}

          {/* Control Bar matching frame 061 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>SELECT ALL :</span>
              <span style={{ fontWeight: 700 }}>
                TOP : <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '3px' }}>{cols.length}</span> RECORDS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Search By</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', width: '120px' }}
                />
              </div>
            </div>

            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                background: '#e2e8f0',
                border: '1px solid #94a3b8',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} color="#0284c7" /> New
            </button>
          </div>

          {/* Grid Table */}
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#bef264', color: '#000', borderBottom: '1px solid #94a3b8' }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, width: '100px' }}>ColumnIndex</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, width: '80px' }}>Required</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, width: '90px' }}>Action</th>
                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, width: '90px' }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: i % 2 === 0 ? '#fff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}>{c.label} ({c.name})</td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={c.columnIndex}
                        onChange={e => handleIndexChange(c.name, parseInt(e.target.value) || 1)}
                        style={{ width: '50px', textAlign: 'center', padding: '3px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c.required}
                        onChange={e => handleRequiredToggle(c.name, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdate(c.name)}
                        style={{
                          padding: '3px 10px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #7dd3fc',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Update
                      </button>
                    </td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.name)}
                        style={{
                          padding: '3px 10px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
