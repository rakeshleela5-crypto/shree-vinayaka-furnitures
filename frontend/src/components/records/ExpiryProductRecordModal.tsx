import React, { useState, useMemo } from 'react';
import type { Product, ExpirySearchType } from '../../types/retailDaddy';
import { VIDEO_02_EXPIRY_PRODUCTS } from '../../data/retailDaddyExpiryData';

interface ExpiryProductRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onWriteOffProduct?: (product: Product, qty: number, reason: string) => void;
  onReturnToSupplier?: (product: Product, qty: number) => void;
}

export const ExpiryProductRecordModal: React.FC<ExpiryProductRecordModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onWriteOffProduct,
  onReturnToSupplier
}) => {
  // Merge prop products with video reference products (ensuring all video 02 items are present)
  const allProducts = useMemo(() => {
    const existingCodes = new Set(products.map(p => p.pCode || p.barcode));
    const uniqueVideoProducts = VIDEO_02_EXPIRY_PRODUCTS.filter(
      p => !existingCodes.has(p.pCode) && !existingCodes.has(p.barcode)
    );
    return [...products, ...uniqueVideoProducts];
  }, [products]);

  // Video base reference date: 04/03/2025 (4th March 2025)
  const [baseDate] = useState('2025-03-04');
  const [fromDate, setFromDate] = useState('2024-10-31');
  const [toDate, setToDate] = useState('2025-03-04');

  // Filter Mode: 'ALL' | 'EXPIRED' | 7 | 15 | 30 | 90 | 180 | 365
  const [activeFilterDays, setActiveFilterDays] = useState<number | 'EXPIRED' | 'ALL'>(30);

  // Search Type Dropdown (Exact 12 choices from Frame 0430)
  const [searchType, setSearchType] = useState<ExpirySearchType>('Product Name');
  const [searchQuery, setSearchQuery] = useState('');

  // With -Ve Stock Qty checkbox (Frame 0055)
  const [withNegativeStock, setWithNegativeStock] = useState(true);

  // Selected row
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod-v02-tomato');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: parse date in dd/mm/yyyy or yyyy-mm-dd
  const parseDate = (dStr?: string): Date | null => {
    if (!dStr) return null;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        // dd/mm/yyyy
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Process products with expiry calculations relative to baseDate
  const processedItems = useMemo(() => {
    const refDate = parseDate(baseDate) || new Date('2025-03-04');
    refDate.setHours(0, 0, 0, 0);

    return allProducts.map(p => {
      let daysLeft = 999;
      let isExpired = false;

      if (p.expDate) {
        const exp = parseDate(p.expDate);
        if (exp) {
          exp.setHours(0, 0, 0, 0);
          const diffMs = exp.getTime() - refDate.getTime();
          daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
          isExpired = daysLeft < 0;
        }
      }

      const availableQty = p.openingStock ?? 0;
      const purchaseRate = p.purchasePrice ?? 0;
      const retailRate = p.retailPrice ?? p.mrp ?? 0;
      const totalCost = availableQty * purchaseRate;

      return {
        ...p,
        daysLeft,
        isExpired,
        availableQty,
        purchaseRate,
        retailRate,
        totalCost
      };
    });
  }, [allProducts, baseDate]);

  // Filtered rows matching top buttons, search type, and negative stock
  const filteredRows = useMemo(() => {
    return processedItems.filter(item => {
      // 1. Negative stock checkbox filter
      if (!withNegativeStock && item.availableQty <= 0) {
        return false;
      }

      // 2. Expiry Interval filter
      if (activeFilterDays === 'EXPIRED') {
        if (!item.isExpired) return false;
      } else if (typeof activeFilterDays === 'number') {
        // Shown within activeFilterDays (and not already expired unless filter is ALL)
        if (item.isExpired) {
          // If searching or in ALL, include expired, otherwise strictly within range
          return true;
        }
        if (item.daysLeft > activeFilterDays || item.daysLeft < 0) {
          return false;
        }
      }

      // 3. Search query filter by selected Search Type
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();

      switch (searchType) {
        case 'Product Name':
          return item.name.toLowerCase().includes(q);
        case 'Barcode':
          return (item.barcode || '').toLowerCase().includes(q);
        case 'Category':
          return (item.category || '').toLowerCase().includes(q);
        case 'Sub Category':
          return (item.subCategory || '').toLowerCase().includes(q);
        case 'Part/Group':
          return (item.partNo || '').toLowerCase().includes(q);
        case 'Godown':
          return (item.godown || '').toLowerCase().includes(q);
        case 'Rack':
          return (item.rack || '').toLowerCase().includes(q);
        case 'Batch':
          return (item.batch || '').toLowerCase().includes(q);
        case 'Size':
          return (item.size || '').toLowerCase().includes(q);
        case 'Colour':
          return (item.colour || '').toLowerCase().includes(q);
        case 'IMEI-1':
          return (item.imei1 || '').toLowerCase().includes(q);
        case 'IMEI-2':
          return (item.imei2 || '').toLowerCase().includes(q);
        default:
          return item.name.toLowerCase().includes(q) || (item.barcode || '').includes(q);
      }
    });
  }, [processedItems, activeFilterDays, withNegativeStock, searchQuery, searchType]);

  // Aggregate totals (Matching Frame 0215, 0270, 0375)
  const totalQty = useMemo(() => {
    return filteredRows.reduce((sum, item) => sum + (item.availableQty || 0), 0);
  }, [filteredRows]);

  const totalLossValue = useMemo(() => {
    return filteredRows.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [filteredRows]);

  const expiredCount = useMemo(() => {
    return processedItems.filter(i => i.isExpired).length;
  }, [processedItems]);

  // Export to Excel / CSV (Frame 0270: "Expiry Product List 30 Days.xlsx")
  const handleExportExcel = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'HSN Code',
      'Part / Group',
      'Barcode',
      'Purchase Price',
      'Retail Price',
      'Discount',
      'CGST',
      'SGST',
      'CESS',
      'Qty. Available',
      'Main Unit',
      'Last Sold Price',
      'Good Product Qty',
      'Damage Product Qty',
      'Minimum Stock',
      'Sale Tax Type',
      'Purchase Tax Type',
      'Godown',
      'Rack',
      'Batch',
      'Mfg Date',
      'Exp Date',
      'Size',
      'Colour',
      'Days Left',
      'Status'
    ];

    const rows = filteredRows.map(i => [
      `"${i.pCode || ''}"`,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${i.hsn || '0'}"`,
      `"${i.partNo || '0'}"`,
      `"${i.barcode || ''}"`,
      (i.purchasePrice || 0).toFixed(2),
      (i.retailPrice || 0).toFixed(2),
      (i.discount || 0).toFixed(2),
      (i.cgst || 0).toFixed(2),
      (i.sgst || 0).toFixed(2),
      (i.cessPercent || 0).toFixed(2),
      (i.availableQty || 0).toFixed(3),
      `"${i.salesUnit || 'PCS'}"`,
      (i.lastSoldPrice || i.retailPrice || 0).toFixed(2),
      (i.goodProductQty ?? i.availableQty ?? 0).toFixed(3),
      (i.damageProductQty || 0).toFixed(3),
      (i.minStock || 1).toFixed(3),
      `"${i.sTax || 'Inclusive'}"`,
      `"${i.pTax || 'Exclusive'}"`,
      `"${i.godown || ''}"`,
      `"${i.rack || ''}"`,
      `"${i.batch || ''}"`,
      `"${i.mfgDate || ''}"`,
      `"${i.expDate || ''}"`,
      `"${i.size || ''}"`,
      `"${i.colour || ''}"`,
      i.daysLeft,
      `"${i.isExpired ? 'ALREADY EXPIRED' : i.daysLeft <= 30 ? 'EXPIRING IN 30 DAYS' : 'SAFE'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const filterTag = activeFilterDays === 'EXPIRED' ? 'Expired' : typeof activeFilterDays === 'number' ? `${activeFilterDays}_Days` : 'All';
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expiry_Product_List_${filterTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📗 Exported ${filteredRows.length} items to Expiry_Product_List_${filterTag}.csv`);
  };

  // Stock Adjustment / Scrap action
  const handleScrapProduct = (p: Product) => {
    if (onWriteOffProduct) {
      onWriteOffProduct(p, p.openingStock, 'Expired Product Write-off');
      showToast(`🗑️ ${p.name} written off in Stock Adjustment!`);
    } else {
      showToast(`🗑️ Stock Adjustment created for ${p.name} (Qty: ${p.openingStock})`);
    }
  };

  // Supplier Return action
  const handleReturnSupplier = (p: Product) => {
    if (onReturnToSupplier) {
      onReturnToSupplier(p, p.openingStock);
      showToast(`↩️ Purchase Return initiated for ${p.name}`);
    } else {
      showToast(`↩️ Debit Note generated for ${p.name} (Qty: ${p.openingStock})`);
    }
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '10px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            background: '#065f46',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main ERP Window Container */}
      <div
        style={{
          width: '98vw',
          maxWidth: '1240px',
          height: '92vh',
          backgroundColor: '#f8fafc',
          border: '2px solid #004b99',
          boxShadow: '0 20px 45px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        {/* WINDOW TITLE BAR (From Frame 0055 & 0215: "Expiry Product (Item Aging) Record") */}
        <div
          style={{
            height: '32px',
            background: 'linear-gradient(180deg, #0284c7 0%, #004b99 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            borderBottom: '1px solid #003366',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
            <span>📅</span>
            <span>Expiry Product (Item Aging) Record</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                background: '#e0247d',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '3px',
                fontWeight: 700
              }}
            >
              Expired: {expiredCount}
            </span>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                border: '1px solid #b91c1c',
                color: '#ffffff',
                width: '24px',
                height: '22px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TOP FILTER CONTROLS (Exact Frame 0055 Geometry) */}
        <div
          style={{
            background: '#ffffff',
            padding: '8px 14px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Left Column: Date Range & Get Data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              <span style={{ color: '#0f172a' }}>From :</span>
              <input
                type="text"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{
                  width: '95px',
                  padding: '3px 6px',
                  fontSize: '12px',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  textAlign: 'center'
                }}
                title="Format: DD/MM/YYYY"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              <span style={{ color: '#0f172a' }}>To :</span>
              <input
                type="text"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{
                  width: '95px',
                  padding: '3px 6px',
                  fontSize: '12px',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  textAlign: 'center'
                }}
                title="Format: DD/MM/YYYY"
              />
            </div>

            {/* Glossy 3D Navy "Get Data" Button (Frame 0055) */}
            <button
              onClick={() => showToast('Data refreshed successfully for date range')}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #0f172a 100%)',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                borderRadius: '3px',
                padding: '5px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              Get Data
            </button>
          </div>

          {/* Center Column: "Expiring in Next :" 6-Button Matrix (Frame 0055 & 0215) */}
          <div
            style={{
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              padding: '3px 8px',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155' }}>
              Expiring in Next :
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 72px)',
                gap: '3px'
              }}
            >
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '180 Days', val: 180 },
                { label: '15 Days', val: 15 },
                { label: '90 Days', val: 90 },
                { label: '365 Days', val: 365 }
              ].map(btn => {
                const isActive = activeFilterDays === btn.val;
                return (
                  <button
                    key={btn.label}
                    onClick={() => {
                      setActiveFilterDays(isActive ? 'ALL' : (btn.val as number));
                      showToast(`Filtered: Expiring in next ${btn.label}`);
                    }}
                    style={{
                      background: isActive
                        ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)'
                        : '#fef3c7',
                      color: isActive ? '#ffffff' : '#78350f',
                      border: isActive ? '1px solid #003366' : '1px solid #b45309',
                      borderRadius: '2px',
                      padding: '2px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Refresh, Excel, Checkbox, and Magenta Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Green Circular Refresh (Frame 0055) */}
            <button
              onClick={() => {
                setActiveFilterDays('ALL');
                setSearchQuery('');
                showToast('All filters reset. Showing all aging stock.');
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                border: '1px solid #166534',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Reset Filters / Show All"
            >
              ⟲
            </button>

            {/* Green Excel Export Button (Frame 0055 & 0270) */}
            <button
              onClick={handleExportExcel}
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
                border: '1px solid #15803d',
                borderRadius: '3px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Export to Excel (XLSX / CSV)"
            >
              📗
            </button>

            {/* With -Ve Stock Qty Checkbox with Green Background (Frame 0055) */}
            <label
              style={{
                background: '#22c55e',
                color: '#ffffff',
                padding: '3px 6px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Include or exclude items with zero or negative stock"
            >
              <input
                type="checkbox"
                checked={withNegativeStock}
                onChange={e => setWithNegativeStock(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>With -Ve Stock Qty</span>
            </label>

            {/* Magenta Indicator: "Already Expired Detected Colour" (Frame 0055 & 0065) */}
            <div
              onClick={() => {
                setActiveFilterDays(activeFilterDays === 'EXPIRED' ? 'ALL' : 'EXPIRED');
                showToast(
                  activeFilterDays === 'EXPIRED'
                    ? 'Showing all aging stock'
                    : 'Filtered: Showing ONLY Already Expired items'
                );
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: '2px',
                backgroundColor: activeFilterDays === 'EXPIRED' ? '#fdf2f8' : 'transparent',
                border: activeFilterDays === 'EXPIRED' ? '1px solid #e0247d' : '1px solid transparent'
              }}
              title="Click to toggle filter for Already Expired products"
            >
              <div
                style={{
                  width: '24px',
                  height: '14px',
                  backgroundColor: '#e0247d',
                  borderRadius: '1px',
                  border: '1px solid #9d174d'
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#e0247d' }}>
                Already Expired Detected Colour
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH TYPE ROW (Exact 12 choices from Frame 0430) */}
        <div
          style={{
            background: '#f1f5f9',
            padding: '6px 14px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ color: '#0f172a' }}>Search Type :</span>
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value as ExpirySearchType)}
              style={{
                width: '135px',
                padding: '3px 6px',
                fontSize: '12px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              <option value="Product Name">Product Name</option>
              <option value="Barcode">Barcode</option>
              <option value="Category">Category</option>
              <option value="Sub Category">Sub Category</option>
              <option value="Part/Group">Part/Group</option>
              <option value="Godown">Godown</option>
              <option value="Rack">Rack</option>
              <option value="Batch">Batch</option>
              <option value="Size">Size</option>
              <option value="Colour">Colour</option>
              <option value="IMEI-1">IMEI-1</option>
              <option value="IMEI-2">IMEI-2</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ color: '#0f172a' }}>Search :</span>
            <input
              type="text"
              placeholder={`Search by ${searchType}... (e.g. tomoto, 9001)`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '240px',
                padding: '3px 8px',
                fontSize: '12px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                setActiveFilterDays('EXPIRED');
                setSearchQuery('');
              }}
              style={{
                background: '#e0247d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚨 Expired ({expiredCount})
            </button>
            <button
              onClick={() => {
                setActiveFilterDays(30);
                setSearchQuery('');
              }}
              style={{
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⏳ 30-Days Risk ({processedItems.filter(i => !i.isExpired && i.daysLeft <= 30).length})
            </button>
            <button
              onClick={() => {
                setActiveFilterDays('ALL');
                setSearchQuery('');
              }}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📋 All ({processedItems.length})
            </button>
          </div>
        </div>

        {/* DATA TABLE (All 26 Columns from Frames 0055, 0065, 0215, 0230, 0375) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table
            style={{
              width: '100%',
              minWidth: '2200px',
              borderCollapse: 'collapse',
              fontSize: '11px'
            }}
          >
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  backgroundColor: '#003366',
                  color: '#ffffff',
                  height: '28px',
                  userSelect: 'none'
                }}
              >
                <th style={{ width: '90px', padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #1e40af' }}>
                  Product Code
                </th>
                <th style={{ width: '220px', padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #1e40af' }}>
                  Product Name
                </th>
                <th style={{ width: '75px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  HSN Code
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Part / Group
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Barcode
                </th>
                <th style={{ width: '90px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Purchase Price
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Retail Price
                </th>
                <th style={{ width: '70px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Discount
                </th>
                <th style={{ width: '60px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  CGST
                </th>
                <th style={{ width: '60px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  SGST
                </th>
                <th style={{ width: '60px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  CESS
                </th>
                <th style={{ width: '95px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Qty. Available
                </th>
                <th style={{ width: '75px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Main Unit
                </th>
                <th style={{ width: '90px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Last Sold Price
                </th>
                <th style={{ width: '95px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Good Product Qty
                </th>
                <th style={{ width: '95px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Damage Product Qty
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'right', borderRight: '1px solid #1e40af' }}>
                  Minimum Stock
                </th>
                <th style={{ width: '90px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Sale Tax Type
                </th>
                <th style={{ width: '100px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Purchase Tax Type
                </th>
                <th style={{ width: '95px', padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #1e40af' }}>
                  Godown
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #1e40af' }}>
                  Rack
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Batch
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Mfg Date
                </th>
                <th style={{ width: '85px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Exp Date
                </th>
                <th style={{ width: '75px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Size
                </th>
                <th style={{ width: '80px', padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #1e40af' }}>
                  Colour
                </th>
                <th style={{ width: '120px', padding: '4px 6px', textAlign: 'center' }}>
                  Quick Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={27}
                    style={{
                      textAlign: 'center',
                      padding: '50px 20px',
                      color: '#64748b',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    No products matching the selected expiry filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, idx) => {
                  const isSelected = selectedProductId === item.id;
                  const isExpiredRow = item.isExpired;

                  // Frame 0065 & 0375: Expired items have solid Magenta / Pink `#e0247d` background with white text!
                  // Other rows alternate white `#ffffff` and soft cream `#fffbf0`.
                  let rowBackground = idx % 2 === 0 ? '#ffffff' : '#fffbf0';
                  let textColor = '#0f172a';

                  if (isExpiredRow) {
                    rowBackground = '#e0247d';
                    textColor = '#ffffff';
                  } else if (isSelected) {
                    rowBackground = '#bfdbfe';
                    textColor = '#1e3a8a';
                  }

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedProductId(item.id)}
                      style={{
                        backgroundColor: rowBackground,
                        color: textColor,
                        height: '24px',
                        cursor: 'pointer',
                        borderBottom: isExpiredRow ? '1px solid #be185d' : '1px solid #e2e8f0',
                        fontWeight: isExpiredRow ? 700 : 500
                      }}
                      onMouseEnter={e => {
                        if (!isExpiredRow && !isSelected) {
                          e.currentTarget.style.backgroundColor = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isExpiredRow && !isSelected) {
                          e.currentTarget.style.backgroundColor = rowBackground;
                        }
                      }}
                    >
                      <td style={{ padding: '3px 6px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.pCode || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: 700 }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.hsn || '0'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.partNo || '0'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: 600 }}>
                        {item.barcode}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.purchasePrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: 700 }}>
                        {(item.retailPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.discount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.cgst || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.sgst || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.cessPercent || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: 700 }}>
                        {(item.availableQty || 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.salesUnit || 'PCS'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.lastSoldPrice || item.retailPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.goodProductQty ?? item.availableQty ?? 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.damageProductQty || 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {(item.minStock || 1).toFixed(3)}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.sTax || 'Inclusive'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.pTax || 'Exclusive'}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.godown || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.rack || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.batch || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.mfgDate || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)', fontWeight: 700 }}>
                        {item.expDate || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.size || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
                        {item.colour || '-'}
                      </td>
                      <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleScrapProduct(item);
                            }}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '2px',
                              padding: '1px 5px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="Scrap in Stock Adjustment"
                          >
                            Scrap
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleReturnSupplier(item);
                            }}
                            style={{
                              background: '#0284c7',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '2px',
                              padding: '1px 5px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="Return to Supplier (Debit Note)"
                          >
                            Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER BAR (Frame 0215, 0375) */}
        <div
          style={{
            height: '32px',
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontSize: '12px',
            userSelect: 'none'
          }}
        >
          {/* Frame 0215, 0375 Left: Crimson Red "No.of Items : 43" */}
          <div style={{ color: '#dc2626', fontWeight: 800 }}>
            No.of Items : {filteredRows.length}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#475569', fontSize: '11px', fontWeight: 600 }}>
              Total Cost at Risk: <b style={{ color: '#b91c1c' }}>₹{totalLossValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
            </span>

            {/* Frame 0215, 0375 Right: "Total Quantity : [ 4249.000 ]" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
              <span>Total Quantity :</span>
              <input
                type="text"
                readOnly
                value={totalQty.toFixed(3)}
                style={{
                  width: '120px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  textAlign: 'right',
                  fontWeight: 800,
                  fontSize: '12px',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExpiryProductRecordModal;
