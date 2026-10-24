import type { Product } from '../../types/retailDaddy';
import { printViaSeagullDriver } from '../../utils/retsolPrinter';
import { Barcode128 } from '../common/Barcode128';

interface ScannedProductActionModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onOpenPosWithProduct: (product: Product) => void;
  onOpenHardwareHub: (product: Product) => void;
}

export function ScannedProductActionModal({
  isOpen,
  product,
  onClose,
  onOpenPosWithProduct,
  onOpenHardwareHub
}: ScannedProductActionModalProps) {
  if (!isOpen || !product) return null;

  const handleQuickPrint = (_copies: number) => {
    printViaSeagullDriver('svf-quick-scan-label-print', 50, 25);
  };

  const salePrice = typeof product.retailPrice === 'number'
    ? product.retailPrice
    : (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.retailPrice || '0').replace(/[^0-9.]/g, '')) || 0);

  const mrp = typeof product.mrp === 'number'
    ? product.mrp
    : parseFloat(String(product.mrp || '0').replace(/[^0-9.]/g, '')) || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '100%',
          background: '#ffffff',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '900' }}>
            <span>⚡</span>
            <span>Brontix Scanner: Product Identified!</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Product Details Content */}
        <div style={{ padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Product Photo */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {product.photo ? (
                <img
                  src={product.photo}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '36px' }}>🛋️</span>
              )}
            </div>

            {/* Info Block */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', lineHeight: 1.25 }}>
                {product.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Category: <strong>{product.category || 'General Furniture'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#0369a1', fontFamily: 'monospace', marginTop: '2px' }}>
                SKU: {product.pCode} • Barcode: {product.barcode}
              </div>

              {/* Price & Stock Grid */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#059669' }}>
                  ₹{salePrice.toLocaleString('en-IN')}
                </span>
                {mrp > salePrice && (
                  <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    MRP: ₹{mrp.toLocaleString('en-IN')}
                  </span>
                )}
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                  Stock: {product.openingStock ?? 0} {product.salesUnit || 'Nos'}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Pills */}
          <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#64748b' }}>🪵 Material / Wood: </span>
              <strong style={{ color: '#0f172a' }}>{product.material || product.colour || 'Solid Wood'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>📐 Dimensions: </span>
              <strong style={{ color: '#0f172a' }}>{product.dimensions || 'Standard Size'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>🛡️ Warranty: </span>
              <strong style={{ color: '#0f172a' }}>{product.warranty || '1 Year Standard'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>📍 Godown / Location: </span>
              <strong style={{ color: '#0f172a' }}>{product.godown || 'Main Showroom'}</strong>
            </div>
          </div>

          {/* Hidden 50x25 label container for direct print */}
          <div style={{ display: 'none' }}>
            <div
              id="svf-quick-scan-label-print"
              style={{
                width: '50mm',
                height: '25mm',
                padding: '1.5mm',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif',
                textAlign: 'center',
                overflow: 'hidden'
              }}
            >
              <div style={{ fontSize: '6pt', fontWeight: 'bold' }}>SHREE VINAYAKA FURNITURES</div>
              <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>{product.name.slice(0, 24)}</div>
              <div style={{ margin: '1mm 0' }}>
                <Barcode128 value={product.barcode || product.pCode} width={1.2} height={26} displayValue={true} />
              </div>
              <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>
                MRP: ₹{mrp.toLocaleString('en-IN')} | SALE: ₹{salePrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => {
                onOpenPosWithProduct(product);
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
              }}
            >
              <span>🛒</span>
              <span>Add to POS Billing Cart & Bill Now</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleQuickPrint(1)}
                style={{
                  background: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '9px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🖨️</span>
                <span>Print Retsol Label (1x)</span>
              </button>

              <button
                onClick={() => {
                  onOpenHardwareHub(product);
                  onClose();
                }}
                style={{
                  background: '#f8fafc',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '9px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚙️</span>
                <span>Full Hardware Hub Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
