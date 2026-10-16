import React, { useState } from 'react';
import type {
  SalesReturnDashboardItem,
  SalesReturnCategorySearchType
} from '../../types/retailDaddy';
import { exportToCsv } from '../../api/client';

interface SalesReturnDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesReturnDashboardItem[];
  onRefresh?: () => void;
}

export const SalesReturnDashboardModal: React.FC<SalesReturnDashboardModalProps> = ({
  isOpen,
  onClose,
  records,
  onRefresh
}) => {
  // Date range
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Category search selector (matching Frame 0185)
  const [category, setCategory] = useState<SalesReturnCategorySearchType>('Sales Return No');
  const [searchQuery, setSearchQuery] = useState('');
  const [taxType, setTaxType] = useState<'All' | 'GST' | 'Non-GST'>('All');

  // Selected row
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter records based on active criteria
  const filteredRecords = records.filter((item) => {
    // Tax type filter
    if (taxType !== 'All' && item.taxType !== taxType) {
      return false;
    }

    // Category search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      if (category === 'Sales Return No') {
        if (!item.srNo.toLowerCase().includes(query)) return false;
      } else if (category === 'Sales Invoice No') {
        if (!item.salesInvoiceNo.toLowerCase().includes(query)) return false;
      } else if (category === 'Customer Name') {
        const matchesName = item.customerName.toLowerCase().includes(query);
        const matchesContact = item.contactNo ? item.contactNo.includes(query) : false;
        if (!matchesName && !matchesContact) return false;
      } else if (category === 'Product Name') {
        if (!item.productName.toLowerCase().includes(query)) return false;
      } else if (category === 'Barcode') {
        if (!item.barcode.toLowerCase().includes(query)) return false;
      }
    }

    return true;
  });

  // Calculate total refund amount
  const grandTotal = filteredRecords.reduce((sum, item) => sum + item.totalRefundAmt, 0);

  // Reset filters
  const handleReset = () => {
    setSearchQuery('');
    setCategory('Sales Return No');
    setTaxType('All');
    setFromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
    setSelectedRowId(null);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const list = filteredRecords.length > 0 ? filteredRecords : records;
    if (list.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Sl No',
      'SR No',
      'SR Date',
      'Tax Type',
      'Sales Invoice No',
      'Sales Invoice Date',
      'Customer Name',
      'State',
      'GSTIN/UID',
      'Product Name',
      'HSN Code',
      'Sales Rate',
      'Return Qty',
      'Discount',
      'CGST %',
      'SGST %',
      'Total Refund Amt'
    ];

    const rows = list.map((r, idx) => [
      idx + 1,
      r.srNo,
      r.srDate,
      r.taxType,
      r.salesInvoiceNo,
      r.salesInvoiceDate,
      r.customerName,
      r.state,
      r.gstin || '',
      r.productName,
      r.hsnCode,
      r.salesRate.toFixed(2),
      r.returnQty,
      r.discount.toFixed(2),
      r.cgstPercent,
      r.sgstPercent,
      r.totalRefundAmt.toFixed(2)
    ]);

    exportToCsv(`Sales_Return_Dashboard_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <div
        style={{
          width: '96%',
          maxWidth: '1240px',
          height: '92vh',
          backgroundColor: '#f1f5f9',
          border: '2px solid #003366',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (Frame 0045: Royal Blue Window Bar) */}
        <div
          style={{
            backgroundColor: '#0052cc',
            background: 'linear-gradient(180deg, #1e60d0 0%, #0041a8 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #002b66',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>📋</span>
            <span>Sales Return Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#dc2626',
                border: 'none',
                color: '#fff',
                width: '26px',
                height: '22px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
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

        {/* Top Filter Controls (Matching Frames 0045, 0155, 0185) */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Section 1: Search by SR Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8fafc'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>Search by SR Date:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#475569' }}>From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  fontSize: '12px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#475569' }}>To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  fontSize: '12px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <button
              onClick={() => {
                if (onRefresh) onRefresh();
              }}
              style={{
                backgroundColor: '#1d4ed8',
                backgroundImage: 'linear-gradient(180deg, #2563eb 0%, #1e40af 100%)',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                padding: '4px 12px',
                borderRadius: '3px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              Get Data
            </button>
          </div>

          {/* Section 2: Select Category and Search (Frames 0185 & 0205) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              flex: '1 1 auto',
              maxWidth: '560px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>
                  Select Category and Search:
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SalesReturnCategorySearchType)}
                  style={{
                    padding: '3px 8px',
                    border: '1px solid #94a3b8',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Sales Return No">Sales Return No</option>
                  <option value="Sales Invoice No">Sales Invoice No</option>
                  <option value="Customer Name">Customer Name</option>
                  <option value="Product Name">Product Name</option>
                  <option value="Barcode">Barcode</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  <label style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>Tax Type:</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    style={{
                      padding: '3px 6px',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      fontSize: '11px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="All">All</option>
                    <option value="GST">GST</option>
                    <option value="Non-GST">Non-GST</option>
                  </select>
                  <button
                    onClick={() => {
                      if (onRefresh) onRefresh();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0 2px'
                    }}
                    title="Refresh Records"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Yellow Search Text Box matching Frame 0155 */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${category}...`}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  backgroundColor: '#fefce8',
                  border: '1px solid #facc15',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#1e293b'
                }}
              />
            </div>
          </div>

          {/* Section 3: Action Buttons (Reset & Export Excel) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#dc2626',
                backgroundImage: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: '1px solid #991b1b',
                padding: '6px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
              }}
            >
              Reset
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: '#16a34a',
                backgroundImage: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                color: '#ffffff',
                border: '1px solid #166534',
                padding: '6px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
              }}
            >
              <span>📊</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Table View (Matching Frame 0045, 0155, 0185, 0410) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11.5px',
              textAlign: 'left',
              whiteSpace: 'nowrap'
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#003366',
                color: '#ffffff',
                zIndex: 10
              }}
            >
              <tr>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e3a8a', width: '35px', textAlign: 'center' }}>
                  #
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>SR No.</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>SR Date</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>Tax Type</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>Sales Invoice No.</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>Sales Invoice Date</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>Customer Name</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>State</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>GSTIN/UID</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>Product Name</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a' }}>HSN Code</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a', textAlign: 'right' }}>
                  Sales Rate
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a', textAlign: 'center' }}>
                  Return Qty
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a', textAlign: 'right' }}>
                  Discount
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a', textAlign: 'center' }}>
                  CGST %
                </th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #1e3a8a', textAlign: 'center' }}>
                  SGST %
                </th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                  Total Refund Amt
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                    No sales return records found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const isSelected = selectedRowId === item.id;
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowId(item.id)}
                      style={{
                        backgroundColor: isSelected ? '#bfdbfe' : isEven ? '#ffffff' : '#fefce8',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td
                        style={{
                          padding: '5px 8px',
                          borderRight: '1px solid #e2e8f0',
                          textAlign: 'center',
                          color: '#475569',
                          fontWeight: 'bold'
                        }}
                      >
                        {isSelected ? '▷ ' : ''}
                        {index + 1}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0f172a' }}>
                        {item.srNo}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0' }}>{item.srDate}</td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0' }}>{item.taxType}</td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', color: '#2563eb', fontWeight: '500' }}>
                        {item.salesInvoiceNo}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0' }}>{item.salesInvoiceDate}</td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', fontWeight: '600' }}>
                        {item.customerName}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0' }}>{item.state}</td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace' }}>
                        {item.gstin || '-'}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                        {item.productName}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0' }}>{item.hsnCode}</td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>
                        ₹{item.salesRate.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          borderRight: '1px solid #e2e8f0',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: '#b91c1c'
                        }}
                      >
                        {item.returnQty}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>
                        ₹{item.discount.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {item.cgstPercent}%
                      </td>
                      <td style={{ padding: '5px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {item.sgstPercent}%
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#003366',
                          backgroundColor: isSelected ? '#bfdbfe' : isEven ? '#f8fafc' : '#fef9c3'
                        }}
                      >
                        ₹{item.totalRefundAmt.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status / Summary Bar (Matching Frame 0045 & 0155) */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            borderTop: '2px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px' }}>
            <span>
              Total Returned Rows: <strong style={{ color: '#0f172a' }}>{filteredRecords.length}</strong>
            </span>
            <span>
              Category Filter: <strong style={{ color: '#0284c7' }}>{category}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Total :</span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#003366',
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                padding: '3px 12px',
                borderRadius: '3px',
                minWidth: '120px',
                textAlign: 'right'
              }}
            >
              ₹{grandTotal.toFixed(2)}
            </span>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#64748b',
                color: '#ffffff',
                border: 'none',
                padding: '4px 14px',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
