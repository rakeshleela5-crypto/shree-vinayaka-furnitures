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
  purchaseRecords?: any[];
  onProcessPurchaseReturn: (debitNote: PurchaseReturnDebitNote) => void;
  initialInvoice?: any;
}

const DEFAULT_PURCHASE_INVOICES: PurchaseInvoiceSummary[] = [
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
  },
  {
    invoiceNo: 'NTG-PUR-2026/102',
    invoiceDate: new Date().toLocaleDateString('en-GB'),
    supplierId: 'S-0003',
    supplierName: 'Nilambur Teak Craft Guild',
    city: 'Malappuram',
    state: 'Kerala',
    contactNo: '9847098765',
    reverseCharges: 'No',
    items: [
      {
        hsnCode: '9403',
        productName: 'Solid Teak Wood 6-Seater Dining Table',
        barcode: '8901103',
        qtyBilled: 3.0,
        mrp: 52000.0,
        price: 39000.0,
        discountPercent: 0,
        discountAmt: 0,
        cgstPercent: 9.0,
        cgstAmt: 3510.0,
        sgstPercent: 9.0,
        sgstAmt: 3510.0,
        total: 46020.0
      }
    ]
  }
];

const mapRecordsToPurchaseInvoices = (records: any[]): PurchaseInvoiceSummary[] => {
  const grouped: { [invNo: string]: PurchaseInvoiceSummary } = {};
  records.forEach((r: any) => {
    const invNo = r.invoiceNo || r.supplierInvoiceNo || `PINV-${r.id || '101'}`;
    if (!grouped[invNo]) {
      grouped[invNo] = {
        invoiceNo: invNo,
        invoiceDate: r.invoiceDate || r.date || new Date().toLocaleDateString('en-GB'),
        supplierId: r.supplierId || (r.supplier?.id) || 'S-0001',
        supplierName: r.supplierName || (r.supplier?.name) || 'Godrej & Boyce Mfg. Co. Ltd.',
        city: r.city || 'Kozhikode',
        state: r.state || 'Kerala',
        contactNo: r.contactNo || (r.supplier?.phone) || '9847012345',
        reverseCharges: r.reverseCharges || 'No',
        items: []
      };
    }
    const qty = Number(r.qty || r.quantity || 1);
    const price = Number(r.purchasePrice || r.price || r.rate || 0);
    const cgstP = Number(r.cgstPercent ?? 9.0);
    const sgstP = Number(r.sgstPercent ?? 9.0);
    const baseAmt = qty * price;
    const cgstAmt = Number(((baseAmt * cgstP) / 100).toFixed(2));
    const sgstAmt = Number(((baseAmt * sgstP) / 100).toFixed(2));
    grouped[invNo].items.push({
      hsnCode: r.hsnCode || r.hsn || '9403',
      productName: r.productName || r.name || 'Furniture Item',
      barcode: r.barcode || '8901101',
      qtyBilled: qty,
      mrp: Number(r.mrp || (price * 1.3)),
      price,
      discountPercent: Number(r.discountPercent || 0),
      discountAmt: Number(r.discountAmt || 0),
      cgstPercent: cgstP,
      cgstAmt,
      sgstPercent: sgstP,
      sgstAmt,
      total: Number((baseAmt + cgstAmt + sgstAmt).toFixed(2))
    });
  });
  return Object.values(grouped);
};

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products,
  purchaseRecords,
  onProcessPurchaseReturn,
  initialInvoice
}) => {
  // Furniture purchase invoices
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceSummary[]>(DEFAULT_PURCHASE_INVOICES);

  // Invoice selection & return state
  const [showPurchaseInvoicePicker, setShowPurchaseInvoicePicker] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoiceSummary>(DEFAULT_PURCHASE_INVOICES[0]);

  const [prNo] = useState(() => {
    const d = new Date();
    const fy = d.getMonth() >= 3 ? `${d.getFullYear().toString().slice(-2)}${(d.getFullYear() + 1).toString().slice(-2)}` : `${(d.getFullYear() - 1).toString().slice(-2)}${d.getFullYear().toString().slice(-2)}`;
    return `PR-${fy}-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [prDate] = useState(() => new Date().toLocaleDateString('en-GB'));
  const [taxType] = useState('GST');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);

  // Load purchase invoices from props, localStorage, and Railway PostgreSQL
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    let initial: PurchaseInvoiceSummary[] = [];

    // 1. From props (purchaseRecords in App.tsx)
    if (purchaseRecords && purchaseRecords.length > 0) {
      initial = [...mapRecordsToPurchaseInvoices(purchaseRecords)];
    }

    // 2. From localStorage
    try {
      const savedPR = localStorage.getItem('rd_purchase_records');
      if (savedPR) {
        const parsed = JSON.parse(savedPR);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mappedSaved = mapRecordsToPurchaseInvoices(parsed);
          mappedSaved.forEach(sp => {
            if (!initial.some(x => x.invoiceNo === sp.invoiceNo)) {
              initial.push(sp);
            }
          });
        }
      }
    } catch {}

    // 3. Fallback defaults so invoice picker is NEVER empty
    DEFAULT_PURCHASE_INVOICES.forEach(df => {
      if (!initial.some(x => x.invoiceNo === df.invoiceNo)) {
        initial.push(df);
      }
    });

    if (isMounted) {
      setPurchaseInvoices(initial);
      if (!initialInvoice && initial.length > 0) {
        setSelectedInvoice(initial[0]);
        if (initial[0].items.length > 0) {
          const firstIt = initial[0].items[0];
          const qty = Math.max(1, Math.min(firstIt.qtyBilled, 1));
          setReturnQuantity(qty);
          const base = qty * firstIt.price;
          const cAmt = Number(((base * firstIt.cgstPercent) / 100).toFixed(2));
          const sAmt = Number(((base * firstIt.sgstPercent) / 100).toFixed(2));
          setReturnGrid([{
            hsnCode: firstIt.hsnCode,
            productName: firstIt.productName,
            barcode: firstIt.barcode,
            qty,
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
    }

    // 4. Fetch live from FastAPI / PostgreSQL backend
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
      setPurchaseInvoices(prev => {
        const combined = [...mapped];
        prev.forEach(p => {
          if (!combined.some(c => c.invoiceNo === p.invoiceNo)) {
            combined.push(p);
          }
        });
        return combined;
      });
    }).catch(err => {
      console.warn("Using offline purchase invoices fallback:", err);
    });
    return () => { isMounted = false; };
  }, [isOpen, purchaseRecords, initialInvoice]);

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
      const defaultQty = Math.max(1, Math.min(inv.items[0].qtyBilled, 1));
      setReturnQuantity(defaultQty);
      setReturnGrid(
        inv.items.map(it => {
          const qty = Math.max(1, Math.min(it.qtyBilled, 1));
          const baseAmt = qty * it.price;
          const cAmt = Number(((baseAmt * it.cgstPercent) / 100).toFixed(2));
          const sAmt = Number(((baseAmt * it.sgstPercent) / 100).toFixed(2));
          return {
            hsnCode: it.hsnCode,
            productName: it.productName,
            barcode: it.barcode,
            qty,
            mrp: it.mrp,
            price: it.price,
            discountPercent: it.discountPercent || 0,
            discountAmt: 0,
            cgstPercent: it.cgstPercent,
            cgstAmt: cAmt,
            sgstPercent: it.sgstPercent,
            sgstAmt: sAmt,
            igstPercent: 0,
            igstAmt: 0,
            cessPercent: 0,
            cessAmt: 0,
            total: Number((baseAmt + cAmt + sAmt).toFixed(2))
          };
        })
      );
      showToast(`✓ Inward purchase invoice ${inv.invoiceNo} loaded. Review and save.`);
    }
  };

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateReturnQty = (index: number, newQty: number) => {
    setReturnGrid(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const matchedInvItem = selectedInvoice?.items.find(
          it => it.barcode === item.barcode || it.productName === item.productName
        );
        const maxQty = matchedInvItem ? matchedInvItem.qtyBilled : 999;
        const boundedQty = Math.max(1, Math.min(newQty, maxQty));
        const baseAmt = boundedQty * item.price;
        const cAmt = Number(((baseAmt * item.cgstPercent) / 100).toFixed(2));
        const sAmt = Number(((baseAmt * item.sgstPercent) / 100).toFixed(2));
        return {
          ...item,
          qty: boundedQty,
          cgstAmt: cAmt,
          sgstAmt: sAmt,
          total: Number((baseAmt + cAmt + sAmt).toFixed(2))
        };
      })
    );
  };

  const handleRemoveReturnRow = (index: number) => {
    setReturnGrid(prev => prev.filter((_, idx) => idx !== index));
    showToast('Item removed from Debit Note.');
  };

  const handleAddReturnItem = () => {
    if (!selectedInvoice || selectedInvoice.items.length === 0) return;
    const billedItem = selectedInvoice.items[0];

    if (returnQuantity <= 0 || returnQuantity > billedItem.qtyBilled) {
      showToast(`⚠️ Invalid return quantity. Maximum billed quantity is ${billedItem.qtyBilled}`);
      return;
    }

    const baseAmount = returnQuantity * billedItem.price;
    const cgstAmt = Number(((baseAmount * billedItem.cgstPercent) / 100).toFixed(2));
    const sgstAmt = Number(((baseAmount * billedItem.sgstPercent) / 100).toFixed(2));
    const lineTotal = Number((baseAmount + cgstAmt + sgstAmt).toFixed(2));

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
    showToast('✓ Return item added.');
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
      originalInvoiceNo: selectedInvoice?.invoiceNo || 'PINV-001',
      reverseCharges: selectedInvoice?.reverseCharges || 'No',
      supplierId: selectedInvoice?.supplierId || 'S-0001',
      supplierName: selectedInvoice?.supplierName || 'Supplier',
      city: selectedInvoice?.city || 'Local',
      state: selectedInvoice?.state || 'Kerala',
      contactNo: selectedInvoice?.contactNo || '',
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
          maxWidth: '1280px',
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

        {/* TOP 3-COLUMN METADATA HEADER (Frame 0225) - Responsive wrap on mobile */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1.2fr 1.3fr 1.5fr',
            gap: '10px',
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
                value={selectedInvoice?.invoiceNo || ''}
                style={{ flex: 1, height: '22px', border: '1px solid #94a3b8', padding: '1px 6px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
              />
              <button
                type="button"
                onClick={() => setShowPurchaseInvoicePicker(true)}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔍 Browse Bills
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Reverse Charges :</span>
              <span style={{ fontWeight: 'bold' }}>{selectedInvoice?.reverseCharges || 'No'}</span>
            </div>
          </div>

          {/* Box 3: Supplier Information */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>Supplier Information</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Supplier:</span>
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
                {selectedInvoice?.supplierId || 'S-0001'} - {selectedInvoice?.supplierName || 'Supplier'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Branch / State:</span>
              <span>{selectedInvoice?.city || 'Local'}, {selectedInvoice?.state || 'Kerala'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Contact:</span>
              <span>{selectedInvoice?.contactNo || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE & SETTLEMENT - Responsive column on mobile */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            overflowY: 'auto',
            minHeight: 0
          }}
        >
          {/* LEFT TABLES */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px', gap: '8px', overflowY: 'auto' }}>
            {/* Top Original Purchase Invoice Items Table (Frame 0225: Purple/Crimson Header) */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#7e22ce', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>Original Inward Purchase Invoice Line Items ({selectedInvoice?.invoiceNo || 'N/A'})</span>
                <span style={{ color: '#fef08a' }}>Supplier: {selectedInvoice?.supplierName || 'Supplier'}</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '130px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#800000', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '5px 8px' }}>HSN Code</th>
                      <th style={{ padding: '5px 8px' }}>Product Name</th>
                      <th style={{ padding: '5px 8px' }}>Barcode</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>Qty Billed</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>MRP</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>Purchase Price</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST Amt</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice?.items || []).map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 8px' }}>{item.hsnCode}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{item.productName}</td>
                        <td style={{ padding: '5px 8px' }}>{item.barcode}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{item.qtyBilled.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{item.mrp.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{item.price.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.cgstPercent.toFixed(1)}%</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{item.cgstAmt.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Middle Return Adjustment Row (Frame 0225) */}
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
                max={selectedInvoice?.items?.[0]?.qtyBilled || 100}
                value={returnQuantity}
                onChange={e => setReturnQuantity(Number(e.target.value))}
                style={{
                  height: '28px',
                  width: '80px',
                  border: '1px solid #dc2626',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  backgroundColor: '#fef08a'
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
                <span>➕</span> Add / Reset
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
                <span>🗑️</span> Clear All
              </button>

              {returnGrid.length > 0 && (
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold', marginLeft: 'auto' }}>
                  ✓ {returnGrid.length} item(s) in Debit Note (Reduces supplier payable balance)
                </span>
              )}
            </div>

            {/* Bottom Active Return Grid (Frame 0225: Yellow Highlighted Table) */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'auto', minHeight: '160px' }}>
              <div style={{ backgroundColor: '#003366', color: '#ffffff', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>Items in Debit Note (Purchase Return Grid)</span>
                <span style={{ fontSize: '10px', color: '#93c5fd' }}>Edit returned quantity directly below</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#002b66', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px', width: '35px' }}>#</th>
                    <th style={{ padding: '5px 8px' }}>HSN Code</th>
                    <th style={{ padding: '5px 8px' }}>Product Name</th>
                    <th style={{ padding: '5px 8px' }}>Barcode</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Return Qty</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST Amt</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total Debit</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {returnGrid.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No items added to debit note. Click &quot;🔍 Browse Bills&quot; above to select an inward invoice.
                      </td>
                    </tr>
                  ) : (
                    returnGrid.map((row, idx) => {
                      const matchedItem = (selectedInvoice?.items || []).find(
                        it => it.barcode === row.barcode || it.productName === row.productName
                      );
                      const maxQty = matchedItem ? matchedItem.qtyBilled : 999;
                      return (
                        <tr key={idx} style={{ backgroundColor: '#fef08a', borderBottom: '1px solid #fef9c3', fontWeight: 'bold' }}>
                          <td style={{ padding: '5px 8px', color: '#dc2626' }}>▷ {idx + 1}</td>
                          <td style={{ padding: '5px 8px' }}>{row.hsnCode}</td>
                          <td style={{ padding: '5px 8px', color: '#0f172a' }}>{row.productName}</td>
                          <td style={{ padding: '5px 8px' }}>{row.barcode}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                            <input
                              type="number"
                              min={1}
                              max={maxQty}
                              value={row.qty}
                              onChange={e => handleUpdateReturnQty(idx, Number(e.target.value))}
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
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{row.price.toFixed(0)}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>{row.cgstPercent.toFixed(0)}%</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{row.cgstAmt.toFixed(2)}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontSize: '12px' }}>
                            ₹{row.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveReturnRow(idx)}
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

          {/* RIGHT SIDEBAR SETTLEMENT (Frame 0225) */}
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
            {/* Sidebar Command Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setReturnGrid([]);
                  setShowPurchaseInvoicePicker(true);
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
                🔄 Select Another Inward Bill
              </button>

              <button
                type="button"
                onClick={handleSavePurchaseReturn}
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
                💾 Save Debit Note
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
                <span style={{ color: '#475569', fontWeight: 'bold' }}>Items Total:</span>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>₹{subTotal.toFixed(0)}</span>
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
                <span>Debit Note Total:</span>
                <span>₹{grandTotal.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>Refund Settlement Mode:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['Cash', 'Bank'] as const).map(mode => (
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

        {/* PURCHASE INVOICE BROWSE DIALOG */}
        {showPurchaseInvoicePicker && (
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '5%',
              width: '90%',
              height: '90%',
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
                padding: '8px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              <span>Select Supplier Inward Purchase Bill (Click row to load into Debit Note)</span>
              <button
                onClick={() => setShowPurchaseInvoicePicker(false)}
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '3px 10px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '2px' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '6px' }}>Invoice No</th>
                    <th style={{ padding: '6px' }}>Date</th>
                    <th style={{ padding: '6px' }}>Supplier</th>
                    <th style={{ padding: '6px' }}>Product</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Qty Billed</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No inward purchase bills recorded.
                      </td>
                    </tr>
                  ) : (
                    purchaseInvoices.map((inv, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleSelectInvoice(inv)}
                        style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc')}
                      >
                        <td style={{ padding: '6px', fontWeight: 'bold', color: '#1e40af' }}>{inv.invoiceNo}</td>
                        <td style={{ padding: '6px' }}>{inv.invoiceDate}</td>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{inv.supplierName}</td>
                        <td style={{ padding: '6px' }}>{inv.items[0]?.productName}</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{inv.items[0]?.qtyBilled}</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>₹{inv.items[0]?.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

