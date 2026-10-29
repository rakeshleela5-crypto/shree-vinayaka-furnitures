import { useState, useMemo } from 'react';
import type { Product } from '../../types/retailDaddy';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { exportToCsv, extractProductFromRow } from '../../utils/csvImporter';
import { 
  api, 
  mapFrontendProductToBackend, 
  downloadProductBoxLabelsPdf, 
  notifyApiSuccess, 
  notifyApiError,
  transferStockBuckets,
  createStandaloneGrn,
  processQuarantineWriteOff
} from '../../api/client';
import { BarcodeHardwareHubModal } from '../hardware/BarcodeHardwareHubModal';

interface StockInHandViewProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onOpenBarcodeStudio?: (product: Product) => void;
  onClose?: () => void;
}

export function StockInHandView({ products, onUpdateProducts, onAddProduct, onUpdateProduct, onOpenBarcodeStudio, onClose }: StockInHandViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [filterGodown, setFilterGodown] = useState('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showHardwareHub, setShowHardwareHub] = useState(false);
  const [hardwareProduct, setHardwareProduct] = useState<Product | null>(null);

  // Modals for Inventory Operations
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditSkuModal, setShowEditSkuModal] = useState(false);
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [newProdItemType, setNewProdItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Living Room');
  const [newProdRetailPrice, setNewProdRetailPrice] = useState('25000');
  const [newProdWholesalePrice, setNewProdWholesalePrice] = useState('21000');
  const [newProdMinWholesaleQty, setNewProdMinWholesaleQty] = useState('5');
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

  // Inter-Godown Stock Transfer State (Frame 10)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringProduct, setTransferringProduct] = useState<Product | null>(null);
  const [trfFromGodown, setTrfFromGodown] = useState('Godown 1');
  const [trfToGodown, setTrfToGodown] = useState('Main Showroom');
  const [trfFromRack, setTrfFromRack] = useState('Rack A');
  const [trfToRack, setTrfToRack] = useState('Display Floor');
  const [trfQty, setTrfQty] = useState('2');
  const [trfRemarks, setTrfRemarks] = useState('Transfer stock from bulk godown to showroom display floor');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Four-Bucket Stock Transfer State
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [bucketProduct, setBucketProduct] = useState<Product | null>(null);
  const [fromBucket, setFromBucket] = useState<string>('godown_available_qty');
  const [toBucket, setToBucket] = useState<string>('showroom_display_qty');
  const [bucketQty, setBucketQty] = useState<string>('1');
  const [bucketReason, setBucketReason] = useState<string>('FLOOR_DISPLAY_SETUP');
  const [bucketNotes, setBucketNotes] = useState<string>('');
  const [isSubmittingBucket, setIsSubmittingBucket] = useState(false);

  // Section 17(5)(h) Statutory Scrap Write-Off State
  const [showQuarantineWriteOffModal, setShowQuarantineWriteOffModal] = useState(false);
  const [writeOffProduct, setWriteOffProduct] = useState<Product | null>(null);
  const [writeOffQty, setWriteOffQty] = useState('1');
  const [writeOffSourceBucket, setWriteOffSourceBucket] = useState('damaged_quarantine_qty');
  const [writeOffReason, setWriteOffReason] = useState('Transit frame damage / hydraulic mechanism shattered beyond repair');
  const [isSubmittingWriteOff, setIsSubmittingWriteOff] = useState(false);

  // Standalone Goods Receipt Note (GRN) Inward State
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnNo, setGrnNo] = useState(`GRN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [grnSupplier, setGrnSupplier] = useState('Godrej Interio Distribution Hub');
  const [grnInvoiceNo, setGrnInvoiceNo] = useState('INV-GD-89218');
  const [grnFreight, setGrnFreight] = useState('1200');
  const [grnProdId, setGrnProdId] = useState<string>('');
  const [grnUnits, setGrnUnits] = useState('5');
  const [grnUnitCost, setGrnUnitCost] = useState('14500');
  const [grnPacketsPerUnit, setGrnPacketsPerUnit] = useState('4');
  const [grnMissingPackets, setGrnMissingPackets] = useState('0');
  const [grnTargetBucket, setGrnTargetBucket] = useState('godown_available_qty');
  const [isSubmittingGrn, setIsSubmittingGrn] = useState(false);

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

    const importedNew: Product[] = [];
    const updatedExistingMap = new Map<string, Product>();

    rows.forEach((row, idx) => {
      const extracted = extractProductFromRow(row, idx);
      const existing = products.find(p =>
        (extracted.barcode && p.barcode === extracted.barcode) ||
        (extracted.pCode && p.pCode.toLowerCase() === extracted.pCode.toLowerCase()) ||
        (extracted.name && p.name.toLowerCase() === extracted.name.toLowerCase())
      );

      if (existing) {
        const item = { ...existing };
        item.openingStock = extracted.openingStock;
        item.physical_stock = extracted.openingStock;
        item.available_to_sell = extracted.openingStock - (item.reserved_stock || 0);
        if (extracted.purchasePrice > 0) item.purchasePrice = extracted.purchasePrice;
        if (extracted.retailPrice > 0) item.retailPrice = extracted.retailPrice;
        if (extracted.godown) item.godown = extracted.godown;
        if (extracted.rack) item.rack = extracted.rack;
        updatedExistingMap.set(existing.id, item);
        updatedCount++;
      } else {
        importedNew.push(extracted);
        createdCount++;
      }
    });

    const updatedExistingList = Array.from(updatedExistingMap.values());
    const untouchedProducts = products.filter(p => !updatedExistingMap.has(p.id));
    const finalProductList = [...importedNew, ...updatedExistingList, ...untouchedProducts];

    setSearchTerm('');
    setFilterGodown('ALL');
    setShowNegativeOnly(false);
    setShowLowStockOnly(false);

    if (onUpdateProducts) {
      await onUpdateProducts(finalProductList);
    } else {
      try {
        const payloads = finalProductList.map(mapFrontendProductToBackend);
        await api.bulkImportProducts(payloads);
      } catch (err: any) {
        notifyApiError('Failed to import stock to database', err);
      }
    }
    showToast(`✓ Imported ${rows.length} records (${createdCount} added, ${updatedCount} updated) to top of stock!`);
  };

  // 3. Add Product Action (Persisting to FastAPI)
  const handleOpenAddModal = () => {
    const nextNum = products.length + 1;
    setNewProdItemType('PRODUCT');
    setNewProdName('Godrej 3-Door Wardrobe');
    setNewProdCode(`P-${String(nextNum).padStart(4, '0')}`);
    setNewProdBarcode(`89011${Math.floor(100000 + Math.random() * 900000)}`);
    setNewProdRetailPrice('25000');
    setNewProdWholesalePrice('21000');
    setNewProdMinWholesaleQty('5');
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
    const isService = newProdItemType === 'SERVICE';
    const physicalVal = isService ? 0 : (parseFloat(newProdOpeningStock) || 0);
    const reservedVal = isService ? 0 : (parseFloat(newProdReservedStock) || 0);
    const isKd = isService ? false : Boolean(newProdIsKnockdown);
    const numBoxes = isService ? 1 : (parseInt(newProdTotalBoxes, 10) || (isKd ? 4 : 1));
    const gstRateVal = parseFloat(newProdGst) || 18;
    const cgstVal = gstRateVal / 2;
    const sgstVal = gstRateVal / 2;
    const availVal = isService ? 9999 : Math.max(0, physicalVal - reservedVal);

    const newProd: Product = {
      id: `p-${Date.now()}`,
      pCode: newProdCode.trim(),
      name: newProdName.trim(),
      barcode: newProdBarcode.trim(),
      itemType: newProdItemType,
      category: isService ? 'Services & Labor' : newProdCategory,
      retailPrice: parseFloat(newProdRetailPrice) || 0,
      wholesalePrice: parseFloat(newProdWholesalePrice) || 0,
      minWholesaleQty: parseFloat(newProdMinWholesaleQty) || 1,
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
      hsn: newProdHsn.trim() || (isService ? '9954' : '9403'),
      cessPercent: 0,
      cgst: cgstVal,
      sgst: sgstVal,
      igst: gstRateVal,
      salesUnit: isService ? 'JOB' : 'PCS'
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

  // 5b. Inter-Godown Stock Transfer Action (Frame 10)
  const handleOpenTransferModal = (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row to transfer');
      return;
    }
    setTransferringProduct(target);
    const currGodown = target.godown || 'Godown 1';
    setTrfFromGodown(currGodown);
    setTrfToGodown(currGodown.toLowerCase().includes('showroom') ? 'Godown 1' : 'Main Showroom');
    setTrfFromRack(target.rack || 'Rack A');
    setTrfToRack('Display Floor');
    setTrfQty('2');
    setTrfRemarks('Transfer from bulk godown to showroom display floor');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringProduct) return;

    const qty = parseFloat(trfQty);
    if (!qty || qty <= 0) {
      showToast('⚠️ Please enter a positive transfer quantity');
      return;
    }

    const available = (transferringProduct.physical_stock ?? transferringProduct.openingStock ?? 0) - (transferringProduct.reserved_stock ?? 0);
    if (available < qty) {
      showToast(`⚠️ Cannot transfer ${qty} units! Only ${available} available unreserved.`);
      return;
    }

    if (trfFromGodown === trfToGodown) {
      showToast('⚠️ Source and destination godowns must be different!');
      return;
    }

    setIsSubmittingTransfer(true);
    const transferNo = `TRF-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      const rawId = parseInt(transferringProduct.id, 10);
      const prodId = !isNaN(rawId) && rawId > 0 ? rawId : 1;

      await api.createStockTransfer({
        transfer_no: transferNo,
        date: dateStr,
        product_id: prodId,
        product_code: transferringProduct.pCode,
        product_name: transferringProduct.name,
        barcode: transferringProduct.barcode,
        from_godown: trfFromGodown,
        to_godown: trfToGodown,
        from_rack: trfFromRack,
        to_rack: trfToRack,
        qty: qty,
        remarks: trfRemarks
      });

      const updatedProd: Product = {
        ...transferringProduct,
        godown: trfToGodown,
        rack: trfToRack
      };

      const updatedList = products.map(p => p.id === transferringProduct.id ? updatedProd : p);
      if (onUpdateProducts) onUpdateProducts(updatedList);
      if (onUpdateProduct) onUpdateProduct(updatedProd);

      notifyApiSuccess(`Stock Transfer ${transferNo} completed: ${qty} units of ${transferringProduct.name} moved to ${trfToGodown}!`);
      showToast(`✓ Transferred ${qty} units to ${trfToGodown}! (Total stock unchanged)`);
      setShowTransferModal(false);
    } catch (err: any) {
      notifyApiError('Failed to record stock transfer on backend', err);
    } finally {
      setIsSubmittingTransfer(false);
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

  // 7. Four-Bucket Transfer Action
  const handleOpenBucketModal = (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row first');
      return;
    }
    setBucketProduct(target);
    setFromBucket('godown_available_qty');
    setToBucket('showroom_display_qty');
    setBucketQty('1');
    setBucketReason('FLOOR_DISPLAY_SETUP');
    setBucketNotes('');
    setShowBucketModal(true);
  };

  const handleBucketTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucketProduct) return;
    const qty = parseFloat(bucketQty);
    if (!qty || qty <= 0) {
      showToast('⚠️ Please enter a positive transfer quantity');
      return;
    }
    if (fromBucket === toBucket) {
      showToast('⚠️ Origin and destination buckets must be different!');
      return;
    }
    setIsSubmittingBucket(true);
    try {
      const rawId = parseInt(bucketProduct.id, 10);
      const prodId = !isNaN(rawId) && rawId > 0 ? rawId : 1;
      await transferStockBuckets({
        product_id: prodId,
        source_bucket: fromBucket,
        target_bucket: toBucket,
        qty: qty,
        reason: bucketReason,
        performed_by: 'Showroom Manager'
      });
      notifyApiSuccess(`Transferred ${qty} units between stock buckets!`);
      showToast(`✓ Bucket transfer successful: ${qty} units moved to ${toBucket}!`);
      setShowBucketModal(false);
    } catch (err: any) {
      notifyApiError('Failed to transfer stock bucket', err);
    } finally {
      setIsSubmittingBucket(false);
    }
  };

  // 7b. Section 17(5)(h) Statutory Quarantine Scrap Write-Off Action
  const handleOpenQuarantineWriteOffModal = (prod?: Product) => {
    const target = prod || products.find(p => p.id === selectedProductId) || products[0];
    if (!target) {
      showToast('⚠️ Please select a product row first');
      return;
    }
    setWriteOffProduct(target);
    setWriteOffQty('1');
    setWriteOffSourceBucket('damaged_quarantine_qty');
    setWriteOffReason('Transit frame damage / hydraulic mechanism shattered beyond repair');
    setShowQuarantineWriteOffModal(true);
  };

  const handleQuarantineWriteOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeOffProduct) return;
    const qty = parseFloat(writeOffQty);
    if (!qty || qty <= 0) {
      showToast('⚠️ Please enter a valid quantity greater than zero');
      return;
    }
    setIsSubmittingWriteOff(true);
    try {
      const rawId = parseInt(writeOffProduct.id, 10);
      const prodId = !isNaN(rawId) && rawId > 0 ? rawId : 1;
      const res = await processQuarantineWriteOff({
        product_id: prodId,
        qty: qty,
        source_bucket: writeOffSourceBucket,
        reason: writeOffReason,
        performed_by: 'Showroom Manager'
      });

      // Update product in local state
      const updatedProd: Product = {
        ...writeOffProduct,
        damaged_quarantine_qty: Math.max(0, (writeOffProduct.damaged_quarantine_qty || 0) - qty),
        physical_stock: Math.max(0, (writeOffProduct.physical_stock || 0) - qty)
      };
      const updatedList = products.map(p => p.id === writeOffProduct.id ? updatedProd : p);
      if (onUpdateProducts) onUpdateProducts(updatedList);
      if (onUpdateProduct) onUpdateProduct(updatedProd);

      showToast(`✓ Sec 17(5)(h) Write-off posted! Reversed ₹${Number(res.itc_reversed_amount || 0).toFixed(2)} ITC. JV: ${res.journal_entry_number}`);
      setShowQuarantineWriteOffModal(false);
    } catch (err: any) {
      notifyApiError('Failed to process statutory write-off', err);
    } finally {
      setIsSubmittingWriteOff(false);
    }
  };

  // 8. Standalone GRN Stock Entry Action
  const handleOpenGrnModal = () => {
    setGrnNo(`GRN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    setGrnSupplier('Godrej Interio Distribution Hub');
    setGrnInvoiceNo('INV-GD-89218');
    setGrnFreight('1200');
    setGrnProdId(products[0]?.id || '1');
    setGrnUnits('5');
    setGrnUnitCost(String(products[0]?.purchasePrice || 14500));
    setGrnPacketsPerUnit('4');
    setGrnMissingPackets('0');
    setGrnTargetBucket('godown_available_qty');
    setShowGrnModal(true);
  };

  const handleGrnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(grnUnits);
    const unitPrice = parseFloat(grnUnitCost);
    const freight = parseFloat(grnFreight) || 0;
    const missing = parseInt(grnMissingPackets, 10) || 0;
    const pktsPerUnit = parseInt(grnPacketsPerUnit, 10) || 1;

    if (!qty || qty <= 0 || !unitPrice || unitPrice <= 0) {
      showToast('⚠️ Please enter valid quantity and unit cost');
      return;
    }

    const selectedProduct = products.find(p => p.id === grnProdId) || products[0];
    const rawId = parseInt(selectedProduct?.id || '1', 10);
    const prodId = !isNaN(rawId) && rawId > 0 ? rawId : 1;
    const totalExpectedPkts = qty * pktsPerUnit;
    const totalReceivedPkts = Math.max(0, totalExpectedPkts - missing);

    setIsSubmittingGrn(true);
    try {
      const targetLoc: 'GODOWN' | 'SHOWROOM' = grnTargetBucket.toLowerCase().includes('showroom') ? 'SHOWROOM' : 'GODOWN';
      const intactUnits = pktsPerUnit > 1 ? Math.floor(totalReceivedPkts / pktsPerUnit) : qty;
      const brokenUnits = Math.max(0, qty - intactUnits);

      await createStandaloneGrn({
        grn_no: grnNo,
        date: new Date().toISOString().split('T')[0],
        supplier_name: grnSupplier,
        supplier_invoice_no: grnInvoiceNo,
        supplier_invoice_date: new Date().toISOString().split('T')[0],
        freight_hamali_cost: freight,
        remarks: `Standard stock receipt for ${selectedProduct.name}`,
        supplier_id: 1,
        items: [
          {
            product_id: prodId,
            barcode: selectedProduct.barcode,
            product_name: selectedProduct.name,
            ordered_qty: qty,
            received_good: intactUnits,
            received_qty: qty,
            received_damaged: brokenUnits,
            unit_price: unitPrice,
            target_location: targetLoc,
            is_knockdown: pktsPerUnit > 1,
            packets_per_unit: pktsPerUnit,
            total_packets_received: totalReceivedPkts,
            missing_packets_count: missing
          }
        ]
      });
      const updatedList = products.map(p => {
        if (p.id === selectedProduct.id) {
          const curPhys = p.physical_stock ?? p.openingStock ?? 0;
          return {
            ...p,
            physical_stock: curPhys + intactUnits,
            openingStock: curPhys + intactUnits,
            available_to_sell: (curPhys + intactUnits) - (p.reserved_stock ?? 0)
          };
        }
        return p;
      });
      if (onUpdateProducts) onUpdateProducts(updatedList);

      notifyApiSuccess(`GRN ${grnNo} recorded! ${intactUnits} units added to ${grnTargetBucket}.`);
      showToast(`✓ GRN ${grnNo} posted! Balanced journal created in Double-Entry Ledger.`);
      setShowGrnModal(false);
    } catch (err: any) {
      notifyApiError('Failed to record GRN', err);
    } finally {
      setIsSubmittingGrn(false);
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
            onClick={() => handleOpenTransferModal(selectedProd)}
            title="Transfer stock between Godowns and Showroom Display Floor (Frame 10)"
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
            <span>⇄</span> TRANSFER GODOWN
          </button>

          <button
            type="button"
            className="rd-btn-header"
            onClick={() => handleOpenBucketModal(selectedProd)}
            title="Move stock across the 4 explicit furniture buckets (Godown, Showroom, Damaged Quarantine)"
            style={{
              backgroundColor: '#0d9488',
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
            <span>📦</span> BUCKET TRANSFER
          </button>

          <button
            type="button"
            className="rd-btn-header"
            onClick={handleOpenGrnModal}
            title="Record Inward Goods Receipt Note (GRN) with Knockdown Packets & Double-Entry Ledger Posting"
            style={{
              backgroundColor: '#4338ca',
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
            <span>📋</span> INWARD GRN
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

          {onOpenBarcodeStudio && (
            <button
              type="button"
              className="rd-btn-header"
              onClick={() => onOpenBarcodeStudio(selectedProd || products[0])}
              title="Open Barcode & QR Code Designer Studio for custom label formatting and thermal roll printing"
              style={{
                backgroundColor: '#0f766e',
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
              <span>🎨</span> BARCODE STUDIO
            </button>
          )}

          <button
            className="rd-btn-header"
            onClick={() => {
              setHardwareProduct(selectedProd || products[0] || null);
              setShowHardwareHub(true);
            }}
            title="Retsol R220 Thermal Label Printer & Brontix Desktop Scanner Hardware Studio"
            style={{
              backgroundColor: '#d97706',
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
            <span>⚡</span> RETSOL & BRONTIX HUB
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

          {onClose && (
            <button
              type="button"
              className="rd-btn-header"
              onClick={onClose}
              title="Close Inventory Hub and return to Desktop [Esc]"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                padding: '5px 12px',
                borderRadius: '4px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginLeft: '6px'
              }}
            >
              <span>✕</span> EXIT [Esc]
            </button>
          )}
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
                            handleOpenTransferModal(prod);
                          }}
                          title="Transfer Godown"
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
                          ⇄ Trf
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHardwareProduct(prod);
                            setShowHardwareHub(true);
                          }}
                          title="Print on Retsol R220 203 DPI Desktop Barcode Printer"
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🖨️ Retsol
                        </button>
                        {onOpenBarcodeStudio && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBarcodeStudio(prod);
                            }}
                            title="Open product in Barcode & QR Code Designer Studio"
                            style={{
                              background: '#0f766e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            🎨 Studio
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuarantineWriteOffModal(prod);
                          }}
                          title="Statutory Sec 17(5)(h) Scrap Write-Off & ITC Reversal"
                          style={{
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ Scrap
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
              <div className="rd-window-title">
                {newProdItemType === 'SERVICE' ? '🛠️ ADD NEW SERVICE ITEM (NON-INVENTORY)' : '➕ ADD NEW FURNITURE SKU (FASTAPI PERSISTED)'}
              </div>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProductSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '82vh', overflowY: 'auto' }}>
              
              {/* Product vs Service Item Master Toggle (Influencer Tutorial 07:30 - 08:45) */}
              <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '6px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setNewProdItemType('PRODUCT');
                    if (newProdHsn === '9954' || newProdHsn === '9987' || newProdHsn === '9965') setNewProdHsn('9403');
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: newProdItemType === 'PRODUCT' ? '#15803d' : 'transparent',
                    color: newProdItemType === 'PRODUCT' ? '#ffffff' : '#475569',
                    boxShadow: newProdItemType === 'PRODUCT' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  📦 Product (Stock Hedging)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewProdItemType('SERVICE');
                    setNewProdOpeningStock('0');
                    setNewProdReservedStock('0');
                    if (newProdHsn === '9403') setNewProdHsn('9954');
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: newProdItemType === 'SERVICE' ? '#2563eb' : 'transparent',
                    color: newProdItemType === 'SERVICE' ? '#ffffff' : '#475569',
                    boxShadow: newProdItemType === 'SERVICE' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🛠️ Service (Labor / Polishing / Freight)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {newProdItemType === 'SERVICE' ? 'Service Title / Description : *' : 'Product Title / Name : *'}
                  </label>
                  <input
                    type="text"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    placeholder={newProdItemType === 'SERVICE' ? "e.g. On-Site Furniture Polishing & Restoration" : "e.g. Godrej Interio Slimline 3-Door Wardrobe"}
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                  />
                  {newProdItemType === 'SERVICE' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => { setNewProdName('On-Site Carpentry & Assembly Labor'); setNewProdHsn('9954'); setNewProdRetailPrice('1200'); }}
                        style={{ fontSize: '9px', padding: '2px 6px', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '3px', color: '#3730a3', cursor: 'pointer' }}
                      >
                        + Carpentry Labor
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewProdName('PU Wood Polishing & Wax Finishing'); setNewProdHsn('9987'); setNewProdRetailPrice('2500'); }}
                        style={{ fontSize: '9px', padding: '2px 6px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '3px', color: '#92400e', cursor: 'pointer' }}
                      >
                        + Polishing Service
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewProdName('Express Home Delivery & Tempo Freight'); setNewProdHsn('9965'); setNewProdRetailPrice('800'); }}
                        style={{ fontSize: '9px', padding: '2px 6px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '3px', color: '#166534', cursor: 'pointer' }}
                      >
                        + Tempo Freight
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Category :</label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%' }}
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                  >
                    {newProdItemType === 'SERVICE' ? (
                      <>
                        <option value="Services & Labor">Services & Labor</option>
                        <option value="Delivery & Freight">Delivery & Freight</option>
                        <option value="Maintenance & Warranty">Maintenance & Warranty</option>
                      </>
                    ) : (
                      <>
                        <option value="Living Room">Living Room</option>
                        <option value="Bedroom">Bedroom</option>
                        <option value="Dining Room">Dining Room</option>
                        <option value="Office / Study">Office / Study</option>
                        <option value="Storage & Wardrobes">Storage & Wardrobes</option>
                        <option value="Mattresses">Mattresses</option>
                        <option value="Accessories">Accessories</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {newProdItemType === 'SERVICE' ? 'Service Code : *' : 'Product Code / SKU : *'}
                  </label>
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {newProdItemType === 'SERVICE' ? 'Billing Code / Barcode : *' : 'Barcode (EAN-13) : *'}
                  </label>
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

              {/* Pricing Grid with Wholesale Pricing Tier (Influencer Tutorial 06:15 - 07:15) */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '6px' }}>
                  💰 Pricing Structure & Wholesale Tier
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Retail (₹) : *</label>
                    <input
                      type="number"
                      required
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right', fontWeight: 'bold' }}
                      value={newProdRetailPrice}
                      onChange={e => setNewProdRetailPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', color: '#7c3aed' }}>Wholesale (₹) :</label>
                    <input
                      type="number"
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right', fontWeight: 'bold', color: '#7c3aed', background: '#f5f3ff' }}
                      value={newProdWholesalePrice}
                      onChange={e => setNewProdWholesalePrice(e.target.value)}
                      placeholder="Wholesale Rate"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', color: '#7c3aed' }}>Min Qty :</label>
                    <input
                      type="number"
                      min="1"
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', color: '#7c3aed', background: '#f5f3ff' }}
                      value={newProdMinWholesaleQty}
                      onChange={e => setNewProdMinWholesaleQty(e.target.value)}
                      placeholder="Min Qty"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Purchase (₹) :</label>
                    <input
                      type="number"
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right' }}
                      value={newProdPurchasePrice}
                      onChange={e => setNewProdPurchasePrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>MRP (₹) :</label>
                    <input
                      type="number"
                      className="rd-pos-input"
                      style={{ width: '100%', textAlign: 'right' }}
                      value={newProdMrp}
                      onChange={e => setNewProdMrp(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#6d28d9', marginTop: '4px' }}>
                  💡 Wholesale auto-trigger: If cart quantity reaches <strong>{newProdMinWholesaleQty}</strong> units or more, POS auto-bills at <strong>₹{newProdWholesalePrice}</strong>.
                </div>
              </div>

              {/* 4-Bucket Stock Separation Strip OR Service Non-Inventory Notice */}
              {newProdItemType === 'SERVICE' ? (
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '6px', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🛠️</span>
                  <div style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.4' }}>
                    <strong>Non-Inventory Service Item:</strong> Bypasses stock deduction and stock-out alerts during sales billing.
                    Can be billed unlimited times and linked to customer job cards with SAC tax codes.
                  </div>
                </div>
              ) : (
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
              )}

              {/* GST & HSN Configuration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {newProdItemType === 'SERVICE' ? 'SAC Code (Services) : *' : 'HSN Code (Goods) : *'}
                  </label>
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

              {/* Knockdown Option - only for Physical Products */}
              {newProdItemType === 'PRODUCT' && (
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
              )}

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

      {/* 7b. INTER-GODOWN STOCK TRANSFER MODAL (FRAME 10) */}
      {showTransferModal && transferringProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              border: '2px solid #0284c7',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '560px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              <span>⇄ Inter-Godown Stock Transfer (Frame 10)</span>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0369a1' }}>
                  {transferringProduct.name} ({transferringProduct.pCode})
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '16px' }}>
                  <span>Barcode: <strong>{transferringProduct.barcode}</strong></span>
                  <span>Physical: <strong>{transferringProduct.physical_stock ?? transferringProduct.openingStock ?? 0}</strong></span>
                  <span>Reserved: <strong style={{ color: '#d97706' }}>{transferringProduct.reserved_stock ?? 0}</strong></span>
                  <span>Available to Move: <strong style={{ color: '#16a34a' }}>
                    {(transferringProduct.physical_stock ?? transferringProduct.openingStock ?? 0) - (transferringProduct.reserved_stock ?? 0)}
                  </strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#334155' }}>
                    From Source Godown *
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={trfFromGodown}
                    onChange={e => setTrfFromGodown(e.target.value)}
                  >
                    <option value="Main Showroom">Main Showroom (Display Floor)</option>
                    <option value="Godown 1">Godown 1 (Bulk Storage - Vaikom)</option>
                    <option value="Godown 2">Godown 2 (Knockdown Carton Storage)</option>
                    <option value="Godown 4 - Modular">Godown 4 - Modular Storage</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#334155' }}>
                    To Destination Godown *
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={trfToGodown}
                    onChange={e => setTrfToGodown(e.target.value)}
                  >
                    <option value="Main Showroom">Main Showroom (Display Floor)</option>
                    <option value="Godown 1">Godown 1 (Bulk Storage - Vaikom)</option>
                    <option value="Godown 2">Godown 2 (Knockdown Carton Storage)</option>
                    <option value="Godown 4 - Modular">Godown 4 - Modular Storage</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#334155' }}>
                    Source Rack
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '28px' }}
                    value={trfFromRack}
                    onChange={e => setTrfFromRack(e.target.value)}
                    placeholder="Rack A"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#334155' }}>
                    Dest. Rack
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '28px' }}
                    value={trfToRack}
                    onChange={e => setTrfToRack(e.target.value)}
                    placeholder="Display Floor"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#dc2626' }}>
                    Transfer Qty *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    className="rd-pos-input"
                    style={{ width: '100%', height: '28px', textAlign: 'right', fontWeight: '900', fontSize: '14px', border: '2px solid #0284c7' }}
                    value={trfQty}
                    onChange={e => setTrfQty(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#334155' }}>
                  Transfer Remarks / Purpose :
                </label>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ width: '100%', height: '28px' }}
                  value={trfRemarks}
                  onChange={e => setTrfRemarks(e.target.value)}
                  placeholder="e.g. Replenish showroom display floor"
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569' }}>
                ℹ️ <strong>Rule 10 Warehouse Accounting:</strong> Moving stock between godowns transfers location balance in PostgreSQL without altering company total stock.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingTransfer ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingTransfer ? 'Transferring on Railway...' : '⇄ Execute Godown Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7b. FOUR-BUCKET STOCK TRANSFER MODAL */}
      {showBucketModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                backgroundColor: '#0d9488',
                color: '#fff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📦</span>
                <span>Four-Bucket Stock Transfer Engine</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBucketModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBucketTransferSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f766e', textTransform: 'uppercase' }}>Selected Product</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#134e4a' }}>{bucketProduct?.name || 'Furniture Item'}</div>
                <div style={{ fontSize: '12px', color: '#0f766e', marginTop: '2px' }}>
                  SKU: {bucketProduct?.pCode || 'N/A'} | Barcode: {bucketProduct?.barcode || 'N/A'} | Physical: {bucketProduct?.physical_stock ?? bucketProduct?.openingStock ?? 0} units
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Origin Bucket (From):
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={fromBucket}
                    onChange={e => setFromBucket(e.target.value)}
                  >
                    <option value="godown_available_qty">Godown Available (Main)</option>
                    <option value="showroom_display_qty">Showroom Display Floor</option>
                    <option value="reserved_booked_qty">Reserved / Booked</option>
                    <option value="damaged_quarantine_qty">Damaged / Quarantine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Destination Bucket (To):
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={toBucket}
                    onChange={e => setToBucket(e.target.value)}
                  >
                    <option value="showroom_display_qty">Showroom Display Floor</option>
                    <option value="godown_available_qty">Godown Available (Main)</option>
                    <option value="reserved_booked_qty">Reserved / Booked</option>
                    <option value="damaged_quarantine_qty">Damaged / Quarantine</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Units to Move:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={bucketQty}
                    onChange={e => setBucketQty(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Operational Reason:
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={bucketReason}
                    onChange={e => setBucketReason(e.target.value)}
                  >
                    <option value="FLOOR_DISPLAY_SETUP">Showroom Floor Display Setup</option>
                    <option value="GODOWN_RETURN">Return Display Item to Godown</option>
                    <option value="QUARANTINE_MISSING_BOX">Quarantine - Missing Knockdown Packet</option>
                    <option value="QUARANTINE_DEFECT">Quarantine - Transit Damage / Scratch</option>
                    <option value="REPAIR_RELEASE">Release to Available After Carpentry Repair</option>
                    <option value="MANUAL_REBALANCE">General Stock Bucket Rebalance</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Log Remarks / Notes:
                </label>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ width: '100%', height: '32px' }}
                  value={bucketNotes}
                  onChange={e => setBucketNotes(e.target.value)}
                  placeholder="e.g. Moved 1 unit to main entrance display podium"
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569' }}>
                🛡️ <strong>Four-Bucket Invariant:</strong> Stock buckets allow independent accounting for showroom demos and quarantined knockdown boxes while maintaining total warehouse asset integrity.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowBucketModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBucket}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#0d9488',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingBucket ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingBucket ? 'Updating Buckets...' : '📦 Commit Bucket Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7b. STATUTORY SECTION 17(5)(h) DAMAGED STOCK WRITE-OFF MODAL */}
      {showQuarantineWriteOffModal && writeOffProduct && (() => {
        const qtyNum = parseFloat(writeOffQty) || 0;
        const unitCost = Number(writeOffProduct.purchasePrice || (writeOffProduct.retailPrice * 0.7) || 0);
        const totalAssetVal = qtyNum * unitCost;
        const itcVal = totalAssetVal * 0.18;
        const cgstItc = itcVal / 2;
        const sgstItc = itcVal / 2;
        const totalLoss = totalAssetVal + itcVal;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '560px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  backgroundColor: '#b91c1c',
                  color: '#fff',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                    🗑️ Statutory Scrap Write-Off (CGST Sec 17(5)(h))
                  </h3>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>
                    Damaged Goods Asset Deduction with Mandatory Input Tax Credit Reversal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuarantineWriteOffModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleQuarantineWriteOffSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '13px' }}>
                    {writeOffProduct.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7f1d1d', marginTop: '4px' }}>
                    <span>SKU: {writeOffProduct.pCode}</span>
                    <span>Quarantine Stock: {writeOffProduct.damaged_quarantine_qty || 0}</span>
                    <span>Cost Basis: ₹{unitCost.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Source Bucket:
                    </label>
                    <select
                      className="rd-pos-input"
                      style={{ width: '100%', height: '32px' }}
                      value={writeOffSourceBucket}
                      onChange={e => setWriteOffSourceBucket(e.target.value)}
                    >
                      <option value="damaged_quarantine_qty">Damaged / Quarantine Bucket</option>
                      <option value="godown_available_qty">Godown Main Warehouse</option>
                      <option value="showroom_display_qty">Showroom Floor Display</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Units to Scrap & Write Off:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="rd-pos-input"
                      style={{ width: '100%', height: '32px' }}
                      value={writeOffQty}
                      onChange={e => setWriteOffQty(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Damage / Audit Write-off Justification:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={writeOffReason}
                    onChange={e => setWriteOffReason(e.target.value)}
                    placeholder="e.g. Transit frame split / shattered mirror beyond repair"
                    required
                  />
                </div>

                {/* STATUTORY ACCOUNTING & TAX PREVIEW CARD */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⚖️ Statutory Double-Entry General Ledger Impact:</span>
                    <span style={{ color: '#b91c1c' }}>CGST Sec 17(5)(h)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>Asset Cost Deduction</span>
                      <strong style={{ color: '#0f172a' }}>₹{totalAssetVal.toFixed(2)}</strong>
                    </div>
                    <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                      <span style={{ display: 'block', color: '#b91c1c', fontSize: '10px' }}>ITC Reversal (18%)</span>
                      <strong style={{ color: '#dc2626' }}>₹{itcVal.toFixed(2)}</strong>
                      <span style={{ display: 'block', fontSize: '9px', color: '#64748b' }}>CGST {cgstItc.toFixed(2)} + SGST {sgstItc.toFixed(2)}</span>
                    </div>
                    <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>Total P&L Loss Debit</span>
                      <strong style={{ color: '#7f1d1d' }}>₹{totalLoss.toFixed(2)}</strong>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: '#475569', fontSize: '10px', lineHeight: 1.4 }}>
                    Notice: Pursuant to Section 17(5)(h) of the CGST Act 2017, input tax credit previously availed on goods lost, destroyed, or written off is mandatorily reversed to the government.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuarantineWriteOffModal(false)}
                    style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWriteOff}
                    style={{
                      padding: '6px 18px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#b91c1c',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: isSubmittingWriteOff ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingWriteOff ? 'Processing Write-off...' : '🗑️ Post Statutory Scrap Write-Off'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 7c. STANDALONE GOODS RECEIPT NOTE (GRN) INWARD MODAL */}
      {showGrnModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '680px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                backgroundColor: '#4338ca',
                color: '#fff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <span>Inward Goods Receipt Note (GRN) & Multi-Packet Check</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGrnModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrnSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    GRN Number:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnNo}
                    onChange={e => setGrnNo(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Supplier / Factory:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnSupplier}
                    onChange={e => setGrnSupplier(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Supplier Invoice No:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnInvoiceNo}
                    onChange={e => setGrnInvoiceNo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Product Receiving:
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnProdId}
                    onChange={e => {
                      setGrnProdId(e.target.value);
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p) {
                        setGrnUnitCost(String(p.purchasePrice || 14500));
                        setGrnPacketsPerUnit(String(p.total_boxes || p.totalBoxesCount || (p.isKnockdown ? 4 : 1)));
                      }
                    }}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pCode}) - ₹{p.purchasePrice?.toLocaleString('en-IN') || 0}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Freight & Hamali (₹):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnFreight}
                    onChange={e => setGrnFreight(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Units Inward:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnUnits}
                    onChange={e => setGrnUnits(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Unit Cost Excl. Tax (₹):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnUnitCost}
                    onChange={e => setGrnUnitCost(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                    Packets Per Unit:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px' }}
                    value={grnPacketsPerUnit}
                    onChange={e => setGrnPacketsPerUnit(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '2px' }}>
                    Missing Packets:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '30px', borderColor: '#fca5a5' }}
                    value={grnMissingPackets}
                    onChange={e => setGrnMissingPackets(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Target Stock Location:
                </label>
                <select
                  className="rd-pos-input"
                  style={{ width: '100%', height: '30px' }}
                  value={grnTargetBucket}
                  onChange={e => setGrnTargetBucket(e.target.value)}
                >
                  <option value="godown_available_qty">Godown Available Stock</option>
                  <option value="showroom_display_qty">Showroom Display Floor</option>
                </select>
              </div>

              {/* Dynamic Knockdown & Landed Cost Computation */}
              {(() => {
                const u = parseFloat(grnUnits) || 0;
                const c = parseFloat(grnUnitCost) || 0;
                const f = parseFloat(grnFreight) || 0;
                const ppu = parseInt(grnPacketsPerUnit, 10) || 1;
                const miss = parseInt(grnMissingPackets, 10) || 0;
                const expectedPkts = u * ppu;
                const receivedPkts = Math.max(0, expectedPkts - miss);
                const completeUnits = ppu > 1 ? Math.floor(receivedPkts / ppu) : u;
                const brokenUnits = u - completeUnits;
                const landedPerUnit = u > 0 ? c + (f / u) : c;

                return (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '10px 12px', borderRadius: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 'bold' }}>PACKETS EXPECTED</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#1e1b4b' }}>{expectedPkts}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}>COMPLETE UNITS</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#14532d' }}>{completeUnits}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold' }}>QUARANTINED UNITS</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: brokenUnits > 0 ? '#991b1b' : '#64748b' }}>{brokenUnits}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#4338ca', fontWeight: 'bold' }}>LANDED COST / UNIT</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#312e81' }}>₹{landedPerUnit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>

                    {miss > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#991b1b', background: '#fee2e2', padding: '6px 8px', borderRadius: '4px' }}>
                        ⚠️ <strong>KD Missing Box Rule:</strong> {miss} carton(s) missing out of {expectedPkts}. {brokenUnits} unit(s) cannot be sold and will automatically be placed in <em>damaged_quarantine_qty</em> until supplier replacement arrives.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569' }}>
                ⚖️ <strong>Double-Entry Ledger Auto-Post:</strong> Submitting this GRN automatically posts a balanced journal in PostgreSQL: <code>Debit Inventory Asset</code> & <code>Credit Accounts Payable / Bank</code>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowGrnModal(false)}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrn}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#4338ca',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: isSubmittingGrn ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingGrn ? 'Posting Inward GRN...' : '📋 Inward GRN & Post Journal'}
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

      {/* 10. RETSOL R220 & BRONTIX HARDWARE STUDIO */}
      <BarcodeHardwareHubModal
        isOpen={showHardwareHub}
        onClose={() => setShowHardwareHub(false)}
        product={hardwareProduct || selectedProd || products[0] || null}
      />
    </div>
  );
}
