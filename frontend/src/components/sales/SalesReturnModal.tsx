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
  bills?: any[];
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

const DEFAULT_SALES_INVOICES: SalesInvoiceSummary[] = [
  {
    invoiceNo: 'SVF-INV-2026/089',
    invoiceDate: new Date().toLocaleDateString('en-GB'),
    taxType: 'GST',
    customerId: 'C-001',
    customerName: 'K. R. Nambiar (Residential)',
    contactNo: '9847123456',
    city: 'Kozhikode',
    state: 'Kerala',
    gstin: '32AABCS1429B1ZB',
    salesmanId: 'SM-001',
    salesman: 'Mahesh',
    totalAmt: 32450,
    items: [
      {
        productCode: 'GI-SL3D-PB',
        productName: 'Godrej Slimline 3-Door Steel Wardrobe (Pacific Blue)',
        hsnCode: '9403',
        barcode: '8901101',
        qtySold: 1,
        price: 32450,
        discountPercent: 0,
        cgst: 9,
        sgst: 9,
        total: 32450
      }
    ]
  },
  {
    invoiceNo: 'SVF-INV-2026/090',
    invoiceDate: new Date().toLocaleDateString('en-GB'),
    taxType: 'GST',
    customerId: 'C-002',
    customerName: 'Anand Kumar (Cyberpark Villa)',
    contactNo: '9447654321',
    city: 'Kozhikode',
    state: 'Kerala',
    gstin: '',
    salesmanId: 'SM-002',
    salesman: 'Sukumar',
    totalAmt: 23128,
    items: [
      {
        productCode: 'NK-ERGO-CH',
        productName: 'Nilkamal High-Back Ergonomic Mesh Office Chair',
        hsnCode: '9401',
        barcode: '8901102',
        qtySold: 2,
        price: 11564,
        discountPercent: 0,
        cgst: 9,
        sgst: 9,
        total: 23128
      }
    ]
  },
  {
    invoiceNo: 'SVF-INV-2026/091',
    invoiceDate: new Date().toLocaleDateString('en-GB'),
    taxType: 'GST',
    customerId: 'C-003',
    customerName: 'Dr. Faizal Rahman',
    contactNo: '9846001122',
    city: 'Malappuram',
    state: 'Kerala',
    gstin: '',
    salesmanId: 'SM-001',
    salesman: 'Mahesh',
    totalAmt: 48000,
    items: [
      {
        productCode: 'NT-DIN-6S',
        productName: 'Nilambur Solid Teak Wood 6-Seater Dining Table Set',
        hsnCode: '9403',
        barcode: '8901103',
        qtySold: 1,
        price: 48000,
        discountPercent: 0,
        cgst: 9,
        sgst: 9,
        total: 48000
      }
    ]
  }
];

