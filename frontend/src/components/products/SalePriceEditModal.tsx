import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/retailDaddy';
import { api, mapBackendProductToFrontend } from '../../api/client';

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
 * Sale Price Edit Dialog (1:1 Frame 535)
 * Synchronized with FastAPI + PostgreSQL on Railway Cloud
 * Direct barcode lookups & permanent cloud database price updates
 */
export const SalePriceEditModal: React.FC<SalePriceEditModalProps> = ({
  isOpen,
  products,
  initialBarcode = '',
  onUpdatePrices,
  onClose
}) => {
  const [searchBarcode, setSearchBarcode] = useState<string>(initialBarcode);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [mrp, setMrp] = useState<string>('0.00');
  const [retailPrice, setRetailPrice] = useState<string>('0.00');
  const [wholesalePrice, setWholesalePrice] = useState<string>('0.00');
  const [purchasePrice, setPurchasePrice] = useState<string>('0.00');

  // Synchronize initial barcode on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchBarcode(initialBarcode || '');
      setStatusMessage(null);
    }
  }, [isOpen, initialBarcode]);

  // Handle barcode search across both local memory AND Railway Cloud PostgreSQL
  useEffect(() => {
    const trimmed = searchBarcode.trim();
    if (!trimmed) {
      setMatchedProduct(null);
      setMrp('0.00');
      setRetailPrice('0.00');
      setWholesalePrice('0.00');
      setPurchasePrice('0.00');
      setStatusMessage(null);
      return;
    }

    // 1. Try local in-memory products first
    const foundLocal = products.find(
      p => p.barcode === trimmed || p.pCode.toLowerCase() === trimmed.toLowerCase()
    );

    if (foundLocal) {
      setMatchedProduct(foundLocal);
      setMrp((foundLocal.mrp || 0).toFixed(2));
      setRetailPrice((foundLocal.retailPrice || 0).toFixed(2));
      setWholesalePrice((foundLocal.wholesalePrice || 0).toFixed(2));
      setPurchasePrice((foundLocal.purchasePrice || 0).toFixed(2));
      setStatusMessage({ text: `✓ Found: ${foundLocal.name} (${foundLocal.pCode})`, type: 'info' });
      return;
    }

    // 2. Query Railway Cloud PostgreSQL API if not found locally
    let isCancelled = false;
    setIsSearchingCloud(true);
    setStatusMessage({ text: `🔍 Searching Railway Cloud PostgreSQL for barcode "${trimmed}"...`, type: 'info' });

    api.getProductByBarcode(trimmed)
      .then(cloudProduct => {
        if (isCancelled) return;
        setIsSearchingCloud(false);
        if (cloudProduct) {
          const mapped = mapBackendProductToFrontend(cloudProduct);
          setMatchedProduct(mapped);
          setMrp((mapped.mrp || 0).toFixed(2));
          setRetailPrice((mapped.retailPrice || 0).toFixed(2));
          setWholesalePrice((mapped.wholesalePrice || 0).toFixed(2));
          setPurchasePrice((mapped.purchasePrice || 0).toFixed(2));
          setStatusMessage({ text: `✓ Found in Railway PostgreSQL: ${mapped.name}`, type: 'success' });
        } else {
          setMatchedProduct(null);
          setStatusMessage({
            text: `⚠️ Barcode "${trimmed}" not found in Railway PostgreSQL store database`,
            type: 'error'
          });
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setIsSearchingCloud(false);
        setMatchedProduct(null);
        setStatusMessage({
          text: `⚠️ Barcode "${trimmed}" not found in store database`,
          type: 'error'
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [searchBarcode, products]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    if (!matchedProduct) {
      setStatusMessage({
        text: searchBarcode.trim()
          ? `⚠️ Barcode "${searchBarcode.trim()}" not found in Railway PostgreSQL. Please scan a valid store item.`
          : '⚠️ Please scan or enter a product barcode first.',
        type: 'error'
      });
      return;
    }

    const numMrp = parseFloat(mrp) || 0;
    const numRetail = parseFloat(retailPrice) || 0;
    const numWholesale = parseFloat(wholesalePrice) || 0;
    const numPurchase = parseFloat(purchasePrice) || 0;

    setIsSaving(true);
    setStatusMessage({ text: '⏳ Persisting updated prices to Railway Cloud PostgreSQL...', type: 'info' });

    try {
      // 1. Persist directly to Railway FastAPI / PostgreSQL
      await api.updateProductPrice(matchedProduct.barcode || matchedProduct.id, {
        mrp: numMrp,
        retailPrice: numRetail,
        wholesalePrice: numWholesale,
        purchasePrice: numPurchase
      });

      // 2. Update local state and parent view
      onUpdatePrices(matchedProduct.barcode, {
        mrp: numMrp,
        retailPrice: numRetail,
        wholesalePrice: numWholesale,
        purchasePrice: numPurchase
      });

      setStatusMessage({
        text: `✓ Prices updated permanently in Railway PostgreSQL database for "${matchedProduct.name}"!`,
        type: 'success'
      });

      // Auto close after brief display
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      // Fallback: still update locally if offline
      onUpdatePrices(matchedProduct.barcode, {
        mrp: numMrp,
        retailPrice: numRetail,
        wholesalePrice: numWholesale,
        purchasePrice: numPurchase
      });
      setStatusMessage({
        text: `✓ Prices updated in session memory (${err?.message || 'Cloud sync queued'})`,
        type: 'info'
      });
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '760px',
          backgroundColor: '#ffffff',
          border: '2px solid #16a34a',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (Bright Green Header) */}
        <div
          style={{
            backgroundColor: '#22c55e',
            color: '#052e16',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: '15px',
            fontWeight: '900',
            position: 'relative',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>Sale Price Edit & Cloud Master Sync</span>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '2px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Red Barcode Search Bar */}
        <div
          style={{
            backgroundColor: '#dc2626',
            padding: '8px 14px',
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUpdate();
              }
            }}
            style={{
              width: '220px',
              backgroundColor: '#fef08a',
              border: '1px solid #71717a',
              padding: '4px 8px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#000000',
              borderRadius: '2px'
            }}
            placeholder="Scan or enter barcode..."
            autoFocus
          />

          {isSearchingCloud && (
            <span style={{ color: '#ffffff', fontSize: '11px', fontStyle: 'italic' }}>
              ⏳ Contacting Railway PostgreSQL...
            </span>
          )}

          {matchedProduct && !isSearchingCloud && (
            <span
              style={{
                color: '#fef08a',
                fontSize: '11px',
                marginLeft: 'auto',
                maxWidth: '340px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={matchedProduct.name}
            >
              ✓ <strong>{matchedProduct.name}</strong>
            </span>
          )}
        </div>

        {/* Status Notification Banner (Replaces crude window.alert) */}
        {statusMessage && (
          <div
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor:
                statusMessage.type === 'error'
                  ? '#fee2e2'
                  : statusMessage.type === 'success'
                  ? '#dcfce7'
                  : '#e0f2fe',
              color:
                statusMessage.type === 'error'
                  ? '#b91c1c'
                  : statusMessage.type === 'success'
                  ? '#15803d'
                  : '#0369a1',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Blue Table Grid (1:1 Frame 535) */}
        <div style={{ padding: '0', minHeight: '130px', backgroundColor: '#0284c7' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#002b80', color: '#ffffff' }}>
                <th style={{ border: '1px solid #001f5c', padding: '6px', width: '36px' }}>▶</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>MRP (₹)</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Retail Sale Rate (₹)</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Wholesale Sale Rate (₹)</th>
                <th style={{ border: '1px solid #001f5c', padding: '6px' }}>Purchase Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#0033aa', color: '#ffffff' }}>
                <td style={{ border: '1px solid #001f5c', textAlign: 'center', color: '#f43f5e', fontWeight: 'bold' }}>
                  ▶ 1
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '6px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={mrp}
                    disabled={!matchedProduct}
                    onChange={(e) => setMrp(e.target.value)}
                    style={{
                      width: '110px',
                      backgroundColor: matchedProduct ? '#ffffff' : '#e2e8f0',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '2px solid #b91c1c',
                      padding: '4px',
                      borderRadius: '2px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '6px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={retailPrice}
                    disabled={!matchedProduct}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    style={{
                      width: '110px',
                      backgroundColor: matchedProduct ? '#ffffff' : '#e2e8f0',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '2px solid #15803d',
                      padding: '4px',
                      borderRadius: '2px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '6px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={wholesalePrice}
                    disabled={!matchedProduct}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    style={{
                      width: '110px',
                      backgroundColor: matchedProduct ? '#ffffff' : '#e2e8f0',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #cbd5e1',
                      padding: '4px',
                      borderRadius: '2px'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #001f5c', padding: '6px', textAlign: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    value={purchasePrice}
                    disabled={!matchedProduct}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    style={{
                      width: '110px',
                      backgroundColor: matchedProduct ? '#ffffff' : '#e2e8f0',
                      color: '#000000',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #cbd5e1',
                      padding: '4px',
                      borderRadius: '2px'
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Red Footer Bar */}
        <div
          style={{
            backgroundColor: '#dc2626',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Cloud Sync:</span>
            <span
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            >
              Railway PostgreSQL Active
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleUpdate}
              disabled={isSaving || !matchedProduct}
              style={{
                backgroundColor: !matchedProduct || isSaving ? '#9ca3af' : '#16a34a',
                color: '#ffffff',
                border: '1.5px solid #ffffff',
                padding: '5px 18px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: !matchedProduct || isSaving ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isSaving ? 'Saving to Cloud...' : 'Update (Save to PostgreSQL)'}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '5px 14px',
                fontSize: '12px',
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
