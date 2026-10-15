import React, { useState } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import type { CursorFlowConfig } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  flow: CursorFlowConfig[];
  onSaveFlow: (flow: CursorFlowConfig[]) => void;
}

export const CursorSettingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  flow,
  onSaveFlow
}) => {
  const [config, setConfig] = useState<CursorFlowConfig[]>(flow);

  if (!isOpen) return null;

  const moveStep = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.length) return;
    const updated = [...config];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setConfig(updated);
  };

  const handleSave = () => {
    onSaveFlow(config);
    onClose();
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '520px', width: '90%' }}>
        <div
          className="pos-modal-header"
          style={{ background: '#f8fafc', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}>
              Pos Cursor Setting
            </span>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 12px 0' }}>
            Configure where the cashier's cursor jumps after scanning a barcode or pressing Enter:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {config.map((step, idx) => (
              <div
                key={step.field}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <ArrowRight size={14} color="#0284c7" />
                  <span>{step.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, 'UP')}
                    style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === config.length - 1}
                    onClick={() => moveStep(idx, 'DOWN')}
                    style={{ padding: '2px 6px', fontSize: '0.7rem', cursor: idx === config.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === config.length - 1 ? 0.4 : 1 }}
                  >
                    ▼
                  </button>
                  <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                    Step {idx + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '6px 14px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 18px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Check size={14} /> Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
