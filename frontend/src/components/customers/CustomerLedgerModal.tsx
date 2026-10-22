import React, { useState, useEffect, useMemo } from 'react';
import type { Customer, CustomerLedgerEntry, CustomerReceiptEntry } from '../../types/retailDaddy';
import { api, sendGeneralEmail } from '../../api/client';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  customer?: Customer;
  customers?: Customer[];
  ledgerEntries?: CustomerLedgerEntry[];
  onClose: () => void;
  onSelectCustomer?: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onRecordPayment?: (receipt: CustomerReceiptEntry, ledgerEntry: CustomerLedgerEntry) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  customer,
  customers = [],
  ledgerEntries = [],
  onClose,
  onSelectCustomer,
  onUpdateCustomer,
  onRecordPayment
}) => {
  const defaultCust: Customer = {
    id: '1',
    name: 'Walk-in Cash Customer',
    phone: '9999999999',
    state: 'Kerala',
    city: 'Cheruvathur',
    balance: 0.0,
    loyaltyPoints: 50,
    loyaltyEnabled: true
  };

  const [activeCustomer, setActiveCustomer] = useState<Customer>(
    customer || (customers.length > 0 ? customers[0] : defaultCust)
  );

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');

  const [fromDate, setFromDate] = useState('2024-04-01');
  const [toDate, setToDate] = useState('2026-12-31');
  const [zoomFactor, setZoomFactor] = useState('100%');
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [backendEntries, setBackendEntries] = useState<CustomerLedgerEntry[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  const [targetEmail, setTargetEmail] = useState(activeCustomer.email || '');
  const [targetPhone, setTargetPhone] = useState(activeCustomer.phone || '');
  const [isSendingLedger, setIsSendingLedger] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Quick Balance Payment Collection Form State
  const [showCollectPaymentModal, setShowCollectPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentInvoiceRef, setPaymentInvoiceRef] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Update when customer prop changes
  useEffect(() => {
    if (customer && customer.id !== activeCustomer.id) {
      setActiveCustomer(customer);
      setTargetEmail(customer.email || '');
      setTargetPhone(customer.phone || '');
    }
  }, [customer]);

  const fetchLiveLedger = () => {
    if (!activeCustomer?.id) return;
    setIsLoadingBackend(true);

    api.getCustomerLedger(activeCustomer.id)
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped: CustomerLedgerEntry[] = res.map((r: any) => ({
            id: `api-ledg-${r.id || Date.now()}`,
            customerId: String(activeCustomer.id),
            date: r.date || new Date().toISOString().split('T')[0],
            voucherNo: r.voucher_no || `VCH-${r.id}`,
            particulars: r.particulars || 'Transaction',
            debit: Number(r.debit) || 0,
            credit: Number(r.credit) || 0,
            balance: Number(r.balance) || 0
          }));
          setBackendEntries(mapped);
        } else {
          setBackendEntries([]);
        }
      })
      .catch(() => {
        setBackendEntries([]);
      })
      .finally(() => {
        setIsLoadingBackend(false);
      });
  };

  // Fetch live backend ledger whenever activeCustomer changes
  useEffect(() => {
    if (isOpen && activeCustomer?.id) {
      fetchLiveLedger();
    }
  }, [isOpen, activeCustomer?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filter available customers for search dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 8);
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.id && String(c.id).toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [customers, customerSearchQuery]);

  // Combined ledger entries (matching activeCustomer by id, phone, or name)
  const combinedEntries = useMemo(() => {
    const custIdStr = String(activeCustomer.id || '');
    const custPhone = activeCustomer.phone || '';
    const custName = (activeCustomer.name || '').toLowerCase();

    // Check if entry belongs to activeCustomer
    const isCustomerMatch = (l: CustomerLedgerEntry) => {
      if (!l) return false;
      const lId = String(l.customerId || '');
      if (lId === custIdStr) return true;
      // Strip letters for e.g. "cust-2" vs "2"
      const num1 = custIdStr.replace(/\D/g, '');
      const num2 = lId.replace(/\D/g, '');
      if (num1 && num2 && num1 === num2) return true;
      if (custPhone && l.voucherNo && l.voucherNo.includes(custPhone)) return true;
      if (custName && l.remarks && l.remarks.toLowerCase().includes(custName)) return true;
      if (custName && typeof l.particulars === 'string' && l.particulars.toLowerCase().includes(custName)) return true;
      return false;
    };

    const localMatched = ledgerEntries.filter(isCustomerMatch);
    
    // Merge backend and local entries, avoiding duplicate vouchers
    const merged = [...backendEntries];
    localMatched.forEach(loc => {
      const exists = merged.some(m => m.voucherNo && loc.voucherNo && m.voucherNo === loc.voucherNo);
      if (!exists) {
        merged.push(loc);
      }
    });

    // If still empty and activeCustomer has balance, create an Opening Balance row
    if (merged.length === 0 && (activeCustomer.balance || 0) !== 0) {
      merged.push({
        id: `opening-${activeCustomer.id}`,
        customerId: String(activeCustomer.id),
        date: fromDate,
        voucherNo: 'OPENING-BAL',
        particulars: 'Opening Balance (Forward)',
        debit: activeCustomer.balance > 0 ? activeCustomer.balance : 0,
        credit: activeCustomer.balance < 0 ? Math.abs(activeCustomer.balance) : 0,
        balance: activeCustomer.balance
      });
    }

    // Filter by transaction search query
    let filtered = merged;
    if (transactionSearch.trim()) {
      const tq = transactionSearch.toLowerCase();
      filtered = filtered.filter(e =>
        (e.voucherNo && e.voucherNo.toLowerCase().includes(tq)) ||
        (e.particulars && e.particulars.toLowerCase().includes(tq)) ||
        (e.date && e.date.toLowerCase().includes(tq)) ||
        (e.debit && String(e.debit).includes(tq)) ||
        (e.credit && String(e.credit).includes(tq))
      );
    }

    return filtered;
  }, [activeCustomer, ledgerEntries, backendEntries, transactionSearch, fromDate]);

  const totalDebit = combinedEntries.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = combinedEntries.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const closingBalance = Math.abs(totalDebit - totalCredit);
  const balanceType = totalDebit >= totalCredit ? 'Dr' : 'Cr';

  const handleSelectCustomerItem = (cust: Customer) => {
    setActiveCustomer(cust);
    setTargetEmail(cust.email || '');
    setTargetPhone(cust.phone || '');
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
    if (onSelectCustomer) onSelectCustomer(cust);
    showToast(`✓ Switched to Customer: ${cust.name}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      showToast(`📄 Generating official PDF Statement for ${activeCustomer.name}...`);
      await api.downloadCustomerStatementPdf(activeCustomer.id, fromDate, toDate);
      showToast(`✓ PDF Statement downloaded for ${activeCustomer.name}`);
    } catch (err: any) {
      showToast(`PDF generation: ${err.message}. Opening browser print preview.`);
      window.print();
    }
  };

  const handleEmailStatement = async () => {
    const to = targetEmail.trim() || activeCustomer.email;
    if (!to) {
      showToast('Please enter a valid recipient email address.');
      return;
    }
    setIsSendingLedger(true);
    showToast(`Sending account ledger statement to ${to}...`);
    try {
      const summaryMsg = `Customer Account Ledger Statement\nCustomer: ${activeCustomer.name}\nPhone: ${activeCustomer.phone}\nCurrent Outstanding Balance: Rs. ${closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${balanceType}\nTotal Debits: Rs. ${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nTotal Credits / Payments: Rs. ${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nPeriod: ${fromDate} to ${toDate}\n\nShree Vinayaka Furnitures • Authorised Godrej Interio Showroom\nNH Bypass Road, Kozhikode, Kerala\nPhone: +91 94484 22354`;
      const res = await sendGeneralEmail({
        toEmail: to,
        subject: `Customer Account Statement - ${activeCustomer.name} - Shree Vinayaka Furnitures`,
        message: summaryMsg
      });
      if (res && res.success) {
        showToast(`✓ Account statement successfully emailed to ${to}!`);
      } else {
        showToast(`Email status: ${res?.message || 'Check Email Settings'}`);
      }
    } catch (err: any) {
      showToast(`Email failed: ${err.message}. Please configure Gmail App Password in Email Settings.`);
    } finally {
      setIsSendingLedger(false);
    }
  };

  const handleSendWhatsApp = (gateway: string) => {
    const phone = (targetPhone || activeCustomer.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Dear ${activeCustomer.name},\n\nGreetings from Shree Vinayaka Furnitures (Godrej Interio).\nYour Khata Account Statement as of ${toDate}:\n\n` +
      `• Total Debits / Purchases: ₹${totalDebit.toFixed(2)}\n` +
      `• Total Payments Received: ₹${totalCredit.toFixed(2)}\n` +
      `• Current Outstanding Balance: ₹${closingBalance.toFixed(2)} ${balanceType}\n\n` +
      `For queries or UPI payments, reply to this message or contact us at +91 94484 22354.\nThank you for choosing Shree Vinayaka Furnitures!`
    );
    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
    showToast(`📱 Dispatched statement via WhatsApp Gateway [${gateway}] to ${phone || 'Customer'}`);
  };

  const handleOpenCollectPayment = () => {
    setPaymentAmount(closingBalance > 0 ? String(closingBalance.toFixed(2)) : '');
    setPaymentMode('Cash');
    setPaymentUtr('');
    setPaymentInvoiceRef('');
    setShowCollectPaymentModal(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      showToast('⚠️ Please enter a valid positive payment amount');
      return;
    }
    if (paymentMode === 'UPI' && !paymentUtr.trim()) {
      showToast('⚠️ 12-digit UPI UTR reference number is required');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const voucherNo = paymentMode === 'UPI' ? `UPI-${paymentUtr.trim()}` : `RCPT-${Date.now().toString().slice(-6)}`;
      const dateStr = new Date().toISOString().split('T')[0];
      const particulars = paymentInvoiceRef.trim()
        ? `Balance Payment (${paymentMode}) against Inv #${paymentInvoiceRef.trim()}`
        : `Customer Balance Receipt (${paymentMode})`;

      const res = await api.addCustomerLedger(activeCustomer.id, {
        date: dateStr,
        voucher_no: voucherNo,
        particulars,
        debit: 0.0,
        credit: amt,
        ref_no: paymentInvoiceRef.trim() || undefined
      });

      const updatedBal = res && typeof res.balance === 'number'
        ? res.balance
        : Math.max(0, (activeCustomer.balance || 0) - amt);
      const updatedCustomerObj = { ...activeCustomer, balance: updatedBal };
      setActiveCustomer(updatedCustomerObj);
      if (onUpdateCustomer) {
        onUpdateCustomer(updatedCustomerObj);
      }

      if (onRecordPayment) {
        const paymentModeMapped = paymentMode === 'UPI' ? 'By UPI' : (paymentMode === 'Bank' ? 'By Bank Transfer' : 'By Cash');
        const newReceipt: CustomerReceiptEntry = {
          id: 'rcpt-' + Date.now(),
          transactionNo: voucherNo,
          transactionDate: dateStr,
          customerId: String(activeCustomer.id),
          customerName: activeCustomer.name,
          paymentMode: paymentModeMapped as any,
          amount: amt,
          remarks: paymentInvoiceRef.trim()
            ? `Against Inv #${paymentInvoiceRef.trim()}`
            : (paymentUtr.trim() ? `UTR: ${paymentUtr.trim()}` : 'Customer Balance Payment')
        };
        const newLedger: CustomerLedgerEntry = {
          id: 'ledg-' + Date.now(),
          customerId: String(activeCustomer.id),
          date: dateStr,
          voucherNo: voucherNo,
          particulars: particulars,
          debit: 0.0,
          credit: amt,
          balance: updatedBal
        };
        onRecordPayment(newReceipt, newLedger);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('svf-invoice-settled', {
            detail: {
              customerId: activeCustomer.id,
              customerName: activeCustomer.name,
              amount: amt,
              updatedBalance: updatedBal,
              invoiceRef: paymentInvoiceRef.trim() || undefined
            }
          })
        );
      }

      setShowCollectPaymentModal(false);
      showToast(`✓ Payment of ₹${amt.toLocaleString('en-IN')} recorded! Customer balance dropped to ₹${updatedBal.toFixed(2)} and invoice updated to PAID.`);
      fetchLiveLedger();
    } catch (err: any) {
      showToast(`Payment error: ${err.message || 'Failed to record payment'}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(3px)'
      }}
    >
      {/* Customer Account Statement Print Preview Window */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: isMaximized ? '100vw' : '1080px',
          maxWidth: isMaximized ? '100vw' : '96vw',
          height: isMaximized ? '100vh' : '92vh',
          maxHeight: isMaximized ? '100vh' : '880px',
          backgroundColor: '#475569',
          border: isMaximized ? 'none' : '2px solid #1e3a8a',
          borderRadius: isMaximized ? '0px' : '6px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px',
          overflow: 'hidden'
        }}
      >
        {/* Top Window Bar */}
        <div className="bg-[#1e3a8a] text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs select-none">
          <div className="flex items-center gap-2">
            <span>📑</span>
            <span>Customer Ledger (Khata) & Statement — Crystal Reports</span>
            {isLoadingBackend && (
              <span className="text-[10px] bg-blue-700 text-blue-200 px-2 py-0.5 rounded animate-pulse">
                Syncing PostgreSQL...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              title="Minimize window"
              className="w-5 h-5 bg-gray-200 hover:bg-gray-300 text-black text-[10px] flex items-center justify-center rounded cursor-pointer font-bold"
            >
              _
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? 'Restore window size' : 'Maximize window'}
              className="w-5 h-5 bg-gray-200 hover:bg-gray-300 text-black text-[10px] flex items-center justify-center rounded cursor-pointer font-bold"
            >
              □
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close window"
              className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white text-[10px] flex items-center justify-center rounded font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Alert */}
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

        {/* Crystal Reports Toolbar with Customer Search Bar */}
        <div className="bg-[#f1f5f9] border-b border-gray-300 px-3 py-1.5 flex flex-wrap items-center gap-3 text-gray-800 text-xs">
          {/* Fast Customer Switcher / Search Input */}
          <div className="relative flex items-center gap-1.5">
            <span className="font-bold text-slate-800 text-[11px]">👤 Customer:</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Customer (Name, Phone, ID)..."
                value={customerSearchQuery}
                onFocus={() => setShowCustomerDropdown(true)}
                onChange={e => {
                  setCustomerSearchQuery(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                className="w-64 bg-white border border-gray-400 px-2 py-1 rounded text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {showCustomerDropdown && (
                <div
                  className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-400 shadow-2xl rounded z-50 max-h-60 overflow-y-auto"
                >
                  <div className="p-1.5 bg-slate-100 text-[10px] font-bold text-slate-600 flex justify-between border-b">
                    <span>Select Customer ({filteredCustomers.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomerDropdown(false)}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomerItem(c)}
                      className="p-2 border-b border-slate-100 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.phone || 'No Phone'} • {c.city || 'Kerala'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            (c.balance || 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          ₹{Math.abs(c.balance || 0).toFixed(2)} {(c.balance || 0) >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-3 text-center text-slate-500 italic text-xs">
                      No matching customers found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-gray-400" />

          {/* In-Ledger Transaction Search Bar */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 text-[11px]">🔍 Find Voucher:</span>
            <input
              type="text"
              placeholder="Search Voucher No, Remarks..."
              value={transactionSearch}
              onChange={e => setTransactionSearch(e.target.value)}
              className="w-48 bg-white border border-gray-400 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {transactionSearch && (
              <button
                type="button"
                onClick={() => setTransactionSearch('')}
                className="text-xs text-slate-600 hover:text-black font-bold"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-400" />

          {/* Action Icons */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-2 py-1 bg-white hover:bg-blue-50 border border-gray-300 rounded font-semibold text-slate-800 flex items-center gap-1 cursor-pointer"
            title="Print Statement (Ctrl+P / F6)"
          >
            🖨️ Print
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-2 py-1 bg-white hover:bg-red-50 border border-gray-300 rounded font-semibold text-red-800 flex items-center gap-1 cursor-pointer"
            title="Export Statement to PDF (F7)"
          >
            📄 PDF
          </button>
          <button
            type="button"
            onClick={handleOpenCollectPayment}
            className="px-2.5 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white rounded font-bold flex items-center gap-1 cursor-pointer text-xs shadow-sm"
            title="Collect customer balance payment and update linked invoice to PAID"
          >
            💵 Collect Payment
          </button>

          <div className="h-4 w-[1px] bg-gray-400" />

          {/* Zoom Factor */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 py-1 bg-white border border-gray-300 rounded flex items-center gap-1 font-semibold"
            >
              <span>🔍 {zoomFactor}</span>
              <span>▾</span>
            </button>
            {showZoomMenu && (
              <div className="absolute left-0 top-full mt-1 w-28 bg-white border border-gray-400 shadow-xl rounded z-50 py-1">
                {['Page Width', 'Whole Page', '200%', '150%', '100%', '75%', '50%'].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZoomFactor(z.includes('%') ? z : '100%');
                      setShowZoomMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white text-xs"
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workspace: Left Action Sidebar + Center Crystal Reports Sheet */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Action Sidebar */}
          <div className="w-[210px] bg-[#e2e8f0] border-r border-gray-400 p-2.5 flex flex-col gap-2 overflow-y-auto select-none">
            {/* Date Range Period Filters */}
            <div className="flex flex-col gap-1.5 border border-gray-300 bg-white p-2 rounded text-[11px]">
              <span className="font-bold text-gray-800">Statement Period:</span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-700 font-bold">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-32 bg-white border border-gray-400 px-1 py-0.5 rounded text-[10px] font-mono font-bold text-slate-900"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-700 font-bold">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-32 bg-white border border-gray-400 px-1 py-0.5 rounded text-[10px] font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Collect Balance Payment Button */}
            <button
              type="button"
              onClick={handleOpenCollectPayment}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white p-2 rounded flex flex-col items-center justify-center gap-0.5 shadow-sm font-bold cursor-pointer"
              title="Record Balance Payment against open invoices"
            >
              <span className="text-lg">💵</span>
              <span className="text-xs">Collect Payment</span>
            </button>

            {/* Print F6 Blue Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white p-2 rounded flex flex-col items-center justify-center gap-0.5 shadow-sm font-bold cursor-pointer"
            >
              <span className="text-lg">🖨️</span>
              <span className="text-xs">Print F6 (Hardcopy)</span>
            </button>

            {/* PDF F7 Red Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white p-2 rounded flex flex-col items-center justify-center gap-0.5 shadow-sm font-bold cursor-pointer"
            >
              <span className="text-lg">📄</span>
              <span className="text-xs">PDF Statement F7</span>
            </button>

            {/* Email F8 Orange Button */}
            <div className="flex flex-col gap-1 border-t border-gray-300 pt-2">
              <span className="text-[10px] font-bold text-gray-700">Recipient Email ID:</span>
              <input
                type="email"
                value={targetEmail}
                placeholder="customer@gmail.com"
                onChange={e => setTargetEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 px-1.5 py-1 text-xs rounded text-slate-900 font-medium"
              />
              <button
                type="button"
                disabled={isSendingLedger}
                onClick={handleEmailStatement}
                className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white py-1.5 rounded font-bold text-xs shadow flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <span>✉️</span>
                <span>{isSendingLedger ? 'Sending...' : 'Send Email F8'}</span>
              </button>
            </div>

            {/* WhatsApp Gateways */}
            <div className="flex flex-col gap-1.5 border-t border-gray-300 pt-2">
              <span className="text-[10px] font-bold text-gray-700">WhatsApp Mobile No:</span>
              <input
                type="text"
                value={targetPhone}
                onChange={e => setTargetPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 px-1.5 py-1 text-xs rounded font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-700 font-bold">1-Click WhatsApp Share:</span>
              <button
                type="button"
                onClick={() => handleSendWhatsApp('Tejas')}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-1.5 rounded font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>💬</span>
                <span>WhatsApp Tejas</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp('Rocket')}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white py-1.5 rounded font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🚀</span>
                <span>WhatsApp Rocket</span>
              </button>
            </div>
          </div>

          {/* Center Document Sheet */}
          <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-[#525252]">
            <div
              style={{ width: '740px', minHeight: '800px' }}
              className="bg-white text-black p-8 shadow-2xl flex flex-col justify-between text-xs rounded-xs"
            >
              <div>
                {/* Document Header */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-black text-[#1e3a8a] tracking-wide uppercase">
                    Shree Vinayaka Furnitures
                  </h1>
                  <p className="text-xs text-slate-700 font-bold">
                    Authorised Godrej Interio Showroom • NH Bypass Road, Kozhikode, Kerala
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 underline">
                    Customer Account Ledger & Khata Statement
                  </p>
                  <p className="text-[10px] text-gray-600 font-semibold mt-0.5">
                    Statement Period: {fromDate} To {toDate}
                  </p>
                </div>

                {/* Customer Details Box */}
                <div
                  style={{ backgroundColor: '#f8fafc' }}
                  className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-gray-300 p-3 rounded mb-4 text-[11px]"
                >
                  <div>
                    <span className="font-bold text-gray-700">Customer ID:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{activeCustomer.id}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Contact No:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{activeCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Customer Name:</span>{' '}
                    <span className="font-bold text-blue-900 text-sm">{activeCustomer.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">City / State:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {activeCustomer.city || 'Kozhikode'}, {activeCustomer.state || 'Kerala'}
                    </span>
                  </div>
                  {activeCustomer.gstin && (
                    <div className="col-span-2">
                      <span className="font-bold text-gray-700">GSTIN / UIN:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{activeCustomer.gstin}</span>
                    </div>
                  )}
                  <div className="col-span-2 pt-1 border-t border-gray-200 mt-1 flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Closing Ledger Balance:</span>
                    <span className="font-black text-red-600 text-sm font-mono">
                      ₹{closingBalance.toFixed(2)} {balanceType}
                    </span>
                  </div>
                </div>

                {/* Statement Table */}
                <table className="w-full text-left border-collapse border border-gray-300 text-[11px]">
                  <thead className="bg-[#f1f5f9] font-bold border-b-2 border-gray-400 text-slate-800">
                    <tr>
                      <th className="py-1 px-2 border-r border-gray-300">Date</th>
                      <th className="py-1 px-2 border-r border-gray-300">Voucher / Bill No</th>
                      <th className="py-1 px-2 border-r border-gray-300">Particulars / Details</th>
                      <th className="py-1 px-2 border-r border-gray-300 text-right text-red-700">Debit (₹)</th>
                      <th className="py-1 px-2 text-right text-green-700">Credit / Paid (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedEntries.map((e, idx) => (
                      <tr key={e.id || idx} className="border-b border-gray-200 hover:bg-yellow-50">
                        <td className="py-1 px-2 border-r border-gray-200 font-mono text-[10px] text-slate-800">
                          {e.date}
                        </td>
                        <td className="py-1 px-2 border-r border-gray-200 font-mono text-[10px] font-bold text-blue-900">
                          {e.voucherNo}
                        </td>
                        <td className="py-1 px-2 border-r border-gray-200 text-slate-900 font-medium">
                          {e.particulars}
                        </td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right font-mono font-bold text-red-700">
                          {e.debit > 0 ? e.debit.toFixed(2) : '-'}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-emerald-700">
                          {e.credit > 0 ? e.credit.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                    {combinedEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-600 font-medium italic">
                          No ledger records found for this period. Use customer search to view another account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Running Totals & Closing Balance */}
              <div className="border-t-2 border-gray-800 pt-3 mt-4">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                  <span>Period Totals:</span>
                  <div className="flex gap-8 font-mono">
                    <span className="text-red-700">Total Debits: ₹{totalDebit.toFixed(2)}</span>
                    <span className="text-emerald-700">Total Credits: ₹{totalCredit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-black border-t border-gray-300 pt-1.5">
                  <span className="text-gray-900">Net Closing Balance:</span>
                  <span className="text-red-600 font-mono text-base tracking-wide">
                    ₹{closingBalance.toFixed(2)} {balanceType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Window Footer */}
        <div className="bg-[#1e293b] text-slate-200 font-medium px-3 py-1 flex items-center justify-between text-[11px] select-none">
          <span>
            Current Customer: <b>{activeCustomer.name}</b> (Total Transactions: {combinedEntries.length})
          </span>
          <span>Zoom: {zoomFactor} | Multi-Gateway Ready</span>
        </div>

        {/* Quick Collect Payment Dialog */}
        {showCollectPaymentModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => !isSubmittingPayment && setShowCollectPaymentModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-3.5 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>💵</span> Record Customer Payment
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Settle outstanding khata balance & update linked invoice status
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCollectPaymentModal(false)}
                  disabled={isSubmittingPayment}
                  className="text-white/80 hover:text-white text-xl leading-none px-2 py-1 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-slate-600 block text-[11px]">Customer Account</span>
                    <strong className="text-slate-900 text-sm font-semibold">{activeCustomer.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 block text-[11px]">Current Outstanding</span>
                    <strong className="text-red-700 text-sm font-mono font-bold">
                      ₹{closingBalance.toFixed(2)} {balanceType}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Receipt Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    required
                    placeholder="Enter amount received"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="Cash">Cash (Counter)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">NEFT / RTGS</option>
                      <option value="Card">Debit / Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Linked Invoice # <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentInvoiceRef}
                      onChange={e => setPaymentInvoiceRef(e.target.value)}
                      placeholder="e.g. INV-2024-001"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {paymentMode === 'UPI' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      UPI 12-Digit UTR Reference <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={paymentUtr}
                      onChange={e => setPaymentUtr(e.target.value)}
                      required
                      placeholder="e.g. 412890123456"
                      className="w-full border border-amber-300 bg-amber-50 rounded px-3 py-1.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-amber-700 mt-0.5 block">
                      Required for automated Bank UTR reconciliation.
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCollectPaymentModal(false)}
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    id="record-ledger-payment-btn"
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded shadow flex items-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <span className="animate-spin text-sm">⏳</span> Saving...
                      </>
                    ) : (
                      <>
                        <span>✓</span> Settle & Update Ledger
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
