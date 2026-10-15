import { useState, useRef } from 'react';
import type { Product, Category, SubCategory, ColumnVisibilityConfig } from '../../types/retailDaddy';

interface ProductAddSmartViewProps {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  columnConfig: ColumnVisibilityConfig;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onAddCategory: (cat: Category) => void;
  onAddSubCategory: (sub: SubCategory) => void;
  onUpdateColumnConfig: (cfg: ColumnVisibilityConfig) => void;
  onPrintBarcode: (product: Product, copies: number) => void;
}

export function ProductAddSmartView({
  products,
  categories,
  subCategories,
  columnConfig,
  onAddProduct,
  onAddCategory,
  onAddSubCategory,
  onUpdateColumnConfig,
  onPrintBarcode
}: ProductAddSmartViewProps) {
  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [topRecords, setTopRecords] = useState<number>(50);
  const [barcodeCopies, setBarcodeCopies] = useState<number>(1);
  const [selectAll, setSelectAll] = useState(false);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Record Form Row State
  const [newRow, setNewRow] = useState<Partial<Product>>({
    name: '',
    purchasePrice: 0,
    cessPercent: 0,
    openingStock: 0,
    barcode: '',
    mrp: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    batch: '',
    godown: 'Block 1',
    rack: 'Rack 1',
    category: 'GENERAL'
  });

  // Active cell index in new row for Enter-key navigation:
  // 0: Name, 1: Purchase Price, 2: Opening Stock, 3: Barcode, 4: MRP, 5: Retail Price, 6: Wholesale, 7: Batch, 8: Rack
  const [activeCellIndex, setActiveCellIndex] = useState<number>(0);

  // Refs for fast keyboard focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const purchaseInputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const mrpInputRef = useRef<HTMLInputElement>(null);
  const retailInputRef = useRef<HTMLInputElement>(null);
  const wholesaleInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate next barcode
  const getNextBarcode = () => {
    const numericCodes = products
      .map(p => parseInt(p.barcode, 10))
      .filter(n => !isNaN(n) && n < 100000);
    const maxNum = numericCodes.length > 0 ? Math.max(...numericCodes) : 3747;
    return String(maxNum + 1);
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
        setActiveCellIndex(2);
        stockInputRef.current?.focus();
      } else if (field === 'openingStock') {
        setActiveCellIndex(3);
        barcodeInputRef.current?.focus();
      } else if (field === 'barcode') {
        setActiveCellIndex(4);
        mrpInputRef.current?.focus();
      } else if (field === 'mrp') {
        setActiveCellIndex(5);
        retailInputRef.current?.focus();
      } else if (field === 'retailPrice') {
        if (columnConfig.wSalePrice) {
          setActiveCellIndex(6);
          wholesaleInputRef.current?.focus();
        } else {
          saveNewRecord();
        }
      } else if (field === 'wholesalePrice') {
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
      openingStock: Number(newRow.openingStock) || 0,
      barcode: newRow.barcode?.trim() || getNextBarcode(),
      mrp: Number(newRow.mrp) || Number(newRow.retailPrice) || 0,
      retailPrice: Number(newRow.retailPrice) || 0,
      wholesalePrice: Number(newRow.wholesalePrice) || Number(newRow.retailPrice) || 0,
      batch: newRow.batch || '',
      godown: newRow.godown || 'Block 1',
      rack: newRow.rack || 'Rack 1',
      category: newRow.category || 'GENERAL',
      subCategory: newRow.subCategory || 'OTHERS',
      hsn: '9403',
      cgst: 9,
      sgst: 9,
      igst: 18,
      sTax: 'Inclusive',
      pTax: 'Inclusive'
    };

    onAddProduct(createdProduct);
    showToast(`✅ Successfully Saved: ${createdProduct.name} [Barcode: ${createdProduct.barcode}]`);

    // Reset new row
    setNewRow({
      name: '',
      purchasePrice: 0,
      cessPercent: 0,
      openingStock: 0,
      barcode: '',
      mrp: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      batch: '',
      godown: 'Block 1',
      rack: 'Rack 1',
      category: 'GENERAL'
    });
    setActiveCellIndex(0);
    nameInputRef.current?.focus();
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.pCode.toLowerCase().includes(searchTerm.toLowerCase());
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
      'Opening Stock',
      'Barcode',
      'MRP',
      'Retail Price',
      'Wholesale Price',
      'Godown',
      'Rack'
    ];
    const rows = filteredProducts.map(p => [
      p.pCode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.purchasePrice.toFixed(2),
      p.cessPercent.toFixed(2),
      p.openingStock.toFixed(3),
      p.barcode,
      p.mrp.toFixed(2),
      p.retailPrice.toFixed(2),
      (p.wholesalePrice || 0).toFixed(2),
      p.godown || '',
      p.rack || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetailDaddy_Products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Product Catalog Exported to Excel/CSV');
  };

  // State for Add Category Modal
  const [newCategoryName, setNewCategoryName] = useState('');
  // State for Add SubCategory Modal
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('GENERAL');

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
          <button className="rd-btn-header bulk-edit" onClick={() => showToast('Product Bulk Editor is Active')}>
            <span>📝</span> PRODUCT BULK EDIT
          </button>
          <button className="rd-btn-header export" onClick={handleExportExcel}>
            <span>📊</span> EXPORT
          </button>
          <button className="rd-btn-header reset" onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); showToast('Filters Reset'); }}>
            <span>🔄</span> RESET
          </button>
          <button className="rd-btn-header settings" onClick={() => setShowSettingsModal(true)}>
            <span>⚙️</span> SETTINGS
          </button>
          <button className="rd-btn-header set-default" onClick={() => showToast('Default Column Settings Stored')}>
            <span>💾</span> SET DEFAULT
          </button>
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
            placeholder="Search by Name, Barcode, P-Code..."
            style={{ width: '220px' }}
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
          <button className="rd-btn-action bulk-img" onClick={() => showToast('Bulk Image Update Tool Ready')}>
            <span>🖼️</span> BULK IMAGE UPDATE
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
              <th className="th-green" style={{ width: '90px' }}>Opening Stock</th>
              <th className="th-red" style={{ width: '110px' }}>Barcode</th>
              <th className="th-green" style={{ width: '80px' }}>MRP</th>
              <th className="th-green" style={{ width: '95px' }}>Retail Sale Price</th>
              {columnConfig.wSalePrice && (
                <th className="th-green" style={{ width: '110px' }}>Wholesale Sale Price</th>
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
              <th className="th-green" style={{ width: '60px', textAlign: 'center' }}>Insert</th>
              <th className="th-green" style={{ width: '70px', textAlign: 'center' }}>Print</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'center' }}>Variant</th>
            </tr>
          </thead>
          <tbody>
            {/* EXISTING ROWS */}
            {filteredProducts.map(prod => (
              <tr key={prod.id}>
                <td>
                  <span className="rd-badge-pcode">{prod.pCode}</span>
                </td>
                <td style={{ fontWeight: '600' }}>{prod.name}</td>
                <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 'bold' }}>
                  {prod.purchasePrice.toFixed(2)}
                </td>
                <td style={{ textAlign: 'right' }}>{prod.cessPercent.toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {prod.openingStock.toFixed(3)}
                </td>
                <td style={{ fontWeight: 'bold', letterSpacing: '0.04em' }}>
                  {prod.barcode}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{prod.mrp.toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                  {prod.retailPrice.toFixed(2)}
                </td>
                {columnConfig.wSalePrice && (
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8' }}>
                    {(prod.wholesalePrice || prod.retailPrice).toFixed(2)}
                  </td>
                )}
                {columnConfig.batch && <td>{prod.batch || '-'}</td>}
                {columnConfig.godown && <td>{prod.godown || '-'}</td>}
                {columnConfig.rack && <td>{prod.rack || '-'}</td>}
                <td style={{ textAlign: 'center' }}>
                  <button className="rd-grid-btn" onClick={() => showToast(`Inserted ${prod.name}`)}>
                    Insert
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="rd-grid-btn"
                    style={{ background: '#e0f2fe', color: '#0369a1' }}
                    onClick={() => onPrintBarcode(prod, barcodeCopies)}
                  >
                    Barcode
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="rd-grid-btn" onClick={() => showToast(`Variant manager for ${prod.name}`)}>
                    Variant
                  </button>
                </td>
              </tr>
            ))}

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
              <td style={{ textAlign: 'center' }}>
                <button
                  className="rd-grid-btn"
                  style={{ background: '#22c55e', color: '#ffffff', fontWeight: 'bold' }}
                  onClick={saveNewRecord}
                >
                  Save
                </button>
              </td>
              <td style={{ textAlign: 'center' }}>-</td>
              <td style={{ textAlign: 'center' }}>-</td>
            </tr>
          </tbody>
        </table>
      </div>

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

      {/* MODAL 2: SUB CATEGORY / BRAND (FROM FRAME 40) */}
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

      {/* MODAL 3: COLUMN SETTINGS (frmProductSettings FROM FRAME 55) */}
      {showSettingsModal && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '380px' }}>
            <div className="rd-dialog-titlebar">
              <span>frmProductColumnConfig</span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowSettingsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#1e3a8a' }}>
                Check columns to display on Product Add Smart grid:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                {[
                  { key: 'wSalePrice', label: 'WSalePrice' },
                  { key: 'batch', label: 'Batch' },
                  { key: 'mfgDate', label: 'MfgDate' },
                  { key: 'expDate', label: 'ExpDate' },
                  { key: 'size', label: 'Size' },
                  { key: 'colour', label: 'Colour' },
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
                  { key: 'conv', label: 'Conv' },
                  { key: 'minStock', label: 'MinStock' },
                  { key: 'status', label: 'Status' },
                  { key: 'sTax', label: 'STax' },
                  { key: 'pTax', label: 'PTax' },
                  { key: 'godown', label: 'GDown' },
                  { key: 'rack', label: 'Rack' }
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
    </div>
  );
}
