import { useState } from 'react';
import type { DSaleBill } from '../../types/retailDaddy';

interface DSaleReportViewProps {
  dBills: DSaleBill[];
  onClose: () => void;
}

export function DSaleReportView({ dBills, onClose }: DSaleReportViewProps) {
  const [copies, setCopies] = useState(1);
  const [emailInput, setEmailInput] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState(
    'Dear Sir/Madam, Please find the attached Direct Sale Summary Report from Shree Vinayaka Furnitures.'
  );
  const [zoomFactor, setZoomFactor] = useState(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const grandTotalAll = dBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalPaidAll = dBills.reduce((sum, b) => sum + b.totalPaid, 0);
  const balanceAll = grandTotalAll - totalPaidAll;

  const handlePrint = () => {
    window.print();
    showToast(`Printing ${copies} copy of D-Sale Report [F6]`);
  };

  const handleDownloadPdf = () => {
    showToast('Exporting D-Sale Report to PDF [F7]...');
  };

  const handleSendEmail = () => {
    if (!emailInput.trim()) {
      alert('Please enter a valid email address');
      return;
    }
    showToast(`Report emailed to ${emailInput} [F8]`);
  };

  const handleSendWhatsApp = (gateway: 'Tejas' | 'Rocket' | 'Agni') => {
    if (!whatsappNo.trim()) {
      alert('Please enter a valid WhatsApp phone number');
      return;
    }
    showToast(`D-Sale Report dispatched via ${gateway} gateway to +91 ${whatsappNo}`);
  };

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 1300
        }}>
          {toastMessage}
        </div>
      )}

      {/* WINDOW TITLEBAR */}
      <div
        className="rd-dialog-titlebar"
        style={{
          background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
          color: '#ffffff',
          padding: '6px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '13px'
        }}
      >
        <span>Print Preview - D-Sale Direct Billing Report</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', background: '#2563eb', padding: '2px 8px', borderRadius: '3px' }}>
            Isolated Non-Inventory Register
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* TOP REPORT TOOLBAR (MATCHING FRAME 085) */}
      <div style={{
        background: '#e2e8f0',
        borderBottom: '1px solid #cbd5e1',
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px'
      }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #94a3b8',
          borderBottom: 'none',
          padding: '4px 12px',
          fontWeight: 'bold',
          borderRadius: '4px 4px 0 0'
        }}>
          Main Report
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button className="rd-grid-btn" onClick={handlePrint} title="Print Report">
            🖨️
          </button>
          <button className="rd-grid-btn" onClick={() => setZoomFactor(prev => Math.max(50, prev - 10))} title="Zoom Out">
            🔍-
          </button>
          <button className="rd-grid-btn" onClick={() => setZoomFactor(prev => Math.min(150, prev + 10))} title="Zoom In">
            🔍+
          </button>
          <span style={{ fontWeight: 'bold' }}>Zoom: {zoomFactor}%</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto' }}>
          <button className="rd-grid-btn">|&lt;</button>
          <button className="rd-grid-btn">&lt;</button>
          <span style={{ fontWeight: 'bold' }}>Page 1 of 1</span>
          <button className="rd-grid-btn">&gt;</button>
          <button className="rd-grid-btn">&gt;|</button>
        </div>
      </div>

      {/* MAIN CONTAINER: SIDEBAR + REPORT PREVIEW CANVAS */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT SIDEBAR CONTROLS (MATCHING FRAME 085) */}
        <div style={{
          width: '180px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderRight: '2px solid #334155',
          overflowY: 'auto'
        }}>
          {/* Copies Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
            <span>No(s) of Copy :</span>
            <input
              type="number"
              min={1}
              max={10}
              value={copies}
              onChange={e => setCopies(parseInt(e.target.value) || 1)}
              style={{ width: '45px', textAlign: 'center', padding: '2px', fontSize: '11px', fontWeight: 'bold' }}
            />
          </div>

          {/* Big Blue Print F6 */}
          <button
            onClick={handlePrint}
            style={{
              background: '#2563eb',
              border: '2px solid #1d4ed8',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '10px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '28px' }}>🖨️</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', alignSelf: 'flex-end', paddingRight: '4px' }}>F6</span>
          </button>

          {/* Red PDF F7 */}
          <button
            onClick={handleDownloadPdf}
            style={{
              background: '#ffffff',
              border: '2px solid #dc2626',
              borderRadius: '6px',
              color: '#dc2626',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>PDF</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', alignSelf: 'flex-end', paddingRight: '4px', color: '#64748b' }}>F7</span>
          </button>

          {/* Email Section */}
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>
            Enter Valid Email ID :
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="client@mail.com"
              style={{ width: '100%', padding: '3px 4px', fontSize: '10px', marginTop: '2px' }}
            />
          </div>

          {/* Orange Email Button F8 */}
          <button
            onClick={handleSendEmail}
            style={{
              background: '#ea580c',
              border: '2px solid #c2410c',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '24px' }}>✉️</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', alignSelf: 'flex-end', paddingRight: '4px' }}>F8</span>
          </button>

          {/* WhatsApp Section */}
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '4px' }}>
            Enter Valid WhatsApp No. :
            <input
              type="text"
              value={whatsappNo}
              onChange={e => setWhatsappNo(e.target.value)}
              placeholder="9845012345"
              style={{ width: '100%', padding: '3px 4px', fontSize: '10px', marginTop: '2px' }}
            />
          </div>

          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
            Text Message to WhatsApp :
            <textarea
              rows={2}
              value={whatsappMsg}
              onChange={e => setWhatsappMsg(e.target.value)}
              style={{ width: '100%', padding: '3px 4px', fontSize: '9px', marginTop: '2px', resize: 'none' }}
            />
          </div>

          {/* WhatsApp Gateways (Tejas, Rocket, Agni - F9) */}
          <button
            onClick={() => handleSendWhatsApp('Tejas')}
            style={{
              background: '#ffffff',
              border: '2px solid #16a34a',
              borderRadius: '4px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>Tejas</span>
          </button>

          <button
            onClick={() => handleSendWhatsApp('Rocket')}
            style={{
              background: '#ffffff',
              border: '2px solid #16a34a',
              borderRadius: '4px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>Rocket</span>
          </button>

          <button
            onClick={() => handleSendWhatsApp('Agni')}
            style={{
              background: '#ffffff',
              border: '2px solid #16a34a',
              borderRadius: '4px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>Agni - F9</span>
          </button>
        </div>

        {/* RIGHT CANVAS: REPORT SHEET (MATCHING FRAME 085) */}
        <div style={{
          flex: 1,
          background: '#64748b',
          overflow: 'auto',
          padding: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {/* White Paper Sheet */}
          <div style={{
            background: '#ffffff',
            width: '740px',
            minHeight: '850px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            padding: '36px',
            boxSizing: 'border-box',
            transform: `scale(${zoomFactor / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}>
            {/* Header info */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
                DIRECT SALE (D-SALE) SUMMARY REPORT
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                Shree Vinayaka Furnitures | As on: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>

            {/* Total Sales / Year Chart (Frame 085 recreation) */}
            <div style={{
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px',
              background: '#fafafa'
            }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>
                Total Sales / Year
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', height: '170px', padding: '0 40px 10px 40px', borderBottom: '2px solid #334155' }}>
                {/* Y-Axis scale */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: '9px', color: '#64748b', paddingRight: '12px' }}>
                  <span>4500</span>
                  <span>3500</span>
                  <span>2500</span>
                  <span>1500</span>
                  <span>500</span>
                  <span>0</span>
                </div>

                {/* Bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '180px',
                    height: '90%',
                    background: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                  }}>
                    ₹ {grandTotalAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                    {new Date().getFullYear()}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#334155' }}>
                  <div style={{ width: '12px', height: '12px', background: '#1d4ed8' }} />
                  <span>{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              marginBottom: '20px'
            }}>
              <thead>
                <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px' }}>S.N.</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px' }}>Invoice No.</th>
                  <th style={{ textAlign: 'center', padding: '6px 4px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px' }}>Customer Name</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px' }}>Grand Total</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px' }}>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {dBills.map((bill, index) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 4px' }}>{index + 1}</td>
                    <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{bill.invoiceNo}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{bill.date}</td>
                    <td style={{ padding: '6px 4px' }}>{bill.customerName}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                      {bill.grandTotal.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                      {bill.totalPaid.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Box (Frame 085 bottom right box) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                width: '240px',
                border: '1px solid #334155',
                padding: '8px 12px',
                fontSize: '11px',
                lineHeight: '1.8'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Grand Total :</span>
                  <span>{grandTotalAll.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Paid :</span>
                  <span>{totalPaidAll.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '2px', color: balanceAll > 0 ? '#b91c1c' : '#0f172a' }}>
                  <span>Balance :</span>
                  <span>{balanceAll.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', fontSize: '10px', color: '#64748b', textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
              *** END OF D-SALE AUDIT REPORT ***
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUSBAR */}
      <div style={{
        background: '#f1f5f9',
        borderTop: '1px solid #cbd5e1',
        padding: '3px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#475569'
      }}>
        <span>Current Page No.: 1</span>
        <span>Total Page No.: 1</span>
        <span>Zoom Factor: {zoomFactor}%</span>
      </div>
    </div>
  );
}
