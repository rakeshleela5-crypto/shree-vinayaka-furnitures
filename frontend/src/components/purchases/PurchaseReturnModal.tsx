import React, { useState, useEffect } from 'react';
import type { Product, PurchaseReturnDebitNote } from '../../types/retailDaddy';
import { api } from '../../api/client';

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
  initialInvoice?: any;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products,
  onProcessPurchaseReturn,
  initialInvoice
}) => {
  // Furniture purchase invoices (W2-2 fix: real furniture defaults instead of grocery dummy data)
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceSummary[]>([
    {
      invoiceNo: 'GI-FAC-9921',
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      supplierId: 'S-0001',
      supplierName: 'Godrej & Boyce Mfg. Co. Ltd.',
      city: 'Kozhikode',
      state: 'Kerala',
      contactNo: '9847012345',
      reverseCharges: 'No',
      items: [
        {
          hsnCode: '9403',
          productName: 'Godrej Slimline 3-Door Wardrobe (Pacific Blue)',
          barcode: '8901101',
          qtyBilled: 5.0,
          mrp: 36990.0,
          price: 27500.0,
          discountPercent: 0,
          discountAmt: 0,
          cgstPercent: 9.0,
          cgstAmt: 2475.0,
          sgstPercent: 9.0,
          sgstAmt: 2475.0,
          total: 32450.0
        }
      ]
    },
    {
      invoiceNo: 'NIL-INV-2026/044',
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      supplierId: 'S-0002',
      supplierName: 'Nilkamal Limited (South Hub)',
      city: 'Ernakulam',
      state: 'Kerala',
      contactNo: '9847055555',
      reverseCharges: 'No',
      items: [
        {
          hsnCode: '9401',
          productName: 'Nilkamal High-Back Ergonomic Mesh Chair',
          barcode: '8901102',
          qtyBilled: 10.0,
          mrp: 14999.0,
          price: 9800.0,
          discountPercent: 0,
          discountAmt: 0,
          cgstPercent: 9.0,
          cgstAmt: 882.0,
          sgstPercent: 9.0,
          sgstAmt: 882.0,
          total: 11564.0
        }
      ]
    }
  ]);

  // Invoice selection & return state
  const [showPurchaseInvoicePicker, setShowPurchaseInvoicePicker] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoiceSummary>(purchaseInvoices[0]);

  const [prNo] = useState(() => {
    const d = new Date();
    const fy = d.getMonth() >= 3 ? `${d.getFullYear().toString().slice(-2)}${(d.getFullYear() + 1).toString().slice(-2)}` : `${(d.getFullYear() - 1).toString().slice(-2)}${d.getFullYear().toString().slice(-2)}`;
    return `PR-${fy}-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [prDate] = useState(() => new Date().toLocaleDateString('en-GB'));
  const [taxType] = useState('GST');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);

  // W2-2 fix: Fetch real purchase invoices from FastAPI / PostgreSQL backend on mount
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    api.getPurchases(0, 50).then(rawPurchases => {
      if (!isMounted || !Array.isArray(rawPurchases) || rawPurchases.length === 0) return;
      const mapped: PurchaseInvoiceSummary[] = rawPurchases.map(p => ({
        invoiceNo: p.invoice_no,
        invoiceDate: p.invoice_date || p.date || new Date().toLocaleDateString('en-GB'),
        supplierId: `S-${p.supplier_id || '0001'}`,
        supplierName: p.supplier_name || 'Godrej Interio Factory',
        city: p.city || 'Kozhikode',
        state: p.state || 'Kerala',
        contactNo: p.supplier_phone || '9847012345',
        reverseCharges: 'No',
        items: (p.items || []).map((it: any) => {
          const qty = Number(it.qty || 1);
          const price = Number(it.purchase_price || it.rate || 0);
          const cgstP = Number(it.cgst_percent ?? 9.0);
          const sgstP = Number(it.sgst_percent ?? 9.0);
          const baseAmt = qty * price;
          const cgstAmt = Number(((baseAmt * cgstP) / 100).toFixed(2));
          const sgstAmt = Number(((baseAmt * sgstP) / 100).toFixed(2));
          return {
            hsnCode: it.hsn_code || '9403',
            productName: it.product_name || 'Furniture Item',
            barcode: it.barcode || '8901101',
            qtyBilled: qty,
            mrp: Number(it.mrp || (price * 1.3)),
            price,
            discountPercent: 0,
            discountAmt: 0,
            cgstPercent: cgstP,
            cgstAmt,
            sgstPercent: sgstP,
            sgstAmt,
            total: baseAmt + cgstAmt + sgstAmt
          };
        })
      }));
      setPurchaseInvoices(mapped);
      if (!initialInvoice && mapped.length > 0) {
        setSelectedInvoice(mapped[0]);
        if (mapped[0].items.length > 0) {
          setReturnQuantity(1);
          const firstIt = mapped[0].items[0];
          const base = 1 * firstIt.price;
          const cAmt = Number(((base * firstIt.cgstPercent) / 100).toFixed(2));
          const sAmt = Number(((base * firstIt.sgstPercent) / 100).toFixed(2));
          setReturnGrid([{
            hsnCode: firstIt.hsnCode,
            productName: firstIt.productName,
            barcode: firstIt.barcode,
            qty: 1,
            mrp: firstIt.mrp,
            price: firstIt.price,
            discountPercent: 0,
            discountAmt: 0,
            cgstPercent: firstIt.cgstPercent,
            cgstAmt: cAmt,
            sgstPercent: firstIt.sgstPercent,
            sgstAmt: sAmt,
            igstPercent: 0,
            igstAmt: 0,
            cessPercent: 0,
            cessAmt: 0,
            total: base + cAmt + sAmt
          }]);
        }
      }
    }).catch(err => {
      console.warn("Could not fetch purchase invoices for return modal:", err);
    });
    return () => { isMounted = false; };
  }, [isOpen, initialInvoice]);

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
    {
      hsnCode: '9403',
      productName: 'Godrej Slimline 3-Door Wardrobe (Pacific Blue)',
      barcode: '8901101',
      qty: 1.0,
      mrp: 36990.0,
      price: 27500.0,
      discountPercent: 0,
      discountAmt: 0,
      cgstPercent: 9.0,
      cgstAmt: 2475.0,
      sgstPercent: 9.0,
      sgstAmt: 2475.0,
      igstPercent: 0,
      igstAmt: 0,
      cessPercent: 0,
      cessAmt: 0,
      total: 32450.0
    }
  ]);

  const [billSundry, setBillSundry] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank'>('Cash');

  useEffect(() => {
    if (isOpen && initialInvoice) {
      const mappedInv: PurchaseInvoiceSummary = {
        invoiceNo: initialInvoice.invoiceNo || initialInvoice.supplierInvoiceNo || 'PINV-001',
        invoiceDate: initialInvoice.date || initialInvoice.supplierInvoiceDate || new Date().toLocaleDateString('en-GB'),
        supplierId: initialInvoice.supplierId || 'S-0001',
        supplierName: initialInvoice.supplierName || 'Supplier',
        city: initialInvoice.city || 'Local',
        state: initialInvoice.state || 'Kerala',
        contactNo: initialInvoice.contactNo || '',
        reverseCharges: initialInvoice.reverseCharges || 'No',
        items: (initialInvoice.items && initialInvoice.items.length > 0)
          ? initialInvoice.items.map((it: any) => ({
              hsnCode: it.hsnCode || it.hsn || '9403',
              productName: it.productName || it.name || 'Furniture Item',
              barcode: it.barcode || 'SKU-001',
              qtyBilled: it.qty || it.qtyBilled || 1,
              mrp: it.mrp || it.rate || 0,
              price: it.price || it.purchasePrice || it.rate || 0,
              discountPercent: it.discountPercent || 0,
              discountAmt: it.discountAmt || 0,
              cgstPercent: it.cgstPercent || 9,
              cgstAmt: it.cgstAmt || 0,
              sgstPercent: it.sgstPercent || 9,
              sgstAmt: it.sgstAmt || 0,
              total: it.total || it.netAmount || 0
            }))
          : [
              {
                hsnCode: '9403',
                productName: `${initialInvoice.supplierName || 'Supplier'} Inward Bill Items`,
                barcode: 'PUR-ITEM-1',
                qtyBilled: 1,
                mrp: initialInvoice.grandTotal || 0,
                price: initialInvoice.subTotal || initialInvoice.grandTotal || 0,
                discountPercent: 0,
                discountAmt: 0,
                cgstPercent: 9,
                cgstAmt: (initialInvoice.cgst || 0),
                sgstPercent: 9,
                sgstAmt: (initialInvoice.sgst || 0),
                total: initialInvoice.grandTotal || 0
              }
            ]
      };

      setSelectedInvoice(mappedInv);
      if (mappedInv.items.length > 0) {
        setReturnQuantity(mappedInv.items[0].qtyBilled);
        setReturnGrid(mappedInv.items.map(it => ({
          hsnCode: it.hsnCode,
          productName: it.productName,
          barcode: it.barcode,
          qty: it.qtyBilled,
          mrp: it.mrp,
          price: it.price,
          discountPercent: it.discountPercent,
          discountAmt: it.discountAmt,
          cgstPercent: it.cgstPercent,
          cgstAmt: it.cgstAmt,
          sgstPercent: it.sgstPercent,
          sgstAmt: it.sgstAmt,
          igstPercent: 0,
          igstAmt: 0,
          cessPercent: 0,
          cessAmt: 0,
          total: it.total
        })));
      }
    }
  }, [isOpen, initialInvoice]);

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
