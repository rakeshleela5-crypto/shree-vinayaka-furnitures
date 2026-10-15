import React, { useState } from 'react';
import type { VisibleColumnsConfig } from '../../../types/pos';
import { DEFAULT_VISIBLE_COLUMNS } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: VisibleColumnsConfig;
  onSaveColumns: (updated: VisibleColumnsConfig) => void;
}

interface ColumnOption {
  key: keyof VisibleColumnsConfig;
  label: string;
}

const COLUMN_OPTIONS: ColumnOption[] = [
  { key: 'barcode', label: 'Barcode' },
  { key: 'hsn', label: 'HSN Code' },
  { key: 'cgstRate', label: 'CGST %' },
  { key: 'cgstAmt', label: 'CGST Amt' },
  { key: 'sgstRate', label: 'SGST %' },
  { key: 'sgstAmt', label: 'SGST Amt' },
  { key: 'igstRate', label: 'IGST %' },
  { key: 'igstAmt', label: 'IGST Amt' },
  { key: 'cessRate', label: 'CESS %' },
  { key: 'cessAmt', label: 'CESS Amt' },
  { key: 'total', label: 'Total' },
  { key: 'purchasePrice', label: 'Purchase Rate' },
  { key: 'margin', label: 'Margin' },
  { key: 'description', label: 'Description' },
  { key: 'tempQty', label: 'Temp Qty' },
  { key: 'serialNumber', label: 'IMEI-1 / Serial No' },
  { key: 'mrp', label: 'MRP' },
  { key: 'taxableAmt', label: 'Taxable Amt' },
  { key: 'mfgDate', label: 'Mfg Date' },
  { key: 'expDate', label: 'Exp Date' },
  { key: 'size', label: 'Size' },
  { key: 'color', label: 'Colour' },
  { key: 'altUnit', label: 'Alt Unit / Alt Qty' },
  { key: 'salesman', label: 'Salesman' },
  { key: 'commission', label: 'Commission' }
];

export const ColumnVisibilityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  columns,
  onSaveColumns
}) => {
  const [localCols, setLocalCols] = useState<VisibleColumnsConfig>({ ...columns });

  if (!isOpen) return null;

  const handleToggle = (key: keyof VisibleColumnsConfig) => {
    setLocalCols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOk = () => {
    onSaveColumns(localCols);
    onClose();
  };

  const handleReset = () => {
    setLocalCols({ ...DEFAULT_VISIBLE_COLUMNS });
  };

  return (
    <div className="rd-modal-backdrop" style={{ zIndex: 1200 }}>
      <div 
        className="rd-form-window" 
        style={{ 
          width: '320px', 
          background: '#ece9d8', 
          border: '2px solid #0055ea',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar matching screen_025.jpg */}
        <div 
          className="rd-form-titlebar" 
          style={{ 
            background: 'linear-gradient(90deg, #0055ea 0%, #3882f6 100%)', 
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 800
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>★</span>
            <span>Show / Hide Columns</span>
          </div>
          <button 
            className="rd-win-btn close" 
            onClick={onClose} 
            style={{ 
              background: '#e81123', 
              color: '#fff', 
              border: 'none', 
              width: '18px', 
              height: '18px', 
              lineHeight: '16px',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        </div>

        {/* Checkbox List with classic Windows scroll viewport */}
        <div 
          style={{ 
            background: '#ffffff', 
            margin: '8px', 
            border: '1px solid #7f9db9', 
            height: '380px', 
            overflowY: 'auto',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {COLUMN_OPTIONS.map(opt => (
            <label 
              key={opt.key} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '11px', 
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                cursor: 'pointer',
                padding: '2px 0',
                userSelect: 'none'
              }}
            >
              <input 
                type="checkbox" 
                checked={!!localCols[opt.key]}
                onChange={() => handleToggle(opt.key)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: localCols[opt.key] ? '#000' : '#475569', fontWeight: localCols[opt.key] ? 600 : 400 }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Action Buttons matching screen_025.jpg: OK, Cancel, Reset Default */}
        <div 
          style={{ 
            padding: '6px 8px 10px', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '8px',
            background: '#ece9d8'
          }}
        >
          <button 
            onClick={handleOk}
            style={{ 
              minWidth: '70px', 
              padding: '3px 12px', 
              fontSize: '11px', 
              fontWeight: 700,
              background: 'linear-gradient(to bottom, #ffffff, #e1e1e1)',
              border: '1px solid #003c74',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            OK
          </button>
          <button 
            onClick={onClose}
            style={{ 
              minWidth: '70px', 
              padding: '3px 12px', 
              fontSize: '11px', 
              fontWeight: 700,
              background: 'linear-gradient(to bottom, #ffffff, #e1e1e1)',
              border: '1px solid #707070',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleReset}
            style={{ 
              minWidth: '95px', 
              padding: '3px 10px', 
              fontSize: '11px', 
              fontWeight: 700,
              background: 'linear-gradient(to bottom, #ffffff, #e1e1e1)',
              border: '1px solid #707070',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            Reset Default
          </button>
        </div>
      </div>
    </div>
  );
};
