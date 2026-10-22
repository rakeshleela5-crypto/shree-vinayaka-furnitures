import React, { useState, useEffect, useRef } from 'react';
import type { BankRecord, BranchRecord, BankAccountRecord } from '../../types/retailDaddy';
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

export type BankingHubTab = 'accounts' | 'banks' | 'branches' | 'qr' | 'payout' | 'kyb' | 'va' | 'ledger' | 'config';

export interface ShowroomBankingHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: BankingHubTab | 'master';
  // Traditional Banking Master Props
  banks?: BankRecord[];
  branches?: BranchRecord[];
  accounts?: BankAccountRecord[];
  onSaveBank?: (bank: BankRecord) => void;
  onDeleteBank?: (id: string) => void;
  onSaveBranch?: (branch: BranchRecord) => void;
  onDeleteBranch?: (id: string) => void;
  onSaveAccount?: (account: BankAccountRecord) => void;
  onDeleteAccount?: (id: string) => void;
}

export const ShowroomBankingHubModal: React.FC<ShowroomBankingHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'accounts',
  banks = [],
  branches = [],
  accounts = [],
  onSaveBank,
  onDeleteBank,
  onSaveBranch,
  onDeleteBranch,
  onSaveAccount,
  onDeleteAccount
}) => {
  const normalizedInitialTab = initialTab === 'master' ? 'accounts' : initialTab;
  const [activeTab, setActiveTab] = useState<BankingHubTab>(normalizedInitialTab);
  const [isMaximized, setIsMaximized] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 1. BANKING MASTER SUB-STATES (Banks, Branches, Accounts)
  // ═════════════════════════════════════════════════════════════════════════
  const [bankSubTab, setBankSubTab] = useState<'ACCOUNTS' | 'BANKS' | 'BRANCHES'>('ACCOUNTS');

  // Banks
  const [bankName, setBankName] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');

  // Branches
  const [branchBank, setBranchBank] = useState(banks[0]?.name || 'SBI');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchContact, setBranchContact] = useState('');
  const [branchIfsc, setBranchIfsc] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Accounts
  const [accNo, setAccNo] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'Current Account' | 'Savings Account'>('Current Account');
  const [accBalance, setAccBalance] = useState('0.00');
  const [selectedBranchForAcc, setSelectedBranchForAcc] = useState<BranchRecord | null>(branches[0] || null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // ═════════════════════════════════════════════════════════════════════════
  // 2. DECENTRO FINTECH ENGINE STATES
  // ═════════════════════════════════════════════════════════════════════════
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);

  // Tab 2: Dynamic UPI QR Collection
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

  // Tab 4: GSTIN KYB Verification
  const [gstinInput, setGstinInput] = useState<string>('21AAACS1234F1Z5');
  const [kybLoading, setKybLoading] = useState<boolean>(false);
  const [kybResult, setKybResult] = useState<DecentroGstResult | null>(null);
  const [kybError, setKybError] = useState<string>('');

  // Tab 5: Virtual Accounts
  const [vaCustomerName, setVaCustomerName] = useState<string>('Utkal Corporate Furnishings');
  const [vaPan, setVaPan] = useState<string>('AAACU1234P');
  const [vaMobile, setVaMobile] = useState<string>('9876543210');
  const [vaEmail, setVaEmail] = useState<string>('accounts@utkalcorporate.in');
  const [vaLoading, setVaLoading] = useState<boolean>(false);
  const [createdVa, setCreatedVa] = useState<DecentroVirtualAccountResponse | null>(null);

  // Tab 6: Live Transactions & Webhooks
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txnSearch, setTxnSearch] = useState<string>('');
  const [txnFilter, setTxnFilter] = useState<'ALL' | 'COLLECTION' | 'PAYOUT'>('ALL');

  // Sync initialTab & load config on open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab === 'master' ? 'accounts' : initialTab);
      }
      loadGatewayConfig();
      loadTransactions();
    }
  }, [isOpen, initialTab]);

  // Clean timers & keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(pollTimerRef.current);
      clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, onClose]);

  const loadGatewayConfig = async () => {
    try {
      const cfg = await fetchDecentroConfig();
      setGatewayConfig(cfg);
    } catch {
      // client.ts fallback
    }
  };

  const loadTransactions = async () => {
    try {
      const list = await fetchDecentroTransactions(50);
      setTransactions(list);
    } catch {
      // client.ts fallback
    }
  };

  // ─── MASTER HANDLERS: Banks ───
  const handleSaveBank = () => {
    if (!bankName.trim()) {
      showToast('⚠️ Please enter Bank Name');
      return;
    }
    const newBank: BankRecord = {
      id: selectedBankId || 'bank-' + Date.now(),
      name: bankName.trim(),
      code: 'B-' + Math.floor(100 + Math.random() * 900)
    };
    onSaveBank && onSaveBank(newBank);
    setBankName('');
    setSelectedBankId('');
    showToast(`✅ Bank "${newBank.name}" saved successfully!`);
  };

  // ─── MASTER HANDLERS: Branches ───
  const handleSaveBranch = () => {
    if (!branchName.trim()) {
      showToast('⚠️ Please enter Branch Name');
      return;
    }
    const newBranch: BranchRecord = {
      id: selectedBranchId || 'br-' + Date.now(),
      bankName: branchBank,
      branchName: branchName.trim(),
      address: branchAddress.trim() || 'Main Showroom Road, Kerala',
      contactNo: branchContact.trim() || '+91 94484 22354',
      ifsc: branchIfsc.trim() || 'SBIN0070115',
      branchCode: branchCode.trim() || '0115'
    };
    onSaveBranch && onSaveBranch(newBranch);
    setBranchName('');
    setBranchAddress('');
    setBranchContact('');
    setBranchIfsc('');
    setBranchCode('');
    setSelectedBranchId('');
    showToast(`✅ Branch "${newBranch.branchName}" saved successfully!`);
  };

  // ─── MASTER HANDLERS: Accounts ───
  const handleSaveAccount = () => {
    if (!accNo.trim() || !accName.trim()) {
      showToast('⚠️ Please enter Account Number and Account Name');
      return;
    }
    const newAcc: BankAccountRecord = {
      id: selectedAccountId || 'acc-' + Date.now(),
      accountNo: accNo.trim(),
      accountName: accName.trim(),
      accountType: accType,
      bankName: selectedBranchForAcc?.bankName || branchBank || 'SBI',
      branchName: selectedBranchForAcc?.branchName || 'Main Branch',
      balance: parseFloat(accBalance) || 0
    };
    onSaveAccount && onSaveAccount(newAcc);
    setSelectedAccountId('');
    setAccNo('');
    setAccName('');
    setAccBalance('0.00');
    showToast(`✅ Account "${newAcc.accountNo}" saved successfully!`);
  };

  // ─── DECENTRO: Generate UPI QR ───
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
              showToast(`✓ UPI Payment of ₹${qrAmount.toLocaleString('en-IN')} confirmed! UTR: ${status.utr_number || 'OK'}`);
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

  // ─── DECENTRO: GSTIN KYB Verification ───
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
      showToast(`✓ GSTIN Verified: ${res.trade_name || res.legal_name}`);
    } catch (e: any) {
      setKybError(e?.message || 'GSTIN verification failed');
    } finally {
      setKybLoading(false);
    }
  };

  // ─── DECENTRO: Instant Payout ───
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
        showToast(`✓ Instant payout of ₹${payoutAmount.toLocaleString('en-IN')} dispatched! UTR: ${resp.bank_reference_number || 'OK'}`);
      }
    } catch (err: any) {
      alert(`Payout failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPayoutLoading(false);
    }
  };

  // ─── DECENTRO: Virtual Account ───
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
      showToast(`✓ Virtual Escrow Account Created: ${resp.virtual_account_number}`);
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: isMaximized ? '99vw' : '1160px',
          height: isMaximized ? '98vh' : 'auto',
          maxWidth: '98vw',
          maxHeight: '94vh',
          backgroundColor: '#0f172a',
          border: '2px solid #10b981',
          borderRadius: isMaximized ? '4px' : '16px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* ─── Top Header Bar ─── */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(90deg, #064e3b 0%, #0f172a 50%, #1e3a8a 100%)',
          borderBottom: '1px solid #10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: '#022c22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 900,
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
            }}>
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ecfdf5', letterSpacing: '-0.02em' }}>
                  Showroom Unified Banking & Financial Hub
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: '#10b981',
                  color: '#022c22',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}>
                  {gatewayConfig?.environment === 'production' ? 'LIVE GATEWAY' : 'SANDBOX SIMULATOR'}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: '#065f46',
                  color: '#a7f3d0',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  Decentro v2.0 • Double-Entry
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6ee7b7' }}>
                Store Bank Accounts • Dynamic UPI QR Collections • Instant Payouts • Live GSTIN KYB • Virtual Escrows
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', display: 'none', minWidth: '130px' }} className="sm:block">
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Showroom ICICI VPA</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                shreevinayaka@icici
              </div>
            </div>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#f8fafc',
                fontSize: '14px',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? '❐' : '□'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#f8fafc',
                fontSize: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── Notification Toast Banner ─── */}
        {toastMsg && (
          <div style={{
            backgroundColor: '#064e3b',
            color: '#a7f3d0',
            borderBottom: '1px solid #10b981',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {toastMsg}
          </div>
        )}

        {/* ─── Main Navigation Tab Strip ─── */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          overflowX: 'auto',
          padding: '0 8px'
        }}>
          {[
            { id: 'accounts', label: '🏛️ Store Accounts & Branches', desc: 'Bookkeeping Master & IFSC' },
            { id: 'qr', label: '📱 Dynamic UPI QR', desc: 'Instant Inward Collection' },
            { id: 'payout', label: '💸 Supplier Payouts', desc: 'Instant IMPS / NEFT' },
            { id: 'kyb', label: '🏢 GSTIN KYB Verifier', desc: 'Taxpayer Intelligence' },
            { id: 'va', label: '🏛️ Virtual Escrow Accounts', desc: 'Customer Dedicated Escrow' },
            { id: 'ledger', label: '📜 Live Ledger & Stream', desc: 'UTR & Reconciliation' },
            { id: 'config', label: '⚙️ Gateway Settings', desc: 'API Keys & Webhooks' }
          ].map(tab => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: isSel ? '#0f172a' : 'transparent',
                  color: isSel ? '#10b981' : '#94a3b8',
                  border: 'none',
                  borderBottom: isSel ? '3px solid #10b981' : '3px solid transparent',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.15s',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800 }}>{tab.label}</span>
                <span style={{ fontSize: '9px', color: isSel ? '#6ee7b7' : '#64748b' }}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Main Tab Body ─── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#0f172a'
        }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: STORE ACCOUNTS & BRANCHES MASTER (Merged from BankingMasterModal)
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sub-tab strip for Accounts / Banks / Branches */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                {[
                  { id: 'ACCOUNTS', label: '💳 Bank Accounts Registration', count: accounts.length },
                  { id: 'BANKS', label: '🏦 Banks List', count: banks.length },
                  { id: 'BRANCHES', label: '🏢 Branches & IFSC Directory', count: branches.length }
                ].map(sub => {
                  const isSel = bankSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setBankSubTab(sub.id as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: isSel ? '1px solid #10b981' : '1px solid #334155',
                        backgroundColor: isSel ? '#064e3b' : '#1e293b',
                        color: isSel ? '#ecfdf5' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{sub.label}</span>
                      <span style={{
                        backgroundColor: isSel ? '#10b981' : '#334155',
                        color: isSel ? '#022c22' : '#cbd5e1',
                        borderRadius: '999px',
                        fontSize: '10px',
                        padding: '1px 6px',
                        fontWeight: 900
                      }}>
                        {sub.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Tab 1: ACCOUNTS */}
              {bankSubTab === 'ACCOUNTS' && (
                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
                  {/* Account Input Form */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                      💳 Register Store Bank Account
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={accNo}
                        onChange={e => setAccNo(e.target.value)}
                        placeholder="e.g. 50200012345678"
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                        Account Name / Holder *
                      </label>
                      <input
                        type="text"
                        value={accName}
                        onChange={e => setAccName(e.target.value)}
                        placeholder="e.g. Shree Vinayaka Furnitures SBI Current"
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontWeight: 600
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                          Account Type
                        </label>
                        <select
                          value={accType}
                          onChange={e => setAccType(e.target.value as any)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: '#f8fafc'
                          }}
                        >
                          <option value="Current Account">Current Account</option>
                          <option value="Savings Account">Savings Account</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                          Opening Balance (₹)
                        </label>
                        <input
                          type="number"
                          value={accBalance}
                          onChange={e => setAccBalance(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: '#10b981',
                            fontFamily: 'monospace',
                            fontWeight: 700
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                        Select Associated Branch
                      </label>
                      <select
                        value={selectedBranchForAcc?.id || ''}
                        onChange={e => {
                          const br = branches.find(x => x.id === e.target.value) || null;
                          setSelectedBranchForAcc(br);
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f8fafc'
                        }}
                      >
                        {branches.map(br => (
                          <option key={br.id} value={br.id}>
                            {br.bankName} - {br.branchName} ({br.ifsc})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccountId('');
                          setAccNo('');
                          setAccName('');
                          setAccBalance('0.00');
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#334155',
                          color: '#f8fafc',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Form
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAccount}
                        style={{
                          flex: 1.5,
                          backgroundColor: '#10b981',
                          color: '#022c22',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          fontWeight: 900,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedAccountId ? '✓ Update Account' : '+ Save Account'}
                      </button>
                    </div>
                  </div>

                  {/* Registered Accounts Table */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '10px 16px',
                      backgroundColor: '#0f172a',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                        Registered Showroom Bank Accounts ({accounts.length})
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                        Total Balance: ₹{accounts.reduce((sum, a) => sum + (a.balance || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '8px 12px' }}>Account No.</th>
                            <th style={{ padding: '8px 12px' }}>Holder Name</th>
                            <th style={{ padding: '8px 12px' }}>Bank & Branch</th>
                            <th style={{ padding: '8px 12px' }}>Type</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Current Balance</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                No bank accounts registered yet. Use the form on the left to add your first account.
                              </td>
                            </tr>
                          ) : (
                            accounts.map((acc, idx) => (
                              <tr
                                key={acc.id}
                                onClick={() => {
                                  setSelectedAccountId(acc.id);
                                  setAccNo(acc.accountNo);
                                  setAccName(acc.accountName);
                                  setAccType(acc.accountType);
                                  setAccBalance(String(acc.balance));
                                }}
                                style={{
                                  borderBottom: '1px solid #334155',
                                  backgroundColor: selectedAccountId === acc.id ? '#064e3b' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                                  {acc.accountNo}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>
                                  {acc.accountName}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                                  {acc.bankName} - {acc.branchName}
                                </td>
                                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                                  {acc.accountType}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
                                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (confirm(`Delete account ${acc.accountNo}?`)) {
                                        onDeleteAccount && onDeleteAccount(acc.id);
                                      }
                                    }}
                                    style={{
                                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                      color: '#f87171',
                                      border: '1px solid #ef4444',
                                      borderRadius: '4px',
                                      padding: '2px 8px',
                                      fontSize: '10px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: BANKS */}
              {bankSubTab === 'BANKS' && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                  <div style={{
                    backgroundColor: '#1e293b',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                      🏦 Add Bank Record
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India (SBI)"
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontWeight: 700
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBankId('');
                          setBankName('');
                        }}
                        style={{ flex: 1, backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBank}
                        style={{ flex: 1.5, backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}
                      >
                        {selectedBankId ? '✓ Update Bank' : '+ Save Bank'}
                      </button>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                      Registered Banks Directory ({banks.length})
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                          <tr>
                            <th style={{ padding: '8px 12px', width: '50px' }}>#</th>
                            <th style={{ padding: '8px 12px' }}>Bank Name</th>
                            <th style={{ padding: '8px 12px', width: '100px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {banks.map((b, idx) => (
                            <tr
                              key={b.id}
                              onClick={() => {
                                setSelectedBankId(b.id);
                                setBankName(b.name);
                              }}
                              style={{
                                borderBottom: '1px solid #334155',
                                backgroundColor: selectedBankId === b.id ? '#064e3b' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#f8fafc' }}>{b.name}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onDeleteBank && onDeleteBank(b.id);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#f87171',
                                    border: '1px solid #ef4444',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: BRANCHES */}
              {bankSubTab === 'BRANCHES' && (
                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
                  <div style={{
                    backgroundColor: '#1e293b',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                      🏢 Add Branch & IFSC Record
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>Bank</label>
                      <select
                        value={branchBank}
                        onChange={e => setBranchBank(e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '5px 8px', color: '#f8fafc' }}
                      >
                        {banks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>Branch Name *</label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={e => setBranchName(e.target.value)}
                        placeholder="e.g. Commercial Hub Branch"
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '5px 8px', color: '#f8fafc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>IFSC Code *</label>
                      <input
                        type="text"
                        value={branchIfsc}
                        onChange={e => setBranchIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '5px 8px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>Branch Address</label>
                      <input
                        type="text"
                        value={branchAddress}
                        onChange={e => setBranchAddress(e.target.value)}
                        placeholder="Plot 42, Main Road"
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '5px 8px', color: '#f8fafc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>Contact Number</label>
                      <input
                        type="text"
                        value={branchContact}
                        onChange={e => setBranchContact(e.target.value)}
                        placeholder="+91 94370 00000"
                        style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '5px 8px', color: '#f8fafc' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBranchId('');
                          setBranchName('');
                          setBranchIfsc('');
                          setBranchAddress('');
                          setBranchContact('');
                        }}
                        style={{ flex: 1, backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBranch}
                        style={{ flex: 1.5, backgroundColor: '#10b981', color: '#022c22', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}
                      >
                        {selectedBranchId ? '✓ Update Branch' : '+ Save Branch'}
                      </button>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                      Branches & IFSC Directory ({branches.length})
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                          <tr>
                            <th style={{ padding: '8px 12px' }}>Bank</th>
                            <th style={{ padding: '8px 12px' }}>Branch Name</th>
                            <th style={{ padding: '8px 12px' }}>IFSC</th>
                            <th style={{ padding: '8px 12px' }}>Address</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branches.map(br => (
                            <tr
                              key={br.id}
                              onClick={() => {
                                setSelectedBranchId(br.id);
                                setBranchBank(br.bankName);
                                setBranchName(br.branchName);
                                setBranchIfsc(br.ifsc);
                                setBranchAddress(br.address);
                                setBranchContact(br.contactNo);
                              }}
                              style={{
                                borderBottom: '1px solid #334155',
                                backgroundColor: selectedBranchId === br.id ? '#064e3b' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{br.bankName}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#f8fafc' }}>{br.branchName}</td>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>{br.ifsc}</td>
                              <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{br.address}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onDeleteBranch && onDeleteBranch(br.id);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#f87171',
                                    border: '1px solid #ef4444',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: DYNAMIC UPI QR COLLECTION
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'qr' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
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
                      color: '#10b981',
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[5000, 10000, 15000, 25000, 50000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQrAmount(amt)}
                        style={{
                          backgroundColor: '#334155',
                          border: 'none',
                          color: '#e2e8f0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        +₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Invoice Number
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
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
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
                        padding: '8px 12px',
                        color: '#f8fafc'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Payment Purpose Note
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
                      padding: '8px 12px',
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
                    backgroundColor: generatingQr ? '#065f46' : '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: generatingQr ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {generatingQr ? '⏳ Generating Invoice-Locked QR...' : '⚡ Generate Dynamic UPI QR'}
                </button>
              </div>

              {/* Right Column: QR Preview & Auto-Poll */}
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
                {activeQr ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                      🔐 Decentro Verified Real-Time Collection
                    </div>
                    {activeQr.qr_base64 ? (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        display: 'inline-block',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}>
                        <img
                          src={`data:image/png;base64,${activeQr.qr_base64}`}
                          alt="Decentro Dynamic UPI QR"
                          style={{ width: '220px', height: '220px', display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '30px', color: '#94a3b8' }}>QR Image rendering...</div>
                    )}

                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
                        ₹{qrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Ref: <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>{activeQr.reference_id}</span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '14px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: qrPollStatus?.status === 'SUCCESS' ? '#064e3b' : '#0f172a',
                      border: `1px solid ${qrPollStatus?.status === 'SUCCESS' ? '#10b981' : '#334155'}`
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: qrPollStatus?.status === 'SUCCESS' ? '#a7f3d0' : '#f59e0b' }}>
                        {qrPollStatus?.status === 'SUCCESS'
                          ? `✓ PAYMENT SETTLED! Bank UTR: ${qrPollStatus.utr_number || 'OK'}`
                          : `⏳ Awaiting Customer UPI Scan (Expires in ${Math.floor(pollTimeRemaining / 60)}:${String(pollTimeRemaining % 60).padStart(2, '0')})`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', padding: '40px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1' }}>No Dynamic QR Generated</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Enter amount and customer details on the left, then click Generate to create an invoice-locked UPI QR.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: SUPPLIER & CARPENTER PAYOUTS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'payout' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <form onSubmit={handleInitiatePayout} style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '16px' }}>
                  💸 Instant Bank Disbursement (IMPS / NEFT)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Payee Category</label>
                    <select
                      value={payoutType}
                      onChange={e => setPayoutType(e.target.value as any)}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc' }}
                    >
                      <option value="SUPPLIER">Godrej Factory / Supplier</option>
                      <option value="CARPENTER">Carpenter / Workshop Labor</option>
                      <option value="TRANSPORTER">Logistics / Transporter</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Transfer Mode</label>
                    <select
                      value={payoutMode}
                      onChange={e => setPayoutMode(e.target.value as any)}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc' }}
                    >
                      <option value="IMPS">IMPS (Instant 24x7)</option>
                      <option value="NEFT">NEFT (Direct Bank)</option>
                      <option value="RTGS">RTGS (&gt; ₹2 Lakhs)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Beneficiary Name</label>
                  <input
                    type="text"
                    value={payoutName}
                    onChange={e => setPayoutName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Bank Account Number</label>
                    <input
                      type="text"
                      value={payoutAccNo}
                      onChange={e => setPayoutAccNo(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>IFSC Code</label>
                    <input
                      type="text"
                      value={payoutIfsc}
                      onChange={e => setPayoutIfsc(e.target.value.toUpperCase())}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Disbursement Amount (₹)</label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '2px solid #10b981', borderRadius: '6px', padding: '8px', color: '#10b981', fontWeight: 900, fontSize: '16px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Purchase Bill Ref</label>
                    <input
                      type="text"
                      value={payoutBillRef}
                      onChange={e => setPayoutBillRef(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={payoutLoading || payoutAmount <= 0}
                  style={{
                    width: '100%',
                    backgroundColor: payoutLoading ? '#065f46' : '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 900,
                    cursor: payoutLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {payoutLoading ? '⏳ Disbursing Funds via Bank API...' : `⚡ Execute Payout (₹${payoutAmount.toLocaleString('en-IN')})`}
                </button>
              </form>

              {/* Right Column: Payout Confirmation Receipt */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
                  🧾 Last Payout Advice
                </div>
                {lastPayout ? (
                  <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #10b981' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
                      ✓ Payout Dispatched Successfully
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.8' }}>
                      <div>UTR: <strong style={{ fontFamily: 'monospace', color: '#f8fafc' }}>{lastPayout.bank_reference_number}</strong></div>
                      <div>Beneficiary: <strong>{lastPayout.payee_name}</strong></div>
                      <div>Amount: <strong style={{ color: '#10b981' }}>₹{Number(lastPayout.amount).toLocaleString('en-IN')}</strong></div>
                      <div>Reference: <span style={{ fontFamily: 'monospace' }}>{lastPayout.reference_id}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>💸</div>
                    <div>No payout executed in this session.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: GSTIN KYB VERIFIER
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'kyb' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                  🏢 Verify GSTIN via Decentro KYB API
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Fetches verified trade name, active registration status, and tax jurisdiction directly from the Indian Government GST Registry.
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Enter 15-Digit GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstinInput}
                    onChange={e => setGstinInput(e.target.value.toUpperCase())}
                    placeholder="21AAACS1234F1Z5"
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '2px solid #38bdf8',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {['21AAACS1234F1Z5', '21AABCS1429B1Z8', '29AABCS1429B1Z8'].map(demoGst => (
                      <button
                        key={demoGst}
                        type="button"
                        onClick={() => {
                          setGstinInput(demoGst);
                          handleVerifyGstin(demoGst);
                        }}
                        style={{
                          backgroundColor: '#334155',
                          border: 'none',
                          color: '#e2e8f0',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontFamily: 'monospace'
                        }}
                      >
                        {demoGst}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyGstin()}
                  disabled={kybLoading}
                  style={{
                    width: '100%',
                    backgroundColor: kybLoading ? '#0369a1' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: kybLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {kybLoading ? '🔍 Querying Decentro Public Registry...' : '🔍 Verify Taxpayer Credentials'}
                </button>

                {kybError && (
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '11px' }}>
                    ⚠️ {kybError}
                  </div>
                )}
              </div>

              {/* KYB Result Display */}
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
                  📋 Taxpayer Intelligence Dossier
                </div>
                {kybResult ? (
                  <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #38bdf8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>{kybResult.trade_name || kybResult.legal_name}</div>
                      <span style={{ backgroundColor: '#065f46', color: '#a7f3d0', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                        {kybResult.registration_status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                      <div>Legal Name: <strong>{kybResult.legal_name}</strong></div>
                      <div>GSTIN: <strong style={{ fontFamily: 'monospace' }}>{kybResult.gstin}</strong></div>
                      <div>Tax Regime: <strong style={{ color: '#10b981' }}>{kybResult.tax_regime}</strong></div>
                      <div>State Code: <strong>{kybResult.state_code}</strong></div>
                      <div>CGST / SGST: <strong>{kybResult.cgst_rate}% + {kybResult.sgst_rate}%</strong></div>
                      <div>IGST: <strong>{kybResult.igst_rate}%</strong></div>
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                      Principal Address: {kybResult.principal_address}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏢</div>
                    <div>Enter a GSTIN on the left to inspect taxpayer records.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: SMART VIRTUAL ESCROW ACCOUNTS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'va' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <form onSubmit={handleCreateVirtualAccount} style={{
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                  🏛️ Create Customer Dedicated Virtual Account
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Assigns an exclusive ICICI / YES Bank virtual account with dedicated IFSC for instant NEFT/RTGS wholesale receipts.
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Corporate / Customer Name</label>
                  <input
                    type="text"
                    value={vaCustomerName}
                    onChange={e => setVaCustomerName(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>PAN Number</label>
                    <input
                      type="text"
                      value={vaPan}
                      onChange={e => setVaPan(e.target.value.toUpperCase())}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Mobile Number</label>
                    <input
                      type="text"
                      value={vaMobile}
                      onChange={e => setVaMobile(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Notification Email</label>
                  <input
                    type="email"
                    value={vaEmail}
                    onChange={e => setVaEmail(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '6px', padding: '8px', color: '#f8fafc' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={vaLoading}
                  style={{
                    width: '100%',
                    backgroundColor: vaLoading ? '#065f46' : '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 900,
                    cursor: vaLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {vaLoading ? '⏳ Provisioning Virtual Account...' : '+ Provision Virtual Escrow Account'}
                </button>
              </form>

              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
                  🏛️ Provisioned Virtual Account
                </div>
                {createdVa ? (
                  <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #10b981' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
                      ✓ Virtual Account Assigned
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.8' }}>
                      <div>Bank: <strong>{createdVa.bank_name}</strong></div>
                      <div>Account No: <strong style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{createdVa.virtual_account_number}</strong></div>
                      <div>IFSC: <strong style={{ fontFamily: 'monospace' }}>{createdVa.ifsc}</strong></div>
                      <div>UPI ID: <strong style={{ color: '#10b981' }}>{createdVa.upi_id}</strong></div>
                      <div>Methods: <span style={{ color: '#94a3b8' }}>{createdVa.allowed_methods.join(', ')}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏛️</div>
                    <div>Provision an account on the left to generate exclusive virtual details.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 6: LIVE AUDIT LEDGER & WEBHOOK STREAM
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ledger' && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{
                padding: '14px 20px',
                backgroundColor: '#0f172a',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={txnSearch}
                    onChange={e => setTxnSearch(e.target.value)}
                    placeholder="Search by UTR, payee, ref..."
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      width: '240px'
                    }}
                  />
                  <select
                    value={txnFilter}
                    onChange={e => setTxnFilter(e.target.value as any)}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <option value="ALL">All Types</option>
                    <option value="COLLECTION">UPI Collections</option>
                    <option value="PAYOUT">Payouts</option>
                  </select>
                </div>
                <button
                  type="button"
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
                  🔄 Refresh Stream
                </button>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 14px' }}>Timestamp</th>
                      <th style={{ padding: '10px 14px' }}>Reference ID</th>
                      <th style={{ padding: '10px 14px' }}>Type</th>
                      <th style={{ padding: '10px 14px' }}>Party / Payee</th>
                      <th style={{ padding: '10px 14px' }}>Bank UTR</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                          No transactions found in Decentro ledger.
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '11px' }}>
                            {t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Just now'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>{t.reference_id}</td>
                          <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{t.type}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>{t.payee_name || '-'}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#a7f3d0' }}>{t.utr || '-'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: t.type?.includes('COLLECTION') ? '#10b981' : '#f87171' }}>
                            {t.type?.includes('COLLECTION') ? '+' : '-'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              backgroundColor: t.status === 'SUCCESS' ? '#065f46' : '#854d0e',
                              color: t.status === 'SUCCESS' ? '#a7f3d0' : '#fef08a',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}>
                              {t.status || 'SUCCESS'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 7: GATEWAY & WEBHOOK SETTINGS
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'config' && (
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '780px', margin: '0 auto' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
                ⚙️ Decentro Gateway & Webhook Diagnostics
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Decentro Client ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                    {gatewayConfig?.client_id || 'svf_decentro_live_partner'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Environment Mode</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                    {gatewayConfig?.environment?.toUpperCase() || 'SANDBOX'}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Decentro Webhook Callback URL</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '4px' }}>
                  https://srivinayakafurnitures.pages.dev/api/v1/decentro/webhooks
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  Supported Fintech Capabilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Dynamic UPI Collections', 'KYB GSTIN Verification', 'Virtual Accounts (ICICI/YES)', 'IMPS / NEFT Payouts'].map(m => (
                    <span key={m} style={{ backgroundColor: '#064e3b', color: '#a7f3d0', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ─── Bottom Footer Bar ─── */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            Showroom Unified Banking Hub • Sri Vinayaka Furnitures ERP • Double-Entry Ledger Reconciled
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
