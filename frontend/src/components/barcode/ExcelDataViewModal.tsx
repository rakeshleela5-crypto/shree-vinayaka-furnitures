import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import type { ExcelLabelRow, LabelTemplate } from './types';
import type { Product } from '../../types/retailDaddy';

interface ExcelDataViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LabelTemplate;
  products: Product[];
  excelRows: ExcelLabelRow[];
  setExcelRows: React.Dispatch<React.SetStateAction<ExcelLabelRow[]>>;
  onPreviewRow: (row: ExcelLabelRow) => void;
  onPrintBatch: (rows: ExcelLabelRow[]) => void;
  showToast: (msg: string) => void;
}

export function ExcelDataViewModal({
  isOpen,
  onClose,
  template,
  products,
  excelRows,
  setExcelRows,
  onPreviewRow,
  onPrintBatch,
  showToast
}: ExcelDataViewModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'EXCEL_TABLE' | 'INVENTORY_IMPORT'>('EXCEL_TABLE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  // Categories for inventory import
  const categories = Array.from(new Set(products.map(p => p.category || 'Uncategorized')));

  // Export template-matched Excel file
  const handleExportTemplateExcel = () => {
    try {
      const sampleData = (excelRows.length > 0 ? excelRows : products.slice(0, 10).map((p, idx) => ({
        id: `row-${idx}`,
        barcode: p.barcode || `65000${idx + 1}`,
        productName: p.name,
        skuCode: p.pCode || `SVF-SKU-${idx + 1}`,
        category: p.category || 'Living Furniture',
        mrp: p.mrp || 25000,
        salePrice: p.retailPrice || 19999,
        discount: '20% OFF',
        dimensions: p.size || '78"L x 36"W x 34"H',
        material: p.colour || 'Solid Teakwood',
        finish: 'Walnut Matte',
        warranty: '10 Years',
        batchDate: 'OCT 2026',
        copies: 2
      }))).map(r => ({
        'Barcode': r.barcode,
        'Product Name': r.productName,
        'SKU Code': r.skuCode,
        'Category': r.category,
        'MRP': r.mrp,
        'Sale Price': r.salePrice,
        'Discount': r.discount,
        'Dimensions': r.dimensions,
        'Material': r.material,
        'Finish': r.finish,
        'Warranty': r.warranty,
        'Batch Date': r.batchDate,
        'Copies': r.copies || 1
      }));

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Label Batch Data');

      const fileName = `SVF_Label_Template_${template.widthMm}x${template.heightMm}mm.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`✓ Downloaded "${fileName}" with template matching columns!`);
    } catch (err: any) {
      showToast(`Export error: ${err.message}`);
    }
  };

  // Import populated Excel / CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast('⚠️ Uploaded Excel file is empty.');
          return;
        }

        const parsedRows: ExcelLabelRow[] = data.map((item, idx) => ({
          id: `imp-${Date.now()}-${idx}`,
          barcode: String(item['Barcode'] || item['barcode'] || item['Code'] || `SVF-${idx + 1}`),
          productName: String(item['Product Name'] || item['Name'] || item['productName'] || 'Furniture Item'),
          skuCode: String(item['SKU Code'] || item['SKU'] || item['pCode'] || `SKU-${idx + 1}`),
          category: String(item['Category'] || item['category'] || 'Showroom'),
          mrp: parseFloat(item['MRP'] || item['mrp'] || 0) || 0,
          salePrice: parseFloat(item['Sale Price'] || item['Retail Price'] || item['Price'] || 0) || 0,
          discount: String(item['Discount'] || item['discount'] || 'Special Offer'),
          dimensions: String(item['Dimensions'] || item['Size'] || item['dimensions'] || ''),
          material: String(item['Material'] || item['Wood'] || item['material'] || 'Teakwood'),
          finish: String(item['Finish'] || item['finish'] || 'Matt'),
          warranty: String(item['Warranty'] || item['warranty'] || '5 Yrs'),
          batchDate: String(item['Batch Date'] || item['batchDate'] || 'OCT 2026'),
          copies: parseInt(String(item['Copies'] || item['Qty'] || 1), 10) || 1
        }));

        setExcelRows(parsedRows);
        showToast(`✓ Successfully imported ${parsedRows.length} rows from Excel!`);
        e.target.value = ''; // Reset input
      } catch (err: any) {
        showToast(`Failed to parse Excel file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Add all inventory products from a category
  const handleImportCategoryToExcel = (category: string) => {
    const matched = category === 'ALL'
      ? products
      : products.filter(p => p.category === category);

    const newRows: ExcelLabelRow[] = matched.map((p, idx) => ({
      id: `inv-${p.id}-${Date.now()}-${idx}`,
      barcode: p.barcode || `BAR-${p.pCode}`,
      productName: p.name,
      skuCode: p.pCode,
      category: p.category || 'General',
      mrp: p.mrp || 0,
      salePrice: p.retailPrice || 0,
      discount: p.discount ? `${p.discount}% OFF` : 'Special Offer',
      dimensions: p.size || 'Standard',
      material: p.colour || 'Seasoned Teak',
      finish: 'Melamine Polish',
      warranty: '10 Years',
      batchDate: 'OCT 2026',
      copies: 1
    }));

    setExcelRows(prev => [...prev, ...newRows]);
    setActiveTab('EXCEL_TABLE');
    showToast(`✓ Added ${newRows.length} products to Excel Data View!`);
  };

  // Update a specific cell
  const handleCellChange = (id: string, field: keyof ExcelLabelRow, value: any) => {
    setExcelRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setExcelRows(prev => prev.filter(r => r.id !== id));
  };

  // Add blank row
  const handleAddBlankRow = () => {
    const newRow: ExcelLabelRow = {
      id: `manual-${Date.now()}`,
      barcode: `100${excelRows.length + 101}`,
      productName: 'New Teakwood Product',
      skuCode: `SVF-CUST-${excelRows.length + 1}`,
      category: 'Showroom Furniture',
      mrp: 35000,
      salePrice: 28000,
      discount: '20% OFF',
      dimensions: '78"L x 36"W x 34"H',
      material: 'Pure Teak',
      finish: 'Walnut Gloss',
      warranty: '10 Years',
      batchDate: 'OCT 2026',
      copies: 1
    };
    setExcelRows(prev => [...prev, newRow]);
  };

  // Filtered rows for display
  const filteredRows = excelRows.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.productName.toLowerCase().includes(q) ||
      r.barcode.toLowerCase().includes(q) ||
      r.skuCode.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const totalCopiesCount = excelRows.reduce((sum, r) => sum + (r.copies || 1), 0);

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="rd-modal-content"
        style={{
          width: '95vw',
          maxWidth: '1200px',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ background: '#0f172a', padding: '12px 20px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span>
              <span>EXCEL DATA VIEW & BATCH INVENTORY MANAGER</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Linked Template: <strong style={{ color: '#38bdf8' }}>{template.name} ({template.widthMm} × {template.heightMm}mm)</strong> • Total Stickers to Print: <strong style={{ color: '#4ade80' }}>{totalCopiesCount}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '0 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Toolbar Strip */}
        <div style={{ background: '#f8fafc', padding: '10px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('EXCEL_TABLE')}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: '800',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: activeTab === 'EXCEL_TABLE' ? '#0284c7' : '#cbd5e1',
                background: activeTab === 'EXCEL_TABLE' ? '#0284c7' : '#ffffff',
                color: activeTab === 'EXCEL_TABLE' ? '#ffffff' : '#334155',
                cursor: 'pointer'
              }}
            >
              📋 Spreadsheet Table ({excelRows.length} Rows)
            </button>
            <button
              onClick={() => setActiveTab('INVENTORY_IMPORT')}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: '800',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: activeTab === 'INVENTORY_IMPORT' ? '#059669' : '#cbd5e1',
                background: activeTab === 'INVENTORY_IMPORT' ? '#059669' : '#ffffff',
                color: activeTab === 'INVENTORY_IMPORT' ? '#ffffff' : '#334155',
                cursor: 'pointer'
              }}
            >
              📦 Import from Store Inventory ({products.length} SKUs)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleExportTemplateExcel}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Download Excel spreadsheet pre-configured with template columns"
            >
              📥 Export Template (.xlsx)
            </button>

            <label
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📤 Import Excel / CSV
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={handleAddBlankRow}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Add Row
            </button>

            <button
              onClick={() => setExcelRows([])}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #f87171',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Tab 1: Spreadsheet Table */}
        {activeTab === 'EXCEL_TABLE' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="🔍 Search rows by Name, Barcode, SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '320px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Quick Copies:</span>
                {[1, 2, 5, 10].map(c => (
                  <button
                    key={c}
                    onClick={() => setExcelRows(prev => prev.map(r => ({ ...r, copies: c })))}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Set all to {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ borderBottom: '1.5px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', width: '35px' }}>#</th>
                    <th style={{ padding: '8px 10px', width: '60px' }}>Copies</th>
                    <th style={{ padding: '8px 10px', minWidth: '110px' }}>Barcode</th>
                    <th style={{ padding: '8px 10px', minWidth: '180px' }}>Product Name</th>
                    <th style={{ padding: '8px 10px', minWidth: '90px' }}>SKU Code</th>
                    <th style={{ padding: '8px 10px', minWidth: '100px' }}>Category</th>
                    <th style={{ padding: '8px 10px', minWidth: '85px', textAlign: 'right' }}>MRP (₹)</th>
                    <th style={{ padding: '8px 10px', minWidth: '85px', textAlign: 'right' }}>Sale Price (₹)</th>
                    <th style={{ padding: '8px 10px', minWidth: '80px' }}>Discount</th>
                    <th style={{ padding: '8px 10px', minWidth: '120px' }}>Dimensions</th>
                    <th style={{ padding: '8px 10px', minWidth: '100px' }}>Material</th>
                    <th style={{ padding: '8px 10px', minWidth: '70px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No rows available. Click <strong>"➕ Add Row"</strong>, <strong>"📥 Export Template"</strong> or import from Store Inventory!
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd'
                        }}
                      >
                        <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={row.copies || 1}
                            onChange={e => handleCellChange(row.id, 'copies', parseInt(e.target.value, 10) || 1)}
                            style={{
                              width: '50px',
                              padding: '3px 4px',
                              textAlign: 'center',
                              fontWeight: '900',
                              border: '1px solid #0284c7',
                              borderRadius: '3px',
                              color: '#0284c7'
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={e => handleCellChange(row.id, 'barcode', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontFamily: 'monospace' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.productName}
                            onChange={e => handleCellChange(row.id, 'productName', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.skuCode}
                            onChange={e => handleCellChange(row.id, 'skuCode', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', fontFamily: 'monospace' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.category}
                            onChange={e => handleCellChange(row.id, 'category', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            value={row.mrp}
                            onChange={e => handleCellChange(row.id, 'mrp', parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '3px 6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            value={row.salePrice}
                            onChange={e => handleCellChange(row.id, 'salePrice', parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '3px 6px', textAlign: 'right', border: '1.5px solid #10b981', borderRadius: '3px', fontWeight: 'bold', color: '#047857' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.discount}
                            onChange={e => handleCellChange(row.id, 'discount', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', color: '#dc2626' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.dimensions}
                            onChange={e => handleCellChange(row.id, 'dimensions', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            value={row.material}
                            onChange={e => handleCellChange(row.id, 'material', e.target.value)}
                            style={{ width: '100%', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => {
                              onPreviewRow(row);
                              onClose();
                            }}
                            title="Preview in Canvas Studio"
                            style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '3px', padding: '3px 6px', cursor: 'pointer', marginRight: '4px' }}
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            title="Delete Row"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '3px', padding: '3px 6px', cursor: 'pointer' }}
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
          </div>
        )}

        {/* Tab 2: Store Inventory Import */}
        {activeTab === 'INVENTORY_IMPORT' && (
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Filter Category:</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
              >
                <option value="ALL">All Categories ({products.length} Products)</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c} ({products.filter(p => p.category === c).length})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleImportCategoryToExcel(selectedCategory)}
                style={{
                  padding: '6px 14px',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ➕ Import All in "{selectedCategory}" to Table
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {products
                .filter(p => selectedCategory === 'ALL' || p.category === selectedCategory)
                .map(prod => (
                  <div
                    key={prod.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{prod.name}</div>
                      <div style={{ fontSize: '10px', color: '#0284c7', fontFamily: 'monospace' }}>SKU: {prod.pCode} • Barcode: {prod.barcode}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Category: {prod.category}</div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                        ₹{prod.retailPrice?.toLocaleString('en-IN')} <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '9px' }}>₹{prod.mrp?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newRow: ExcelLabelRow = {
                          id: `inv-${prod.id}-${Date.now()}`,
                          barcode: prod.barcode || `BAR-${prod.pCode}`,
                          productName: prod.name,
                          skuCode: prod.pCode,
                          category: prod.category || 'General',
                          mrp: prod.mrp || 0,
                          salePrice: prod.retailPrice || 0,
                          discount: prod.discount ? `${prod.discount}% OFF` : 'Special Offer',
                          dimensions: prod.size || 'Standard',
                          material: prod.colour || 'Solid Teak',
                          finish: 'Melamine Polish',
                          warranty: '10 Years',
                          batchDate: 'OCT 2026',
                          copies: 1
                        };
                        setExcelRows(prev => [...prev, newRow]);
                        showToast(`✓ Added "${prod.name}" to Excel Data View!`);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Add to Label Batch
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ background: '#f8fafc', padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#334155' }}>
            Ready to print <strong style={{ color: '#047857' }}>{totalCopiesCount} labels</strong> across {excelRows.length} items.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Done / Return to Canvas
            </button>
            <button
              onClick={() => {
                onPrintBatch(excelRows);
              }}
              disabled={excelRows.length === 0}
              style={{
                padding: '8px 24px',
                fontSize: '12px',
                fontWeight: '900',
                background: excelRows.length === 0 ? '#94a3b8' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: excelRows.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ Batch Print ({totalCopiesCount} Labels)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
