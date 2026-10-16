import React, { useState, useEffect } from 'react';
import type { SaleReturnVoucher, SaleReturnItem, Product } from '../../types/retailDaddy';

interface SaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onSaveReturn: (voucher: SaleReturnVoucher) => void;
}

interface BillItem {
  hsn: string;
  name: string;
  barcode: string;
  qty: number;
  rate: number;
  discountPercent: number;
  discountAmt: number;
  taxableAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  igstPercent: number;
  igstAmt: number;
}

interface MockBill {
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  taxType: string;
  items: BillItem[];
}

// Seed historical bills for return lookup matching Video 13 Frames 0050 & 0060
const SAMPLE_BILLS: MockBill[] = [
  {
    invoiceNo: 'SVF-INV-0059',
    date: '26/02/2025',
    customerId: 'C-0001',
    customerName: 'Cash',
    taxType: 'GST',
    items: [
      {
        hsn: '94013000',
        name: 'Godrej Interio Motion High-Back Office Chair',
        barcode: '890111222001',
        qty: 1,
        rate: 14200.0,
        discountPercent: 0,
        discountAmt: 0,
        taxableAmt: 12033.90,
        cgstPercent: 9,
        cgstAmt: 1083.05,
        sgstPercent: 9,
        sgstAmt: 1083.05,
        igstPercent: 0,
        igstAmt: 0
      },
      {
        hsn: '83030000',
        name: 'Godrej Rhino Digital Home Safe 30L',
        barcode: '890111222009',
        qty: 1,
        rate: 13500.0,
        discountPercent: 0,
        discountAmt: 0,
        taxableAmt: 11440.68,
        cgstPercent: 9,
        cgstAmt: 1029.66,
        sgstPercent: 9,
        sgstAmt: 1029.66,
        igstPercent: 0,
        igstAmt: 0
      },
      {
        hsn: '94049000',
        name: 'Godrej Velvet Throw Cushions (Set of 2)',
        barcode: '890111222015',
        qty: 2,
        rate: 1200.0,
        discountPercent: 0,
        discountAmt: 0,
        taxableAmt: 2033.90,
        cgstPercent: 9,
        cgstAmt: 183.05,
        sgstPercent: 9,
        sgstAmt: 183.05,
        igstPercent: 0,
        igstAmt: 0
      }
    ]
  },
  {
    invoiceNo: 'SVF-INV-0054',
    date: '25/02/2025',
    customerId: 'C-0013',
    customerName: 'Mukesh Kumar',
    taxType: 'GST',
    items: [
      {
        hsn: '94031010',
        name: 'Godrej Interio Slimline 2-Door Steel Almirah (Russet Red)',
        barcode: '8901102',
        qty: 1,
        rate: 24200.0,
        discountPercent: 0,
        discountAmt: 0,
        taxableAmt: 20508.47,
        cgstPercent: 9,
        cgstAmt: 1845.76,
        sgstPercent: 9,
        sgstAmt: 1845.76,
        igstPercent: 0,
        igstAmt: 0
      }
    ]
  }
];

