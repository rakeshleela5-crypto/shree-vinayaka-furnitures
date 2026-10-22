import React, { useState, useEffect } from 'react';
import type { SalesmanRecord, SalesmanLedgerEntry } from '../../types/retailDaddy';
import { exportToCsv, api } from '../../api/client';

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

  const currentSalesman = salesmen.find(s => s.id === selectedSalesmanId) || salesmen[0];

  // W2-13 fix: Populate real phone and email from selected salesman instead of fake hardcoded values
  const [whatsappNo, setWhatsappNo] = useState<string>(currentSalesman?.phone || '');
  const [emailId, setEmailId] = useState<string>(currentSalesman?.email || '');
  const [liveSalesInvoices, setLiveSalesInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (currentSalesman) {
      setWhatsappNo(currentSalesman.phone || '');
      setEmailId(currentSalesman.email || '');
    }
  }, [currentSalesman]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // W2-9 fix: Fetch live sale invoices to show live commission credit entries in ledger
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    api.getSalesInvoices(0, 100).then(res => {
      if (isMounted && Array.isArray(res)) {
        setLiveSalesInvoices(res);
      }
    }).catch(err => console.warn('Could not fetch sales invoices for salesman ledger:', err));
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter props entries
  const propFilteredEntries = ledgerEntries.filter(
    l => l.salesmanId === selectedSalesmanId || (currentSalesman && l.account.toLowerCase().includes(currentSalesman.name.toLowerCase()))
  );

  // W2-9 fix: If no prop ledger entries exist, synthesize live commission entries from sale invoices
  const dynamicEntries: SalesmanLedgerEntry[] = (propFilteredEntries.length > 0)
    ? propFilteredEntries
    : liveSalesInvoices
        .filter(inv => {
          if (!currentSalesman) return false;
          const rawSmId = parseInt(String(currentSalesman.id).replace(/\D/g, ''), 10);
          return (
            inv.salesman_id === rawSmId ||
            (inv.salesman_code && inv.salesman_code.toLowerCase() === currentSalesman.code.toLowerCase()) ||
            (inv.customer_name && inv.customer_name.toLowerCase().includes(currentSalesman.name.toLowerCase()))
          );
        })
        .map((inv, idx) => {
          const commRate = currentSalesman?.commissionRate || 2.5;
          const commAmt = Number(((inv.grand_total * commRate) / 100).toFixed(2));
          return {
            id: `dyn-sm-${inv.id || idx}`,
            salesmanId: selectedSalesmanId,
            date: inv.date || inv.invoice_date || new Date().toLocaleDateString('en-GB'),
            account: currentSalesman?.name || 'Sales Staff',
            voucherNo: inv.invoice_no,
            voucherType: 'Sales',
            particulars: `Sales Commission on Bill ${inv.invoice_no}`,
            debit: 0,
            credit: commAmt,
            balance: commAmt
          };
        });

  const filteredEntries = dynamicEntries;
  const totalDebit = filteredEntries.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = filteredEntries.reduce((sum, l) => sum + (l.credit || 0), 0);
  const netCrBalance = (currentSalesman?.balance !== undefined && currentSalesman.balance > 0)
    ? currentSalesman.balance
    : (totalCredit - totalDebit);

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
          maxWidth: '96vw',
          height: '92vh',
          maxHeight: '94vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onClose}
              title="Close [Esc]"
              style={{
                background: '#dc2626',
                border: '1px solid #b91c1c',
                color: '#ffffff',
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>✕</span>
              <span>EXIT [Esc]</span>
            </button>
          </div>
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
              onClick={() => window.print()}
              title="Print to PDF"
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

            {/* Excel / CSV Export Button */}
            <button
              onClick={() => {
                const headers = ['Date', 'Particulars', 'Debit', 'Credit', 'Balance'];
                const rows = filteredEntries.map(e => [
                  e.date || '',
                  e.particulars || '',
                  e.debit || 0,
                  e.credit || 0,
                  e.balance || 0
                ]);
                exportToCsv(`Salesman_Ledger_${currentSalesman?.name || 'Statement'}`, headers, rows);
              }}
              title="Download Excel CSV Spreadsheet"
              style={{
                backgroundColor: '#15803d',
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
              <span style={{ fontSize: '16px' }}>📊 Excel</span>
              <span>CSV</span>
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
                onClick={() => {
                  const subject = encodeURIComponent(`Salesman Ledger Statement - ${currentSalesman?.name || 'Statement'}`);
                  const body = encodeURIComponent(`Dear ${currentSalesman?.name || 'Staff'},\n\nYour net ledger balance at Shree Vinayaka Furnitures is Cr. ₹${netCrBalance.toFixed(2)}.\n\nTotal Credits: ₹${totalCredit.toFixed(2)}\nTotal Debits: ₹${totalDebit.toFixed(2)}\n\nThank you!`);
                  window.open(`mailto:${emailId}?subject=${subject}&body=${body}`, '_blank');
                }}
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

            {/* WhatsApp Integration Button */}
            <button
              onClick={() => {
                const cleanPhone = whatsappNo.replace(/\D/g, '');
                const msg = encodeURIComponent(`Dear ${currentSalesman?.name || 'Staff'},\nYour statement summary from Shree Vinayaka Furnitures:\nNet Balance: Cr. ₹${netCrBalance.toFixed(2)}\nCredits: ₹${totalCredit.toFixed(2)}\nDebits: ₹${totalDebit.toFixed(2)}`);
                window.open(`https://wa.me/${cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : ''}?text=${msg}`, '_blank');
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #16a34a',
                color: '#16a34a',
                padding: '6px 4px',
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
              <span>WhatsApp (F9)</span>
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
                width: '100%',
                maxWidth: '700px',
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
                  <div>{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                  <div style={{ marginTop: '2px' }}>( From 01/04/{new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1} To {new Date().toLocaleDateString('en-GB')} )</div>
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
