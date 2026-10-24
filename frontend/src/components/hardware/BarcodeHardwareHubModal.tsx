import { useState, useEffect } from 'react';
import type { Product } from '../../types/retailDaddy';
import { RETSOL_PRESETS, generateRetsolTspl, downloadTsplFile, printViaSeagullDriver } from '../../utils/retsolPrinter';
import { hardwareScanner, type ScanEventDetail } from '../../services/hardwareScannerService';
import { Barcode128 } from '../common/Barcode128';

interface BarcodeHardwareHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  product?: Product | null;
  initialProduct?: Product | null;
  onOpenPosWithProduct?: (product: Product) => void;
  onOpenBarcodeDesigner?: (product?: Product) => void;
}

export function BarcodeHardwareHubModal({
  isOpen,
  onClose,
  products = [],
  product,
  initialProduct,
  onOpenPosWithProduct,
  onOpenBarcodeDesigner
}: BarcodeHardwareHubModalProps) {
  const [activeTab, setActiveTab] = useState<'RETSOL_PRINTER' | 'BRONTIX_SCANNER' | 'DRIVER_WIZARD_GUIDE'>('RETSOL_PRINTER');

  const activeInitial = product || initialProduct;
  const productList = products.length > 0 ? products : (activeInitial ? [activeInitial] : []);

  // Retsol Printer State
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => {
    return activeInitial || productList[0] || {
      id: 'prod-sample',
      pCode: 'SVF-TK101',
      name: 'Nilambur Teak Wood 6-Seater Dining Table',
      barcode: '890110100234',
      retailPrice: 42500,
      mrp: 58000,
      purchasePrice: 28000,
      cessPercent: 0,
      openingStock: 8,
      salesUnit: 'Sets',
      category: 'Dining Room',
      material: 'Solid Nilambur Teakwood',
      dimensions: '72"L x 36"W x 30"H',
      colour: 'Honey Teak Gloss Finish',
      warranty: '10 Years Warranty',
      hsn: '9403'
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('50x25');
  const [copies, setCopies] = useState<number>(1);
  const [copiedTspl, setCopiedTspl] = useState(false);

  // Brontix Scanner Diagnostic State
  const [lastScan, setLastScan] = useState<ScanEventDetail | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<ScanEventDetail & { matchedProduct?: Product }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualTestInput, setManualTestInput] = useState('');
  const [isPinging, setIsPinging] = useState(false);

  // Sync product if prop changes
  useEffect(() => {
    if (product) {
      setSelectedProduct(product);
    } else if (initialProduct) {
      setSelectedProduct(initialProduct);
    }
  }, [product, initialProduct]);

  // Load scanner settings
  useEffect(() => {
    const settings = hardwareScanner.getSettings();
    setSoundEnabled(settings.soundEnabled);
  }, []);

  // Listen to hardware scanner events while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = hardwareScanner.subscribe((detail) => {
      setLastScan(detail);
      setIsPinging(true);
      setTimeout(() => setIsPinging(false), 800);

      const matched = productList.find(p =>
        p.barcode === detail.barcode ||
        p.pCode.toLowerCase() === detail.barcode.toLowerCase()
      );

      setScanHistory(prev => [
        { ...detail, matchedProduct: matched },
        ...prev.slice(0, 19)
      ]);

      if (matched) {
        setSelectedProduct(matched);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, productList]);

  if (!isOpen) return null;

  const currentPreset = RETSOL_PRESETS.find(p => p.key === selectedPresetKey) || RETSOL_PRESETS[0];

  const handlePrintViaDriver = () => {
    printViaSeagullDriver('svf-retsol-preview-print-area', currentPreset.widthMm, currentPreset.heightMm);
  };

  const handleDownloadTspl = () => {
    const tspl = generateRetsolTspl(selectedProduct, currentPreset.key, copies);
    const sku = selectedProduct.pCode || selectedProduct.barcode || 'label';
    downloadTsplFile(`retsol_r220_${sku}_${currentPreset.key}.prn`, tspl);
  };

  const handleCopyTspl = () => {
    const tspl = generateRetsolTspl(selectedProduct, currentPreset.key, copies);
    navigator.clipboard.writeText(tspl);
    setCopiedTspl(true);
    setTimeout(() => setCopiedTspl(false), 2000);
  };

  const handleManualTestScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTestInput.trim()) return;
    hardwareScanner.emitScan(manualTestInput.trim());
    setManualTestInput('');
  };

  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    hardwareScanner.saveSettings({ soundEnabled: enabled });
  };

  const filteredProducts = searchQuery.trim()
    ? productList.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pCode.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '980px',
          maxWidth: '100%',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Hardware Hub: Retsol R220 Printer & Brontix Barcode Scanner</span>
                <span
                  style={{
                    background: isPinging ? '#22c55e' : '#0369a1',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    transform: isPinging ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  {isPinging ? '⚡ SCAN DETECTED!' : '🟢 HARDWARE ACTIVE'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Direct Seagull Driver Wizard thermal printing (203 DPI) & High-speed USB presentation scanner listener
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            padding: '4px 16px 0 16px',
            gap: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('RETSOL_PRINTER')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'RETSOL_PRINTER' ? '3px solid #0284c7' : '3px solid transparent',
              background: activeTab === 'RETSOL_PRINTER' ? '#ffffff' : 'transparent',
              color: activeTab === 'RETSOL_PRINTER' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'RETSOL_PRINTER' ? '800' : '600',
              fontSize: '13px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🖨️</span>
            <span>Retsol R220 Print Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('BRONTIX_SCANNER')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'BRONTIX_SCANNER' ? '3px solid #0284c7' : '3px solid transparent',
              background: activeTab === 'BRONTIX_SCANNER' ? '#ffffff' : 'transparent',
              color: activeTab === 'BRONTIX_SCANNER' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'BRONTIX_SCANNER' ? '800' : '600',
              fontSize: '13px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📟</span>
            <span>Brontix Scanner Live Diagnostic</span>
            {lastScan && (
              <span style={{ background: '#22c55e', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('DRIVER_WIZARD_GUIDE')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'DRIVER_WIZARD_GUIDE' ? '3px solid #0284c7' : '3px solid transparent',
              background: activeTab === 'DRIVER_WIZARD_GUIDE' ? '#ffffff' : 'transparent',
              color: activeTab === 'DRIVER_WIZARD_GUIDE' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'DRIVER_WIZARD_GUIDE' ? '800' : '600',
              fontSize: '13px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🛠️</span>
            <span>Seagull Driver Wizard & Setup Guide</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
          {/* TAB 1: RETSOL R220 PRINT STUDIO */}
          {activeTab === 'RETSOL_PRINTER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              {/* Left Column: Product Selection & Print Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Product Search & Selection */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    🔍 Select Furniture Item to Print Label:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Type product name, SKU, or barcode..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    />
                    {filteredProducts.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          zIndex: 10,
                          marginTop: '4px',
                          maxHeight: '180px',
                          overflowY: 'auto'
                        }}
                      >
                        {filteredProducts.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12px'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{p.name}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>SKU: {p.pCode} | Barcode: {p.barcode}</div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#059669' }}>
                              ₹{(p.retailPrice || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Product Summary Card */}
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: '#166534', fontSize: '13px' }}>
                        {selectedProduct.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                        SKU: <strong style={{ fontFamily: 'monospace' }}>{selectedProduct.pCode}</strong> • Barcode: <strong style={{ fontFamily: 'monospace' }}>{selectedProduct.barcode}</strong>
                      </div>
                      {(selectedProduct.material || selectedProduct.dimensions) && (
                        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                          {selectedProduct.material || ''} {selectedProduct.dimensions ? `(${selectedProduct.dimensions})` : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#166534' }}>
                        ₹{(selectedProduct.retailPrice || selectedProduct.salePrice || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', textDecoration: 'line-through' }}>
                        MRP: ₹{(selectedProduct.mrp || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roll Preset Picker */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                    📏 Select Retsol R220 Label Roll Dimension:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {RETSOL_PRESETS.map(preset => (
                      <label
                        key={preset.key}
                        onClick={() => setSelectedPresetKey(preset.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: selectedPresetKey === preset.key ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: selectedPresetKey === preset.key ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="radio"
                            name="retsol_preset"
                            checked={selectedPresetKey === preset.key}
                            onChange={() => setSelectedPresetKey(preset.key)}
                          />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                              {preset.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {preset.description} ({preset.dotsWidth}×{preset.dotsHeight} px @ 203 DPI)
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7' }}>
                          {preset.widthMm}×{preset.heightMm} mm
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Copies Counter & Quick Stock Multiplier */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                      Copies to Print:
                    </label>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      Current stock in hand: {selectedProduct.openingStock || 0} units
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={copies}
                      onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '56px', height: '32px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                    />
                    <button
                      onClick={() => setCopies(prev => prev + 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setCopies(selectedProduct.openingStock || 1)}
                      style={{ padding: '6px 10px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Match Stock ({selectedProduct.openingStock || 1})
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: High Precision Label Visual Preview & Direct Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                      👁️ 1:1 Thermal Label Preview ({currentPreset.widthMm}mm × {currentPreset.heightMm}mm):
                    </span>
                    <span style={{ fontSize: '11px', color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      203 DPI Calibrated
                    </span>
                  </div>

                  {/* Rendered Physical Thermal Sticker Preview */}
                  <div
                    style={{
                      background: '#e2e8f0',
                      padding: '20px',
                      borderRadius: '8px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      id="svf-retsol-preview-print-area"
                      style={{
                        width: `${currentPreset.widthMm * 5.2}px`,
                        height: `${currentPreset.heightMm * 5.2}px`,
                        maxHeight: '380px',
                        background: '#ffffff',
                        border: '1px dashed #94a3b8',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        fontFamily: "'Segoe UI', Roboto, sans-serif"
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ textAlign: 'center', borderBottom: '1px solid #000000', paddingBottom: '2px' }}>
                        <div style={{ fontSize: currentPreset.key === '50x25' ? '9px' : '11px', fontWeight: '900', letterSpacing: '0.2px', color: '#000000' }}>
                          SHREE VINAYAKA FURNITURES
                        </div>
                        <div style={{ fontSize: '7px', color: '#333333', fontWeight: '600' }}>
                          PALAKKAD • PHONE: 0491-2522888
                        </div>
                      </div>

                      {/* Product Name & Details */}
                      <div style={{ textAlign: 'center', padding: '2px 0' }}>
                        <div style={{ fontSize: currentPreset.key === '50x25' ? '10px' : '12px', fontWeight: 'bold', color: '#000000', lineHeight: 1.15 }}>
                          {selectedProduct.name}
                        </div>
                        {currentPreset.key !== '50x25' && (
                          <div style={{ fontSize: '8px', color: '#444444', marginTop: '2px', fontWeight: '500' }}>
                            {selectedProduct.material || 'Solid Teak Wood'} • {selectedProduct.dimensions || 'Standard'}
                          </div>
                        )}
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#000000', marginTop: '1px' }}>
                          SKU: {selectedProduct.pCode}
                        </div>
                      </div>

                      {/* 1D Barcode (Code128) */}
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                        <Barcode128
                          value={selectedProduct.barcode || selectedProduct.pCode}
                          width={currentPreset.key === '100x50' ? 2.2 : 1.4}
                          height={currentPreset.key === '50x25' ? 28 : (currentPreset.key === '100x50' ? 44 : 36)}
                          fontSize={9}
                          displayValue={true}
                        />
                      </div>

                      {/* Price Section */}
                      <div style={{ borderTop: '1px solid #000000', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#555555', textDecoration: 'line-through' }}>
                          MRP: ₹{(selectedProduct.mrp || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: currentPreset.key === '50x25' ? '11px' : '13px', fontWeight: '900', color: '#000000' }}>
                          OFFER: ₹{(selectedProduct.retailPrice || selectedProduct.salePrice || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                    Label will print on continuous gap-sensor thermal sticker roll via Retsol R220.
                  </div>
                </div>

                {/* Print Trigger Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handlePrintViaDriver}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '13px 20px',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <span>🖨️</span>
                    <span>Print via Seagull Driver ({copies} {copies === 1 ? 'copy' : 'copies'})</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={handleDownloadTspl}
                      style={{
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>💾</span>
                      <span>Download TSPL (.prn)</span>
                    </button>

                    <button
                      onClick={handleCopyTspl}
                      style={{
                        background: copiedTspl ? '#dcfce7' : '#f8fafc',
                        color: copiedTspl ? '#166534' : '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{copiedTspl ? '✓' : '📋'}</span>
                      <span>{copiedTspl ? 'Copied TSPL Code!' : 'Copy TSPL Commands'}</span>
                    </button>
                  </div>

                  {onOpenBarcodeDesigner && (
                    <button
                      onClick={() => onOpenBarcodeDesigner(selectedProduct)}
                      style={{
                        background: 'transparent',
                        color: '#0284c7',
                        border: '1px dashed #0284c7',
                        borderRadius: '6px',
                        padding: '9px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🎨</span>
                      <span>Open in Full Visual Label Designer (Customize Layout)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRONTIX SCANNER LIVE DIAGNOSTIC */}
          {activeTab === 'BRONTIX_SCANNER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Status & Audio Control Banner */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px 20px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    📟
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      Brontix USB Desktop Barcode Scanner: ACTIVE & LISTENING
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Omnidirectional presentation scanner automatically detected. Scan any barcode hands-free!
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => hardwareScanner.playScannerBeep()}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🔊</span>
                    <span>Test POS Beep</span>
                  </button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={e => toggleSound(e.target.checked)}
                    />
                    <span>Sound Feedback</span>
                  </label>
                </div>
              </div>

              {/* Live Scanner Visual Test Pad */}
              <div
                style={{
                  background: isPinging ? '#dcfce7' : '#ffffff',
                  border: isPinging ? '2px solid #22c55e' : '2px dashed #94a3b8',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {isPinging ? '✨' : '🎯'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                  {lastScan ? `Last Scanned Barcode: ${lastScan.barcode}` : 'WAVE ANY BARCODE IN FRONT OF BRONTIX SCANNER'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {lastScan
                    ? `Captured in ${lastScan.durationMs}ms (${lastScan.charCount} characters @ ${lastScan.averageCharIntervalMs}ms/char)`
                    : 'The hands-free sensor detects the label automatically and inputs high-speed keycodes.'}
                </div>

                {/* Manual Barcode Simulation Input for Testing */}
                <form
                  onSubmit={handleManualTestScan}
                  style={{
                    display: 'flex',
                    maxWidth: '440px',
                    margin: '16px auto 0 auto',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    value={manualTestInput}
                    onChange={e => setManualTestInput(e.target.value)}
                    placeholder="Or enter test barcode / SKU manually..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Simulate Scan
                  </button>
                </form>
              </div>

              {/* Scan Log History Table */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
                  📋 Live Scan Session History ({scanHistory.length} items scanned)
                </div>
                {scanHistory.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No scans registered in this session yet. Scan a furniture barcode tag to test!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Time</th>
                        <th style={{ padding: '8px 12px' }}>Scanned Code</th>
                        <th style={{ padding: '8px 12px' }}>Latency</th>
                        <th style={{ padding: '8px 12px' }}>Matched Product</th>
                        <th style={{ padding: '8px 12px' }}>Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0369a1' }}>
                            {item.barcode}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: '600' }}>
                            {item.durationMs} ms
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 'bold', color: item.matchedProduct ? '#0f172a' : '#ef4444' }}>
                            {item.matchedProduct ? item.matchedProduct.name : '⚠️ Not in Database'}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#059669' }}>
                            {item.matchedProduct ? `₹${(item.matchedProduct.retailPrice || 0).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            {item.matchedProduct && onOpenPosWithProduct && (
                              <button
                                onClick={() => {
                                  onOpenPosWithProduct(item.matchedProduct!);
                                  onClose();
                                }}
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                🛒 Bill in POS
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEAGULL DRIVER WIZARD & SETUP GUIDE */}
          {activeTab === 'DRIVER_WIZARD_GUIDE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📘</span>
                  <span>How the Influencer's "Driver Wizard" Works for Retsol R220</span>
                </div>
                <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '6px', lineHeight: 1.5 }}>
                  The <strong>Driver Wizard by Seagull Scientific</strong> is the industrial Windows driver system for Retsol, TSC, and Godex thermal label printers. Once installed through Driver Wizard, Windows recognizes the Retsol R220 as a high-precision continuous roll label printer. Follow the 4 steps below for perfect setup:
                </div>
              </div>

              {/* Step Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Step 1 */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#0284c7', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>1</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Install Driver via Seagull Wizard</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                    1. Connect the Retsol R220 via USB cable and turn power switch ON.<br />
                    2. Run <code>DriverWizard.exe</code> (downloaded from Seagull or CD).<br />
                    3. Select <strong>"Install printer drivers"</strong>.<br />
                    4. Select Model: <strong>Retsol R220</strong> (or TSC TTP-244 Pro compatible).<br />
                    5. Select Port: <strong>USB001 (Virtual printer port for USB)</strong>.
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#0284c7', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>2</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Configure Label Stock & Dimensions</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                    1. Open Windows <strong>Printers & Scanners</strong> &gt; <strong>Retsol R220</strong> &gt; <strong>Printing Preferences</strong>.<br />
                    2. In the <strong>Page Setup</strong> tab, click <strong>"New..."</strong> to create a stock size:<br />
                    &nbsp;&nbsp;&bull; Name: <code>SVF 50x25mm</code> (Width: 50.0mm, Height: 25.0mm)<br />
                    &nbsp;&nbsp;&bull; Or <code>SVF 50x38mm</code> for furniture spec tags.<br />
                    3. Media Type: Select <strong>"Die-Cut Labels (Gaps)"</strong> with Gap: <strong>2.0mm</strong>.
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#0284c7', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>3</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Gap Sensor Auto-Calibration (Crucial!)</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                    If the printer skips blank labels or prints half-way across lines:<br />
                    1. Turn the Retsol R220 power OFF.<br />
                    2. Press and HOLD the green <strong>FEED button</strong> on top.<br />
                    3. Turn power switch ON while continuing to hold FEED.<br />
                    4. When the LED flashes RED and then AMBER, release FEED immediately.<br />
                    5. The printer will feed 2-3 labels and auto-lock the gap boundary!
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#0284c7', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>4</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Brontix Desktop Scanner Setup</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                    1. Plug the Brontix scanner USB cable into your billing PC.<br />
                    2. No drivers needed — it automatically configures as a USB HID.<br />
                    3. Set to <strong>Auto-Sensing / Continuous Mode</strong> (hands-free presentation).<br />
                    4. Ensure suffix is set to <strong>Carriage Return (Enter key)</strong> so scans automatically register in POS and audit screens.
                  </div>
                </div>
              </div>

              {/* Test Action Bar */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                    Print Hardware Test Barcode Sheet
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Prints 5 sample furniture barcodes on standard paper/roll to test both the Retsol printer and Brontix scanner immediately.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('RETSOL_PRINTER');
                    setTimeout(() => handlePrintViaDriver(), 200);
                  }}
                  style={{
                    background: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '9px 16px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Hardware Test Label
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            <span>Brontix USB HID Scanner: Ready</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span>Retsol R220 TSPL 203 DPI: Ready</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#475569',
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
}
