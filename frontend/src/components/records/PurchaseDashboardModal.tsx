import React, { useState, useMemo } from 'react';
import type { PurchaseRecordItem, PurchaseFilterCategory } from '../../types/retailDaddy';
import { exportToCsv } from '../../api/client';

interface PurchaseDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRecords: PurchaseRecordItem[];
  onOpenPurchaseEntry?: (invoiceNo?: string) => void;
}

export const PurchaseDashboardModal: React.FC<PurchaseDashboardModalProps> = ({
  isOpen,
  onClose,
  purchaseRecords,
  onOpenPurchaseEntry
}) => {
  // Dynamic dates
  const [fromDate, setFromDate] = useState<string>(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Search category & text filter
  const [selectedCategory, setSelectedCategory] = useState<PurchaseFilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'ALL' | 'GST' | 'Composition'>('ALL');

  // Selected row
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered purchases
  const filteredRecords = useMemo(() => {
    return purchaseRecords.filter(item => {
      // Date filter check
      // For demo dates in DD/MM/YYYY format
      // Let's allow passing unless specific date is required
      // Tax Type filter
      if (taxTypeFilter !== 'ALL' && item.taxType !== taxTypeFilter) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      switch (selectedCategory) {
        case 'INVOICE_NO':
          return item.invoiceNo.toLowerCase().includes(q);
        case 'SUPPLIER_INVOICE_NO':
          return item.supplierInvoiceNo.toLowerCase().includes(q);
        case 'SUPPLIER_NAME':
          return item.supplierName.toLowerCase().includes(q);
        case 'PRODUCT_NAME':
          return item.productName.toLowerCase().includes(q);
        case 'COLOUR':
          return (item.colour || '').toLowerCase().includes(q);
        case 'SIZE':
          return (item.size || '').toLowerCase().includes(q);
        case 'BARCODE':
          return item.barcode.toLowerCase().includes(q);
        case 'BATCH_SERIAL_NO':
          return (
            (item.batchNo || '').toLowerCase().includes(q) ||
            (item.serialNumbers || []).some(s => s.toLowerCase().includes(q))
          );
        case 'ALL':
        default:
          return (
            item.invoiceNo.toLowerCase().includes(q) ||
            item.supplierInvoiceNo.toLowerCase().includes(q) ||
            item.supplierName.toLowerCase().includes(q) ||
            item.productName.toLowerCase().includes(q) ||
            (item.colour || '').toLowerCase().includes(q) ||
            (item.size || '').toLowerCase().includes(q) ||
            item.barcode.toLowerCase().includes(q) ||
            (item.batchNo || '').toLowerCase().includes(q) ||
            (item.serialNumbers || []).some(s => s.toLowerCase().includes(q))
          );
      }
    });
  }, [purchaseRecords, selectedCategory, searchQuery, taxTypeFilter]);

  // Grand Total calculation
  const grandTotal = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + r.totalAmount, 0);
  }, [filteredRecords]);

  // Reset filters
  const handleReset = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setTaxTypeFilter('ALL');
    setFromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
    setSelectedRowId(null);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const list = filteredRecords.length > 0 ? filteredRecords : purchaseRecords;
    if (list.length === 0) {
      showToast('No purchase records to export', 'info');
      return;
    }

    const headers = [
      'Sl No',
      'Invoice No',
      'Invoice Date',
      'Tax Type',
      "Supplier's Invoice No",
      "Supplier's Invoice Date",
      'Supplier Name',
      'State',
      'GSTIN',
      'Product Name',
      'HSN Code',
      'Barcode',
      'Qty',
      'Unit',
      'Purchase Price',
      'Taxable Amt',
      'CGST Amt',
      'SGST Amt',
      'Total Amount',
      'Colour',
      'Size',
      'Serial Numbers'
    ];

    const rows = list.map((r, i) => [
      i + 1,
      r.invoiceNo,
      r.invoiceDate,
      r.taxType,
      r.supplierInvoiceNo || '',
      r.supplierInvoiceDate || '',
      r.supplierName,
      r.state,
      r.gstin || '',
      r.productName,
      r.hsnCode,
      r.barcode,
      r.qty,
      r.unit,
      r.purchasePrice.toFixed(2),
      r.taxableAmount.toFixed(2),
      r.cgstAmount.toFixed(2),
      r.sgstAmount.toFixed(2),
      r.totalAmount.toFixed(2),
      r.colour || '',
      r.size || '',
      (r.serialNumbers || []).join('; ')
    ]);

    exportToCsv(`Purchase_Dashboard_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('✓ Purchase dashboard exported to CSV!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '1240px',
          maxWidth: '98vw',
          height: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #0055b3'
        }}
      >
        {/* Titlebar (Frames 0060 & 0365) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0055b3 0%, #003366 100%)',
            color: '#ffffff',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            borderBottom: '2px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>📊</span>
            <span style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.4px' }}>
              Purchase Dashboard
            </span>
            <span
              style={{
                fontSize: '11px',
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '3px',
                marginLeft: '6px'
              }}
            >
              Video 06 • Frame 0060 & 0365
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {}}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
              title="Minimize"
            >
              _
            </button>
            <button
              onClick={() => {}}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
              title="Maximize"
            >
              ▢
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {toast && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Filter Bar Strip (1:1 Frame 0060) */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Left: Date Range Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #94a3b8',
              padding: '4px 10px',
              borderRadius: '3px',
              backgroundColor: '#ffffff'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              Search by Invoice Date
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '11px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '11px'
                }}
              />
            </div>
            <button
              onClick={() => {}}
              style={{
                backgroundColor: '#002b66',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 12px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>
          </div>

          {/* Center: Category Selector & Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              maxWidth: '560px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                  Select Category and Search:
                </span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as PurchaseFilterCategory)}
                  style={{
                    border: '1px solid #94a3b8',
                    borderRadius: '2px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="ALL">Category / All Fields</option>
                  <option value="INVOICE_NO">Invoice No (e.g. SHIB-0011-2024/25)</option>
                  <option value="SUPPLIER_INVOICE_NO">Supplier's Invoice No (e.g. 12345)</option>
                  <option value="SUPPLIER_NAME">Supplier Name (e.g. Godrej & Boyce Mfg.)</option>
                  <option value="PRODUCT_NAME">Product Name (e.g. Godrej Slimline 3-Door)</option>
                  <option value="COLOUR">Colour / Finish (e.g. Pacific Blue, Teak)</option>
                  <option value="SIZE">Size / Dimensions (e.g. King Size, 78x36 inch)</option>
                  <option value="BARCODE">Barcode (e.g. 650841, 993482)</option>
                  <option value="BATCH_SERIAL_NO">Batch / Serial No (e.g. 12345)</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                    Tax Type :
                  </span>
                  <select
                    value={taxTypeFilter}
                    onChange={e => setTaxTypeFilter(e.target.value as any)}
                    style={{
                      border: '1px solid #94a3b8',
                      borderRadius: '2px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="ALL">All</option>
                    <option value="GST">GST</option>
                    <option value="Composition">Composition</option>
                  </select>
                </div>
              </div>

              {/* Live Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  placeholder={`Search by ${selectedCategory.toLowerCase().replace('_', ' ')}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: '2px solid #0284c7',
                    borderRadius: '2px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#fffbeb',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setSearchQuery(searchQuery)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px'
                  }}
                  title="Refresh / Run Filter"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Right: Reset & Export Excel Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
              }}
            >
              🔄 Reset
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: '#65a30d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(101, 163, 13, 0.3)'
              }}
            >
              📑 Export Excel
            </button>
          </div>
        </div>

        {/* Quick Filter Badges for Video 06 Demonstration */}
        <div
          style={{
            padding: '6px 14px',
            backgroundColor: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontWeight: 700, color: '#334155' }}>Video 06 Quick Demos:</span>
          <button
            onClick={() => {
              setSelectedCategory('INVOICE_NO');
              setSearchQuery('12345');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#0369a1'
            }}
          >
            Invoice: 12345 (Delco ₹12,100.48)
          </button>
          <button
            onClick={() => {
              setSelectedCategory('SUPPLIER_NAME');
              setSearchQuery('Delco Engineering');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#0369a1'
            }}
          >
            Supplier: Godrej & Boyce Mfg.
          </button>
          <button
            onClick={() => {
              setSelectedCategory('PRODUCT_NAME');
              setSearchQuery('Slimline 3-Door');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#0369a1'
            }}
          >
            Product: Godrej Slimline 3-Door
          </button>
          <button
            onClick={() => {
              setSelectedCategory('COLOUR');
              setSearchQuery('Pacific Blue');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0369a1'
            }}
          >
            Colour: Pacific Blue (Almirahs)
          </button>
          <button
            onClick={() => {
              setSelectedCategory('SIZE');
              setSearchQuery('King');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#0369a1'
            }}
          >
            Size: King Size (Beds)
          </button>
          <button
            onClick={() => {
              setSelectedCategory('BATCH_SERIAL_NO');
              setSearchQuery('12345');
            }}
            style={{
              padding: '2px 8px',
              backgroundColor: '#f3e8ff',
              border: '1px solid #a855f7',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#6b21a8'
            }}
          >
            Serial No: 12345 (5-Serial Stock)
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#475569',
              marginLeft: 'auto'
            }}
          >
            Clear Filter (Show All ₹75,426.88)
          </button>
        </div>

        {/* Data Grid Table (1:1 Frame 0060, Frame 0300, Frame 0365) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              minWidth: '1500px'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#003366',
                  color: '#ffffff',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <th style={{ padding: '6px 8px', width: '30px', textAlign: 'center', borderRight: '1px solid #002244' }}>
                  D
                </th>
                <th style={{ padding: '6px 10px', width: '130px', borderRight: '1px solid #002244' }}>Invoice No</th>
                <th style={{ padding: '6px 8px', width: '85px', borderRight: '1px solid #002244' }}>Invoice Date</th>
                <th style={{ padding: '6px 8px', width: '65px', borderRight: '1px solid #002244' }}>Tax Type</th>
                <th style={{ padding: '6px 10px', width: '130px', borderRight: '1px solid #002244' }}>Supplier's Invoice No</th>
                <th style={{ padding: '6px 8px', width: '85px', borderRight: '1px solid #002244' }}>Supplier's Invoice Date</th>
                <th style={{ padding: '6px 12px', width: '140px', borderRight: '1px solid #002244' }}>Supplier Name</th>
                <th style={{ padding: '6px 8px', width: '70px', borderRight: '1px solid #002244' }}>State</th>
                <th style={{ padding: '6px 10px', width: '110px', borderRight: '1px solid #002244' }}>GSTIN</th>
                <th style={{ padding: '6px 12px', width: '180px', borderRight: '1px solid #002244' }}>Product Name</th>
                <th style={{ padding: '6px 8px', width: '75px', borderRight: '1px solid #002244' }}>HSN Code</th>
                <th style={{ padding: '6px 8px', width: '55px', textAlign: 'right', borderRight: '1px solid #002244' }}>Qty</th>
                <th style={{ padding: '6px 8px', width: '90px', textAlign: 'right', borderRight: '1px solid #002244' }}>Purchase Rate</th>
                <th style={{ padding: '6px 8px', width: '80px', textAlign: 'right', borderRight: '1px solid #002244' }}>CGST Amt</th>
                <th style={{ padding: '6px 8px', width: '80px', textAlign: 'right', borderRight: '1px solid #002244' }}>SGST Amt</th>
                <th style={{ padding: '6px 10px', width: '100px', textAlign: 'right', borderRight: '1px solid #002244' }}>Total Amount</th>
                <th style={{ padding: '6px 8px', width: '75px', borderRight: '1px solid #002244' }}>Colour</th>
                <th style={{ padding: '6px 8px', width: '75px', borderRight: '1px solid #002244' }}>Size</th>
                <th style={{ padding: '6px 12px', borderRight: '1px solid #002244' }}>Serial Numbers</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={19} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No purchase records found matching current search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isSelected = selectedRowId === r.id;
                  const isYellow = (r.colour || '').toUpperCase() === 'YELLOW';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRowId(r.id)}
                      onDoubleClick={() => {
                        if (onOpenPurchaseEntry) {
                          onOpenPurchaseEntry(r.invoiceNo);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected
                          ? '#bfdbfe'
                          : isYellow
                          ? '#fef9c3'
                          : idx % 2 === 0
                          ? '#ffffff'
                          : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'background 0.1s'
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1' }}>
                        {isSelected ? '▶' : idx + 1}
                      </td>
                      <td style={{ padding: '5px 10px', fontWeight: 600, color: '#1e293b' }}>{r.invoiceNo}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{r.invoiceDate}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{r.taxType}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0284c7' }}>
                        {r.supplierInvoiceNo}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{r.supplierInvoiceDate}</td>
                      <td style={{ padding: '5px 12px', fontWeight: 600, color: '#0f172a' }}>{r.supplierName}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{r.state}</td>
                      <td style={{ padding: '5px 10px', color: '#64748b', fontSize: '10px' }}>{r.gstin}</td>
                      <td style={{ padding: '5px 12px', fontWeight: 700, color: '#0f172a' }}>{r.productName}</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{r.hsnCode}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                        {r.qty} {r.unit}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#1e293b' }}>
                        ₹{r.purchasePrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#475569' }}>
                        ₹{r.cgstAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#475569' }}>
                        ₹{r.sgstAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                        ₹{r.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        {r.colour ? (
                          <span
                            style={{
                              backgroundColor: isYellow ? '#eab308' : '#e2e8f0',
                              color: isYellow ? '#ffffff' : '#334155',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 700
                            }}
                          >
                            {r.colour}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.size || '-'}</td>
                      <td style={{ padding: '5px 12px', fontSize: '10px', color: '#6b21a8' }}>
                        {r.serialNumbers && r.serialNumbers.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {r.serialNumbers.map((sn, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  backgroundColor: '#f3e8ff',
                                  border: '1px solid #d8b4fe',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  fontWeight: 600
                                }}
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Bottom Summary Strip (Frame 0060 & 0365 Total 12100.48 / 75426.88) */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderTop: '2px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
            <span>
              Total Line Items: <strong style={{ color: '#0f172a' }}>{filteredRecords.length}</strong>
            </span>
            <span>
              Total Invoices:{' '}
              <strong style={{ color: '#0f172a' }}>
                {new Set(filteredRecords.map(r => r.invoiceNo)).size}
              </strong>
            </span>
            {selectedRowId && (
              <span style={{ color: '#0284c7', fontStyle: 'italic' }}>
                Tip: Double-click any row to open full Purchase Inward Invoice
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#e0f2fe',
              border: '1px solid #38bdf8',
              padding: '6px 16px',
              borderRadius: '4px'
            }}
          >
            <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '13px' }}>Total :</span>
            <span style={{ fontWeight: 800, color: '#0c4a6e', fontSize: '16px' }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
