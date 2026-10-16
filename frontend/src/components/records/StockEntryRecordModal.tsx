import React, { useState, useMemo } from 'react';
import type { StockEntryItem } from '../../types/retailDaddy';

interface StockEntryRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockEntryRecords: StockEntryItem[];
  onOpenStockEntry?: (stockId?: string, items?: StockEntryItem[]) => void;
}

export const StockEntryRecordModal: React.FC<StockEntryRecordModalProps> = ({
  isOpen,
  onClose,
  stockEntryRecords,
  onOpenStockEntry
}) => {
  const [fromDate, setFromDate] = useState<string>('2024-04-01');
  const [toDate, setToDate] = useState<string>('2025-03-04');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Available unique Stock IDs for the dropdown
  const uniqueStockIds = useMemo(() => {
    const set = new Set<string>();
    stockEntryRecords.forEach(r => {
      if (r.stockId) set.add(r.stockId);
    });
    return Array.from(set).sort();
  }, [stockEntryRecords]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return stockEntryRecords.filter(r => {
      // Filter by Stock ID
      if (selectedStockId && r.stockId !== selectedStockId) {
        return false;
      }
      return true;
    });
  }, [stockEntryRecords, selectedStockId]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFromDate('2024-04-01');
    setToDate('2025-03-04');
    setSelectedStockId('');
    setSelectedRowId(null);
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Product ID', 'Product Name', 'Barcode', 'Qty', 'Remarks'];
    const rows = filteredRecords.map(r => [
      r.stockId,
      r.date,
      r.productId || r.productCode || '',
      `"${r.productName.replace(/"/g, '""')}"`,
      r.barcode,
      r.qty.toFixed(3),
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `List_Of_Stock_Entry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowDoubleClick = (item: StockEntryItem) => {
    if (onOpenStockEntry) {
      const itemsForStock = stockEntryRecords.filter(r => r.stockId === item.stockId);
      onOpenStockEntry(item.stockId, itemsForStock);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '96vw',
          height: '560px',
          maxHeight: '94vh',
          backgroundColor: '#f8fafc',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Header Bar (Frame 0035) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #004b99 0%, #002266 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>📋</span>
            <span>List of Stock Entry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {}}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              _
            </button>
            <button
              onClick={() => {}}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              □
            </button>
            <button
              onClick={onClose}
              style={{
                width: '24px',
                height: '20px',
                background: '#cc0000',
                border: '1px solid #ff6666',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Controls (Frame 0035) */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}
        >
          {/* Search By Date Box */}
          <div
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Search By Date :</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#475569' }}>From :</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #94a3b8', backgroundColor: '#ffffff' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#475569' }}>To :</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #94a3b8', backgroundColor: '#ffffff' }}
                />
              </div>
              <button
                onClick={() => {}}
                style={{
                  padding: '4px 14px',
                  background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  border: '1px solid #1e40af',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Search By Stock ID Box */}
          <div
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Search By Stock ID :</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedStockId}
                onChange={e => setSelectedStockId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '11px',
                  border: '1px solid #94a3b8',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">-- All Stock IDs --</option>
                {uniqueStockIds.map(sid => (
                  <option key={sid} value={sid}>
                    Stock ID: {sid}
                  </option>
                ))}
              </select>

              <button
                onClick={handleReset}
                style={{
                  padding: '4px 14px',
                  background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  border: '1px solid #b91c1c',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>

              <button
                onClick={handleExportExcel}
                style={{
                  padding: '4px 14px',
                  background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  border: '1px solid #15803d',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Data Grid Table (Frame 0035) */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#004d80', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ width: '30px', padding: '6px 4px', borderRight: '1px solid #003366', textAlign: 'center' }}></th>
                <th style={{ width: '60px', padding: '6px 8px', borderRight: '1px solid #003366' }}>ID</th>
                <th style={{ width: '100px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Date</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Product ID</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #003366' }}>Product Name</th>
                <th style={{ width: '120px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Barcode</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>Qty</th>
                <th style={{ width: '180px', padding: '6px 8px' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                    No stock entry records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isSelected = selectedRowId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowId(item.id)}
                      onDoubleClick={() => handleRowDoubleClick(item)}
                      title="Double-click to view or edit this stock entry voucher"
                      style={{
                        backgroundColor: isSelected ? '#fed7aa' : idx % 2 === 1 ? '#fffbeb' : '#ffffff',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>
                        {isSelected ? '▶' : ''}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                        {item.stockId}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.date}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>
                        {item.productId || item.productCode}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>
                        {item.productName}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.barcode}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.qty.toFixed(3)}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{item.remarks || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div
          style={{
            padding: '6px 14px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#334155',
            fontWeight: 600
          }}
        >
          <span>Total Records: {filteredRecords.length}</span>
          <span>Tip: Double click any record to open in Stock Entry Form</span>
          <span>
            Total Quantity:{' '}
            {filteredRecords.reduce((sum, r) => sum + r.qty, 0).toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
};
