import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { dynamicQrService, type DqrPayload } from '../../services/dynamicQrDisplayService';

interface CustomerFacingQrDisplayProps {
  embedded?: boolean;
}

export function CustomerFacingQrDisplay({ embedded = false }: CustomerFacingQrDisplayProps) {
  const [payload, setPayload] = useState<DqrPayload>(dynamicQrService.getCurrentPayload());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync state from dynamicQrService
  useEffect(() => {
    const unsubscribe = dynamicQrService.subscribe((newPayload) => {
      setPayload(newPayload);
    });
    return () => unsubscribe();
  }, []);

  // Generate QR Code data URL when payload upiUri changes
  useEffect(() => {
    if (!payload.upiUri) return;
    let active = true;

    QRCode.toDataURL(payload.upiUri, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 480,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('[DQR Display] QR gen error:', err);
      });

    return () => {
      active = false;
    };
  }, [payload.upiUri, payload.netPay]);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: embedded ? '100%' : '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* TOP BRANDING BAR */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '2px solid rgba(234, 179, 8, 0.4)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.35)'
            }}
          >
            🛋️
          </div>
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '900',
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #ffffff 0%, #fef08a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {payload.storeName || 'SHREE VINAYAKA FURNITURES'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginTop: '2px' }}>
              Premium Teakwood & Godrej Knockdown Flat-Pack Furniture Showroom
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#38bdf8',
              fontFamily: 'monospace'
            }}
          >
            🕒 {currentTime}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#064e3b',
              color: '#6ee7b7',
              border: '1px solid #059669',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
            <span>POS Connected</span>
          </div>

          {!embedded && (
            <button
              onClick={handleToggleFullscreen}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
              title="Toggle Fullscreen [F11]"
            >
              {isFullscreen ? '✕' : '⛶'}
            </button>
          )}
        </div>
      </header>

      {/* MAIN DISPLAY BODY */}
      <main style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* ================================================================ */}
        {/* STATE 1: IDLE / WELCOME SCREEN                                    */}
        {/* ================================================================ */}
        {payload.state === 'IDLE' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '24px'
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.05) 100%)',
                border: '2px solid rgba(234, 179, 8, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                boxShadow: '0 0 40px rgba(234, 179, 8, 0.25)'
              }}
            >
              ✨
            </div>

            <div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                  marginBottom: '8px'
                }}
              >
                Welcome to Shree Vinayaka Furnitures
              </div>
              <div style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '650px', margin: '0 auto', lineHeight: 1.5 }}>
                Your destination for handcrafted Solid Teakwood Dining, Living & Bedroom Sets, and Godrej Flat-Pack Steel Furniture.
              </div>
            </div>

            {/* Showcase Badges */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
              {[
                { icon: '🪵', label: '100% Solid Teakwood' },
                { icon: '🛡️', label: '10-Year Warranty' },
                { icon: '📦', label: 'Godrej Authorized' },
                { icon: '⚡', label: 'Instant UPI Dynamic QR' }
              ].map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#f8fafc'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px dashed rgba(234, 179, 8, 0.4)',
                borderRadius: '8px',
                color: '#fef08a',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              👋 Please present your selected items or barcode tickets to the billing counter.
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STATE 2: LIVE BILLING CART DISPLAY                               */}
        {/* ================================================================ */}
        {payload.state === 'BILLING' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', height: '100%' }}>
            {/* Left: Scanned Items Table */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛒 Current Bill:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{payload.billNo}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Customer: <strong style={{ color: '#ffffff' }}>{payload.customerName}</strong>
                </div>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>Item Description</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px', width: '60px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', width: '90px' }}>Rate</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', width: '100px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: '600', color: '#f8fafc' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: '#cbd5e1' }}>
                          ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Real-time Running Total Card */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '16px' }}>
                  Bill Summary
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Subtotal:</span>
                    <span>₹{payload.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {payload.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontWeight: 'bold' }}>
                      <span>Discount:</span>
                      <span>-₹{payload.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {payload.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>GST:</span>
                      <span>₹{payload.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Huge Net Total Highlight */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.05) 100%)',
                  border: '2px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Amount to Pay
                </div>
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: '900',
                    color: '#ffffff',
                    marginTop: '6px',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  ₹{payload.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Scan UPI QR code once cashier finishes checkout
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STATE 3: DYNAMIC UPI QR PAYMENT PROMPT                           */}
        {/* ================================================================ */}
        {payload.state === 'PAYING' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px'
            }}
          >
            {/* Left: Dynamic QR Code Box */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                border: '4px solid #eab308',
                position: 'relative'
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="BHIM UPI Dynamic QR Code"
                  style={{
                    width: '280px',
                    height: '280px',
                    display: 'block',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '280px',
                    height: '280px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '14px'
                  }}
                >
                  Generating UPI QR...
                </div>
              )}

              {/* Supported UPI Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>ACCEPTED:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7' }}>GPay</span>
                <span>•</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1' }}>PhonePe</span>
                <span>•</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7' }}>Paytm</span>
                <span>•</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a' }}>BHIM</span>
                <span>•</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>Cred</span>
              </div>
            </div>

            {/* Right: Payment Instructions & Amount */}
            <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#fef08a',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '800',
                    marginBottom: '10px'
                  }}
                >
                  <span>⚡</span> DYNAMIC BHIM UPI
                </div>
                <div style={{ fontSize: '15px', color: '#cbd5e1' }}>
                  Bill: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{payload.billNo}</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Exact Amount to Pay
                </div>
                <div
                  style={{
                    fontSize: '52px',
                    fontWeight: '900',
                    color: '#ffffff',
                    lineHeight: 1.1,
                    marginTop: '4px',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  ₹{payload.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Instructions Pill */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>1.</span>
                  <span>Open <strong>Google Pay, PhonePe, Paytm</strong> or any UPI App</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>2.</span>
                  <span>Scan the QR code displayed on this stand</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>3.</span>
                  <span>Confirm payment of <strong>₹{payload.netPay.toFixed(2)}</strong></span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                UPI ID: <strong style={{ color: '#94a3b8' }}>{payload.storeUpiId}</strong> • Verified Showroom Account
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STATE 4: PAYMENT SUCCESS / CELEBRATION                           */}
        {/* ================================================================ */}
        {payload.state === 'PAID' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '20px'
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                boxShadow: '0 0 50px rgba(16, 185, 129, 0.6)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              ✓
            </div>

            <div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#6ee7b7' }}>
                Payment Received Successfully!
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginTop: '6px' }}>
                ₹{payload.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {payload.utr && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #059669',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  color: '#a7f3d0'
                }}
              >
                UPI Reference / UTR: <strong style={{ fontFamily: 'monospace' }}>{payload.utr}</strong>
              </div>
            )}

            <div style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '500px', lineHeight: 1.5 }}>
              Thank you for shopping at <strong>Shree Vinayaka Furnitures</strong>! Your invoice has been generated.
            </div>
          </div>
        )}
      </main>

      {/* FOOTER STRIP */}
      <footer
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}
      >
        <div>
          Official Dynamic QR (DQR) Stand Interface • Compatible with Eventum Hardware (ID: 2858609017388)
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>🔒 Secured via NPCI BHIM UPI</span>
          <span>•</span>
          <span>Zero Data Stored</span>
        </div>
      </footer>
    </div>
  );
}
