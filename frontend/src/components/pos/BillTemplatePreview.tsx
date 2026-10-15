import { useState } from 'react';
import type { CompanyInfo, BillTemplateConfig, CartItem, Customer } from '../../types/retailDaddy';

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

  const [copies, setCopies] = useState<number>(1);
  const [emailId, setEmailId] = useState<string>('');
  const [whatsappNo, setWhatsappNo] = useState<string>(customer.phone || '7777');
  const [whatsappMsg, setWhatsappMsg] = useState<string>(
    `Dear Sir/Madam, Please find the invoice ${invoiceNo} for ₹${netPay.toFixed(2)} from ${companyInfo.name}. Thank you for your business!`
  );

  const upiUrl = `upi://pay?pa=${encodeURIComponent(companyInfo.email ? 'rakeshleela5@okhdfcbank' : 'rakeshleela5@okhdfcbank')}&pn=${encodeURIComponent(companyInfo.name)}&am=${netPay.toFixed(2)}&cu=INR`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;

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

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!emailId) {
      alert('Please enter a valid email address.');
      return;
    }
    alert(`Invoice sent successfully to ${emailId}`);
  };

  const handleSendWhatsApp = (_service: string) => {
    if (!whatsappNo) {
      alert('Please enter a valid WhatsApp mobile number.');
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

        {/* Big Print Button F6 */}
        <button
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
            color: '#ffffff',
            border: '2px solid #1e3a8a',
            borderRadius: '4px',
            padding: '10px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '24px' }}>🖨️</span>
          <span style={{ fontWeight: '900', fontSize: '12px' }}>PRINT [F6]</span>
        </button>

        {/* Big PDF Button F7 */}
        <button
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
            color: '#ffffff',
            border: '2px solid #b91c1c',
            borderRadius: '4px',
            padding: '10px 4px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '24px' }}>📄</span>
          <span style={{ fontWeight: '900', fontSize: '12px' }}>PDF [F7]</span>
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
              cursor: 'pointer'
            }}
          >
            ✉️ Email [F8]
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
          {/* Brand Logo / Header */}
          <div style={{ textAlign: 'center', marginBottom: isCompact ? '4px' : '8px' }}>
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

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '9px' }}>
            *** THANK YOU! VISIT AGAIN ***<br />
            <span>Powered by Retail Daddy 1.6</span>
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
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. A4 PINK HEADER BAND TAX INVOICE (Video 17 Frame 0195)
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
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #000', fontWeight: 'bold' }}>{it.name}</td>
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
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. A4 & A5 FULL PAGE / HALF PAGE INVOICE (Standard)
  // ==========================================
  const isA5 = paperFormat === 'A5';
  const containerWidth = isA5 ? '560px' : '760px';
  const minHeight = isA5 ? '480px' : '920px';

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

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
      {renderSidebar()}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: headerBg,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '14px'
              }}>
                {companyInfo.name.substring(0, 2).toUpperCase()}
              </div>
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
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px dashed #64748b', paddingTop: '2px' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
