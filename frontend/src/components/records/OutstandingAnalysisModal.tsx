import React, { useState } from 'react';
import type { OutstandingRecord, OutstandingEntity, OutstandingFilterMode } from '../../types/retailDaddy';
import { ExcelImportModal } from '../common/ExcelImportModal';

interface OutstandingAnalysisModalProps {
  isOpen: boolean;
  initialEntity?: OutstandingEntity;
  customerRecords: OutstandingRecord[];
  supplierRecords: OutstandingRecord[];
  onUpdateRecord: (updated: OutstandingRecord) => void;
  onOpenSupplierPayment?: (supplierId: string) => void;
  onClose: () => void;
}

export const OutstandingAnalysisModal: React.FC<OutstandingAnalysisModalProps> = ({
  isOpen,
  initialEntity = 'CUSTOMER',
  customerRecords,
  supplierRecords,
  onUpdateRecord,
  onOpenSupplierPayment,
  onClose
}) => {
  const [activeEntity, setActiveEntity] = useState<OutstandingEntity>(initialEntity);
  const [filterMode, setFilterMode] = useState<OutstandingFilterMode>(
    initialEntity === 'CUSTOMER' ? 'RECEIVABLE' : 'PAYABLE'
  );

  const getFyStart = () => {
    const d = new Date();
    const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `01/04/${y}`;
  };
  const getToday = () => new Date().toLocaleDateString('en-GB');

  const [fromDate, setFromDate] = useState(getFyStart);
  const [toDate, setToDate] = useState(getToday);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Live Simulation Modal: Customer Pay / Advance Deposit (Video 07 Frames 0230-0480)
  const [showLivePayDialog, setShowLivePayDialog] = useState(false);
  const [targetRecord, setTargetRecord] = useState<OutstandingRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(100);
  const [payType, setPayType] = useState<'PAY_DUE' | 'DEPOSIT_ADVANCE' | 'CREDIT_SALE'>('PAY_DUE');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleConfirmImportOutstanding = (rows: Record<string, string>[]) => {
    let updatedCount = 0;
    rows.forEach((row, idx) => {
      const getField = (...fieldNames: string[]): string => {
        const keys = Object.keys(row);
        for (const fn of fieldNames) {
          const cleanTarget = fn.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (row[fn] !== undefined && String(row[fn]).trim() !== '') return String(row[fn]).trim();
          if (row[cleanTarget] !== undefined && String(row[cleanTarget]).trim() !== '') return String(row[cleanTarget]).trim();
          const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
          if (found && row[found] !== undefined && String(row[found]).trim() !== '') return String(row[found]).trim();
        }
        return '';
      };

      const name = getField('customername', 'suppliername', 'party', 'name', 'particulars', 'ledger') || `Imported Party ${idx + 1}`;
      const phone = getField('phone', 'contact', 'contactno', 'mobile', 'tel');
      const rawBalance = getField('openingbalance', 'balance', 'due', 'amount');

      const existing = records.find(r =>
        (phone && r.contactNo === phone) ||
        (name && r.name.toLowerCase() === name.toLowerCase())
      );

      if (existing) {
        const balance = rawBalance !== '' ? parseFloat(rawBalance) || 0 : existing.balance;
        onUpdateRecord({
          ...existing,
          balance,
          totalCredit: balance > 0 ? balance : 0,
          totalDebit: balance < 0 ? Math.abs(balance) : 0
        });
        updatedCount++;
      } else {
        const balance = rawBalance !== '' ? parseFloat(rawBalance) || 0 : 0;
        onUpdateRecord({
          id: `out-imp-${Date.now()}-${idx}`,
          entityType: activeEntity,
          code: `PARTY-${Date.now() % 10000}-${idx + 1}`,
          name: name,
          contactNo: phone || '',
          balance,
          totalCredit: balance > 0 ? balance : 0,
          totalDebit: balance < 0 ? Math.abs(balance) : 0
        });
        updatedCount++;
      }
    });
    showToast(`✓ Successfully imported & updated ${updatedCount} ${activeEntity.toLowerCase()} ledger records!`);
  };

  const records = activeEntity === 'CUSTOMER' ? customerRecords : supplierRecords;

  // Filter records based on selected mode (Receivable, Payable, No Dues, All)
  const displayedRecords = records.filter(r => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'NO_DUES') return Math.abs(r.balance) === 0;

    if (activeEntity === 'CUSTOMER') {
      // For Customers:
      // Positive balance (>0) = Customer owes store (RECEIVABLE - Frame 0110)
      // Negative balance (<0) = Customer deposited advance (PAYABLE - Frame 0205)
      if (filterMode === 'RECEIVABLE') return r.balance > 0;
      if (filterMode === 'PAYABLE') return r.balance < 0;
    } else {
      // For Suppliers:
      // Positive balance (>0) = Store owes supplier (PAYABLE - Frame 0330)
      // Negative balance (<0) = Supplier owes store / refund (RECEIVABLE)
      if (filterMode === 'PAYABLE') return r.balance > 0;
      if (filterMode === 'RECEIVABLE') return r.balance < 0;
    }
    return true;
  });

  const totalCreditSum = displayedRecords.reduce((sum, r) => sum + r.totalCredit, 0);
  const totalDebitSum = displayedRecords.reduce((sum, r) => sum + r.totalDebit, 0);
  const totalBalanceSum = displayedRecords.reduce((sum, r) => sum + r.balance, 0);

  const handleReset = () => {
    setFromDate(getFyStart());
    setToDate(getToday());
    setFilterMode(activeEntity === 'CUSTOMER' ? 'RECEIVABLE' : 'PAYABLE');
    setSelectedRecordId(null);
  };

  const handleExportExcel = () => {
    const header = `${activeEntity === 'CUSTOMER' ? 'Customer' : 'Supplier'} Name - ID,Total Credit,Total Debit,Balance\n`;
    const rows = displayedRecords
      .map(r => `"${r.name} - ${r.code}",${r.totalCredit.toFixed(2)},${r.totalDebit.toFixed(2)},${r.balance.toFixed(2)}`)
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEntity.toLowerCase()}_outstanding_${filterMode.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${displayedRecords.length} records to Excel!`);
  };

  // Open Live Accounting Action (Video 07 demonstration with Pooja & Delco)
  const handleOpenAction = (rec: OutstandingRecord) => {
    setTargetRecord(rec);
    if (activeEntity === 'CUSTOMER') {
      if (rec.balance > 0) {
        setPayType('PAY_DUE');
        setPayAmount(Math.min(100, rec.balance));
      } else {
        setPayType('DEPOSIT_ADVANCE');
        setPayAmount(1000);
      }
      setShowLivePayDialog(true);
    } else {
      if (onOpenSupplierPayment) {
        onOpenSupplierPayment(rec.code);
      } else {
        setTargetRecord(rec);
        setPayType('PAY_DUE');
        setPayAmount(10000);
        setShowLivePayDialog(true);
      }
    }
  };

  // Execute Live Accounting Transaction (Matching Video 07 Frames 0240-0470)
  const handleExecuteLivePay = () => {
    if (!targetRecord) return;

    let updated: OutstandingRecord;
    if (activeEntity === 'CUSTOMER') {
      if (payType === 'PAY_DUE') {
        // Customer pays due amount
        const newCredit = targetRecord.totalCredit + payAmount;
        const newBalance = targetRecord.totalDebit - newCredit;
        updated = {
          ...targetRecord,
          totalCredit: newCredit,
          balance: newBalance
        };
        showToast(`✓ Received ₹${payAmount.toFixed(2)} from ${targetRecord.name}. Balance: ₹${newBalance.toFixed(2)}`);
      } else if (payType === 'DEPOSIT_ADVANCE') {
        // Customer deposits excess advance cash (e.g. Frame 0370: Pooja deposits ₹5000)
        const newCredit = targetRecord.totalCredit + payAmount;
        const newBalance = targetRecord.totalDebit - newCredit;
        updated = {
          ...targetRecord,
          totalCredit: newCredit,
          balance: newBalance // becomes negative, shifting to Payable!
        };
        showToast(`✓ Advance Deposit ₹${payAmount.toFixed(2)} stored! Moved to Payable table: -₹${Math.abs(newBalance).toFixed(2)}`);
      } else {
        // Credit sale billed to customer (e.g. Frame 0440: ₹2016 billed, deducting advance)
        const newDebit = targetRecord.totalDebit + payAmount;
        const newBalance = newDebit - targetRecord.totalCredit;
        updated = {
          ...targetRecord,
          totalDebit: newDebit,
          balance: newBalance
        };
        showToast(`✓ Credit Sale ₹${payAmount.toFixed(2)} offset from advance! Net balance: ₹${newBalance.toFixed(2)}`);
      }
    } else {
      // Supplier payment (Frame 0350: Pay Delco ₹10000)
      const newDebit = targetRecord.totalDebit + payAmount;
      const newBalance = targetRecord.totalCredit - newDebit;
      updated = {
        ...targetRecord,
        totalDebit: newDebit,
        balance: newBalance
      };
      showToast(`✓ Paid ₹${payAmount.toFixed(2)} to ${targetRecord.name}. Outstanding dropped to ₹${newBalance.toFixed(2)}`);
    }

    onUpdateRecord(updated);
    setShowLivePayDialog(false);
  };

  // Determine row background color matching Frame 0110 (Crimson Red) & Frame 0205 (Deep Blue)
  const getRowBackground = (rec: OutstandingRecord, isSelected: boolean) => {
    if (isSelected) return '#fde047'; // highlighted yellow

    if (activeEntity === 'CUSTOMER') {
      if (filterMode === 'RECEIVABLE' || (filterMode === 'ALL' && rec.balance > 0)) {
        return '#dc2626'; // Vivid Crimson Red (Frame 0110)
      }
      if (filterMode === 'PAYABLE' || (filterMode === 'ALL' && rec.balance < 0)) {
        return '#002b66'; // Deep Blue (Frame 0205)
      }
      return '#ffffff';
    } else {
      if (filterMode === 'PAYABLE' || (filterMode === 'ALL' && rec.balance > 0)) {
        return '#dc2626'; // Red for supplier payable (Frame 0330)
      }
      return '#ffffff';
    }
  };

  const getRowTextColor = (rec: OutstandingRecord, isSelected: boolean) => {
    if (isSelected) return '#0f172a';
    if (activeEntity === 'CUSTOMER') {
      if (filterMode === 'RECEIVABLE' || filterMode === 'PAYABLE' || rec.balance !== 0) {
        return '#ffffff';
      }
      return '#0f172a';
    } else {
      if (rec.balance > 0) return '#ffffff';
      return '#0f172a';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Window Frame (Frames 0105, 0330) */}
      <div
        style={{
          width: '95%',
          maxWidth: '1050px',
          height: '88vh',
          maxHeight: '640px',
          backgroundColor: '#ffffff',
          border: '2px solid #0284c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner (Frame 0105: Label3 badge + Blue Banner) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7',
            userSelect: 'none'
          }}
        >
          {/* Entity Tab Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveEntity('CUSTOMER');
                setFilterMode('RECEIVABLE');
              }}
              style={{
                backgroundColor: activeEntity === 'CUSTOMER' ? '#ffffff' : '#1e3a8a',
                color: activeEntity === 'CUSTOMER' ? '#1e3a8a' : '#bfdbfe',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              👥 Customer Outstanding
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveEntity('SUPPLIER');
                setFilterMode('PAYABLE');
              }}
              style={{
                backgroundColor: activeEntity === 'SUPPLIER' ? '#ffffff' : '#1e3a8a',
                color: activeEntity === 'SUPPLIER' ? '#1e3a8a' : '#bfdbfe',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              🏢 Supplier Outstanding
            </button>
          </div>

          {/* Banner Title */}
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {activeEntity === 'CUSTOMER' ? 'Customer Outstanding Balance' : 'Supplier Outstanding Balance'}
          </div>

          {/* Window Close */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e11d48',
              border: '1px solid #ffffff',
              color: '#ffffff',
              width: '26px',
              height: '22px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Ribbon Bar (Frame 0105: Search By Date + 4 Blue Pills + Reset + Export + Import) */}
        <div
          style={{
            background: '#f8fafc',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          {/* Left: Date Range Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Search By Date :</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>From</span>
              <input
                type="text"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ width: '85px', height: '24px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 4px', fontSize: '11px', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>To</span>
              <input
                type="text"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{ width: '85px', height: '24px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 4px', fontSize: '11px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Center: 4 Filter Pills (Frame 0105: Receivable, Payable, No Dues, All) */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['RECEIVABLE', 'PAYABLE', 'NO_DUES', 'ALL'] as OutstandingFilterMode[]).map(mode => {
              const isSelected = filterMode === mode;
              const labels: Record<OutstandingFilterMode, string> = {
                RECEIVABLE: activeEntity === 'CUSTOMER' ? 'Receivable (Lene Wala)' : 'Receivable',
                PAYABLE: activeEntity === 'CUSTOMER' ? 'Payable (Advance)' : 'Payable (Dene Wala)',
                NO_DUES: 'No Dues',
                ALL: 'All'
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    backgroundColor: isSelected ? '#003366' : '#1e40af',
                    color: '#ffffff',
                    border: isSelected ? '2px solid #38bdf8' : '1px solid #1e3a8a',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '900' : 'bold',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* Right: Reset, Export Excel, Import Excel */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                height: '28px',
                padding: '0 12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                height: '28px',
                padding: '0 12px',
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              style={{
                height: '28px',
                padding: '0 12px',
                background: 'linear-gradient(180deg, #84cc16 0%, #65a30d 100%)',
                color: '#ffffff',
                border: '1px solid #4d7c0f',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Import Excel
            </button>
          </div>
        </div>

        {/* Ledger Table (Frames 0105, 0110, 0205, 0330) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e40af', width: '40px', textAlign: 'center' }}>▷</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e40af' }}>
                  {activeEntity === 'CUSTOMER' ? 'Customer Name - Customer ID' : 'Supplier Name - Supplier ID'}
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e40af', width: '180px', textAlign: 'right' }}>
                  Total Credit
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e40af', width: '180px', textAlign: 'right' }}>
                  Total Debit
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e40af', width: '180px', textAlign: 'right' }}>
                  Balance
                </th>
                <th style={{ padding: '6px 10px', width: '110px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No {activeEntity.toLowerCase()} records found under {filterMode.replace('_', ' ')}.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec, idx) => {
                  const isSelected = selectedRecordId === rec.id;
                  const bg = getRowBackground(rec, isSelected);
                  const textColor = getRowTextColor(rec, isSelected);

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecordId(rec.id)}
                      style={{
                        backgroundColor: bg,
                        color: textColor,
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                        {isSelected ? '▶' : ''} {idx + 1}
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>
                        {rec.name} - {rec.code}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '500' }}>
                        ₹{rec.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '500' }}>
                        ₹{rec.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                        ₹{rec.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenAction(rec);
                          }}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                          title="Record payment for outstanding balance"
                        >
                          {activeEntity === 'CUSTOMER' ? 'Customer Pay' : 'Supplier Pay'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {displayedRecords.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'right', color: '#1e3a8a' }}>
                    Total ({displayedRecords.length} records):
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#1e3a8a' }}>
                    ₹{totalCreditSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#1e3a8a' }}>
                    ₹{totalDebitSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626', fontSize: '13px' }}>
                    ₹{totalBalanceSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer Notes & Legend Bar */}
        <div
          style={{
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '2px' }}></span>
              <strong>Red:</strong> {activeEntity === 'CUSTOMER' ? 'Pending Receivables (Owed by Customer)' : 'Store Payables (Owed to Supplier)'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#002b66', borderRadius: '2px' }}></span>
              <strong>Blue:</strong> Advance Deposits (Store owes Customer)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '2px',
              padding: '2px 14px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Live Transaction Action Modal (Video 07 Demonstration) */}
      {showLivePayDialog && targetRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '450px',
              backgroundColor: '#ffffff',
              border: '2px solid #1d4ed8',
              borderRadius: '4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{activeEntity === 'CUSTOMER' ? 'Customer Pay / Live Accounting' : 'Supplier Payment Voucher'}</span>
              <button
                type="button"
                onClick={() => setShowLivePayDialog(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                  {targetRecord.name} ({targetRecord.code})
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Current Balance: <strong style={{ color: targetRecord.balance >= 0 ? '#dc2626' : '#2563eb' }}>₹{targetRecord.balance.toFixed(2)}</strong>
                </div>
              </div>

              {activeEntity === 'CUSTOMER' ? (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Select Action Type (Demonstrated in Video 07):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { id: 'PAY_DUE', label: '1. Customer Pays Outstanding Due (e.g. ₹100, ₹69)' },
                      { id: 'DEPOSIT_ADVANCE', label: '2. Customer Deposits Advance Cash (e.g. ₹5,000)' },
                      { id: 'CREDIT_SALE', label: '3. Credit Sale Offsets Advance (e.g. ₹2,016 sale)' }
                    ].map(opt => (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          padding: '4px 6px',
                          background: payType === opt.id ? '#eff6ff' : '#ffffff',
                          border: payType === opt.id ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="payType"
                          checked={payType === opt.id}
                          onChange={() => setPayType(opt.id as any)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '12px', fontSize: '11px', color: '#475569' }}>
                  Paying supplier payment voucher (PYMT-0001-2024/25) via Cash / Bank.
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Enter Amount (₹) :
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: '30px',
                    border: '2px solid #2563eb',
                    borderRadius: '3px',
                    padding: '0 8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowLivePayDialog(false)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLivePay}
                  style={{
                    padding: '6px 18px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: '1px solid #15803d',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save & Update Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10001
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Excel / CSV Outstanding Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="outstanding"
        onConfirmImport={handleConfirmImportOutstanding}
      />
    </div>
  );
};
