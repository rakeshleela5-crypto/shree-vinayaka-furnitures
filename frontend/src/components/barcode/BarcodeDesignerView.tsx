import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Product } from '../../types/retailDaddy';
import type {
  LabelElement,
  LabelTemplate,
  ExcelLabelRow,
  SerialGeneratorConfig,
  PrintEngineConfig
} from './types';
import { LABEL_PRESETS, DEFAULT_TEMPLATES } from './defaultTemplates';
import { TRUST_BADGES } from './badges';
import { LabelCanvas } from './LabelCanvas';
import { ExcelDataViewModal } from './ExcelDataViewModal';
import { PrintRenderer } from './PrintRenderer';
import { FurnitureAssemblyScannerModal } from '../inventory/FurnitureAssemblyScannerModal';
import { downloadProductBoxLabelsPdf } from '../../api/client';

interface BarcodeDesignerViewProps {
  products: Product[];
  selectedProduct?: Product;
  onOpenMobilePortal?: (sku: string) => void;
}

const LOCAL_STORAGE_KEY = 'svf_barcode_templates_v2';

export function BarcodeDesignerView({
  products,
  selectedProduct,
  onOpenMobilePortal
}: BarcodeDesignerViewProps) {
  // 1. Template Management State
  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load custom templates from localStorage:', e);
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === activeTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
  }, [templates, activeTemplateId]);

  // Persist templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.warn('Failed to save templates to localStorage:', e);
    }
  }, [templates]);

  // 2. Active Product & Inventory Data State
  const [currentProduct, setCurrentProduct] = useState<Product>(
    selectedProduct || products[0] || ({
      id: 'demo-1',
      pCode: 'SVF-WDB-01',
      name: 'Godrej Interio Royal Teakwood 3-Door Wardrobe',
      category: 'STEEL ALMIRAHS & STORWELS',
      barcode: '650125',
      mrp: 45000,
      retailPrice: 36500,
      discount: 18,
      size: '78"H x 42"W x 22"D',
      colour: 'Teak Walnut Gloss',
      openingStock: 8
    } as Product)
  );

  useEffect(() => {
    if (selectedProduct) {
      setCurrentProduct(selectedProduct);
    }
  }, [selectedProduct]);

  // Studio Mode: DESIGNER | SERIAL_GENERATOR | BATCH_INVENTORY
  const [studioMode, setStudioMode] = useState<'DESIGNER' | 'SERIAL_GENERATOR' | 'BATCH_INVENTORY'>('DESIGNER');

  // Selected Canvas Element
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Canvas View Controls
  const [zoom, setZoom] = useState<number>(1.0);
  const [snapGrid, setSnapGrid] = useState<boolean>(true);
  const [gridSizeMm, setGridSizeMm] = useState<number>(1);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // 3. Serial Generator (Auto-Numbers Mode) State
  const [serialConfig, setSerialConfig] = useState<SerialGeneratorConfig>({
    enabled: true,
    prefix: 'SVF-CHR-',
    startNumber: 1001,
    padLength: 4,
    suffix: '',
    totalLabels: 20,
    currentStep: 1
  });

  // 4. Excel & Batch Data State
  const [excelRows, setExcelRows] = useState<ExcelLabelRow[]>([]);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // 5. Print Engine State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printLabelsQueue, setPrintLabelsQueue] = useState<Array<{ data: Record<string, any>; copies: number }>>([]);
  const [printConfig, setPrintConfig] = useState<PrintEngineConfig>({
    mode: 'THERMAL_ROLL',
    thermalWidthMm: activeTemplate.widthMm,
    thermalHeightMm: activeTemplate.heightMm,
    a4Preset: '24_UP',
    a4Cols: 3,
    a4Rows: 8,
    a4MarginTopMm: 10,
    a4MarginLeftMm: 10,
    a4GapXMm: 2,
    a4GapYMm: 2
  });

  // UI Modals & Notifications
  const [showAssemblyScanner, setShowAssemblyScanner] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Keep print config dimensions in sync with active template
  useEffect(() => {
    setPrintConfig(prev => ({
      ...prev,
      thermalWidthMm: activeTemplate.widthMm,
      thermalHeightMm: activeTemplate.heightMm
    }));
  }, [activeTemplate.widthMm, activeTemplate.heightMm]);

  // Selected element reference
  const selectedElement = useMemo(() => {
    return activeTemplate.elements.find(el => el.id === selectedElementId) || null;
  }, [activeTemplate.elements, selectedElementId]);

  // Active product mapped to standard template keys
  const activeProductData = useMemo(() => {
    if (studioMode === 'SERIAL_GENERATOR' && serialConfig.enabled) {
      const serialNum = serialConfig.startNumber + (serialConfig.currentStep - 1);
      const padded = String(serialNum).padStart(serialConfig.padLength, '0');
      const generatedBarcode = `${serialConfig.prefix}${padded}${serialConfig.suffix}`;

      return {
        ...currentProduct,
        productName: currentProduct.name,
        skuCode: currentProduct.pCode,
        barcode: generatedBarcode,
        mrp: currentProduct.mrp,
        salePrice: currentProduct.retailPrice,
        dimensions: currentProduct.size || '78"L x 36"W x 34"H',
        material: currentProduct.colour || 'Solid Nilambur Teak',
        finish: 'Walnut Matte',
        warranty: '10 Years',
        batchDate: 'OCT 2026',
        discount: currentProduct.discount ? `${currentProduct.discount}% OFF` : 'Offer Price'
      };
    }

    return {
      ...currentProduct,
      productName: currentProduct.name,
      skuCode: currentProduct.pCode,
      barcode: currentProduct.barcode,
      mrp: currentProduct.mrp,
      salePrice: currentProduct.retailPrice,
      dimensions: currentProduct.size || '78"L x 36"W x 34"H',
      material: currentProduct.colour || 'Solid Nilambur Teak',
      finish: 'Walnut Matte',
      warranty: '10 Years',
      batchDate: 'OCT 2026',
      discount: currentProduct.discount ? `${currentProduct.discount}% OFF` : 'Offer Price'
    };
  }, [currentProduct, studioMode, serialConfig]);

  // ==========================================
  // TEMPLATE CRUD ACTIONS
  // ==========================================
  const handleUpdateActiveTemplate = (updated: LabelTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleUpdateElement = (updatedElement: LabelElement) => {
    const nextElements = activeTemplate.elements.map(el =>
      el.id === updatedElement.id ? updatedElement : el
    );
    handleUpdateActiveTemplate({ ...activeTemplate, elements: nextElements });
  };

  const handleCreateNewTemplate = (preset?: typeof LABEL_PRESETS[0]) => {
    const newId = `tpl-custom-${Date.now()}`;
    const p = preset || LABEL_PRESETS[1];
    const newTpl: LabelTemplate = {
      id: newId,
      name: `Custom ${p.widthMm}x${p.heightMm}mm Label`,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      unit: 'mm',
      backgroundColor: '#ffffff',
      elements: [
        {
          id: `el-txt-brand-${Date.now()}`,
          type: 'text',
          content: 'SRI VINAYAKA FURNITURES',
          x: 2,
          y: 2,
          width: p.widthMm - 4,
          height: 4.5,
          zIndex: 1,
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          fontSize: 8.5,
          fontWeight: '900',
          textAlign: 'center',
          color: '#0f172a'
        },
        {
          id: `el-txt-name-${Date.now()}`,
          type: 'text',
          content: '{{product_name}}',
          x: 2,
          y: 7,
          width: p.widthMm - 4,
          height: 5.5,
          zIndex: 1,
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          fontSize: 9.5,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#0284c7',
          autoShrink: true
        },
        {
          id: `el-bar-${Date.now()}`,
          type: 'barcode',
          barcodeFormat: 'CODE128',
          barcodeValue: '{{barcode}}',
          x: 4,
          y: p.heightMm - 14,
          width: p.widthMm - 8,
          height: 12,
          zIndex: 1,
          showText: true,
          barcodeFontSize: 7.5
        }
      ]
    };

    setTemplates(prev => [...prev, newTpl]);
    setActiveTemplateId(newId);
    showToast(`✓ Created new template (${p.widthMm} × ${p.heightMm}mm)`);
  };

  const handleDuplicateTemplate = () => {
    const dupId = `tpl-dup-${Date.now()}`;
    const dup: LabelTemplate = {
      ...activeTemplate,
      id: dupId,
      name: `${activeTemplate.name} (Copy)`,
      isPredefined: false
    };
    setTemplates(prev => [...prev, dup]);
    setActiveTemplateId(dupId);
    showToast(`✓ Duplicated template "${activeTemplate.name}"`);
  };

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) {
      showToast('⚠️ Cannot delete the only remaining template.');
      return;
    }
    const remaining = templates.filter(t => t.id !== activeTemplate.id);
    setTemplates(remaining);
    setActiveTemplateId(remaining[0].id);
    showToast(`✓ Deleted template "${activeTemplate.name}"`);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all templates to factory showroom defaults? Custom templates will be replaced.')) {
      setTemplates(DEFAULT_TEMPLATES);
      setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      showToast('✓ Restored official showroom templates!');
    }
  };

  // ==========================================
  // ELEMENT TOOLBOX ACTIONS
  // ==========================================
  const handleAddTextElement = (isDynamic: boolean = false, token: string = '{{product_name}}') => {
    const newId = `el-text-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'text',
      content: isDynamic ? token : 'Custom Label',
      x: 5,
      y: 5,
      width: Math.min(activeTemplate.widthMm - 10, 60),
      height: 8,
      zIndex: activeTemplate.elements.length + 1,
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'left',
      color: '#0f172a',
      autoShrink: true,
      wrap: false
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast(`✓ Added ${isDynamic ? 'Dynamic Field' : 'Text'} element`);
  };

  const handleAddBarcodeElement = () => {
    const newId = `el-barcode-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'barcode',
      barcodeFormat: 'CODE128',
      barcodeValue: '{{barcode}}',
      x: 5,
      y: Math.max(5, activeTemplate.heightMm - 20),
      width: Math.min(activeTemplate.widthMm - 10, 60),
      height: 14,
      zIndex: activeTemplate.elements.length + 1,
      showText: true,
      barcodeFontSize: 8
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast('✓ Added 1D Barcode (CODE128 SVG)');
  };

  const handleAddQrElement = () => {
    const newId = `el-qr-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'qrcode',
      qrValue: 'https://srivinayakafurnitures.pages.dev/?sku={{sku_code}}&scan=1',
      x: 5,
      y: 5,
      width: 22,
      height: 22,
      zIndex: activeTemplate.elements.length + 1
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast('✓ Added 2D Showroom QR Code');
  };

  const handleAddShapeElement = () => {
    const newId = `el-shape-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'shape',
      shapeType: 'rectangle',
      x: 4,
      y: 4,
      width: activeTemplate.widthMm - 8,
      height: 18,
      zIndex: 1,
      fillColor: '#f8fafc',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      borderRadius: 2
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [newEl, ...activeTemplate.elements] // Insert at back
    });
    setSelectedElementId(newId);
    showToast('✓ Added Rectangle Shape');
  };

  const handleAddLineElement = (orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    const newId = `el-line-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'line',
      lineOrientation: orientation,
      x: orientation === 'horizontal' ? 4 : Math.round(activeTemplate.widthMm / 2),
      y: orientation === 'horizontal' ? Math.round(activeTemplate.heightMm / 2) : 4,
      width: orientation === 'horizontal' ? activeTemplate.widthMm - 8 : 1,
      height: orientation === 'horizontal' ? 1 : activeTemplate.heightMm - 8,
      zIndex: activeTemplate.elements.length + 1,
      lineColor: '#cbd5e1',
      lineWidth: 0.5,
      lineStyle: 'solid'
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast(`✓ Added ${orientation} Divider Line`);
  };

  const handleAddSpecTableElement = () => {
    const newId = `el-spectable-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'spec_table',
      x: 4,
      y: 20,
      width: activeTemplate.widthMm - 8,
      height: 30,
      zIndex: activeTemplate.elements.length + 1,
      tableFontSize: 7,
      tableBorderColor: '#cbd5e1',
      headerBg: '#f1f5f9',
      specRows: [
        { label: 'Dimensions', value: '{{dimensions}}' },
        { label: 'Material', value: '{{material}}' },
        { label: 'Finish', value: '{{finish}}' },
        { label: 'Warranty', value: '{{warranty}}' },
        { label: 'Care', value: 'Dry cloth only' }
      ]
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast('✓ Added 1-Click Furniture Specification Table');
  };

  const handleAddBadgeElement = (badgeId: string = 'pure-teak') => {
    const newId = `el-badge-${Date.now()}`;
    const newEl: LabelElement = {
      id: newId,
      type: 'badge',
      badgeId,
      x: 4,
      y: 10,
      width: Math.min(activeTemplate.widthMm - 8, 70),
      height: 12,
      zIndex: activeTemplate.elements.length + 1
    };

    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newEl]
    });
    setSelectedElementId(newId);
    showToast('✓ Added Trust Badge');
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const newId = `el-img-${Date.now()}`;
      const newEl: LabelElement = {
        id: newId,
        type: 'image',
        imageUrl: dataUrl,
        x: 4,
        y: 4,
        width: 30,
        height: 15,
        zIndex: activeTemplate.elements.length + 1
      };

      handleUpdateActiveTemplate({
        ...activeTemplate,
        elements: [...activeTemplate.elements, newEl]
      });
      setSelectedElementId(newId);
      showToast('✓ Uploaded Store Logo / Custom Badge');
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;
    const remaining = activeTemplate.elements.filter(el => el.id !== selectedElementId);
    handleUpdateActiveTemplate({ ...activeTemplate, elements: remaining });
    setSelectedElementId(null);
    showToast('✓ Element deleted');
  };

  const handleDuplicateSelectedElement = () => {
    if (!selectedElement) return;
    const dup: LabelElement = {
      ...selectedElement,
      id: `el-dup-${Date.now()}`,
      x: Math.min(activeTemplate.widthMm - selectedElement.width, selectedElement.x + 3),
      y: Math.min(activeTemplate.heightMm - selectedElement.height, selectedElement.y + 3),
      zIndex: activeTemplate.elements.length + 1
    };
    handleUpdateActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, dup]
    });
    setSelectedElementId(dup.id);
    showToast('✓ Element duplicated');
  };

  // ==========================================
  // PRINT TRIGGER DISPATCHERS
  // ==========================================
  // 1. Sample Print (Exactly 1 label for alignment verification)
  const handleSamplePrint = () => {
    setPrintLabelsQueue([{ data: activeProductData, copies: 1 }]);
    setIsPrintModalOpen(true);
  };

  // 2. Print Active Product with N Copies
  const handlePrintActiveProduct = (copies: number = 1) => {
    setPrintLabelsQueue([{ data: activeProductData, copies }]);
    setIsPrintModalOpen(true);
  };

  // 3. Print Serial Sequence
  const handlePrintSerialSequence = () => {
    const queue: Array<{ data: Record<string, any>; copies: number }> = [];
    for (let i = 0; i < serialConfig.totalLabels; i++) {
      const serialNum = serialConfig.startNumber + i;
      const padded = String(serialNum).padStart(serialConfig.padLength, '0');
      const barcode = `${serialConfig.prefix}${padded}${serialConfig.suffix}`;

      queue.push({
        data: {
          ...currentProduct,
          productName: currentProduct.name,
          skuCode: currentProduct.pCode,
          barcode,
          mrp: currentProduct.mrp,
          salePrice: currentProduct.retailPrice,
          dimensions: currentProduct.size || '78"L x 36"W x 34"H',
          material: currentProduct.colour || 'Solid Teak',
          finish: 'Walnut Matt',
          warranty: '10 Years',
          batchDate: 'OCT 2026',
          discount: 'Special Offer'
        },
        copies: 1
      });
    }

    setPrintLabelsQueue(queue);
    setIsPrintModalOpen(true);
  };

  // 4. Print Excel Batch
  const handlePrintExcelBatch = (rows: ExcelLabelRow[]) => {
    const queue = rows.map(r => ({
      data: {
        productName: r.productName,
        skuCode: r.skuCode,
        barcode: r.barcode,
        category: r.category,
        mrp: r.mrp,
        salePrice: r.salePrice,
        discount: r.discount,
        dimensions: r.dimensions,
        material: r.material,
        finish: r.finish,
        warranty: r.warranty,
        batchDate: r.batchDate
      },
      copies: r.copies || 1
    }));

    setPrintLabelsQueue(queue);
    setIsExcelModalOpen(false);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      {/* 1. TOP TITLEBAR & WORKSPACE NAVIGATION */}
      <div className="rd-window-header-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🏷️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.5px' }}>
              BARCODE & SHOWROOM HANG-TAG DESIGN STUDIO
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>
              Sri Vinayaka Furnitures • WYSIWYG Thermal & Hang-Tag Engine
            </div>
          </div>
        </div>

        {/* Sub-Module Switcher Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '5px' }}>
          <button
            onClick={() => setStudioMode('DESIGNER')}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '3px',
              border: 'none',
              background: studioMode === 'DESIGNER' ? '#ffffff' : 'transparent',
              color: studioMode === 'DESIGNER' ? '#0f766e' : '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            🎨 WYSIWYG Designer
          </button>
          <button
            onClick={() => setStudioMode('SERIAL_GENERATOR')}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '3px',
              border: 'none',
              background: studioMode === 'SERIAL_GENERATOR' ? '#ffffff' : 'transparent',
              color: studioMode === 'SERIAL_GENERATOR' ? '#0f766e' : '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            🔢 Serial Auto-Numbers
          </button>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '3px',
              border: 'none',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📊 Excel Data View
          </button>
        </div>

        {/* Action Buttons Header */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={async () => {
              try {
                showToast(`📄 Generating Multi-Box Carton Labels PDF for ${currentProduct.pCode}...`);
                await downloadProductBoxLabelsPdf(currentProduct.pCode || currentProduct.id);
                showToast(`✓ Multi-Box PDF successfully generated and downloaded!`);
              } catch (err: any) {
                showToast(`Notice: ${err.message}. Printing fallback.`);
                handleSamplePrint();
              }
            }}
            className="rd-btn-header"
            style={{ background: '#0f766e', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Download Official Multi-Box Carton Stickers PDF"
          >
            📄 MULTI-BOX PDF
          </button>

          <button
            className="rd-btn-header"
            style={{ background: '#059669', color: '#fff' }}
            onClick={() => setShowAssemblyScanner(true)}
          >
            🔨 ASSEMBLY SCANNER
          </button>

          {onOpenMobilePortal && (
            <button
              className="rd-btn-header"
              style={{ background: '#0284c7', color: '#fff' }}
              onClick={() => onOpenMobilePortal(currentProduct.pCode)}
            >
              📱 MOBILE PORTAL
            </button>
          )}

          <button
            onClick={handleSamplePrint}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '800',
              background: '#f59e0b',
              color: '#000000',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title="Print exactly 1 label to test alignment"
          >
            🎯 SAMPLE PRINT (1)
          </button>

          <button
            className="rd-btn-header export"
            style={{ background: '#16a34a', color: '#ffffff', fontWeight: '900' }}
            onClick={() => handlePrintActiveProduct(4)}
          >
            🖨️ PRINT LABELS
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', borderBottom: '1px solid #a7f3d0', padding: '5px 16px', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center' }}>
          {toastMsg}
        </div>
      )}

      {/* 2. SUB-HEADER / CONTROLS RIBBON */}
      <div style={{ background: '#ffffff', padding: '6px 14px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {/* Template Selector & Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Template:</span>
          <select
            value={activeTemplate.id}
            onChange={e => setActiveTemplateId(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '11.5px',
              fontWeight: 'bold',
              borderRadius: '4px',
              border: '1.5px solid #0284c7',
              color: '#0f172a'
            }}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.widthMm}×{t.heightMm}mm)
              </option>
            ))}
          </select>

          {/* Quick Preset Dimensions */}
          <select
            value=""
            onChange={e => {
              const matchedPreset = LABEL_PRESETS.find(p => p.key === e.target.value);
              if (matchedPreset) {
                handleUpdateActiveTemplate({
                  ...activeTemplate,
                  widthMm: matchedPreset.widthMm,
                  heightMm: matchedPreset.heightMm
                });
                showToast(`✓ Set dimensions to ${matchedPreset.widthMm} × ${matchedPreset.heightMm}mm`);
              }
            }}
            style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value="">📐 Apply Preset Size...</option>
            {LABEL_PRESETS.map(p => (
              <option key={p.key} value={p.key}>
                {p.name} - {p.description}
              </option>
            ))}
          </select>

          {/* Custom Width & Height Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#64748b' }}>W:</span>
            <input
              type="number"
              min="20"
              max="300"
              value={activeTemplate.widthMm}
              onChange={e => handleUpdateActiveTemplate({ ...activeTemplate, widthMm: parseInt(e.target.value, 10) || 50 })}
              style={{ width: '44px', padding: '3px 4px', fontSize: '11px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
            <span style={{ color: '#64748b' }}>× H:</span>
            <input
              type="number"
              min="15"
              max="400"
              value={activeTemplate.heightMm}
              onChange={e => handleUpdateActiveTemplate({ ...activeTemplate, heightMm: parseInt(e.target.value, 10) || 25 })}
              style={{ width: '44px', padding: '3px 4px', fontSize: '11px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '3px' }}
            />
            <span style={{ color: '#64748b' }}>mm</span>
          </div>

          {/* Template Actions */}
          <button
            onClick={() => handleCreateNewTemplate()}
            style={{ padding: '4px 8px', fontSize: '10.5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Create blank new template"
          >
            ➕ New
          </button>
          <button
            onClick={handleDuplicateTemplate}
            style={{ padding: '4px 8px', fontSize: '10.5px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
            title="Duplicate active template"
          >
            📋 Duplicate
          </button>
          <button
            onClick={handleDeleteTemplate}
            style={{ padding: '4px 8px', fontSize: '10.5px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '3px', cursor: 'pointer' }}
            title="Delete active template"
          >
            🗑️ Delete
          </button>
          <button
            onClick={handleResetToDefaults}
            style={{ padding: '4px 8px', fontSize: '10.5px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer', color: '#64748b' }}
            title="Reset to factory showroom templates"
          >
            ↺ Defaults
          </button>
        </div>

        {/* Canvas Zoom & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Zoom:</span>
          <button
            onClick={() => setZoom(prev => Math.max(0.25, Number((prev - 0.15).toFixed(2))))}
            style={{ padding: '2px 8px', fontSize: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
          >
            -
          </button>
          <span style={{ fontSize: '11px', fontWeight: '900', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(4.0, Number((prev + 0.15).toFixed(2))))}
            style={{ padding: '2px 8px', fontSize: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(1.0)}
            style={{ padding: '2px 6px', fontSize: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
          >
            100%
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#475569', marginLeft: '6px' }}>
            <input
              type="checkbox"
              checked={snapGrid}
              onChange={e => setSnapGrid(e.target.checked)}
            />
            <span>Snap Grid</span>
          </label>

          <select
            value={gridSizeMm}
            onChange={e => setGridSizeMm(parseInt(e.target.value, 10))}
            style={{ padding: '2px 4px', fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
          >
            <option value="1">1mm</option>
            <option value="2">2mm</option>
            <option value="5">5mm</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#475569' }}>
            <input
              type="checkbox"
              checked={showGridLines}
              onChange={e => setShowGridLines(e.target.checked)}
            />
            <span>Dots</span>
          </label>
        </div>
      </div>

      {/* 3. MAIN STUDIO BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ============================================================== */}
        {/* LEFT TOOLBOX PALETTE                                           */}
        {/* ============================================================== */}
        <div style={{
          width: '280px',
          background: '#f8fafc',
          borderRight: '1px solid #cbd5e1',
          padding: '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Active Product Selector */}
          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
              PREVIEW PRODUCT DATA :
            </label>
            <select
              value={currentProduct.id}
              onChange={e => {
                const p = products.find(x => x.id === e.target.value);
                if (p) setCurrentProduct(p);
              }}
              style={{ width: '100%', padding: '5px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #0284c7', fontWeight: 'bold' }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.substring(0, 32)} ({p.pCode})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              Barcode: <strong>{currentProduct.barcode}</strong> • MRP: <strong>₹{currentProduct.mrp}</strong>
            </div>
          </div>

          {/* Serial Auto-Numbers Controls (When in Serial Mode) */}
          {studioMode === 'SERIAL_GENERATOR' && (
            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '6px', border: '1.5px solid #10b981' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '900', color: '#065f46', marginBottom: '6px' }}>
                🔢 CONTINUOUS SERIAL GENERATOR
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div>
                  <span style={{ color: '#047857', fontWeight: 'bold' }}>Prefix:</span>
                  <input
                    type="text"
                    value={serialConfig.prefix}
                    onChange={e => setSerialConfig(prev => ({ ...prev, prefix: e.target.value }))}
                    style={{ width: '100%', padding: '3px 6px', fontSize: '11px', borderRadius: '3px', border: '1px solid #a7f3d0' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#047857', fontWeight: 'bold' }}>Start Number:</span>
                    <input
                      type="number"
                      value={serialConfig.startNumber}
                      onChange={e => setSerialConfig(prev => ({ ...prev, startNumber: parseInt(e.target.value, 10) || 1 }))}
                      style={{ width: '100%', padding: '3px 6px', fontSize: '11px', borderRadius: '3px', border: '1px solid #a7f3d0' }}
                    />
                  </div>
                  <div style={{ width: '70px' }}>
                    <span style={{ color: '#047857', fontWeight: 'bold' }}>Digits:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={serialConfig.padLength}
                      onChange={e => setSerialConfig(prev => ({ ...prev, padLength: parseInt(e.target.value, 10) || 4 }))}
                      style={{ width: '100%', padding: '3px 6px', fontSize: '11px', borderRadius: '3px', border: '1px solid #a7f3d0' }}
                    />
                  </div>
                </div>

                <div>
                  <span style={{ color: '#047857', fontWeight: 'bold' }}>Total Stickers to Generate:</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={serialConfig.totalLabels}
                    onChange={e => setSerialConfig(prev => ({ ...prev, totalLabels: parseInt(e.target.value, 10) || 10 }))}
                    style={{ width: '100%', padding: '3px 6px', fontSize: '11px', borderRadius: '3px', border: '1px solid #a7f3d0' }}
                  />
                </div>

                {/* Live Stepper Preview */}
                <div style={{ background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid #a7f3d0', marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>
                    Previewing: Label {serialConfig.currentStep} of {serialConfig.totalLabels}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                    <button
                      onClick={() => setSerialConfig(prev => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }))}
                      disabled={serialConfig.currentStep <= 1}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      &lt; Prev
                    </button>
                    <button
                      onClick={() => setSerialConfig(prev => ({ ...prev, currentStep: Math.min(prev.totalLabels, prev.currentStep + 1) }))}
                      disabled={serialConfig.currentStep >= serialConfig.totalLabels}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Next &gt;
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textAlign: 'center', marginTop: '4px', fontFamily: 'monospace' }}>
                    {activeProductData.barcode}
                  </div>
                </div>

                <button
                  onClick={handlePrintSerialSequence}
                  style={{
                    padding: '6px',
                    fontSize: '11px',
                    fontWeight: '900',
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  🖨️ Print Serial Sequence ({serialConfig.totalLabels})
                </button>
              </div>
            </div>
          )}

          {/* Designer Toolbox Palette */}
          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
              INSERT DESIGN ELEMENTS :
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                onClick={() => handleAddTextElement(false)}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                ✏️ Static Text
              </button>
              <button
                onClick={handleAddBarcodeElement}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                ║▌ 1D Barcode
              </button>
              <button
                onClick={handleAddQrElement}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                📱 2D QR Code
              </button>
              <button
                onClick={handleAddShapeElement}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                ⬜ Rectangle Box
              </button>
              <button
                onClick={() => handleAddLineElement('horizontal')}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                ➖ Divider Line
              </button>
              <button
                onClick={handleAddSpecTableElement}
                style={{ padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' }}
              >
                📋 Spec Table
              </button>
            </div>

            {/* Store Logo Upload */}
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '6px', fontSize: '10.5px', fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer' }}
              >
                🖼️ Upload Store Logo / Badge
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadLogo}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Quick Insert Dynamic Inventory Fields */}
          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>
              DYNAMIC DATABASE TOKENS :
            </label>
            <div style={{ fontSize: '9.5px', color: '#64748b', marginBottom: '6px' }}>
              Click to insert dynamic inventory field into design:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {[
                { token: '{{product_name}}', label: 'Product Name' },
                { token: '{{sku_code}}', label: 'SKU Code' },
                { token: '{{category}}', label: 'Category' },
                { token: '{{mrp}}', label: 'MRP' },
                { token: '{{sale_price}}', label: 'Sale Price' },
                { token: '{{discount}}', label: 'Discount' },
                { token: '{{dimensions}}', label: 'Dimensions' },
                { token: '{{material}}', label: 'Material' },
                { token: '{{finish}}', label: 'Finish' },
                { token: '{{warranty}}', label: 'Warranty' },
                { token: '{{batch_date}}', label: 'Batch Date' },
                { token: '{{barcode}}', label: 'Barcode No' }
              ].map(item => (
                <button
                  key={item.token}
                  onClick={() => handleAddTextElement(true, item.token)}
                  style={{
                    padding: '3px 6px',
                    fontSize: '9.5px',
                    fontWeight: 'bold',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                  title={`Insert ${item.token}`}
                >
                  +{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Badges Picker */}
          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>
              1-CLICK FURNITURE TRUST BADGES :
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {TRUST_BADGES.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleAddBadgeElement(b.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    background: b.secondaryColor,
                    color: b.primaryColor,
                    border: `1px solid ${b.primaryColor}`,
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  🏷️ {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER INTERACTIVE CANVAS STUDIO                               */}
        {/* ============================================================== */}
        <LabelCanvas
          template={activeTemplate}
          activeProductData={activeProductData}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
          zoom={zoom}
          setZoom={setZoom}
          snapGrid={snapGrid}
          gridSizeMm={gridSizeMm}
          showGridLines={showGridLines}
        />

        {/* ============================================================== */}
        {/* RIGHT PROPERTIES & FORMATTING INSPECTOR                        */}
        {/* ============================================================== */}
        <div style={{
          width: '300px',
          background: '#ffffff',
          borderLeft: '1px solid #cbd5e1',
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {selectedElement ? (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                  PROPERTIES: {selectedElement.type.toUpperCase()}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleDuplicateSelectedElement}
                    title="Duplicate Element"
                    style={{ padding: '2px 6px', fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    📋
                  </button>
                  <button
                    onClick={handleDeleteSelectedElement}
                    title="Delete Element"
                    style={{ padding: '2px 6px', fontSize: '11px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Coordinates & Geometry */}
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                  POSITION & SIZE (MM) :
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '10px' }}>
                  <div>
                    <span>X:</span>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={e => handleUpdateElement({ ...selectedElement, x: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <span>Y:</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={e => handleUpdateElement({ ...selectedElement, y: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <span>W:</span>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={e => handleUpdateElement({ ...selectedElement, width: parseFloat(e.target.value) || 5 })}
                      style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                  <div>
                    <span>H:</span>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={e => handleUpdateElement({ ...selectedElement, height: parseFloat(e.target.value) || 5 })}
                      style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                  </div>
                </div>

                {/* Alignment buttons */}
                <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                  <button
                    onClick={() => handleUpdateElement({ ...selectedElement, x: 0 })}
                    style={{ flex: 1, padding: '2px', fontSize: '9px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
                  >
                    Align L
                  </button>
                  <button
                    onClick={() => handleUpdateElement({ ...selectedElement, x: Math.round((activeTemplate.widthMm - selectedElement.width) / 2) })}
                    style={{ flex: 1, padding: '2px', fontSize: '9px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => handleUpdateElement({ ...selectedElement, x: activeTemplate.widthMm - selectedElement.width })}
                    style={{ flex: 1, padding: '2px', fontSize: '9px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
                  >
                    Align R
                  </button>
                </div>
              </div>

              {/* Text-Specific Properties */}
              {selectedElement.type === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>Content / Dynamic Token:</label>
                    <textarea
                      rows={2}
                      value={selectedElement.content || ''}
                      onChange={e => handleUpdateElement({ ...selectedElement, content: e.target.value })}
                      style={{ width: '100%', padding: '4px', fontSize: '11px', borderRadius: '3px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Font Styling Buttons */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>Typography & Formatting:</label>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: selectedElement.fontWeight === 'bold' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.fontWeight === 'bold' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        B
                      </button>
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontStyle: 'italic',
                          background: selectedElement.fontStyle === 'italic' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.fontStyle === 'italic' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        I
                      </button>
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, textDecoration: selectedElement.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          textDecoration: 'line-through',
                          background: selectedElement.textDecoration === 'line-through' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.textDecoration === 'line-through' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Strikethrough (Crucial for MRP)"
                      >
                        S
                      </button>

                      {/* Alignments */}
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, textAlign: 'left' })}
                        style={{
                          padding: '4px 6px',
                          fontSize: '10px',
                          background: selectedElement.textAlign === 'left' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.textAlign === 'left' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Left
                      </button>
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, textAlign: 'center' })}
                        style={{
                          padding: '4px 6px',
                          fontSize: '10px',
                          background: selectedElement.textAlign === 'center' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.textAlign === 'center' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Center
                      </button>
                      <button
                        onClick={() => handleUpdateElement({ ...selectedElement, textAlign: 'right' })}
                        style={{
                          padding: '4px 6px',
                          fontSize: '10px',
                          background: selectedElement.textAlign === 'right' ? '#0284c7' : '#f1f5f9',
                          color: selectedElement.textAlign === 'right' ? '#fff' : '#000',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Right
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Font Size (pt):</span>
                        <input
                          type="number"
                          min="5"
                          max="72"
                          value={selectedElement.fontSize || 10}
                          onChange={e => handleUpdateElement({ ...selectedElement, fontSize: parseInt(e.target.value, 10) || 10 })}
                          style={{ width: '100%', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Text Color:</span>
                        <input
                          type="color"
                          value={selectedElement.color || '#000000'}
                          onChange={e => handleUpdateElement({ ...selectedElement, color: e.target.value })}
                          style={{ width: '100%', height: '26px', padding: '1px', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Anti-Clipping & Stretch Toggles */}
                  <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '4px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#166534', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={selectedElement.autoShrink ?? true}
                        onChange={e => handleUpdateElement({ ...selectedElement, autoShrink: e.target.checked })}
                      />
                      <span>Auto-Shrink (Prevent Clipping)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#166534', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={selectedElement.wrap ?? false}
                        onChange={e => handleUpdateElement({ ...selectedElement, wrap: e.target.checked })}
                      />
                      <span>Wrap Text across Lines</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#166534', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={selectedElement.stretch ?? false}
                        onChange={e => handleUpdateElement({ ...selectedElement, stretch: e.target.checked })}
                      />
                      <span>Stretch Scale Font on Resize</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Barcode-Specific Properties */}
              {selectedElement.type === 'barcode' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>Barcode Standard:</label>
                    <select
                      value={selectedElement.barcodeFormat || 'CODE128'}
                      onChange={e => handleUpdateElement({ ...selectedElement, barcodeFormat: e.target.value as any })}
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value="CODE128">CODE128 (Universal Showroom Standard)</option>
                      <option value="EAN13">EAN13 (Retail Standard 13-digit)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>Barcode Value / Token:</label>
                    <input
                      type="text"
                      value={selectedElement.barcodeValue || '{{barcode}}'}
                      onChange={e => handleUpdateElement({ ...selectedElement, barcodeValue: e.target.value })}
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={selectedElement.showText !== false}
                      onChange={e => handleUpdateElement({ ...selectedElement, showText: e.target.checked })}
                    />
                    <span>Show Human-Readable Text Below</span>
                  </label>
                </div>
              )}

              {/* QR Code Specific Properties */}
              {selectedElement.type === 'qrcode' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>QR Destination URL / Data:</label>
                    <input
                      type="text"
                      value={selectedElement.qrValue || ''}
                      onChange={e => handleUpdateElement({ ...selectedElement, qrValue: e.target.value })}
                      style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                      Supports dynamic SKU portal link: <code style={{ color: '#0369a1' }}>https://srivinayakafurnitures.pages.dev/?sku=&#123;&#123;sku_code&#125;&#125;&scan=1</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape / Rectangle Specific Properties */}
              {selectedElement.type === 'shape' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Fill Color:</span>
                      <input
                        type="color"
                        value={selectedElement.fillColor === 'transparent' ? '#ffffff' : (selectedElement.fillColor || '#ffffff')}
                        onChange={e => handleUpdateElement({ ...selectedElement, fillColor: e.target.value })}
                        style={{ width: '100%', height: '26px', padding: '1px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Border Color:</span>
                      <input
                        type="color"
                        value={selectedElement.borderColor || '#cbd5e1'}
                        onChange={e => handleUpdateElement({ ...selectedElement, borderColor: e.target.value })}
                        style={{ width: '100%', height: '26px', padding: '1px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Border Width (mm):</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={selectedElement.borderWidth || 0.5}
                        onChange={e => handleUpdateElement({ ...selectedElement, borderWidth: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Radius (mm):</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={selectedElement.borderRadius || 0}
                        onChange={e => handleUpdateElement({ ...selectedElement, borderRadius: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖱️</div>
              <strong>No Element Selected</strong>
              <div style={{ fontSize: '10.5px', marginTop: '4px' }}>
                Click any element on the canvas to edit its properties, drag to move, or resize using the handles.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODALS */}
      {/* Excel Data View & Batch Manager Modal */}
      {isExcelModalOpen && (
        <ExcelDataViewModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          template={activeTemplate}
          products={products}
          excelRows={excelRows}
          setExcelRows={setExcelRows}
          onPreviewRow={row => {
            setCurrentProduct({
              ...currentProduct,
              name: row.productName,
              barcode: row.barcode,
              pCode: row.skuCode,
              mrp: row.mrp,
              retailPrice: row.salePrice,
              size: row.dimensions,
              colour: row.material
            });
            showToast(`✓ Loaded "${row.productName}" into canvas preview`);
          }}
          onPrintBatch={handlePrintExcelBatch}
          showToast={showToast}
        />
      )}

      {/* Exact-Size Thermal Roll & A4 Print Engine Modal */}
      {isPrintModalOpen && (
        <PrintRenderer
          template={activeTemplate}
          labelsToPrint={printLabelsQueue}
          config={printConfig}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          onConfirmPrint={() => {
            setIsPrintModalOpen(false);
            showToast('✓ Print dispatched to printer driver!');
          }}
        />
      )}

      {/* Godrej Flat-Pack Assembly Scanner Modal */}
      {showAssemblyScanner && (
        <FurnitureAssemblyScannerModal
          isOpen={showAssemblyScanner}
          onClose={() => setShowAssemblyScanner(false)}
          products={products}
          initialProduct={currentProduct}
        />
      )}
    </div>
  );
}
