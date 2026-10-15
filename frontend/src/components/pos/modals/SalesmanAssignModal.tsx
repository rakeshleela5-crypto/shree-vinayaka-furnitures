import React, { useState } from 'react';

interface Salesman {
  id: string;
  name: string;
  phone: string;
  commissionPct: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSalesman: string;
  onAssignSalesman: (name: string, commPct: number) => void;
}

export const SalesmanAssignModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSalesman,
  onAssignSalesman
}) => {
  const [salesmen] = useState<Salesman[]>([
    { id: 'sm-1', name: 'Mahesh (Counter 1)', phone: '9845011122', commissionPct: 2.5 },
    { id: 'sm-2', name: 'Suresh (Sofa Section)', phone: '9845033344', commissionPct: 3.0 },
    { id: 'sm-3', name: 'Pooja (Dining Specialist)', phone: '9845055566', commissionPct: 3.5 },
    { id: 'sm-4', name: 'Ravi (Store Lead)', phone: '9845077788', commissionPct: 4.0 },
    { id: 'sm-5', name: 'Anil Kumar (Teak Mandir Lead)', phone: '9845099900', commissionPct: 3.0 }
  ]);

  const [selectedName, setSelectedName] = useState(currentSalesman);
  const [customPct, setCustomPct] = useState('3.0');

  if (!isOpen) return null;

  const handleApply = () => {
    onAssignSalesman(selectedName, parseFloat(customPct) || 0);
    onClose();
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '480px' }}>
        <div className="rd-form-titlebar" style={{ background: '#1e293b', color: '#fff' }}>
          <span>Assign Salesman & Commission Rate</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Select Sales Representative:</label>
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {salesmen.map(sm => (
                <div 
                  key={sm.id}
                  onClick={() => {
                    setSelectedName(sm.name);
                    setCustomPct(sm.commissionPct.toString());
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    background: selectedName === sm.name ? '#e0f2fe' : '#ffffff',
                    borderColor: selectedName === sm.name ? '#0284c7' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                    👔 {sm.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 700 }}>
                    Default {sm.commissionPct}% Comm.
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', padding: '8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: '#92400e' }}>Commission % for this bill:</span>
            <input 
              type="number" 
              step="0.1" 
              value={customPct} 
              onChange={e => setCustomPct(e.target.value)} 
              className="rd-input-yellow"
              style={{ width: '60px', textAlign: 'right' }}
            />
            <span style={{ fontWeight: 700 }}>%</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
            <button 
              className="rd-classic-btn" 
              style={{ background: '#0284c7', color: '#fff', borderColor: '#0369a1' }}
              onClick={handleApply}
            >
              Assign to Active Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
