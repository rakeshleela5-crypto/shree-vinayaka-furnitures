import React, { useState, useMemo } from 'react';
import type { PurchaseInvoiceListItem } from '../../types/retailDaddy';
import { exportToCsv } from '../../api/client';

interface PurchaseRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseInvoices: PurchaseInvoiceListItem[];
  onOpenPurchaseEntry?: (invoiceNo?: string) => void;
}

export const PurchaseRecordModal: React.FC<PurchaseRecordModalProps> = ({
  isOpen,
  onClose,
  purchaseInvoices,
  onOpenPurchaseEntry
}) => {
  const [fromDate, setFromDate] = useState<string>(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [supplierNameQuery, setSupplierNameQuery] = useState<string>('');
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>('');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'All' | 'GST' | 'Non-GST' | 'Composition'>('All');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Unique invoice numbers for the dropdown
  const invoiceOptions = useMemo(() => {
    return Array.from(new Set(purchaseInvoices.map(p => p.invoiceNo))).sort();
  }, [purchaseInvoices]);

  const filteredInvoices = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      if (taxTypeFilter !== 'All' && inv.taxType !== taxTypeFilter) {
        return false;
      }
      if (supplierNameQuery.trim()) {
        const q = supplierNameQuery.trim().toLowerCase();
        if (!inv.supplierName.toLowerCase().includes(q) && !inv.supplierId.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedInvoiceNo && inv.invoiceNo !== selectedInvoiceNo) {
        return false;
      }
      return true;
    });
  }, [purchaseInvoices, taxTypeFilter, supplierNameQuery, selectedInvoiceNo]);

  const totalSum = useMemo(() => {
    return filteredInvoices.reduce((acc, cur) => acc + cur.grandTotal, 0);
  }, [filteredInvoices]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFromDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setToDate(new Date().toISOString().slice(0, 10));
    setSupplierNameQuery('');
    setSelectedInvoiceNo('');
    setTaxTypeFilter('All');
    setSelectedRowId(null);
  };

  const handleExportExcel = () => {
    const list = filteredInvoices.length > 0 ? filteredInvoices : purchaseInvoices;
    if (list.length === 0) {
      alert('No records available to export.');
      return;
    }
    const headers = [
      'Invoice No.',
      'Date',
      'Reference No.',
      'Reverse Charges',
      'Purchase Type',
      'Tax Type',
      "Supplier's Invoice No.",
      "Supplier's Invoice Date",
      'Supplier ID',
      'Supplier Name',
      'Sub Total',
      'CGST',
      'SGST',
      'IGST',
      'Cess',
      'Round Off',
      'Grand Total'
    ];
    const rows = list.map(r => [
      r.invoiceNo,
      r.date,
      r.referenceNo,
      r.reverseCharges,
      r.purchaseType,
      r.taxType,
      r.supplierInvoiceNo || '',
      r.supplierInvoiceDate || '',
      r.supplierId,
      r.supplierName,
      r.subTotal.toFixed(2),
      r.cgst.toFixed(2),
      r.sgst.toFixed(2),
      r.igst.toFixed(2),
      r.cess.toFixed(2),
      r.roundOff.toFixed(2),
      r.grandTotal.toFixed(2)
    ]);
    exportToCsv(`List_of_Purchases_${new Date().toISOString().slice(0, 10)}`, headers, rows);
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
          width: '1180px',
          maxWidth: '98vw',
          height: '620px',
          maxHeight: '96vh',
          backgroundColor: '#f8fafc',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Header Bar with Top 50 Badge (Frame 0515) */}
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
          {/* Top 50 Records badge (Frame 0515) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 'bold' }}>
              <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px' }}>
                Top
              </span>
              <span style={{ backgroundColor: '#ffffff', color: '#000000', padding: '2px 6px' }}>
                50
              </span>
              <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderTopRightRadius: '3px', borderBottomRightRadius: '3px' }}>
                Records
              </span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '15px', marginLeft: '12px' }}>List of Purchases</span>
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

        {/* Filter Controls Row (Frame 0515) */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          {/* From / To Date */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
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
              style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #94a3b8' }}
            />
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>To :</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ fontSize: '11px', padding: '2px 4px', border: '1px solid #94a3b8' }}
            />
            <button
              onClick={() => {}}
              style={{
                padding: '3px 10px',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                border: '1px solid #0f172a',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Get Data
            </button>
          </div>

          {/* Search By Supplier Name */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Search By Supplier Name :</span>
            <input
              type="text"
              value={supplierNameQuery}
              onChange={e => setSupplierNameQuery(e.target.value)}
              placeholder="Supplier name..."
              style={{ fontSize: '11px', padding: '2px 4px', width: '130px', border: '1px solid #94a3b8' }}
            />
          </div>

          {/* Search By Invoice No & Load Invoice No (Frame 0515) */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Search By Invoice No :</span>
              <button
                onClick={() => {
                  if (invoiceOptions.length > 0) setSelectedInvoiceNo(invoiceOptions[0]);
                }}
                style={{
                  padding: '1px 6px',
                  background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  border: '1px solid #16a34a',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Load Invoice No
              </button>
            </div>
            <select
              value={selectedInvoiceNo}
              onChange={e => setSelectedInvoiceNo(e.target.value)}
              style={{ fontSize: '11px', padding: '2px 4px', width: '150px', border: '1px solid #94a3b8' }}
            >
              <option value="">-- All Invoices --</option>
              {invoiceOptions.map(inv => (
                <option key={inv} value={inv}>
                  {inv}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Type Filter */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>Tax Type :</span>
            <select
              value={taxTypeFilter}
              onChange={e => setTaxTypeFilter(e.target.value as any)}
              style={{ fontSize: '11px', padding: '2px 4px', width: '90px', border: '1px solid #94a3b8' }}
            >
              <option value="All">All</option>
              <option value="GST">GST</option>
              <option value="Non-GST">Non-GST</option>
              <option value="Composition">Composition</option>
            </select>
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

        {/* Invoices Table (Frame 0515) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#004d80', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ width: '25px', padding: '6px 3px', borderRight: '1px solid #003366', textAlign: 'center' }}></th>
                <th style={{ width: '140px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Invoice No.</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Date</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Reference No.</th>
                <th style={{ width: '95px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Reverse Charges</th>
                <th style={{ width: '90px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Purchase Type</th>
                <th style={{ width: '70px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Tax Type</th>
                <th style={{ width: '120px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier's Invoice No.</th>
                <th style={{ width: '120px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier's Invoice Date</th>
                <th style={{ width: '80px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier ID</th>
                <th style={{ width: '140px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Supplier Name</th>
                <th style={{ width: '85px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>Sub Total</th>
                <th style={{ width: '75px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>CGST</th>
                <th style={{ width: '75px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>SGST</th>
                <th style={{ width: '75px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>IGST</th>
                <th style={{ width: '70px', padding: '6px 8px', borderRight: '1px solid #003366', textAlign: 'right' }}>Round Off</th>
                <th style={{ width: '95px', padding: '6px 8px', textAlign: 'right' }}>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                    No purchase invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isSelected = selectedRowId === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedRowId(inv.id)}
                      onDoubleClick={() => onOpenPurchaseEntry && onOpenPurchaseEntry(inv.invoiceNo)}
                      title="Double click to open invoice in Purchase Inward"
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
                        {inv.invoiceNo}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.date}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.referenceNo}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.reverseCharges}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.purchaseType}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.taxType}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.supplierInvoiceNo || '-'}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{inv.supplierInvoiceDate || inv.date}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{inv.supplierId}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{inv.supplierName}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{inv.subTotal.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{inv.cgst.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{inv.sgst.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{inv.igst.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{inv.roundOff.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {inv.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Bar (Frame 0515: Total : 561505.92) */}
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
          <span>Total Records: {filteredInvoices.length}</span>
          <span style={{ fontSize: '14px', color: '#003399' }}>
            Total : {totalSum.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
