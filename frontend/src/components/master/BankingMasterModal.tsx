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

  if (!isOpen) return null;

  // Handlers for Banks
  const handleSaveBank = () => {
    if (!bankName.trim()) {
      alert('Please enter Bank Name');
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
  };

  // Handlers for Branches
  const handleSaveBranch = () => {
    if (!branchName.trim()) {
      alert('Please enter Branch Name');
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
  };

  // Handlers for Accounts
  const handleSaveAccount = () => {
    if (!accNo.trim() || !accName.trim()) {
      alert('Please enter Account Number and Account Name');
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
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      {/* 1:1 Windows Form Modal */}
      <div className="relative w-[920px] bg-white border-2 border-[#1e40af] rounded shadow-2xl overflow-hidden font-sans select-none text-xs">
        {/* Title Bar */}
        <div className="bg-[#1d4ed8] text-white px-3 py-1 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <span>🏛️</span>
            <span>Banking Master - {activeTab === 'BANKS' ? 'List of Banks' : activeTab === 'BRANCHES' ? 'Branch Entry' : 'Bank Accounts Registration'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
            >
              _
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
            >
              □
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex bg-[#e2e8f0] border-b border-gray-300">
          <button
            type="button"
            onClick={() => setActiveTab('BANKS')}
            className={`py-1.5 px-6 font-bold uppercase transition-colors border-r border-gray-300 ${
              activeTab === 'BANKS' ? 'bg-[#003366] text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            List of Banks (F1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BRANCHES')}
            className={`py-1.5 px-6 font-bold uppercase transition-colors border-r border-gray-300 ${
              activeTab === 'BRANCHES' ? 'bg-[#003366] text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Branch Entry (F2)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`py-1.5 px-6 font-bold uppercase transition-colors ${
              activeTab === 'ACCOUNTS' ? 'bg-[#003366] text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bank Accounts Registration (F3)
          </button>
        </div>

        {/* TAB 1: LIST OF BANKS (1:1 Frame 272) */}
        {activeTab === 'BANKS' && (
          <div className="p-4 bg-white">
            <div className="bg-[#1d4ed8] text-white py-1.5 px-3 text-center font-bold text-sm tracking-wide rounded-t">
              List of Banks
            </div>
            <div className="flex gap-4 border border-t-0 border-gray-300 p-4 bg-[#f8fafc]">
              {/* Table */}
              <div className="flex-1 bg-white border border-[#005073] rounded overflow-hidden h-[240px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#005073] text-white font-bold sticky top-0">
                    <tr>
                      <th className="py-1 px-3 border-r border-[#003852] w-12 text-center"></th>
                      <th className="py-1 px-3">Bank Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {banks.map((b, idx) => (
                      <tr
                        key={b.id}
                        onClick={() => {
                          setSelectedBankId(b.id);
                          setBankName(b.name);
                        }}
                        className={`cursor-pointer ${
                          selectedBankId === b.id ? 'bg-blue-100 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-1 px-3 text-center border-r border-gray-200 text-blue-800">
                          {selectedBankId === b.id ? '▷' : idx + 1}
                        </td>
                        <td className="py-1 px-3 text-gray-800 font-medium">{b.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Button Strip (1:1 Frame 272) */}
              <div className="w-24 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankId('');
                    setBankName('');
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-[#1b3b6f] to-[#0a1c38] text-white font-bold rounded shadow-xs"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  className="w-full py-1.5 bg-gradient-to-b from-[#15803d] to-[#14532d] text-white font-bold rounded shadow-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-bold rounded shadow-xs"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBankId) onDeleteBank(selectedBankId);
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-500 to-gray-700 text-white font-bold rounded shadow-xs"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Input (1:1 Frame 272) */}
            <div className="mt-3 flex items-center gap-3">
              <label className="font-bold text-gray-700">Bank Name :</label>
              <input
                type="text"
                placeholder="Enter bank name..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-80 bg-[#ffffcc] border border-gray-400 px-2 py-1 font-semibold text-gray-900 rounded focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: BRANCH ENTRY (1:1 Frame 278) */}
        {activeTab === 'BRANCHES' && (
          <div className="p-4 bg-white">
            <div className="bg-[#1d4ed8] text-white py-1 px-3 text-center font-bold text-sm tracking-wide rounded-t">
              Branch Entry
            </div>
            <div className="flex gap-4 border border-t-0 border-gray-300 p-3 bg-[#f8fafc]">
              {/* Form on Left */}
              <div className="flex-1 bg-white p-3 border border-gray-300 rounded flex flex-col gap-2">
                <div className="text-[11px] font-bold text-blue-900 border-b pb-1">Bank Information</div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">Bank :</label>
                  <select
                    value={branchBank}
                    onChange={(e) => setBranchBank(e.target.value)}
                    className="col-span-8 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">Branch Name :</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="col-span-8 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2 items-start">
                  <label className="col-span-3 text-right font-medium text-gray-700 mt-1">Address :</label>
                  <textarea
                    rows={2}
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    className="col-span-8 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded resize-none"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">Contact No. :</label>
                  <input
                    type="text"
                    value={branchContact}
                    onChange={(e) => setBranchContact(e.target.value)}
                    className="col-span-6 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">IFSC :</label>
                  <input
                    type="text"
                    value={branchIfsc}
                    onChange={(e) => setBranchIfsc(e.target.value)}
                    className="col-span-6 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 text-right font-medium text-gray-700">Branch Code :</label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="col-span-6 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-24 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranchId('');
                    setBranchName('');
                    setBranchAddress('');
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-[#1b3b6f] to-[#0a1c38] text-white font-bold rounded shadow-xs"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveBranch}
                  className="w-full py-1.5 bg-gradient-to-b from-[#15803d] to-[#14532d] text-white font-bold rounded shadow-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveBranch}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-bold rounded shadow-xs"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBranchId) onDeleteBranch(selectedBranchId);
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-500 to-gray-700 text-white font-bold rounded shadow-xs"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Grid (1:1 Frame 278) */}
            <div className="mt-3 bg-white border border-[#005073] rounded overflow-hidden h-[130px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#005073] text-white font-bold sticky top-0">
                  <tr>
                    <th className="py-1 px-2 border-r border-[#003852]">Bank</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Branch Name</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Address</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Contact No.</th>
                    <th className="py-1 px-2 border-r border-[#003852]">IFSC</th>
                    <th className="py-1 px-2">Branch Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
                      className={`cursor-pointer ${selectedBranchId === br.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-1 px-2 border-r border-gray-200">{br.bankName}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{br.branchName}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{br.address}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{br.contactNo}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{br.ifsc}</td>
                      <td className="py-1 px-2">{br.branchCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BANK ACCOUNTS REGISTRATION (1:1 Frame 284) */}
        {activeTab === 'ACCOUNTS' && (
          <div className="p-4 bg-white">
            <div className="bg-[#1d4ed8] text-white py-1 px-3 text-center font-bold text-sm tracking-wide rounded-t">
              Bank Accounts Registration
            </div>
            <div className="flex gap-3 border border-t-0 border-gray-300 p-3 bg-[#f8fafc]">
              {/* Account Form on Left */}
              <div className="w-[340px] bg-white p-3 border border-gray-300 rounded flex flex-col gap-1.5 shrink-0">
                <div className="text-[11px] font-bold text-blue-900 border-b pb-1">Account Information</div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Account No. :</label>
                  <input
                    type="text"
                    value={accNo}
                    onChange={(e) => setAccNo(e.target.value)}
                    className="flex-1 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Account Name :</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="flex-1 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Account Type :</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded"
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Opening Date :</label>
                  <input
                    type="text"
                    value={accDate}
                    onChange={(e) => setAccDate(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Balance Amount :</label>
                  <input
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    className="flex-1 bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Active :</label>
                  <select
                    value={accActive}
                    onChange={(e) => setAccActive(e.target.value)}
                    className="w-20 bg-white border border-gray-300 px-2 py-0.5 rounded"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Branch Selector Table in Center (1:1 Frame 284) */}
              <div className="flex-1 bg-white border border-green-700 rounded overflow-hidden flex flex-col h-[200px]">
                <div className="bg-green-700 text-white font-bold px-2 py-1 text-[11px]">Select Branch</div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-[#4ade80] text-gray-900 font-bold sticky top-0">
                      <tr>
                        <th className="py-1 px-1 border-r border-green-600 w-6"></th>
                        <th className="py-1 px-2 border-r border-green-600">Bank</th>
                        <th className="py-1 px-2 border-r border-green-600">Branch Name</th>
                        <th className="py-1 px-2 border-r border-green-600">Address</th>
                        <th className="py-1 px-2 border-r border-green-600">Contact No.</th>
                        <th className="py-1 px-2">IFSC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {branches.map((b, idx) => {
                        const isSel = selectedBranchForAcc?.id === b.id;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBranchForAcc(b)}
                            className={`cursor-pointer ${isSel ? 'bg-blue-100 font-bold' : 'hover:bg-gray-50'}`}
                          >
                            <td className="py-1 px-1 text-center border-r border-gray-200 text-blue-800">
                              {isSel ? '▷' : idx + 1}
                            </td>
                            <td className="py-1 px-2 border-r border-gray-200">{b.bankName}</td>
                            <td className="py-1 px-2 border-r border-gray-200">{b.branchName}</td>
                            <td className="py-1 px-2 border-r border-gray-200">{b.address}</td>
                            <td className="py-1 px-2 border-r border-gray-200">{b.contactNo}</td>
                            <td className="py-1 px-2">{b.ifsc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-24 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId('');
                    setAccNo('');
                    setAccName('');
                    setAccBalance('0.00');
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-[#1b3b6f] to-[#0a1c38] text-white font-bold rounded shadow-xs"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={handleSaveAccount}
                  className="w-full py-1.5 bg-gradient-to-b from-[#15803d] to-[#14532d] text-white font-bold rounded shadow-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleSaveAccount}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-bold rounded shadow-xs"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAccountId) onDeleteAccount(selectedAccountId);
                  }}
                  className="w-full py-1.5 bg-gradient-to-b from-gray-500 to-gray-700 text-white font-bold rounded shadow-xs"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Bottom Grid of Registered Accounts (1:1 Frame 284) */}
            <div className="mt-3 bg-white border border-[#005073] rounded overflow-hidden h-[120px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#005073] text-white font-bold sticky top-0">
                  <tr>
                    <th className="py-1 px-2 border-r border-[#003852]">Account No.</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Account Name</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Account Type</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Bank</th>
                    <th className="py-1 px-2 border-r border-[#003852]">Branch Name</th>
                    <th className="py-1 px-2 text-right">Balance Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
                      className={`cursor-pointer ${selectedAccountId === acc.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-1 px-2 border-r border-gray-200 font-mono font-bold text-blue-900">{acc.accountNo}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{acc.accountName}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{acc.accountType}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{acc.bankName}</td>
                      <td className="py-1 px-2 border-r border-gray-200">{acc.branchName}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-green-700">₹{acc.balance.toFixed(2)}</td>
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
