import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { CompanyInfo, BillTemplateConfig, CartItem, Customer } from '../../types/retailDaddy';
import { printDirectThermal, type EscPosBillData } from '../../utils/escpos';
import { api, sendInvoiceEmail } from '../../api/client';

interface BillTemplatePreviewProps {
  companyInfo: CompanyInfo;
  config: BillTemplateConfig;
  billData: {
    invoiceNo: string;
    date: string;
    customer: Customer;
    items: CartItem[];
    totalQty: number;
    totalTax: number;
    totalDisc: number;
    totalMrp: number;
    netPay: number;
    taxScheme?: 'GST' | 'NON_GST' | 'COMPOSITION';
    salesReturnAdjusted?: number;
    salesReturnNo?: string;
    loyaltyPointsEarned?: number;
    loyaltyPointsUsed?: number;
    loyaltyAmtUsed?: number;
    balanceLoyaltyPoints?: number;
    creditDays?: number;
    dueDate?: string;
    paymentMode?: string;
  };
  isPrintMode?: boolean;
}

export function BillTemplatePreview({
  companyInfo,
  config,
  billData,
  isPrintMode = false
}: BillTemplatePreviewProps) {
  const { paperFormat, styleIndex } = config;
  const { customer, items, invoiceNo, date, totalQty, totalTax, totalDisc, netPay, taxScheme } = billData;

  // Video 14 Intra-State vs Inter-State GST Totals (Frames 0102, 0110, 0145)
  const isInterState = (customer.state || '').toLowerCase() !== (companyInfo.state || 'Kerala').toLowerCase();
  const totalCgst = items.reduce((acc, it) => acc + (it.cgstAmt || 0), 0);
  const totalSgst = items.reduce((acc, it) => acc + (it.sgstAmt || 0), 0);
  const totalIgst = items.reduce((acc, it) => acc + (it.igstAmt || 0), 0);

  const [copies, setCopies] = useState<number>(1);
  const [emailId, setEmailId] = useState<string>('');
  const [whatsappNo, setWhatsappNo] = useState<string>(customer.phone || '88899');
  const [whatsappMsg, setWhatsappMsg] = useState<string>(
    `Dear Sir/Madam, Please find the invoice ${invoiceNo} for ₹${netPay.toFixed(2)} from ${companyInfo.name}. Thank you for your business!`
  );
  // Video 15 Frame 0310: Print Preview Zoom Factor State
  // Video 15 Frame 0310: Print Preview Zoom Factor State
  const [zoomFactor, setZoomFactor] = useState<number>(100);
  const [showZoomMenu, setShowZoomMenu] = useState<boolean>(false);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const totalPreviewPages = Math.max(1, Math.ceil((items.length || 1) / 10));
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const storeUpiId = companyInfo.email?.includes('@') && !companyInfo.email.includes('.com')
    ? companyInfo.email
    : 'shreevinayakafurnitures@icici';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(companyInfo.name)}&am=${netPay.toFixed(2)}&cu=INR&tr=${encodeURIComponent(invoiceNo)}`;
  const [qrImageSrc, setQrImageSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUrl, { errorCorrectionLevel: 'M', margin: 1, width: 200 })
      .then(url => {
        if (active) setQrImageSrc(url);
      })
      .catch(err => {
        console.error('Failed to generate offline UPI QR', err);
      });
    return () => {
      active = false;
    };
  }, [upiUrl]);

  // Convert number to Indian words
  const numberToWords = (num: number): string => {
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const n = Math.floor(num);
    if (n === 0) return 'ZERO RUPEES ONLY';
    const makeWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
      if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + makeWords(n % 100);
      if (n < 100000) return makeWords(Math.floor(n / 1000)) + 'THOUSAND ' + makeWords(n % 1000);
      if (n < 10000000) return makeWords(Math.floor(n / 100000)) + 'LAKH ' + makeWords(n % 100000);
      return '';
    };
    return ('RUPEES ' + makeWords(n) + 'ONLY').trim();
  };

  // Dedicated Showroom Bank Transfer Information Block (NEFT / RTGS)
  const renderBankDetailsSection = (compact = false) => {
    const bankName = companyInfo.bankName || 'State Bank of India';
    const accName = companyInfo.accountName || companyInfo.name || 'SHREE VINAYAKA FURNITURES';
    const accNo = companyInfo.accountNo || '389201948123';
    const ifsc = companyInfo.ifsc || 'SBIN0070119';
    const branch = companyInfo.branch || 'Vaikom Main Branch';
    const accType = companyInfo.accountType || 'Current Account';
    const creditDays = billData.creditDays;
    const dueDate = billData.dueDate;

    if (compact) {
      return (
        <div style={{
          borderTop: '1px dashed #000',
          marginTop: '6px',
          paddingTop: '4px',
          fontSize: '8.5px',
          lineHeight: '1.3',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 'bold' }}>BANK TRANSFER (NEFT/RTGS):</div>
          <div>Bank: {bankName} ({accType})</div>
          <div>A/C No: <strong>{accNo}</strong> | IFSC: <strong>{ifsc}</strong></div>
          <div>A/C Name: {accName}</div>
          {dueDate && (
            <div style={{ color: '#b91c1c', fontWeight: 'bold', marginTop: '2px' }}>
              Due Date: {dueDate} ({creditDays ? `${creditDays} Days Credit` : 'Credit'})
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{
        marginTop: '8px',
        border: '1.5px solid #1e3a8a',
        borderRadius: '3px',
        padding: '6px 10px',
        background: '#f8fafc',
        fontSize: '10px',
        lineHeight: '1.4'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '4px' }}>
          <div style={{ fontWeight: '900', color: '#1e3a8a', fontSize: '11px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🏦</span> DIRECT BANK TRANSFER DETAILS (NEFT / RTGS / IMPS)
          </div>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e40af', background: '#dbeafe', padding: '1px 5px', borderRadius: '3px' }}>
            {accType.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '4px 12px' }}>
          <div>
            <div><strong>Bank Name:</strong> {bankName}</div>
            <div><strong>Beneficiary / A/C Name:</strong> {accName}</div>
            <div><strong>Branch:</strong> {branch}</div>
          </div>
          <div>
            <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', color: '#0f172a' }}>{accNo}</span></div>
            <div><strong>IFSC Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>{ifsc}</span></div>
            {dueDate ? (
              <div style={{ color: '#b91c1c', fontWeight: 'bold', marginTop: '1px' }}>
                Payment Due Date: <span style={{ textDecoration: 'underline' }}>{dueDate}</span> ({creditDays ? `${creditDays} Days Term` : 'Credit'})
              </div>
            ) : (
              <div style={{ color: '#15803d', fontWeight: 'bold' }}>Payment Mode: Bank Transfer / Credit</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      showNotice('Generating official GST Tax Invoice PDF...', 'info');
      await api.downloadInvoicePdf(invoiceNo);
      showNotice(`✓ GST Tax Invoice PDF downloaded for ${invoiceNo}`, 'success');
    } catch (err: any) {
      showNotice(`PDF server busy: ${err.message}. Using browser print fallback.`, 'error');
      window.print();
    }
  };

  const handleDirectThermalPrint = async () => {
    showNotice('Sending raw ESC/POS commands to thermal printer...', 'info');
    const escPosData: EscPosBillData = {
      invoiceNo,
      date,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerGstin: customer.gstin,
      items: items.map(it => ({
        name: it.name,
        qty: it.qty,
        rate: it.rate,
        total: it.total,
        taxPercent: (it.cgstPercent || 0) + (it.sgstPercent || 0) + (it.igstPercent || 0),
        hsn: it.hsn,
        barcode: it.barcode
      })),
      subTotal: items.reduce((acc, it) => acc + (it.taxable || it.rate * it.qty * 0.82), 0),
      cgstTotal: totalCgst,
      sgstTotal: totalSgst,
      grandTotal: netPay,
      paidAmount: (billData as any).paidAmount ?? netPay,
      balanceDue: (billData as any).balanceDue ?? 0,
      paymentMode: (billData as any).paymentMode || 'Cash'
    };

    const res = await printDirectThermal(escPosData, companyInfo, 80);
    if (res.success) {
      showNotice(`✓ ${res.message}`, 'success');
    } else {
      showNotice(`Thermal printer: ${res.message}`, 'error');
    }
  };

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!emailId || !emailId.trim()) {
      showNotice('Please enter a valid recipient email address.', 'error');
      return;
    }
    setIsSendingEmail(true);
    showNotice(`Dispatching Tax Invoice PDF to ${emailId}...`, 'info');
    try {
      const res = await sendInvoiceEmail(
        invoiceNo,
        emailId.trim(),
        `Dear ${customer.name || 'Valued Customer'},\n\nPlease find attached your official Tax Invoice #${invoiceNo} for Rs.${netPay.toLocaleString('en-IN')}.\n\nThank you for choosing Shree Vinayaka Furnitures!`,
        `Tax Invoice #${invoiceNo} - Shree Vinayaka Furnitures`
      );
      if (res && res.success) {
        showNotice(`✓ Invoice #${invoiceNo} with PDF attached emailed to ${emailId}!`, 'success');
      } else {
        showNotice(`Email status: ${res?.message || 'Check Email Settings'}`, 'error');
      }
    } catch (err: any) {
      showNotice(`Email dispatch failed: ${err.message}. Please configure Gmail App Password in Email Settings.`, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = (_service: string) => {
    if (!whatsappNo) {
      showNotice('Please enter a valid WhatsApp mobile number.', 'error');
      return;
    }
    const cleanNum = whatsappNo.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, '_blank');
  };

  // ==========================================
  // SIDEBAR FOR VIDEO 17 PRINT PREVIEW (Frames 0165 & 0195)
  // ==========================================
  const renderSidebar = () => {
    if (isPrintMode) return null;
    return (
      <div style={{
        width: '180px',
        background: '#f1f5f9',
        borderRight: '1px solid #cbd5e1',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '11px',
        flexShrink: 0
      }}>
        {actionNotice && (
          <div style={{
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            background: actionNotice.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: actionNotice.type === 'error' ? '#991b1b' : '#15803d',
            border: `1px solid ${actionNotice.type === 'error' ? '#fca5a5' : '#86efac'}`
          }}>
            {actionNotice.text}
          </div>
        )}

        {/* Copies */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold' }}>No(s) of Copy :</span>
          <input
            type="number"
            min="1"
            value={copies}
            onChange={e => setCopies(Math.max(1, Number(e.target.value)))}
            style={{ width: '45px', padding: '2px 4px', border: '1px solid #94a3b8', textAlign: 'center', fontWeight: 'bold' }}
          />
        </div>

        {/* Big Print Button F6 (Browser Print) */}
        <button
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
            color: '#ffffff',
            border: '2px solid #1e3a8a',
            borderRadius: '4px',
            padding: '8px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Print formatted bill via standard browser printer dialog"
        >
          <span style={{ fontSize: '20px' }}>🖨️</span>
          <span style={{ fontWeight: '900', fontSize: '11px' }}>PRINT [F6]</span>
        </button>

        {/* Direct Raw ESC/POS Thermal Button */}
        <button
          onClick={handleDirectThermalPrint}
          style={{
            background: 'linear-gradient(180deg, #0f766e 0%, #115e59 100%)',
            color: '#ffffff',
            border: '2px solid #042f2e',
            borderRadius: '4px',
            padding: '8px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Direct Silent Raw ESC/POS Thermal Roll Print (Web Serial / POS-80)"
        >
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span style={{ fontWeight: '900', fontSize: '11px' }}>ESC/POS RAW</span>
          <span style={{ fontSize: '9px', opacity: 0.85 }}>80mm Silent</span>
        </button>

        {/* Official GST PDF Button F7 */}
        <button
          onClick={handleDownloadPdf}
          style={{
            background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
            color: '#ffffff',
            border: '2px solid #b91c1c',
            borderRadius: '4px',
            padding: '8px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Download Official GST Tax Invoice PDF from Railway Cloud backend"
        >
          <span style={{ fontSize: '20px' }}>📄</span>
          <span style={{ fontWeight: '900', fontSize: '11px' }}>GST PDF [F7]</span>
          <span style={{ fontSize: '9px', opacity: 0.85 }}>R2 Cloud Archive</span>
        </button>

        {/* Email ID Section */}
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Enter Valid Email ID :</span>
          <input
            type="email"
            value={emailId}
            placeholder="customer@email.com"
            onChange={e => setEmailId(e.target.value)}
            style={{ width: '100%', padding: '3px 4px', border: '1px solid #94a3b8', fontSize: '10px', marginTop: '2px', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            style={{
              marginTop: '4px',
              width: '100%',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              padding: '5px',
              fontWeight: 'bold',
              fontSize: '10px',
              borderRadius: '2px',
              cursor: isSendingEmail ? 'not-allowed' : 'pointer',
              opacity: isSendingEmail ? 0.6 : 1
            }}
          >
            {isSendingEmail ? '✉️ Sending...' : '✉️ Email [F8]'}
          </button>
        </div>

        {/* WhatsApp Section */}
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '10px' }}>Enter Valid WhatsApp No. :</span>
          <input
            type="text"
            value={whatsappNo}
            onChange={e => setWhatsappNo(e.target.value)}
            style={{ width: '100%', padding: '3px 4px', border: '1px solid #94a3b8', fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '2px', boxSizing: 'border-box' }}
          />
          <span style={{ fontWeight: 'bold', fontSize: '9px', display: 'block', marginTop: '4px' }}>Text Message to WhatsApp :</span>
          <textarea
            value={whatsappMsg}
            onChange={e => setWhatsappMsg(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '3px 4px', border: '1px solid #94a3b8', fontSize: '9px', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            <button
              onClick={() => handleSendWhatsApp('Tejas')}
              style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '4px', fontWeight: 'bold', fontSize: '10px', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              💬 Tejas
            </button>
            <button
              onClick={() => handleSendWhatsApp('Rocket')}
              style={{ background: '#15803d', color: '#ffffff', border: 'none', padding: '4px', fontWeight: 'bold', fontSize: '10px', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              🚀 Rocket
            </button>
            <button
              onClick={() => handleSendWhatsApp('Agni')}
              style={{ background: '#166534', color: '#ffffff', border: 'none', padding: '4px', fontWeight: 'bold', fontSize: '10px', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              ⚡ Agni - F9
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 1. 3-INCH THERMAL TEMPLATES (10 STYLES)
  // ==========================================
  if (paperFormat === '3INCH') {
    const isHindi = styleIndex === 3;
    const isBoxed = styleIndex === 4 || styleIndex === 6;
    const isCompact = styleIndex === 8;
    const isQrFocus = styleIndex === 7;
    const isMagentaBanner = styleIndex === 5;

    return (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        {renderSidebar()}
        <div
          className="bill-thermal-container"
          style={{
            width: '320px',
            background: '#ffffff',
            color: '#000000',
            fontFamily: isHindi ? 'sans-serif' : 'monospace',
            fontSize: isCompact ? '10px' : '11px',
            padding: isCompact ? '8px' : '14px',
            border: isPrintMode ? 'none' : '1px solid #94a3b8',
            boxShadow: isPrintMode ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Brand Logo / Header (Video 09 Frame 0055) */}
          <div style={{ textAlign: 'center', marginBottom: isCompact ? '4px' : '8px' }}>
            {companyInfo.logo && (
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <img
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain' }}
                />
              </div>
            )}
            {isMagentaBanner ? (
              <div style={{
                background: '#d946ef',
                color: '#ffffff',
                padding: '6px',
                fontWeight: '900',
                fontSize: '15px',
                letterSpacing: '1px',
                borderRadius: '2px',
                marginBottom: '6px'
              }}>
                {companyInfo.name.toUpperCase()}
              </div>
            ) : (
              <div style={{ fontWeight: '900', fontSize: isCompact ? '13px' : '15px', color: '#000000' }}>
                {isHindi ? 'श्री विनायक फर्निचर्स' : companyInfo.name.toUpperCase()}
              </div>
            )}

            <div style={{ fontSize: '10px' }}>{companyInfo.address}, {companyInfo.city}</div>
            <div style={{ fontSize: '10px' }}>
              {taxScheme === 'COMPOSITION' ? 'COMPOSITION DEALER - NOT ELIGIBLE TO COLLECT TAX' : `GSTIN: ${companyInfo.gstin}`}
            </div>
            {companyInfo.phone && <div style={{ fontSize: '10px' }}>Mob: {companyInfo.phone}</div>}
          </div>

          <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />

          {/* Bill Meta */}
          <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bill No: <strong>{invoiceNo}</strong></span>
              <span>Date: <strong>{date}</strong></span>
            </div>
            <div>Cust: {customer.name} {customer.phone ? `(${customer.phone})` : ''}</div>
          </div>

          <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />

          {/* Item Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '2px 0' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '2px 0' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '2px 0' }}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td style={{ padding: '2px 0' }}>
                    <div style={{ fontWeight: 'bold' }}>{it.name}</div>
                    {it.serialNos && it.serialNos.length > 0 && (
                      <div style={{ fontSize: '9px', color: '#334155', fontStyle: 'italic', paddingLeft: '4px' }}>
                        {it.serialNos.map((sn, sIdx) => (
                          <div key={sIdx}>SN : {sn}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '2px 0' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0' }}>{it.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />

          {/* Totals */}
          <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Qty:</span>
              <span style={{ fontWeight: 'bold' }}>{totalQty.toFixed(2)}</span>
            </div>
            {totalDisc > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>₹ {totalDisc.toFixed(2)}</span>
              </div>
            )}
            {taxScheme === 'GST' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST Total:</span>
                <span>₹ {totalTax.toFixed(2)}</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: isCompact ? '12px' : '14px',
              fontWeight: '900',
              borderTop: '1px solid #000',
              borderBottom: '1px solid #000',
              padding: '3px 0',
              margin: '4px 0'
            }}>
              <span>NET PAYABLE:</span>
              <span>₹ {netPay.toFixed(2)}</span>
            </div>
          </div>

          {/* UPI QR */}
          {config.showDynamicQr && (
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <img
                src={qrImageSrc}
                alt="Dynamic UPI QR"
                style={{ width: isQrFocus ? '110px' : '90px', height: isQrFocus ? '110px' : '90px', margin: '0 auto', display: 'block' }}
              />
              <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '3px' }}>
                Scan & Pay ₹{netPay.toFixed(2)} with GPay / PhonePe / Paytm
              </div>
            </div>
          )}

          {/* Store Bank Details */}
          {renderBankDetailsSection(true)}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '9px' }}>
            *** THANK YOU! VISIT AGAIN ***<br />
            <span>Powered by Shree Vinayaka Furnitures ERP</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. QUOTATION FORMAT WITH PRODUCT IMAGES (Video 17 Frame 0165)
  // ==========================================
  if (paperFormat === 'QUOTATION') {
    return (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        {renderSidebar()}
        <div style={{
          width: '760px',
          minHeight: '920px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          padding: '24px',
          border: isPrintMode ? 'none' : '1px solid #94a3b8',
          boxShadow: isPrintMode ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            {/* Store Information Box */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '8px 12px',
              width: '420px',
              lineHeight: '1.4'
            }}>
              <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                {companyInfo.name.toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: '#334155', fontWeight: 'bold' }}>
                {companyInfo.address.toUpperCase()} {companyInfo.city.toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: '#334155' }}>{customer.state || 'Kerala'}</div>
              <div style={{ fontSize: '10px', color: '#334155' }}>{companyInfo.phone || '123456789'}</div>
              <div style={{ fontSize: '10px', color: '#334155' }}>
                E-mail: {companyInfo.email || 'yourmailid@gmail.com'}, GSTIN: {companyInfo.gstin}
              </div>
            </div>

            {/* Quotation Badge Box (Frame 0165) */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                background: '#450a0a',
                color: '#ffffff',
                textAlign: 'center',
                fontWeight: '900',
                fontSize: '15px',
                padding: '4px 0',
                borderRadius: '6px',
                letterSpacing: '1px'
              }}>
                Quotation
              </div>
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                lineHeight: '1.6'
              }}>
                <div><strong>Q.No :</strong> {invoiceNo}</div>
                <div><strong>Date :</strong> {date}</div>
              </div>
            </div>
          </div>

          {/* Customer Details Strip with Dark Blue Banner (Frame 0165) */}
          <div style={{
            border: '1px solid #1e3a8a',
            borderRadius: '4px',
            marginBottom: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1e3a8a',
              color: '#ffffff',
              padding: '3px 8px',
              fontWeight: 'bold',
              fontSize: '11px',
              letterSpacing: '0.5px'
            }}>
              Customer Details
            </div>
            <div style={{
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              lineHeight: '1.5',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{customer.name}</div>
                <div>{customer.address || 'local'}</div>
                <div>{customer.state || 'Kerala'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Contact No. :</strong> {customer.phone || '7777'}</div>
                <div><strong>GSTIN :</strong> {customer.gstin || '-'}</div>
              </div>
            </div>
          </div>

          {/* Table With Product Images (Frame 0165) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '10px',
            marginBottom: '12px',
            border: '1px solid #94a3b8'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #94a3b8', color: '#0f172a' }}>
                <th style={{ width: '35px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>Sl No</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>Product Name</th>
                <th style={{ width: '60px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>HSNC</th>
                <th style={{ width: '50px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '70px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '55px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>GST%</th>
                <th style={{ width: '80px', padding: '6px 4px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1', minHeight: '65px' }}>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{it.name}</span>
                      {/* Product Thumbnail Image (Frame 0165) */}
                      <div style={{
                        width: '52px',
                        height: '52px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '8px'
                      }}>
                        {it.photo ? (
                          <img src={it.photo} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold' }}>✕</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>{it.hsn || '80051'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{it.qty.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>{it.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>{((it.cgstPercent || 0) + (it.sgstPercent || 0)).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary Strip (Frame 0165) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 180px',
            gap: '12px',
            marginTop: 'auto',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '10px 12px',
            background: '#ffffff'
          }}>
            {/* Left: Amount In Words & Bank Details */}
            <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
              <div><strong>Net Total (In Words) :</strong> {numberToWords(netPay)}</div>
              <div style={{ marginTop: '8px', color: '#1e3a8a', fontWeight: 'bold' }}>
                <div>Bank Holder Name : {companyInfo.accountName || companyInfo.name}</div>
                <div>Bank A/c No : {companyInfo.accountNo || '38920192831'}</div>
                <div>Bank Name & Branch : {companyInfo.bankName || 'State Bank of India'} {companyInfo.branch || 'Vaikom'}</div>
                <div>IFSC : {companyInfo.ifsc || 'SBIN0070123'}</div>
              </div>
            </div>

            {/* Center: Dynamic UPI QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img src={qrImageSrc} alt="UPI QR" style={{ width: '85px', height: '85px', border: '1px solid #cbd5e1' }} />
              <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>Scan with UPI</div>
            </div>

            {/* Right: Itemized Tax Summary (Frame 0165) */}
            <div style={{ fontSize: '10.5px', lineHeight: '1.6', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Total :</span>
                <span>{(netPay - totalTax).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CGST :</span>
                <span>{(totalTax / 2).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SGST/UTGST :</span>
                <span>{(totalTax / 2).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IGST :</span>
                <span>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CESS :</span>
                <span>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '2px' }}>
                <span>Total :</span>
                <span>{netPay.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Round Off :</span>
                <span>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '3px', fontWeight: '900', fontSize: '12px' }}>
                <span>Net Total :</span>
                <span>{netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bank Transfer Details for Quotation */}
          {renderBankDetailsSection(false)}
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. BILL OF SUPPLY TEMPLATE (Video 16 Frames 0060, 0135, 0275)
  // ==========================================
  if (paperFormat === 'BILL_OF_SUPPLY') {
    return (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        {renderSidebar()}
        <div style={{
          width: '760px',
          minHeight: '940px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          padding: '16px',
          border: isPrintMode ? 'none' : '1px solid #94a3b8',
          boxShadow: isPrintMode ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Outer Bordered Page Container */}
          <div style={{ border: '1.5px solid #000', padding: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header section with Logo & Address Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                border: '1px solid #94a3b8',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#64748b',
                fontWeight: 'bold',
                textAlign: 'center',
                background: '#f8fafc'
              }}>
                NO LOGO<br />AVAILABLE
              </div>
              <div style={{
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                padding: '6px 10px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                <div>{companyInfo.address ? companyInfo.address.toUpperCase() : 'YOUR ADDRESS YOUR ADDRESS YOUR ADDRESS'}</div>
                <div style={{ fontSize: '10px', marginTop: '2px', color: '#1e293b' }}>
                  Contact : {companyInfo.phone || '123456789'} {companyInfo.gstin ? `| GSTIN : ${companyInfo.gstin}` : ''}
                </div>
              </div>
            </div>

            {/* Bill of Supply Title */}
            <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '18px', margin: '4px 0 8px 0', letterSpacing: '0.5px' }}>
              Bill of Supply
            </div>

            {/* Customer & Bill Details Box */}
            <div style={{
              border: '1px solid #000',
              padding: '6px 10px',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              fontSize: '11px',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              <div>
                <div><strong>Customer Name :</strong> {customer.name}</div>
                <div><strong>Address :</strong> {customer.address || customer.city || 'local'}</div>
                <div><strong>Contact :</strong> {customer.phone || '1234567890'}</div>
              </div>
              <div>
                <div><strong>Invoice No :</strong> {invoiceNo}</div>
                <div><strong>Date :</strong> {date}</div>
                <div><strong>Remark :</strong> B2C Counter Sale</div>
              </div>
            </div>

            {/* Mint Green Table Grid */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000',
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{ background: '#bbf7d0', borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ width: '40px', padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>S.No</th>
                  <th style={{ padding: '5px 8px', borderRight: '1px solid #000' }}>Product Name</th>
                  <th style={{ width: '90px', padding: '5px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '75px', padding: '5px 6px', borderRight: '1px solid #000', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '65px', padding: '5px 6px', borderRight: '1px solid #000', textAlign: 'right' }}>Disc %</th>
                  <th style={{ width: '85px', padding: '5px 6px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody style={{ background: '#dcfce7' }}>
                {items.map((it, idx) => (
                  <tr key={it.id || idx} style={{ borderBottom: '1px solid #bbf7d0' }}>
                    <td style={{ textAlign: 'center', padding: '5px 4px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #000' }}>
                      <div style={{ fontWeight: 'bold' }}>{it.name}</div>
                      {it.serialNos && it.serialNos.length > 0 && (
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold', paddingLeft: '8px', marginTop: '2px' }}>
                          {it.serialNos.map((sn, sIdx) => (
                            <div key={sIdx}>{sn}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                      {it.qty.toFixed(3)} {it.unit || 'PCS'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                      {it.rate.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 6px', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                      {it.discPercent ? it.discPercent.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                      {it.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Spacer rows */}
                {items.length < 6 && (
                  <tr style={{ height: `${(6 - items.length) * 28}px` }}>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>
                  <td colSpan={2} style={{ padding: '5px 8px', borderRight: '1px solid #000' }}>
                    Items : {items.length}
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 6px', borderRight: '1px solid #000' }}>
                    QTY : {totalQty.toFixed(2)}
                  </td>
                  <td colSpan={2} style={{ textAlign: 'right', padding: '5px 6px', borderRight: '1px solid #000' }}>
                    SubTotal :
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 6px' }}>
                    {netPay.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Bottom Details & Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', border: '1px solid #000', borderTop: 'none', marginTop: 'auto' }}>
              {/* Left Column: Words, Terms, QR & You Saved */}
              <div style={{ padding: '8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Net Total (In Words)</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '2px' }}>
                    {numberToWords(netPay)}
                  </div>
                  <div style={{ fontSize: '10px', textDecoration: 'underline', marginTop: '6px', fontWeight: 'bold' }}>
                    Terms & Conditions
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '10px 0 6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={qrImageSrc} alt="QR Code" style={{ width: '70px', height: '70px', border: '1px solid #000' }} />
                    <div style={{
                      border: '1.5px solid #2563eb',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      textAlign: 'center',
                      background: '#eff6ff'
                    }}>
                      <div style={{ color: '#1d4ed8', fontWeight: 'bold', fontSize: '10px' }}>YOU SAVED</div>
                      <div style={{ color: '#2563eb', fontWeight: '900', fontSize: '13px', marginTop: '2px' }}>
                        ₹ {totalDisc > 0 ? totalDisc.toFixed(2) : '15.00'}
                      </div>
                    </div>
                  </div>

                  {/* Video 13 Frames 0090 & 0240: Loyalty Point Tracker Grid */}
                  <div style={{ border: '1px solid #000', fontSize: '9px', width: '130px', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #cbd5e1' }}>
                      <span>Bill Points</span>
                      <span style={{ fontWeight: 'bold' }}>{(billData.loyaltyPointsEarned || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #cbd5e1' }}>
                      <span>Used Point</span>
                      <span style={{ fontWeight: 'bold' }}>{billData.loyaltyPointsUsed || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #cbd5e1' }}>
                      <span>Used Amt</span>
                      <span style={{ fontWeight: 'bold' }}>{(billData.loyaltyAmtUsed || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: '#fef08a' }}>
                      <span>Balance Points</span>
                      <span style={{ fontWeight: 'bold' }}>{(billData.balanceLoyaltyPoints !== undefined ? billData.balanceLoyaltyPoints : (customer.loyaltyPoints || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Barcode Strip */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '4px', fontWeight: 'bold' }}>
                    ||||| | |||| |||||| || | |||||
                  </div>
                  <div style={{ fontSize: '9px', color: '#475569' }}>Thank You... Visit Again !</div>
                </div>
              </div>

              {/* Right Column: Financial Summary Table (1:1 Video 13 Frames 0090 & 0240) */}
              <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Total :</span>
                  <span>{(netPay + (billData.salesReturnAdjusted || 0) + totalDisc).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Bill Discount :</span>
                  <span>{totalDisc.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Round Off :</span>
                  <span>0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #e2e8f0', color: (billData.salesReturnAdjusted || 0) > 0 ? '#b91c1c' : '#000000', fontWeight: (billData.salesReturnAdjusted || 0) > 0 ? 'bold' : 'normal' }}>
                  <span>Sales Return ₹ :</span>
                  <span>{(billData.salesReturnAdjusted || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: '900', fontSize: '13px', background: '#f8fafc' }}>
                  <span>Net Total ₹ :</span>
                  <span>{netPay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {renderBankDetailsSection(false)}

            <div style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic', marginTop: '6px' }}>
              * Thanks For Shopping With Us *
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. A4 PINK HEADER BAND TAX INVOICE (Video 17 Frame 0195)
  // ==========================================
  if (paperFormat === 'A4_PINK_GST') {
    return (
      <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        {renderSidebar()}
        <div style={{
          width: '760px',
          minHeight: '920px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          padding: '20px',
          border: isPrintMode ? 'none' : '1px solid #94a3b8',
          boxShadow: isPrintMode ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Pink Header Band (Frame 0195) */}
          <div style={{
            background: '#fecaca',
            border: '1px solid #f87171',
            padding: '4px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ textDecoration: 'underline', fontWeight: '900', letterSpacing: '1px' }}>TAX INVOICE</span>
            <span style={{ fontSize: '11px' }}>ORIGINAL COPY</span>
          </div>

          <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold' }}>
            GSTIN: {companyInfo.gstin}
          </div>

          {/* Bold Red Store Name (Frame 0195) */}
          <div style={{ textAlign: 'center', margin: '4px 0 8px 0' }}>
            <div style={{ color: '#dc2626', fontWeight: '900', fontSize: '24px', letterSpacing: '1px' }}>
              {companyInfo.name.toUpperCase()}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}>
              {companyInfo.address.toUpperCase()} {companyInfo.city.toUpperCase()}
            </div>
            <div style={{ fontSize: '11px' }}>
              Contact: {companyInfo.phone || '123456789'}, GSTIN : {companyInfo.gstin}
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', marginTop: '2px' }}>
              <strong>STATE CODE : </strong> {customer.state || 'Kerala'}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '4px 0 8px 0' }} />

          {/* Customer & Bill Details Grid (Frame 0195) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', lineHeight: '1.5' }}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '13px' }}>{customer.name}</div>
              <div>{customer.address || 'local'}</div>
              <div><strong>STATE : </strong> {customer.state || 'Kerala'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Bill No. :</strong> {invoiceNo}</div>
              <div><strong>Date :</strong> {date}</div>
            </div>
          </div>

          {/* Table with Pink Header (Frame 0195) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '10px',
            marginBottom: '10px',
            border: '1px solid #000'
          }}>
            <thead>
              <tr style={{ background: '#fecaca', borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>PARTICULARS</th>
                <th style={{ width: '65px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>HSN CODE</th>
                <th style={{ width: '45px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>SIZE</th>
                <th style={{ width: '45px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '60px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>RATE</th>
                <th style={{ width: '65px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>Amount</th>
                <th style={{ width: '45px', padding: '6px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>DIS.</th>
                <th colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>CGST</th>
                <th colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>SGST</th>
                <th style={{ width: '70px', padding: '6px 4px', textAlign: 'right' }}>TOTAL</th>
              </tr>
              <tr style={{ background: '#fecaca', borderBottom: '1px solid #000', fontSize: '9px' }}>
                <th colSpan={7} style={{ borderRight: '1px solid #000' }}></th>
                <th style={{ width: '35px', textAlign: 'right', padding: '2px 3px', borderRight: '1px solid #000' }}>%</th>
                <th style={{ width: '45px', textAlign: 'right', padding: '2px 3px', borderRight: '1px solid #000' }}>Amount</th>
                <th style={{ width: '35px', textAlign: 'right', padding: '2px 3px', borderRight: '1px solid #000' }}>%</th>
                <th style={{ width: '45px', textAlign: 'right', padding: '2px 3px', borderRight: '1px solid #000' }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>
                    <div>{it.name}</div>
                    {it.serialNos && it.serialNos.length > 0 && (
                      <div style={{ fontSize: '9px', color: '#475569', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px', paddingLeft: '6px' }}>
                        {it.serialNos.map((sn, sIdx) => (
                          <div key={sIdx}>SN : {sn}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000' }}>{it.hsn || '0'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000' }}>{it.size || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000', fontWeight: 'bold' }}>{it.qty.toFixed(3)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #000' }}>{it.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #000' }}>{it.taxable.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #000' }}>{it.discAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 3px', borderRight: '1px solid #000' }}>{it.cgstPercent}%</td>
                  <td style={{ textAlign: 'right', padding: '6px 3px', borderRight: '1px solid #000' }}>{it.cgstAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 3px', borderRight: '1px solid #000' }}>{it.sgstPercent}%</td>
                  <td style={{ textAlign: 'right', padding: '6px 3px', borderRight: '1px solid #000' }}>{it.sgstAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Summary Strip (Frame 0195) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
              <div><strong>Amount In Words:</strong> {numberToWords(netPay)}</div>
              <div style={{ marginTop: '6px', border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '3px' }}>
                <div><strong>Bank Name:</strong> {companyInfo.bankName || 'State Bank of India'}</div>
                <div><strong>A/c No:</strong> {companyInfo.accountNo || '38920192831'} | <strong>IFSC:</strong> {companyInfo.ifsc || 'SBIN0070123'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <img src={qrImageSrc} alt="UPI QR" style={{ width: '60px', height: '60px', border: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: '9px', color: '#475569' }}>Instant UPI Scan & Pay exact amount</span>
              </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '6px 10px', fontSize: '11px', lineHeight: '1.7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Qty:</span>
                <span style={{ fontWeight: 'bold' }}>{totalQty.toFixed(3)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Taxable Amount:</span>
                <span>₹ {(netPay - totalTax).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total GST:</span>
                <span>₹ {totalTax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '3px', fontWeight: '900', fontSize: '13px' }}>
                <span>GRAND TOTAL:</span>
                <span>₹ {netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Store Bank Transfer Details */}
          {renderBankDetailsSection(false)}

          {/* Signature & Declaration Strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '14px',
            borderTop: '1px solid #cbd5e1',
            paddingTop: '6px',
            fontSize: '9px',
            color: '#475569'
          }}>
            <div>
              <div><strong>Declaration:</strong> We declare that this invoice shows the actual price of goods and that all particulars are true and correct.</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div>For <strong>{companyInfo.name}</strong></div>
              {(companyInfo.signature || companyInfo.signatureUrl) ? (
                <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                  <img
                    src={companyInfo.signature || companyInfo.signatureUrl}
                    alt="Authorized Signature"
                    style={{ maxHeight: '32px', maxWidth: '130px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div style={{ height: '34px' }} />
              )}
              <div style={{ borderTop: '1px dashed #64748b', paddingTop: '2px' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TOP TOOLBAR & STATUS BAR (Video 15 Frame 0310)
  // ==========================================
  const renderTopToolbar = () => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#e2e8f0',
        borderBottom: '1px solid #cbd5e1',
        padding: '3px 8px',
        fontSize: '11px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrint}
            title="Print Document [F6]"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
          >
            🖨️
          </button>
          <button
            type="button"
            onClick={handlePrint}
            title="Export / Save"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
          >
            💾
          </button>
          <div style={{ height: '14px', width: '1px', background: '#94a3b8' }} />
          <button
            type="button"
            onClick={() => { setPreviewPage(1); showNotice('Page 1 of ' + totalPreviewPages, 'info'); }}
            disabled={previewPage <= 1}
            title="First Page"
            style={{ background: 'none', border: 'none', cursor: previewPage <= 1 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '10px', opacity: previewPage <= 1 ? 0.4 : 1 }}
          >
            |◀
          </button>
          <button
            type="button"
            onClick={() => { setPreviewPage(p => Math.max(1, p - 1)); showNotice('Page ' + Math.max(1, previewPage - 1) + ' of ' + totalPreviewPages, 'info'); }}
            disabled={previewPage <= 1}
            title="Previous Page"
            style={{ background: 'none', border: 'none', cursor: previewPage <= 1 ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '10px', opacity: previewPage <= 1 ? 0.4 : 1 }}
          >
            ◀
          </button>
          <span style={{ fontSize: '10px', padding: '0 3px', fontWeight: 600, color: '#334155' }}>
            {previewPage} / {totalPreviewPages}
          </span>
          <button
            type="button"
            onClick={() => { setPreviewPage(p => Math.min(totalPreviewPages, p + 1)); showNotice('Page ' + Math.min(totalPreviewPages, previewPage + 1) + ' of ' + totalPreviewPages, 'info'); }}
            disabled={previewPage >= totalPreviewPages}
            title="Next Page"
            style={{ background: 'none', border: 'none', cursor: previewPage >= totalPreviewPages ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '10px', opacity: previewPage >= totalPreviewPages ? 0.4 : 1 }}
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => { setPreviewPage(totalPreviewPages); showNotice('Page ' + totalPreviewPages + ' of ' + totalPreviewPages, 'info'); }}
            disabled={previewPage >= totalPreviewPages}
            title="Last Page"
            style={{ background: 'none', border: 'none', cursor: previewPage >= totalPreviewPages ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '10px', opacity: previewPage >= totalPreviewPages ? 0.4 : 1 }}
          >
            ▶|
          </button>
          <div style={{ height: '14px', width: '1px', background: '#94a3b8' }} />
          {/* Zoom Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                padding: '1px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              <span>🔍</span>
              <span>▼</span>
            </button>
            {showZoomMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#ffffff',
                border: '1px solid #71717a',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 1000,
                width: '110px',
                padding: '2px 0'
              }}>
                {[
                  { label: 'Page Width', value: 100 },
                  { label: 'Whole Page', value: 85 },
                  { label: '400%', value: 400 },
                  { label: '300%', value: 300 },
                  { label: '200%', value: 200 },
                  { label: '150%', value: 150 },
                  { label: '100%', value: 100 },
                  { label: '75%', value: 75 },
                  { label: '50%', value: 50 },
                  { label: '25%', value: 25 },
                  { label: 'Customize...', value: 100 }
                ].map(opt => (
                  <div
                    key={opt.label}
                    onClick={() => {
                      setZoomFactor(opt.value);
                      setShowZoomMenu(false);
                    }}
                    style={{
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      background: zoomFactor === opt.value ? '#3b82f6' : '#ffffff',
                      color: zoomFactor === opt.value ? '#ffffff' : '#000000'
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '11px' }}>
          Main Report
        </div>
      </div>
    );
  };

  const renderBottomStatusBar = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        background: '#e2e8f0',
        borderTop: '1px solid #cbd5e1',
        padding: '3px 10px',
        fontSize: '10px',
        color: '#475569',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div>Current Page No.: 1</div>
        <div>Total Page No.: 1</div>
        <div>Zoom Factor: {zoomFactor}%</div>
      </div>
    );
  };

  // ==========================================
  // 4. A4 & A5 FULL PAGE / HALF PAGE INVOICE (Video 15 & Modular)
  // ==========================================
  const isA5 = paperFormat === 'A5';
  const containerWidth = isA5 ? '560px' : '760px';
  const minHeight = isA5 ? '480px' : '920px';

  // Video 15 Frame 0310: Cyan Header Style (A4-Style1)
  const isCyanA4 = !isA5 && (styleIndex === 1 || styleIndex === 2);
  // Video 15 Frame 0198: Pink Column Style (A4-Style3)
  const isPinkA4 = !isA5 && (styleIndex === 3 || styleIndex === 4);
  // Video 15 Frame 0230: Yellow MRP Column Style (A5-Style8 / Style9)
  const isYellowA5 = isA5 && (styleIndex === 8 || styleIndex === 9 || styleIndex === 1);

  const headerBg =
    styleIndex === 1 ? '#1e293b' :
    styleIndex === 2 ? '#0f766e' :
    styleIndex === 3 ? '#b91c1c' :
    styleIndex === 4 ? '#334155' :
    styleIndex === 5 ? '#a21caf' :
    styleIndex === 6 ? '#1d4ed8' :
    styleIndex === 7 ? '#047857' :
    styleIndex === 8 ? '#475569' :
    styleIndex === 9 ? '#d97706' : '#111827';

  const tableHeaderBg =
    styleIndex === 3 ? '#fee2e2' :
    styleIndex === 2 ? '#ccfbf1' :
    styleIndex === 7 ? '#d1fae5' :
    styleIndex === 9 ? '#fef3c7' : '#f1f5f9';

  // Render Inner Invoice Document
  const renderInvoiceDocument = () => {
    // -------------------------------------------------------------
    // OPTION A: 1:1 RECREATION OF FRAME 0310 (CYAN HEADER TAX INVOICE)
    // -------------------------------------------------------------
    if (isCyanA4) {
      return (
        <div style={{
          width: '760px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          padding: '24px 32px',
          border: '1px solid #000000',
          boxSizing: 'border-box'
        }}>
          {/* Center Top Title */}
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              TAX INVOICE
            </div>
            <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '10px', fontStyle: 'italic' }}>
              ORIGINAL COPY
            </div>
          </div>

          {/* Center Company Block */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {companyInfo.name || 'SHREE VINAYAKA FURNITURES'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
              {companyInfo.address ? `${companyInfo.address}, ${companyInfo.city}` : 'YOUR ADDRESS YOUR ADDRESS YOUR ADDRESS'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              {companyInfo.state || 'Kerala'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
              GSTIN : {companyInfo.gstin || '1234454444444'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
              Tel : {companyInfo.phone || '123456789'} E-mail : {companyInfo.email || 'yourmaild@gmail.com'}
            </div>
          </div>

          {/* Party Details & Invoice Details Split Boxes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            border: '1px solid #000000',
            marginBottom: '10px',
            fontSize: '11px'
          }}>
            {/* Left Box: Party Details */}
            <div style={{ padding: '8px 12px', borderRight: '1px solid #000000', lineHeight: '1.5' }}>
              <div style={{ fontWeight: 'bold' }}>Party Details:-</div>
              <div style={{ fontWeight: 'bold' }}>{customer.name || 'Cash'}</div>
              <div>{customer.city || 'Local'}</div>
              <div>{customer.state || 'Kerala'}</div>
              <div style={{ marginTop: '4px' }}>
                Party Mobile No.: <strong>{customer.phone || '1234567890'}</strong>
              </div>
              <div>
                GSTIN / UIN : <strong>{customer.gstin || ''}</strong>
              </div>
            </div>

            {/* Right Box: Invoice Meta */}
            <div style={{ padding: '8px 12px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice No.</span>
                <span style={{ fontWeight: 'bold' }}>: {invoiceNo || 'SHIB-0046-DADDY'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Dated</span>
                <span style={{ fontWeight: 'bold' }}>: {date || '25/02/2025'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Place of Supply</span>
                <span style={{ fontWeight: 'bold' }}>: {customer.state || 'Kerala'} ({isInterState ? 'Inter-State' : 'Intra-State'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Customer Balance</span>
                <span style={{ fontWeight: 'bold' }}>: {customer.balance ? `${customer.balance.toFixed(2)} Cr` : '0.00 Cr'}</span>
              </div>
            </div>
          </div>

          {/* Table with Vivid Cyan Header (Video 14 Frames 0102 & 0145) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            border: '1px solid #000000'
          }}>
            <thead>
              <tr style={{ background: '#00e5ff', color: '#000000', borderBottom: '1px solid #000000' }}>
                <th style={{ width: '28px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'center' }}>S.N.</th>
                <th style={{ padding: '6px 6px', border: '1px solid #000000', textAlign: 'left' }}>Description of Goods</th>
                <th style={{ width: '70px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'center' }}>HSN Code</th>
                <th style={{ width: '35px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '38px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'center' }}>Unit</th>
                <th style={{ width: '55px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '60px', padding: '6px 3px', border: '1px solid #000000', textAlign: 'right' }}>Taxable</th>
                <th style={{ width: '55px', padding: '6px 2px', border: '1px solid #000000', textAlign: 'right' }}>CGST</th>
                <th style={{ width: '55px', padding: '6px 2px', border: '1px solid #000000', textAlign: 'right' }}>SGST</th>
                <th style={{ width: '55px', padding: '6px 2px', border: '1px solid #000000', textAlign: 'right' }}>IGST</th>
                <th style={{ width: '70px', padding: '6px 4px', border: '1px solid #000000', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                return (
                  <tr key={it.id || idx} style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ textAlign: 'center', padding: '5px 3px', border: '1px solid #000000' }}>{idx + 1}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #000000', fontWeight: 'bold' }}>{it.name}</td>
                    <td style={{ textAlign: 'center', padding: '5px 3px', border: '1px solid #000000' }}>{it.hsn || '80051'}</td>
                    <td style={{ textAlign: 'center', padding: '5px 3px', border: '1px solid #000000' }}>{it.qty}</td>
                    <td style={{ textAlign: 'center', padding: '5px 3px', border: '1px solid #000000' }}>{it.unit || 'PCS'}</td>
                    <td style={{ textAlign: 'right', padding: '5px 3px', border: '1px solid #000000' }}>{it.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '5px 3px', border: '1px solid #000000' }}>{it.taxable.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '5px 2px', border: '1px solid #000000' }}>
                      {it.cgstAmt > 0 ? `${it.cgstAmt.toFixed(2)} (${it.cgstPercent}%)` : '0.00'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 2px', border: '1px solid #000000' }}>
                      {it.sgstAmt > 0 ? `${it.sgstAmt.toFixed(2)} (${it.sgstPercent}%)` : '0.00'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 2px', border: '1px solid #000000' }}>
                      {it.igstAmt > 0 ? `${it.igstAmt.toFixed(2)} (${it.igstPercent}%)` : '0.00'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #000000', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bottom Totals Summary (Video 14 Frames 0110 & 0145) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginTop: '16px', fontSize: '11px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Amount In Words:</div>
                <div style={{ marginTop: '2px', color: '#1e3a8a', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}>
                  {numberToWords(netPay)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                <img src={qrImageSrc} alt="UPI QR" style={{ width: '80px', height: '80px', border: '1px solid #000000', flexShrink: 0 }} />
                <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
                  <div><strong>Bank Name :</strong> {companyInfo.bankName || 'State Bank of India'}</div>
                  <div><strong>A/c No & Branch :</strong> {companyInfo.accountNo || '389201948123'} - {companyInfo.branch || 'Vaikom Main Branch'}</div>
                  <div><strong>IFSC Code :</strong> {companyInfo.ifsc || 'SBIN0070119'}</div>
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#475569' }}>
                    Conditions:- Goods once sold cannot be returned after 7 days.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #000000', background: '#ffffff', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: 'bold' }}>Total Amount Before Tax</span>
                <span style={{ fontWeight: 'bold' }}>{(netPay - totalTax).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span>Ad CGST</span>
                <span style={{ fontWeight: 'bold' }}>{totalCgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span>Ad SGST</span>
                <span style={{ fontWeight: 'bold' }}>{totalSgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span>Ad IGST</span>
                <span style={{ fontWeight: 'bold' }}>{totalIgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span>Round Off</span>
                <span style={{ fontWeight: 'bold' }}>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderTop: '2px solid #000000', background: '#f8fafc', fontSize: '13px', fontWeight: '900' }}>
                <span>Total Amount After Tax</span>
                <span>₹ {netPay.toFixed(2)}</span>
              </div>
              <div style={{ padding: '6px 8px', textAlign: 'right', borderTop: '1px solid #000000', background: '#f1f5f9' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>For {companyInfo.name || 'SHREE VINAYAKA FURNITURES'}</div>
                {(companyInfo.signature || companyInfo.signatureUrl) ? (
                  <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '2px 0' }}>
                    <img
                      src={companyInfo.signature || companyInfo.signatureUrl}
                      alt="Authorized Signature"
                      style={{ maxHeight: '34px', maxWidth: '130px', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{ height: '24px' }}></div>
                )}
                <div style={{ fontSize: '9px', color: '#64748b' }}>Authorised Signature</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------
    // OPTION B: 1:1 RECREATION OF FRAME 0230 (A5 YELLOW MRP COLUMN INVOICE)
    // -------------------------------------------------------------
    if (isYellowA5) {
      return (
        <div style={{
          width: '560px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          padding: '16px 20px',
          border: '1px solid #000000',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '8px', position: 'relative' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>INVOICE</div>
            <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '8px', color: '#64748b' }}>ORIGINAL COPY</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>
              {companyInfo.name || 'SHREE VINAYAKA FURNITURES'}
            </div>
            <div style={{ fontSize: '9px', color: '#334155' }}>
              {companyInfo.address ? `${companyInfo.address}, ${companyInfo.city}` : 'B.H. Road, Near Vinayaka Temple, Tiptur, Karnataka'}
            </div>
            <div style={{ fontSize: '9px', color: '#334155' }}>
              Contact : {companyInfo.phone || '+91 94484 22354'}, GSTIN : {companyInfo.gstin || '29AAAAA0000A1Z5'}
            </div>
            <div style={{ fontSize: '9px', color: '#334155' }}>
              E-mail : {companyInfo.email || 'shreevinayakafurnitures@gmail.com'}
            </div>
          </div>

          {/* Split Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #000000', fontSize: '9px', marginBottom: '8px' }}>
            <div style={{ padding: '4px 8px', borderRight: '1px solid #000000', background: '#fef08a' }}>
              <div style={{ fontWeight: 'bold' }}>Customer Details</div>
              <div>{customer.name || 'Walk-in Customer'}</div>
              <div>{customer.address || 'Local Market, Tiptur'}</div>
              <div>Mob : {customer.phone || '9876543210'}</div>
              <div>GSTIN : {customer.gstin || ''}</div>
              <div>Previous Bal 0.00 Cr</div>
            </div>
            <div style={{ padding: '4px 8px' }}>
              <div>Invoice No : <strong>{invoiceNo || 'GST-0002-2024/25'}</strong></div>
              <div>Date : <strong>{date || '25-07-2024'}</strong></div>
              <div>Tax Type : <strong>GST</strong></div>
              <div>E-Way No : </div>
              <div>Sales Man : </div>
            </div>
          </div>

          {/* Table with Yellow MRP column */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000000' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000000' }}>
                <th style={{ width: '25px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'center' }}>S.No</th>
                <th style={{ padding: '4px 6px', border: '1px solid #000000', textAlign: 'left' }}>Product Name</th>
                <th style={{ width: '45px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '50px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'right', background: '#fef08a' }}>MRP</th>
                <th style={{ width: '50px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '45px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'right' }}>Disc Amt</th>
                <th style={{ width: '55px', padding: '4px 2px', border: '1px solid #000000', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ textAlign: 'center', padding: '3px 2px', border: '1px solid #cbd5e1' }}>{idx + 1}</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{it.name}</td>
                  <td style={{ textAlign: 'center', padding: '3px 2px', border: '1px solid #cbd5e1' }}>{it.qty}.000{it.unit || 'PCS'}</td>
                  <td style={{ textAlign: 'right', padding: '3px 2px', border: '1px solid #cbd5e1', background: '#fef08a' }}>{(it.mrp || it.rate).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 2px', border: '1px solid #cbd5e1' }}>{it.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 2px', border: '1px solid #cbd5e1' }}>{it.discAmt ? it.discAmt.toFixed(2) : '0.00'}</td>
                  <td style={{ textAlign: 'right', padding: '3px 2px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Tax and Financial Summary Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginTop: '8px', fontSize: '8px' }}>
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '4px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>CGST</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>SGST</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>IGST</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>TOTAL TAX</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '2px' }}>TOT TAXABLE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>{(totalTax / 2).toFixed(2)}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>{(totalTax / 2).toFixed(2)}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>0.00</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>{totalTax.toFixed(2)}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>{(netPay - totalTax).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontWeight: 'bold' }}>Net Total (In Words) : {numberToWords(netPay)}</div>
              <div style={{ marginTop: '4px' }}>
                <strong>Bank Information :</strong><br />
                Bank Name & Branch: {companyInfo.bankName || 'State Bank of India'}<br />
                IFSC: {companyInfo.ifsc || 'SBIN0070119'}
              </div>
            </div>

            <div style={{ border: '1px solid #000000', padding: '4px 8px', lineHeight: '1.5', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill Sundry</span><span>0.00</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bill Discount</span><span>0.00</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Grand Total</span><span>{netPay.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Round Off</span><span>0.00</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '10px', borderTop: '1px solid #000', paddingTop: '2px' }}>
                <span>Net Total</span><span>{netPay.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid Amount :</span><span>{netPay.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pending Amount :</span><span>0.00</span></div>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------
    // OPTION C: 1:1 RECREATION OF FRAME 0198 (A4 PINK COLUMN INVOICE)
    // -------------------------------------------------------------
    if (isPinkA4) {
      return (
        <div style={{
          width: '760px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          padding: '24px',
          border: '1px solid #000000',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>TAX INVOICE</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>
              {companyInfo.name || 'COMPANY NAME'}
            </div>
            <div style={{ fontSize: '11px', color: '#334155' }}>
              {companyInfo.address ? `${companyInfo.address}, ${companyInfo.city}` : 'Address, Place, City & Pincode'}
            </div>
            <div style={{ fontSize: '10px', color: '#334155' }}>
              Contact: {companyInfo.phone || '1234567890'}, GSTIN : {companyInfo.gstin || 'GSTIN12345678'}
            </div>
          </div>

          {/* Customer Details Strip */}
          <div style={{ border: '1px solid #000000', padding: '6px 10px', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
            <div><strong>Name:</strong> {customer.name || 'NIHAL KUMAR GUPTA'}</div>
            <div><strong>Address:</strong> {customer.address || customer.city || 'Kottayam'}</div>
            <div><strong>State:</strong> {customer.state || 'Kerala'}</div>
          </div>

          {/* Table with Pink Column for Total Amount */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000' }}>
                <th style={{ border: '1px solid #000000', padding: '5px 3px' }}>Sl No</th>
                <th style={{ border: '1px solid #000000', padding: '5px 6px', textAlign: 'left' }}>PARTICULARS</th>
                <th style={{ border: '1px solid #000000', padding: '5px 3px' }}>HSN CODE</th>
                <th style={{ border: '1px solid #000000', padding: '5px 3px' }}>SIZE</th>
                <th style={{ border: '1px solid #000000', padding: '5px 3px' }}>QTY</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right' }}>RATE</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right' }}>AMOUNT</th>
                <th style={{ border: '1px solid #000000', padding: '5px 3px' }}>DIS</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right' }}>COST</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right' }}>SGST</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right' }}>CGST</th>
                <th style={{ border: '1px solid #000000', padding: '5px 4px', textAlign: 'right', background: '#ffe4e6' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '4px 2px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontWeight: 'bold' }}>{it.name}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '4px 2px' }}>{it.hsn || '-'}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '4px 2px' }}>{it.size || '-'}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '4px 2px' }}>{it.qty}.000</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px' }}>{it.rate.toFixed(2)}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px' }}>{(it.qty * it.rate).toFixed(2)}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '4px 2px' }}>0.00</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px' }}>{it.taxable.toFixed(2)}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px' }}>{it.sgstAmt.toFixed(2)}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px' }}>{it.cgstAmt.toFixed(2)}</td>
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 3px', fontWeight: 'bold', background: '#ffe4e6' }}>{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <div style={{ border: '1px solid #000000', padding: '6px 12px', minWidth: '220px', background: '#f8fafc', fontSize: '11px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Qty:</span><span style={{ fontWeight: 'bold' }}>{totalQty}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Tax:</span><span>₹ {totalTax.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '2px', fontWeight: '900', fontSize: '13px' }}>
                <span>NET AMOUNT:</span><span>₹ {netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------
    // OPTION D: STANDARD MODULAR A4 / A5 INVOICE
    // -------------------------------------------------------------
    return (
      <div
        className="bill-desktop-container"
        style={{
          width: containerWidth,
          minHeight,
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          fontSize: isA5 ? '10px' : '11px',
          padding: isA5 ? '16px' : '28px',
          border: isPrintMode ? 'none' : '1px solid #94a3b8',
          boxShadow: isPrintMode ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Banner / Company Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: `2px solid ${headerBg}`,
          paddingBottom: '10px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {companyInfo.logo ? (
              <img
                src={companyInfo.logo}
                alt={companyInfo.name}
                style={{ maxHeight: isA5 ? '48px' : '65px', maxWidth: '140px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                border: '1px dashed #94a3b8',
                padding: '6px 12px',
                backgroundColor: '#f8fafc',
                color: '#94a3b8',
                fontSize: '10px',
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: '0.5px',
                borderRadius: '3px'
              }}>
                <div>NO LOGO</div>
                <div>AVAILABLE</div>
              </div>
            )}
            <div>
              <div style={{ fontWeight: '900', fontSize: isA5 ? '14px' : '18px', color: headerBg }}>
                {companyInfo.name.toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                {companyInfo.address}, {companyInfo.city} - {companyInfo.pincode}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                Phone: {companyInfo.phone} | Email: {companyInfo.email}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                GSTIN: {companyInfo.gstin} | PAN: {companyInfo.pan || 'AABCV1234F'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: isA5 ? '13px' : '16px',
              fontWeight: '900',
              color: headerBg,
              letterSpacing: '0.5px'
            }}>
              {taxScheme === 'COMPOSITION' ? 'BILL OF SUPPLY' : taxScheme === 'NON_GST' ? 'RETAIL INVOICE' : 'TAX INVOICE'}
            </div>
            <div style={{ fontSize: '10px', marginTop: '3px' }}>
              <strong>Invoice No:</strong> {invoiceNo}
            </div>
            <div style={{ fontSize: '10px' }}>
              <strong>Date:</strong> {date}
            </div>
            <div style={{ fontSize: '10px' }}>
              <strong>Place of Supply:</strong> {customer.state}
            </div>
          </div>
        </div>

        {/* Buyer Details Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '10px',
          marginBottom: '12px',
          lineHeight: '1.6'
        }}>
          <div>
            <div style={{ fontWeight: 'bold', color: headerBg, fontSize: '11px' }}>BILLED TO:</div>
            <div><strong>Customer Name:</strong> {customer.name}</div>
            <div><strong>Contact Phone:</strong> {customer.phone}</div>
            <div><strong>Address:</strong> {customer.address || customer.city || 'Counter Sale'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: headerBg, fontSize: '11px' }}>BUYER TAX DETAILS:</div>
            <div>
              <strong>Buyer GSTIN:</strong>{' '}
              <span style={{ fontWeight: 'bold', color: customer.gstin ? '#15803d' : '#64748b' }}>
                {customer.gstin || 'B2C (Unregistered Consumer)'}
              </span>
            </div>
            <div><strong>PAN:</strong> {customer.pan || '-'}</div>
            <div><strong>Invoice Type:</strong> {customer.gstin ? 'B2B (Input Tax Credit)' : 'B2C (Regular)'}</div>
          </div>
        </div>

        {/* Main Item Grid */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isA5 ? '9px' : '10px',
          marginBottom: '10px',
          border: '1px solid #cbd5e1'
        }}>
          <thead>
            <tr style={{ background: tableHeaderBg, borderBottom: '1px solid #94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', border: '1px solid #cbd5e1' }}>S.N.</th>
              <th style={{ textAlign: 'left', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Item Description</th>
              <th style={{ textAlign: 'center', padding: '6px 4px', border: '1px solid #cbd5e1' }}>HSN</th>
              <th style={{ textAlign: 'center', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Rate</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Disc %</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Taxable</th>
              {taxScheme === 'GST' && (
                <>
                  <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>CGST</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>SGST</th>
                </>
              )}
              <th style={{ textAlign: 'right', padding: '6px 4px', border: '1px solid #cbd5e1' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ textAlign: 'left', padding: '5px 4px', border: '1px solid #cbd5e1' }}>{idx + 1}</td>
                <td style={{ textAlign: 'left', padding: '5px 4px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: 'bold' }}>{it.name}</div>
                  {it.serialNos && it.serialNos.length > 0 && (
                    <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', marginTop: '2px', paddingLeft: '6px' }}>
                      {it.serialNos.map((sn, sIdx) => (
                        <div key={sIdx}>SN : {sn}</div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: '5px 4px', border: '1px solid #cbd5e1' }}>{it.hsn || '9403'}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', border: '1px solid #cbd5e1' }}>
                  {it.qty} {it.unit || 'Nos'}
                </td>
                <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1' }}>{it.rate.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1' }}>{it.discPercent || 0}%</td>
                <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1' }}>{it.taxable.toFixed(2)}</td>
                {taxScheme === 'GST' && (
                  <>
                    <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1' }}>
                      {it.cgstAmt.toFixed(2)} ({it.cgstPercent}%)
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1' }}>
                      {it.sgstAmt.toFixed(2)} ({it.sgstPercent}%)
                    </td>
                  </>
                )}
                <td style={{ textAlign: 'right', padding: '5px 4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  {it.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', marginTop: 'auto', paddingTop: '10px' }}>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <div><strong>Amount In Words:</strong> {numberToWords(netPay)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <img src={qrImageSrc} alt="UPI QR" style={{ width: '64px', height: '64px', border: '1px solid #cbd5e1' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '9px' }}>Instant UPI Scan & Pay</div>
                <div style={{ fontSize: '8px', color: '#475569' }}>Scan with GPay/PhonePe to pay exact bill net amount</div>
              </div>
            </div>
          </div>

          <div style={{
            border: '1px solid #cbd5e1',
            padding: '8px 12px',
            fontSize: '11px',
            lineHeight: '1.8',
            background: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Qty:</span>
              <span>{totalQty.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gross Taxable:</span>
              <span>₹ {(netPay - totalTax).toFixed(2)}</span>
            </div>
            {taxScheme === 'GST' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total GST:</span>
                <span>₹ {totalTax.toFixed(2)}</span>
              </div>
            )}
            {totalDisc > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                <span>Total Discount:</span>
                <span>- ₹ {totalDisc.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid #000',
              paddingTop: '4px',
              fontSize: '14px',
              fontWeight: '900',
              color: headerBg
            }}>
              <span>GRAND TOTAL:</span>
              <span>₹ {netPay.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Video 09 Feature 6: Bank Details Box in Invoice Footer (Frame 0410) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          border: '1px solid #f97316',
          borderRadius: '4px',
          padding: '8px 12px',
          background: '#fffaf0'
        }}>
          <div style={{ fontSize: '11px', color: '#1e293b', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px', color: '#c2410c' }}>
              Bank Details:-
            </div>
            <div>
              <strong>Bank Holder Name : </strong>
              <span>{companyInfo.accountName || companyInfo.name}</span>
            </div>
            <div>
              <strong>Bank A/c No : </strong>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{companyInfo.accountNo || '123456789'}</span>
            </div>
            <div>
              <strong>Bank Name & Branch : </strong>
              <span>{companyInfo.branch || companyInfo.bankName || 'YOUR BRANCH'}</span>
            </div>
            <div>
              <strong>IFSC : </strong>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{companyInfo.ifsc || '0000'}</span>
            </div>
          </div>

          {/* Dynamic UPI Payment QR Code */}
          <div style={{ textAlign: 'center' }}>
            {qrImageSrc ? (
              <img
                src={qrImageSrc}
                alt="UPI QR"
                style={{ width: '75px', height: '75px', border: '1px solid #cbd5e1' }}
              />
            ) : (
              <div style={{ width: '75px', height: '75px', background: '#f1f5f9', border: '1px solid #cbd5e1' }} />
            )}
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569', marginTop: '2px' }}>
              Scan to Pay UPI
            </div>
          </div>
        </div>

        {/* Signature & Terms */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '16px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
          fontSize: '9px',
          color: '#475569'
        }}>
          <div>
            <div><strong>Terms & Conditions:</strong></div>
            <div>1. Goods once sold will not be taken back or exchanged.</div>
            <div>2. Warranty as per manufacturer terms. Subject to Karnataka jurisdiction.</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div>For <strong>{companyInfo.name}</strong></div>
            {(companyInfo.signature || companyInfo.signatureUrl) ? (
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                <img
                  src={companyInfo.signature || companyInfo.signatureUrl}
                  alt="Authorized Signature"
                  style={{ maxHeight: '34px', maxWidth: '140px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ height: '36px' }} />
            )}
            <div style={{ borderTop: '1px dashed #64748b', paddingTop: '2px' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    );
  };

  if (isPrintMode) {
    return (
      <div id="rd-printable-bill" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
        {renderInvoiceDocument()}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {renderSidebar()}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
        {renderTopToolbar()}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div
            id="rd-printable-bill"
            style={{
              transform: `scale(${zoomFactor / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
          >
            {renderInvoiceDocument()}
          </div>
        </div>
        {renderBottomStatusBar()}
      </div>
    </div>
  );
}
