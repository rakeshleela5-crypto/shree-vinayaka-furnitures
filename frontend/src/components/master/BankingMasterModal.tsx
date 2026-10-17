import React, { useState } from 'react';
import type { BankRecord, BranchRecord, BankAccountRecord } from '../../types/retailDaddy';

interface BankingMasterModalProps {
  isOpen: boolean;
  banks: BankRecord[];
  branches: BranchRecord[];
  accounts: BankAccountRecord[];
  onSaveBank: (bank: BankRecord) => void;
  onDeleteBank: (id: string) => void;
  onSaveBranch: (branch: BranchRecord) => void;
  onDeleteBranch: (id: string) => void;
  onSaveAccount: (account: BankAccountRecord) => void;
  onDeleteAccount: (id: string) => void;
  onClose: () => void;
}

export const BankingMasterModal: React.FC<BankingMasterModalProps> = ({
  isOpen,
  banks,
  branches,
  accounts,
  onSaveBank,
  onDeleteBank,
  onSaveBranch,
  onDeleteBranch,
  onSaveAccount,
  onDeleteAccount,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'BANKS' | 'BRANCHES' | 'ACCOUNTS'>('BANKS');
  const [isMaximized, setIsMaximized] = useState(false);

  // Sub-state for Bank
  const [bankName, setBankName] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');

  // Sub-state for Branch
  const [branchBank, setBranchBank] = useState(banks[0]?.name || 'SBI');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchContact, setBranchContact] = useState('');
  const [branchIfsc, setBranchIfsc] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Sub-state for Account
  const [accNo, setAccNo] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'Current Account' | 'Savings Account'>('Current Account');
  const [accDate, setAccDate] = useState('22/02/2025');
  const [accBalance, setAccBalance] = useState('0.00');
  const [accActive, setAccActive] = useState('Yes');
  const [selectedBranchForAcc, setSelectedBranchForAcc] = useState<BranchRecord | null>(branches[0] || null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isOpen) return null;

  // Handlers for Banks
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
    onSaveBank(newBank);
    setBankName('');
    setSelectedBankId('');
    showToast(`✅ Bank "${newBank.name}" saved successfully!`);
  };

  // Handlers for Branches
  const handleSaveBranch = () => {
    if (!branchName.trim()) {
      showToast('⚠️ Please enter Branch Name');
      return;
    }
    const newBranch: BranchRecord = {
      id: selectedBranchId || 'br-' + Date.now(),
      bankName: branchBank,
      branchName: branchName.trim(),
      address: branchAddress.trim() || 'YOUR ADDRESS',
      contactNo: branchContact.trim() || '777777',
      ifsc: branchIfsc.trim() || '78787878',
      branchCode: branchCode.trim() || '78787878'
    };
    onSaveBranch(newBranch);
    setBranchName('');
    setBranchAddress('');
    setBranchContact('');
    setBranchIfsc('');
    setBranchCode('');
    setSelectedBranchId('');
    showToast(`✅ Branch "${newBranch.branchName}" saved successfully!`);
  };

  // Handlers for Accounts
  const handleSaveAccount = () => {
    if (!accNo.trim() || !accName.trim()) {
      showToast('⚠️ Please enter Account Number and Account Name');
      return;
    }
    const newAccount: BankAccountRecord = {
      id: selectedAccountId || 'ba-' + Date.now(),
      accountNo: accNo.trim(),
      accountName: accName.trim(),
      accountType: accType,
      bankName: selectedBranchForAcc?.bankName || 'SBI',
      branchName: selectedBranchForAcc?.branchName || 'YOUR ADDRESS',
      balance: parseFloat(accBalance) || 0
    };
    onSaveAccount(newAccount);
    setAccNo('');
    setAccName('');
    setAccBalance('0.00');
    setSelectedAccountId('');
    showToast(`✅ Account "${newAccount.accountName}" (${newAccount.accountNo}) saved successfully!`);
  };

  const btnStyle = (bgGradient: string) => ({
    width: '100%',
    padding: '6px 8px',
    background: bgGradient,
    color: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: '11px',
    borderRadius: '3px',
    border: '1px solid rgba(0,0,0,0.3)',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase' as const
  });

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(1px)'
      }}
    >
      {/* 1:1 Windows Form Modal (Frames 272, 278, 284) */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: isMaximized ? '100vw' : '920px',
          height: isMaximized ? '100vh' : 'auto',
          maxWidth: isMaximized ? '100vw' : '96vw',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#ffffff',
          border: isMaximized ? 'none' : '2px solid #1e40af',
          borderRadius: isMaximized ? '0' : '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          fontFamily: 'Segoe UI, -apple-system, sans-serif',
          userSelect: 'none',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span>
            <span>
              Banking Master -{' '}
              {activeTab === 'BANKS'
                ? 'List of Banks'
                : activeTab === 'BRANCHES'
                ? 'Branch Entry'
                : 'Bank Accounts Registration'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              title="Minimize"
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: '#e2e8f0',
                color: '#000000',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              _
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: '#e2e8f0',
                color: '#000000',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              □
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {toastMsg && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderBottom: '1px solid #bfdbfe',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* Tab Strip */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('BANKS')}
            style={{
              padding: '8px 20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: 'none',
              borderRight: '1px solid #cbd5e1',
              backgroundColor: activeTab === 'BANKS' ? '#003366' : 'transparent',
              color: activeTab === 'BANKS' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            List of Banks (F1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BRANCHES')}
            style={{
              padding: '8px 20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: 'none',
              borderRight: '1px solid #cbd5e1',
              backgroundColor: activeTab === 'BRANCHES' ? '#003366' : 'transparent',
              color: activeTab === 'BRANCHES' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Branch Entry (F2)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            style={{
              padding: '8px 20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: 'none',
              backgroundColor: activeTab === 'ACCOUNTS' ? '#003366' : 'transparent',
              color: activeTab === 'ACCOUNTS' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Bank Accounts Registration (F3)
          </button>
        </div>

        {/* TAB 1: LIST OF BANKS (1:1 Frame 272) */}
        {activeTab === 'BANKS' && (
          <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
            <div
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                padding: '6px 12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '3px',
                borderTopRightRadius: '3px'
              }}
            >
              List of Banks
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                border: '1px solid #cbd5e1',
                borderTop: 'none',
                padding: '16px',
                backgroundColor: '#f8fafc'
              }}
            >
              {/* Table */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  border: '1px solid #005073',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  height: '240px',
                  overflowY: 'auto'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#005073', color: '#ffffff', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '5px 8px', borderRight: '1px solid #003852', width: '40px', textAlign: 'center' }}></th>
                      <th style={{ padding: '5px 12px' }}>Bank Name</th>
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
                          cursor: 'pointer',
                          backgroundColor: selectedBankId === b.id ? '#dbeafe' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          fontWeight: selectedBankId === b.id ? 'bold' : 'normal',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#1e40af' }}>
                          {selectedBankId === b.id ? '▷' : idx + 1}
                        </td>
                        <td style={{ padding: '5px 12px', color: '#1e293b' }}>{b.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Button Strip (1:1 Frame 272) */}
              <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankId('');
                    setBankName('');
                  }}
                  style={btnStyle('linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)')}
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  style={btnStyle('linear-gradient(180deg, #15803d 0%, #14532d 100%)')}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  style={btnStyle('linear-gradient(180deg, #374151 0%, #111827 100%)')}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBankId) onDeleteBank(selectedBankId);
                  }}
                  style={btnStyle('linear-gradient(180deg, #64748b 0%, #334155 100%)')}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Input (1:1 Frame 272) */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 'bold', color: '#334155', minWidth: '80px' }}>Bank Name :</label>
              <input
                type="text"
                placeholder="Enter bank name..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{
                  width: '320px',
                  backgroundColor: '#ffffcc',
                  border: '1px solid #94a3b8',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BRANCH ENTRY (1:1 Frame 278) */}
        {activeTab === 'BRANCHES' && (
          <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
            <div
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                padding: '5px 12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '3px',
                borderTopRightRadius: '3px'
              }}
            >
              Branch Entry
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                border: '1px solid #cbd5e1',
                borderTop: 'none',
                padding: '12px',
                backgroundColor: '#f8fafc'
              }}
            >
              {/* Form on Left */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  Bank Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Bank :</label>
                  <select
                    value={branchBank}
                    onChange={(e) => setBranchBank(e.target.value)}
                    style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', fontWeight: 'bold' }}
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Branch Name :</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'flex-start' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569', marginTop: '4px' }}>Address :</label>
                  <textarea
                    rows={2}
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Contact No. :</label>
                  <input
                    type="text"
                    value={branchContact}
                    onChange={(e) => setBranchContact(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>IFSC :</label>
                  <input
                    type="text"
                    value={branchIfsc}
                    onChange={(e) => setBranchIfsc(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Branch Code :</label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranchId('');
                    setBranchName('');
                    setBranchAddress('');
                  }}
                  style={btnStyle('linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)')}
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveBranch}
                  style={btnStyle('linear-gradient(180deg, #15803d 0%, #14532d 100%)')}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveBranch}
                  style={btnStyle('linear-gradient(180deg, #374151 0%, #111827 100%)')}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBranchId) onDeleteBranch(selectedBranchId);
                  }}
                  style={btnStyle('linear-gradient(180deg, #64748b 0%, #334155 100%)')}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Grid (1:1 Frame 278) */}
            <div
              style={{
                marginTop: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #005073',
                borderRadius: '3px',
                overflow: 'hidden',
                height: '140px',
                overflowY: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#005073', color: '#ffffff', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #003852' }}>Bank</th>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #003852' }}>Branch Name</th>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #003852' }}>Address</th>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #003852' }}>Contact No.</th>
                    <th style={{ padding: '4px 6px', borderRight: '1px solid #003852' }}>IFSC</th>
                    <th style={{ padding: '4px 6px' }}>Branch Code</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((br) => (
                    <tr
                      key={br.id}
                      onClick={() => {
                        setSelectedBranchId(br.id);
                        setBranchBank(br.bankName);
                        setBranchName(br.branchName);
                        setBranchAddress(br.address);
                        setBranchContact(br.contactNo);
                        setBranchIfsc(br.ifsc);
                        setBranchCode(br.branchCode);
                      }}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedBranchId === br.id ? '#dbeafe' : '#ffffff',
                        fontWeight: selectedBranchId === br.id ? 'bold' : 'normal',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{br.bankName}</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{br.branchName}</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{br.address}</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{br.contactNo}</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{br.ifsc}</td>
                      <td style={{ padding: '4px 6px' }}>{br.branchCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BANK ACCOUNTS REGISTRATION (1:1 Frame 284) */}
        {activeTab === 'ACCOUNTS' && (
          <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
            <div
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                padding: '5px 12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
                letterSpacing: '0.5px',
                borderTopLeftRadius: '3px',
                borderTopRightRadius: '3px'
              }}
            >
              Bank Accounts Registration
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                border: '1px solid #cbd5e1',
                borderTop: 'none',
                padding: '12px',
                backgroundColor: '#f8fafc'
              }}
            >
              {/* Account Form on Left */}
              <div
                style={{
                  width: '320px',
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  flexShrink: 0
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                  Account Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Account No. :</label>
                  <input
                    type="text"
                    value={accNo}
                    onChange={(e) => setAccNo(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Account Name :</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Account Type :</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Opening Date :</label>
                  <input
                    type="text"
                    value={accDate}
                    onChange={(e) => setAccDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Balance Amount :</label>
                  <input
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    style={{ backgroundColor: '#ffffcc', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '6px', alignItems: 'center' }}>
                  <label style={{ textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Active :</label>
                  <select
                    value={accActive}
                    onChange={(e) => setAccActive(e.target.value)}
                    style={{ width: '80px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px' }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Branch Selector Table in Center (1:1 Frame 284) */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  border: '1px solid #16a34a',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '210px'
                }}
              >
                <div style={{ backgroundColor: '#15803d', color: '#ffffff', fontWeight: 'bold', padding: '4px 8px', fontSize: '11px' }}>
                  Select Branch
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                    <thead style={{ backgroundColor: '#4ade80', color: '#0f172a', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: '4px', borderRight: '1px solid #16a34a', width: '25px', textAlign: 'center' }}></th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #16a34a' }}>Bank</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #16a34a' }}>Branch Name</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #16a34a' }}>Address</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #16a34a' }}>Contact No.</th>
                        <th style={{ padding: '4px 6px' }}>IFSC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((b, idx) => {
                        const isSel = selectedBranchForAcc?.id === b.id;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBranchForAcc(b)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isSel ? '#dbeafe' : '#ffffff',
                              fontWeight: isSel ? 'bold' : 'normal',
                              borderBottom: '1px solid #e2e8f0'
                            }}
                          >
                            <td style={{ padding: '4px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#1e40af' }}>
                              {isSel ? '▷' : idx + 1}
                            </td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{b.bankName}</td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{b.branchName}</td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{b.address}</td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{b.contactNo}</td>
                            <td style={{ padding: '4px 6px' }}>{b.ifsc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId('');
                    setAccNo('');
                    setAccName('');
                    setAccBalance('0.00');
                  }}
                  style={btnStyle('linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)')}
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveAccount}
                  style={btnStyle('linear-gradient(180deg, #15803d 0%, #14532d 100%)')}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveAccount}
                  style={btnStyle('linear-gradient(180deg, #374151 0%, #111827 100%)')}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAccountId) onDeleteAccount(selectedAccountId);
                  }}
                  style={btnStyle('linear-gradient(180deg, #64748b 0%, #334155 100%)')}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Grid of Registered Accounts (1:1 Frame 284) */}
            <div
              style={{
                marginTop: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #005073',
                borderRadius: '3px',
                overflow: 'hidden',
                height: '130px',
                overflowY: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#005073', color: '#ffffff', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #003852' }}>Account No.</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #003852' }}>Account Name</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #003852' }}>Account Type</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #003852' }}>Bank</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #003852' }}>Branch Name</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Balance Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
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
                        cursor: 'pointer',
                        backgroundColor: selectedAccountId === acc.id ? '#dbeafe' : '#ffffff',
                        fontWeight: selectedAccountId === acc.id ? 'bold' : 'normal',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e3a8a' }}>{acc.accountNo}</td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{acc.accountName}</td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{acc.accountType}</td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{acc.bankName}</td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>{acc.branchName}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#15803d' }}>₹{acc.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
