import React, { useState } from 'react';
import type { ComboPack, ComboPackItem, Product } from '../../types/retailDaddy';

interface ComboPackMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  comboPacks: ComboPack[];
  onSaveComboPack: (combo: ComboPack) => void;
  onDeleteComboPack: (id: string) => void;
}

export const ComboPackMasterModal: React.FC<ComboPackMasterModalProps> = ({
  isOpen,
  onClose,
  products,
  comboPacks,
  onSaveComboPack,
  onDeleteComboPack
}) => {
  // Selected combo pack
  const [selectedComboId, setSelectedComboId] = useState<string>(comboPacks[0]?.id || '');
  const activeCombo = comboPacks.find(c => c.id === selectedComboId) || comboPacks[0] || null;

  // Form states for combo pack metadata
  const [comboName, setComboName] = useState<string>(activeCombo?.name || '7 Std Books');
  const [barcode, setBarcode] = useState<string>(activeCombo?.barcode || 'CO1001');

  // Items currently inside active combo pack
  const [currentItems, setCurrentItems] = useState<ComboPackItem[]>(activeCombo?.items || []);

  // Item selector state for adding items to combo pack
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectCombo = (combo: ComboPack) => {
    setSelectedComboId(combo.id);
    setComboName(combo.name);
    setBarcode(combo.barcode);
    setCurrentItems(combo.items);
  };

  const handleNewCombo = () => {
    const nextNum = comboPacks.length + 1;
    const newName = `${nextNum}th Std Books`;
    const newBarcode = `CO100${nextNum}`;
    setSelectedComboId('');
    setComboName(newName);
    setBarcode(newBarcode);
    setCurrentItems([]);
  };

  const handleAddItemToCombo = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIdx = currentItems.findIndex(i => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...currentItems];
      updated[existingIdx].qty += itemQty;
      setCurrentItems(updated);
    } else {
      const newItem: ComboPackItem = {
        id: `cbi-${Date.now()}-${Math.random()}`,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        qty: itemQty,
        rate: prod.retailPrice || prod.mrp,
        mrp: prod.mrp
      };
      setCurrentItems([...currentItems, newItem]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setCurrentItems(currentItems.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!comboName.trim()) {
      showToast('Please enter ComboPack Name', 'error');
      return;
    }
    const totalAmount = currentItems.reduce((sum, item) => sum + (item.rate * item.qty), 0);
    const combo: ComboPack = {
      id: selectedComboId || '',
      name: comboName.trim(),
      barcode: barcode.trim() || `CO${Date.now().toString().slice(-4)}`,
      qrCode: `QR-${barcode.trim()}`,
      items: currentItems,
      totalAmount,
      createdDate: new Date().toLocaleDateString('en-GB')
    };

    setIsSaving(true);
    try {
      await onSaveComboPack(combo);
      showToast(`✓ ComboPack "${combo.name}" saved successfully to PostgreSQL!`, 'success');
    } catch (err: any) {
      showToast(`Failed to save combo pack: ${err?.message || 'Server error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCombo = async () => {
    if (isDeleting || !selectedComboId) return;
    if (confirm(`Delete combo pack ${comboName}?`)) {
      setIsDeleting(true);
      try {
        await onDeleteComboPack(selectedComboId);
        showToast(`✓ Deleted combo pack "${comboName}" from database`, 'success');
        handleNewCombo();
      } catch (err: any) {
        showToast(`Failed to delete combo pack: ${err?.message || 'Server error'}`, 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const totalBundleAmount = currentItems.reduce((sum, item) => sum + (item.rate * item.qty), 0);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '900px',
          maxHeight: '92vh',
          backgroundColor: '#f1f5f9',
          border: '2px solid #1e40af',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar matching Video 12 Frame 0446 */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          <span>frmComboPackMaster - Combo Pack Master</span>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {toast && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content split in 2 columns: Master Metadata & Item Validation */}
        <div style={{ display: 'flex', flex: 1, padding: '10px', gap: '10px', overflowY: 'auto' }}>
          {/* Left Column: Combo Pack Details */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                textAlign: 'center',
                padding: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                borderRadius: '2px'
              }}
            >
              Combo Pack Master
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>ComboPack Name :</span>
              <input
                type="text"
                value={comboName}
                onChange={e => setComboName(e.target.value)}
                style={{
                  border: '1px solid #94a3b8',
                  padding: '4px 6px',
                  fontSize: '12px',
                  backgroundColor: '#ffffcc',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>Barcode :</span>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                style={{
                  border: '1px solid #94a3b8',
                  padding: '4px 6px',
                  fontSize: '12px',
                  backgroundColor: '#ffffcc',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Action Buttons Frame 0446 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleNewCombo}
                style={{
                  background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                New
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                style={{
                  background: isSaving ? '#94a3b8' : 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                style={{
                  background: isSaving ? '#94a3b8' : 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                disabled={!selectedComboId || isDeleting}
                onClick={handleDeleteCombo}
                style={{
                  background: (!selectedComboId || isDeleting) ? '#cbd5e1' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: (!selectedComboId || isDeleting) ? 'not-allowed' : 'pointer',
                  fontSize: '11px'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>

            {/* List of Combo Packs */}
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginTop: '6px' }}>
              Saved Combo Packs ({comboPacks.length})
            </span>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '3px', overflowY: 'auto', minHeight: '130px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0284c7', color: '#ffffff' }}>
                    <th style={{ padding: '4px', textAlign: 'left' }}>ComboPack</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>CBarcode</th>
                    <th style={{ padding: '4px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {comboPacks.map(cp => (
                    <tr
                      key={cp.id}
                      onClick={() => handleSelectCombo(cp)}
                      style={{
                        cursor: 'pointer',
                        background: cp.id === selectedComboId ? '#bae6fd' : '#ffffff',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ padding: '4px', fontWeight: 'bold' }}>{cp.name}</td>
                      <td style={{ padding: '4px', fontFamily: 'monospace' }}>{cp.barcode}</td>
                      <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                        ₹{cp.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Item / Combo Offer Validation (Frame 0460) */}
          <div
            style={{
              flex: 1.3,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                textAlign: 'center',
                padding: '4px',
                fontWeight: 'bold',
                fontSize: '13px',
                borderRadius: '2px'
              }}
            >
              Item / Combo Offer Validation
            </div>

            {/* Add Item Row */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', background: '#f8fafc', padding: '6px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Select Product to Bundle:</span>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{ border: '1px solid #94a3b8', padding: '3px', fontSize: '11px', width: '100%' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.barcode}] - ₹{p.retailPrice || p.mrp}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: '55px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>Qty:</span>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={e => setItemQty(parseInt(e.target.value) || 1)}
                  style={{ border: '1px solid #94a3b8', padding: '3px', fontSize: '11px', textAlign: 'center' }}
                />
              </div>

              <button
                type="button"
                onClick={handleAddItemToCombo}
                style={{
                  background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  padding: '5px 12px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                + Add
              </button>
            </div>

            {/* Items inside Combo Pack Table */}
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '3px', overflowY: 'auto', minHeight: '200px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0284c7', color: '#ffffff' }}>
                    <th style={{ padding: '4px', width: '25px' }}>#</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>Product Name</th>
                    <th style={{ padding: '4px', width: '65px' }}>Barcode</th>
                    <th style={{ padding: '4px', width: '40px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '4px', width: '55px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '4px', width: '60px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '4px', width: '45px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                        No items added to this bundle yet. Add products using above dropdown.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '4px', fontWeight: 'bold' }}>{item.productName}</td>
                        <td style={{ padding: '4px', fontFamily: 'monospace' }}>{item.barcode}</td>
                        <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                        <td style={{ padding: '4px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                          ₹{(item.rate * item.qty).toFixed(2)}
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '2px',
                              padding: '1px 6px',
                              cursor: 'pointer',
                              fontSize: '10px'
                            }}
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

            {/* Total Footer matching Video 12 */}
            <div
              style={{
                background: '#e0f2fe',
                border: '1px solid #7dd3fc',
                borderRadius: '3px',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>
                Total Combo Bundle Items: {currentItems.length}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#0369a1' }}>
                Total Bundle Value : ₹{totalBundleAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: '#e2e8f0',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            borderTop: '1px solid #cbd5e1'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
