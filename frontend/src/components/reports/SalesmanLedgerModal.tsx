import React, { useState } from 'react';
import type { SalesmanRecord, SalesmanLedgerEntry } from '../../types/retailDaddy';

interface SalesmanLedgerModalProps {
  isOpen: boolean;
  salesmen: SalesmanRecord[];
  initialSalesmanId?: string;
  ledgerEntries: SalesmanLedgerEntry[];
  onClose: () => void;
}

/**
 * Video 19 Feature 17: Salesman Ledger Statement (1:1 Frame 365)
 * Crystal Reports style statement with debit/credit running balances and print preview toolbar
 */
export const SalesmanLedgerModal: React.FC<SalesmanLedgerModalProps> = ({
  isOpen,
  salesmen,
  initialSalesmanId,
  ledgerEntries,
  onClose
}) => {
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>(
    initialSalesmanId || salesmen.find(s => s.code === 'SM-0003')?.id || salesmen[0]?.id || ''
  );
  const [whatsappNo, setWhatsappNo] = useState<string>('1234567890');
  const [emailId, setEmailId] = useState<string>('sukumar@gmail.com');

  if (!isOpen) return null;

  const currentSalesman = salesmen.find(s => s.id === selectedSalesmanId) || salesmen[0];

  const filteredEntries = ledgerEntries.filter(
    l => l.salesmanId === selectedSalesmanId || (currentSalesman && l.account.toLowerCase().includes(currentSalesman.name.toLowerCase()))
  );

  const totalDebit = filteredEntries.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = filteredEntries.reduce((sum, l) => sum + (l.credit || 0), 0);
  const netCrBalance = totalCredit - totalDebit;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '920px',
          height: '90vh',
          backgroundColor: '#52525b',
          border: '1px solid #27272a',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (1:1 Frame 365) */}
        <div
          style={{
            backgroundColor: '#18181b',
            color: '#ffffff',
            padding: '5px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            userSelect: 'none'
          }}
        >
          <span>Print Preview - SalesMan Ledger</span>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '11px',
              padding: '2px 8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body: Left Action Ribbon + Right A4 Paper */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Crystal Reports Tool Strip (1:1 Frame 365) */}
          <div
            style={{
              width: '130px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #cbd5e1',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Salesman :</span>
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                style={{ width: '100%', fontSize: '11px', padding: '2px', marginTop: '2px' }}
              >
                {salesmen.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>No(s) of Copy :</span>
              <input
                type="number"
                defaultValue={1}
                min={1}
                style={{ width: '100%', padding: '2px', textAlign: 'center', fontSize: '11px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* Print Button (F6) */}
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                padding: '10px 4px',
                borderRadius: '3px',
                fontWeight: 'bold',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '18px' }}>🖨️</span>
              <span>F6</span>
            </button>

            {/* PDF Button (F7) */}
            <button
              onClick={() => alert('PDF export generated')}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '8px 4px',
                borderRadius: '3px',
                fontWeight: 'bold',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '16px' }}>📄 PDF</span>
              <span>F7</span>
            </button>

            {/* Email Field */}
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Enter Valid Email ID :</span>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                style={{ width: '100%', fontSize: '10px', padding: '2px', border: '1px solid #cbd5e1' }}
              />
              <button
                onClick={() => alert(`Email queued to ${emailId}`)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✉️ Email (F8)
              </button>
            </div>

            {/* WhatsApp Field */}
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Enter Valid WhatsApp No. :</span>
              <input
                type="text"
                value={whatsappNo}
                onChange={(e) => setWhatsappNo(e.target.value)}
                style={{ width: '100%', fontSize: '10px', padding: '2px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* WhatsApp Integration Buttons (Tejas, Rocket, Agni - F9 Frame 365) */}
            <button
              onClick={() => alert(`WhatsApp message sent via Tejas Gateway to ${whatsappNo}`)}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #16a34a',
                color: '#16a34a',
                padding: '4px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              <span>💬</span>
              <span>Tejas</span>
            </button>
            <button
              onClick={() => alert(`WhatsApp message sent via Rocket Gateway to ${whatsappNo}`)}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #16a34a',
                color: '#16a34a',
                padding: '4px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              <span>💬</span>
              <span>Rocket</span>
            </button>
            <button
              onClick={() => alert(`WhatsApp message sent via Agni Gateway to ${whatsappNo}`)}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #16a34a',
                color: '#16a34a',
                padding: '4px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              <span>💬</span>
              <span>Agni - F9</span>
            </button>
          </div>

          {/* Right: Paper Preview Sheet (1:1 Frame 365) */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#52525b'
            }}
          >
            <div
              style={{
                width: '700px',
                minHeight: '800px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                padding: '30px',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {/* Header Info (1:1 Frame 365) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    SalesMan ID : <span style={{ fontFamily: 'monospace' }}>{currentSalesman?.code || 'SM-0003'}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                    SalesMan Name : <span>{currentSalesman?.name || 'sukumar'}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '2px' }}>
                    Current Balance : <span>{netCrBalance.toFixed(2)} Cr</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155' }}>
                  <div>22/02/2025 03:18:14PM</div>
                  <div style={{ marginTop: '2px' }}>( From 01/04/2024 To 22/02/2025 )</div>
                </div>
              </div>

              {/* Table (1:1 Frame 365) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '12px' }}>
                <thead>
                  <tr style={{ borderTop: '1.5px solid #000000', borderBottom: '1.5px solid #000000' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Account</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Voucher / Invoice No.</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Voucher Type</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#1e40af' }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#1e40af' }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No transactions recorded for this salesperson.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((row, idx) => (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 4px' }}>{row.date}</td>
                        <td style={{ padding: '6px 4px' }}>{row.account}</td>
                        <td style={{ padding: '6px 4px', fontFamily: 'monospace' }}>{row.voucherNo}</td>
                        <td style={{ padding: '6px 4px' }}>{row.voucherType}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                          {row.debit > 0 ? row.debit.toFixed(2) : ''}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                          {row.credit > 0 ? row.credit.toFixed(2) : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals Summary (1:1 Frame 365) */}
              <div style={{ marginTop: '20px', borderTop: '1.5px solid #000000', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '11px', fontWeight: 'bold' }}>
                  <span>Current Balance :</span>
                  <span style={{ width: '80px', textAlign: 'right', color: '#1e40af' }}>{totalDebit.toFixed(2)}</span>
                  <span style={{ width: '80px', textAlign: 'right', color: '#1e40af' }}>{totalCredit.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '11px', fontWeight: 'bold', marginTop: '6px' }}>
                  <span>Closing Balance :</span>
                  <span style={{ width: '80px', textAlign: 'right', color: '#1e40af' }}>({netCrBalance.toFixed(2)})</span>
                  <span style={{ width: '80px', textAlign: 'right', color: '#1e40af' }}>{netCrBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
