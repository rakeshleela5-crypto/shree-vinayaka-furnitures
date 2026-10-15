import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/retailDaddy';

interface SalePriceEditModalProps {
  isOpen: boolean;
  products: Product[];
  initialBarcode?: string;
  onUpdatePrices: (
    barcode: string,
    prices: { mrp: number; retailPrice: number; wholesalePrice: number; purchasePrice?: number }
  ) => void;
  onClose: () => void;
}

/**
 * Video 19 Feature 18: Sale Price Edit Dialog (1:1 Frame 535)
 * Fast Barcode-driven price overrides (MRP, Retail, Wholesale, Purchase)
 */
export const SalePriceEditModal: React.FC<SalePriceEditModalProps> = ({
  isOpen,
  products,
  initialBarcode = '3460',
  onUpdatePrices,
  onClose
}) => {
  const [searchBarcode, setSearchBarcode] = useState<string>(initialBarcode);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  const [mrp, setMrp] = useState<string>('400.00');
  const [retailPrice, setRetailPrice] = useState<string>('400.00');
  const [wholesalePrice, setWholesalePrice] = useState<string>('0.00');
  const [purchasePrice, setPurchasePrice] = useState<string>('89.29');

  useEffect(() => {
    if (searchBarcode.trim()) {
      const found = products.find(
        p => p.barcode === searchBarcode.trim() || p.pCode.toLowerCase() === searchBarcode.trim().toLowerCase()
      );
      if (found) {
        setMatchedProduct(found);
        setMrp(found.mrp.toFixed(2));
        setRetailPrice(found.retailPrice.toFixed(2));
        setWholesalePrice((found.wholesalePrice || 0).toFixed(2));
        setPurchasePrice((found.purchasePrice || 0).toFixed(2));
      } else {
        setMatchedProduct(null);
      }
    }
  }, [searchBarcode, products]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (!matchedProduct) {
      alert('Product not found for barcode: ' + searchBarcode);
      return;
    }
    const numMrp = parseFloat(mrp) || 0;
    const numRetail = parseFloat(retailPrice) || 0;
    const numWholesale = parseFloat(wholesalePrice) || 0;
    const numPurchase = parseFloat(purchasePrice) || 0;

    onUpdatePrices(matchedProduct.barcode, {
      mrp: numMrp,
      retailPrice: numRetail,
      wholesalePrice: numWholesale,
      purchasePrice: numPurchase
    });

    alert(`✓ Prices updated permanently for "${matchedProduct.name}" (Barcode: ${matchedProduct.barcode}) [Video 19 Frame 535]`);
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
          width: '740px',
          backgroundColor: '#ffffff',
          border: '2px solid #16a34a',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (1:1 Frame 535 Bright Green Header) */}
        <div
          style={{
            backgroundColor: '#22c55e',
            color: '#000000',
            textAlign: 'center',
            padding: '8px',
            fontSize: '15px',
            fontWeight: '900',
            position: 'relative',
            userSelect: 'none'
          }}
        >
          <span>Sale Price Edit</span>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '1px 6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Red Search Strip (1:1 Frame 535) */}
        <div
          style={{
            backgroundColor: '#dc2626',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          <span>Search By Barcode :</span>
          <input
            type="text"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            style={{
              width: '200px',
              backgroundColor: '#fef08a',
              border: '1px solid #71717a',
              padding: '3px 8px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#000000'
            }}
            placeholder="Scan or enter barcode..."
            autoFocus
          />
          {matchedProduct && (
            <span style={{ color: '#fef08a', fontSize: '11px', marginLeft: 'auto' }}>
              ✓ Found: <strong>{matchedProduct.name}</strong>
            </span>
          )}
        </div>

        {/* Blue Table Grid (1:1 Frame 535) */}
        <div style={{ padding: '0', minHeight: '140px', backgroundColor: '#0284c7' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#002b80', color: '#ffffff' }}>
                <th style={{ border: '1px solid #001f5c', padding: '6px', width: '30px' }}>▶</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>MRP</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Retail Sale Rate</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Wholesale Sale Rate</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Purchase Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#0033aa', color: '#ffffff' }}>
                <td style={{ border: '1px solid #001f5c', textAlign: 'center', color: '#f43f5e', fontWeight: 'bold' }}>
                  ▶ 1
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    style={{
                      width: '100px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '2px solid #b91c1c',
                      padding: '3px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    style={{
                      width: '100px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '2px solid #15803d',
                      padding: '3px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    style={{
                      width: '100px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #cbd5e1',
                      padding: '3px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    style={{
                      width: '100px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #cbd5e1',
                      padding: '3px'
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Red Footer Bar (1:1 Frame 535) */}
        <div
          style={{
            backgroundColor: '#dc2626',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>( Top</span>
            <input
              type="number"
              defaultValue={5}
              style={{ width: '40px', padding: '1px 3px', textAlign: 'center', fontSize: '11px' }}
            />
            <span>Records )</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleUpdate}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: '1.5px solid #ffffff',
                padding: '4px 16px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Update
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