export const SaleReturnModal: React.FC<SaleReturnModalProps> = ({
  isOpen,
  onClose,
  products: _products = [],
  onSaveReturn
}) => {
  const [returnNo, setReturnNo] = useState('SVF-RET-0003');
  const [returnDate, setReturnDate] = useState('26/02/2025');
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('SVF-INV-0059');
  const [customerId, setCustomerId] = useState('C-0001');
  const [customerName, setCustomerName] = useState('Cash');
  const [taxType, setTaxType] = useState('GST');

  // Selected bill object
  const activeBill = SAMPLE_BILLS.find(b => b.invoiceNo === selectedInvoiceNo) || SAMPLE_BILLS[0];

  // Currently inspected line item from top grid
  const [selectedBillItem, setSelectedBillItem] = useState<BillItem | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);

  // Return voucher items (bottom grid)
  const [returnItems, setReturnItems] = useState<SaleReturnItem[]>([]);

  // Automatically select Acorn on initial load to match Video 13 Frame 0050
  useEffect(() => {
    if (activeBill && activeBill.items.length > 1) {
      setSelectedBillItem(activeBill.items[1]); // Acorn
      setReturnQty(1);
    }
  }, [selectedInvoiceNo]);

  if (!isOpen) return null;

  // Add selected item to return voucher
  const handleAddReturn = () => {
    if (!selectedBillItem || returnQty <= 0) return;

    if (returnQty > selectedBillItem.qty) {
      alert(`Cannot return ${returnQty} pcs. Maximum quantity purchased is ${selectedBillItem.qty}.`);
      return;
    }

    const unitPrice = selectedBillItem.rate;
    const lineTotal = unitPrice * returnQty;
    const taxable = (lineTotal / 1.12);
    const cgst = (taxable * (selectedBillItem.cgstPercent / 100));
    const sgst = (taxable * (selectedBillItem.sgstPercent / 100));

    const newItem: SaleReturnItem = {
      id: `ret-item-${Date.now()}`,
      productId: `prod-${selectedBillItem.barcode}`,
      pCode: 'P-1250',
      barcode: selectedBillItem.barcode,
      name: selectedBillItem.name,
      hsn: selectedBillItem.hsn,
      qty: returnQty,
      salesRate: unitPrice,
      discountPercent: 0,
      discountAmt: 0,
      taxableAmt: parseFloat(taxable.toFixed(2)),
      cgstPercent: selectedBillItem.cgstPercent,
      cgstAmt: parseFloat(cgst.toFixed(2)),
      sgstPercent: selectedBillItem.sgstPercent,
      sgstAmt: parseFloat(sgst.toFixed(2)),
      igstPercent: 0,
      igstAmt: 0,
      total: parseFloat(lineTotal.toFixed(2))
    };

    setReturnItems(prev => {
      // replace if same barcode or append
      const filtered = prev.filter(i => i.barcode !== newItem.barcode);
      return [...filtered, newItem];
    });
  };

  const handleRemoveReturn = () => {
    if (!selectedBillItem) return;
    setReturnItems(prev => prev.filter(i => i.barcode !== selectedBillItem.barcode));
  };

  const totalReturnAmt = returnItems.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    if (returnItems.length === 0) {
      alert('Please add at least one item to return before saving.');
      return;
    }

    const voucher: SaleReturnVoucher = {
      id: `ret-${Date.now()}`,
      returnNo,
      date: returnDate,
      taxType,
      originalInvoiceNo: selectedInvoiceNo,
      customerId,
      customerName,
      items: returnItems,
      billDiscount: 0,
      total: totalReturnAmt,
      roundOff: 0,
      grandTotal: totalReturnAmt,
      paymentMode: 'Cash',
      status: 'ACTIVE'
    };

    onSaveReturn(voucher);
    alert(`✓ Record Successfully Saved!\n\nReturn Voucher Number: ${returnNo}\nTotal Return Credit: ₹${totalReturnAmt.toFixed(2)}\n\nThis credit is now ready to be adjusted in the POS Pay Tab.`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '96vw',
          maxWidth: '1280px',
          height: '92vh',
          backgroundColor: '#0055aa',
          border: '2px solid #003366',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (1:1 Frame 0060) */}
        <div
          style={{
            backgroundColor: '#003b80',
            color: '#ffffff',
            padding: '5px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>SALE RETURN (Credit Note)</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#dc2626',
                border: 'none',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '1px 8px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Top Information Control Strip (1:1 Frame 0060) */}
        <div
          style={{
            backgroundColor: '#dbeafe',
            padding: '6px 12px',
            borderBottom: '1px solid #93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Sales Return Sr No Info</span>
            <input
              type="text"
              value={returnNo}
              onChange={e => setReturnNo(e.target.value)}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                padding: '2px 6px',
                border: '1px solid #1e3a8a',
                fontSize: '11px',
                width: '145px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Date</span>
            <input
              type="text"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              style={{ width: '80px', padding: '2px 4px', fontSize: '11px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Tax Type</span>
            <select
              value={taxType}
              onChange={e => setTaxType(e.target.value)}
              style={{ padding: '2px', fontSize: '11px', width: '65px' }}
            >
              <option value="GST">GST</option>
              <option value="VAT">VAT</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Sales Invoice No Info</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <select
                value={selectedInvoiceNo}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedInvoiceNo(val);
                  const matched = SAMPLE_BILLS.find(b => b.invoiceNo === val);
                  if (matched) {
                    setCustomerId(matched.customerId);
                    setCustomerName(matched.customerName);
                    setTaxType(matched.taxType);
                    setSelectedBillItem(matched.items[0] || null);
                  }
                }}
                style={{
                  padding: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  width: '145px'
                }}
              >
                {SAMPLE_BILLS.map(b => (
                  <option key={b.invoiceNo} value={b.invoiceNo}>
                    {b.invoiceNo}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '1px 6px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                🔍
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Customer ID</span>
            <input
              type="text"
              readOnly
              value={activeBill.customerId}
              style={{
                width: '75px',
                padding: '2px 4px',
                fontSize: '11px',
                backgroundColor: '#f1f5f9',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Invoice Date</span>
            <input
              type="text"
              readOnly
              value={activeBill.date}
              style={{ width: '80px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f1f5f9' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Customer Name</span>
            <input
              type="text"
              readOnly
              value={activeBill.customerName}
              style={{ width: '130px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f1f5f9' }}
            />
          </div>

          {/* Navigation Controls */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
            {['|<<', '<', '>', '>>|'].map(b => (
              <button
                key={b}
                type="button"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '2px 7px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Main Body: Grids + Action Sidebar */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Grids and Controls Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            {/* Top Grid: Original Sales Bill Items (1:1 Frame 0050 & 0060) */}
            <div style={{ flex: 1.1, overflow: 'auto', borderBottom: '2px solid #cbd5e1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', backgroundColor: '#ffffff' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ backgroundColor: '#991b1b', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 4px', width: '30px' }}>#</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '70px' }}>HSN Code</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px' }}>Product Name</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '80px' }}>Barcode</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '55px', textAlign: 'right' }}>Qty.</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '85px', textAlign: 'right' }}>Price / Main Unit</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '65px', textAlign: 'right' }}>Discount %</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '65px', textAlign: 'right' }}>Discount</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '55px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '70px', textAlign: 'right' }}>CGST Amt</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '55px', textAlign: 'right' }}>SGST %</th>
                    <th style={{ border: '1px solid #7f1d1d', padding: '3px 6px', width: '70px', textAlign: 'right' }}>SGST Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBill.items.map((item, idx) => {
                    const isSelected = selectedBillItem?.barcode === item.barcode;
                    return (
                      <tr
                        key={item.barcode}
                        onClick={() => {
                          setSelectedBillItem(item);
                          setReturnQty(1);
                        }}
                        style={{
                          backgroundColor: isSelected ? '#dc2626' : idx % 2 === 0 ? '#fef2f2' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#000000',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{item.hsn}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{item.name}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', fontFamily: 'monospace' }}>{item.barcode}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.qty.toFixed(3)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.discountPercent.toFixed(4)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.discountAmt.toFixed(2)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.cgstPercent.toFixed(2)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.cgstAmt.toFixed(2)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.sgstPercent.toFixed(2)}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{item.sgstAmt.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Middle Item Inspection & Return Selection Strip (1:1 Frame 0050 & 0060) */}
            <div style={{ backgroundColor: '#e2e8f0', padding: '8px 12px', borderBottom: '2px solid #94a3b8', fontSize: '11px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>HSN Code :</span>
                  <input type="text" readOnly value={selectedBillItem?.hsn || ''} style={{ width: '70px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Product Name :</span>
                  <input type="text" readOnly value={selectedBillItem?.name || ''} style={{ width: '130px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc', fontWeight: 'bold' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Barcode :</span>
                  <input type="text" readOnly value={selectedBillItem?.barcode || ''} style={{ width: '85px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc', fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Quantity :</span>
                  <input type="text" readOnly value={selectedBillItem?.qty || 0} style={{ width: '45px', textAlign: 'center', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Free Qty :</span>
                  <input type="text" readOnly value="0" style={{ width: '35px', textAlign: 'center', padding: '2px 4px', fontSize: '11px', backgroundColor: '#ffffcc' }} />
                  <span>PCS</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Sale Tax Type :</span>
                  <input type="text" readOnly value="Inclusive" style={{ width: '75px', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc' }} />
                </div>
              </div>

              {/* Rates and Tax Details Strip */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>Price / Main Unit :</span>
                  <input type="text" readOnly value={selectedBillItem ? selectedBillItem.rate.toFixed(2) : '0.00'} style={{ width: '75px', padding: '2px 4px', textAlign: 'right', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>Taxable Amt :</span>
                  <input type="text" readOnly value={selectedBillItem ? selectedBillItem.taxableAmt.toFixed(2) : '0.00'} style={{ width: '85px', padding: '2px 4px', textAlign: 'right', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>CGST :</span>
                  <input type="text" readOnly value="6.00 %" style={{ width: '55px', padding: '2px 4px', textAlign: 'center', fontSize: '11px' }} />
                  <input type="text" readOnly value={selectedBillItem ? selectedBillItem.cgstAmt.toFixed(2) : '0.00'} style={{ width: '65px', padding: '2px 4px', textAlign: 'right', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>SGST/UTGST :</span>
                  <input type="text" readOnly value="6.00 %" style={{ width: '55px', padding: '2px 4px', textAlign: 'center', fontSize: '11px' }} />
                  <input type="text" readOnly value={selectedBillItem ? selectedBillItem.sgstAmt.toFixed(2) : '0.00'} style={{ width: '65px', padding: '2px 4px', textAlign: 'right', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>IGST :</span>
                  <input type="text" readOnly value="0.00 %" style={{ width: '55px', padding: '2px 4px', textAlign: 'center', fontSize: '11px' }} />
                  <input type="text" readOnly value="0.00" style={{ width: '55px', padding: '2px 4px', textAlign: 'right', fontSize: '11px' }} />
                </div>
              </div>

              {/* Return Action: Qty Input + Add Button (1:1 Frame 0050 & 0060) */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#991b1b' }}>Return Qty :</span>
                <input
                  type="number"
                  min="1"
                  max={selectedBillItem?.qty || 1}
                  value={returnQty}
                  onChange={e => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '75px',
                    backgroundColor: '#ffffcc',
                    border: '1.5px solid #0284c7',
                    padding: '4px 6px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                />
                <input
                  type="text"
                  readOnly
                  value={selectedBillItem ? (selectedBillItem.rate * returnQty).toFixed(2) : '0.00'}
                  style={{
                    width: '90px',
                    padding: '4px 6px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                />

                <button
                  type="button"
                  onClick={handleAddReturn}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 14px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>➕</span> Add
                </button>

                <button
                  type="button"
                  onClick={handleRemoveReturn}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 14px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>➖</span> Remove
                </button>
              </div>
            </div>

            {/* Bottom Grid: Returned Items Table (1:1 Frame 0060) */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 4px', width: '30px' }}>#</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '70px' }}>HSN Code</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px' }}>Product Name</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '80px' }}>Barcode</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '55px', textAlign: 'right' }}>Qty.</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '85px', textAlign: 'right' }}>Sales Rate</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '65px', textAlign: 'right' }}>Discount %</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '65px', textAlign: 'right' }}>Discount</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '55px', textAlign: 'right' }}>CGST %</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '70px', textAlign: 'right' }}>CGST Amt</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '55px', textAlign: 'right' }}>SGST %</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '70px', textAlign: 'right' }}>SGST Amt</th>
                    <th style={{ border: '1px solid #1e40af', padding: '3px 6px', width: '85px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No items added to return voucher yet. Select an item from the top grid and click [+ Add].
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#eff6ff' : '#ffffff' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px' }}>{item.hsn}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', fontWeight: 'bold' }}>{item.name}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', fontFamily: 'monospace' }}>{item.barcode}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.salesRate.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.discountPercent.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.discountAmt.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.cgstPercent.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.cgstAmt.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.sgstPercent.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right' }}>{item.sgstAmt.toFixed(2)}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>{item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Totals Bar (1:1 Frame 0060) */}
            <div style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #cbd5e1', padding: '6px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Bill Discount :</span>
                <input type="text" readOnly value="0.00" style={{ width: '65px', textAlign: 'right', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Total :</span>
                <input type="text" readOnly value={totalReturnAmt.toFixed(2)} style={{ width: '85px', textAlign: 'right', padding: '2px 4px', fontSize: '11px', backgroundColor: '#ffffcc', fontWeight: 'bold' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                  <input type="checkbox" />
                  <span>Round Off :</span>
                </label>
                <input type="text" readOnly value="0.00" style={{ width: '60px', textAlign: 'right', padding: '2px 4px', fontSize: '11px', backgroundColor: '#f8fafc' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#991b1b' }}>Grand Total :</span>
                <input
                  type="text"
                  readOnly
                  value={totalReturnAmt.toFixed(2)}
                  style={{
                    width: '100px',
                    textAlign: 'right',
                    padding: '3px 6px',
                    fontSize: '14px',
                    fontWeight: '900',
                    backgroundColor: '#ffffcc',
                    color: '#991b1b',
                    border: '1.5px solid #dc2626'
                  }}
                />
              </div>

              <button
                type="button"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 12px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Payment Mode
              </button>
            </div>
          </div>

          {/* Action Sidebar Buttons (Right Column 1:1 Frame 0060) */}
          <div
            style={{
              width: '130px',
              backgroundColor: '#0055aa',
              padding: '10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderLeft: '2px solid #003b80'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setReturnItems([]);
                setReturnNo(`SHIB-${String(Math.floor(Math.random() * 9000 + 1000))}-2024/25`);
              }}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: '1px solid #1e40af',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              New
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: '1px solid #15803d',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this return voucher?')) {
                  setReturnItems([]);
                }
              }}
              style={{
                backgroundColor: '#64748b',
                color: '#ffffff',
                border: '1px solid #475569',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeBill && activeBill.items.length > 0) {
                  setSelectedBillItem(activeBill.items[0]);
                  setReturnQty(1);
                  setCustomerName(activeBill.customerName);
                  setCustomerId(activeBill.customerId);
                }
              }}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #0369a1',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: '1px solid #020617',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer',
                marginTop: 'auto'
              }}
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
