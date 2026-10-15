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
          <div style={{ fontSize: '10px' }}>Mob: {companyInfo.contactNo}</div>

          <div style={{
            display: 'inline-block',
            border: '1px solid #000000',
            padding: '1px 12px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            margin: '4px 0'
          }}>
            {isHindi ? 'बिल' : taxScheme === 'NON_GST' ? 'RETAIL ESTIMATE' : taxScheme === 'COMPOSITION' ? 'BILL OF SUPPLY' : 'TAX INVOICE'}
          </div>

          <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />

          {/* Invoice Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>{isHindi ? 'बिल संख्या' : 'Bill No'}: {invoiceNo}</span>
            <span>{isHindi ? 'दिनांक' : 'Date'}: {date}</span>
          </div>
          <div style={{ textAlign: 'left', fontSize: '10px', marginTop: '2px' }}>
            {isHindi ? 'ग्राहक' : 'Customer'}: {customer.name} ({customer.phone})
          </div>
          {customer.gstin && (
            <div style={{ textAlign: 'left', fontSize: '10px', fontWeight: 'bold' }}>
              Buyer GSTIN: {customer.gstin}
            </div>
          )}

          <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />
        </div>

        {/* Item Table */}
        <table style={{
          width: '100%',
          fontSize: isCompact ? '9px' : '10px',
          borderCollapse: 'collapse',
          border: isBoxed ? '1px solid #000' : 'none'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', background: isBoxed ? '#f1f5f9' : 'transparent' }}>
              <th style={{ textAlign: 'left', padding: '3px 2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                {isHindi ? 'विवरण' : 'Item'}
              </th>
              <th style={{ textAlign: 'center', padding: '3px 2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                {isHindi ? 'मात्रा' : 'Qty'}
              </th>
              <th style={{ textAlign: 'right', padding: '3px 2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                {isHindi ? 'दर' : 'Rate'}
              </th>
              <th style={{ textAlign: 'right', padding: '3px 2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                {isHindi ? 'राशि' : 'Amount'}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id || idx} style={{ borderBottom: isBoxed ? '1px solid #000' : 'none' }}>
                <td style={{ textAlign: 'left', padding: '2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                  <div style={{ fontWeight: 'bold' }}>{it.name.substring(0, 18)}</div>
                  {(it.size || it.colour) && (
                    <div style={{ fontSize: '8px', color: '#475569' }}>
                      {it.size ? `${it.size} ` : ''}{it.colour || ''}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: '2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                  {it.qty} {it.unit || ''}
                </td>
                <td style={{ textAlign: 'right', padding: '2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                  {it.rate.toFixed(2)}
                </td>
                <td style={{ textAlign: 'right', padding: '2px', border: isBoxed ? '1px solid #000' : 'none' }}>
                  {it.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderBottom: isBoxed ? '1px solid #000' : '1px dashed #000', margin: '4px 0' }} />

        {/* Totals */}
        <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{isHindi ? 'कुल मात्रा' : 'Total Qty'}:</span>
            <span style={{ fontWeight: 'bold' }}>{totalQty.toFixed(2)}</span>
          </div>
          {totalDisc > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{isHindi ? 'छूट' : 'Discount'}:</span>
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
            <span>{isHindi ? 'कुल देय' : 'NET PAYABLE'}:</span>
            <span>₹ {netPay.toFixed(2)}</span>
          </div>

          {/* Frame 150 "You Saved" Box */}
          {totalDisc > 0 && (
            <div style={{
              textAlign: 'center',
              border: '1px solid #000',
              padding: '3px',
              margin: '4px 0',
              fontWeight: 'bold',
              background: '#f8fafc'
            }}>
              <div>You Saved</div>
              <div style={{ fontSize: '12px' }}>₹ {totalDisc.toFixed(2)}</div>
            </div>
          )}

          <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '4px' }}>
            {numberToWords(netPay)}
          </div>
        </div>

        {/* QR Code Section (Styles 7, 5, 1, 2) */}
        {(isQrFocus || config.showDynamicQr) && (
          <div style={{ textAlign: 'center', marginTop: '8px', padding: '6px', background: '#f8fafc', border: '1px dashed #94a3b8' }}>
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
          {companyInfo.website && <span>{companyInfo.website}<br /></span>}
          <span>Powered by Retail Daddy 1.6</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. A4 & A5 FULL PAGE / HALF PAGE INVOICE
  // ==========================================
  const isA5 = paperFormat === 'A5';
  const containerWidth = isA5 ? '560px' : '760px';
  const minHeight = isA5 ? '480px' : '920px';

  // Specific Style Accents from Video 21
  const headerBg =
    styleIndex === 1 ? '#1e293b' :
    styleIndex === 2 ? '#0f766e' :
    styleIndex === 3 ? '#b91c1c' : // Frame 065 style 3 light red / pink header
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
          {/* Logo or Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt="Company Logo" style={{ height: '40px', objectFit: 'contain' }} />
            ) : (
              <div style={{
                background: headerBg,
                color: '#ffffff',
                fontWeight: '900',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                SVF
              </div>
            )}
            <div>
              <div style={{ fontSize: isA5 ? '15px' : '18px', fontWeight: '900', color: headerBg }}>
                {companyInfo.name}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                {companyInfo.address}, {companyInfo.city}, {companyInfo.state}
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>
                GSTIN: <strong>{companyInfo.gstin}</strong> | State Code: 32 | Ph: {companyInfo.contactNo}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Title & Numbers */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: isA5 ? '14px' : '17px',
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

      {/* Buyer (B2B / B2C) Details Strip */}
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
                {(it.size || it.colour) && (
                  <div style={{ fontSize: '8px', color: '#64748b' }}>
                    {it.size ? `Size: ${it.size} ` : ''}{it.colour ? `Colour: ${it.colour}` : ''}
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
        {/* Left: Bank Details & Amount In Words */}
        <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
          <div><strong>Amount In Words:</strong> {numberToWords(netPay)}</div>

          {companyInfo.bankName && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              border: '1px dashed #cbd5e1',
              borderRadius: '4px',
              background: '#f8fafc'
            }}>
              <div style={{ fontWeight: 'bold', color: headerBg }}>Bank Details for NEFT / RTGS:</div>
              <div>Bank: {companyInfo.bankName} | Branch: {companyInfo.branch || 'Vaikom'}</div>
              <div>A/c No: {companyInfo.accountNo || '38920192831'} | IFSC: {companyInfo.ifsc || 'SBIN0070123'}</div>
              <div>A/c Name: {companyInfo.accountName || companyInfo.name}</div>
            </div>
          )}

          {/* Dynamic UPI QR Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <img src={qrImageSrc} alt="UPI QR" style={{ width: '64px', height: '64px', border: '1px solid #cbd5e1' }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '9px' }}>Instant UPI Scan & Pay</div>
              <div style={{ fontSize: '8px', color: '#475569' }}>Scan with GPay/PhonePe to pay exact bill net amount</div>
            </div>
          </div>
        </div>

        {/* Right: Totals Box */}
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
  );
}
