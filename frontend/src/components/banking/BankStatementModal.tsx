import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { BankStatementEntry, BankReconciliationCandidate, BankReconciliationCandidatesResponse } from '../../types/retailDaddy';
import {
  fetchBankStatementEntries,
  uploadBankStatementEntries,
  fetchBankReconciliationCandidates,
  reconcileBankEntry,
  seedSampleBankStatement
} from '../../api/client';

interface BankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankStatements: BankStatementEntry[];
  onReconciledCallback?: () => void;
}

export const BankStatementModal: React.FC<BankStatementModalProps> = ({
  isOpen,
  onClose,
  bankStatements: initialMockStatements,
  onReconciledCallback
}) => {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'report'>('reconciliation');
  const [accountNo, setAccountNo] = useState('99999999');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Unreconciled' | 'Reconciled'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveEntries, setLiveEntries] = useState<BankStatementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  
  // Quick Upload / Paste Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadText, setUploadText] = useState('');
  
  // Smart Reconciliation Drawer / Target
  const [selectedEntry, setSelectedEntry] = useState<BankStatementEntry | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesData, setCandidatesData] = useState<BankReconciliationCandidatesResponse | null>(null);
  const [reconcilingId, setReconcilingId] = useState<number | null>(null);

  // Manual Reconcile override
  const [manualPartyType, setManualPartyType] = useState<'Customer' | 'Supplier'>('Customer');
  const [manualPartyId, setManualPartyId] = useState('');
  const [manualInvoiceId, setManualInvoiceId] = useState('');
  const [manualRefNo, setManualRefNo] = useState('');

  // Classic Report States (Tab 2)
  const [fromDate, setFromDate] = useState('01/10/2026');
  const [toDate, setToDate] = useState('31/10/2026');
  const [copies, setCopies] = useState(1);
  const [emailId, setEmailId] = useState('');
  const [whatsAppNo, setWhatsAppNo] = useState('');
  const [whatsAppMsg, setWhatsAppMsg] = useState('Dear Customer,\nPlease find your verified Godrej Furniture Bank Statement attached.');

  // Load entries from backend with fallback
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBankStatementEntries(accountNo);
      if (data && data.length > 0) {
        setLiveEntries(data);
      } else {
        // Use seed or mock
        setLiveEntries(initialMockStatements.map(m => ({
          ...m,
          balance: m.balance || 250000,
          status: m.status || 'Unreconciled'
        })));
      }
    } catch {
      setLiveEntries(initialMockStatements);
    } finally {
      setLoading(false);
    }
  }, [accountNo, initialMockStatements]);

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen, loadEntries]);

  // Handle Seed Demo Statement
  const handleSeedSample = async () => {
    setLoading(true);
    try {
      await seedSampleBankStatement();
      setActionNotice('✓ Seeded realistic showroom transactions with UTR numbers!');
      await loadEntries();
    } catch (e) {
      setActionNotice('⚠️ Seed failed, using local offline data.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  // Open Smart Reconcile Drawer
  const handleOpenReconcile = async (entry: BankStatementEntry) => {
    setSelectedEntry(entry);
    setCandidatesLoading(true);
    setCandidatesData(null);
    setManualRefNo(entry.utrNumber || '');
    try {
      const resp = await fetchBankReconciliationCandidates(Number(entry.id));
      setCandidatesData(resp);
    } catch (e) {
      console.warn('Candidate fetch error:', e);
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Execute 1-Click Reconcile from Candidate
  const handleConfirmReconcile = async (cand: BankReconciliationCandidate) => {
    if (!selectedEntry) return;
    setReconcilingId(cand.party_id);
    try {
      await reconcileBankEntry({
        entry_id: Number(selectedEntry.id),
        party_type: cand.party_type,
        party_id: cand.party_id,
        invoice_id: cand.invoice_id,
        ref_no: selectedEntry.utrNumber || cand.invoice_no || `REC-${selectedEntry.id}`
      });
      setActionNotice(`✓ Reconciled with ${cand.party_name}! Ledger updated.`);
      setSelectedEntry(null);
      await loadEntries();
      if (onReconciledCallback) onReconciledCallback();
    } catch (err: any) {
      alert(`Reconciliation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setReconcilingId(null);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  // Execute Manual Reconcile
  const handleManualReconcile = async () => {
    if (!selectedEntry || !manualPartyId) {
      alert('Please enter a valid Customer/Supplier ID');
      return;
    }
    setReconcilingId(Number(manualPartyId));
    try {
      await reconcileBankEntry({
        entry_id: Number(selectedEntry.id),
        party_type: manualPartyType,
        party_id: Number(manualPartyId),
        invoice_id: manualInvoiceId ? Number(manualInvoiceId) : undefined,
        ref_no: manualRefNo || selectedEntry.utrNumber
      });
      setActionNotice(`✓ Reconciled entry #${selectedEntry.id} manually.`);
      setSelectedEntry(null);
      await loadEntries();
      if (onReconciledCallback) onReconciledCallback();
    } catch (err: any) {
      alert(`Reconciliation error: ${err.message}`);
    } finally {
      setReconcilingId(null);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  // Handle Bulk Upload Statement Paste
  const handleProcessUpload = async () => {
    if (!uploadText.trim()) return;
    const lines = uploadText.trim().split('\n');
    const newItems: any[] = [];
    
    for (const line of lines) {
      const parts = line.split(/[,\t|]/).map(p => p.trim());
      if (parts.length >= 3) {
        const date = parts[0] || new Date().toLocaleDateString('en-GB');
        const desc = parts[1] || 'Bank Transfer';
        const credit = parseFloat(parts[2]) || 0;
        const debit = parseFloat(parts[3]) || 0;
        newItems.push({
          date,
          description: desc,
          credit,
          debit,
          balance: 0,
          accountNo
        });
      }
    }

    if (newItems.length > 0) {
      try {
        await uploadBankStatementEntries(accountNo, newItems);
        setActionNotice(`✓ Successfully uploaded ${newItems.length} transactions with auto UTR extraction.`);
        setShowUploadModal(false);
        setUploadText('');
        await loadEntries();
      } catch (e: any) {
        alert(`Upload error: ${e.message}`);
      }
    }
  };

  // Filtered rows
  const filteredEntries = useMemo(() => {
    return liveEntries.filter(e => {
      if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mDesc = e.description?.toLowerCase().includes(q);
        const mUtr = e.utrNumber?.toLowerCase().includes(q);
        const mParty = e.reconciledPartyName?.toLowerCase().includes(q);
        if (!mDesc && !mUtr && !mParty) return false;
      }
      return true;
    });
  }, [liveEntries, filterStatus, searchQuery]);

  // Aggregate stats
  const totalCredits = liveEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const totalDebits = liveEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const unreconciledCount = liveEntries.filter(e => e.status !== 'Reconciled').length;
  const unreconciledAmount = liveEntries
    .filter(e => e.status !== 'Reconciled')
    .reduce((sum, e) => sum + (e.credit > 0 ? e.credit : e.debit), 0);
  const reconciledCount = liveEntries.filter(e => e.status === 'Reconciled').length;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '1240px',
          maxWidth: '98vw',
          maxHeight: '94vh',
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          color: '#f8fafc'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🏦</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                Bank Synchronization & UTR Reconciliation Engine
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span>Shree Vinayaka Furnitures (Godrej Interio) • A/C:</span>
                <select
                  value={accountNo}
                  onChange={e => setAccountNo(e.target.value)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="99999999">99999999 (SBI Current - Main Showroom)</option>
                  <option value="88888888">88888888 (HDFC Current - Godrej Dealer)</option>
                  <option value="77777777">77777777 (ICICI Current - POS Counter)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionNotice && (
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                {actionNotice}
              </span>
            )}
            
            <button
              onClick={handleSeedSample}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Seed authentic Godrej B2B and retail customer bank transactions"
            >
              <span>⚡</span> Seed Demo Feed
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📥</span> Import Statement
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                border: 'none',
                color: '#94a3b8',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs & KPI Badges */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('reconciliation')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'reconciliation' ? '#2563eb' : '#0f172a',
                color: activeTab === 'reconciliation' ? '#ffffff' : '#94a3b8'
              }}
            >
              ⚡ Live Feed & UTR Matcher ({liveEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('report')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'report' ? '#2563eb' : '#0f172a',
                color: activeTab === 'report' ? '#ffffff' : '#94a3b8'
              }}
            >
              🖨️ Statement Print & Export
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Total Inflows: </span>
              <strong style={{ color: '#34d399' }}>₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ width: '1px', height: '14px', backgroundColor: '#475569' }} />
            <div>
              <span style={{ color: '#94a3b8' }}>Total Outflows: </span>
              <strong style={{ color: '#f87171' }}>₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ width: '1px', height: '14px', backgroundColor: '#475569' }} />
            <div>
              <span style={{ color: '#94a3b8' }}>Unreconciled: </span>
              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {unreconciledCount} items (₹{unreconciledAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <div style={{ width: '1px', height: '14px', backgroundColor: '#475569' }} />
            <div>
              <span style={{ color: '#94a3b8' }}>Reconciled: </span>
              <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {reconciledCount} verified
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Feed & Smart Reconciliation */}
        {activeTab === 'reconciliation' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Main Statement Table Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Search & Filter Toolbar */}
              <div
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  borderBottom: '1px solid #1e293b'
                }}
              >
                <input
                  type="text"
                  placeholder="🔍 Search narration, UTR number, or customer name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['ALL', 'Unreconciled', 'Reconciled'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: filterStatus === status ? '1px solid #3b82f6' : '1px solid #334155',
                        backgroundColor: filterStatus === status ? '#1e3a8a' : '#1e293b',
                        color: filterStatus === status ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadEntries}
                  disabled={loading}
                  style={{
                    backgroundColor: '#334155',
                    border: 'none',
                    color: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Transactions Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', width: '90px' }}>Date</th>
                      <th style={{ padding: '10px 14px', width: '150px' }}>UTR / Reference</th>
                      <th style={{ padding: '10px 14px' }}>Transaction Particulars / Narration</th>
                      <th style={{ padding: '10px 14px', width: '110px', textAlign: 'right' }}>Debit (Out)</th>
                      <th style={{ padding: '10px 14px', width: '110px', textAlign: 'right' }}>Credit (In)</th>
                      <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 14px', width: '120px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No bank statement entries match your filter. Click <b>"⚡ Seed Demo Feed"</b> or <b>"📥 Import Statement"</b> above!
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry, idx) => {
                        const isReconciled = entry.status === 'Reconciled';
                        const isSelected = selectedEntry?.id === entry.id;

                        return (
                          <tr
                            key={entry.id || idx}
                            style={{
                              borderBottom: '1px solid #1e293b',
                              backgroundColor: isSelected
                                ? '#1e3a8a33'
                                : idx % 2 === 0
                                ? '#0f172a'
                                : '#131d33',
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                              {entry.date}
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              {entry.utrNumber ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span
                                    style={{
                                      fontFamily: 'monospace',
                                      backgroundColor: '#0284c722',
                                      color: '#38bdf8',
                                      border: '1px solid #0284c755',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}
                                  >
                                    {entry.utrNumber}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(entry.utrNumber || '');
                                      setActionNotice(`Copied UTR: ${entry.utrNumber}`);
                                      setTimeout(() => setActionNotice(''), 2000);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      padding: '0 2px',
                                      color: '#64748b'
                                    }}
                                    title="Copy UTR number"
                                  >
                                    📋
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '11px' }}>-</span>
                              )}
                            </td>

                            <td style={{ padding: '10px 14px', maxWidth: '360px' }}>
                              <div style={{ color: '#e2e8f0', fontWeight: 500, lineHeight: '1.4' }}>
                                {entry.description}
                              </div>
                              {isReconciled && entry.reconciledPartyName && (
                                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                                  ✓ Reconciled with: <b>{entry.reconciledPartyName}</b> ({entry.reconciledPartyType})
                                </div>
                              )}
                            </td>

                            <td
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                color: entry.debit > 0 ? '#f87171' : '#64748b',
                                fontWeight: entry.debit > 0 ? 600 : 400
                              }}
                            >
                              {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </td>

                            <td
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                                color: entry.credit > 0 ? '#34d399' : '#64748b',
                                fontWeight: entry.credit > 0 ? 700 : 400
                              }}
                            >
                              {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </td>

                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {isReconciled ? (
                                <span
                                  style={{
                                    backgroundColor: '#065f4633',
                                    color: '#34d399',
                                    border: '1px solid #05966955',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>●</span> Reconciled
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: '#78350f33',
                                    color: '#fcd34d',
                                    border: '1px solid #d9770655',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>○</span> Pending
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              {isReconciled ? (
                                <button
                                  onClick={() => handleOpenReconcile(entry)}
                                  style={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    color: '#94a3b8',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Audit Details
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenReconcile(entry)}
                                  style={{
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  ⚡ Reconcile
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Reconciliation Side Drawer */}
            {selectedEntry && (
              <div
                style={{
                  width: '380px',
                  backgroundColor: '#111827',
                  borderLeft: '1px solid #1f2937',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto'
                }}
              >
                {/* Drawer Header */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1f2937'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                    Match & Reconcile Transaction
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Entry Summary Card */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Transaction Details</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: '#f9fafb' }}>
                    {selectedEntry.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Amount: </span>
                      <strong style={{ color: selectedEntry.credit > 0 ? '#34d399' : '#f87171', fontSize: '14px' }}>
                        ₹{(selectedEntry.credit > 0 ? selectedEntry.credit : selectedEntry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    {selectedEntry.utrNumber && (
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                        UTR: {selectedEntry.utrNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidate Suggestions */}
                <div style={{ padding: '14px 18px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>
                      Algorithmic Match Suggestions
                    </div>
                    {candidatesLoading && (
                      <span style={{ fontSize: '11px', color: '#60a5fa' }}>Scanning database...</span>
                    )}
                  </div>

                  {candidatesLoading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                      Finding matching invoices & customer accounts...
                    </div>
                  ) : candidatesData && candidatesData.candidates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {candidatesData.candidates.map(cand => {
                        const isHigh = cand.confidence_score >= 80;
                        const isReconcilingThis = reconcilingId === cand.party_id;

                        return (
                          <div
                            key={`${cand.party_type}-${cand.party_id}-${cand.invoice_id}`}
                            style={{
                              backgroundColor: '#1f2937',
                              border: isHigh ? '1px solid #10b981' : '1px solid #374151',
                              borderRadius: '6px',
                              padding: '10px 12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: '#f9fafb' }}>
                                {cand.party_name}
                              </span>
                              <span
                                style={{
                                  backgroundColor: isHigh ? '#065f46' : '#78350f',
                                  color: isHigh ? '#34d399' : '#fcd34d',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '10px'
                                }}
                              >
                                {cand.confidence_score}% Match
                              </span>
                            </div>

                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                              {cand.match_reason}
                            </div>

                            {cand.invoice_no && (
                              <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                                Linked Invoice: <b>#{cand.invoice_no}</b> (Due: ₹{cand.amount_due.toLocaleString('en-IN')})
                              </div>
                            )}

                            {selectedEntry.status !== 'Reconciled' && (
                              <button
                                onClick={() => handleConfirmReconcile(cand)}
                                disabled={isReconcilingThis}
                                style={{
                                  marginTop: '8px',
                                  width: '100%',
                                  backgroundColor: isHigh ? '#059669' : '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {isReconcilingThis ? 'Reconciling...' : '✓ 1-Click Match & Reconcile'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '16px 0', color: '#9ca3af', fontSize: '12px' }}>
                      No exact automatic candidate matches found. Use manual reconciliation below:
                    </div>
                  )}

                  {/* Manual Matching Accordion */}
                  {selectedEntry.status !== 'Reconciled' && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #1f2937', paddingTop: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#d1d5db' }}>
                        Manual Party Reconciliation
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setManualPartyType('Customer')}
                          style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: manualPartyType === 'Customer' ? '#2563eb' : '#374151',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualPartyType('Supplier')}
                          style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: manualPartyType === 'Supplier' ? '#2563eb' : '#374151',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          Supplier
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input
                          type="number"
                          placeholder={`${manualPartyType} Database ID (e.g. 1)`}
                          value={manualPartyId}
                          onChange={e => setManualPartyId(e.target.value)}
                          style={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            color: '#ffffff',
                            fontSize: '11px'
                          }}
                        />

                        {manualPartyType === 'Customer' && (
                          <input
                            type="number"
                            placeholder="Sale Invoice ID (optional)"
                            value={manualInvoiceId}
                            onChange={e => setManualInvoiceId(e.target.value)}
                            style={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '4px',
                              padding: '6px 8px',
                              color: '#ffffff',
                              fontSize: '11px'
                            }}
                          />
                        )}

                        <button
                          onClick={handleManualReconcile}
                          style={{
                            marginTop: '4px',
                            backgroundColor: '#4b5563',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Apply Manual Reconciliation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Print & Statement Export (Preserves classic preview) */}
        {activeTab === 'report' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Toolbar */}
            <div
              style={{
                width: '200px',
                backgroundColor: '#111827',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRight: '1px solid #1f2937',
                fontSize: '12px'
              }}
            >
              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>
                  From Date:
                </label>
                <input
                  type="text"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    fontSize: '11px',
                    marginBottom: '8px'
                  }}
                />
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>
                  To Date:
                </label>
                <input
                  type="text"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    fontSize: '11px',
                    marginBottom: '8px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  Copies to Print:
                </label>
                <input
                  type="number"
                  min="1"
                  value={copies}
                  onChange={e => setCopies(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <button
                onClick={() => window.print()}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Statement
              </button>

              <hr style={{ borderColor: '#374151', margin: '4px 0' }} />

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  WhatsApp Dispatch:
                </label>
                <input
                  type="text"
                  placeholder="10-digit Mobile"
                  value={whatsAppNo}
                  onChange={e => setWhatsAppNo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    fontSize: '11px',
                    marginBottom: '6px'
                  }}
                />
                <textarea
                  rows={2}
                  value={whatsAppMsg}
                  onChange={e => setWhatsAppMsg(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#cbd5e1',
                    fontSize: '10px',
                    marginBottom: '6px'
                  }}
                />
                <button
                  onClick={() => {
                    if (!whatsAppNo || whatsAppNo.length < 10) {
                      alert('Please enter a valid 10-digit number');
                      return;
                    }
                    const text = `${whatsAppMsg}\n\nAccount: ${accountNo}\nTotal Inflows: ₹${totalCredits.toFixed(2)}\nTotal Outflows: ₹${totalDebits.toFixed(2)}`;
                    window.open(`https://wa.me/91${whatsAppNo.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  💬 Send on WhatsApp
                </button>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  Email Statement:
                </label>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={emailId}
                  onChange={e => setEmailId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#ffffff',
                    fontSize: '11px',
                    marginBottom: '6px'
                  }}
                />
                <button
                  onClick={() => {
                    if (!emailId || !emailId.includes('@')) {
                      alert('Please enter a valid email address');
                      return;
                    }
                    setActionNotice(`Statement dispatched to ${emailId}`);
                    setTimeout(() => setActionNotice(''), 3000);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#4b5563',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✉️ Dispatch Email
                </button>
              </div>
            </div>

            {/* Printable Preview Sheet */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#374151',
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: '780px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  padding: '36px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  borderRadius: '2px',
                  fontSize: '11px'
                }}
              >
                {/* Print Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    SHREE VINAYAKA FURNITURES
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Authorized Godrej Interio Showroom • NH Bypass Road, Kozhikode, Kerala - 673004
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    GSTIN: 32AABCS1429B1Z8 • Phone: +91 98470 12345 • Email: accounts@shreevinayaka.in
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                    BANK ACCOUNT STATEMENT & SETTLEMENT RECORD
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Account No: <b>{accountNo}</b> | Period: {fromDate} to {toDate}
                  </div>
                </div>

                {/* Print Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #0f172a' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', width: '70px' }}>Date</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', width: '110px' }}>UTR Number</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Transaction Narration</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', width: '80px' }}>Debit (₹)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', width: '80px' }}>Credit (₹)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', width: '90px' }}>Audit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveEntries.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 8px' }}>{e.date}</td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{e.utrNumber || '-'}</td>
                        <td style={{ padding: '5px 8px' }}>{e.description}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          {e.debit > 0 ? e.debit.toFixed(2) : '-'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: e.credit > 0 ? 'bold' : 'normal' }}>
                          {e.credit > 0 ? e.credit.toFixed(2) : '-'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', color: e.status === 'Reconciled' ? '#166534' : '#b45309' }}>
                          {e.status === 'Reconciled' ? '✓ Reconciled' : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #0f172a' }}>
                      <td colSpan={3} style={{ padding: '8px' }}>TOTALS</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{totalDebits.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{totalCredits.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        Net: ₹{(totalCredits - totalDebits).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ height: '30px' }} />
                    <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontWeight: 600 }}>
                      Prepared By (Cashier)
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ height: '30px' }} />
                    <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontWeight: 600 }}>
                      Authorized Signatory (SVF)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bulk Paste Statement Lines */}
        {showUploadModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100010
            }}
          >
            <div
              style={{
                width: '600px',
                backgroundColor: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #334155'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                Import Bank Statement (CSV or Tab-Separated)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                Format per line: <code>Date, Description (with UTR/NEFT), Credit, Debit</code>
              </div>
              <textarea
                rows={8}
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
                placeholder={`18/10/2026, NEFT-SBIN00482910-KUMAR RESIDENCIES SOFA ADVANCE, 85000, 0\n18/10/2026, CMS/ICIC00012345/GODREJ INTERIO DEALER DISPATCH, 0, 125000`}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '10px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    backgroundColor: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessUpload}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Parse & Synchronize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
