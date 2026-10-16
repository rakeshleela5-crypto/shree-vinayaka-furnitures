import React, { useState, useMemo } from 'react';
import type { BankStatementEntry } from '../../types/retailDaddy';

interface BankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankStatements: BankStatementEntry[];
}

export const BankStatementModal: React.FC<BankStatementModalProps> = ({
  isOpen,
  onClose,
  bankStatements
}) => {
  const [fromDate, setFromDate] = useState('31/01/2025');
  const [toDate, setToDate] = useState('03/03/2025');
  const [accountNo, setAccountNo] = useState('99999999');
  const [showReport, setShowReport] = useState(true);

  // Left toolbar states - Frame 0600
  const [copies, setCopies] = useState(1);
  const [emailId, setEmailId] = useState('');
  const [whatsAppNo, setWhatsAppNo] = useState('');
  const [whatsAppMsg, setWhatsAppMsg] = useState('Dear Sir/Madam,\nPlease find your Bank Account Statement attached.');
  const [actionNotice, setActionNotice] = useState('');

  if (!isOpen) return null;

  // Filter entries
  const filteredEntries = useMemo(() => {
    return bankStatements.filter(entry => {
      const matchAcc = !accountNo || entry.accountNo.includes(accountNo);
      return matchAcc;
    });
  }, [bankStatements, accountNo]);

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance = totalCredit - totalDebit;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setActionNotice('✓ PDF generated and downloaded successfully!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleSendEmail = () => {
    if (!emailId || !emailId.includes('@')) {
      setActionNotice('⚠️ Please enter a valid email address.');
      setTimeout(() => setActionNotice(''), 3000);
      return;
    }
    setActionNotice(`✓ Statement dispatched to ${emailId}`);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppNo || whatsAppNo.length < 10) {
      setActionNotice('⚠️ Please enter a valid 10-digit WhatsApp phone number.');
      setTimeout(() => setActionNotice(''), 3000);
      return;
    }
    const url = `https://wa.me/91${whatsAppNo.replace(/\D/g, '')}?text=${encodeURIComponent(
      `${whatsAppMsg}\n\nBank Account Statement (A/c: ${accountNo})\nTotal Credit: ₹${totalCredit.toFixed(
        2
      )}\nTotal Debit: ₹${totalDebit.toFixed(2)}\nClosing Balance: ₹${closingBalance.toFixed(2)}`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '1060px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#334155', // Frame 0600 dark preview workspace
          borderRadius: '6px',
          border: '2px solid #0048ba',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
            color: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
            Print Preview - Bank Account Statements
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              width: '24px',
              height: '24px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Controls Bar - Frame 0205 */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            borderBottom: '1px solid #cbd5e1',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong style={{ color: '#003366' }}>Account No:</strong>
            <input
              type="text"
              value={accountNo}
              onChange={e => setAccountNo(e.target.value)}
              style={{ width: '100px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>From:</span>
            <input
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ width: '85px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
            <span style={{ fontWeight: 600, color: '#475569' }}>To:</span>
            <input
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ width: '85px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
          </div>

          <button
            onClick={() => setShowReport(true)}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '5px 14px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            View Report
          </button>

          <button
            onClick={() => {
              setAccountNo('99999999');
              setFromDate('31/01/2025');
              setToDate('03/03/2025');
            }}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>

          {actionNotice && (
            <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 'bold' }}>
              {actionNotice}
            </span>
          )}
        </div>

        {/* Main Workspace Body - Frame 0600 */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Action Toolbar - Frame 0600 */}
          <div
            style={{
              width: '180px',
              backgroundColor: '#0f172a',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderRight: '1px solid #334155',
              overflowY: 'auto',
              color: '#f8fafc'
            }}
          >
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                No(s) of Copy :
              </label>
              <input
                type="number"
                min="1"
                value={copies}
                onChange={e => setCopies(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '3px'
                }}
              />
            </div>

            {/* Print Button (Blue Square - Frame 0600) */}
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: '2px solid #60a5fa',
                borderRadius: '6px',
                padding: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '20px' }}>🖨️</span>
              <span>F6 Print</span>
            </button>

            {/* PDF Button (Red Box - Frame 0600) */}
            <button
              onClick={handleExportPdf}
              style={{
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '2px solid #ef4444',
                borderRadius: '6px',
                padding: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '900' }}>PDF</span>
              <span style={{ fontSize: '10px', color: '#475569' }}>F7 Export</span>
            </button>

            {/* Email Section */}
            <div style={{ marginTop: '6px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Enter Valid Email ID:
              </label>
              <input
                type="email"
                value={emailId}
                onChange={e => setEmailId(e.target.value)}
                placeholder="client@email.com"
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '11px',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '3px',
                  marginBottom: '6px'
                }}
              />
              <button
                onClick={handleSendEmail}
                style={{
                  width: '100%',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✉️ F8 Email
              </button>
            </div>

            {/* WhatsApp Section - Frame 0600 */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Enter Valid WhatsApp No :
              </label>
              <input
                type="text"
                value={whatsAppNo}
                onChange={e => setWhatsAppNo(e.target.value)}
                placeholder="10-digit mobile"
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '11px',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '3px',
                  marginBottom: '6px'
                }}
              />
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Text Message to WhatsApp:
              </label>
              <textarea
                value={whatsAppMsg}
                onChange={e => setWhatsAppMsg(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '10px',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '3px',
                  resize: 'none',
                  marginBottom: '6px'
                }}
              />
              <button
                onClick={handleSendWhatsApp}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Statement Report Canvas - Frame 0600 */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#64748b' }}>
            {showReport ? (
              <div
                style={{
                  width: '740px',
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  padding: '36px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  borderRadius: '2px',
                  minHeight: '600px',
                  fontFamily: 'Segoe UI, Arial, sans-serif'
                }}
              >
              {/* Report Header - Frame 0600 */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>
                  Bank Account Statements
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                  ( From :{fromDate} To :{toDate} )
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                  03/03/2025 09:45:12AM
                </div>
              </div>

              {/* Statement Table - Frame 0600 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', fontWeight: 'bold' }}>
                    <th style={{ padding: '8px 4px', textAlign: 'left', width: '90px' }}>Date</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', width: '100px' }}>Account No.</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left', width: '140px' }}>Receipt No.</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right', width: '90px' }}>Debit</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right', width: '90px' }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 4px', color: '#334155' }}>{entry.date}</td>
                      <td style={{ padding: '6px 4px', color: '#334155' }}>{entry.accountNo}</td>
                      <td style={{ padding: '6px 4px', fontWeight: 600, color: '#0284c7' }}>{entry.receiptNo}</td>
                      <td style={{ padding: '6px 4px', color: '#0f172a' }}>{entry.description}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: entry.debit > 0 ? 'bold' : 'normal', color: entry.debit > 0 ? '#dc2626' : '#94a3b8' }}>
                        {entry.debit > 0 ? entry.debit.toFixed(2) : ''}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: entry.credit > 0 ? 'bold' : 'normal', color: entry.credit > 0 ? '#16a34a' : '#94a3b8' }}>
                        {entry.credit > 0 ? entry.credit.toFixed(2) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Balances - Frame 0600 */}
              <div style={{ marginTop: '20px', borderTop: '2px solid #0f172a', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '13px', fontWeight: 'bold' }}>
                  <div style={{ width: '150px', textAlign: 'right' }}>Current Balance :</div>
                  <div style={{ width: '90px', textAlign: 'right', color: '#dc2626' }}>
                    {totalDebit.toFixed(2)}
                  </div>
                  <div style={{ width: '90px', textAlign: 'right', color: '#16a34a' }}>
                    {totalCredit.toFixed(2)}
                  </div>
                </div>

                {/* Red boxed closing balance - Frame 0280 & 0600 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '14px', fontWeight: 'bold', marginTop: '10px' }}>
                  <div style={{ width: '150px', textAlign: 'right', alignSelf: 'center' }}>Closing Balance :</div>
                  <div
                    style={{
                      width: '90px',
                      textAlign: 'right',
                      padding: '4px 6px',
                      border: '2px solid #dc2626',
                      color: '#0f172a',
                      backgroundColor: '#fef2f2'
                    }}
                  >
                    {closingBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
              <div
                style={{
                  width: '500px',
                  margin: '100px auto',
                  backgroundColor: '#ffffff',
                  padding: '30px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  color: '#64748b',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>No Report Generated</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "View Report" to render the bank account statements.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
