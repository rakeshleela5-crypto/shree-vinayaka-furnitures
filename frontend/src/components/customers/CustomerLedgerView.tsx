import { useState } from 'react';
import type { Customer } from '../../types/retailDaddy';

interface CustomerLedgerViewProps {
  customers: Customer[];
  onCollectPayment: (customerId: string, amount: number) => void;
}

export function CustomerLedgerView({ customers, onCollectPayment }: CustomerLedgerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK'>('CASH');
  const [receiptVoucher, setReceiptVoucher] = useState<any>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleSettleDebt = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.balance);
  };

  const processCollection = () => {
    if (!selectedCustomer || paymentAmount <= 0) return;
    onCollectPayment(selectedCustomer.id, paymentAmount);

    const voucher = {
      voucherNo: `RCT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US'),
      customer: selectedCustomer,
      amount: paymentAmount,
      mode: paymentMode,
      prevBalance: selectedCustomer.balance,
      newBalance: Math.max(0, selectedCustomer.balance - paymentAmount)
    };
    setReceiptVoucher(voucher);
    setSelectedCustomer(null);
  };

  return (
    <div className="rd-window">
      <div className="rd-window-header-green">
        <div className="rd-window-title">CUSTOMER OUTSTANDING ANALYSIS & COLLECTION (TUT 07)</div>
      </div>

      <div className="rd-filter-bar">
        <div className="rd-filter-left">
          <input
            type="text"
            className="rd-filter-input"
            style={{ width: '280px', background: '#fef08a', fontWeight: 'bold' }}
            placeholder="Search Customer by Name, Mobile..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="rd-filter-right">
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c' }}>
            Total Outstanding Receivables: ₹ {customers.reduce((s, c) => s + c.balance, 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '40px' }}>#</th>
              <th className="th-green">Customer Name</th>
              <th className="th-green" style={{ width: '130px' }}>Mobile Number</th>
              <th className="th-green" style={{ width: '110px' }}>State / Region</th>
              <th className="th-green" style={{ width: '100px', textAlign: 'right' }}>Loyalty Pts</th>
              <th className="th-red" style={{ width: '130px', textAlign: 'right' }}>Outstanding Balance</th>
              <th className="th-green" style={{ width: '140px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cust, idx) => (
              <tr key={cust.id}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ fontWeight: 'bold' }}>{cust.name}</td>
                <td>{cust.phone}</td>
                <td>{cust.state}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#7c3aed' }}>
                  {cust.loyaltyPoints}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '900', color: cust.balance > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹ {cust.balance.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {cust.balance > 0 ? (
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold' }}
                      onClick={() => handleSettleDebt(cust)}
                    >
                      💳 Collect Payment
                    </button>
                  ) : (
                    <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>
                      ✔ Settled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYMENT COLLECTION MODAL */}
      {selectedCustomer && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '380px' }}>
            <div className="rd-dialog-titlebar">
              <span>Customer Debt Collection Voucher</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setSelectedCustomer(null)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body">
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{selectedCustomer.name}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Ph: {selectedCustomer.phone}</div>
                <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                  Total Due: ₹{selectedCustomer.balance.toFixed(2)}
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                Collection Amount (₹) :
              </label>
              <input
                type="number"
                step="0.01"
                className="rd-pos-input"
                style={{ width: '100%', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', background: '#fef08a' }}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value) || 0)}
              />

              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                Payment Method :
              </label>
              <select
                className="rd-pos-input"
                style={{ width: '100%', marginBottom: '16px' }}
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as any)}
              >
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK">Bank Transfer / NEFT</option>
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="rd-grid-btn" onClick={() => setSelectedCustomer(null)}>
                  Cancel
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold' }}
                  onClick={processCollection}
                >
                  Generate Receipt Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT SLIP POPUP */}
      {receiptVoucher && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '320px' }}>
            <div className="rd-dialog-titlebar">
              <span>Payment Receipt Voucher</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setReceiptVoucher(null)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ fontFamily: 'monospace', fontSize: '11px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>SHREE VINAYAKA FURNITURES</div>
              <div>DEBT COLLECTION RECEIPT</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'left' }}>
                <div>Voucher No: {receiptVoucher.voucherNo}</div>
                <div>Date: {receiptVoucher.date}</div>
                <div>Customer: {receiptVoucher.customer.name}</div>
                <div>Paid Amount: ₹ {receiptVoucher.amount.toFixed(2)}</div>
                <div>Mode: {receiptVoucher.mode}</div>
                <div>Remaining Balance: ₹ {receiptVoucher.newBalance.toFixed(2)}</div>
              </div>
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ marginTop: '8px' }}>Authorized Signature: _________________</div>
              <button
                className="rd-grid-btn"
                style={{ marginTop: '12px', background: '#16a34a', color: '#fff', width: '100%' }}
                onClick={() => {
                  window.print();
                  setReceiptVoucher(null);
                }}
              >
                🖨️ Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
