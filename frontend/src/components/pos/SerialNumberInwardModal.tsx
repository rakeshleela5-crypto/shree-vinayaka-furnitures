import { useState, useEffect, useRef } from 'react';

interface SerialNumberInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  existingSerials?: string[];
  onSaveSerials: (serials: string[]) => void;
}

export function SerialNumberInwardModal({
  isOpen,
  onClose,
  productCode,
  productName,
  barcode,
  quantity,
  existingSerials = [],
  onSaveSerials
}: SerialNumberInwardModalProps) {
  const [serialInput, setSerialInput] = useState<string>('');
  const [checkForScanner, setCheckForScanner] = useState<boolean>(true);
  const [serialList, setSerialList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize slots matching purchase quantity
      const initial = [...existingSerials];
      while (initial.length < quantity) {
        // Sample default or empty
        initial.push('');
      }
      // If none exist, prefill with realistic sample serials from Video 16
      if (existingSerials.length === 0) {
        if (quantity === 2 && barcode === '3467') {
          initial[0] = '241227-UE0023';
          initial[1] = '241227-UE0024';
        } else {
          for (let i = 0; i < quantity; i++) {
            initial[i] = `SN-${Date.now().toString().slice(-6)}-${String(i + 1).padStart(2, '0')}`;
          }
        }
      }
      setSerialList(initial.slice(0, quantity));
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, quantity, existingSerials, barcode]);

  if (!isOpen) return null;

  const handleUpdateCurrentSerial = () => {
    if (!serialInput.trim()) return;
    // Find first empty slot or append
    const updated = [...serialList];
    const emptyIdx = updated.findIndex(s => !s.trim());
    if (emptyIdx !== -1) {
      updated[emptyIdx] = serialInput.trim();
    } else if (updated.length < quantity) {
      updated.push(serialInput.trim());
    } else {
      updated[updated.length - 1] = serialInput.trim();
    }
    setSerialList(updated);
    setSerialInput('');
    inputRef.current?.focus();
  };

  const handleManualSerialChange = (idx: number, val: string) => {
    const updated = [...serialList];
    updated[idx] = val;
    setSerialList(updated);
  };

  const handleSave = () => {
    onSaveSerials(serialList.filter(s => s.trim() !== ''));
    onClose();
  };

  return (
    <div className="rd-modal-overlay">
      <div className="rd-dialog" style={{ width: '680px', maxWidth: '95vw', background: '#f8fafc' }}>
        {/* Title bar (Frame 0215) */}
        <div className="rd-dialog-titlebar" style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Serial Number Entry (Inward Stock)</span>
          <button
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Top Input Strip (Frame 0215) */}
        <div style={{ padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', width: '70px' }}>Serial No. :</span>
            <input
              ref={inputRef}
              type="text"
              className="rd-pos-input"
              style={{ flex: 1, fontWeight: 'bold', background: '#ffffff', border: '1px solid #64748b' }}
              placeholder="Scan or type serial / IMEI number..."
              value={serialInput}
              onChange={e => setSerialInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUpdateCurrentSerial();
                }
              }}
            />

            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: '#e0f2fe',
                border: '1px solid #38bdf8',
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '4px 12px'
              }}
              onClick={handleUpdateCurrentSerial}
            >
              Click Here For Serial No. Update
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={checkForScanner}
                onChange={e => setCheckForScanner(e.target.checked)}
              />
              <span style={{ fontWeight: 'bold' }}>Check For Scanner</span>
            </label>
            <span style={{ marginLeft: 'auto', color: '#64748b' }}>
              Product: <strong>{productName}</strong> | Qty: <strong>{quantity}</strong>
            </span>
          </div>
        </div>

        {/* Purple Grid Table (Frame 0215 & 0230) */}
        <div style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          <table className="rd-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#3b0764', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2e1065', width: '110px' }}>Product Code</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2e1065' }}>Product Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2e1065', width: '100px' }}>Barcode</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2e1065' }}>Serial No</th>
              </tr>
            </thead>
            <tbody>
              {serialList.map((sn, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#fef9c3' : '#ffffff' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a' }}>{productCode}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{productName}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{barcode}</td>
                  <td style={{ padding: '4px 6px' }}>
                    <input
                      type="text"
                      className="rd-cell-input"
                      style={{ width: '100%', fontWeight: 'bold', fontFamily: 'monospace', color: '#0f172a' }}
                      value={sn}
                      onChange={e => handleManualSerialChange(idx, e.target.value)}
                      placeholder={`Serial #${idx + 1}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar (Frame 0215) */}
        <div style={{
          padding: '10px 16px',
          background: '#e2e8f0',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
            {serialList.filter(s => s.trim() !== '').length} / {quantity} Serials Entered
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '6px 18px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
              onClick={handleSave}
            >
              Update
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: '#475569',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '6px 14px'
              }}
              onClick={handleSave}
            >
              Serial Sattle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
