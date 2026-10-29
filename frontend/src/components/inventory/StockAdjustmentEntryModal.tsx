import React, { useState, useEffect } from 'react';
import type { Product, StockAdjustmentRecordItem } from '../../types/retailDaddy';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';

interface StockAdjustmentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyAdjustment: (adj: StockAdjustmentRecordItem) => void;
  onOpenStockAdjustmentRecords?: () => void;
  initialRecord?: StockAdjustmentRecordItem | null;
}

export const StockAdjustmentEntryModal: React.FC<StockAdjustmentEntryModalProps> = ({
  isOpen,
  onClose,
  products,
  onApplyAdjustment,
  onOpenStockAdjustmentRecords,
  initialRecord
}) => {
  const [adjustmentId, setAdjustmentId] = useState<string>('2');
  const [saCode, setSaCode] = useState<string>('SA-2-Y');
  const [adjustmentDate, setAdjustmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Product Selection fields
  const [productCode, setProductCode] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [qtyAvailable, setQtyAvailable] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Adjustment fields (Frame 0330)
  const [adjustmentType, setAdjustmentType] = useState<'Plus' | 'Minus'>('Plus');
  const [quantity, setQuantity] = useState<string>('500.000');
  const [reason, setReason] = useState<string>('Physical stock discrepancy reconciliation');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        setAdjustmentId(initialRecord.adjustmentId);
        setSaCode(initialRecord.saCode || `SA-${initialRecord.adjustmentId}-Y`);
        setAdjustmentDate(initialRecord.date);
        setProductCode(initialRecord.productCode);
        setProductName(initialRecord.productName);
        setBarcode(initialRecord.barcode);
        setAdjustmentType(initialRecord.adjustmentType);
        setQuantity(initialRecord.qty.toString());
        setReason(initialRecord.reason);

        const prod = products.find(p => p.pCode === initialRecord.productCode || p.barcode === initialRecord.barcode);
        if (prod) {
          setSelectedProductId(prod.id);
          setQtyAvailable(prod.goodProductQty ?? prod.openingStock ?? 0);
        }
      } else {
        // Default new adjustment
        const nextNum = Math.floor(10 + Math.random() * 90).toString();
        setAdjustmentId(nextNum);
        setSaCode(`SA-${nextNum}-Y`);
        setAdjustmentDate(new Date().toISOString().split('T')[0]);
        setProductCode('');
        setProductName('');
        setBarcode('');
        setQtyAvailable(0);
        setSelectedProductId('');
        setAdjustmentType('Plus');
        setQuantity('1.000');
        setReason('');
      }
    }
  }, [isOpen, initialRecord, products]);

  if (!isOpen) return null;

  const handleBarcodeChange = (scanned: string) => {
    setBarcode(scanned);
    const prod = products.find(
      p => p.barcode === scanned || p.pCode.toLowerCase() === scanned.toLowerCase() || p.id === scanned
    );
    if (prod) {
      setSelectedProductId(prod.id);
      setProductCode(prod.pCode);
      setProductName(prod.name);
      setQtyAvailable(prod.goodProductQty ?? prod.openingStock ?? 0);
    }
  };

  const handleProductSelect = (p: Product) => {
    setSelectedProductId(p.id);
    setProductCode(p.pCode);
    setProductName(p.name);
    setBarcode(p.barcode);
    setQtyAvailable(p.goodProductQty ?? p.openingStock ?? 0);
  };

  const handleNew = () => {
    const nextNum = (parseInt(adjustmentId, 10) + 1).toString();
    setAdjustmentId(nextNum);
    setSaCode(`SA-${nextNum}-Y`);
    setProductCode('');
    setProductName('');
    setBarcode('');
    setQtyAvailable(0);
    setSelectedProductId('');
    setAdjustmentType('Plus');
    setQuantity('1.000');
    setReason('');
  };

  const handleSave = async () => {
    if (isSaving) return;
    const qtyNum = parseFloat(quantity);
    if (!productName || isNaN(qtyNum) || qtyNum <= 0) {
      showToast('⚠️ Please select a valid product and enter a positive adjustment quantity.');
      return;
    }

    if (adjustmentType === 'Minus' && qtyNum > qtyAvailable) {
      if (!confirm(`Warning: Deducting ${qtyNum} pcs will result in negative stock (Current available: ${qtyAvailable}). Proceed anyway?`)) {
        return;
      }
    }

    const newRecord: StockAdjustmentRecordItem = {
      id: initialRecord?.id || '',
      adjustmentId,
      saCode,
      date: adjustmentDate,
      productCode: productCode || 'P-0001',
      productName,
      barcode: barcode || '650000',
      adjustmentType,
      qty: qtyNum,
      reason: reason || 'Audit Adjustment'
    };

    setIsSaving(true);
    try {
      await onApplyAdjustment(newRecord);
      showToast(`✅ Stock Adjustment [${saCode}] (${adjustmentType} ${qtyNum}) synchronized with cloud inventory!`);
      handleNew();
    } catch (err: any) {
      showToast(`❌ Adjustment failed: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
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
          width: isMaximized ? '98vw' : '740px',
          maxWidth: '98vw',
          height: isMaximized ? '96vh' : undefined,
          backgroundColor: '#f8fafc',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Header Bar (Frame 0330) */}
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
            <span>Stock Adjustment</span>
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
              title="Close / Minimize"
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

        {toastMsg && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderBottom: '1px solid #bfdbfe',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* Modal Content */}
        <div style={{ padding: '14px 16px', display: 'flex', gap: '14px' }}>
          
          {/* Left: Stock Adjustment Info (Frame 0330) */}
          <fieldset
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              padding: '12px 14px',
              margin: 0,
              backgroundColor: '#ffffff'
            }}
          >
            <legend style={{ fontSize: '11px', fontWeight: 600, color: '#334155', padding: '0 4px' }}>
              Stock Adjustment Info
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Row 1: Adjustment ID & SA Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Adjustment ID :
                </label>
                <input
                  type="text"
                  value={adjustmentId}
                  readOnly
                  style={{
                    width: '60px',
                    padding: '3px 6px',
                    fontSize: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #94a3b8',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="text"
                  value={saCode}
                  readOnly
                  style={{
                    width: '90px',
                    padding: '3px 6px',
                    fontSize: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #94a3b8',
                    fontWeight: 'bold',
                    color: '#004b99'
                  }}
                />
              </div>

              {/* Row 2: Adjustment Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Adjustment Date :
                </label>
                <input
                  type="date"
                  value={adjustmentDate}
                  onChange={e => setAdjustmentDate(e.target.value)}
                  style={{
                    width: '160px',
                    padding: '3px 6px',
                    fontSize: '12px',
                    border: '1px solid #94a3b8',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Row 3: Product Code, Name, Available Qty */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '8px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Product Code :</div>
                  <input
                    type="text"
                    value={productCode}
                    readOnly
                    placeholder="P-0000"
                    style={{
                      width: '100%',
                      padding: '3px 6px',
                      fontSize: '11px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Product Name :</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={productName}
                      readOnly
                      placeholder="Select product..."
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        fontSize: '11px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600
                      }}
                    />
                    <select
                      onChange={e => {
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod) handleProductSelect(prod);
                      }}
                      value={selectedProductId}
                      style={{ width: '22px', border: '1px solid #94a3b8', cursor: 'pointer' }}
                      title="Browse products list"
                    >
                      <option value="">▼</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.barcode || p.pCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Qty. Available in Store :</div>
                  <div
                    style={{
                      padding: '3px 6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: qtyAvailable < 5 ? '#dc2626' : '#15803d',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      textAlign: 'center'
                    }}
                  >
                    {qtyAvailable.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Row 4: Barcode & Scan Barcode Button (Frame 0330) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Barcode :
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => handleBarcodeChange(e.target.value)}
                    placeholder="Enter or scan barcode..."
                    style={{
                      width: '160px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#ffffcc', // Pale yellow input
                      border: '1px solid #ca8a04',
                      fontWeight: 'bold'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: '#0f766e',
                      color: '#ffffff',
                      border: '1px solid #115e59',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '3px'
                    }}
                  >
                    <span>📷</span>
                    <span>Scan Barcode</span>
                  </button>
                </div>
              </div>

              {/* Row 5: Adjustment Type (Plus / Minus Radio buttons) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Adjustment Type :
                </label>
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'Plus'}
                      onChange={() => setAdjustmentType('Plus')}
                    />
                    <span>Plus (+)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'Minus'}
                      onChange={() => setAdjustmentType('Minus')}
                    />
                    <span>Minus (-)</span>
                  </label>
                </div>
              </div>

              {/* Row 6: Quantity & Reason */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Quantity :
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  style={{
                    width: '100px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#ffffcc', // Pale yellow input
                    border: '1px solid #ca8a04',
                    fontWeight: 'bold',
                    textAlign: 'right'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  Reason :
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Reason for adjustment (e.g. Damage, Audit Discrepancy, Sample)..."
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#ffffcc', // Pale yellow input
                    border: '1px solid #ca8a04',
                    fontWeight: 500
                  }}
                />
              </div>

            </div>
          </fieldset>

          {/* Right: Vertical Toolbar with Icons (Frame 0330) */}
          <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={handleNew}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              <span style={{ fontSize: '16px' }}>📄</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>New</span>
            </button>

            <button
              disabled={isSaving}
              onClick={handleSave}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                background: isSaving ? '#64748b' : '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: '16px' }}>💾</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              disabled={isSaving}
              onClick={handleSave}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                background: isSaving ? '#64748b' : '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: '16px' }}>🔄</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{isSaving ? 'Updating...' : 'Update'}</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this adjustment record?')) {
                  handleNew();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              <span style={{ fontSize: '16px' }}>❌</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Delete</span>
            </button>

            <button
              onClick={() => {
                if (onOpenStockAdjustmentRecords) {
                  onOpenStockAdjustmentRecords();
                } else {
                  showToast('ℹ️ Stock Adjustment Record list is loading...');
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              <span style={{ fontSize: '16px' }}>🗃️</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Get Data</span>
            </button>
          </div>
        </div>

        {/* Bottom Helper Preview */}
        <div
          style={{
            padding: '6px 16px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <span>
            Effect: Stock will be{' '}
            <strong style={{ color: adjustmentType === 'Plus' ? '#16a34a' : '#dc2626' }}>
              {adjustmentType === 'Plus' ? 'INCREASED' : 'DECREASED'}
            </strong>{' '}
            by {quantity || 0} pcs.
          </span>
          <span>SVF Stock Adjustment Engine</span>
        </div>
      </div>

      <CameraBarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          handleBarcodeChange(scanned);
          showToast(`✓ Scanned barcode: ${scanned}`);
        }}
        title="📷 Scan Furniture Product Barcode"
      />
    </div>
  );
};
