import { useState } from 'react';
import type { PettyExpense } from '../../types/retailDaddy';
import { exportToExcel, exportToJson, exportToCsv } from '../../utils/csvImporter';

interface PettyExpensesViewProps {
  expenses: PettyExpense[];
  onAddExpense: (exp: PettyExpense) => Promise<void> | void;
  onClose?: () => void;
}

export function PettyExpensesView({ expenses, onAddExpense, onClose }: PettyExpensesViewProps) {
  const [category, setCategory] = useState('Refreshment');
  const [amount, setAmount] = useState<number>(0);
  const [paidTo, setPaidTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !paidTo.trim()) {
      showToast('⚠️ Please enter valid amount and recipient.');
      return;
    }

    const newExp: PettyExpense = {
      id: `exp-${Date.now()}`,
      voucherNo: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      category,
      amount,
      paidTo: paidTo.trim(),
      remarks: remarks.trim()
    };

    setIsSaving(true);
    try {
      await onAddExpense(newExp);
      setAmount(0);
      setPaidTo('');
      setRemarks('');
      showToast(`✅ Expense voucher ${newExp.voucherNo} logged successfully!`);
    } catch (err: any) {
      showToast(`❌ Failed to save expense voucher: ${err.message || 'Error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rd-window">
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '40px',
            right: '20px',
            backgroundColor: '#0f766e',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '13px',
            zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {toastMsg}
        </div>
      )}
      <div className="rd-window-header-green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="rd-window-title">PETTY EXPENSES & CASH VOUCHERS (TUT 05)</div>
        {onClose && (
          <button
            type="button"
            className="rd-btn-header"
            onClick={onClose}
            title="Close Petty Expenses and return to Desktop [Esc]"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: '1px solid #b91c1c',
              padding: '4px 12px',
              borderRadius: '4px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>✕</span> EXIT [Esc]
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Expense Entry Form */}
        <div style={{ width: '360px', background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '16px' }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Expense Category :
            </label>
            <select
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="Refreshment">Refreshment / Tea / Snacks</option>
              <option value="Fuel">Vehicle Fuel / Diesel</option>
              <option value="Freight">Freight & Transport Charges</option>
              <option value="Stationery">Printing Paper / Thermal Rolls</option>
              <option value="Electricity">Electricity & Utilities</option>
              <option value="Labour">Labour / Loading / Unloading</option>
            </select>

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Amount (₹) :
            </label>
            <input
              type="number"
              step="0.01"
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px', background: '#fef08a', fontWeight: 'bold' }}
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0.00"
              required
            />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Paid To (Recipient) :
            </label>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={paidTo}
              onChange={e => setPaidTo(e.target.value)}
              placeholder="e.g. Tea Stall, Petrol Pump"
              required
            />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Remarks / Purpose :
            </label>
            <textarea
              className="rd-pos-input"
              style={{ width: '100%', height: '60px', marginBottom: '16px' }}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional notes..."
            />

            <button
              type="submit"
              disabled={isSaving}
              className="rd-grid-btn"
              style={{
                width: '100%',
                background: isSaving ? '#991b1b' : '#dc2626',
                color: '#fff',
                padding: '8px',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? '⏳ Posting Voucher...' : 'Post Petty Cash Voucher'}
            </button>
          </form>
        </div>

        {/* Expenses List Table */}
        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Register:</span>
              <input
                type="text"
                placeholder="🔍 Search Voucher, Category, Recipient, or Remarks..."
                className="rd-pos-input"
                style={{ flex: 1, maxWidth: '340px', padding: '4px 8px', fontSize: '11px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#059669', color: '#fff', fontSize: '11px', padding: '4px 8px' }}
                title="Download as Excel .xlsx"
                onClick={() => {
                  const headers = ['Voucher No', 'Date', 'Category', 'Amount', 'Paid To', 'Remarks'];
                  const rows = expenses.map(e => [e.voucherNo, e.date, e.category, e.amount, e.paidTo, e.remarks || '']);
                  exportToExcel(`Petty_Expenses_${new Date().toISOString().slice(0, 10)}`, headers, rows, 'PettyExpenses');
                  showToast('📊 Exported expenses to Excel (.xlsx)!');
                }}
              >
                📊 Excel (.xlsx)
              </button>

              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#475569', color: '#fff', fontSize: '11px', padding: '4px 8px' }}
                title="Download as JSON .json"
                onClick={() => {
                  exportToJson(`Petty_Expenses_${new Date().toISOString().slice(0, 10)}`, expenses);
                  showToast('📋 Exported expenses to JSON (.json)!');
                }}
              >
                📋 JSON (.json)
              </button>

              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#2563eb', color: '#fff', fontSize: '11px', padding: '4px 8px' }}
                title="Download as CSV .csv"
                onClick={() => {
                  const headers = ['Voucher No', 'Date', 'Category', 'Amount', 'Paid To', 'Remarks'];
                  const rows = expenses.map(e => [e.voucherNo, e.date, e.category, e.amount, e.paidTo, e.remarks || '']);
                  exportToCsv(`Petty_Expenses_${new Date().toISOString().slice(0, 10)}`, headers, rows);
                  showToast('📄 Exported expenses to CSV (.csv)!');
                }}
              >
                📄 CSV
              </button>

              <span style={{ fontSize: '13px', fontWeight: '900', color: '#dc2626', marginLeft: '6px' }}>
                Total: ₹ {totalExpense.toFixed(2)}
              </span>
            </div>
          </div>

          <table className="rd-data-table">
            <thead>
              <tr>
                <th className="th-green">Voucher No</th>
                <th className="th-green">Date</th>
                <th className="th-green">Category</th>
                <th className="th-red" style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th className="th-green">Paid To</th>
                <th className="th-green">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {expenses
                .filter(exp => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    exp.voucherNo.toLowerCase().includes(term) ||
                    exp.category.toLowerCase().includes(term) ||
                    exp.paidTo.toLowerCase().includes(term) ||
                    (exp.remarks && exp.remarks.toLowerCase().includes(term))
                  );
                })
                .map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 'bold' }}>{exp.voucherNo}</td>
                    <td>{exp.date}</td>
                    <td>{exp.category}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                      {exp.amount.toFixed(2)}
                    </td>
                    <td>{exp.paidTo}</td>
                    <td style={{ color: '#64748b' }}>{exp.remarks || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
