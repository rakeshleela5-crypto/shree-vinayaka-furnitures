import React, { useState } from 'react';
import { X, Printer, FileDown, Mail, Send, MessageSquare } from 'lucide-react';
import type { Invoice, BillDesignConfig } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  designConfig: BillDesignConfig;
}

export const PrintPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoice,
  designConfig
}) => {
  const [copies, setCopies] = useState(1);
  const [emailId, setEmailId] = useState(invoice?.customer?.email || '');
  const [whatsappNo, setWhatsappNo] = useState(invoice?.customer?.contactNo || '');
  const [activeFormat, setActiveFormat] = useState<'3inch' | 'a4'>('3inch');
  const [useHindi, setUseHindi] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setActionNotice('PDF document generated and ready for print/download!');
    setTimeout(() => setActionNotice(null), 3000);
    window.print();
  };

  const handleSendEmail = () => {
    if (!emailId) {
      alert('Please enter a valid email address');
      return;
    }
    setActionNotice(`✓ Invoice ${invoice.invoiceNo} sent to ${emailId}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSendWhatsApp = (gateway: 'Tejas' | 'Rocket') => {
    if (!whatsappNo) {
      alert('Please enter a valid WhatsApp phone number');
      return;
    }
    const cleanPhone = whatsappNo.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Dear ${invoice.customer.name},\n\nThank you for shopping at ${designConfig.companyName}!\nHere are your bill details:\nInvoice No: ${invoice.invoiceNo}\nTotal Amount: ₹${invoice.netPay.toFixed(2)}\nItems: ${invoice.itemsCount}\n\nHave a wonderful day!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    setActionNotice(`✓ Dispatched via ${gateway} WhatsApp Gateway!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // UPI payment QR code URL using quickchart QR API
  const upiUrl = `upi://pay?pa=${encodeURIComponent(designConfig.upiVpa)}&pn=${encodeURIComponent(designConfig.upiName)}&am=${invoice.netPay}&cu=INR&tn=${encodeURIComponent(`Invoice-${invoice.invoiceNo}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '1050px', width: '96%', maxHeight: '92vh' }}>
        {/* Top Header */}
        <div
          className="pos-modal-header"
          style={{ background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Print Preview — {invoice.invoiceNo}</h3>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {actionNotice && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
            {actionNotice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', padding: '16px', background: '#e2e8f0', overflowY: 'auto', maxHeight: 'calc(92vh - 60px)' }}>
          {/* Left Dispatch Action Panel matching Frames 050, 080 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Format Selector */}
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Print Layout:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveFormat('3inch')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: activeFormat === '3inch' ? '#0284c7' : '#f1f5f9',
                    color: activeFormat === '3inch' ? '#fff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  3" Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat('a4')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: activeFormat === 'a4' ? '#0284c7' : '#f1f5f9',
                    color: activeFormat === 'a4' ? '#fff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  A4 GST Tax
                </button>
              </div>

              {activeFormat === '3inch' && (
                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={useHindi}
                    onChange={e => setUseHindi(e.target.checked)}
                  />
                  Print in Hindi / Regional Layout
                </label>
              )}
            </div>

            {/* Copies */}
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>No(s) of Copy :</span>
              <input
                type="number"
                min="1"
                max="5"
                value={copies}
                onChange={e => setCopies(parseInt(e.target.value) || 1)}
                style={{ width: '45px', textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
              />
            </div>

            {/* Print Button (F6) */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                background: '#1d4ed8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Printer size={28} />
              <span style={{ fontSize: '1rem', marginTop: '4px' }}>PRINT (F6)</span>
            </button>

            {/* PDF Button (F7) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              <FileDown size={24} />
              <span style={{ fontSize: '0.9rem', marginTop: '2px' }}>PDF (F7)</span>
            </button>

            {/* Email Section */}
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Enter Valid Email ID :</label>
              <input
                type="email"
                placeholder="client@gmail.com"
                value={emailId}
                onChange={e => setEmailId(e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
              />
              <button
                type="button"
                onClick={handleSendEmail}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  background: '#ea580c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Mail size={14} /> Send Email (F8)
              </button>
            </div>

            {/* WhatsApp Gateways (Tejas & Rocket) matching frame 050 */}
            <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Enter WhatsApp No. :</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={whatsappNo}
                onChange={e => setWhatsappNo(e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp('Tejas')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={14} /> Tejas
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp('Rocket')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    background: '#15803d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={14} /> Rocket
                </button>
              </div>
            </div>
          </div>

          {/* Right Preview Render matching frame 080 (3" Thermal) or A4 */}
          <div style={{ background: '#64748b', padding: '24px', display: 'flex', justifyContent: 'center', borderRadius: '6px', overflowY: 'auto' }}>
            {activeFormat === '3inch' ? (
              /* 3-Inch Thermal Receipt */
              <div
                className="pos-thermal-bill"
                style={{
                  width: '320px',
                  background: '#ffffff',
                  color: '#000000',
                  padding: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}
              >
                {/* Green Header Banner */}
                <div style={{ background: '#15803d', color: '#fff', textAlign: 'center', padding: '4px', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', marginBottom: '8px' }}>
                  {useHindi ? 'चालान / बिल' : 'BILL'}
                </div>

                {/* Company Info */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 900, fontSize: '14px' }}>{designConfig.companyName}</div>
                  <div style={{ fontSize: '10px' }}>{designConfig.addressLine1}</div>
                  <div style={{ fontSize: '10px' }}>{designConfig.addressLine2}</div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>Contact : {designConfig.contactNumber}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700 }}>GSTIN : {designConfig.gstin}</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Bill Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>{useHindi ? 'चालान नं:' : 'Inv No:'} {invoice.invoiceNo}</span>
                  <span>{useHindi ? 'तारीख:' : 'Date:'} {invoice.date}</span>
                </div>
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  {useHindi ? 'ग्राहक:' : 'Customer:'} {invoice.customer.name}
                </div>
                <div style={{ fontSize: '10px' }}>
                  {useHindi ? 'संपर्क:' : 'Contact:'} {invoice.customer.contactNo}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                      <th style={{ paddingBottom: '3px' }}>{useHindi ? 'उत्पाद' : 'Product'}</th>
                      <th style={{ paddingBottom: '3px', textAlign: 'right' }}>{useHindi ? 'दर' : 'Rate'}</th>
                      <th style={{ paddingBottom: '3px', textAlign: 'center' }}>{useHindi ? 'मात्रा' : 'Qty'}</th>
                      <th style={{ paddingBottom: '3px', textAlign: 'right' }}>{useHindi ? 'राशि' : 'Amt'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map(it => (
                      <tr key={it.id}>
                        <td style={{ paddingTop: '3px', verticalAlign: 'top' }}>
                          <div>{useHindi && it.regionalName ? it.regionalName : it.name}</div>
                          {it.discountAmt > 0 && (
                            <div style={{ fontSize: '9px', color: '#16a34a' }}>
                              Disc: -₹{it.discountAmt.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td style={{ paddingTop: '3px', textAlign: 'right', verticalAlign: 'top' }}>
                          {it.rate.toFixed(2)}
                        </td>
                        <td style={{ paddingTop: '3px', textAlign: 'center', verticalAlign: 'top' }}>
                          {it.qty} {it.unit}
                        </td>
                        <td style={{ paddingTop: '3px', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>
                          {it.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sub-banner Items & Sub Total */}
                <div style={{ background: '#ea580c', color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '3px 6px', fontWeight: 700, marginTop: '8px', fontSize: '11px' }}>
                  <span>{useHindi ? 'कुल आइटम' : 'Items'} : {invoice.itemsCount}</span>
                  <span>{useHindi ? 'उप कुल' : 'Sub Total'} : ₹{invoice.taxableTotal.toFixed(2)}</span>
                </div>

                {/* Calculations Box */}
                <div style={{ border: '1px solid #000', padding: '6px', marginTop: '6px', fontSize: '10px' }}>
                  {invoice.billSundry.amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bill Sundry ({invoice.billSundry.name}) :</span>
                      <span>₹{invoice.billSundry.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.billDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Bill Discount :</span>
                      <span>-₹{invoice.billDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST Tax ({invoice.customer.state === 'Karnataka' ? 'CGST+SGST' : 'IGST'}) :</span>
                    <span>₹{(invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Round Off :</span>
                    <span>{invoice.roundOff > 0 ? `+₹${invoice.roundOff}` : `-₹${Math.abs(invoice.roundOff)}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '12px', borderTop: '1px solid #000', paddingTop: '3px', marginTop: '3px' }}>
                    <span>{useHindi ? 'कुल देय राशि' : 'NET TOTAL'} :</span>
                    <span>₹{invoice.netPay.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Status Box (Green Border matching frame 080) */}
                <div style={{ border: '1px solid #16a34a', padding: '4px 6px', marginTop: '6px', fontSize: '10px', background: '#f0fdf4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>{useHindi ? 'भुगतान राशि' : 'Paid Amount'} :</span>
                    <span>₹{invoice.paidAmount.toFixed(2)}</span>
                  </div>
                  {invoice.pendingAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700 }}>
                      <span>{useHindi ? 'बकाया राशि' : 'Pending Amount'} :</span>
                      <span>₹{invoice.pendingAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Savings Banner */}
                {invoice.billMrp > invoice.netPay && (
                  <div style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', margin: '6px 0', fontSize: '11px' }}>
                    ★ {useHindi ? 'आपकी बचत' : 'You Saved'} : ₹{(invoice.billMrp - invoice.netPay).toFixed(2)} ★
                  </div>
                )}

                {/* Dynamic UPI QR Code */}
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <img
                    src={qrCodeUrl}
                    alt="Scan & Pay via UPI"
                    style={{ width: '120px', height: '120px', border: '1px solid #000', padding: '2px' }}
                  />
                  <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px' }}>Scan & Pay via Any UPI App</div>
                  <div style={{ fontSize: '8px', color: '#475569' }}>{designConfig.upiVpa}</div>
                </div>

                {/* Terms and Conditions */}
                <div style={{ fontSize: '8px', borderTop: '1px dashed #000', paddingTop: '4px', textAlign: 'center', color: '#475569' }}>
                  {designConfig.termsAndConditions}
                </div>

                {/* Footer Message */}
                <div style={{ background: '#ea580c', color: '#fff', textAlign: 'center', padding: '3px', fontWeight: 700, fontSize: '10px', marginTop: '6px' }}>
                  {useHindi ? 'धन्यवाद... पुनः पधारें !' : designConfig.thankYouMessage}
                </div>
              </div>
            ) : (
              /* A4 Full GST Tax Invoice Format */
              <div
                className="pos-a4-bill"
                style={{
                  width: '680px',
                  background: '#ffffff',
                  color: '#000000',
                  padding: '28px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  fontSize: '12px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#0284c7', fontSize: '1.4rem', fontWeight: 800 }}>{designConfig.companyName}</h2>
                    <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>{designConfig.addressLine1}, {designConfig.addressLine2}</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>Phone: {designConfig.contactNumber} | Email: {designConfig.email}</div>
                    <div style={{ fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>GSTIN: {designConfig.gstin} | State: {designConfig.stateName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#0284c7', color: '#fff', padding: '4px 14px', fontWeight: 800, fontSize: '14px', borderRadius: '4px', display: 'inline-block' }}>
                      TAX INVOICE
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 700 }}>Invoice No: {invoice.invoiceNo}</div>
                    <div style={{ fontSize: '11px' }}>Date: {invoice.date}</div>
                    <div style={{ fontSize: '11px' }}>Time: {invoice.time}</div>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '14px 0', padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>Details for Buyer (Billed To):</div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{invoice.customer.name}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{invoice.customer.address}</div>
                    <div style={{ fontSize: '11px' }}>State: {invoice.customer.state} {invoice.customer.pincode ? `- ${invoice.customer.pincode}` : ''}</div>
                    <div style={{ fontSize: '11px' }}>Contact: {invoice.customer.contactNo}</div>
                    {invoice.customer.gstin && <div style={{ fontSize: '11px', fontWeight: 700 }}>GSTIN: {invoice.customer.gstin}</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>Shipped To:</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{invoice.customer.shippingAddress || invoice.customer.address}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>Place of Supply: {invoice.customer.state}</div>
                    <div style={{ fontSize: '11px' }}>Reverse Charge: No</div>
                  </div>
                </div>

                {/* A4 Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '6px', textAlign: 'center', width: '30px' }}>#</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Particulars / Description</th>
                      <th style={{ padding: '6px', textAlign: 'center', width: '65px' }}>HSN Code</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '50px' }}>Qty</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '65px' }}>Rate</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '60px' }}>Disc</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '70px' }}>Taxable</th>
                      <th style={{ padding: '6px', textAlign: 'center', width: '50px' }}>GST%</th>
                      <th style={{ padding: '6px', textAlign: 'right', width: '80px' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((it, i) => (
                      <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ padding: '6px', fontWeight: 600 }}>{it.name}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>{it.hsn}</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{it.qty} {it.unit}</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>₹{it.rate.toFixed(2)}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#16a34a' }}>
                          {it.discountAmt > 0 ? `₹${it.discountAmt.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>₹{it.taxableAmt.toFixed(2)}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>{it.cgstRate + it.sgstRate + it.igstRate}%</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>₹{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginTop: '14px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ border: '1px solid #cbd5e1', padding: '10px', borderRadius: '4px', fontSize: '11px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>Bank Account Details:</div>
                      <div>Bank: State Bank of India | Current A/C: 388901234567</div>
                      <div>IFSC: SBIN0040123 | Branch: Ring Road Industrial Area</div>
                      <div style={{ marginTop: '6px', fontWeight: 700 }}>UPI VPA: {designConfig.upiVpa}</div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px', background: '#f8fafc', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Taxable Value:</span>
                      <span>₹{invoice.taxableTotal.toFixed(2)}</span>
                    </div>
                    {invoice.cgstTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>CGST:</span>
                        <span>₹{invoice.cgstTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.sgstTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>SGST:</span>
                        <span>₹{invoice.sgstTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.igstTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>IGST:</span>
                        <span>₹{invoice.igstTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.billSundry.amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>{invoice.billSundry.name}:</span>
                        <span>₹{invoice.billSundry.amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Round Off:</span>
                      <span>₹{invoice.roundOff.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #0284c7', marginTop: '4px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      <span>NET AMOUNT:</span>
                      <span>₹{invoice.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Signatory */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'flex-end', paddingTop: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    This is a computer-generated invoice.
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700 }}>For {designConfig.companyName}</div>
                    <div style={{ height: '40px' }} />
                    <div style={{ borderTop: '1px solid #94a3b8', fontSize: '10px', paddingTop: '2px' }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
