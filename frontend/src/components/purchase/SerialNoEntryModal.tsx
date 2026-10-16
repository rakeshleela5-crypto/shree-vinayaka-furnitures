import React, { useState, useEffect, useRef } from 'react';

interface SerialNoEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  existingSerials?: string[];
  onSaveSerials: (serials: string[]) => void;
}

export const SerialNoEntryModal: React.FC<SerialNoEntryModalProps> = ({
  isOpen,
  onClose,
  productCode,
  productName,
  barcode,
  quantity,
  existingSerials = [],
  onSaveSerials
}) => {
  const [topScanInput, setTopScanInput] = useState<string>('');
  const [checkForScanner, setCheckForScanner] = useState<boolean>(true);
  const [serialRows, setSerialRows] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Build rows based on quantity (e.g. 5 pieces in Frame 0345)
      const list = [...existingSerials];
      while (list.length < quantity) {
        list.push('');
      }
      // If empty, prefill sample serials as in Video 06 Frame 0345: 12345, 123456, 1234567, 12345678, 123456789
      if (existingSerials.length === 0) {
        if (quantity === 5) {
          list[0] = '12345';
          list[1] = '123456';
          list[2] = '1234567';
          list[3] = '12345678';
          list[4] = '123456789';
        } else {
          for (let i = 0; i < quantity; i++) {
            list[i] = `SN-${(12345 + i).toString()}`;
          }
        }
      }
      setSerialRows(list.slice(0, quantity));
      setTimeout(() => scanInputRef.current?.focus(), 150);
    }
  }, [isOpen, quantity, existingSerials]);

  if (!isOpen) return null;

  const handleApplyTopScan = () => {
    if (!topScanInput.trim()) return;
    const updated = [...serialRows];
    // Find first empty slot
    const emptyIndex = updated.findIndex(s => !s.trim());
    if (emptyIndex !== -1) {
      updated[emptyIndex] = topScanInput.trim();
    } else {
      updated[updated.length - 1] = topScanInput.trim();
    }
    setSerialRows(updated);
    setTopScanInput('');
    scanInputRef.current?.focus();
  };

  const handleKeyDownTopScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyTopScan();
    }
  };

  const handleRowChange = (index: number, val: string) => {
    const updated = [...serialRows];
    updated[index] = val;
    setSerialRows(updated);
  };

  const handleSave = () => {
    const cleaned = serialRows.filter(s => s.trim() !== '');
    onSaveSerials(cleaned);
    setSuccessToast('Serial number has been saved successfully');
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
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
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '740px',
          maxWidth: '96vw',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #581c87',
          overflow: 'hidden'
        }}
      >
        {/* Title bar (Frame 0345) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #581c87 0%, #3b0764 100%)',
            color: '#ffffff',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #9333ea'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🔢</span>
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
              Serial No / IMEI Entry ({productName})
            </span>
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}
            >
              Qty: {quantity}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Top Scanner & Quick Entry Strip (1:1 Frame 0345) */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                Serial No
              </span>
              <input
                ref={scanInputRef}
                type="text"
                value={topScanInput}
                onChange={e => setTopScanInput(e.target.value)}
                onKeyDown={handleKeyDownTopScan}
                placeholder="Scan or type Serial No and press Enter..."
                style={{
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  width: '260px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                marginTop: '14px'
              }}
            >
              <input
                type="checkbox"
                checked={checkForScanner}
                onChange={e => setCheckForScanner(e.target.checked)}
              />
              Check For Scanner
            </label>
          </div>

          <button
            onClick={handleApplyTopScan}
            style={{
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Click Here For Serial No Update
          </button>
        </div>

        {/* Success Banner if Saved */}
        {successToast && (
          <div
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              borderBottom: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>✓</span> {successToast}
          </div>
        )}

        {/* Data Grid Table (1:1 Frame 0345) */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#4c0519',
                  color: '#ffffff',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0
                }}
              >
                <th style={{ padding: '6px 8px', width: '30px', textAlign: 'center', borderRight: '1px solid #831843' }}>
                  D
                </th>
                <th style={{ padding: '6px 12px', width: '120px', borderRight: '1px solid #831843' }}>Product Code</th>
                <th style={{ padding: '6px 12px', borderRight: '1px solid #831843' }}>Product Name</th>
                <th style={{ padding: '6px 12px', width: '120px', borderRight: '1px solid #831843' }}>Barcode</th>
                <th style={{ padding: '6px 12px', width: '220px' }}>Serial No</th>
              </tr>
            </thead>
            <tbody>
              {serialRows.map((sn, idx) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', color: '#9333ea' }}>
                    ▶
                  </td>
                  <td style={{ padding: '6px 12px', fontWeight: 600, color: '#1e293b' }}>
                    {productCode || 'P-0842'}
                  </td>
                  <td style={{ padding: '6px 12px', fontWeight: 700, color: '#0f172a' }}>
                    {productName}
                  </td>
                  <td style={{ padding: '6px 12px', color: '#475569' }}>
                    {barcode || '650841'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <input
                      type="text"
                      value={sn}
                      onChange={e => handleRowChange(idx, e.target.value)}
                      placeholder={`Enter serial #${idx + 1}...`}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: sn ? '#fdf4ff' : '#ffffff',
                        color: sn ? '#581c87' : '#0f172a'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Action Footer (Frame 0345) */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#334155'
            }}
          >
            <span>Total Units:</span>
            <span style={{ color: '#581c87', fontSize: '13px' }}>{quantity}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
              }}
            >
              💾 Update
            </button>
            <button
              onClick={() => {
                alert('Opening Barcode & Serial Label Printer Format...');
              }}
              style={{
                backgroundColor: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🏷️ Print Barcode
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
