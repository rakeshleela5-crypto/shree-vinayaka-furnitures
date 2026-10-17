import React, { useState } from 'react';
import type { ProductRecordItem } from '../../types/retailDaddy';

interface ProductRecordModalProps {
  isOpen: boolean;
  products: ProductRecordItem[];
  onOpenBulkEditor?: () => void;
  onClose: () => void;
}

export const ProductRecordModal: React.FC<ProductRecordModalProps> = ({
  isOpen,
  products,
  onOpenBulkEditor,
  onClose
}) => {
  // 8 Search Filters matching Video 07 Frame 0385
  const [searchName, setSearchName] = useState('');
  const [searchSubCategory, setSearchSubCategory] = useState('');
  const [searchPartGroup, setSearchPartGroup] = useState('');
  const [searchGodown, setSearchGodown] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchStatus, setSearchStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchRack, setSearchRack] = useState('');

  // Top Records Limit badge
  const [recordsLimit, setRecordsLimit] = useState<number>(100);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchName = searchName ? p.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchSubCat = searchSubCategory ? p.subCategory.toLowerCase().includes(searchSubCategory.toLowerCase()) : true;
    const matchPart = searchPartGroup ? p.partNo.toLowerCase().includes(searchPartGroup.toLowerCase()) : true;
    const matchGodown = searchGodown ? p.godown.toLowerCase().includes(searchGodown.toLowerCase()) : true;
    const matchCat = searchCategory ? p.category.toLowerCase().includes(searchCategory.toLowerCase()) : true;
    const matchBarcode = searchBarcode ? p.barcode.includes(searchBarcode) : true;
    const matchStatus = searchStatus === 'All' ? true : searchStatus === 'Active' ? p.active : !p.active;
    const matchRack = searchRack ? p.rack.toLowerCase().includes(searchRack.toLowerCase()) : true;

    return matchName && matchSubCat && matchPart && matchGodown && matchCat && matchBarcode && matchStatus && matchRack;
  }).slice(0, recordsLimit);

  const handleReset = () => {
    setSearchName('');
    setSearchSubCategory('');
    setSearchPartGroup('');
    setSearchGodown('');
    setSearchCategory('');
    setSearchBarcode('');
    setSearchStatus('All');
    setSearchRack('');
    setSelectedProductId(null);
  };

  const handleShowAll = () => {
    handleReset();
    setRecordsLimit(1000);
    showToast('✓ Showing all product records!');
  };

  const handleExportExcel = () => {
    const header = 'Product Code,Product Name,Category,Sub Category,HSN,Part No,Godown,Rack,Sale Tax Type,MRP,Retail Price,Wholesale Price,Stock\n';
    const rows = filteredProducts
      .map(
        p =>
          `"${p.code}","${p.name}","${p.category}","${p.subCategory}","${p.hsnCode}","${p.partNo}","${p.godown}","${p.rack}","${p.saleTaxType}",${p.mrp},${p.retailPrice},${p.wholesalePrice},${p.currentStock}`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `product_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredProducts.length} products to Excel!`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Window Frame (Video 07 Frames 0385, 0400) */}
      <div
        style={{
          width: '98%',
          maxWidth: '1250px',
          height: '92vh',
          maxHeight: '700px',
          backgroundColor: '#f8fafc',
          border: '2px solid #0284c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner (Frame 0385: Top 100 Records badge + Blue banner) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7',
            userSelect: 'none'
          }}
        >
          {/* Top Records Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 8px', fontSize: '11px', fontWeight: '900', borderRadius: '3px' }}>
              Top
            </span>
            <select
              value={recordsLimit}
              onChange={e => setRecordsLimit(parseInt(e.target.value))}
              style={{
                backgroundColor: '#ffffff',
                color: '#1e3a8a',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: '900',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
            <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 8px', fontSize: '11px', fontWeight: '900', borderRadius: '3px' }}>
              Records
            </span>
          </div>

          {/* Banner Title */}
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            List of Products
          </div>

          {/* Window Controls */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e11d48',
              border: '1px solid #ffffff',
              color: '#ffffff',
              width: '26px',
              height: '22px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* 8 Search Filter Boxes (Video 07 Frame 0385) */}
        <div style={{ background: '#ffffff', padding: '8px 12px', borderBottom: '1px solid #cbd5e1' }}>
          {/* Row 1: Product Name, Sub Category, Part/Group, Godown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Product Name :
              </label>
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="e.g. 7UP, Aachi..."
                style={{ width: '100%', height: '25px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Sub Category / Brand :
              </label>
              <input
                type="text"
                value={searchSubCategory}
                onChange={e => setSearchSubCategory(e.target.value)}
                placeholder="e.g. SLIMLINE, RECLINERS, TEAK..."
                style={{ width: '100%', height: '25px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>
                Search By Part /Group : (1234, 555)
              </label>
              <input
                type="text"
                value={searchPartGroup}
                onChange={e => setSearchPartGroup(e.target.value)}
                placeholder="e.g. 1234, 555..."
                style={{ width: '100%', height: '25px', border: '1px solid #3b82f6', borderRadius: '2px', padding: '0 6px', fontSize: '11px', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#15803d', marginBottom: '2px' }}>
                Search By Godown : (A1, B1, C)
              </label>
              <input
                type="text"
                value={searchGodown}
                onChange={e => setSearchGodown(e.target.value)}
                placeholder="e.g. A1, B1, C..."
                style={{ width: '100%', height: '25px', border: '1px solid #22c55e', borderRadius: '2px', padding: '0 6px', fontSize: '11px', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Row 2: Category, Barcode, Status, Rack + Right Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Category :
              </label>
              <input
                type="text"
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                placeholder="e.g. STEEL ALMIRAHS, LIVING ROOM..."
                style={{ width: '100%', height: '25px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Barcode :
              </label>
              <input
                type="text"
                value={searchBarcode}
                onChange={e => setSearchBarcode(e.target.value)}
                placeholder="e.g. 650002..."
                style={{ width: '100%', height: '25px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Search By Status :
              </label>
              <select
                value={searchStatus}
                onChange={e => setSearchStatus(e.target.value as any)}
                style={{ width: '100%', height: '25px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 4px', fontSize: '11px' }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#ea580c', marginBottom: '2px' }}>
                Search By Rack : (B, C, A1)
              </label>
              <input
                type="text"
                value={searchRack}
                onChange={e => setSearchRack(e.target.value)}
                placeholder="e.g. B, C, A1..."
                style={{ width: '100%', height: '25px', border: '1px solid #f97316', borderRadius: '2px', padding: '0 6px', fontSize: '11px', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>

            {/* Right Buttons: Reset, Export Excel, Show All, Bulk Editor */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  height: '26px',
                  padding: '0 10px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                style={{
                  height: '26px',
                  padding: '0 10px',
                  background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  border: '1px solid #15803d',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={handleShowAll}
                style={{
                  height: '26px',
                  padding: '0 10px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #0369a1',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Show All
              </button>
              {onOpenBulkEditor && (
                <button
                  type="button"
                  onClick={onOpenBulkEditor}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    backgroundColor: '#eab308',
                    color: '#854d0e',
                    border: '1px solid #ca8a04',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title="Open Product Bulk Editor"
                >
                  ⚡ Bulk Editor
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Master Grid Table (Frames 0385, 0400) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '30px', textAlign: 'center' }}>▷</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '75px' }}>Product Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '180px' }}>Product Name</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '90px' }}>Category</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', minWidth: '110px' }}>Sub Category / Brand</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '70px' }}>HSN Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '75px', textAlign: 'center', backgroundColor: '#1e3a8a' }}>Part / Group</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '65px', textAlign: 'center', backgroundColor: '#15803d' }}>Godown</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '65px', textAlign: 'center', backgroundColor: '#c2410c' }}>Rack</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '50px', textAlign: 'center' }}>Active</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '85px' }}>Sale Tax Type</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '85px' }}>Purchase Tax</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '60px', textAlign: 'right' }}>Def Qty</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '70px', textAlign: 'right' }}>Opening Stock</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '70px', textAlign: 'right' }}>Current Stock</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '65px', textAlign: 'right' }}>MRP</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '70px', textAlign: 'right' }}>Retail Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '80px', textAlign: 'right' }}>Wholesale Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '80px', textAlign: 'center' }}>Mfg Date</th>
                <th style={{ padding: '6px 8px', width: '80px', textAlign: 'center', backgroundColor: '#e0247d', color: '#ffffff' }}>Exp Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={20} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No products found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      style={{
                        backgroundColor: isSelected ? '#bae6fd' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        color: '#0f172a'
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#0284c7', fontWeight: 'bold' }}>
                        {isSelected ? '▶' : ''} {idx + 1}
                      </td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold', color: '#1e40af' }}>{p.code}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{p.category}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{p.subCategory}</td>
                      <td style={{ padding: '5px 8px', color: '#64748b' }}>{p.hsnCode}</td>
                      {/* Highlighted Part No, Godown, Rack (Video 07 Frames 0385, 0540) */}
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '900', color: '#1d4ed8', backgroundColor: isSelected ? 'transparent' : '#eff6ff' }}>
                        {p.partNo || '-'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '900', color: '#15803d', backgroundColor: isSelected ? 'transparent' : '#f0fdf4' }}>
                        {p.godown || '-'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '900', color: '#c2410c', backgroundColor: isSelected ? 'transparent' : '#fff7ed' }}>
                        {p.rack || '-'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: p.active ? '#16a34a' : '#dc2626' }}>
                        {p.active ? 'Yes' : 'No'}
                      </td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{p.saleTaxType}</td>
                      <td style={{ padding: '5px 8px', color: '#475569' }}>{p.purchaseTaxType}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{p.defaultSaleQty}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{p.openingStock}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: p.currentStock > 10 ? '#166534' : '#b91c1c' }}>
                        {p.currentStock}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹{p.mrp.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0284c7' }}>
                        ₹{p.retailPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '500' }}>
                        ₹{p.wholesalePrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#64748b', borderLeft: '1px solid #e2e8f0' }}>
                        {p.mfgDate || '-'}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: p.expDate ? '#be185d' : '#64748b', borderLeft: '1px solid #e2e8f0' }}>
                        {p.expDate || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info Bar */}
        <div
          style={{
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '4px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div>
            Showing: <strong>{filteredProducts.length}</strong> of {products.length} total catalog products
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: '#0284c7' }}>Products mapped to Part No & Rack shelf for instant POS picking</span>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '2px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10001
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
