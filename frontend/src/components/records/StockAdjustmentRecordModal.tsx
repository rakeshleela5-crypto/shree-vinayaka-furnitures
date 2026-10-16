import React, { useState, useMemo } from 'react';
import type { StockAdjustmentRecordItem } from '../../types/retailDaddy';
import { exportToCsv } from '../../api/client';

interface StockAdjustmentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustmentRecords: StockAdjustmentRecordItem[];
  onOpenStockAdjustmentEntry?: (record?: StockAdjustmentRecordItem) => void;
}

export const StockAdjustmentRecordModal: React.FC<StockAdjustmentRecordModalProps> = ({
  isOpen,
  onClose,
  adjustmentRecords,
  onOpenStockAdjustmentEntry
}) => {
  const [fromDate, setFromDate] = useState<string>(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [searchProductName, setSearchProductName] = useState<string>('');
  const [searchBarcode, setSearchBarcode] = useState<string>('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredRecords = useMemo(() => {
    return adjustmentRecords.filter(item => {
      if (searchProductName.trim()) {
        const q = searchProductName.trim().toLowerCase();
        if (!item.productName.toLowerCase().includes(q) && !item.productCode.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (searchBarcode.trim()) {
        const q = searchBarcode.trim().toLowerCase();
        if (!item.barcode.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [adjustmentRecords, searchProductName, searchBarcode]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
    setSearchProductName('');
    setSearchBarcode('');
    setSelectedRowId(null);
  };

  const handleExportExcel = () => {
    const list = filteredRecords.length > 0 ? filteredRecords : adjustmentRecords;
    if (list.length === 0) {
      showToast('No records available to export.', 'info');
      return;
    }
    const headers = ['Adjustment ID', 'Date', 'Product Code', 'Product Name', 'Barcode', 'Adjustment Type', 'Qty', 'Reason'];
    const rows = list.map(r => [
      r.adjustmentId,
      r.date,
      r.productCode,
      r.productName,
      r.barcode,
      r.adjustmentType,
      r.qty.toFixed(3),
      r.reason || ''
    ]);
    exportToCsv(`Stock_Adjustment_Record_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('✓ Stock adjustment records exported to CSV!', 'success');
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
          width: '920px',
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
        {/* Header Bar (Frame 0270) */}
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
            <span>⚖️</span>
            <span>Stock Adjustment Record</span>
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

        {/* Filter Controls Bar (Frame 0270) */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Box 1: From - To Date + Get Data */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>From :</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #94a3b8', backgroundColor: '#ffffff' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>To :</span>
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
                padding: '4px 12px',
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                border: '1px solid #1e40af',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>
          </div>

          {/* Box 2: Search By Product Name */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Search By Product Name :</span>
            <input
              type="text"
              value={searchProductName}
              onChange={e => setSearchProductName(e.target.value)}
              placeholder="Product name or code..."
              style={{ fontSize: '11px', padding: '3px 6px', width: '150px', border: '1px solid #94a3b8', backgroundColor: '#ffffff' }}
            />
          </div>

          {/* Box 3: Search By Barcode */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Search By Barcode :</span>
            <input
              type="text"
              value={searchBarcode}
              onChange={e => setSearchBarcode(e.target.value)}
              placeholder="Barcode..."
              style={{ fontSize: '11px', padding: '3px 6px', width: '130px', border: '1px solid #94a3b8', backgroundColor: '#ffffff' }}
            />
          </div>

          {/* Action Buttons: Reset & Export Excel (Frame 0270) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '6px 14px',
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
                padding: '6px 14px',
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

        {/* Table Data View (Frame 0270) */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#004d80', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ width: '30px', padding: '6px 4px', borderRight: '1px solid #003366', textAlign: 'center' }}></th>
                <th style={{ width: '100px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Adjustment ID</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Date</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Product Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #003366' }}>Product Name</th>
                <th style={{ width: '110px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Barcode</th>
                <th style={{ width: '110px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'center' }}>Adjustment Type</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>Qty</th>
                <th style={{ width: '160px', padding: '6px 8px' }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                    No stock adjustments found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isSelected = selectedRowId === item.id;
                  const isPlus = item.adjustmentType === 'Plus';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowId(item.id)}
                      onDoubleClick={() => onOpenStockAdjustmentEntry && onOpenStockAdjustmentEntry(item)}
                      title="Double click to edit or inspect this adjustment"
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
                        {item.adjustmentId} {item.saCode ? `(${item.saCode})` : ''}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.date}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{item.productCode}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.productName}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.barcode}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 8px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: isPlus ? '#dcfce7' : '#fee2e2',
                            color: isPlus ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {item.adjustmentType}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.qty.toFixed(3)}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{item.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary bar */}
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
          <span>Tip: Double click any record to open in Stock Adjustment Entry Form</span>
          <span>
            Total Adjustments:{' '}
            {filteredRecords.reduce((sum, r) => sum + r.qty, 0).toFixed(3)} pcs
          </span>
        </div>
      </div>
    </div>
  );
};
