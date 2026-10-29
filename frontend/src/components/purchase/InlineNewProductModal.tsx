import React, { useState } from 'react';
import type { InlineNewProductData } from '../../types/retailDaddy';

interface InlineNewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertProduct: (productData: InlineNewProductData) => void;
}

export const InlineNewProductModal: React.FC<InlineNewProductModalProps> = ({
  isOpen,
  onClose,
  onInsertProduct
}) => {
  const [pCode, setPCode] = useState<string>('GI-SL2D-NEW');
  const [name, setName] = useState<string>('Godrej Interio Slimline 2-Door Wardrobe');
  const [purchasePrice, setPurchasePrice] = useState<number>(18500);
  const [cessPercent, setCessPercent] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(2);
  const [openingStock, setOpeningStock] = useState<number>(5);
  const [barcode, setBarcode] = useState<string>('8901199');
  const [mrp, setMrp] = useState<number>(25990);
  const [retailPrice, setRetailPrice] = useState<number>(22490);
  const [size, setSize] = useState<string>('78H x 36W x 19D inch');
  const [colour, setColour] = useState<string>('Burgundy Red');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleInsert = async () => {
    if (!name.trim()) {
      setErrorMsg('⚠️ Product Name is required to register the item.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      await onInsertProduct({
        pCode: pCode.trim() || `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        purchasePrice: Number(purchasePrice) || 0,
        cessPercent: Number(cessPercent) || 0,
        minStock: Number(minStock) || 0,
        openingStock: Number(openingStock) || 0,
        barcode: barcode.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
        mrp: Number(mrp) || 0,
        retailPrice: Number(retailPrice) || 0,
        size: size.trim(),
        colour: colour.trim()
      });
      onClose();
    } catch (e: any) {
      setErrorMsg(`❌ Failed to register product: ${e?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '980px',
          maxWidth: '98vw',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #581c87',
          overflow: 'hidden'
        }}
      >
        {/* Title bar (Frame 0240) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #581c87 0%, #3b0764 100%)',
            color: '#ffffff',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #9333ea'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✨</span>
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
              In-line Fast Product Registration (Video 06 • Frame 0240)
            </span>
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}
            >
              F2 Shortcut
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderBottom: '1px solid #f87171'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* In-line Fast Entry Grid (1:1 Frame 0240) */}
        <div style={{ overflowX: 'auto', padding: '12px', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#4c0519',
                  color: '#ffffff',
                  textAlign: 'left'
                }}
              >
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Product Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Product Name</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Purchase Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>CESS %</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Min Stock</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Opening Stock</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Barcode</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>MRP</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Retail Sale Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Size</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #831843' }}>Colour</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="text"
                    value={pCode}
                    onChange={e => setPCode(e.target.value)}
                    style={{ width: '65px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. GODREJ SLIMLINE 2-DOOR"
                    style={{
                      width: '130px',
                      padding: '3px 4px',
                      fontSize: '11px',
                      border: '2px solid #581c87',
                      fontWeight: 600,
                      backgroundColor: '#fffbeb'
                    }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(Number(e.target.value))}
                    style={{ width: '70px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={cessPercent}
                    onChange={e => setCessPercent(Number(e.target.value))}
                    style={{ width: '45px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={minStock}
                    onChange={e => setMinStock(Number(e.target.value))}
                    style={{ width: '50px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={openingStock}
                    onChange={e => setOpeningStock(Number(e.target.value))}
                    style={{ width: '55px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    style={{ width: '75px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={mrp}
                    onChange={e => setMrp(Number(e.target.value))}
                    style={{ width: '65px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="number"
                    value={retailPrice}
                    onChange={e => setRetailPrice(Number(e.target.value))}
                    style={{ width: '65px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="text"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    placeholder="e.g. DOUBLE XL"
                    style={{ width: '75px', padding: '3px 4px', fontSize: '11px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input
                    type="text"
                    value={colour}
                    onChange={e => setColour(e.target.value)}
                    placeholder="e.g. YELLOW"
                    style={{
                      width: '75px',
                      padding: '3px 4px',
                      fontSize: '11px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: colour.toUpperCase() === 'YELLOW' ? '#fef08a' : '#ffffff'
                    }}
                  />
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <button
                    onClick={handleInsert}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '4px 10px',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Insert
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Tip: Quickly add items with Color and Size without opening the heavy Master Product form.
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                backgroundColor: '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 16px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? '⏳ Inserting...' : '✓ Insert & Add To Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
