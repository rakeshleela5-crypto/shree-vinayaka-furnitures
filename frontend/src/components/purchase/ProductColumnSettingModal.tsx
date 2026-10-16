import React, { useState } from 'react';
import type { ProductColumnSettings } from '../../types/retailDaddy';

interface ProductColumnSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProductColumnSettings;
  onSaveSettings: (newSettings: ProductColumnSettings) => void;
}

export const ProductColumnSettingModal: React.FC<ProductColumnSettingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [localSettings, setLocalSettings] = useState<ProductColumnSettings>({ ...settings });

  if (!isOpen) return null;

  const toggleField = (key: keyof ProductColumnSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = () => {
    const updated = { ...localSettings };
    (Object.keys(updated) as Array<keyof ProductColumnSettings>).forEach(k => {
      updated[k] = true;
    });
    setLocalSettings(updated);
  };

  const handleClearAll = () => {
    const updated = { ...localSettings };
    (Object.keys(updated) as Array<keyof ProductColumnSettings>).forEach(k => {
      updated[k] = false;
    });
    setLocalSettings(updated);
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const fieldList: { key: keyof ProductColumnSettings; label: string; desc: string }[] = [
    { key: 'wSalePrice', label: 'WSalePrice', desc: 'Wholesale selling price column' },
    { key: 'batch', label: 'Batch', desc: 'Batch number for pharmaceuticals and FMCG' },
    { key: 'mfgDate', label: 'MfgDate', desc: 'Manufacturing date field' },
    { key: 'expDate', label: 'ExpDate', desc: 'Expiry date field for perishable stock' },
    { key: 'size', label: 'Size', desc: 'Size column for garments & footwear (Video 06)' },
    { key: 'colour', label: 'Colour', desc: 'Colour column for garments & fashion (Video 06)' },
    { key: 'imei1', label: 'IMEI1', desc: 'Primary IMEI for mobile & electronic devices' },
    { key: 'imei2', label: 'IMEI2', desc: 'Secondary IMEI for dual SIM devices' },
    { key: 'kitchen', label: 'Kitchen', desc: 'Kitchen order ticket (KOT) routing' },
    { key: 'categoryPlus', label: 'Category_plus', desc: 'Quick category addition button' },
    { key: 'subcategoryPlus', label: 'Subcategory_plus', desc: 'Quick subcategory addition button' },
    { key: 'description', label: 'Description', desc: 'Product notes and description' },
    { key: 'discount', label: 'Discount', desc: 'Item-level percentage discount' },
    { key: 'gstPlus', label: 'Gst_plus', desc: 'Dynamic GST tax calculator' },
    { key: 'cgst', label: 'CGST', desc: 'Central GST rate and amount' },
    { key: 'sgst', label: 'SGST', desc: 'State GST rate and amount' },
    { key: 'igst', label: 'IGST', desc: 'Integrated GST rate for inter-state' },
    { key: 'salesUnit', label: 'SalesUnit', desc: 'Primary sales unit (PCS, KGS, BTL)' },
    { key: 'salesAltUnit', label: 'SalesAltUnit', desc: 'Secondary / alternate unit conversion' },
    { key: 'minStock', label: 'MinStock', desc: 'Minimum reorder trigger quantity' },
    { key: 'status', label: 'Status', desc: 'Product active / suspended status' },
    { key: 'godown', label: 'GDwon', desc: 'Godown / warehouse location' },
    { key: 'rack', label: 'Rack', desc: 'Rack / shelf placement code' },
    { key: 'partNo', label: 'PartNo', desc: 'Manufacturer part number' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '380px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #64748b',
          overflow: 'hidden'
        }}
      >
        {/* Title bar (1:1 Frame 0235 frmProductSetting) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>⚙️</span>
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
              frmProductSetting - Column Defaults
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Subtitle instructions */}
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          Check the fields to display in Purchase Entry and Product Creation:
        </div>

        {/* Checkbox list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '11px'
          }}
        >
          {fieldList.map(item => {
            const isChecked = !!localSettings[item.key];
            const isHighlighted = item.key === 'size' || item.key === 'colour';
            return (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  backgroundColor: isHighlighted ? '#fef9c3' : isChecked ? '#f1f5f9' : '#ffffff',
                  cursor: 'pointer',
                  border: isHighlighted ? '1px solid #facc15' : '1px solid transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleField(item.key)}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontWeight: isChecked ? 700 : 500,
                    color: isHighlighted ? '#854d0e' : isChecked ? '#0f172a' : '#64748b'
                  }}
                >
                  {item.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#94a3b8' }}>
                  {item.desc}
                </span>
              </label>
            );
          })}
        </div>

        {/* Action buttons */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              💾 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
