import React, { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface ProductBulkEditorModalProps {
  isOpen: boolean;
  products: Product[];
  onSaveProducts: (updatedProducts: Product[]) => void;
  onClose: () => void;
}

/**
 * Video 19 Feature 17: Product Bulk Editor (1:1 Frame 275)
 * Mass Commission (%) & Loyalty Editor with pagination and mass save
 */
export const ProductBulkEditorModal: React.FC<ProductBulkEditorModalProps> = ({
  isOpen,
  products,
  onSaveProducts,
  onClose
}) => {
  const [activeMode, setActiveMode] = useState<'COMMISSION' | 'LOYALTY' | 'LANG2' | 'STATUS'>('LOYALTY');

  const [editedProducts, setEditedProducts] = useState<
    { id: string; selected: boolean; salesmanCommission: number; loyaltyValue: number }[]
  >(() =>
    products.map(p => ({
      id: p.id,
      selected: false,
      salesmanCommission: p.salesmanCommission || 0,
      loyaltyValue: p.loyaltyValue !== undefined ? p.loyaltyValue : (p.discount || 0)
    }))
  );

  const [searchName, setSearchName] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  if (!isOpen) return null;

  const filtered = products.filter(
    p =>
      (!searchName || p.name.toLowerCase().includes(searchName.toLowerCase())) &&
      (!searchBarcode || p.barcode.includes(searchBarcode))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCommissionChange = (prodId: string, val: number) => {
    setEditedProducts(prev =>
      prev.map(item =>
        item.id === prodId
          ? { ...item, salesmanCommission: val, selected: true }
          : item
      )
    );
  };

  const handleLoyaltyChange = (prodId: string, val: number) => {
    setEditedProducts(prev =>
      prev.map(item =>
        item.id === prodId
          ? { ...item, loyaltyValue: val, selected: true }
          : item
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = pageItems.every(p => editedProducts.find(e => e.id === p.id)?.selected);
    setEditedProducts(prev =>
      prev.map(item =>
        pageItems.some(p => p.id === item.id) ? { ...item, selected: !allSelected } : item
      )
    );
  };

  const handleSave = () => {
    const updatedMap = new Map(editedProducts.filter(e => e.selected).map(e => [e.id, e]));
    const updated = products.map(p => {
      const edit = updatedMap.get(p.id);
      if (edit) {
        return {
          ...p,
          salesmanCommission: edit.salesmanCommission,
          loyaltyValue: edit.loyaltyValue
        };
      }
      return p;
    });

    onSaveProducts(updated);
    alert(`✓ Product Record: Successfully Saved! [Video 13 Frame 0135]`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '92vh',
          backgroundColor: '#0284c7',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #0369a1',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (1:1 Frame 275) */}
        <div
          style={{
            backgroundColor: '#0055aa',
            color: '#ffffff',
            padding: '4px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Product Bulk Editor</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '1px 6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Top Control Strip 1 (1:1 Frame 275) */}
        <div
          style={{
            backgroundColor: '#0284c7',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#ffffff',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '3px 8px',
              fontWeight: 'bold',
              borderRadius: '2px'
            }}
          >
            Top 50 Records
          </span>

          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '3px 8px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Select All
          </button>

          <span>Active :</span>
          <select style={{ padding: '2px', fontSize: '11px' }}>
            <option>All</option>
            <option>Active</option>
            <option>Deactive</option>
          </select>

          <span>Search By Product Name :</span>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: '130px', padding: '2px 4px', fontSize: '11px' }}
          />

          <span>Search By Barcode :</span>
          <input
            type="text"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            style={{ width: '90px', padding: '2px 4px', fontSize: '11px' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Active / Deactive</span>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '3px 8px',
                fontWeight: 'bold',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              Set Default
            </button>
            <select style={{ padding: '2px', fontSize: '11px' }}>
              <option>English</option>
              <option>Hindi</option>
            </select>
            <span style={{ fontWeight: 'bold' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
            >
              &lt; Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
            >
              Next &gt;
            </button>
          </div>
        </div>

        {/* Action Buttons Ribbon (1:1 Video 13 Frame 0135 & Video 19 Frame 275) */}
        <div
          style={{
            backgroundColor: '#0284c7',
            padding: '4px 10px 8px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={() => setActiveMode('COMMISSION')}
            style={{
              backgroundColor: activeMode === 'COMMISSION' ? '#0f172a' : '#16a34a',
              color: '#ffffff',
              border: activeMode === 'COMMISSION' ? '1.5px solid #ffffff' : 'none',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Product Seting
          </button>
          <button
            onClick={() => setActiveMode('LOYALTY')}
            style={{
              backgroundColor: activeMode === 'LOYALTY' ? '#0284c7' : '#16a34a',
              color: '#ffffff',
              border: activeMode === 'LOYALTY' ? '2px solid #ffffff' : 'none',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer',
              boxShadow: activeMode === 'LOYALTY' ? '0 0 6px rgba(255,255,255,0.6)' : 'none'
            }}
          >
            Loyality Update
          </button>
          <button
            onClick={() => setActiveMode('LANG2')}
            style={{
              backgroundColor: activeMode === 'LANG2' ? '#0f172a' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            2nd Lang Update
          </button>
          <button
            onClick={() => setActiveMode('STATUS')}
            style={{
              backgroundColor: activeMode === 'STATUS' ? '#0f172a' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Status Update
          </button>
          <button
            onClick={() => alert('Printing barcodes...')}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Barcode Print
          </button>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: '1.5px solid #ffffff',
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditedProducts(products.map(p => ({
                id: p.id,
                selected: false,
                salesmanCommission: p.salesmanCommission || 0,
                loyaltyValue: p.discount || 0
              })));
            }}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>

        {/* Yellow Data Grid (1:1 Frame 275) */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #cbd5e1', position: 'sticky', top: 0 }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '40px' }}>Select</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '50px' }}>ID</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '90px' }}>Product Code</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '100px' }}>Barcode</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'left' }}>Product Name</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '90px', backgroundColor: activeMode === 'COMMISSION' ? '#fed7aa' : '#f1f5f9' }}>SalesMan%</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '80px' }}>loyalty type</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '90px', backgroundColor: activeMode === 'LOYALTY' ? '#fed7aa' : '#f1f5f9' }}>loyalty val</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((prod, idx) => {
                const edit = editedProducts.find(e => e.id === prod.id) || {
                  id: prod.id,
                  selected: false,
                  salesmanCommission: prod.salesmanCommission || 0,
                  loyaltyValue: prod.loyaltyValue || 0
                };

                return (
                  <tr
                    key={prod.id}
                    style={{
                      backgroundColor: '#ffff00', // Iconic Retail Daddy Yellow Table Background (Frame 275)
                      borderBottom: '1px solid #ca8a04'
                    }}
                  >
                    <td style={{ border: '1px solid #ca8a04', textAlign: 'center', padding: '2px' }}>
                      <input
                        type="checkbox"
                        checked={edit.selected}
                        onChange={(e) => {
                          setEditedProducts(prev =>
                            prev.map(it => it.id === prod.id ? { ...it, selected: e.target.checked } : it)
                          );
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ca8a04', textAlign: 'center', padding: '2px' }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ border: '1px solid #ca8a04', textAlign: 'center', padding: '2px', fontFamily: 'monospace' }}>
                      {prod.pCode}
                    </td>
                    <td style={{ border: '1px solid #ca8a04', textAlign: 'center', padding: '2px', fontFamily: 'monospace' }}>
                      {prod.barcode}
                    </td>
                    <td style={{ border: '1px solid #ca8a04', padding: '2px 6px', fontWeight: 'bold' }}>
                      {prod.name}
                    </td>
                    <td style={{ border: '1px solid #ca8a04', padding: '2px', textAlign: 'center' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={edit.salesmanCommission}
                        onChange={(e) => handleCommissionChange(prod.id, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '65px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '2px'
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ca8a04', textAlign: 'center', padding: '2px' }}>
                      per
                    </td>
                    <td style={{ border: '1px solid #ca8a04', padding: '2px', textAlign: 'center' }}>
                      {activeMode === 'LOYALTY' ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={edit.loyaltyValue}
                          onChange={(e) => handleLoyaltyChange(prod.id, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '65px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #0284c7',
                            padding: '2px'
                          }}
                        />
                      ) : (
                        edit.loyaltyValue.toFixed(2)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
