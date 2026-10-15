import { useState } from 'react';
import type { PettyExpense } from '../../types/retailDaddy';

interface PettyExpensesViewProps {
  expenses: PettyExpense[];
  onAddExpense: (exp: PettyExpense) => void;
}

export function PettyExpensesView({ expenses, onAddExpense }: PettyExpensesViewProps) {
  const [category, setCategory] = useState('Refreshment');
  const [amount, setAmount] = useState<number>(0);
  const [paidTo, setPaidTo] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !paidTo.trim()) {
      alert('Please enter valid amount and recipient.');
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

    onAddExpense(newExp);
    setAmount(0);
    setPaidTo('');
    setRemarks('');
    alert(`✅ Expense voucher ${newExp.voucherNo} logged successfully!`);
  };

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rd-window">
      <div className="rd-window-header-green">
        <div className="rd-window-title">PETTY EXPENSES & CASH VOUCHERS (TUT 05)</div>
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
              className="rd-grid-btn"
              style={{ width: '100%', background: '#dc2626', color: '#fff', padding: '8px', fontWeight: 'bold' }}
            >
              Post Petty Cash Voucher
            </button>
          </form>
        </div>

        {/* Expenses List Table */}
        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Daily Expense Voucher Register:</span>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#dc2626' }}>
              Total Expenses: ₹ {totalExpense.toFixed(2)}
            </span>
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
              {expenses.map(exp => (
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
