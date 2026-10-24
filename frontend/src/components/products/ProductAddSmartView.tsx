import { useState, useRef, useEffect } from 'react';
import type { Product, Category, SubCategory, ColumnVisibilityConfig, ProductDefaultConfig, ProductVariant, CompanyInfo } from '../../types/retailDaddy';
import { DEFAULT_PRODUCT_CONFIG } from '../../data/retailDaddyData';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { extractProductFromRow } from '../../utils/csvImporter';
import { GodrejSkuGeneratorModal } from './GodrejSkuGeneratorModal';
import { api } from '../../api/client';
import { BarcodeHardwareHubModal } from '../hardware/BarcodeHardwareHubModal';

interface ProductAddSmartViewProps {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  columnConfig: ColumnVisibilityConfig;
  companyInfo?: CompanyInfo;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onAddCategory: (cat: Category) => void;
  onAddSubCategory: (sub: SubCategory) => void;
  onUpdateColumnConfig: (cfg: ColumnVisibilityConfig) => void;
  onPrintBarcode: (product: Product, copies: number) => void;
  onBulkUpdateProducts?: (products: Product[]) => void;
  onClose?: () => void;
}

export function ProductAddSmartView({
  products,
  categories,
  subCategories,
  columnConfig,
  companyInfo,
  onAddProduct,
  onUpdateProduct,
  onAddCategory,
  onAddSubCategory,
  onUpdateColumnConfig,
  onPrintBarcode,
  onBulkUpdateProducts,
  onClose
}: ProductAddSmartViewProps) {
  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [topRecords, setTopRecords] = useState<number>(50);
  const [barcodeCopies, setBarcodeCopies] = useState<number>(1);
  const [selectAll, setSelectAll] = useState(false);

  // Modals (Video 24, 23, 22)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showSetDefaultModal, setShowSetDefaultModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showSkuGenModal, setShowSkuGenModal] = useState<boolean>(false);
  const [isSmartViewHardwareHubOpen, setIsSmartViewHardwareHubOpen] = useState<boolean>(false);
  const [hardwareHubProduct, setHardwareHubProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('GENERAL');

  // Default Configuration State (from Video 22 frame 210 frmProductDefault)
  const [productDefaults, setProductDefaults] = useState<ProductDefaultConfig>(() => {
    try {
      const saved = localStorage.getItem('rd_product_defaults');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PRODUCT_CONFIG;
  });

  useEffect(() => {
    api.getSystemSetting('rd_product_defaults').then(val => {
      if (val && typeof val === 'object') {
        setProductDefaults(val);
      }
    }).catch(() => {});
  }, []);

  // Variant Entry Form State
  const [variantList, setVariantList] = useState<ProductVariant[]>([]);
  const [variantForm, setVariantForm] = useState<{
    size: string;
    colour: string;
    qty: number;
    barcode: string;
    mrp: number;
    retailPrice: number;
    woodType?: string;
    storageType?: string;
  }>({
    size: 'King (72x78 in)',
    colour: 'Natural Teak Matte',
    woodType: 'Solid Teak Wood',
    storageType: 'Hydraulic Storage',
    qty: 1,
    barcode: '',
    mrp: 35000,
    retailPrice: 32000
  });

  const handleOpenVariantModal = (prod: Product) => {
    setSelectedVariantProduct(prod);
    setVariantList(prod.variants ? [...prod.variants] : []);
    const cleanPCode = (prod.pCode || 'FURN').replace(/[^a-zA-Z0-9]/g, '');
    setVariantForm({
      size: 'King (72x78 in)',
      colour: 'Natural Teak Matte',
      woodType: 'Solid Teak Wood',
      storageType: 'Hydraulic Storage',
      qty: 1,
      barcode: `${prod.barcode || cleanPCode}-KNG-HYD`,
      mrp: prod.mrp || 35000,
      retailPrice: prod.retailPrice || 32000
    });
    setShowVariantModal(true);
  };

  const handleAddVariant = () => {
    if (!selectedVariantProduct) return;
    const newV: ProductVariant = {
      id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: selectedVariantProduct.id,
      pCode: selectedVariantProduct.pCode,
      size: variantForm.size.trim(),
      colour: variantForm.colour.trim(),
      qty: Number(variantForm.qty) || 1,
      barcode: variantForm.barcode.trim() || `${selectedVariantProduct.barcode}-${variantForm.size}-${variantForm.colour}`,
      mrp: Number(variantForm.mrp) || selectedVariantProduct.mrp,
      retailPrice: Number(variantForm.retailPrice) || selectedVariantProduct.retailPrice
    };
    setVariantList(prev => [...prev, newV]);
    showToast(`Added variant: ${newV.size} / ${newV.colour}`);
  };

  const handleRemoveVariant = (varId: string) => {
    setVariantList(prev => prev.filter(v => v.id !== varId));
  };

  const handleSaveVariants = () => {
    if (!selectedVariantProduct) return;
    const totalVariantQty = variantList.reduce((sum, v) => sum + (v.qty || 0), 0);
    const updated: Product = {
      ...selectedVariantProduct,
      variants: variantList,
      openingStock: totalVariantQty > 0 ? totalVariantQty : selectedVariantProduct.openingStock
    };
    onUpdateProduct(updated);
    setShowVariantModal(false);
    showToast(`✅ Saved ${variantList.length} variants for ${updated.name}`);
  };

  const handleSaveDefaults = () => {
    localStorage.setItem('rd_product_defaults', JSON.stringify(productDefaults));
    api.saveSystemSetting('rd_product_defaults', productDefaults).catch(console.warn);
    showToast('✅ Default Product Configuration Stored Successfully');
    setShowSetDefaultModal(false);
  };

  const handleResetDefaults = () => {
    setProductDefaults(DEFAULT_PRODUCT_CONFIG);
    localStorage.setItem('rd_product_defaults', JSON.stringify(DEFAULT_PRODUCT_CONFIG));
    api.saveSystemSetting('rd_product_defaults', DEFAULT_PRODUCT_CONFIG).catch(console.warn);
    showToast('Defaults Reset to Factory Values');
  };

  // Inline Row Edit State (Video 23 feature: double click to edit, click Update)
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState<Partial<Product>>({});

  // Bulk Edit Table State
  const [bulkEditList, setBulkEditList] = useState<Product[]>([]);

  // New Record Form Row State (Pre-filled with Video 22 product defaults)
  const [newRow, setNewRow] = useState<Partial<Product>>({
    name: '',
    purchasePrice: 0,
    cessPercent: 0,
    conv: 1,
    openingStock: 0,
    barcode: '',
    mrp: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    size: '',
    colour: '',
    minStock: 0,
    batch: '',
    godown: 'Block 1',
    rack: 'Rack 1',
    category: 'GENERAL',
    subCategory: productDefaults.subCategory,
    salesUnit: productDefaults.unit,
    cgst: productDefaults.gstRate ? productDefaults.gstRate / 2 : 0,
    sgst: productDefaults.gstRate ? productDefaults.gstRate / 2 : 0,
    igst: productDefaults.gstRate || 0,
    sTax: productDefaults.sTax,
    pTax: productDefaults.pTax
  });

  // Direct Cloudflare R2 Product Image Upload States
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const rowFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetProduct, setUploadTargetProduct] = useState<Product | null>(null);
  const newRowFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingNewRowPhoto, setIsUploadingNewRowPhoto] = useState(false);

  const handleTriggerRowUpload = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadTargetProduct(prod);
    if (rowFileInputRef.current) {
      rowFileInputRef.current.value = '';
      rowFileInputRef.current.click();
    }
  };

  const handleRowFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetProduct) return;

    setUploadingProductId(uploadTargetProduct.id);
    showToast(`☁️ Uploading ${uploadTargetProduct.name} image to Cloudflare R2...`);
    try {
      const res = await api.uploadProductImage(uploadTargetProduct.id, file);
      if (res && res.image_url) {
        onUpdateProduct({ ...uploadTargetProduct, photo: res.image_url });
        showToast(`✓ Image saved to Cloudflare R2!`);
      }
    } catch (err: any) {
      console.warn('R2 direct upload fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateProduct({ ...uploadTargetProduct, photo: reader.result as string });
        showToast(`✓ Photo saved locally`);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingProductId(null);
      setUploadTargetProduct(null);
    }
  };

  const handleNewRowFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingNewRowPhoto(true);
    showToast(`☁️ Uploading image to Cloudflare R2...`);
    try {
      const res = await api.uploadStandaloneImage(file, newRow.pCode || newRow.barcode || 'new_item');
      if (res && res.image_url) {
        setNewRow(prev => ({ ...prev, photo: res.image_url }));
        showToast(`✓ Image attached via Cloudflare R2!`);
      }
    } catch (err: any) {
      console.warn('Standalone R2 upload fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setNewRow(prev => ({ ...prev, photo: reader.result as string }));
        showToast(`✓ Photo attached locally`);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingNewRowPhoto(false);
      e.target.value = '';
    }
  };

  const [activeCellIndex, setActiveCellIndex] = useState<number>(0);

  // Refs for fast keyboard focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const purchaseInputRef = useRef<HTMLInputElement>(null);
  const convInputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const mrpInputRef = useRef<HTMLInputElement>(null);
  const retailInputRef = useRef<HTMLInputElement>(null);
  const wholesaleInputRef = useRef<HTMLInputElement>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const colourInputRef = useRef<HTMLInputElement>(null);

  // Video 09 Feature 3: Continuous Barcode Auto-Prefixing (Frames 0190 & 0195)
  const getNextBarcode = () => {
    const prefix = companyInfo?.barcodePrefix || companyInfo?.barcodeCode || '';
    const numericCodes = products
      .map(p => {
        let codeStr = p.barcode;
        if (prefix && codeStr.startsWith(prefix)) {
          codeStr = codeStr.slice(prefix.length);
        }
        return parseInt(codeStr, 10);
      })
      .filter(n => !isNaN(n) && n > 0 && n < 10000000);
    const maxNum = numericCodes.length > 0 ? Math.max(...numericCodes) : 3475;
    const nextSeq = maxNum + 1;
    return prefix ? `${prefix}${nextSeq}` : String(nextSeq);
  };

  const getNextPCode = () => {
    return `P-${1520 + products.length + 1}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard Enter-Flow Handler
  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name') {
        if (!newRow.barcode) {
          setNewRow(prev => ({ ...prev, barcode: getNextBarcode() }));
        }
        setActiveCellIndex(1);
        purchaseInputRef.current?.focus();
      } else if (field === 'purchasePrice') {
        if (columnConfig.conv) {
          setActiveCellIndex(2);
          convInputRef.current?.focus();
        } else {
          setActiveCellIndex(3);
          stockInputRef.current?.focus();
        }
      } else if (field === 'conv') {
        setActiveCellIndex(3);
        stockInputRef.current?.focus();
      } else if (field === 'openingStock') {
        setActiveCellIndex(4);
        barcodeInputRef.current?.focus();
      } else if (field === 'barcode') {
        setActiveCellIndex(5);
        mrpInputRef.current?.focus();
      } else if (field === 'mrp') {
        setActiveCellIndex(6);
        retailInputRef.current?.focus();
      } else if (field === 'retailPrice') {
        if (columnConfig.wSalePrice) {
          setActiveCellIndex(7);
          wholesaleInputRef.current?.focus();
        } else if (columnConfig.size) {
          setActiveCellIndex(8);
          sizeInputRef.current?.focus();
        } else {
          saveNewRecord();
        }
      } else if (field === 'wholesalePrice') {
        if (columnConfig.size) {
          setActiveCellIndex(8);
          sizeInputRef.current?.focus();
        } else {
          saveNewRecord();
        }
      } else if (field === 'size') {
        if (columnConfig.colour) {
          setActiveCellIndex(9);
          colourInputRef.current?.focus();
        } else {
          saveNewRecord();
        }
      } else if (field === 'colour') {
        saveNewRecord();
      }
    }
  };

  const saveNewRecord = () => {
    if (!newRow.name?.trim()) {
      showToast('⚠️ Please enter a product name');
      nameInputRef.current?.focus();
      return;
    }

    const createdProduct: Product = {
      id: `prod-${Date.now()}`,
      pCode: getNextPCode(),
      name: newRow.name.trim(),
      purchasePrice: Number(newRow.purchasePrice) || 0,
      cessPercent: Number(newRow.cessPercent) || 0,
      conv: Number(newRow.conv) || 1,
      openingStock: Number(newRow.openingStock) || 0,
      barcode: newRow.barcode?.trim() || getNextBarcode(),
      mrp: Number(newRow.mrp) || Number(newRow.retailPrice) || 0,
      retailPrice: Number(newRow.retailPrice) || 0,
      wholesalePrice: Number(newRow.wholesalePrice) || Number(newRow.retailPrice) || 0,
      size: newRow.size || '',
      colour: newRow.colour || '',
      minStock: Number(newRow.minStock) || 0,
      batch: newRow.batch || '',
      godown: newRow.godown || 'Block 1',
      rack: newRow.rack || 'Rack 1',
      category: newRow.category || 'GENERAL',
      subCategory: newRow.subCategory || productDefaults.subCategory || 'OTHERS',
      hsn: newRow.hsn || '9403',
      discount: Number(newRow.discount) || 0,
      mfgDate: newRow.mfgDate || '',
      expDate: newRow.expDate || '',
      imei1: newRow.imei1 || '',
      imei2: newRow.imei2 || '',
      salesUnit: newRow.salesUnit || productDefaults.unit || 'PIECES',
      cgst: newRow.cgst !== undefined ? newRow.cgst : (productDefaults.gstRate ? productDefaults.gstRate / 2 : 0),
      sgst: newRow.sgst !== undefined ? newRow.sgst : (productDefaults.gstRate ? productDefaults.gstRate / 2 : 0),
      igst: newRow.igst !== undefined ? newRow.igst : (productDefaults.gstRate || 0),
      sTax: newRow.sTax || productDefaults.sTax || 'Inclusive',
      pTax: newRow.pTax || productDefaults.pTax || 'Inclusive',
      variants: []
    };

    onAddProduct(createdProduct);
    showToast(`✅ Successfully Saved: ${createdProduct.name} [Barcode: ${createdProduct.barcode}]`);

    // Reset new row with active default values
    setNewRow({
      name: '',
      purchasePrice: 0,
      cessPercent: 0,
      conv: 1,
      openingStock: 0,
      barcode: '',
      mrp: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      size: '',
      colour: '',
      minStock: 0,
      batch: '',
      godown: 'Block 1',
      rack: 'Rack 1',
      category: 'GENERAL',
      subCategory: productDefaults.subCategory,
      salesUnit: productDefaults.unit,
      hsn: '9403',
      discount: 0,
      cgst: productDefaults.gstRate ? productDefaults.gstRate / 2 : 0,
      sgst: productDefaults.gstRate ? productDefaults.gstRate / 2 : 0,
      igst: productDefaults.gstRate || 0,
      sTax: productDefaults.sTax,
      pTax: productDefaults.pTax
    });
    setActiveCellIndex(0);
    nameInputRef.current?.focus();
  };

  // Double Click Row to Edit
  const handleDoubleClickRow = (prod: Product) => {
    setEditingRowId(prod.id);
    setEditingProductData({ ...prod });
    showToast(`Editing ${prod.name}. Change fields and click Update.`);
  };

  // Save Inline Edit
  const handleSaveInlineEdit = (id: string) => {
    const existing = products.find(p => p.id === id);
    if (!existing) return;
    const updated: Product = {
      ...existing,
      ...editingProductData
    };
    onUpdateProduct(updated);
    setEditingRowId(null);
    showToast(`✅ Updated ${updated.name} (Retail ₹${updated.retailPrice.toFixed(2)})`);
  };

  // Bulk Image Update (from Video 23)
  const handleBulkImageUpdate = () => {
    const imageMap: Record<string, string> = {
      'Godrej Interio Slimline 3-Door Steel Wardrobe with Locker & Mirror': '🚪',
      'Godrej Interio Slimline 2-Door Steel Almirah with Overhead Unit': '🚪',
      'Godrej Interio Storwel Classic Plain Steel Cupboard': '🗄️',
      'Godrej Interio Slimline Neo 3-Door with Full Dressing Mirror': '🪞',
      'Godrej Interio Motion High-Back Ergonomic Office Chair': '🪑',
      'Godrej Interio Maestro Executive Director Desk': '🖥️',
      'Godrej 4-Drawer Heavy Metal Filing Cabinet with Lock': '🗄️',
      'Godrej Centurion High-Security Safe 40L': '🔐',
      'Godrej Rhino Digital Home Safe 30L': '🔒',
      'Nilambur Solid Teak Wood 6-Seater Dining Set with Cushioned Chairs': '🍽️',
      'Nilambur Solid Teak Wood Dining Chair': '🪑',
      'Godrej Interio Haven 3+1+1 Motorized Leatherette Recliner Suite': '🛋️',
      'Godrej Interio Entica 3-Seater Fabric Sofa': '🛋️',
      'Godrej Interio Kalista Hydraulic Storage King Bed': '🛏️',
      'Godrej Posture Support Coir & Spring Mattress (Queen)': '🛏️',
      'King Size Teak Bed Hydraulic': '🛏️',
      'Solid Teak Wood Dining Chair': '🪑'
    };

    products.forEach(p => {
      const icon = imageMap[p.name] || '📦';
      onUpdateProduct({ ...p, photo: icon });
    });

    onUpdateColumnConfig({ ...columnConfig, photo: true });
    showToast('🖼️ Bulk Product Photos Updated & Photo Column Enabled!');
  };

  // Open Bulk Editor
  const handleOpenBulkEditor = () => {
    setBulkEditList(products.map(p => ({ ...p })));
    setShowBulkEditModal(true);
  };

  // Save Bulk Editor Changes
  const handleSaveBulkEditor = () => {
    bulkEditList.forEach(p => onUpdateProduct(p));
    setShowBulkEditModal(false);
    showToast('✅ All Product Bulk Changes Successfully Saved!');
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.pCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.colour && p.colour.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  }).slice(0, topRecords);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      'P-Code',
      'Product Name',
      'Purchase Price',
      'CESS %',
      'Conversion Value',
      'Opening Stock',
      'Barcode',
      'MRP',
      'Retail Price',
      'Wholesale Price',
      'Size',
      'Colour',
      'Min Stock',
      'Godown',
      'Rack'
    ];
    const rows = filteredProducts.map(p => [
      p.pCode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.purchasePrice.toFixed(2),
      p.cessPercent.toFixed(2),
      (p.conv || 1),
      p.openingStock.toFixed(3),
      p.barcode,
      p.mrp.toFixed(2),
      p.retailPrice.toFixed(2),
      (p.wholesalePrice || 0).toFixed(2),
      p.size || '',
      p.colour || '',
      p.minStock || 0,
      p.godown || '',
      p.rack || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SVF_Products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Product Catalog Exported to Excel/CSV');
  };

  const handleConfirmImportProducts = (rows: Record<string, string>[]) => {
    let createdCount = 0;
    let updatedCount = 0;
    const updatedProducts = [...products];

    rows.forEach((row, idx) => {
      const extracted = extractProductFromRow(row, idx);

      const existingIdx = updatedProducts.findIndex(p =>
        (extracted.barcode && p.barcode === extracted.barcode) ||
        (extracted.pCode && p.pCode.toLowerCase() === extracted.pCode.toLowerCase()) ||
        (extracted.name && p.name.toLowerCase() === extracted.name.toLowerCase())
      );

      if (existingIdx !== -1) {
        updatedProducts[existingIdx] = {
          ...updatedProducts[existingIdx],
          ...extracted,
          id: updatedProducts[existingIdx].id // preserve existing id
        };
        updatedCount++;
      } else {
        updatedProducts.unshift(extracted);
        createdCount++;
      }
    });

    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updatedProducts);
    } else {
      updatedProducts.slice(0, createdCount).forEach(p => onAddProduct(p));
    }

    showToast(`✓ Successfully imported ${rows.length} products (${createdCount} added, ${updatedCount} updated)!`);
  };

  return (
    <div className="rd-window">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '45px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 999
        }}>
          {toastMessage}
        </div>
      )}

      {/* WINDOW HEADER */}
      <div className="rd-window-header-green">
        <div className="rd-window-title">LIST OF PRODUCTS</div>
        <div className="rd-window-actions">
          <button
            className="rd-btn-header"
            onClick={() => setShowSkuGenModal(true)}
            style={{
              backgroundColor: '#0f766e',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⚡</span> GODREJ AUTO-SKU & BOM
          </button>
          <button className="rd-btn-header bulk-edit" onClick={handleOpenBulkEditor}>
            <span>📝</span> PRODUCT BULK EDIT
          </button>
          <button className="rd-btn-header export" onClick={handleExportExcel}>
            <span>📊</span> EXPORT
          </button>
          <button
            className="rd-btn-header"
            onClick={() => setShowImportModal(true)}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📥</span> IMPORT
          </button>
          <button className="rd-btn-header reset" onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); showToast('Filters Reset'); }}>
            <span>🔄</span> RESET
          </button>
          <button className="rd-btn-header settings" onClick={() => setShowSettingsModal(true)}>
            <span>⚙️</span> SETTINGS
          </button>
          <button className="rd-btn-header set-default" onClick={() => setShowSetDefaultModal(true)}>
            <span>💾</span> SET DEFAULT
          </button>
          {onClose && (
            <button
              type="button"
              className="rd-btn-header"
              onClick={onClose}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '8px'
              }}
              title="Close Product Catalog and return to Desktop [Esc]"
            >
              <span>✕</span> EXIT [Esc]
            </button>
          )}
        </div>
      </div>

      {/* FILTER & BATCH ACTION BAR */}
      <div className="rd-filter-bar">
        <div className="rd-filter-left">
          <select
            className="rd-filter-input"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <input
            type="text"
            className="rd-filter-input"
            placeholder="Search by Name, Barcode, Size, Colour..."
            style={{ width: '230px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>TOP :</span>
            <input
              type="number"
              className="rd-filter-input"
              style={{ width: '55px', textAlign: 'center' }}
              value={topRecords}
              onChange={e => setTopRecords(Number(e.target.value) || 50)}
            />
            <span>RECORDS</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', marginLeft: '6px' }}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={e => setSelectAll(e.target.checked)}
            />
            <span>SELECT ALL</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', marginLeft: '6px' }}>
            <span>BARCODE No. of Copies :</span>
            <input
              type="number"
              className="rd-filter-input"
              style={{ width: '45px', textAlign: 'center' }}
              value={barcodeCopies}
              min="1"
              onChange={e => setBarcodeCopies(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="rd-filter-right">
          <button className="rd-btn-action add-cat" onClick={() => setShowCategoryModal(true)}>
            <span>📁</span> ADD CATEGORY
          </button>
          <button className="rd-btn-action add-subcat" onClick={() => setShowSubCategoryModal(true)}>
            <span>📂</span> ADD SUBCATEGORY
          </button>
          <button className="rd-btn-action show-all" onClick={() => setTopRecords(500)}>
            <span>📋</span> SHOW ALL
          </button>
          <button className="rd-btn-action bulk-img" onClick={handleBulkImageUpdate}>
            <span>🖼️</span> BULK IMAGE UPDATE
          </button>
          <button
            className="rd-btn-action"
            style={{
              backgroundColor: '#d97706',
              color: '#ffffff',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => {
              setHardwareHubProduct(products[0] || null);
              setIsSmartViewHardwareHubOpen(true);
            }}
            title="Retsol R220 Thermal Label Printer & Brontix Desktop Scanner Hardware Studio"
          >
            <span>⚡</span> HARDWARE HUB
          </button>
          <button
            className="rd-btn-action new-record"
            onClick={() => {
              nameInputRef.current?.focus();
              setActiveCellIndex(0);
            }}
          >
            <span>📄+</span> NEW RECORD
          </button>
        </div>
      </div>

      {/* MASTER DATA GRID */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '60px' }}>P-Code</th>
              <th className="th-green">Product Name</th>
              <th className="th-red" style={{ width: '90px' }}>Purchase Price</th>
              <th className="th-red" style={{ width: '65px' }}>CESS %</th>
              {columnConfig.conv && (
                <th className="th-green" style={{ width: '105px' }}>Conversion Value</th>
              )}
              <th className="th-green" style={{ width: '90px' }}>Opening Stock</th>
              <th className="th-red" style={{ width: '110px' }}>Barcode</th>
              <th className="th-green" style={{ width: '80px' }}>MRP</th>
              <th className="th-green" style={{ width: '95px' }}>Retail Sale Price</th>
              {columnConfig.wSalePrice && (
                <th className="th-green" style={{ width: '110px' }}>Wholesale Sale Price</th>
              )}
              {columnConfig.discount && (
                <th className="th-green" style={{ width: '70px', textAlign: 'right' }}>Disc %</th>
              )}
              {columnConfig.hsn && (
                <th className="th-green" style={{ width: '75px', textAlign: 'center' }}>HSN</th>
              )}
              {columnConfig.mfgDate && (
                <th className="th-green" style={{ width: '90px', textAlign: 'center' }}>Mfg Date</th>
              )}
              {columnConfig.expDate && (
                <th className="th-green" style={{ width: '90px', textAlign: 'center' }}>Exp Date</th>
              )}
              {columnConfig.size && (
                <th className="th-green" style={{ width: '60px' }}>Size</th>
              )}
              {columnConfig.colour && (
                <th className="th-green" style={{ width: '70px' }}>Colour</th>
              )}
              {columnConfig.imei1 && (
                <th className="th-green" style={{ width: '95px' }}>IMEI 1</th>
              )}
              {columnConfig.imei2 && (
                <th className="th-green" style={{ width: '95px' }}>IMEI 2</th>
              )}
              {columnConfig.minStock && (
                <th className="th-green" style={{ width: '75px' }}>Min Stock</th>
              )}
              {columnConfig.batch && (
                <th className="th-green" style={{ width: '85px' }}>Batch</th>
              )}
              {columnConfig.godown && (
                <th className="th-green" style={{ width: '80px' }}>Godown</th>
              )}
              {columnConfig.rack && (
                <th className="th-green" style={{ width: '80px' }}>Rack</th>
              )}
              {columnConfig.photo && (
                <th className="th-green" style={{ width: '50px', textAlign: 'center' }}>Photo</th>
              )}
              <th className="th-green" style={{ width: '55px', textAlign: 'center' }}>Insert</th>
              {columnConfig.updateButtonColumn && (
                <th className="th-green" style={{ width: '60px', textAlign: 'center' }}>Update</th>
              )}
              <th className="th-green" style={{ width: '70px', textAlign: 'center' }}>Print</th>
              {columnConfig.variantButton && (
                <th className="th-green" style={{ width: '75px', textAlign: 'center' }}>Variant</th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* EXISTING ROWS */}
            {filteredProducts.map(prod => {
              const isEditing = editingRowId === prod.id;
              const isLowStock = prod.minStock && prod.openingStock <= prod.minStock;

              return (
                <tr
                  key={prod.id}
                  onDoubleClick={() => handleDoubleClickRow(prod)}
                  style={{ background: isEditing ? '#fef9c3' : undefined }}
                >
                  <td>
                    <span className="rd-badge-pcode">{prod.pCode}</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        className="rd-cell-input"
                        style={{ background: '#fff' }}
                        value={editingProductData.name || ''}
                        onChange={e => setEditingProductData({ ...editingProductData, name: e.target.value })}
                      />
                    ) : (
                      <span>{prod.name}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 'bold' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        className="rd-cell-input"
                        style={{ background: '#fff', textAlign: 'right' }}
                        value={editingProductData.purchasePrice || 0}
                        onChange={e => setEditingProductData({ ...editingProductData, purchasePrice: Number(e.target.value) })}
                      />
                    ) : (
                      prod.purchasePrice.toFixed(2)
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>{prod.cessPercent.toFixed(2)}</td>
                  {columnConfig.conv && (
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#0369a1' }}>
                      {prod.conv || 1}
                    </td>
                  )}
                  <td style={{
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: isLowStock ? '#dc2626' : undefined
                  }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.001"
                        className="rd-cell-input"
                        style={{ background: '#fff', textAlign: 'right' }}
                        value={editingProductData.openingStock || 0}
                        onChange={e => setEditingProductData({ ...editingProductData, openingStock: Number(e.target.value) })}
                      />
                    ) : (
                      <span>
                        {prod.openingStock.toFixed(3)}
                        {isLowStock && <span style={{ color: '#dc2626', marginLeft: '4px' }}>⚠️</span>}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 'bold', letterSpacing: '0.04em' }}>
                    {prod.barcode}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        className="rd-cell-input"
                        style={{ background: '#fff', textAlign: 'right' }}
                        value={editingProductData.mrp || 0}
                        onChange={e => setEditingProductData({ ...editingProductData, mrp: Number(e.target.value) })}
                      />
                    ) : (
                      prod.mrp.toFixed(2)
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        className="rd-cell-input"
                        style={{ background: '#fff', textAlign: 'right' }}
                        value={editingProductData.retailPrice || 0}
                        onChange={e => setEditingProductData({ ...editingProductData, retailPrice: Number(e.target.value) })}
                      />
                    ) : (
                      prod.retailPrice.toFixed(2)
                    )}
                  </td>
                  {columnConfig.wSalePrice && (
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="rd-cell-input"
                          style={{ background: '#fff', textAlign: 'right' }}
                          value={editingProductData.wholesalePrice || 0}
                          onChange={e => setEditingProductData({ ...editingProductData, wholesalePrice: Number(e.target.value) })}
                        />
                      ) : (
                        (prod.wholesalePrice || prod.retailPrice).toFixed(2)
                      )}
                    </td>
                  )}
                  {columnConfig.discount && (
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ea580c' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          className="rd-cell-input"
                          style={{ background: '#fff', textAlign: 'right' }}
                          value={editingProductData.discount !== undefined ? editingProductData.discount : (prod.discount || 0)}
                          onChange={e => setEditingProductData({ ...editingProductData, discount: Number(e.target.value) })}
                        />
                      ) : (
                        prod.discount ? `${prod.discount}%` : '-'
                      )}
                    </td>
                  )}
                  {columnConfig.hsn && (
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="rd-cell-input"
                          style={{ background: '#fff', textAlign: 'center' }}
                          value={editingProductData.hsn !== undefined ? editingProductData.hsn : (prod.hsn || '')}
                          onChange={e => setEditingProductData({ ...editingProductData, hsn: e.target.value })}
                        />
                      ) : (
                        prod.hsn || '-'
                      )}
                    </td>
                  )}
                  {columnConfig.mfgDate && (
                    <td style={{ textAlign: 'center', fontSize: '11px' }}>
                      {isEditing ? (
                        <input
                          type="date"
                          className="rd-cell-input"
                          style={{ background: '#fff' }}
                          value={editingProductData.mfgDate !== undefined ? editingProductData.mfgDate : (prod.mfgDate || '')}
                          onChange={e => setEditingProductData({ ...editingProductData, mfgDate: e.target.value })}
                        />
                      ) : (
                        prod.mfgDate || '-'
                      )}
                    </td>
                  )}
                  {columnConfig.expDate && (
                    <td style={{ textAlign: 'center', fontSize: '11px', color: prod.expDate ? '#b91c1c' : undefined, fontWeight: prod.expDate ? 'bold' : 'normal' }}>
                      {isEditing ? (
                        <input
                          type="date"
                          className="rd-cell-input"
                          style={{ background: '#fff' }}
                          value={editingProductData.expDate !== undefined ? editingProductData.expDate : (prod.expDate || '')}
                          onChange={e => setEditingProductData({ ...editingProductData, expDate: e.target.value })}
                        />
                      ) : (
                        prod.expDate || '-'
                      )}
                    </td>
                  )}
                  {columnConfig.size && (
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {prod.size || '-'}
                    </td>
                  )}
                  {columnConfig.colour && (
                    <td style={{ textAlign: 'center' }}>
                      {prod.colour || '-'}
                    </td>
                  )}
                  {columnConfig.imei1 && (
                    <td style={{ fontSize: '11px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="rd-cell-input"
                          style={{ background: '#fff' }}
                          value={editingProductData.imei1 !== undefined ? editingProductData.imei1 : (prod.imei1 || '')}
                          onChange={e => setEditingProductData({ ...editingProductData, imei1: e.target.value })}
                        />
                      ) : (
                        prod.imei1 || '-'
                      )}
                    </td>
                  )}
                  {columnConfig.imei2 && (
                    <td style={{ fontSize: '11px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="rd-cell-input"
                          style={{ background: '#fff' }}
                          value={editingProductData.imei2 !== undefined ? editingProductData.imei2 : (prod.imei2 || '')}
                          onChange={e => setEditingProductData({ ...editingProductData, imei2: e.target.value })}
                        />
                      ) : (
                        prod.imei2 || '-'
                      )}
                    </td>
                  )}
                  {columnConfig.minStock && (
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>
                      {prod.minStock || 0}
                    </td>
                  )}
                  {columnConfig.batch && <td>{prod.batch || '-'}</td>}
                  {columnConfig.godown && <td>{prod.godown || '-'}</td>}
                  {columnConfig.photo && (
                    <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                      <div
                        onClick={(e) => handleTriggerRowUpload(prod, e)}
                        title="Click to upload/change photo in Cloudflare R2"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: '1px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          width: '32px',
                          height: '32px',
                          overflow: 'hidden'
                        }}
                      >
                        {uploadingProductId === prod.id ? (
                          <span style={{ fontSize: '13px', animation: 'spin 1s linear infinite' }}>🔄</span>
                        ) : prod.photo ? (
                          <img
                            src={prod.photo}
                            alt={prod.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>📷+</span>
                        )}
                      </div>
                    </td>
                  )}
                  <td style={{ textAlign: 'center' }}>
                    <button className="rd-grid-btn" onClick={() => showToast(`Inserted ${prod.name}`)}>
                      Insert
                    </button>
                  </td>
                  {columnConfig.updateButtonColumn && (
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <button
                          className="rd-grid-btn"
                          style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold' }}
                          onClick={() => handleSaveInlineEdit(prod.id)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="rd-grid-btn"
                          onClick={() => handleDoubleClickRow(prod)}
                        >
                          Update
                        </button>
                      )}
                    </td>
                  )}
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#e0f2fe', color: '#0369a1', marginRight: '4px' }}
                      onClick={() => onPrintBarcode(prod, barcodeCopies)}
                      title="Open standard barcode print dialog"
                    >
                      Barcode
                    </button>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}
                      onClick={() => {
                        setHardwareHubProduct(prod);
                        setIsSmartViewHardwareHubOpen(true);
                      }}
                      title="Print on Retsol R220 203 DPI Desktop Barcode Printer"
                    >
                      🖨️ Retsol
                    </button>
                  </td>
                  {columnConfig.variantButton && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="rd-grid-btn"
                        style={{
                          background: prod.variants && prod.variants.length > 0 ? '#8b5cf6' : undefined,
                          color: prod.variants && prod.variants.length > 0 ? '#fff' : undefined,
                          fontWeight: prod.variants && prod.variants.length > 0 ? 'bold' : 'normal'
                        }}
                        onClick={() => handleOpenVariantModal(prod)}
                      >
                        {prod.variants && prod.variants.length > 0 ? `Variant (${prod.variants.length})` : 'Variant'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* RAPID KEYBOARD ENTRY NEW ROW (DEEP GREEN HIGHLIGHTED) */}
            <tr className="active-row">
              <td>
                <span className="rd-badge-pcode" style={{ background: '#dc2626' }}>
                  {getNextPCode()}
                </span>
              </td>
              <td>
                <input
                  ref={nameInputRef}
                  type="text"
                  className={`rd-cell-input ${activeCellIndex === 0 ? 'red-focus' : ''}`}
                  placeholder="Type product name & Enter..."
                  value={newRow.name || ''}
                  onChange={e => setNewRow({ ...newRow, name: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 'name')}
                  autoFocus
                />
              </td>
              <td>
                <input
                  ref={purchaseInputRef}
                  type="number"
                  step="0.01"
                  className="rd-cell-input"
                  style={{ textAlign: 'right' }}
                  value={newRow.purchasePrice || ''}
                  onChange={e => setNewRow({ ...newRow, purchasePrice: Number(e.target.value) })}
                  onKeyDown={e => handleKeyDown(e, 'purchasePrice')}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  className="rd-cell-input"
                  style={{ textAlign: 'right' }}
                  value={newRow.cessPercent || 0}
                  onChange={e => setNewRow({ ...newRow, cessPercent: Number(e.target.value) })}
                />
              </td>
              {columnConfig.conv && (
                <td>
                  <input
                    ref={convInputRef}
                    type="number"
                    step="1"
                    className="rd-cell-input"
                    style={{ textAlign: 'center' }}
                    value={newRow.conv || 1}
                    onChange={e => setNewRow({ ...newRow, conv: Number(e.target.value) })}
                    onKeyDown={e => handleKeyDown(e, 'conv')}
                  />
                </td>
              )}
              <td>
                <input
                  ref={stockInputRef}
                  type="number"
                  step="0.001"
                  className="rd-cell-input"
                  style={{ textAlign: 'right' }}
                  value={newRow.openingStock || ''}
                  onChange={e => setNewRow({ ...newRow, openingStock: Number(e.target.value) })}
                  onKeyDown={e => handleKeyDown(e, 'openingStock')}
                />
              </td>
              <td>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="rd-cell-input"
                  placeholder={getNextBarcode()}
                  value={newRow.barcode || ''}
                  onChange={e => setNewRow({ ...newRow, barcode: e.target.value })}
                  onKeyDown={e => handleKeyDown(e, 'barcode')}
                />
              </td>
              <td>
                <input
                  ref={mrpInputRef}
                  type="number"
                  step="0.01"
                  className="rd-cell-input"
                  style={{ textAlign: 'right' }}
                  value={newRow.mrp || ''}
                  onChange={e => setNewRow({ ...newRow, mrp: Number(e.target.value) })}
                  onKeyDown={e => handleKeyDown(e, 'mrp')}
                />
              </td>
              <td>
                <input
                  ref={retailInputRef}
                  type="number"
                  step="0.01"
                  className="rd-cell-input"
                  style={{ textAlign: 'right' }}
                  value={newRow.retailPrice || ''}
                  onChange={e => setNewRow({ ...newRow, retailPrice: Number(e.target.value) })}
                  onKeyDown={e => handleKeyDown(e, 'retailPrice')}
                />
              </td>
              {columnConfig.wSalePrice && (
                <td>
                  <input
                    ref={wholesaleInputRef}
                    type="number"
                    step="0.01"
                    className="rd-cell-input"
                    style={{ textAlign: 'right' }}
                    value={newRow.wholesalePrice || ''}
                    onChange={e => setNewRow({ ...newRow, wholesalePrice: Number(e.target.value) })}
                    onKeyDown={e => handleKeyDown(e, 'wholesalePrice')}
                  />
                </td>
              )}
              {columnConfig.discount && (
                <td>
                  <input
                    type="number"
                    step="0.1"
                    className="rd-cell-input"
                    style={{ textAlign: 'right' }}
                    placeholder="0%"
                    value={newRow.discount || ''}
                    onChange={e => setNewRow({ ...newRow, discount: Number(e.target.value) })}
                  />
                </td>
              )}
              {columnConfig.hsn && (
                <td>
                  <input
                    type="text"
                    className="rd-cell-input"
                    style={{ textAlign: 'center' }}
                    placeholder="HSN"
                    value={newRow.hsn || ''}
                    onChange={e => setNewRow({ ...newRow, hsn: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.mfgDate && (
                <td>
                  <input
                    type="date"
                    className="rd-cell-input"
                    value={newRow.mfgDate || ''}
                    onChange={e => setNewRow({ ...newRow, mfgDate: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.expDate && (
                <td>
                  <input
                    type="date"
                    className="rd-cell-input"
                    value={newRow.expDate || ''}
                    onChange={e => setNewRow({ ...newRow, expDate: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.size && (
                <td>
                  <input
                    ref={sizeInputRef}
                    type="text"
                    className="rd-cell-input"
                    placeholder="Size"
                    value={newRow.size || ''}
                    onChange={e => setNewRow({ ...newRow, size: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, 'size')}
                  />
                </td>
              )}
              {columnConfig.colour && (
                <td>
                  <input
                    ref={colourInputRef}
                    type="text"
                    className="rd-cell-input"
                    placeholder="Colour"
                    value={newRow.colour || ''}
                    onChange={e => setNewRow({ ...newRow, colour: e.target.value })}
                    onKeyDown={e => handleKeyDown(e, 'colour')}
                  />
                </td>
              )}
              {columnConfig.imei1 && (
                <td>
                  <input
                    type="text"
                    className="rd-cell-input"
                    placeholder="IMEI 1"
                    value={newRow.imei1 || ''}
                    onChange={e => setNewRow({ ...newRow, imei1: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.imei2 && (
                <td>
                  <input
                    type="text"
                    className="rd-cell-input"
                    placeholder="IMEI 2"
                    value={newRow.imei2 || ''}
                    onChange={e => setNewRow({ ...newRow, imei2: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.minStock && (
                <td>
                  <input
                    type="number"
                    className="rd-cell-input"
                    style={{ textAlign: 'right' }}
                    placeholder="Min"
                    value={newRow.minStock || ''}
                    onChange={e => setNewRow({ ...newRow, minStock: Number(e.target.value) })}
                  />
                </td>
              )}
              {columnConfig.batch && (
                <td>
                  <input
                    type="text"
                    className="rd-cell-input"
                    placeholder="Batch#"
                    value={newRow.batch || ''}
                    onChange={e => setNewRow({ ...newRow, batch: e.target.value })}
                  />
                </td>
              )}
              {columnConfig.godown && (
                <td>
                  <select
                    className="rd-cell-input"
                    value={newRow.godown || 'Block 1'}
                    onChange={e => setNewRow({ ...newRow, godown: e.target.value })}
                  >
                    <option value="Block 1">Block 1</option>
                    <option value="Block 2">Block 2</option>
                    <option value="Block 3">Block 3</option>
                    <option value="Block 5">Block 5</option>
                  </select>
                </td>
              )}
              {columnConfig.rack && (
                <td>
                  <select
                    className="rd-cell-input"
                    value={newRow.rack || 'Rack 1'}
                    onChange={e => setNewRow({ ...newRow, rack: e.target.value })}
                  >
                    <option value="Rack 1">Rack 1</option>
                    <option value="Rack 2">Rack 2</option>
                    <option value="Rack 3">Rack 3</option>
                    <option value="Rack 7">Rack 7</option>
                  </select>
                </td>
              )}
              {columnConfig.photo && (
                <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                  <div
                    onClick={() => newRowFileInputRef.current?.click()}
                    title="Attach photo via Cloudflare R2"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '1px',
                      borderRadius: '4px',
                      border: '1px dashed #0284c7',
                      background: '#f0f9ff',
                      width: '32px',
                      height: '32px',
                      overflow: 'hidden'
                    }}
                  >
                    {isUploadingNewRowPhoto ? (
                      <span style={{ fontSize: '13px', animation: 'spin 1s linear infinite' }}>🔄</span>
                    ) : newRow.photo ? (
                      <img
                        src={newRow.photo}
                        alt="New Item"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', color: '#0284c7' }}>📷+</span>
                    )}
                  </div>
                </td>
              )}
              <td style={{ textAlign: 'center' }}>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
                  onClick={saveNewRecord}
                >
                  Save
                </button>
              </td>
              {columnConfig.updateButtonColumn && <td style={{ textAlign: 'center' }}>-</td>}
              <td style={{ textAlign: 'center' }}>-</td>
              {columnConfig.variantButton && <td style={{ textAlign: 'center' }}>-</td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Hidden file inputs for direct Cloudflare R2 image upload */}
      <input
        ref={rowFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRowFileSelected}
        style={{ display: 'none' }}
      />
      <input
        ref={newRowFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleNewRowFileSelected}
        style={{ display: 'none' }}
      />


      {/* MODAL 1: ADD CATEGORY */}
      {showCategoryModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '400px' }}>
            <div className="rd-dialog-titlebar">
              <span>Category Master</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowCategoryModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                Category Name:
              </label>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '100%', marginBottom: '16px' }}
                placeholder="e.g. ELECTRONICS, GARMENTS, FURNITURE"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="rd-grid-btn"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#ffffff' }}
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      onAddCategory({ id: `cat-${Date.now()}`, name: newCategoryName.trim().toUpperCase() });
                      setNewCategoryName('');
                      setShowCategoryModal(false);
                      showToast('Category Created Successfully');
                    }
                  }}
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUB CATEGORY / BRAND */}
      {showSubCategoryModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '650px' }}>
            <div className="rd-dialog-titlebar">
              <span>Sub Category / Brand</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowSubCategoryModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Sub Category / Brand :
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', background: '#fef08a' }}
                    value={newSubCategoryName}
                    onChange={e => setNewSubCategoryName(e.target.value)}
                    placeholder="Enter Subcategory or Brand..."
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                    Category :
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={selectedParentCategory}
                    onChange={e => setSelectedParentCategory(e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ border: '1px solid #cbd5e1', height: '180px', overflow: 'auto', marginTop: '10px' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#0284c7', color: '#fff' }}>
                      <tr>
                        <th style={{ padding: '4px' }}>ID</th>
                        <th style={{ padding: '4px' }}>Sub Category / Brand</th>
                        <th style={{ padding: '4px' }}>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategories.map(sub => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '3px', textAlign: 'center' }}>{sub.id.replace('sub-', '')}</td>
                          <td style={{ padding: '3px', fontWeight: 'bold' }}>{sub.name}</td>
                          <td style={{ padding: '3px' }}>{sub.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  height: '110px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#64748b',
                  textAlign: 'center',
                  padding: '8px'
                }}>
                  NO IMAGE AVAILABLE
                </div>

                <button
                  className="rd-grid-btn"
                  style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold', padding: '6px' }}
                  onClick={() => {
                    if (newSubCategoryName.trim()) {
                      onAddSubCategory({
                        id: `sub-${Date.now()}`,
                        name: newSubCategoryName.trim().toUpperCase(),
                        category: selectedParentCategory
                      });
                      setNewSubCategoryName('');
                      showToast('SubCategory Saved');
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ padding: '6px' }}
                  onClick={() => setNewSubCategoryName('')}
                >
                  New
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ padding: '6px' }}
                  onClick={() => setShowSubCategoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCT BULK EDIT SPREADSHEET (FROM VIDEO 23) */}
      {showBulkEditModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '90vw', height: '85vh' }}>
            <div className="rd-dialog-titlebar" style={{ background: '#0891b2' }}>
              <span>PRODUCT BULK EDITOR — SPREADSHEET MATRIX (VIDEO 23)</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowBulkEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#0f172a' }}>
                Edit prices, barcodes, stocks, sizes, and colours across all records like an Excel sheet, then click <strong>Save All Changes</strong>.
              </div>
              <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1' }}>
                <table className="rd-data-table">
                  <thead>
                    <tr>
                      <th className="th-green">P-Code</th>
                      <th className="th-green">Product Name</th>
                      <th className="th-green">Barcode</th>
                      <th className="th-red">Purchase Price</th>
                      <th className="th-green">MRP</th>
                      <th className="th-green">Retail Price</th>
                      <th className="th-green">Wholesale</th>
                      <th className="th-green">Stock</th>
                      <th className="th-green">Min Stock</th>
                      <th className="th-green">Size</th>
                      <th className="th-green">Colour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkEditList.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold' }}>{item.pCode}</td>
                        <td>
                          <input
                            type="text"
                            className="rd-cell-input"
                            value={item.name}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].name = e.target.value;
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="rd-cell-input"
                            value={item.barcode}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].barcode = e.target.value;
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="rd-cell-input"
                            style={{ textAlign: 'right' }}
                            value={item.purchasePrice}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].purchasePrice = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="rd-cell-input"
                            style={{ textAlign: 'right' }}
                            value={item.mrp}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].mrp = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="rd-cell-input"
                            style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}
                            value={item.retailPrice}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].retailPrice = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="rd-cell-input"
                            style={{ textAlign: 'right', color: '#1d4ed8' }}
                            value={item.wholesalePrice || 0}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].wholesalePrice = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="rd-cell-input"
                            style={{ textAlign: 'right' }}
                            value={item.openingStock}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].openingStock = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="rd-cell-input"
                            style={{ textAlign: 'right' }}
                            value={item.minStock || 0}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].minStock = Number(e.target.value);
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="rd-cell-input"
                            value={item.size || ''}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].size = e.target.value;
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="rd-cell-input"
                            value={item.colour || ''}
                            onChange={e => {
                              const updated = [...bulkEditList];
                              updated[idx].colour = e.target.value;
                              setBulkEditList(updated);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="rd-grid-btn" onClick={() => setShowBulkEditModal(false)}>
                  Cancel
                </button>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', padding: '6px 16px' }}
                  onClick={handleSaveBulkEditor}
                >
                  💾 Save All Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COLUMN SETTINGS (frmProductSettings FROM VIDEO 24 & VIDEO 23) */}
      {showSettingsModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '420px' }}>
            <div className="rd-dialog-titlebar">
              <span>frmProductColumnConfig</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowSettingsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ maxHeight: '440px', overflowY: 'auto' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#1e3a8a' }}>
                Check columns to display on Product Add Smart grid:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                {[
                  { key: 'wSalePrice', label: 'WSalePrice' },
                  { key: 'batch', label: 'Batch' },
                  { key: 'mfgDate', label: 'MfgDate' },
                  { key: 'expDate', label: 'ExpDate' },
                  { key: 'size', label: 'Size (Tut 23)' },
                  { key: 'colour', label: 'Colour (Tut 23)' },
                  { key: 'imei1', label: 'IMEI1' },
                  { key: 'imei2', label: 'IMEI2' },
                  { key: 'kitchen', label: 'Kitchen' },
                  { key: 'category_plus', label: 'Category_plus' },
                  { key: 'subcategory_plus', label: 'Subcategory_plus' },
                  { key: 'description', label: 'Description' },
                  { key: 'discount', label: 'Discount' },
                  { key: 'gst_plus', label: 'Gst_plus' },
                  { key: 'cgst', label: 'CGST' },
                  { key: 'sgst', label: 'SGST' },
                  { key: 'igst', label: 'IGST' },
                  { key: 'salesUnit', label: 'SalesUnit' },
                  { key: 'salesAltUnit', label: 'SalesAltUnit' },
                  { key: 'conv', label: 'Conv (Box to Piece)' },
                  { key: 'minStock', label: 'MinStock Alert' },
                  { key: 'status', label: 'Status' },
                  { key: 'sTax', label: 'STax' },
                  { key: 'pTax', label: 'PTax' },
                  { key: 'godown', label: 'GDown' },
                  { key: 'rack', label: 'Rack' },
                  { key: 'hsn', label: 'HSN' },
                  { key: 'photo', label: 'Photo (Tut 23)' },
                  { key: 'variantButton', label: 'Variant (Button)' },
                  { key: 'updateButtonColumn', label: 'UpdateButtonColumn' }
                ].map(col => (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={!!columnConfig[col.key as keyof ColumnVisibilityConfig]}
                      onChange={e => {
                        onUpdateColumnConfig({
                          ...columnConfig,
                          [col.key]: e.target.checked
                        });
                      }}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold' }}
                  onClick={() => {
                    setShowSettingsModal(false);
                    showToast('Grid Columns Updated');
                  }}
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SET PRODUCT DEFAULTS (frmProductDefault FROM VIDEO 22 FRAME 210) */}
      {showSetDefaultModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '740px' }}>
            <div className="rd-dialog-titlebar">
              <span>frmProductDefault — Default Master Settings</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowSetDefaultModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ display: 'flex', gap: '20px' }}>
              {/* LEFT CONFIGURATION PANEL */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    Sub Category / Brand :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="rd-cell-input"
                      style={{ flex: 1, background: '#fef08a' }}
                      value={productDefaults.subCategory}
                      onChange={e => setProductDefaults({ ...productDefaults, subCategory: e.target.value })}
                    >
                      {subCategories.map(sub => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set "${productDefaults.subCategory}" as default Sub Category`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    Unit :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="rd-cell-input"
                      style={{ flex: 1, background: '#fef08a' }}
                      value={productDefaults.unit}
                      onChange={e => setProductDefaults({ ...productDefaults, unit: e.target.value })}
                    >
                      {[
                        'PIECES', 'BAGS', 'BOXES', 'BOTTLES', 'BUNDLES', 'CANS', 'CARTONS',
                        'DOZENS', 'GRAMS', 'KILOGRAMS', 'LITRES', 'METERS', 'NOS',
                        'PACKETS', 'PAIRS', 'ROLLS', 'SETS', 'SQUARE FEET', 'SQUARE METERS', 'TIN', 'TUBES'
                      ].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set "${productDefaults.unit}" as default Unit`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    GST Rate % :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="rd-cell-input"
                      style={{ flex: 1, background: '#fef08a' }}
                      value={productDefaults.gstRate}
                      onChange={e => setProductDefaults({ ...productDefaults, gstRate: Number(e.target.value) })}
                    >
                      <option value="0">0% (Nil / Exempted)</option>
                      <option value="5">5% (CGST 2.5% + SGST 2.5%)</option>
                      <option value="12">12% (CGST 6% + SGST 6%)</option>
                      <option value="18">18% (CGST 9% + SGST 9%)</option>
                      <option value="28">28% (CGST 14% + SGST 14%)</option>
                    </select>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set "${productDefaults.gstRate}%" as default GST Rate`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    Tax Type on Sale :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="rd-cell-input"
                      style={{ flex: 1 }}
                      value={productDefaults.sTax}
                      onChange={e => setProductDefaults({ ...productDefaults, sTax: e.target.value as any })}
                    >
                      <option value="Inclusive">Inclusive</option>
                      <option value="Exclusive">Exclusive</option>
                    </select>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set Sale Tax as "${productDefaults.sTax}"`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    Tax Type on Purchase :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="rd-cell-input"
                      style={{ flex: 1 }}
                      value={productDefaults.pTax}
                      onChange={e => setProductDefaults({ ...productDefaults, pTax: e.target.value as any })}
                    >
                      <option value="Inclusive">Inclusive</option>
                      <option value="Exclusive">Exclusive</option>
                    </select>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set Purchase Tax as "${productDefaults.pTax}"`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
                    Loyalty Points per Sale :
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      className="rd-cell-input"
                      style={{ flex: 1, textAlign: 'center' }}
                      value={productDefaults.pointsPerSale || 1}
                      onChange={e => setProductDefaults({ ...productDefaults, pointsPerSale: Number(e.target.value) })}
                    />
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#fff', fontSize: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => showToast(`Set Loyalty Points: ${productDefaults.pointsPerSale} per 100`)}
                    >
                      Set Is Default
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT BARCODE PREVIEW PANEL (EXACT VIDEO 22 FRAME 210) */}
              <div style={{ width: '280px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                <div style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  padding: '6px 10px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span>Barcode Preview Type</span>
                  <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '3px' }}>50x25mm</span>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  <select className="rd-cell-input" style={{ flex: 1, fontSize: '11px' }}>
                    <option>50MM x 25MM (1 Sticker / Row)</option>
                    <option>38MM x 25MM (2 Stickers / Row)</option>
                    <option>50MM x 50MM (Clothing Garment Tag)</option>
                  </select>
                  <button className="rd-grid-btn" style={{ background: '#16a34a', color: '#fff' }} onClick={() => showToast('Barcode template applied')}>
                    Apply
                  </button>
                </div>

                {/* THERMAL STICKER PREVIEW CONTAINER */}
                <div style={{
                  background: '#ffffff',
                  border: '2px dashed #94a3b8',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                    Shree Vinayaka Furnitures
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '2px' }}>
                    Sample Product Item
                  </div>
                  {/* BARCODE SVG BARS */}
                  <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
                    <svg width="180" height="40" viewBox="0 0 180 40">
                      <rect x="0" y="0" width="180" height="40" fill="#ffffff" />
                      {/* Generates simulated barcode pattern */}
                      {[4, 10, 14, 22, 28, 34, 42, 46, 52, 60, 68, 72, 80, 88, 92, 98, 106, 114, 120, 128, 136, 144, 150, 158, 166, 172].map((x, i) => (
                        <rect
                          key={i}
                          x={x}
                          y="2"
                          width={i % 3 === 0 ? 3 : (i % 2 === 0 ? 2 : 1)}
                          height="32"
                          fill="#000000"
                        />
                      ))}
                    </svg>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.15em' }}>
                    *3748*
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                    <span style={{ color: '#64748b' }}>MRP: ₹500.00</span>
                    <span style={{ color: '#16a34a' }}>SALE: ₹400.00</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                    Unit: {productDefaults.unit} • GST: {productDefaults.gstRate}% {productDefaults.sTax}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="rd-grid-btn" onClick={() => setShowSetDefaultModal(false)}>
                Cancel
              </button>
              <button
                className="rd-grid-btn"
                style={{ background: '#d97706', color: '#ffffff' }}
                onClick={handleResetDefaults}
              >
                🔄 Reset Defaults
              </button>
              <button
                className="rd-grid-btn"
                style={{ background: '#16a34a', color: '#ffffff', fontWeight: 'bold', padding: '6px 14px' }}
                onClick={handleSaveDefaults}
              >
                💾 Save Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PRODUCT VARIANT MATRIX (frmProductVariant FROM VIDEO 22) */}
      {showVariantModal && selectedVariantProduct && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '780px' }}>
            <div className="rd-dialog-titlebar">
              <span>frmProductVariant — Variant Breakdown: {selectedVariantProduct.name} [{selectedVariantProduct.pCode}]</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowVariantModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="rd-dialog-body" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {/* HEADER INFO STRIP */}
              <div style={{
                background: '#f1f5f9',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                <div>
                  <span>Master Barcode: </span>
                  <span style={{ color: '#2563eb' }}>{selectedVariantProduct.barcode}</span>
                </div>
                <div>
                  <span>Master Stock: </span>
                  <span style={{ color: '#16a34a' }}>{selectedVariantProduct.openingStock} {selectedVariantProduct.salesUnit || 'Pcs'}</span>
                </div>
                <div>
                  <span>Total Variant Qty: </span>
                  <span style={{ color: '#7c3aed' }}>
                    {variantList.reduce((sum, v) => sum + (v.qty || 0), 0)} Pcs
                  </span>
                </div>
              </div>

              {/* VARIANT GRID TABLE */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                <table className="rd-data-table">
                  <thead>
                    <tr>
                      <th className="th-green" style={{ width: '40px' }}>#</th>
                      <th className="th-green" style={{ width: '70px' }}>Size</th>
                      <th className="th-green" style={{ width: '80px' }}>Colour</th>
                      <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>Qty</th>
                      <th className="th-red" style={{ width: '130px' }}>Barcode</th>
                      <th className="th-green" style={{ width: '75px', textAlign: 'right' }}>MRP</th>
                      <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Retail</th>
                      <th className="th-green" style={{ width: '60px', textAlign: 'center' }}>Print</th>
                      <th className="th-red" style={{ width: '50px', textAlign: 'center' }}>Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                          No variants created yet. Enter size, colour, qty below to create individual barcodes.
                        </td>
                      </tr>
                    ) : (
                      variantList.map((v, idx) => (
                        <tr key={v.id || idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 'bold' }}>{v.size}</td>
                          <td>{v.colour}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{v.qty}</td>
                          <td style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{v.barcode}</td>
                          <td style={{ textAlign: 'right' }}>₹{v.mrp.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                            ₹{v.retailPrice.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="rd-grid-btn"
                              style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '10px' }}
                              onClick={() => {
                                onPrintBarcode({
                                  ...selectedVariantProduct,
                                  barcode: v.barcode,
                                  size: v.size,
                                  colour: v.colour,
                                  mrp: v.mrp,
                                  retailPrice: v.retailPrice
                                }, 1);
                              }}
                            >
                              🏷️
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => handleRemoveVariant(v.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* NEW VARIANT ENTRY BOX */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>
                  + Add New Variant to Matrix:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Dimensions / Size:</label>
                    <input
                      type="text"
                      list="furniture-sizes"
                      className="rd-cell-input"
                      value={variantForm.size}
                      onChange={e => setVariantForm({
                        ...variantForm,
                        size: e.target.value,
                        barcode: `${selectedVariantProduct.barcode}-${e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}-${variantForm.colour.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}`
                      })}
                      placeholder="e.g. King (72x78 in)"
                    />
                    <datalist id="furniture-sizes">
                      <option value="King (72x78 in)" />
                      <option value="Queen (60x78 in)" />
                      <option value="Single (36x75 in)" />
                      <option value="3-Seater (78 in)" />
                      <option value="2-Seater (58 in)" />
                      <option value="L-Shape (3+2+Corner)" />
                      <option value="6-Seater (60x36 in)" />
                      <option value="4-Seater (45x36 in)" />
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Wood / Polish / Fabric:</label>
                    <input
                      type="text"
                      list="furniture-finishes"
                      className="rd-cell-input"
                      value={variantForm.colour}
                      onChange={e => setVariantForm({
                        ...variantForm,
                        colour: e.target.value,
                        barcode: `${selectedVariantProduct.barcode}-${variantForm.size.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}-${e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}`
                      })}
                      placeholder="e.g. Teak Matte / Velvet Blue"
                    />
                    <datalist id="furniture-finishes">
                      <option value="Solid Teak - Natural Matte" />
                      <option value="Solid Teak - Dark Walnut" />
                      <option value="Sheesham Wood - Honey Teak" />
                      <option value="Engineered Wood - Wenge" />
                      <option value="Navy Blue Velvet Fabric" />
                      <option value="Charcoal Grey Linen Fabric" />
                      <option value="Tan Brown Leatherette" />
                      <option value="Hydraulic Lift Storage" />
                      <option value="Manual Box Drawer Storage" />
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Qty:</label>
                    <input
                      type="number"
                      min="1"
                      className="rd-cell-input"
                      style={{ textAlign: 'right' }}
                      value={variantForm.qty}
                      onChange={e => setVariantForm({ ...variantForm, qty: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Barcode:</label>
                    <input
                      type="text"
                      className="rd-cell-input"
                      value={variantForm.barcode}
                      onChange={e => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Retail (₹):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="rd-cell-input"
                      style={{ textAlign: 'right' }}
                      value={variantForm.retailPrice}
                      onChange={e => setVariantForm({ ...variantForm, retailPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <button
                      className="rd-grid-btn"
                      style={{ background: '#16a34a', color: '#ffffff', width: '100%', height: '26px', fontWeight: 'bold' }}
                      onClick={handleAddVariant}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* QUICK SIZE & COLOUR BADGES */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Quick Sizes:</span>
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => (
                      <button
                        key={sz}
                        style={{ padding: '1px 5px', fontSize: '10px', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '3px' }}
                        onClick={() => setVariantForm(prev => ({
                          ...prev,
                          size: sz,
                          barcode: `${selectedVariantProduct.barcode}-${sz}-${prev.colour}`
                        }))}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Quick Colours:</span>
                    {['Black', 'White', 'Blue', 'Red', 'Green'].map(col => (
                      <button
                        key={col}
                        style={{ padding: '1px 5px', fontSize: '10px', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '3px' }}
                        onClick={() => setVariantForm(prev => ({
                          ...prev,
                          colour: col,
                          barcode: `${selectedVariantProduct.barcode}-${prev.size}-${col}`
                        }))}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="rd-grid-btn" onClick={() => setShowVariantModal(false)}>
                Cancel
              </button>
              <button
                className="rd-grid-btn"
                style={{ background: '#16a34a', color: '#ffffff', fontWeight: 'bold', padding: '6px 16px' }}
                onClick={handleSaveVariants}
              >
                💾 Save Variants to Master Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel / CSV Product Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="products"
        onConfirmImport={handleConfirmImportProducts}
      />

      {/* Godrej Smart Auto-SKU & Multi-Box Generator Modal */}
      <GodrejSkuGeneratorModal
        isOpen={showSkuGenModal}
        onClose={() => setShowSkuGenModal(false)}
        onAddProduct={onAddProduct}
        existingProductsCount={products.length}
      />

      {/* Retsol R220 & Brontix Desktop Scanner Hardware Studio */}
      <BarcodeHardwareHubModal
        isOpen={isSmartViewHardwareHubOpen}
        onClose={() => setIsSmartViewHardwareHubOpen(false)}
        product={hardwareHubProduct || products[0] || null}
      />
    </div>
  );
}
