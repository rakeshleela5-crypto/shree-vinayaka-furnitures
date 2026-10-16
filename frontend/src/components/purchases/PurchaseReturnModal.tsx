import React, { useState } from 'react';
import type { Product, PurchaseReturnDebitNote } from '../../types/retailDaddy';

interface PurchaseInvoiceSummary {
  invoiceNo: string;
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  city: string;
  state: string;
  contactNo: string;
  reverseCharges: string;
  items: {
    hsnCode: string;
    productName: string;
    barcode: string;
    qtyBilled: number;
    mrp: number;
    price: number;
    discountPercent: number;
    discountAmt: number;
    cgstPercent: number;
    cgstAmt: number;
    sgstPercent: number;
    sgstAmt: number;
    total: number;
  }[];
}

interface PurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProcessPurchaseReturn: (debitNote: PurchaseReturnDebitNote) => void;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products,
  onProcessPurchaseReturn
}) => {
  // Sample purchase invoices matching Frame 0225 (Delco Engineering / ADOL EXTRA)
  const [purchaseInvoices] = useState<PurchaseInvoiceSummary[]>([
    {
      invoiceNo: 'SHIB-0016-2024/25',
      invoiceDate: '03/03/2025',
      supplierId: 'S-0004',
      supplierName: 'Delco Engineering',
      city: 'vaikom',
      state: 'Kerala',
      contactNo: '8898989898',
      reverseCharges: 'No',
      items: [
        {
          hsnCode: '80051',
          productName: 'ADOL EXTRA',
          barcode: '650008',
          qtyBilled: 100.0,
          mrp: 100.0,
          price: 26.0,
          discountPercent: 0,
          discountAmt: 0,
          cgstPercent: 6.0,
          cgstAmt: 156.0,
          sgstPercent: 6.0,
          sgstAmt: 156.0,
          total: 2912.0
        }
      ]
    },
    {
      invoiceNo: 'SHIB-0015-2024/25',
      invoiceDate: '01/03/2025',
      supplierId: 'S-0002',
      supplierName: 'abc',
      city: 'Kozhikode',
      state: 'Kerala',
      contactNo: '9847000000',
      reverseCharges: 'No',
      items: [
        {
          hsnCode: '80051',
          productName: '555 SARDINES',
          barcode: '650002',
          qtyBilled: 50.0,
          mrp: 18.0,
          price: 14.0,
          discountPercent: 0,
          discountAmt: 0,
          cgstPercent: 6.0,
          cgstAmt: 42.0,
          sgstPercent: 6.0,
          sgstAmt: 42.0,
          total: 784.0
        }
      ]
    }
  ]);

  // Invoice selection & return state (Frame 0225)
  const [showPurchaseInvoicePicker, setShowPurchaseInvoicePicker] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoiceSummary>(purchaseInvoices[0]);

  const [prNo] = useState('SHIB-0001-2024/25');
  const [prDate] = useState('03/03/2025');
  const [taxType] = useState('GST');
  const [returnQuantity, setReturnQuantity] = useState<number>(50); // Default 50 pcs as in Video 04 demo

  const [returnGrid, setReturnGrid] = useState<
    {
      hsnCode: string;
      productName: string;
      barcode: string;
      qty: number;
      mrp: number;
      price: number;
      discountPercent: number;
      discountAmt: number;
      cgstPercent: number;
      cgstAmt: number;
      sgstPercent: number;
      sgstAmt: number;
      igstPercent: number;
      igstAmt: number;
      cessPercent: number;
      cessAmt: number;
      total: number;
    }[]
  >([
    // Pre-populate with Video 04 Frame 0225 active return line
    {
      hsnCode: '80051',
      productName: 'ADOL EXTRA',
      barcode: '650008',
      qty: 50.0,
      mrp: 100.0,
      price: 26.0,
      discountPercent: 0,
      discountAmt: 0,
      cgstPercent: 6.0,
      cgstAmt: 78.0,
      sgstPercent: 6.0,
      sgstAmt: 78.0,
      igstPercent: 0,
      igstAmt: 0,
      cessPercent: 0,
      cessAmt: 0,
      total: 1456.0 // 50 * 26 + 12% GST = 1300 + 156 = 1456.00
    }
  ]);

  const [billSundry, setBillSundry] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Cash');

  if (!isOpen) return null;

  const handleSelectInvoice = (inv: PurchaseInvoiceSummary) => {
    setSelectedInvoice(inv);
    setShowPurchaseInvoicePicker(false);
    if (inv.items.length > 0) {
      setReturnQuantity(inv.items[0].qtyBilled / 2);
    }
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddReturnItem = () => {
    if (!selectedInvoice || selectedInvoice.items.length === 0) return;
    const billedItem = selectedInvoice.items[0];

    if (returnQuantity <= 0 || returnQuantity > billedItem.qtyBilled) {
      showToast(`⚠️ Invalid return quantity. Maximum billed quantity is ${billedItem.qtyBilled}`);
      return;
    }

    const baseAmount = returnQuantity * billedItem.price;
    const cgstAmt = (baseAmount * billedItem.cgstPercent) / 100;
    const sgstAmt = (baseAmount * billedItem.sgstPercent) / 100;
    const lineTotal = baseAmount + cgstAmt + sgstAmt;

    setReturnGrid([
      {
        hsnCode: billedItem.hsnCode,
        productName: billedItem.productName,
        barcode: billedItem.barcode,
        qty: returnQuantity,
        mrp: billedItem.mrp,
        price: billedItem.price,
        discountPercent: billedItem.discountPercent,
        discountAmt: 0,
        cgstPercent: billedItem.cgstPercent,
        cgstAmt,
        sgstPercent: billedItem.sgstPercent,
        sgstAmt,
        igstPercent: 0,
        igstAmt: 0,
        cessPercent: 0,
        cessAmt: 0,
        total: lineTotal
      }
    ]);
  };

  const handleRemoveReturnItem = () => {
    setReturnGrid([]);
  };

  const subTotal = returnGrid.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = Math.max(0, subTotal + billSundry - billDiscount + roundOff);

  const handleSavePurchaseReturn = () => {
    if (returnGrid.length === 0) {
      showToast('⚠️ Please add at least one item to return.');
      return;
    }

    const debitNote: PurchaseReturnDebitNote = {
      id: `pr-${Date.now()}`,
      prNo,
      date: prDate,
      taxType,
      originalInvoiceNo: selectedInvoice.invoiceNo,
      reverseCharges: selectedInvoice.reverseCharges,
      supplierId: selectedInvoice.supplierId,
      supplierName: selectedInvoice.supplierName,
      city: selectedInvoice.city,
      state: selectedInvoice.state,
      contactNo: selectedInvoice.contactNo,
      items: returnGrid,
      billSundry,
      billDiscount,
      total: subTotal,
      roundOff,
      grandTotal,
      paymentMode
    };

    onProcessPurchaseReturn(debitNote);
    showToast(`✓ Purchase Return Debit Note ${prNo} recorded successfully!`);
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
          width: '96vw',
          maxWidth: '1280px',
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
        {/* TOP TITLE BAR (Frame 0225) */}
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
            <span>📦</span>
            <span>PURCHASE RETURN (Debit Note)</span>
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

        {/* TOP 3-COLUMN METADATA HEADER (Frame 0225) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1.3fr 1.5fr',
            gap: '12px',
            fontSize: '11px'
          }}
        >
          {/* Box 1: Purchase Return Information */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>Purchase Return Information</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>PR No :</span>
              <span style={{ fontWeight: 'bold' }}>{prNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Date :</span>
              <span style={{ fontWeight: 'bold' }}>{prDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Tax Type :</span>
              <span style={{ fontWeight: 'bold' }}>{taxType}</span>
            </div>
          </div>

          {/* Box 2: Purchase Invoice Information */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>Purchase Invoice Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Invoice No :</span>
              <input
                type="text"
                readOnly
                value={selectedInvoice.invoiceNo}
                style={{ flex: 1, height: '22px', border: '1px solid #94a3b8', padding: '1px 6px', fontWeight: 'bold' }}
              />
              <button
                type="button"
                onClick={() => setShowPurchaseInvoicePicker(true)}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Browse
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Reverse Charges :</span>
              <span style={{ fontWeight: 'bold' }}>{selectedInvoice.reverseCharges}</span>
            </div>
          </div>

          {/* Box 3: Supplier Information */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>Supplier Information</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Supplier ID / Name:</span>
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                {selectedInvoice.supplierId} - {selectedInvoice.supplierName}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Branch / State:</span>
              <span>{selectedInvoice.city}, {selectedInvoice.state}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Contact:</span>
              <span>{selectedInvoice.contactNo}</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE & SETTLEMENT */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT 75% TABLES */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', gap: '8px', overflowY: 'auto' }}>
            {/* Top Original Purchase Invoice Items Table (Frame 0225: Purple/Crimson Header) */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#7e22ce', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold' }}>
                Original Inward Purchase Invoice Line Items (SHIB-0016-2024/25)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#800000', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px' }}>HSN Code</th>
                    <th style={{ padding: '5px 8px' }}>Product Name</th>
                    <th style={{ padding: '5px 8px' }}>Barcode</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>MRP</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Price / Main Unit</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Discount %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Discount</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST Amt</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>SGST %</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px' }}>{item.hsnCode}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{item.productName}</td>
                      <td style={{ padding: '5px 8px' }}>{item.barcode}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{item.qtyBilled.toFixed(3)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.mrp.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{item.price.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.discountPercent.toFixed(4)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.discountAmt.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.cgstPercent.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.cgstAmt.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.sgstPercent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Middle Return Adjustment Row (Frame 0225) */}
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
                max={selectedInvoice.items[0]?.qtyBilled || 100}
                value={returnQuantity}
                onChange={e => setReturnQuantity(Number(e.target.value))}
                style={{
                  height: '28px',
                  width: '90px',
                  border: '1px solid #dc2626',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  backgroundColor: '#fef08a' // Frame 0225 exact pale yellow
                }}
              />

              <button
                type="button"
                onClick={handleAddReturnItem}
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
                onClick={handleRemoveReturnItem}
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

              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold', marginLeft: 'auto' }}>
                Live Inventory will decrease by -{returnQuantity} PCS
              </span>
            </div>

            {/* Bottom Active Return Grid (Frame 0225: Yellow Highlighted Table) */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#003366', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px', width: '35px' }}>#</th>
                    <th style={{ padding: '5px 8px' }}>HSN Code</th>
                    <th style={{ padding: '5px 8px' }}>Product Name</th>
                    <th style={{ padding: '5px 8px' }}>Barcode</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>MRP</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Price / Main Unit</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Discount %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Discount</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST Amt</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {returnGrid.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No items added to debit note. Click &quot;Add&quot; to include returned products.
                      </td>
                    </tr>
                  ) : (
                    returnGrid.map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: '#fef08a', borderBottom: '1px solid #fef9c3', fontWeight: 'bold' }}>
                        <td style={{ padding: '5px 8px', color: '#dc2626' }}>▷ {idx + 1}</td>
                        <td style={{ padding: '5px 8px' }}>{row.hsnCode}</td>
                        <td style={{ padding: '5px 8px', color: '#0f172a' }}>{row.productName}</td>
                        <td style={{ padding: '5px 8px' }}>{row.barcode}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#dc2626', fontSize: '12px' }}>
                          {row.qty.toFixed(0)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.mrp.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.price.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>0</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>0</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.cgstPercent.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.cgstAmt.toFixed(2)}</td>
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

          {/* RIGHT SIDEBAR SETTLEMENT (Frame 0225) */}
          <div
            style={{
              width: '270px',
              backgroundColor: '#f1f5f9',
              borderLeft: '1px solid #cbd5e1',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            {/* Sidebar Command Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setReturnGrid([])}
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
                onClick={handleSavePurchaseReturn}
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

            {/* Frame 0225 Financial Settlement Box */}
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
                <span style={{ color: '#475569' }}>CESS:</span>
                <span style={{ fontWeight: 'bold' }}>0</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>Bill Sundry:</span>
                <input
                  type="number"
                  value={billSundry}
                  onChange={e => setBillSundry(Number(e.target.value))}
                  style={{ width: '80px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '2px', backgroundColor: '#fefce8' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>Bill Discount:</span>
                <input
                  type="number"
                  value={billDiscount}
                  onChange={e => setBillDiscount(Number(e.target.value))}
                  style={{ width: '80px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '2px', backgroundColor: '#fefce8' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Total:</span>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{subTotal.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>Round Off:</span>
                <input
                  type="number"
                  value={roundOff}
                  onChange={e => setRoundOff(Number(e.target.value))}
                  style={{ width: '80px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '2px' }}
                />
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
                <span>Grand Total:</span>
                <span>{grandTotal.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>Payment Mode:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['Cash', 'Bank'] as const).map(mode => (
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

        {/* PURCHASE INVOICE BROWSE DIALOG */}
        {showPurchaseInvoicePicker && (
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '15%',
              width: '70%',
              height: '70%',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              border: '2px solid #002b66',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                backgroundColor: '#003366',
                color: '#ffffff',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              <span>Select Supplier Inward Purchase Bill</span>
              <button
                onClick={() => setShowPurchaseInvoicePicker(false)}
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '2px 8px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Invoice No</th>
                    <th style={{ padding: '6px' }}>Date</th>
                    <th style={{ padding: '6px' }}>Supplier</th>
                    <th style={{ padding: '6px' }}>Product</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Qty Billed</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseInvoices.map((inv, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleSelectInvoice(inv)}
                      style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '6px', fontWeight: 'bold', color: '#1e40af' }}>{inv.invoiceNo}</td>
                      <td style={{ padding: '6px' }}>{inv.invoiceDate}</td>
                      <td style={{ padding: '6px', fontWeight: 'bold' }}>{inv.supplierName}</td>
                      <td style={{ padding: '6px' }}>{inv.items[0]?.productName}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{inv.items[0]?.qtyBilled}</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{inv.items[0]?.total.toFixed(2)}</td>
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
