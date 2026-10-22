import React, { useState, useEffect } from 'react';
import type { Product, Customer } from '../../types/retailDaddy';
import { api } from '../../api/client';

export interface SalesInvoiceSummary {
  invoiceNo: string;
  invoiceDate: string;
  taxType: string;
  customerId: string;
  customerName: string;
  contactNo: string;
  city: string;
  state: string;
  gstin: string;
  salesmanId: string;
  salesman: string;
  totalAmt: number;
  items: {
    productCode: string;
    productName: string;
    hsnCode: string;
    barcode: string;
    qtySold: number;
    price: number;
    discountPercent: number;
    cgst: number;
    sgst: number;
    total: number;
  }[];
}

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onProcessReturn: (returnDetails: {
    returnNo: string;
    invoiceNo: string;
    customerName: string;
    items: {
      productCode: string;
      productName: string;
      qtyReturned: number;
      price: number;
      total: number;
    }[];
    totalRefund: number;
    paymentMode: 'Cash' | 'Bank' | 'Credit';
  }) => void;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products,
  customers: _customers,
  onProcessReturn
}) => {
  // Sales invoices state loaded live from Railway PostgreSQL
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceSummary[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getSalesInvoices(0, 100)
        .then((liveInvoices: any[]) => {
          if (Array.isArray(liveInvoices) && liveInvoices.length > 0) {
            const mapped: SalesInvoiceSummary[] = liveInvoices.map((inv: any) => ({
              invoiceNo: inv.invoice_no,
              invoiceDate: inv.date || inv.invoice_date || new Date().toISOString().split('T')[0],
              taxType: 'GST',
              customerId: String(inv.customer_id || 'C-1'),
              customerName: inv.customer_name || 'Cash',
              contactNo: inv.customer_phone || '',
              city: 'Kozhikode',
              state: inv.state || 'Kerala',
              gstin: inv.customer_gstin || '',
              salesmanId: String(inv.salesman_id || 'SM-1'),
              salesman: inv.salesman_code || 'Mahesh',
              totalAmt: Number(inv.grand_total || inv.net_pay || 0),
              items: (inv.items || []).map((it: any) => ({
                productCode: it.p_code || it.barcode || `P-${it.product_id}`,
                productName: it.product_name,
                hsnCode: it.hsn_code || '9403',
                barcode: it.barcode || '',
                qtySold: Number(it.qty || 1),
                price: Number(it.rate || it.mrp || 0),
                discountPercent: Number(it.discount_percent || 0),
                cgst: Number(it.cgst_percent || 9),
                sgst: Number(it.sgst_percent || 9),
                total: Number(it.total || 0)
              }))
            }));
            setSalesInvoices(mapped);
          }
        })
        .catch(err => console.warn('Failed to fetch live invoices for sales return:', err));
    }
  }, [isOpen]);

  // Modal view states
  const [showInvoiceListModal, setShowInvoiceListModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoiceSummary | null>(null);

  // Return form states (Frame 0105 background)
  const currentFY = () => {
    const d = new Date();
    const y = d.getFullYear();
    const shortY = String(y).slice(-2);
    const nextY = String(y + 1).slice(-2);
    return `${shortY}/${nextY}`;
  };
  const [returnNo] = useState(() => `SHIB-0007-${currentFY()}`);
  const [returnDate] = useState(() => new Date().toLocaleDateString('en-GB'));
  const [returnQuantity, setReturnQuantity] = useState<number>(10);
  const [returnGrid, setReturnGrid] = useState<
    {
      productCode: string;
      productName: string;
      barcode: string;
      hsnCode: string;
      qtyReturned: number;
      price: number;
      cgst: number;
      sgst: number;
      total: number;
    }[]
  >([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Credit'>('Cash');
  const [billSundry, setBillSundry] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);

  // Invoice Lookup Filter States (Frame 0105 modal)
  const [filterInvFromDate, setFilterInvFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [filterInvToDate, setFilterInvToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appliedDateFilter, setAppliedDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [filterInvNo, setFilterInvNo] = useState('');
  const [filterCustName, setFilterCustName] = useState('');
  const [filterSalesman, setFilterSalesman] = useState('');

  if (!isOpen) return null;

  const handleGetData = () => {
    setAppliedDateFilter({ from: filterInvFromDate, to: filterInvToDate });
  };

  // Filter invoices for lookup modal
  const filteredInvoices = salesInvoices.filter(inv => {
    if (appliedDateFilter && (appliedDateFilter.from || appliedDateFilter.to)) {
      let invIso = inv.invoiceDate;
      if (inv.invoiceDate.includes('/')) {
        const parts = inv.invoiceDate.split('/');
        if (parts.length === 3) invIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (appliedDateFilter.from && invIso < appliedDateFilter.from) return false;
      if (appliedDateFilter.to && invIso > appliedDateFilter.to) return false;
    }
    if (filterInvNo && !inv.invoiceNo.toLowerCase().includes(filterInvNo.toLowerCase())) return false;
    if (filterCustName && !inv.customerName.toLowerCase().includes(filterCustName.toLowerCase())) return false;
    if (filterSalesman && !inv.salesman.toLowerCase().includes(filterSalesman.toLowerCase())) return false;
    return true;
  });

  const handleSelectInvoice = (inv: SalesInvoiceSummary) => {
    setSelectedInvoice(inv);
    setShowInvoiceListModal(false);
    // Preload first item for return
    if (inv.items.length > 0) {
      setReturnQuantity(10); // Default 10 pcs as in Video 04 demo
    }
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddToReturnGrid = () => {
    if (!selectedInvoice || selectedInvoice.items.length === 0) {
      showToast('⚠️ Please select an invoice first.');
      return;
    }
    const item = selectedInvoice.items[0];
    if (returnQuantity <= 0 || returnQuantity > item.qtySold) {
      showToast(`⚠️ Invalid return quantity. Maximum returnable: ${item.qtySold}`);
      return;
    }

    const itemTotal = returnQuantity * item.price;
    setReturnGrid([
      {
        productCode: item.productCode,
        productName: item.productName,
        barcode: item.barcode,
        hsnCode: item.hsnCode,
        qtyReturned: returnQuantity,
        price: item.price,
        cgst: item.cgst,
        sgst: item.sgst,
        total: itemTotal
      }
    ]);
  };

  const handleRemoveFromReturnGrid = () => {
    setReturnGrid([]);
  };

  const subTotal = returnGrid.reduce((s, i) => s + i.total, 0);
  const grandTotal = Math.max(0, subTotal + billSundry - billDiscount);

  const handleSaveReturn = () => {
    if (returnGrid.length === 0) {
      showToast('⚠️ Please add at least one product to the return grid.');
      return;
    }

    onProcessReturn({
      returnNo,
      invoiceNo: selectedInvoice?.invoiceNo || `SVF-INV-${Date.now().toString().slice(-4)}`,
      customerName: selectedInvoice?.customerName || 'Cash',
      items: returnGrid.map(i => ({
        productCode: i.productCode,
        productName: i.productName,
        qtyReturned: i.qtyReturned,
        price: i.price,
        total: i.total
      })),
      totalRefund: grandTotal,
      paymentMode
    });

    showToast(`✓ Sales Return ${returnNo} saved successfully! Inventory restocked.`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: '#0f766e',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '13px',
            zIndex: 100000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {toastMsg}
        </div>
      )}
      <div
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '90vh',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #002b66',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* TOP TITLE BAR (Frame 0105 background) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
            color: '#ffffff',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #001f4d'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <span>🔄</span>
            <span>SALE RETURN (Credit Note)</span>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 9px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* MAIN FORM BODY */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT 80% WORKSPACE */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '8px', overflowY: 'auto' }}>
            {/* Top metadata strip */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '11px'
              }}
            >
              <div>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Sales Return Sr No Info: </span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{returnNo}</span>
              </div>
              <div>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Date: </span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{returnDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Sales Invoice No: </span>
                <input
                  type="text"
                  readOnly
                  value={selectedInvoice ? selectedInvoice.invoiceNo : 'Click Load Invoice No'}
                  style={{
                    height: '24px',
                    width: '160px',
                    border: '1px solid #94a3b8',
                    padding: '2px 6px',
                    fontWeight: 'bold',
                    backgroundColor: '#f8fafc'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowInvoiceListModal(true)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    padding: '4px 10px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Load Invoice No
                </button>
              </div>
              {selectedInvoice && (
                <div>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>Customer: </span>
                  <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                    {selectedInvoice.customerName} ({selectedInvoice.contactNo})
                  </span>
                </div>
              )}
            </div>

            {/* Billed Items Table from Original Invoice */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#800000', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold' }}>
                Original Sales Invoice Line Items
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                    <th style={{ padding: '4px 8px' }}>HSN Code</th>
                    <th style={{ padding: '4px 8px' }}>Product Name</th>
                    <th style={{ padding: '4px 8px' }}>Barcode</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Qty Sold</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Sale Price</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>SGST %</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedInvoice ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        Click &quot;Load Invoice No&quot; above to select an invoice for return.
                      </td>
                    </tr>
                  ) : (
                    selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: '#fefce8', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 8px' }}>{item.hsnCode}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.productName}</td>
                        <td style={{ padding: '4px 8px' }}>{item.barcode}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{item.qtySold.toFixed(3)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.cgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>{item.sgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Middle Return Quantity Adjustment Row (Frame 0105) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px'
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Return Quantity :</span>
              <input
                type="number"
                min={1}
                max={selectedInvoice ? selectedInvoice.items[0]?.qtySold : 100}
                value={returnQuantity}
                onChange={e => setReturnQuantity(Number(e.target.value))}
                style={{
                  height: '28px',
                  width: '90px',
                  border: '1px solid #3b82f6',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  backgroundColor: '#fef08a' // Yellow highlight as in Video 04 Frame 0105
                }}
              />

              <button
                type="button"
                onClick={handleAddToReturnGrid}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '5px 14px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>➕</span> Add
              </button>

              <button
                type="button"
                onClick={handleRemoveFromReturnGrid}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '5px 12px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🗑️</span> Remove
              </button>

              {selectedInvoice && (
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginLeft: 'auto' }}>
                  Live Stock will increment by +{returnQuantity} PCS
                </span>
              )}
            </div>

            {/* Bottom Active Return Grid (Yellow Highlight Frame 0105) */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#003366', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px' }}>HSN Code</th>
                    <th style={{ padding: '5px 8px' }}>Product Name</th>
                    <th style={{ padding: '5px 8px' }}>Barcode</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Return Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Discount</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnGrid.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No return items added yet. Specify Return Quantity and click &quot;Add&quot;.
                      </td>
                    </tr>
                  ) : (
                    returnGrid.map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: '#fef08a', borderBottom: '1px solid #fef9c3', fontWeight: 'bold' }}>
                        <td style={{ padding: '5px 8px' }}>{row.hsnCode}</td>
                        <td style={{ padding: '5px 8px', color: '#0f172a' }}>{row.productName}</td>
                        <td style={{ padding: '5px 8px' }}>{row.barcode}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626', fontSize: '12px' }}>
                          {row.qtyReturned.toFixed(3)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.price.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>0.00</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.cgst.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontSize: '12px' }}>
                          {row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT SETTLEMENT & ACTION SIDEBAR (Frame 0105) */}
          <div
            style={{
              width: '260px',
              backgroundColor: '#f1f5f9',
              borderLeft: '1px solid #cbd5e1',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setReturnGrid([]);
                }}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '7px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                New
              </button>

              <button
                type="button"
                onClick={handleSaveReturn}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '9px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                💾 Save
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '7px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print
              </button>
            </div>

            {/* Financial Settlement Box */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>Bill Sundry:</span>
                <input
                  type="number"
                  value={billSundry}
                  onChange={e => setBillSundry(Number(e.target.value))}
                  style={{ width: '75px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>Bill Discount:</span>
                <input
                  type="number"
                  value={billDiscount}
                  onChange={e => setBillDiscount(Number(e.target.value))}
                  style={{ width: '75px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Total:</span>
                <span style={{ fontWeight: 'bold' }}>{subTotal.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                  borderTop: '2px solid #002b66',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}
              >
                <span>Refund Total:</span>
                <span>{grandTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>Payment Mode:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['Cash', 'Bank', 'Credit'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: paymentMode === mode ? '#003366' : '#e2e8f0',
                        color: paymentMode === mode ? '#ffffff' : '#334155',
                        border: '1px solid #94a3b8',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FRAME 0105 POPUP DIALOG: LIST OF SALES INVOICES */}
        {/* ============================================================== */}
        {showInvoiceListModal && (
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '5%',
              width: '90%',
              height: '90%',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              border: '2px solid #002b66',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Title Bar */}
            <div
              style={{
                background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
                color: '#ffffff',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <span>List of Sales Invoices</span>
              <button
                onClick={() => setShowInvoiceListModal(false)}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter Controls (Frame 0105) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px'
              }}
            >
              {/* Date Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#475569' }}>From:</span>
                <input
                  type="date"
                  value={filterInvFromDate}
                  onChange={e => setFilterInvFromDate(e.target.value)}
                  style={{ height: '24px', border: '1px solid #94a3b8', padding: '1px 4px' }}
                />
                <span style={{ color: '#475569' }}>To:</span>
                <input
                  type="date"
                  value={filterInvToDate}
                  onChange={e => setFilterInvToDate(e.target.value)}
                  style={{ height: '24px', border: '1px solid #94a3b8', padding: '1px 4px' }}
                />
                <button
                  type="button"
                  onClick={handleGetData}
                  style={{
                    backgroundColor: '#002b66',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    padding: '3px 8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Get Data
                </button>
              </div>

              {/* Quick Search Boxes */}
              <input
                type="text"
                placeholder="Search By Invoice No..."
                value={filterInvNo}
                onChange={e => setFilterInvNo(e.target.value)}
                style={{ height: '24px', width: '150px', border: '1px solid #94a3b8', padding: '2px 6px' }}
              />

              <input
                type="text"
                placeholder="Search By Customer Name..."
                value={filterCustName}
                onChange={e => setFilterCustName(e.target.value)}
                style={{ height: '24px', width: '160px', border: '1px solid #94a3b8', padding: '2px 6px' }}
              />

              <input
                type="text"
                placeholder="Search By Salesman..."
                value={filterSalesman}
                onChange={e => setFilterSalesman(e.target.value)}
                style={{ height: '24px', width: '130px', border: '1px solid #94a3b8', padding: '2px 6px' }}
              />

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterInvNo('');
                    setFilterCustName('');
                    setFilterSalesman('');
                  }}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    padding: '3px 10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#003366', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px 8px', width: '35px' }}>#</th>
                    <th style={{ padding: '6px 8px' }}>Invoice No.</th>
                    <th style={{ padding: '6px 8px' }}>Invoice Date</th>
                    <th style={{ padding: '6px 8px' }}>Tax Type</th>
                    <th style={{ padding: '6px 8px' }}>Customer ID</th>
                    <th style={{ padding: '6px 8px' }}>Customer Name</th>
                    <th style={{ padding: '6px 8px' }}>Contact No.</th>
                    <th style={{ padding: '6px 8px' }}>State</th>
                    <th style={{ padding: '6px 8px' }}>GSTIN</th>
                    <th style={{ padding: '6px 8px' }}>Salesman</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>(Taxable + Tax) Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, idx) => (
                    <tr
                      key={inv.invoiceNo}
                      onClick={() => handleSelectInvoice(inv)}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc')}
                    >
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>▷ {idx + 1}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e40af' }}>{inv.invoiceNo}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.invoiceDate}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.taxType}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.customerId}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{inv.customerName}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.contactNo}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.state}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.gstin || '-'}</td>
                      <td style={{ padding: '5px 8px' }}>{inv.salesman}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{inv.totalAmt.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoices Footer Totals (Frame 0105) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderTop: '2px solid #cbd5e1',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#475569'
              }}
            >
              <div>Offer Disc: 0.00 | Loyalty Disc: 0.00 | Coupon Disc: 0.00 | Gift Disc: 0.00 | WriteOff Disc: 0.00</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#002b66' }}>
                Total : {filteredInvoices.reduce((s, i) => s + i.totalAmt, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
