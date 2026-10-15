import React, { useState } from 'react';
import type { Customer } from '../../../types/pos';

export type VoucherType = 'customer-receipt' | 'supplier-payment' | 'expense' | 'income';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  voucherType: VoucherType;
  customers: Customer[];
  onRecordVoucher: (title: string, amount: number, mode: string) => void;
}

export const CashVoucherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  voucherType,
  customers,
  onRecordVoucher
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[1]?.id || customers[0]?.id || '');
  const [supplierName, setSupplierName] = useState('Mysore Teak Timber Mills Pvt Ltd');
  const [supplierDue] = useState(30000);
  const [expenseHead, setExpenseHead] = useState('Showroom Tea & Refreshments');
  const [incomeHead, setIncomeHead] = useState('Teak Scrap & Sawdust Sales');
  const [amount, setAmount] = useState('500');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('Payment against pending balance');
  const [printedSlip, setPrintedSlip] = useState(false);

  if (!isOpen) return null;

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const getTitle = () => {
    switch (voucherType) {
      case 'customer-receipt': return '🧾 Customer Payment Receipt (Debt Repayment)';
      case 'supplier-payment': return '💳 Supplier Payment Voucher (To Timber Mills)';
      case 'expense': return '💵 Daily Petty Cash Expense Voucher';
      case 'income': return '💰 Miscellaneous Income Cash Voucher';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return;

    let title = '';
    if (voucherType === 'customer-receipt') title = `Receipt: ${currentCustomer.name}`;
    else if (voucherType === 'supplier-payment') title = `Supplier: ${supplierName}`;
    else if (voucherType === 'expense') title = `Expense: ${expenseHead}`;
    else if (voucherType === 'income') title = `Income: ${incomeHead}`;

    onRecordVoucher(title, amt, paymentMode);
    setPrintedSlip(true);
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '540px' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>{getTitle()}</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {printedSlip ? (
            <div style={{ background: '#fff', border: '1.5px dashed #000', padding: '16px', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>SHREE VINAYAKA FURNITURES</div>
                <div style={{ fontSize: '10px' }}>PAYMENT ACKNOWLEDGEMENT VOUCHER</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Voucher #{Date.now().toString().slice(-6)} • {new Date().toLocaleDateString('en-IN')}</div>
              </div>

              <div style={{ fontSize: '11px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {voucherType === 'customer-receipt' && (
                  <>
                    <div>Received From: <strong>{currentCustomer.name}</strong> ({currentCustomer.code})</div>
                    <div>Previous Outstanding Debt: ₹ {currentCustomer.currentBalance}</div>
                    <div>Amount Received: <strong style={{ color: '#16a34a' }}>₹ {parseFloat(amount).toFixed(2)}</strong></div>
                    <div>New Outstanding Balance: <strong>₹ {Math.max(0, currentCustomer.currentBalance - (parseFloat(amount) || 0)).toFixed(2)}</strong></div>
                  </>
                )}
                {voucherType === 'supplier-payment' && (
                  <>
                    <div>Paid To: <strong>{supplierName}</strong></div>
                    <div>Prior Outstanding: ₹ {supplierDue}</div>
                    <div>Amount Paid: <strong style={{ color: '#16a34a' }}>₹ {parseFloat(amount).toFixed(2)}</strong></div>
                    <div>Remaining Balance: <strong>₹ {Math.max(0, supplierDue - (parseFloat(amount) || 0)).toFixed(2)}</strong></div>
                  </>
                )}
                {(voucherType === 'expense' || voucherType === 'income') && (
                  <>
                    <div>Particulars: <strong>{voucherType === 'expense' ? expenseHead : incomeHead}</strong></div>
                    <div>Amount: <strong style={{ color: '#16a34a' }}>₹ {parseFloat(amount).toFixed(2)}</strong></div>
                    <div>Payment Method: <strong>{paymentMode}</strong></div>
                  </>
                )}
                <div>Narration: {remarks}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '10px', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                <div>Cashier Signature</div>
                <div>Authorized Signatory</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button className="rd-classic-btn" onClick={() => window.print()}>🖨️ Print Slip</button>
                <button className="rd-classic-btn" style={{ background: '#16a34a', color: '#fff' }} onClick={onClose}>Done</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {voucherType === 'customer-receipt' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Select Credit Customer:</label>
                    <select 
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.contactNo}) - Current Balance: ₹{c.currentBalance} {c.balanceType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '4px', border: '1px solid #a7f3d0', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Outstanding Debt:</span>
                    <strong style={{ color: '#047857', fontSize: '13px' }}>₹ {currentCustomer.currentBalance.toFixed(2)}</strong>
                  </div>
                </>
              )}

              {voucherType === 'supplier-payment' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Select Timber / Hardware Supplier:</label>
                    <input 
                      type="text" 
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
                    />
                  </div>

                  <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '4px', border: '1px solid #a7f3d0', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Accounts Payable (Supplier Debt):</span>
                    <strong style={{ color: '#047857', fontSize: '13px' }}>₹ {supplierDue.toFixed(2)}</strong>
                  </div>
                </>
              )}

              {voucherType === 'expense' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Expense Category / Head:</label>
                  <select 
                    value={expenseHead}
                    onChange={e => setExpenseHead(e.target.value)}
                    style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
                  >
                    <option>Showroom Tea & Refreshments</option>
                    <option>Loading & Unloading Labour</option>
                    <option>Showroom Electricity Bill</option>
                    <option>Vehicle Delivery Petrol / Diesel</option>
                    <option>Shop Stationery & Printing Paper</option>
                    <option>Carpentry Polish & Sandpaper</option>
                  </select>
                </div>
              )}

              {voucherType === 'income' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Income Head:</label>
                  <select 
                    value={incomeHead}
                    onChange={e => setIncomeHead(e.target.value)}
                    style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
                  >
                    <option>Teak Scrap & Sawdust Sales</option>
                    <option>Packing Wood Box Resale</option>
                    <option>Mandir Delivery Assembly Tips</option>
                    <option>Miscellaneous Income</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Amount (₹): *</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="rd-input-yellow"
                    style={{ width: '100%', padding: '6px', fontSize: '14px', fontWeight: 800, marginTop: '3px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Payment Mode:</label>
                  <select 
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
                  >
                    <option value="Cash">Cash (Cash in Hand)</option>
                    <option value="UPI">UPI / GooglePay / PhonePe</option>
                    <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Remarks / Narration:</label>
                <input 
                  type="text" 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  style={{ width: '100%', padding: '5px', fontSize: '11px', border: '1px solid #94a3b8', marginTop: '3px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="rd-classic-btn" onClick={onClose}>Cancel</button>
                <button 
                  type="submit" 
                  className="rd-classic-btn" 
                  style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                >
                  Save & Print Voucher
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
