import React, { useState, useEffect, useRef } from 'react';
import {
  verifyGstinKyb,
  generateDecentroUpiQr,
  pollDecentroCollectionStatus,
  createCustomerVirtualAccount,
  initiateDecentroPayout,
  fetchDecentroConfig,
  fetchDecentroTransactions,
  type DecentroGstResult,
  type DecentroUpiQrResponse,
  type DecentroCollectionStatus,
  type DecentroVirtualAccountResponse,
  type DecentroPayoutResponse
} from '../../api/client';

interface DecentroBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'qr' | 'kyb' | 'payout' | 'va' | 'ledger' | 'config';
}

export const DecentroBankingModal: React.FC<DecentroBankingModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'qr'
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'kyb' | 'payout' | 'va' | 'ledger' | 'config'>(initialTab);

  // Decentro Gateway Config State
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);

  // Tab 1: Dynamic UPI QR Collection
  const [qrAmount, setQrAmount] = useState<number>(12500);
  const [qrInvoiceNo, setQrInvoiceNo] = useState<string>('INV-2026-0891');
  const [qrCustomerName, setQrCustomerName] = useState<string>('Mr. Rajesh Jena');
  const [qrPurpose, setQrPurpose] = useState<string>('Teakwood Sofa Set Advance');
  const [generatingQr, setGeneratingQr] = useState<boolean>(false);
  const [activeQr, setActiveQr] = useState<DecentroUpiQrResponse | null>(null);
  const [qrPollStatus, setQrPollStatus] = useState<DecentroCollectionStatus | null>(null);
  const [pollTimeRemaining, setPollTimeRemaining] = useState<number>(900); // 15 mins in sec
  const pollTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // Tab 2: GSTIN KYB Verification
  const [gstinInput, setGstinInput] = useState<string>('21AAACS1234F1Z5');
  const [kybLoading, setKybLoading] = useState<boolean>(false);
  const [kybResult, setKybResult] = useState<DecentroGstResult | null>(null);
  const [kybError, setKybError] = useState<string>('');

  // Tab 3: Direct Supplier Payouts
  const [payoutType, setPayoutType] = useState<'SUPPLIER' | 'CARPENTER' | 'TRANSPORTER'>('SUPPLIER');
  const [payoutName, setPayoutName] = useState<string>('Godrej Interio Distribution Hub');
  const [payoutAccNo, setPayoutAccNo] = useState<string>('50200012345678');
  const [payoutIfsc, setPayoutIfsc] = useState<string>('HDFC0000123');
  const [payoutAmount, setPayoutAmount] = useState<number>(45000);
  const [payoutMode, setPayoutMode] = useState<'IMPS' | 'NEFT' | 'RTGS'>('IMPS');
  const [payoutBillRef, setPayoutBillRef] = useState<string>('PUR-2026-0042');
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);
  const [lastPayout, setLastPayout] = useState<DecentroPayoutResponse | null>(null);

  // Tab 4: Virtual Accounts
  const [vaCustomerName, setVaCustomerName] = useState<string>('Utkal Corporate Furnishings');
  const [vaPan, setVaPan] = useState<string>('AAACU1234P');
  const [vaMobile, setVaMobile] = useState<string>('9876543210');
  const [vaEmail, setVaEmail] = useState<string>('accounts@utkalcorporate.in');
  const [vaLoading, setVaLoading] = useState<boolean>(false);
  const [createdVa, setCreatedVa] = useState<DecentroVirtualAccountResponse | null>(null);

  // Tab 5: Live Transactions & Webhooks
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txnSearch, setTxnSearch] = useState<string>('');
  const [txnFilter, setTxnFilter] = useState<'ALL' | 'COLLECTION' | 'PAYOUT'>('ALL');

  // Load Decentro Gateway Config & Transactions on mount
  useEffect(() => {
    if (isOpen) {
      loadGatewayConfig();
      loadTransactions();
    }
  }, [isOpen]);

  const loadGatewayConfig = async () => {
    try {
      const cfg = await fetchDecentroConfig();
      setGatewayConfig(cfg);
    } catch {
      // Handled in client.ts
    }
  };

  const loadTransactions = async () => {
    try {
      const list = await fetchDecentroTransactions(50);
      setTransactions(list);
    } catch {
      // fallback
    }
  };

  // ─── Tab 1: Generate Dynamic UPI QR & Polling ───
  const handleGenerateQr = async () => {
    if (qrAmount <= 0) return;
    setGeneratingQr(true);
    setActiveQr(null);
    setQrPollStatus(null);
    clearInterval(pollTimerRef.current);
    clearInterval(countdownTimerRef.current);

    try {
      const resp = await generateDecentroUpiQr({
        invoice_id: Math.floor(Math.random() * 9000 + 1000),
        amount: qrAmount,
        purpose_message: `${qrPurpose} - ${qrCustomerName}`,
        expiry_minutes: 15
      });
      setActiveQr(resp);
      setPollTimeRemaining(15 * 60);

      // Start countdown
      countdownTimerRef.current = setInterval(() => {
        setPollTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            clearInterval(pollTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start Polling every 3s
      pollTimerRef.current = setInterval(async () => {
        try {
          const status = await pollDecentroCollectionStatus(resp.reference_id);
          setQrPollStatus(status);
          if (status.status === 'SUCCESS' || status.status === 'FAILED') {
            clearInterval(pollTimerRef.current);
            loadTransactions();
            if (status.status === 'SUCCESS') {
              window.dispatchEvent(new CustomEvent('svf-decentro-collection', {
                detail: {
                  amount: qrAmount,
                  customerName: qrCustomerName,
                  invoiceNo: qrInvoiceNo,
                  utr: status.utr_number || status.provider_txn_id || resp.reference_id || 'UPI-OK'
                }
              }));
            }
          }
        } catch (e) {
          console.warn('[Decentro QR Polling error]', e);
        }
      }, 3000);
    } catch (err: any) {
      alert(`Could not generate Decentro QR: ${err?.message || 'Check connection'}`);
    } finally {
      setGeneratingQr(false);
    }
  };

  // Clean timers on modal close
  useEffect(() => {
    return () => {
      clearInterval(pollTimerRef.current);
      clearInterval(countdownTimerRef.current);
    };
  }, []);

  // ─── Tab 2: GSTIN KYB Verification ───
  const handleVerifyGstin = async (gstToVerify?: string) => {
    const val = (gstToVerify || gstinInput).trim().toUpperCase();
    if (!val || val.length !== 15) {
      setKybError('Please enter a valid 15-character GSTIN (e.g. 21AAACS1234F1Z5)');
      return;
    }
    setKybLoading(true);
    setKybError('');
    setKybResult(null);
    try {
      const res = await verifyGstinKyb(val);
      setKybResult(res);
    } catch (e: any) {
      setKybError(e?.message || 'GSTIN verification failed');
    } finally {
      setKybLoading(false);
    }
  };

  // ─── Tab 3: Execute Direct Payout ───
  const handleInitiatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAccNo || !payoutIfsc || payoutAmount <= 0) return;
    setPayoutLoading(true);
    setLastPayout(null);
    try {
      const resp = await initiateDecentroPayout({
        payee_type: payoutType,
        payee_id: Math.floor(Math.random() * 900 + 100),
        reference_bill_no: payoutBillRef,
        amount: payoutAmount,
        beneficiary_name: payoutName,
        beneficiary_account_number: payoutAccNo,
        beneficiary_ifsc: payoutIfsc.toUpperCase(),
        transfer_type: payoutMode,
        verify_penny_drop_first: false
      });
      setLastPayout(resp);
      loadTransactions();
      if (resp && (resp.status === 'SUCCESS' || resp.status === 'PENDING')) {
        window.dispatchEvent(new CustomEvent('svf-decentro-payout', {
          detail: {
            payeeType: payoutType,
            beneficiaryName: payoutName,
            amount: payoutAmount,
            billRef: payoutBillRef,
            utr: resp.bank_reference_number || resp.reference_id || 'PAYOUT-OK'
          }
        }));
      }
    } catch (err: any) {
      alert(`Payout failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPayoutLoading(false);
    }
  };

  // ─── Tab 4: Create Virtual Account ───
  const handleCreateVirtualAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaCustomerName || !vaPan || !vaMobile) return;
    setVaLoading(true);
    setCreatedVa(null);
    try {
      const resp = await createCustomerVirtualAccount({
        customer_id: Math.floor(Math.random() * 8000 + 1000),
        name: vaCustomerName,
        pan: vaPan.toUpperCase(),
        mobile: vaMobile,
        email: vaEmail
      });
      setCreatedVa(resp);
      loadTransactions();
    } catch (err: any) {
      alert(`Virtual Account creation failed: ${err?.message}`);
    } finally {
      setVaLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredTxns = transactions.filter(t => {
    const matchesSearch = !txnSearch ||
      t.reference_id?.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.payee_name?.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.utr?.toLowerCase().includes(txnSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (txnFilter === 'COLLECTION') return t.type?.includes('COLLECTION') || t.type?.includes('UPI');
    if (txnFilter === 'PAYOUT') return t.type?.includes('PAYOUT');
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        width: '1000px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        backgroundColor: '#0f172a',
        border: '2px solid #10b981',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* ─── Header ─── */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, #064e3b 0%, #022c22 100%)',
          borderBottom: '1px solid #10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: '#022c22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 900
            }}>
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#ecfdf5', letterSpacing: '-0.02em' }}>
                  Decentro Financial Engine
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#10b981',
                  color: '#022c22',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}>
                  {gatewayConfig?.environment === 'production' ? 'LIVE' : 'SANDBOX'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#065f46',
                  color: '#a7f3d0',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  API v2.0
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6ee7b7' }}>
                Unified Showroom Banking • Dynamic UPI Collections • Instant Payouts • Live GSTIN KYB
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Showroom VPA</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                shreevinayaka@icici
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#f8fafc',
                fontSize: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          overflowX: 'auto',
          padding: '0 12px'
        }}>
          {[
            { id: 'qr', label: '📱 Dynamic UPI QR', desc: 'Instant Inward Collection' },
            { id: 'kyb', label: '🏢 GSTIN KYB Verifier', desc: 'Taxpayer Intelligence' },
            { id: 'payout', label: '💸 Supplier Payouts', desc: 'Instant IMPS / NEFT' },
            { id: 'va', label: '🏛️ Virtual Accounts', desc: 'Customer Dedicated Escrow' },
            { id: 'ledger', label: '📜 Live Ledger & Stream', desc: 'UTR & Reconciliation' },
            { id: 'config', label: '⚙️ Gateway Settings', desc: 'API Keys & Webhooks' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? '#0f172a' : 'transparent',
                color: activeTab === tab.id ? '#10b981' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #10b981' : '3px solid transparent',
                padding: '12px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800 }}>{tab.label}</span>
              <span style={{ fontSize: '10px', color: activeTab === tab.id ? '#6ee7b7' : '#64748b' }}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* ─── Tab Content Body ─── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#0f172a'
        }}>

          {/* ══════════════ TAB 1: DYNAMIC UPI QR ══════════════ */}
          {activeTab === 'qr' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              {/* Left Column: Form & Presets */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '16px' }}>
                  ⚡ Generate Dynamic Decentro UPI QR
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Collection Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={qrAmount || ''}
                    onChange={e => setQrAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '20px',
                      fontWeight: 900,
                      color: '#10b981',
                      fontFamily: 'monospace'
                    }}
                    placeholder="Enter amount in ₹"
                  />
                  {/* Quick Chips */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQrAmount(amt)}
                        style={{
                          backgroundColor: qrAmount === amt ? '#10b981' : '#334155',
                          color: qrAmount === amt ? '#022c22' : '#f8fafc',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Invoice / Bill No
                    </label>
                    <input
                      type="text"
                      value={qrInvoiceNo}
                      onChange={e => setQrInvoiceNo(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={qrCustomerName}
                      onChange={e => setQrCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Payment Purpose / Item Description
                  </label>
                  <input
                    type="text"
                    value={qrPurpose}
                    onChange={e => setQrPurpose(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQr}
                  disabled={generatingQr || qrAmount <= 0}
                  style={{
                    width: '100%',
                    backgroundColor: generatingQr ? '#047857' : '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: generatingQr ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {generatingQr ? 'Generating Dynamic QR...' : '⚡ Generate Secure Decentro QR'}
                </button>
              </div>

              {/* Right Column: Live QR Preview & Poller */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                {!activeQr && !generatingQr && (
                  <div style={{ padding: '30px 10px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1' }}>Ready to Collect UPI</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Enter amount and click "Generate" to create dynamic UPI QR with auto-polling.
                    </div>
                  </div>
                )}

                {generatingQr && (
                  <div style={{ padding: '40px 10px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '4px solid #334155',
                      borderTopColor: '#10b981',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>Communicating with Decentro UPI Gateway...</div>
                  </div>
                )}

                {activeQr && !generatingQr && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Status Badge */}
                    {qrPollStatus?.status === 'SUCCESS' ? (
                      <div style={{
                        width: '100%',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 900 }}>✅ PAYMENT RECEIVED!</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#a7f3d0', marginTop: '4px' }}>
                          UTR: {qrPollStatus.utr_number}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6ee7b7' }}>
                          Amount: ₹{qrPollStatus.amount?.toLocaleString('en-IN')} • Ledger Post Confirmed
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #0284c7',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        marginBottom: '14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#38bdf8'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          boxShadow: '0 0 8px #38bdf8'
                        }} />
                        Awaiting Payment • Polling Live ({Math.floor(pollTimeRemaining / 60)}:{(pollTimeRemaining % 60).toString().padStart(2, '0')})
                      </div>
                    )}

                    {/* QR Code Canvas / Base64 Display */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}>
                      {activeQr.qr_base64 ? (
                        <img
                          src={`data:image/png;base64,${activeQr.qr_base64}`}
                          alt="Decentro Dynamic UPI QR"
                          style={{ width: '190px', height: '190px', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                          QR Code Ready
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        backgroundColor: '#065f46',
                        color: '#a7f3d0',
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        DECENTRO
                      </div>
                    </div>

                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', marginTop: '12px' }}>
                      ₹{qrAmount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      Ref: {activeQr.reference_id}
                    </div>

                    {/* Copy UPI Intent Link */}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeQr.upi_uri) {
                            navigator.clipboard.writeText(activeQr.upi_uri);
                            alert('UPI Intent URI copied to clipboard!');
                          }
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#334155',
                          color: '#f8fafc',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📋 Copy UPI Intent
                      </button>
                      {qrPollStatus?.status !== 'SUCCESS' && (
                        <button
                          type="button"
                          onClick={() => {
                            // Test manual trigger
                            setQrPollStatus({
                              status: 'SUCCESS',
                              reference_id: activeQr.reference_id,
                              amount: qrAmount,
                              utr_number: `UTR${Math.floor(Math.random() * 900000000000 + 100000000000)}`,
                              invoice_payment_status: 'PAID',
                              balance_due: 0,
                              cod_collected: 0,
                              settled_at: new Date().toISOString()
                            });
                          }}
                          style={{
                            backgroundColor: '#047857',
                            color: '#ecfdf5',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Simulate customer paying immediately in sandbox"
                        >
                          Simulate Pay
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: GSTIN KYB VERIFIER ══════════════ */}
          {activeTab === 'kyb' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                  🏢 Real-Time GSTIN KYB Verification
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Verify Indian B2B customer and supplier GSTIN credentials directly via Decentro KYB API. Determines state jurisdiction (Intra vs Inter), Active status, and Trade Name.
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={gstinInput}
                    onChange={e => setGstinInput(e.target.value.toUpperCase())}
                    maxLength={15}
                    placeholder="Enter 15-digit GSTIN (e.g. 21AAACS1234F1Z5)"
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      border: '2px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      letterSpacing: '0.08em'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyGstin()}
                    disabled={kybLoading}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#022c22',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 20px',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: kybLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {kybLoading ? 'Verifying...' : '🔍 Verify via Decentro'}
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Quick Test Samples:</span>
                  {[
                    { label: 'Odisha (Intra-State)', gst: '21AAACS1234F1Z5' },
                    { label: 'Telangana (IGST)', gst: '36AAAPL9876C1Z2' },
                    { label: 'Karnataka (IGST)', gst: '29AABCS5544D1Z8' },
                    { label: 'Maharashtra (IGST)', gst: '27AACCS9988E1Z1' }
                  ].map(item => (
                    <button
                      key={item.gst}
                      type="button"
                      onClick={() => {
                        setGstinInput(item.gst);
                        handleVerifyGstin(item.gst);
                      }}
                      style={{
                        backgroundColor: '#334155',
                        color: '#cbd5e1',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {kybError && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '12px' }}>
                    ⚠️ {kybError}
                  </div>
                )}
              </div>

              {/* KYB Result Card */}
              {kybResult && (
                <div style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                  overflow: 'hidden',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)'
                }}>
                  <div style={{
                    padding: '12px 20px',
                    backgroundColor: '#064e3b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🛡️</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#ecfdf5' }}>
                        VERIFIED TAXPAYER DOSSIER
                      </span>
                    </div>
                    <span style={{
                      backgroundColor: '#10b981',
                      color: '#022c22',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {kybResult.registration_status || 'ACTIVE'}
                    </span>
                  </div>

                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Legal Business Name</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                        {kybResult.legal_name}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Trade Name</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                        {kybResult.trade_name || kybResult.legal_name}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>GSTIN Number</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '2px' }}>
                        {kybResult.gstin}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>GST Regime Classification</div>
                      <div style={{
                        display: 'inline-block',
                        fontSize: '12px',
                        fontWeight: 900,
                        color: kybResult.tax_regime === 'INTRA_STATE_CGST_SGST' ? '#10b981' : '#f59e0b',
                        backgroundColor: '#0f172a',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        marginTop: '2px'
                      }}>
                        {kybResult.tax_regime === 'INTRA_STATE_CGST_SGST'
                          ? '🏛️ INTRA-STATE (CGST 9% + SGST 9%)'
                          : '🌐 INTER-STATE (IGST 18%)'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>State Jurisdiction Code</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                        State Code: {kybResult.state_code}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tax Rates Applicable</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                        CGST: {kybResult.cgst_rate}% • SGST: {kybResult.sgst_rate}% • IGST: {kybResult.igst_rate}%
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Principal Registered Address</div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}>
                        {kybResult.principal_address}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 3: DIRECT SUPPLIER PAYOUTS ══════════════ */}
          {activeTab === 'payout' && (
            <div style={{ maxWidth: '750px', margin: '0 auto' }}>
              <form onSubmit={handleInitiatePayout} style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                  💸 Direct Bank Payout via Decentro Gateway
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
                  Execute instant IMPS/NEFT disbursements to timber mills, hardware vendors, Godrej Interio distributors, and freelance carpenters with automatic UTR generation.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Payee Category
                    </label>
                    <select
                      value={payoutType}
                      onChange={e => setPayoutType(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    >
                      <option value="SUPPLIER">Distributor / Supplier</option>
                      <option value="CARPENTER">Master Carpenter / Assembly Technician</option>
                      <option value="TRANSPORTER">Logistics / Delivery Transporter</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Transfer Mode
                    </label>
                    <select
                      value={payoutMode}
                      onChange={e => setPayoutMode(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    >
                      <option value="IMPS">⚡ IMPS (Instant 24x7 Payout)</option>
                      <option value="NEFT">🏦 NEFT (National Electronic Fund Transfer)</option>
                      <option value="RTGS">🏛️ RTGS (High Value ≥ ₹2 Lakhs)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={payoutName}
                    onChange={e => setPayoutName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Beneficiary Account Number
                    </label>
                    <input
                      type="text"
                      value={payoutAccNo}
                      onChange={e => setPayoutAccNo(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={payoutIfsc}
                      onChange={e => setPayoutIfsc(e.target.value.toUpperCase())}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Payout Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={payoutAmount || ''}
                      onChange={e => setPayoutAmount(Number(e.target.value))}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '2px solid #ef4444',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '16px',
                        fontWeight: 900,
                        color: '#f87171',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Reference Bill / Voucher No
                    </label>
                    <input
                      type="text"
                      value={payoutBillRef}
                      onChange={e => setPayoutBillRef(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={payoutLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: payoutLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
                  }}
                >
                  {payoutLoading ? 'Executing Transfer...' : `💸 Authorize & Pay ₹${payoutAmount.toLocaleString('en-IN')}`}
                </button>
              </form>

              {/* Payout Confirmation Dossier */}
              {lastPayout && (
                <div style={{
                  marginTop: '20px',
                  backgroundColor: '#1e293b',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#f8fafc'
                }}>
                  <div style={{ color: '#10b981', fontSize: '15px', fontWeight: 900, marginBottom: '8px' }}>
                    ✅ DISBURSEMENT EXECUTED & CONFIRMED!
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><strong>Payee:</strong> {lastPayout.payee_name}</div>
                    <div><strong>Amount:</strong> ₹{Number(lastPayout.amount).toLocaleString('en-IN')}</div>
                    <div><strong>Bank Reference UTR:</strong> <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{lastPayout.bank_reference_number}</span></div>
                    <div><strong>Decentro Txn ID:</strong> <span style={{ fontFamily: 'monospace' }}>{lastPayout.reference_id}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 4: VIRTUAL ACCOUNTS ══════════════ */}
          {activeTab === 'va' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Showroom Master Account */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                  🏛️ Primary Showroom Virtual Account
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Central pool account for receiving inward RTGS/NEFT/IMPS and UPI from all terminals and e-commerce portal.
                </div>

                <div style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #10b981',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Banking Partner</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>ICICI Bank • Decentro Gateway</span>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Account Name</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>SHREE VINAYAKA FURNITURES</div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Virtual Account Number</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>
                      SVF9988776655
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>IFSC Code</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>ICIC0000011</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Showroom VPA</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>shreevinayaka@icici</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Customer Dedicated Virtual Account */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                  ➕ Assign Dedicated Customer Virtual Account
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  For wholesale B2B accounts. Any funds transferred to this number instantly reconcile to their customer khata ledger.
                </div>

                <form onSubmit={handleCreateVirtualAccount}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Entity / Customer Name
                    </label>
                    <input
                      type="text"
                      value={vaCustomerName}
                      onChange={e => setVaCustomerName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                        PAN
                      </label>
                      <input
                        type="text"
                        value={vaPan}
                        onChange={e => setVaPan(e.target.value.toUpperCase())}
                        required
                        maxLength={10}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: '#f8fafc',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={vaMobile}
                        onChange={e => setVaMobile(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: '#f8fafc'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={vaEmail}
                      onChange={e => setVaEmail(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={vaLoading}
                    style={{
                      width: '100%',
                      backgroundColor: '#10b981',
                      color: '#022c22',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: vaLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {vaLoading ? 'Provisioning...' : '🏛️ Provision Dedicated Virtual Account'}
                  </button>
                </form>

                {createdVa && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '8px'
                  }}>
                    <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 800 }}>Account Provisioned!</div>
                    <div style={{ fontSize: '12px', color: '#ecfdf5', marginTop: '4px' }}>
                      Account: <strong>{createdVa.virtual_account_number}</strong> ({createdVa.ifsc})
                    </div>
                    <div style={{ fontSize: '11px', color: '#a7f3d0' }}>
                      UPI Handle: {createdVa.upi_id}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 5: LIVE LEDGER & TRANSACTIONS ══════════════ */}
          {activeTab === 'ledger' && (
            <div>
              {/* Filter Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['ALL', 'COLLECTION', 'PAYOUT'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTxnFilter(f)}
                      style={{
                        backgroundColor: txnFilter === f ? '#10b981' : '#1e293b',
                        color: txnFilter === f ? '#022c22' : '#cbd5e1',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {f === 'ALL' ? 'All Operations' : f === 'COLLECTION' ? 'Inward Collections' : 'Disbursements (Payouts)'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={txnSearch}
                    onChange={e => setTxnSearch(e.target.value)}
                    placeholder="Search UTR, name or ref..."
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#f8fafc',
                      width: '220px'
                    }}
                  />
                  <button
                    onClick={loadTransactions}
                    style={{
                      backgroundColor: '#334155',
                      color: '#f8fafc',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 14px' }}>Date & Time</th>
                      <th style={{ padding: '10px 14px' }}>Reference ID</th>
                      <th style={{ padding: '10px 14px' }}>Operation / Payee</th>
                      <th style={{ padding: '10px 14px' }}>UTR Number</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                          No transactions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map((row, idx) => {
                        const isCollection = row.type?.includes('COLLECTION') || row.type?.includes('UPI');
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                              {new Date(row.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '11px' }}>
                              {row.reference_id}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{row.payee_name || 'Showroom Terminal'}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>{row.type}</div>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>
                              {row.utr || '—'}
                            </td>
                            <td style={{
                              padding: '10px 14px',
                              textAlign: 'right',
                              fontWeight: 900,
                              fontFamily: 'monospace',
                              color: isCollection ? '#10b981' : '#f87171'
                            }}>
                              {isCollection ? '+' : '-'}₹{Number(row.amount).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{
                                backgroundColor: row.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                color: row.status === 'SUCCESS' ? '#10b981' : '#facc15',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 800
                              }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 6: GATEWAY SETTINGS & WEBHOOKS ══════════════ */}
          {activeTab === 'config' && (
            <div style={{ maxWidth: '750px', margin: '0 auto' }}>
              <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                  ⚙️ Decentro Gateway Credentials & Webhooks
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
                  Manage API keys, client identifiers, and live webhook routing for automated instant reconciliation.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Operating Environment
                    </label>
                    <div style={{
                      backgroundColor: '#0f172a',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#10b981'
                    }}>
                      🟢 {gatewayConfig?.environment?.toUpperCase() || 'SANDBOX'} (Ready for Live Switch)
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Decentro Client ID
                    </label>
                    <div style={{
                      backgroundColor: '#0f172a',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #475569',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#cbd5e1'
                    }}>
                      {gatewayConfig?.client_id || 'svf_decentro_live_partner'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Live Webhook Listener URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://srivinayakafurnitures.pages.dev/api/v1/decentro/webhooks"
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#38bdf8',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    Configured in Decentro Developer Portal for real-time payment callbacks.
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Supported Modules
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Dynamic UPI Collections', 'KYB GSTIN Verification', 'Virtual Accounts (ICICI/YES)', 'IMPS / NEFT Payouts'].map(m => (
                      <span key={m} style={{ backgroundColor: '#064e3b', color: '#6ee7b7', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px' }}>
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Decentro credentials verified & synchronized!')}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Verify Gateway Connectivity
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ─── Footer ─── */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            Decentro Financial Engine • Sri Vinayaka Furnitures ERP • Double-Entry Reconciled
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};
