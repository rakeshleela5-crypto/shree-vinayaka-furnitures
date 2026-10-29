import React, { useState } from 'react';
import type { IncomeVoucher, IncomeVoucherItem, AccountHeadItem } from '../../types/retailDaddy';

interface IncomeVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountHeads: AccountHeadItem[];
  incomeVouchers: IncomeVoucher[];
  onSaveIncomeVoucher: (voucher: IncomeVoucher) => Promise<void> | void;
  onDeleteIncomeVoucher?: (id: string) => Promise<void> | void;
}

export const IncomeVoucherModal: React.FC<IncomeVoucherModalProps> = ({
  isOpen,
  onClose,
  accountHeads,
  incomeVouchers,
  onSaveIncomeVoucher,
  onDeleteIncomeVoucher
}) => {
  const [currentVoucherId, setCurrentVoucherId] = useState<string | null>(null);
  const [voucherNo, setVoucherNo] = useState(() => `INCM-${String(incomeVouchers.length + 1).padStart(4, '0')}-2024/25`);
  const [date, setDate] = useState('03/03/2025');
  const [name, setName] = useState('MADHU');
  const [details, setDetails] = useState('');
  
  // Line item builder
  const [particulars, setParticulars] = useState('SCRAP');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('Income (Direct/Indirect)');
  const [items, setItems] = useState<IncomeVoucherItem[]>([
    { id: 'inc-init-1', particulars: 'SCRAP', amount: 10000, notes: 'Income (Direct/Indirect)' }
  ]);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);

  // Settlement
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Bank');
  const [bankAcNo, setBankAcNo] = useState('99999999');

  // Print voucher popup
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printedVoucher, setPrintedVoucher] = useState<IncomeVoucher | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (!isOpen) return null;

  const loadVoucher = (voucher: IncomeVoucher) => {
    setCurrentVoucherId(voucher.id);
    setVoucherNo(voucher.voucherNo);
    setDate(voucher.date);
    setName(voucher.name);
    setDetails(voucher.details || '');
    setItems(voucher.items && voucher.items.length > 0 ? voucher.items : []);
    setPaymentMode(voucher.paymentMode || 'Bank');
    if (voucher.bankAcNo) setBankAcNo(voucher.bankAcNo);
  };

  const handleNavigate = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (incomeVouchers.length === 0) {
      showToast('No income vouchers recorded yet.', 'info');
      return;
    }
    let currentIdx = incomeVouchers.findIndex(v => v.id === currentVoucherId || v.voucherNo === voucherNo);
    if (currentIdx === -1) currentIdx = incomeVouchers.length - 1;

    let nextIdx = currentIdx;
    if (direction === 'first') nextIdx = 0;
    else if (direction === 'prev') nextIdx = Math.max(0, currentIdx - 1);
    else if (direction === 'next') nextIdx = Math.min(incomeVouchers.length - 1, currentIdx + 1);
    else if (direction === 'last') nextIdx = incomeVouchers.length - 1;

    loadVoucher(incomeVouchers[nextIdx]);
    showToast(`Loaded voucher ${incomeVouchers[nextIdx].voucherNo}`, 'info');
  };

  // Filter particulars heads
  const incomeParticulars = accountHeads.length > 0
    ? accountHeads.map(h => h.accountHead)
    : ['SCRAP', 'INTEREST RECEIVED', 'COMMISSION RECEIVED', 'RENT RECEIVED', 'DISCOUNT RECEIVED'];

  const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAddItem = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    const newItem: IncomeVoucherItem = {
      id: `inc-line-${Date.now()}`,
      particulars,
      amount: numAmount,
      notes: notes.trim() || 'Income (Direct/Indirect)'
    };
    setItems(prev => [...prev, newItem]);
    setAmount('');
    setNotes('Income (Direct/Indirect)');
  };

  const handleRemoveItem = () => {
    if (items.length === 0) return;
    setItems(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    setSelectedItemIdx(0);
  };

  const handleNew = () => {
    setCurrentVoucherId(null);
    setVoucherNo(`INCM-${String(incomeVouchers.length + 1).padStart(4, '0')}-2024/25`);
    setDate('03/03/2025');
    setName('');
    setDetails('');
    setParticulars('SCRAP');
    setAmount('');
    setNotes('Income (Direct/Indirect)');
    setItems([]);
    setPaymentMode('Bank');
    setBankAcNo('99999999');
    showToast('Ready for new income voucher entry.', 'info');
  };

  const handleSave = async () => {
    if (items.length === 0) {
      showToast('Please add at least one income item to the grid.', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('Please enter the payer name.', 'error');
      return;
    }

    const targetId = currentVoucherId || `inc-${Date.now()}`;
    const newVoucher: IncomeVoucher = {
      id: targetId,
      voucherNo,
      date,
      name: name.trim().toUpperCase(),
      details: details.trim(),
      items,
      paymentMode,
      bankAcNo: paymentMode === 'Bank' ? bankAcNo : undefined,
      grandTotal
    };

    setIsSaving(true);
    try {
      await onSaveIncomeVoucher(newVoucher);
      setCurrentVoucherId(targetId);
      showToast(`✓ Income Voucher ${newVoucher.voucherNo} saved successfully!`, 'success');
      setPrintedVoucher(newVoucher);
      setIsPrintModalOpen(true);
    } catch (err: any) {
      showToast(`❌ Failed to save voucher: ${err?.message || 'Server error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (items.length === 0) {
      showToast('Please add at least one income item to the grid.', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('Please enter the payer name.', 'error');
      return;
    }

    const targetId = currentVoucherId || `inc-${Date.now()}`;
    const updatedVoucher: IncomeVoucher = {
      id: targetId,
      voucherNo,
      date,
      name: name.trim().toUpperCase(),
      details: details.trim(),
      items,
      paymentMode,
      bankAcNo: paymentMode === 'Bank' ? bankAcNo : undefined,
      grandTotal
    };

    setIsSaving(true);
    try {
      await onSaveIncomeVoucher(updatedVoucher);
      setCurrentVoucherId(targetId);
      showToast(`✓ Income Voucher ${updatedVoucher.voucherNo} updated successfully!`, 'success');
    } catch (err: any) {
      showToast(`❌ Failed to update voucher: ${err?.message || 'Server error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const targetVoucher = incomeVouchers.find(v => v.id === currentVoucherId || v.voucherNo === voucherNo);
    const idToDelete = currentVoucherId || targetVoucher?.id || voucherNo;
    if (!targetVoucher && !currentVoucherId) {
      showToast('No existing voucher loaded to delete. Load a voucher first.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete Income Voucher ${voucherNo}?`)) {
      if (onDeleteIncomeVoucher) {
        setIsDeleting(true);
        try {
          await onDeleteIncomeVoucher(idToDelete);
          showToast(`✓ Income Voucher ${voucherNo} deleted successfully!`, 'success');
          handleNew();
        } catch (err: any) {
          showToast(`❌ Failed to delete voucher: ${err?.message || 'Server error'}`, 'error');
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          backdropFilter: 'blur(3px)'
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '840px',
            maxWidth: '96vw',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            border: '2px solid #0048ba',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Title Bar - Frame 0535 */}
          <div
            style={{
              background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
              color: '#ffffff',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Income Voucher Entry</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span title="Alerts" style={{ cursor: 'pointer', fontSize: '13px' }}>🔔</span>
              <span title="Sound" style={{ cursor: 'pointer', fontSize: '13px' }}>🔊</span>
              <button
                onClick={onClose}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {toast && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
                color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #cbd5e1'
              }}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Form Content */}
          <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
            {/* Left Main Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Voucher Information Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                  Voucher Information
                </div>

                {/* Top Nav Arrows (Frame 0535) */}
                <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: '4px' }}>
                  {(['first', 'prev', 'next', 'last'] as const).map((direction, idx) => {
                    const arrowSymbols = ['|◀', '◀', '▶', '▶|'];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleNavigate(direction)}
                        title={`Navigate ${direction} voucher`}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '2px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        {arrowSymbols[idx]}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Voucher No :</label>
                  <input
                    type="text"
                    value={voucherNo}
                    readOnly
                    style={{
                      width: '200px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      color: '#0f172a'
                    }}
                  />

                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Date :</label>
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{
                      width: '140px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />

                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Name :</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Payer name (e.g. MADHU)"
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  />

                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', alignSelf: 'start' }}>Details :</label>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Optional details, receipt source or notes..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '12px',
                      backgroundColor: '#fef9c3', // Soft yellow note textarea
                      border: '1px solid #eab308',
                      borderRadius: '3px',
                      outline: 'none',
                      resize: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Other Details (Line Item Builder) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                  Other Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '8px', alignItems: 'center' }}>
                  <div style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Particulars :</label>
                    <select
                      value={particulars}
                      onChange={e => setParticulars(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px'
                      }}
                    >
                      {incomeParticulars.map(head => (
                        <option key={head} value={head}>
                          {head}
                        </option>
                      ))}
                    </select>

                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Amount :</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '160px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          color: '#0f172a'
                        }}
                      />
                      {!amount && (
                        <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '6px' }}>*</span>
                      )}
                    </div>

                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Notes :</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px'
                      }}
                    />
                  </div>

                  {/* Add To Grid & Remove Buttons - Frame 0535 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}
                    >
                      <span>➕</span>
                      <span>Add To Grid</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveItem}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🗑️</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid - Frame 0535 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #003366',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  minHeight: '140px',
                  maxHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.5fr 1fr 1.5fr',
                    backgroundColor: '#003366',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '6px 8px'
                  }}
                >
                  <div>#</div>
                  <div>Particulars</div>
                  <div style={{ textAlign: 'right' }}>Amount</div>
                  <div>Notes</div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {items.map((item, idx) => {
                    const isSelected = selectedItemIdx === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemIdx(idx)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1.5fr 1fr 1.5fr',
                          padding: '5px 8px',
                          fontSize: '12px',
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#fef08a' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          color: '#0f172a',
                          fontWeight: isSelected ? 'bold' : 500,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {isSelected && <span style={{ color: '#dc2626', fontSize: '10px' }}>▷</span>}
                          <span>{idx + 1}</span>
                        </div>
                        <div>{item.particulars}</div>
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>{item.amount.toFixed(2)}</div>
                        <div style={{ color: '#475569' }}>{item.notes}</div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      No income items in grid. Add items using "Add To Grid".
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Section (Bottom Right) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '16px',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Payment Mode :</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as 'Cash' | 'Bank')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px'
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>

                {paymentMode === 'Bank' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Bank A/c No :</label>
                    <input
                      type="text"
                      value={bankAcNo}
                      onChange={e => setBankAcNo(e.target.value)}
                      style={{
                        width: '120px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#003366' }}>Grand Total :</label>
                  <input
                    type="text"
                    value={grandTotal.toFixed(2)}
                    readOnly
                    style={{
                      width: '110px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      color: '#003366'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Action Sidebar - Frame 0535 */}
            <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleNew}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                New
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                style={{
                  padding: '9px 12px',
                  backgroundColor: isSaving ? '#6b7280' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isSaving || isDeleting ? 0.7 : 1
                }}
              >
                {isSaving ? '⏳ Saving...' : 'Save'}
              </button>

              <button
                onClick={handleUpdate}
                disabled={isSaving || isDeleting}
                style={{
                  padding: '9px 12px',
                  backgroundColor: isSaving ? '#6b7280' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isSaving || isDeleting ? 0.7 : 1
                }}
              >
                {isSaving ? '⏳ Updating...' : 'Update'}
              </button>

              <button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                style={{
                  padding: '9px 12px',
                  backgroundColor: isDeleting ? '#6b7280' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isSaving || isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? '⏳ Deleting...' : 'Delete'}
              </button>

              <button
                onClick={() => {
                  if (incomeVouchers.length > 0) {
                    const last = incomeVouchers[0] || incomeVouchers[incomeVouchers.length - 1];
                    loadVoucher(last);
                    showToast(`✓ Loaded voucher ${last.voucherNo}`, 'success');
                  } else {
                    showToast('No income vouchers recorded yet.', 'info');
                  }
                }}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Get Data
              </button>

              <button
                onClick={() => {
                  if (items.length > 0) {
                    setPrintedVoucher({
                      id: `temp-${Date.now()}`,
                      voucherNo,
                      date,
                      name,
                      details,
                      items,
                      paymentMode,
                      bankAcNo,
                      grandTotal
                    });
                    setIsPrintModalOpen(true);
                  } else {
                    showToast('No items to print.', 'info');
                  }
                }}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Income Voucher Receipt Modal */}
      {isPrintModalOpen && printedVoucher && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100010
          }}
          onClick={() => setIsPrintModalOpen(false)}
        >
          <div
            style={{
              width: '560px',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '2px solid #003366',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              fontFamily: 'Segoe UI, sans-serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #003366', paddingBottom: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#003366' }}>
                SHREE VINAYAKA FURNITURES
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginTop: '2px' }}>
                INCOME RECEIPT VOUCHER
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Auditing & Accounting Copy
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0', fontSize: '12px' }}>
              <div><strong>Voucher No:</strong> {printedVoucher.voucherNo}</div>
              <div style={{ textAlign: 'right' }}><strong>Date:</strong> {printedVoucher.date}</div>
              <div><strong>Received From:</strong> {printedVoucher.name}</div>
              <div style={{ textAlign: 'right' }}><strong>Mode:</strong> {printedVoucher.paymentMode} {printedVoucher.bankAcNo ? `(${printedVoucher.bankAcNo})` : ''}</div>
              {printedVoucher.details && (
                <div style={{ gridColumn: '1 / 3' }}><strong>Details:</strong> {printedVoucher.details}</div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', margin: '12px 0' }}>
              <thead>
                <tr style={{ backgroundColor: '#003366', color: '#ffffff' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Particulars</th>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Notes</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {printedVoucher.items.map((it, idx) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '6px' }}>{idx + 1}</td>
                    <td style={{ padding: '6px', fontWeight: 600 }}>{it.particulars}</td>
                    <td style={{ padding: '6px', color: '#475569' }}>{it.notes}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{it.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ padding: '8px', textAlign: 'right' }}>Grand Total :</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#16a34a', fontSize: '14px' }}>
                    ₹ {printedVoucher.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #94a3b8', fontSize: '11px', color: '#334155' }}>
              <div>
                <div style={{ width: '120px', borderTop: '1px solid #334155', marginBottom: '4px' }}></div>
                Payer's Signature
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '120px', borderTop: '1px solid #334155', marginBottom: '4px' }}></div>
                Received By
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: '120px', borderTop: '1px solid #334155', marginBottom: '4px' }}></div>
                Authorised Signatory
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Now
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
