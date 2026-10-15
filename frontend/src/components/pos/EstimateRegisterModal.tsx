import { useState } from 'react';
import type { EstimateRecord } from '../../types/retailDaddy';

interface EstimateRegisterModalProps {
  estimates: EstimateRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEstimate: (estimate: EstimateRecord) => void;
}

export function EstimateRegisterModal({
  estimates,
  isOpen,
  onClose,
  onSelectEstimate
}: EstimateRegisterModalProps) {
  const [searchEstNo, setSearchEstNo] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>(estimates[0]?.id || '');

  if (!isOpen) return null;

  const filteredEstimates = estimates.filter(est => {
    if (!searchEstNo) return true;
    return est.estimateNo.toLowerCase().includes(searchEstNo.toLowerCase()) ||
      est.customerName.toLowerCase().includes(searchEstNo.toLowerCase());
  });

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Estimate No,Date,Customer Name,State,GSTIN/UID,Items Count,Grand Total"]
        .concat(
          filteredEstimates.map(e =>
            `"${e.estimateNo}","${e.date}","${e.customerName}","${e.state}","${e.gstin || '0'}",${e.items.length},${e.grandTotal.toFixed(2)}`
          )
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Estimate_Register_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEst = estimates.find(e => e.id === selectedId) || filteredEstimates[0];

  return (
    <div className="rd-modal-overlay">
      <div className="rd-dialog" style={{ width: '820px', maxWidth: '95vw', background: '#f8fafc' }}>
        {/* Title Bar matching Video 16 Frame 0045 */}
        <div className="rd-dialog-titlebar" style={{
          background: 'linear-gradient(180deg, #004080 0%, #002b55 100%)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '13px',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Estimate Register</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>_</button>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>□</button>
            <button
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Section (Frame 0045) */}
        <div style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                Search by Estimate No. :
              </span>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '220px', background: '#ffffff', fontWeight: 'bold', border: '1px solid #94a3b8' }}
                placeholder="ESTM-0001-2024/25..."
                value={searchEstNo}
                onChange={e => setSearchEstNo(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={() => setSearchEstNo('')}
            >
              <span style={{ color: '#22c55e', fontSize: '14px' }}>↻</span>
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={handleExportExcel}
            >
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>📊</span>
              <span>Export Excel</span>
            </button>

            {selectedEst && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{
                  background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  padding: '4px 14px',
                  marginLeft: 'auto',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
                onClick={() => {
                  onSelectEstimate(selectedEst);
                  onClose();
                }}
                title="Convert this estimate into Point of Sale invoice [Video 16 Frame 0050]"
              >
                <span>🛒 Convert to Sale POS</span>
              </button>
            )}
          </div>
        </div>

        {/* Table matching Frame 0045 */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '10px' }}>
          <table className="rd-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#800000', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #550000' }}>Estimate No</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #550000' }}>Date</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #550000' }}>Customer Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #550000' }}>State</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #550000' }}>GSTIN/UID</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #550000' }}>Items</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #550000' }}>Grand Total</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #550000' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No estimate records found matching "{searchEstNo}".
                  </td>
                </tr>
              ) : (
                filteredEstimates.map(est => {
                  const isSelected = est.id === selectedId;
                  return (
                    <tr
                      key={est.id}
                      style={{
                        background: isSelected ? '#dbeafe' : '#ffffff',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                      onClick={() => setSelectedId(est.id)}
                      onDoubleClick={() => {
                        onSelectEstimate(est);
                        onClose();
                      }}
                    >
                      <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a' }}>{est.estimateNo}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{est.date}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{est.customerName}</td>
                      <td style={{ padding: '6px 8px' }}>{est.state}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{est.gstin || '0'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{est.items.length}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                        ₹{est.grandTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="rd-grid-btn"
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 8px'
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectEstimate(est);
                            onClose();
                          }}
                        >
                          Load to POS
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '8px 12px',
          background: '#e2e8f0',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px'
        }}>
          <span style={{ color: '#475569' }}>
            Total Estimates: <strong>{filteredEstimates.length}</strong> (Double-click any row to load into POS cart)
          </span>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ padding: '4px 16px' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
