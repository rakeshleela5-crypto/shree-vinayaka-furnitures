import React, { useState, useMemo } from 'react';
import type { PurchaseReturnDashboardItem } from '../../types/retailDaddy';
import { exportToCsv } from '../../api/client';

interface PurchaseReturnRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseReturnRecords: PurchaseReturnDashboardItem[];
  onOpenPurchaseReturnEntry?: (prNo?: string) => void;
}

export const PurchaseReturnRecordModal: React.FC<PurchaseReturnRecordModalProps> = ({
  isOpen,
  onClose,
  purchaseReturnRecords,
  onOpenPurchaseReturnEntry
}) => {
  const [supplierNameQuery, setSupplierNameQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const parseDateToTs = (dStr?: string): number => {
    if (!dStr) return 0;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
    }
    return new Date(dStr).getTime();
  };

  const filteredRecords = useMemo(() => {
    return purchaseReturnRecords.filter(rec => {
      if (fromDate) {
        const invTime = parseDateToTs(rec.prDate || (rec as any).date);
        const fromTime = new Date(fromDate).setHours(0, 0, 0, 0);
        if (invTime && invTime < fromTime) return false;
      }
      if (toDate) {
        const invTime = parseDateToTs(rec.prDate || (rec as any).date);
        const toTime = new Date(toDate).setHours(23, 59, 59, 999);
        if (invTime && invTime > toTime) return false;
      }
      if (supplierNameQuery.trim()) {
        const q = supplierNameQuery.trim().toLowerCase();
        if (!rec.supplierName.toLowerCase().includes(q) && !(rec.supplierId || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [purchaseReturnRecords, fromDate, toDate, supplierNameQuery]);

  const totalSum = useMemo(() => {
    return filteredRecords.reduce((acc, cur) => acc + (cur.totalDebitAmt || 0), 0);
  }, [filteredRecords]);

  if (!isOpen) return null;

  const handleReset = () => {
    setSupplierNameQuery('');
    setFromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
    setSelectedRowId(null);
  };

  const handleExportExcel = () => {
    const list = filteredRecords.length > 0 ? filteredRecords : purchaseReturnRecords;
    if (list.length === 0) {
      showToast('No records available to export.', 'info');
      return;
    }
    const headers = [
      'PR No.',
      'PR Date',
      'Tax Type',
      'Purchase Invoice No.',
      'Purchase Date',
      'Supplier ID',
      'Supplier Name',
      'Sub Total',
      'CGST',
      'SGST',
      'Total Debit Amt'
    ];
    const rows = list.map(r => [
      r.prNo,
      r.prDate,
      r.taxType,
      r.purchaseInvoiceNo,
      r.purchaseInvoiceDate,
      r.supplierId || '',
      r.supplierName,
      ((r.purchaseRate || 0) * (r.returnQty || 0)).toFixed(2),
      (r.cgstAmount || 0).toFixed(2),
      (r.sgstAmount || 0).toFixed(2),
      (r.totalDebitAmt || 0).toFixed(2)
    ]);
    exportToCsv(`Purchase_Return_Record_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('✓ Purchase return records exported to CSV!', 'success');
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
          width: isMaximized ? '98vw' : '1080px',
          maxWidth: '98vw',
          height: isMaximized ? '96vh' : '580px',
          maxHeight: '94vh',
          backgroundColor: '#f8fafc',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Header Bar (Frame 0650) */}
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
            <span>↩️</span>
            <span>Purchase Return Record</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onClose}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title="Minimize / Close"
            >
              _
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title="Maximize / Restore"
            >
              {isMaximized ? '❐' : '□'}
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

        {/* Filter Controls Row (Frame 0650) */}
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
          {/* Search By Supplier Name */}
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
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Search By Supplier Name :</span>
            <input
              type="text"
              value={supplierNameQuery}
              onChange={e => setSupplierNameQuery(e.target.value)}
              placeholder="Supplier name..."
              style={{ fontSize: '11px', padding: '3px 6px', width: '160px', border: '1px solid #94a3b8' }}
            />
          </div>

          {/* From / To Date + Get Data */}
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
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>From :</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #94a3b8' }}
            />
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>To :</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #94a3b8' }}
            />
            <button
              onClick={() => {
                showToast(`✓ Filtered ${filteredRecords.length} purchase return records for date range`, 'success');
              }}
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
              title="Apply date range filter"
            >
              Get Data
            </button>
          </div>

          {/* Action Buttons: Reset & Export Excel */}
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

        {/* Table Data View (Frame 0650) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#004d80', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ width: '25px', padding: '6px 3px', borderRight: '1px solid #003366', textAlign: 'center' }}></th>
                <th style={{ width: '120px', padding: '6px 8px', borderRight: '1px solid #003366' }}>PR No.</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366' }}>PR Date</th>
                <th style={{ width: '70px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Tax Type</th>
                <th style={{ width: '140px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Purchase Invoice No.</th>
                <th style={{ width: '85px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Purchase Date</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier ID</th>
                <th style={{ width: '150px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier Name</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>Sub Total</th>
                <th style={{ width: '70px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>CGST</th>
                <th style={{ width: '70px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>SGST</th>
                <th style={{ width: '90px', padding: '6px 8px', textAlign: 'right' }}>Total Debit Amt</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                    No purchase return records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isSelected = selectedRowId === item.id;
                  const subTotal = (item.purchaseRate || 0) * (item.returnQty || 0);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowId(item.id)}
                      onDoubleClick={() => onOpenPurchaseReturnEntry && onOpenPurchaseReturnEntry(item.prNo)}
                      title="Double-click to open debit note"
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
                        {item.prNo}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.prDate}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.taxType}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.purchaseInvoiceNo}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{item.purchaseInvoiceDate}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{item.supplierId || '-'}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{item.supplierName}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{subTotal.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{(item.cgstAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{(item.sgstAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {(item.totalDebitAmt || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Bar (Frame 0650: Total : 0.00) */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#1e293b',
            fontWeight: 'bold'
          }}
        >
          <span>Total Records: {filteredRecords.length}</span>
          <span style={{ fontSize: '14px', color: '#003399' }}>
            Total : {totalSum.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
