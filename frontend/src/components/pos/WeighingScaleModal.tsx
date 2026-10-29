import React, { useState } from 'react';
import { recordScaleEvent } from '../../api/client';

interface WeighingScaleModalProps {
  isOpen: boolean;
  productName: string;
  ratePerKg: number;
  onApplyWeightItem: (weightKg: number, amount: number) => void;
  onClose: () => void;
}

export const WeighingScaleModal: React.FC<WeighingScaleModalProps> = ({
  isOpen,
  productName,
  ratePerKg,
  onApplyWeightItem,
  onClose
}) => {
  const [grossWeight, setGrossWeight] = useState<number>(2.450);
  const [tareWeight, setTareWeight] = useState<number>(0.150);
  const [isComConnected, setIsComConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  if (!isOpen) return null;

  const netWeight = Math.max(0, Number((grossWeight - tareWeight).toFixed(3)));
  const totalAmount = Number((netWeight * ratePerKg).toFixed(2));

  const handleSimulateRandomWeight = async () => {
    const randomGross = Number((Math.random() * 8 + 0.5).toFixed(3));
    setGrossWeight(randomGross);
    try {
      await recordScaleEvent({
        event_type: 'READ',
        gross_weight: randomGross,
        tare_weight: tareWeight,
        net_weight: Math.max(0, Number((randomGross - tareWeight).toFixed(3))),
        product_name: productName
      });
    } catch (e) {
      console.warn('Scale telemetry sync error:', e);
    }
  };

  const handleApply = async () => {
    if (netWeight <= 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      await recordScaleEvent({
        event_type: 'APPLY',
        gross_weight: grossWeight,
        tare_weight: tareWeight,
        net_weight: netWeight,
        product_name: productName,
        amount: totalAmount
      });
      onApplyWeightItem(netWeight, totalAmount);
      onClose();
    } catch (e) {
      console.error('Scale event error:', e);
      // Still apply if server returned minor error
      onApplyWeightItem(netWeight, totalAmount);
      onClose();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '460px',
        maxWidth: '95vw',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        border: '1.5px solid #4f46e5'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚖️</span>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Electronic Weighing Scale Terminal</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>
          {/* Hardware status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isComConnected ? '#22c55e' : '#ef4444',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#312e81' }}>
                COM1 (9600-8-N-1): {isComConnected ? 'ONLINE & SYNCED' : 'OFFLINE'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsComConnected(prev => !prev)}
                style={{
                  background: isComConnected ? '#ef4444' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isComConnected ? 'Disconnect' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={handleSimulateRandomWeight}
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔄 Read Scale
              </button>
            </div>
          </div>

          {/* LED Digital Display */}
          <div style={{
            background: '#090d16',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            border: '2px solid #1e293b',
            boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {productName || 'Loose Item / Timber Raw'} • Rate: ₹{ratePerKg.toFixed(2)}/KG
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '42px',
              fontWeight: 900,
              color: '#4ade80',
              textShadow: '0 0 12px rgba(74, 222, 128, 0.6)',
              letterSpacing: '2px'
            }}>
              {netWeight.toFixed(3)} <span style={{ fontSize: '20px', color: '#86efac' }}>KG</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#facc15', marginTop: '6px' }}>
              TOTAL: ₹{totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Inputs for Manual / Tare adjustments */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                GROSS WEIGHT (KG)
              </label>
              <input
                type="number"
                step="0.001"
                value={grossWeight}
                onChange={(e) => setGrossWeight(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                TARE CONTAINER (KG)
              </label>
              <input
                type="number"
                step="0.001"
                value={tareWeight}
                onChange={(e) => setTareWeight(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', fontWeight: 700 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleApply}
            style={{
              background: isSyncing ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isSyncing ? 'Syncing...' : '✓ Push Weight to POS Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