const mapRawBillsToInvoices = (rawList: any[]): SalesInvoiceSummary[] => {
  return rawList.map(b => ({
    invoiceNo: b.invoiceNo || b.invoice_no || b.id || 'INV-001',
    invoiceDate: b.date || b.invoiceDate || b.invoice_date || new Date().toLocaleDateString('en-GB'),
    taxType: 'GST',
    customerId: String(b.customerId || b.customer_id || (b.customer?.id) || 'C-1'),
    customerName: b.customerName || b.customer_name || (b.customer?.name) || 'Walk-in Customer',
    contactNo: b.contactNo || b.contact_no || b.customer_phone || (b.customer?.phone) || '',
    city: b.city || 'Kozhikode',
    state: b.state || 'Kerala',
    gstin: b.customerGstin || b.gstin || b.customer_gstin || (b.customer?.gstin) || '',
    salesmanId: String(b.salesmanId || b.salesman_id || 'SM-1'),
    salesman: b.salesman || b.salesman_code || 'Mahesh',
    totalAmt: Number(b.netPay || b.totalAmt || b.totalAmount || b.grand_total || 0),
    items: (b.items || []).map((it: any) => ({
      productCode: it.productCode || it.pCode || it.p_code || it.barcode || `P-${it.product_id || '01'}`,
      productName: it.productName || it.name || it.product_name || 'Furniture Item',
      hsnCode: it.hsnCode || it.hsn || it.hsn_code || '9403',
      barcode: it.barcode || '',
      qtySold: Number(it.qtySold || it.qty || it.quantity || 1),
      price: Number(it.price || it.rate || it.mrp || 0),
      discountPercent: Number(it.discountPercent || it.discPercent || it.discount_percent || 0),
      cgst: Number(it.cgst || it.cgstPercent || it.cgst_percent || 9),
      sgst: Number(it.sgst || it.sgstPercent || it.sgst_percent || 9),
      total: Number(it.total || it.taxable || (Number(it.qty || 1) * Number(it.rate || it.price || 0)))
    }))
  }));
};

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products,
  customers: _customers,
  bills,
  onProcessReturn
}) => {
  // Sales invoices state loaded live from Railway PostgreSQL or offline history
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceSummary[]>(DEFAULT_SALES_INVOICES);

  useEffect(() => {
    if (!isOpen) return;

    let initial: SalesInvoiceSummary[] = [];

    // 1. From props (oldBills from App.tsx)
    if (bills && bills.length > 0) {
      initial = [...mapRawBillsToInvoices(bills)];
    }

    // 2. From localStorage offline history
    try {
      const savedBills = localStorage.getItem('rd_bills_history');
      if (savedBills) {
        const parsed = JSON.parse(savedBills);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mappedSaved = mapRawBillsToInvoices(parsed);
          mappedSaved.forEach(sb => {
            if (!initial.some(x => x.invoiceNo === sb.invoiceNo)) {
              initial.push(sb);
            }
          });
        }
      }
    } catch {}

    // 3. Fallback defaults so invoice picker is NEVER empty
    DEFAULT_SALES_INVOICES.forEach(df => {
      if (!initial.some(x => x.invoiceNo === df.invoiceNo)) {
        initial.push(df);
      }
    });

    setSalesInvoices(initial);

    // 4. Fetch live from Railway PostgreSQL
    api.getSalesInvoices(0, 100)
      .then((liveInvoices: any[]) => {
        if (Array.isArray(liveInvoices) && liveInvoices.length > 0) {
          const mappedLive = mapRawBillsToInvoices(liveInvoices);
          setSalesInvoices(prev => {
            const combined = [...mappedLive];
            prev.forEach(p => {
              if (!combined.some(c => c.invoiceNo === p.invoiceNo)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(err => console.warn('Using local sales invoices fallback for return:', err));
  }, [isOpen, bills]);

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
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
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

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSelectInvoice = (inv: SalesInvoiceSummary) => {
    setSelectedInvoice(inv);
    setShowInvoiceListModal(false);
    // Auto-populate return grid with the selected invoice's items!
    if (inv.items.length > 0) {
      const initialQty = Math.max(1, Math.min(inv.items[0].qtySold, 1));
      setReturnQuantity(initialQty);
      setReturnGrid(
        inv.items.map(item => {
          const qtyRet = Math.max(1, Math.min(item.qtySold, 1));
          return {
            productCode: item.productCode,
            productName: item.productName,
            barcode: item.barcode,
            hsnCode: item.hsnCode,
            qtyReturned: qtyRet,
            price: item.price,
            cgst: item.cgst,
            sgst: item.sgst,
            total: Number((qtyRet * item.price).toFixed(2))
          };
        })
      );
      showToast(`✓ Invoice ${inv.invoiceNo} loaded. Review return quantities and save.`);
    }
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    setReturnGrid(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const matchedInvItem = selectedInvoice?.items.find(it => it.productCode === item.productCode);
        const maxQty = matchedInvItem ? matchedInvItem.qtySold : 999;
        const boundedQty = Math.max(1, Math.min(newQty, maxQty));
        return {
          ...item,
          qtyReturned: boundedQty,
          total: Number((boundedQty * item.price).toFixed(2))
        };
      })
    );
  };

  const handleRemoveRow = (index: number) => {
    setReturnGrid(prev => prev.filter((_, idx) => idx !== index));
    showToast('Item removed from return list.');
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
    showToast(`✓ Product added to return.`);
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
        padding: '8px',
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
          width: '96vw',
          maxWidth: '1240px',
          maxHeight: '94vh',
          height: '92vh',
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

        {/* MAIN FORM BODY - Responsive column on mobile, row on desktop */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            overflowY: 'auto',
            minHeight: 0
          }}
        >
          {/* LEFT WORKSPACE */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '8px', overflowY: 'auto' }}>
            {/* Top metadata strip */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '3px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px'
              }}
            >
              <div>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Sales Return No: </span>
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
                  🔍 Load Invoice No
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
              <div style={{ backgroundColor: '#800000', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>Original Sales Invoice Line Items</span>
                {selectedInvoice && (
                  <span style={{ color: '#fef08a' }}>Invoice: {selectedInvoice.invoiceNo} | Date: {selectedInvoice.invoiceDate}</span>
                )}
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '140px' }}>
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
                        <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                          👉 Click <strong style={{ color: '#16a34a' }}>&quot;🔍 Load Invoice No&quot;</strong> above to pick a bill from customer history.
                        </td>
                      </tr>
                    ) : (
                      (selectedInvoice.items || []).map((item, idx) => (
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
            </div>

            {/* Middle Return Quantity Adjustment Row (Frame 0105) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '3px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px'
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Quick Return Qty:</span>
              <input
                type="number"
                min={1}
                max={selectedInvoice?.items?.[0]?.qtySold || 100}
                value={returnQuantity}
                onChange={e => setReturnQuantity(Number(e.target.value))}
                style={{
                  height: '28px',
                  width: '80px',
                  border: '1px solid #3b82f6',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  backgroundColor: '#fef08a'
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
                <span>➕</span> Add / Reset
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
                <span>🗑️</span> Clear All
              </button>

              {returnGrid.length > 0 && (
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginLeft: 'auto' }}>
                  ✓ {returnGrid.length} item(s) in Return Credit Note (Restocks inventory)
                </span>
              )}
            </div>

            {/* Bottom Active Return Grid (Yellow Highlight Frame 0105) */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'auto', minHeight: '160px' }}>
              <div style={{ backgroundColor: '#003366', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>Items to be Returned (Credit Note Grid)</span>
                <span style={{ fontSize: '10px', color: '#93c5fd' }}>Adjust quantities directly below</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#002b66', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px' }}>HSN Code</th>
                    <th style={{ padding: '5px 8px' }}>Product Name</th>
                    <th style={{ padding: '5px 8px' }}>Barcode</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Return Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Refund Amount</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {returnGrid.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No return items added yet. Click &quot;🔍 Load Invoice No&quot; to pick an invoice.
                      </td>
                    </tr>
                  ) : (
                    returnGrid.map((row, idx) => {
                      const matchedItem = selectedInvoice?.items.find(it => it.productCode === row.productCode);
                      const maxQty = matchedItem ? matchedItem.qtySold : 999;
                      return (
                        <tr key={idx} style={{ backgroundColor: '#fef08a', borderBottom: '1px solid #fef9c3', fontWeight: 'bold' }}>
                          <td style={{ padding: '5px 8px' }}>{row.hsnCode}</td>
                          <td style={{ padding: '5px 8px', color: '#0f172a' }}>{row.productName}</td>
                          <td style={{ padding: '5px 8px' }}>{row.barcode}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                            <input
                              type="number"
                              min={1}
                              max={maxQty}
                              value={row.qtyReturned}
                              onChange={e => handleUpdateItemQty(idx, Number(e.target.value))}
                              style={{
                                width: '65px',
                                textAlign: 'right',
                                fontWeight: 'bold',
                                color: '#dc2626',
                                fontSize: '12px',
                                border: '1px solid #dc2626',
                                borderRadius: '2px',
                                padding: '1px 4px',
                                backgroundColor: '#ffffff'
                              }}
                            />
                            <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>/ {maxQty}</span>
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.price.toFixed(2)}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.cgst.toFixed(2)}%</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontSize: '12px' }}>
                            {row.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              title="Remove item"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT SETTLEMENT & ACTION SIDEBAR (Frame 0105) */}
          <div
            style={{
              width: window.innerWidth < 768 ? '100%' : '280px',
              backgroundColor: '#f1f5f9',
              borderLeft: window.innerWidth < 768 ? 'none' : '1px solid #cbd5e1',
              borderTop: window.innerWidth < 768 ? '1px solid #cbd5e1' : 'none',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
              flexShrink: 0
            }}
          >
            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setReturnGrid([]);
                  setShowInvoiceListModal(true);
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
                🔄 Select Another Invoice
              </button>

              <button
                type="button"
                onClick={handleSaveReturn}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '11px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                💾 Save Return Credit Note
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
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Items Total:</span>
                <span style={{ fontWeight: 'bold' }}>{subTotal.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                  borderTop: '2px solid #002b66',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#dc2626'
                }}
              >
                <span>Refund Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>Refund Mode:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['Cash', 'Bank', 'Credit'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
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
              top: '3%',
              left: '3%',
              width: '94%',
              height: '94%',
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
              <span>List of Sales Invoices (Click any row to load into Credit Note)</span>
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
                  Filter Date
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
                placeholder="Search By Customer..."
                value={filterCustName}
                onChange={e => setFilterCustName(e.target.value)}
                style={{ height: '24px', width: '150px', border: '1px solid #94a3b8', padding: '2px 6px' }}
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
                    setAppliedDateFilter(null);
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
                  Reset Filter
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
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No invoices match the search filter. Click &quot;Reset Filter&quot; above to show all available bills.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, idx) => (
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
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{inv.totalAmt.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
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
              <div>{filteredInvoices.length} invoices found. Click any invoice row to select.</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#002b66' }}>
                Total : ₹{filteredInvoices.reduce((s, i) => s + i.totalAmt, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
