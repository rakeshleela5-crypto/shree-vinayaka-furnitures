import { useState, useMemo } from 'react';
import type { Product } from '../../types/retailDaddy';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { exportToCsv, extractProductFromRow } from '../../utils/csvImporter';
import { api, mapFrontendProductToBackend, downloadProductBoxLabelsPdf, notifyApiSuccess, notifyApiError } from '../../api/client';

interface StockInHandViewProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
}

export function StockInHandView({ products, onUpdateProducts, onAddProduct, onUpdateProduct }: StockInHandViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [filterGodown, setFilterGodown] = useState('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Modals for Inventory Operations
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditSkuModal, setShowEditSkuModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Living Room');
  const [newProdRetailPrice, setNewProdRetailPrice] = useState('25000');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('18000');
  const [newProdMrp, setNewProdMrp] = useState('32000');
  const [newProdOpeningStock, setNewProdOpeningStock] = useState('5');
  const [newProdReservedStock, setNewProdReservedStock] = useState('2');
  const [newProdHsn, setNewProdHsn] = useState('9403');
  const [newProdGst, setNewProdGst] = useState('18');
  const [newProdIsKnockdown, setNewProdIsKnockdown] = useState(true);
  const [newProdTotalBoxes, setNewProdTotalBoxes] = useState('4');
  const [newProdGodown, setNewProdGodown] = useState('Main Showroom');
  const [newProdRack, setNewProdRack] = useState('Floor');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit SKU Form State
  const [editName, setEditName] = useState('');
  const [editPCode, setEditPCode] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editRetailPrice, setEditRetailPrice] = useState('0');
  const [editPurchasePrice, setEditPurchasePrice] = useState('0');
  const [editMrp, setEditMrp] = useState('0');
  const [editMinStock, setEditMinStock] = useState('5');
  const [editGodown, setEditGodown] = useState('Main Showroom');
  const [editRack, setEditRack] = useState('');
  const [editIsKnockdown, setEditIsKnockdown] = useState(false);
  const [editTotalBoxes, setEditTotalBoxes] = useState('1');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Adjust Stock Form State
  const [adjType, setAdjType] = useState<'Plus' | 'Minus'>('Plus');
  const [adjQty, setAdjQty] = useState('1');
  const [adjReason, setAdjReason] = useState('Physical Inventory Recount Correction');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);

  // Filtered products list
  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.pCode.toLowerCase().includes(q) ||
        (p.rack && p.rack.toLowerCase().includes(q)) ||
        (p.size && p.size.toLowerCase().includes(q)) ||
        (p.colour && p.colour.toLowerCase().includes(q));
      const matchesGodown = filterGodown === 'ALL' || p.godown === filterGodown;
      const physical = p.physical_stock ?? p.openingStock ?? 0;
      const reserved = p.reserved_stock ?? 0;
      const available = physical - reserved;
      const matchesNeg = showNegativeOnly ? available <= 0 : true;
      const matchesLow = showLowStockOnly ? (p.minStock && available <= p.minStock) : true;
      return matchesSearch && matchesGodown && matchesNeg && matchesLow;
    });
  }, [products, searchTerm, filterGodown, showNegativeOnly, showLowStockOnly]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const available = (p.physical_stock ?? p.openingStock ?? 0) - (p.reserved_stock ?? 0);
      return p.minStock && available <= p.minStock;
    }).length;
  }, [products]);

  // Aggregate Metrics
  const totalPhysicalStock = useMemo(() => {
    return products.reduce((s, p) => s + (p.physical_stock ?? p.openingStock ?? 0), 0);
  }, [products]);

  const totalReservedStock = useMemo(() => {
    return products.reduce((s, p) => s + (p.reserved_stock ?? 0), 0);
  }, [products]);

  const totalAvailableStock = totalPhysicalStock - totalReservedStock;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Product Code',
      'Barcode',
      'Product Name',
      'Category',
      'Physical Stock',
      'Reserved Stock',
      'Available to Sell',
      'Total Boxes (Knockdown)',
      'Min Stock',
      'Godown',
      'Rack',
      'Purchase Price',
      'MRP',
      'Retail Price'
    ];
    const rows = filtered.map(p => {
      const phys = p.physical_stock ?? p.openingStock ?? 0;
      const res = p.reserved_stock ?? 0;
      return [
        p.pCode,
        p.barcode,
        p.name,
        p.category,
        phys.toFixed(3),
        res.toFixed(3),
        (phys - res).toFixed(3),
        p.total_boxes || p.totalBoxesCount || 1,
        p.minStock || 0,
        p.godown || '',
        p.rack || '',
        p.purchasePrice,
        p.mrp,
        p.retailPrice
      ];
    });
    exportToCsv('SVF_Inventory_Available_To_Sell.csv', headers, rows);
  };

  // 2. Import CSV
  const handleConfirmImport = async (rows: Record<string, string>[]) => {
    let updatedCount = 0;
    let createdCount = 0;
    const newProducts = [...products];

    rows.forEach((row, idx) => {
      const extracted = extractProductFromRow(row, idx);
      const existingIdx = newProducts.findIndex(p =>
        (extracted.barcode && p.barcode === extracted.barcode) ||
        (extracted.pCode && p.pCode.toLowerCase() === extracted.pCode.toLowerCase()) ||
        (extracted.name && p.name.toLowerCase() === extracted.name.toLowerCase())
      );

      if (existingIdx !== -1) {
        const item = { ...newProducts[existingIdx] };
        item.openingStock = extracted.openingStock;
        item.physical_stock = extracted.openingStock;
        item.available_to_sell = extracted.openingStock - (item.reserved_stock || 0);
        if (extracted.purchasePrice > 0) item.purchasePrice = extracted.purchasePrice;
        if (extracted.retailPrice > 0) item.retailPrice = extracted.retailPrice;
        if (extracted.godown) item.godown = extracted.godown;
        if (extracted.rack) item.rack = extracted.rack;
        newProducts[existingIdx] = item;
        updatedCount++;
      } else {
        newProducts.unshift(extracted);
        createdCount++;
      }
    });

    if (onUpdateProducts) {
      onUpdateProducts(newProducts);
    }

    try {
      const payloads = newProducts.map(mapFrontendProductToBackend);
      await api.bulkImportProducts(payloads);
      showToast(`✓ Imported ${rows.length} records (${createdCount} added, ${updatedCount} updated) and saved to Railway PostgreSQL!`);
    } catch (err: any) {
      notifyApiError('Failed to import stock to database', err);
    }
  };

  // 3. Add Product Action (Persisting to FastAPI)
  const handleOpenAddModal = () => {
    const nextNum = products.length + 1;
    setNewProdName('Godrej 3-Door Wardrobe');
    setNewProdCode(`P-${String(nextNum).padStart(4, '0')}`);
    setNewProdBarcode(`89011${Math.floor(100000 + Math.random() * 900000)}`);
    setNewProdRetailPrice('25000');
    setNewProdPurchasePrice('18000');
    setNewProdMrp('32000');
    setNewProdOpeningStock('5');
    setNewProdReservedStock('2');
    setNewProdHsn('9403');
    setNewProdGst('18');
    setNewProdIsKnockdown(true);
    setNewProdTotalBoxes('4');
    setNewProdGodown('Main Showroom');
    setNewProdRack('Floor');
    setShowAddProductModal(true);
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;

    if (!newProdName.trim() || !newProdBarcode.trim()) {
      showToast('⚠️ Please enter a valid product name and barcode');
      return;
    }

    setIsSubmittingAdd(true);
    const physicalVal = parseFloat(newProdOpeningStock) || 0;
    const reservedVal = parseFloat(newProdReservedStock) || 0;
    const isKd = Boolean(newProdIsKnockdown);
    const numBoxes = parseInt(newProdTotalBoxes, 10) || (isKd ? 4 : 1);
    const gstRateVal = parseFloat(newProdGst) || 18;
    const cgstVal = gstRateVal / 2;
    const sgstVal = gstRateVal / 2;
    const availVal = Math.max(0, physicalVal - reservedVal);

    const newProd: Product = {
      id: `p-${Date.now()}`,
      pCode: newProdCode.trim(),
      name: newProdName.trim(),
      barcode: newProdBarcode.trim(),
      category: newProdCategory,
      retailPrice: parseFloat(newProdRetailPrice) || 0,
      purchasePrice: parseFloat(newProdPurchasePrice) || 0,
      mrp: parseFloat(newProdMrp) || 0,
      openingStock: physicalVal,
      physical_stock: physicalVal,
      reserved_stock: reservedVal,
      display_stock: 0,
      damaged_stock: 0,
      available_to_sell: availVal,
      isKnockdown: isKd || numBoxes > 1,
      totalBoxesCount: numBoxes,
      total_boxes: numBoxes,
      godown: newProdGodown,
      rack: newProdRack,
      hsn: newProdHsn.trim() || '9403',
      cessPercent: 0,
      cgst: cgstVal,
      sgst: sgstVal,
      igst: gstRateVal,
      salesUnit: 'PCS'
    };

    try {
      const backendPayload = mapFrontendProductToBackend(newProd);
      const res = await api.createProduct(backendPayload);
      if (res && res.id) {
        newProd.id = String(res.id);
      }
      const updatedList = [newProd, ...products];
      if (onUpdateProducts) onUpdateProducts(updatedList);
      if (onAddProduct) onAddProduct(newProd);
      setShowAddProductModal(false);
      notifyApiSuccess(`Added Product "${newProd.name}" (${newProd.pCode}) to Railway PostgreSQL! Available to Sell: ${availVal}`);
      showToast(`✓ Added product "${newProd.name}" successfully! Available: ${availVal}`);
    } catch (err: any) {
      notifyApiError('Failed to create product on backend', err);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // 4. Edit SKU Action
  const handleOpenEditModal = (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row to edit');
      return;
    }
    setEditingProduct(target);
    setEditName(target.name);
    setEditPCode(target.pCode);
    setEditBarcode(target.barcode);
    setEditRetailPrice(String(target.retailPrice || 0));
    setEditPurchasePrice(String(target.purchasePrice || 0));
    setEditMrp(String(target.mrp || 0));
    setEditMinStock(String(target.minStock || 5));
    setEditGodown(target.godown || 'Main Showroom');
    setEditRack(target.rack || '');
    setEditIsKnockdown(Boolean(target.isKnockdown || (target.total_boxes && target.total_boxes > 1)));
    setEditTotalBoxes(String(target.total_boxes || target.totalBoxesCount || 1));
    setShowEditSkuModal(true);
  };

  const handleUpdateSkuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmittingEdit(true);
    const numBoxes = editIsKnockdown ? (parseInt(editTotalBoxes, 10) || 1) : 1;
    const updatedProd: Product = {
      ...editingProduct,
      name: editName.trim(),
      pCode: editPCode.trim(),
      barcode: editBarcode.trim(),
      retailPrice: parseFloat(editRetailPrice) || 0,
      purchasePrice: parseFloat(editPurchasePrice) || 0,
      mrp: parseFloat(editMrp) || 0,
      minStock: parseFloat(editMinStock) || 5,
      godown: editGodown,
      rack: editRack,
      isKnockdown: editIsKnockdown,
      totalBoxesCount: numBoxes,
      total_boxes: numBoxes
    };

    try {
      const backendId = editingProduct.id.includes('p-') ? editingProduct.barcode : editingProduct.id;
      const backendPayload = mapFrontendProductToBackend(updatedProd);
      await api.updateProduct(backendId, backendPayload);

      const updatedList = products.map(p => p.id === editingProduct.id ? updatedProd : p);
      if (onUpdateProducts) onUpdateProducts(updatedList);
      if (onUpdateProduct) onUpdateProduct(updatedProd);
      setShowEditSkuModal(false);
      notifyApiSuccess(`Updated SKU "${updatedProd.pCode}" in Railway PostgreSQL!`);
      showToast(`✓ SKU "${updatedProd.pCode}" updated successfully!`);
    } catch (err: any) {
      notifyApiError('Failed to update product on backend', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 5. Adjust Stock Action
  const handleOpenAdjustModal = (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row to adjust stock');
      return;
    }
    setAdjustingProduct(target);
    setAdjType('Plus');
    setAdjQty('1');
    setAdjReason('Physical Inventory Recount Correction');
    setShowAdjustStockModal(true);
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const qty = parseFloat(adjQty);
    if (!qty || qty <= 0) {
      showToast('⚠️ Please enter a positive quantity');
      return;
    }

    const currentPhysical = adjustingProduct.physical_stock ?? adjustingProduct.openingStock ?? 0;
    if (adjType === 'Minus' && currentPhysical < qty) {
      showToast(`⚠️ Cannot reduce stock by ${qty}! Only ${currentPhysical} available physically.`);
      return;
    }

    setIsSubmittingAdj(true);
    const adjustmentCode = `ADJ-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      const rawId = parseInt(adjustingProduct.id, 10);
      const prodId = !isNaN(rawId) && rawId > 0 ? rawId : 1;

      await api.createStockAdjustment({
        adjustment_code: adjustmentCode,
        date: dateStr,
        product_id: prodId,
        product_code: adjustingProduct.pCode,
        product_name: adjustingProduct.name,
        barcode: adjustingProduct.barcode,
        adjustment_type: adjType,
        qty: qty,
        reason: adjReason
      });

      const newPhysical = adjType === 'Plus' ? currentPhysical + qty : currentPhysical - qty;
      const reserved = adjustingProduct.reserved_stock ?? 0;
      const updatedProd: Product = {
        ...adjustingProduct,
        openingStock: newPhysical,
        physical_stock: newPhysical,
        available_to_sell: newPhysical - reserved
      };

      const updatedList = products.map(p => p.id === adjustingProduct.id ? updatedProd : p);
      if (onUpdateProducts) onUpdateProducts(updatedList);
      if (onUpdateProduct) onUpdateProduct(updatedProd);

      setShowAdjustStockModal(false);
      notifyApiSuccess(`Stock adjustment (${adjType} ${qty}) applied to ${adjustingProduct.name}!`);
      showToast(`✓ Stock adjusted successfully: ${newPhysical} physical units remaining.`);
    } catch (err: any) {
      notifyApiError('Failed to record stock adjustment on backend', err);
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  // 6. Print Barcode / Multi-Box Labels Action
  const handlePrintBarcode = async (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row to print barcode');
      return;
    }
    showToast(`📄 Generating Multi-Box Carton Labels PDF for ${target.pCode}...`);
    try {
      await downloadProductBoxLabelsPdf(target.pCode || target.barcode || target.id);
      showToast(`✓ Multi-Box PDF generated & downloaded for ${target.name}!`);
    } catch (err: any) {
      notifyApiError('Failed to download box labels PDF', err);
      window.print();
    }
  };

  const selectedProd = products.find(p => p.id === selectedProductId);

  return (
    <div className="rd-window">
      {/* 1. HEADER & ACTION TOOLBAR */}
      <div className="rd-window-header-green">
        <div className="rd-window-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏢</span>
          <span>SRI VINAYAKA FURNITURES — INVENTORY & AVAILABLE TO SELL HUB</span>
        </div>
        <div className="rd-window-actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="rd-btn-header"
            onClick={handleOpenAddModal}
            title="Create a new furniture SKU and persist to FastAPI backend"
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <span>➕</span> ADD PRODUCT
          </button>

          <button
            type="button"
            className="rd-btn-header"
            onClick={() => handleOpenEditModal(selectedProd)}
            title="Edit selected SKU details (Price, Godown, Knockdown specs)"
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>✏️</span> EDIT SKU
          </button>

          <button
            type="button"
            className="rd-btn-header"
            onClick={() => handleOpenAdjustModal(selectedProd)}
            title="Record Physical Stock Recount / Damage Adjustment"
            style={{
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>⚖️</span> ADJUST STOCK
          </button>

          <button
            type="button"
            className="rd-btn-header"
            onClick={() => handlePrintBarcode(selectedProd)}
            title="Generate printable Multi-Box Carton Labels PDF (Box 1 of N)"
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>🏷️</span> PRINT BARCODE
          </button>

          <button className="rd-btn-header export" onClick={handleExportCsv} title="Download CSV Spreadsheet">
            <span>📊</span> EXPORT EXCEL
          </button>

          <button
            className="rd-btn-header"
            onClick={() => setShowImportModal(true)}
            title="Import Excel or CSV to update stock"
            style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📥</span> IMPORT EXCEL
          </button>
        </div>
      </div>

      {/* 2. LIVE METRICS SUMMARY STRIP */}
      <div style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '2px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          <div>
            Total SKUs: <span style={{ color: '#38bdf8' }}>{products.length}</span>
          </div>
          <div>
            Physical Stock: <span style={{ color: '#4ade80' }}>{totalPhysicalStock.toFixed(3)}</span>
          </div>
          <div>
            Reserved Stock: <span style={{ color: '#fbbf24' }}>{totalReservedStock.toFixed(3)}</span>
          </div>
          <div style={{
            background: '#14532d',
            padding: '2px 10px',
            borderRadius: '4px',
            border: '1px solid #22c55e',
            color: '#bbf7d0',
            fontWeight: '900'
          }}>
            Available to Sell = {totalAvailableStock.toFixed(3)}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          {selectedProd ? (
            <span>Selected: <b style={{ color: '#ffffff' }}>{selectedProd.name}</b> [{selectedProd.pCode}]</span>
          ) : (
            <span>Click any row to select for Edit, Stock Adjustment, or Barcode Print</span>
          )}
        </div>
      </div>

      {/* 3. FILTER STRIP */}
      <div className="rd-filter-bar">
        <div className="rd-filter-left">
          <input
            type="text"
            className="rd-filter-input"
            style={{ width: '280px', background: '#fef08a', fontWeight: 'bold' }}
            placeholder="Search by Product Name, SKU, Barcode, Rack..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select
            className="rd-filter-input"
            value={filterGodown}
            onChange={e => setFilterGodown(e.target.value)}
          >
            <option value="ALL">All Godowns</option>
            <option value="Main Showroom">Main Showroom</option>
            <option value="Block 1">Block 1</option>
            <option value="Block 2">Block 2</option>
            <option value="Block 3">Block 3</option>
            <option value="Block 5">Block 5</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#bbf7d0', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={showNegativeOnly}
              onChange={e => setShowNegativeOnly(e.target.checked)}
            />
            <span>With 0 or -Ve Available</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showLowStockOnly ? '#f87171' : '#fef08a',
            color: showLowStockOnly ? '#fff' : '#000',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={e => setShowLowStockOnly(e.target.checked)}
            />
            <span>⚠️ Low Stock Items ({lowStockCount})</span>
          </label>
        </div>

        <div className="rd-filter-right">
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d' }}>
            Showing: {filtered.length} of {products.length} Products
          </span>
        </div>
      </div>

      {/* 4. MAIN DATA GRID */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '35px', textAlign: 'center' }}>#</th>
              <th className="th-green">Product Name</th>
              <th className="th-green" style={{ width: '85px' }}>SKU</th>
              <th className="th-green" style={{ width: '100px' }}>Barcode</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Physical Stock</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right', backgroundColor: '#b45309' }}>Reserved</th>
              <th className="th-green" style={{ width: '115px', textAlign: 'right', backgroundColor: '#15803d' }}>Available to Sell</th>
              <th className="th-green" style={{ width: '110px', textAlign: 'center' }}>Knock-Down</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Retail Price</th>
              <th className="th-green" style={{ width: '80px' }}>Godown</th>
              <th className="th-green" style={{ width: '60px' }}>Rack</th>
              <th className="th-green" style={{ width: '135px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No products found matching current search filters.
                </td>
              </tr>
            ) : (
              filtered.map((prod, idx) => {
                const physical = prod.physical_stock ?? prod.openingStock ?? 0;
                const reserved = prod.reserved_stock ?? 0;
                const available = physical - reserved;
                const isSelected = selectedProductId === prod.id;
                const isKnockdown = Boolean(prod.isKnockdown || (prod.total_boxes && prod.total_boxes > 1));
                const totalBoxes = prod.total_boxes || prod.totalBoxesCount || 1;
                const isLowStock = prod.minStock && available <= prod.minStock;

                return (
                  <tr
                    key={prod.id || idx}
                    onClick={() => setSelectedProductId(prod.id)}
                    style={{
                      background: isSelected ? '#bfdbfe' : isLowStock ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {prod.photo && <span style={{ fontSize: '14px' }}>{prod.photo}</span>}
                        <span>{prod.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#0369a1' }}>{prod.pCode}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{prod.barcode}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                      {physical.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: reserved > 0 ? '#d97706' : '#64748b' }}>
                      {reserved.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        background: available > 0 ? '#dcfce7' : '#fee2e2',
                        color: available > 0 ? '#15803d' : '#dc2626',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '900',
                        fontSize: '11px',
                        display: 'inline-block'
                      }}>
                        {available.toFixed(3)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isKnockdown ? (
                        <span style={{
                          background: '#ede9fe',
                          color: '#6d28d9',
                          fontWeight: 'bold',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd6fe'
                        }}>
                          📦 {totalBoxes} Boxes
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '10px' }}>1 Box (Prebuilt)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ₹{(prod.retailPrice || 0).toFixed(2)}
                    </td>
                    <td style={{ color: '#0369a1', fontWeight: 'bold' }}>{prod.godown || 'Main Showroom'}</td>
                    <td style={{ color: '#b45309' }}>{prod.rack || 'Floor'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(prod);
                          }}
                          title="Edit SKU"
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAdjustModal(prod);
                          }}
                          title="Adjust Stock"
                          style={{
                            background: '#d97706',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ⚖️ Adj
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintBarcode(prod);
                          }}
                          title={isKnockdown ? 'Print Sub-Box Barcode Labels (Box 1 of N)' : 'Print Product Barcode'}
                          style={{
                            background: '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🏷️ {isKnockdown ? 'Boxes' : 'Label'}
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

      {/* 5. MODAL: + ADD PRODUCT */}
      {showAddProductModal && (
        <div className="rd-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rd-dialog" style={{ width: '560px', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div className="rd-window-header-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' }}>
              <div className="rd-window-title">➕ ADD NEW FURNITURE SKU (FASTAPI PERSISTED)</div>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProductSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Product Title / Name : *</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Godrej Interio Slimline 3-Door Wardrobe"
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Category :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                  >
                    <option value="Living Room">Living Room</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Dining Room">Dining Room</option>
                    <option value="Office / Study">Office / Study</option>
                    <option value="Storage & Wardrobes">Storage & Wardrobes</option>
                    <option value="Mattresses">Mattresses</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Product Code / SKU : *</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={newProdCode}
                    onChange={e => setNewProdCode(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Barcode (EAN-13) : *</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Retail Price (₹) :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={newProdRetailPrice}
                    onChange={e => setNewProdRetailPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Purchase Price (₹) :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={newProdPurchasePrice}
                    onChange={e => setNewProdPurchasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>MRP (₹) :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={newProdMrp}
                    onChange={e => setNewProdMrp(e.target.value)}
                  />
                </div>
              </div>

              {/* 4-Bucket Stock Separation Strip */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#15803d' }}>
                      Physical Stock : *
                    </label>
                    <input
                      type="number"
                      required
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}
                      value={newProdOpeningStock}
                      onChange={e => setNewProdOpeningStock(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#d97706' }}>
                      Reserved Stock : *
                    </label>
                    <input
                      type="number"
                      required
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}
                      value={newProdReservedStock}
                      onChange={e => setNewProdReservedStock(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#2563eb' }}>
                      Available to Sell :
                    </label>
                    <div style={{
                      padding: '4px 8px',
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '13px',
                      textAlign: 'right',
                      border: '1px solid #86efac'
                    }}>
                      {Math.max(0, (parseFloat(newProdOpeningStock) || 0) - (parseFloat(newProdReservedStock) || 0)).toFixed(3)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                  Available to Sell = Physical ({newProdOpeningStock}) - Reserved ({newProdReservedStock}) = {Math.max(0, (parseFloat(newProdOpeningStock) || 0) - (parseFloat(newProdReservedStock) || 0))}
                </div>
              </div>

              {/* GST & HSN Configuration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>HSN Code :</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={newProdHsn}
                    onChange={e => setNewProdHsn(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>GST Rate (%) :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', fontWeight: 'bold' }}
                    value={newProdGst}
                    onChange={e => setNewProdGst(e.target.value)}
                  >
                    <option value="18">18% GST (9% CGST + 9% SGST)</option>
                    <option value="12">12% GST (6% CGST + 6% SGST)</option>
                    <option value="28">28% GST (14% CGST + 14% SGST)</option>
                    <option value="5">5% GST (2.5% CGST + 2.5% SGST)</option>
                    <option value="0">0% (Nil / Exempt)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={newProdIsKnockdown}
                    onChange={e => setNewProdIsKnockdown(e.target.checked)}
                  />
                  <span>📦 Knock-Down Furniture (Flat-Pack Multi-Box Package)</span>
                </label>
                {newProdIsKnockdown && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                    <span>Total Sub-Boxes (N):</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="rd-pos-input"
                      style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                      value={newProdTotalBoxes}
                      onChange={e => setNewProdTotalBoxes(e.target.value)}
                    />
                    <span style={{ color: '#6d28d9', fontStyle: 'italic' }}>Will generate Box 1 of N ... Box N of N barcode stickers!</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Godown :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={newProdGodown}
                    onChange={e => setNewProdGodown(e.target.value)}
                  >
                    <option value="Main Showroom">Main Showroom</option>
                    <option value="Block 1">Block 1</option>
                    <option value="Block 2">Block 2</option>
                    <option value="Block 3">Block 3</option>
                    <option value="Block 5">Block 5</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Rack / Location :</label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={newProdRack}
                    onChange={e => setNewProdRack(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  id="save-product-submit-btn"
                  type="submit"
                  disabled={isSubmittingAdd}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: isSubmittingAdd ? '#94a3b8' : '#16a34a',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingAdd ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSubmittingAdd ? 'Saving...' : '💾 Save Product to Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ✏️ EDIT SKU */}
      {showEditSkuModal && editingProduct && (
        <div className="rd-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rd-dialog" style={{ width: '540px', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div className="rd-window-header-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px' }}>
              <div className="rd-window-title">✏️ EDIT SKU: {editingProduct.pCode}</div>
              <button onClick={() => setShowEditSkuModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateSkuSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Product Title :</label>
                <input
                  type="text"
                  required
                  className="rd-pos-input"
                  style={{ width: '100%' }}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>SKU Code :</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={editPCode}
                    onChange={e => setEditPCode(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Barcode :</label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={editBarcode}
                    onChange={e => setEditBarcode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Retail Price (₹) :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={editRetailPrice}
                    onChange={e => setEditRetailPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Purchase (₹) :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={editPurchasePrice}
                    onChange={e => setEditPurchasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Min Stock Alert :</label>
                  <input
                    type="number"
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right' }}
                    value={editMinStock}
                    onChange={e => setEditMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={editIsKnockdown}
                    onChange={e => setEditIsKnockdown(e.target.checked)}
                  />
                  <span>📦 Knock-Down Furniture (Multi-Box Carton Set)</span>
                </label>
                {editIsKnockdown && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                    <span>Total Boxes (N):</span>
                    <input
                      type="number"
                      min="2"
                      max="12"
                      className="rd-pos-input"
                      style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                      value={editTotalBoxes}
                      onChange={e => setEditTotalBoxes(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Godown :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={editGodown}
                    onChange={e => setEditGodown(e.target.value)}
                  >
                    <option value="Main Showroom">Main Showroom</option>
                    <option value="Block 1">Block 1</option>
                    <option value="Block 2">Block 2</option>
                    <option value="Block 3">Block 3</option>
                    <option value="Block 5">Block 5</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Rack :</label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={editRack}
                    onChange={e => setEditRack(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditSkuModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingEdit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingEdit ? 'Updating Database...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: ⚖️ ADJUST STOCK */}
      {showAdjustStockModal && adjustingProduct && (
        <div className="rd-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rd-dialog" style={{ width: '500px', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div className="rd-window-header-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#d97706' }}>
              <div className="rd-window-title">⚖️ PHYSICAL STOCK ADJUSTMENT: {adjustingProduct.name}</div>
              <button onClick={() => setShowAdjustStockModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Current Physical Stock:</span>
                  <b>{(adjustingProduct.physical_stock ?? adjustingProduct.openingStock ?? 0).toFixed(3)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Reserved for Advance Booking:</span>
                  <b style={{ color: '#d97706' }}>{(adjustingProduct.reserved_stock ?? 0).toFixed(3)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                  <span>Available to Sell:</span>
                  <b style={{ color: '#15803d' }}>
                    {((adjustingProduct.physical_stock ?? adjustingProduct.openingStock ?? 0) - (adjustingProduct.reserved_stock ?? 0)).toFixed(3)}
                  </b>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Adjustment Action :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', fontWeight: 'bold', color: adjType === 'Plus' ? '#15803d' : '#dc2626' }}
                    value={adjType}
                    onChange={e => setAdjType(e.target.value as any)}
                  >
                    <option value="Plus">➕ Add Stock (Plus)</option>
                    <option value="Minus">➖ Deduct Stock (Minus)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Quantity :</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', textAlign: 'right', fontWeight: '900', fontSize: '14px' }}
                    value={adjQty}
                    onChange={e => setAdjQty(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Adjustment Reason :</label>
                <select
                  className="rd-pos-input"
                  style={{ width: '100%' }}
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                >
                  <option value="Physical Inventory Recount Correction">Physical Inventory Recount Correction</option>
                  <option value="Damage / Transit Dent / Breakage">Damage / Transit Dent / Breakage</option>
                  <option value="Showroom Display Sample Move">Showroom Display Sample Move</option>
                  <option value="Supplier Replacement Delivery">Supplier Replacement Delivery</option>
                  <option value="Customer Return Stock Inward">Customer Return Stock Inward</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdj}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#d97706',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingAdj ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingAdj ? 'Recording in Database...' : 'Commit Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* 9. EXCEL IMPORT MODAL */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="stock"
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
