import React, { useState } from 'react';
import type { PrefixSuffixConfig } from '../../types/retailDaddy';

interface PrefixSuffixSettingsModalProps {
  isOpen: boolean;
  config: PrefixSuffixConfig;
  onSave: (newConfig: PrefixSuffixConfig) => void;
  onClose: () => void;
}

export const PrefixSuffixSettingsModal: React.FC<PrefixSuffixSettingsModalProps> = ({
  isOpen,
  config,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<PrefixSuffixConfig>({ ...config });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  const docRows: { key: keyof PrefixSuffixConfig; label: string }[] = [
    { key: 'saleInvoice', label: 'Sale Invoice Code :' },
    { key: 'purchaseInvoice', label: 'Purchase Invoice Code :' },
    { key: 'saleReturnInvoice', label: 'Sale Return Invoice Code :' },
    { key: 'purchaseReturnInvoice', label: 'Purchase Return Invoice Code :' },
    { key: 'quotationInvoice', label: 'Quotation Invoice Code :' },
    { key: 'purchaseOrderInvoice', label: 'Purchase Order Invoice Code :' },
    { key: 'receiptInvoice', label: 'Receipt Invoice Code :' },
    { key: 'paymentInvoice', label: 'Payment Invoice Code :' },
    { key: 'incomeInvoice', label: 'Income Invoice Code :' },
    { key: 'expenseInvoice', label: 'Expense Invoice Code :' },
    { key: 'estimateInvoice', label: 'Estimate Invoice Code :' }
  ];

  const handleUpdate = (
    key: keyof PrefixSuffixConfig,
    field: 'prefix' | 'suffix',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
    showToast('✓ Prefix and Suffix Invoice Code Saved Successfully!', 'success');
    setTimeout(() => onClose(), 800);
  };

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(1px)'
      }}
    >
      {/* 1:1 Frame 221 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '540px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          border: '2px solid #1e40af',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px',
          userSelect: 'none'
        }}
      >
        {/* Title Bar */}
        <div className="bg-[#1d4ed8] text-white px-3 py-1 flex items-center justify-between text-xs font-bold">
          <span className="text-sm">Prefix and Suffix Invoice Code</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
            >
              _
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
            >
              □
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {toast && (
          <div
            style={{
              padding: '6px 12px',
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

        {/* Content Table (1:1 Frame 221) */}
        <div className="p-4 bg-white text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-48"></th>
                <th className="py-1 px-2 bg-[#22d3ee] text-[#003366] text-center font-bold border border-gray-300 tracking-wider">
                  PREFIX CODE
                </th>
                <th className="py-1 px-2 bg-[#22d3ee] text-[#003366] text-center font-bold border border-gray-300 tracking-wider">
                  SUFFIX CODE
                </th>
              </tr>
            </thead>
            <tbody>
              {docRows.map((doc) => (
                <tr key={doc.key} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 text-right font-medium text-gray-800 whitespace-nowrap">
                    {doc.label}
                  </td>
                  <td className="py-1 px-2 text-center">
                    <input
                      type="text"
                      value={formData[doc.key]?.prefix || ''}
                      onChange={(e) => handleUpdate(doc.key, 'prefix', e.target.value)}
                      className="w-32 bg-[#ffffcc] border border-gray-400 px-2 py-0.5 text-center text-xs font-semibold text-gray-800 rounded-xs focus:outline-none focus:border-blue-600 focus:bg-[#ffff99]"
                    />
                  </td>
                  <td className="py-1 px-2 text-center">
                    <input
                      type="text"
                      value={formData[doc.key]?.suffix || ''}
                      onChange={(e) => handleUpdate(doc.key, 'suffix', e.target.value)}
                      className="w-32 bg-[#ffffcc] border border-gray-400 px-2 py-0.5 text-center text-xs font-semibold text-gray-800 rounded-xs focus:outline-none focus:border-blue-600 focus:bg-[#ffff99]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Green Save Button (1:1 Frame 221) */}
          <div className="flex justify-center mt-5 mb-2">
            <button
              type="button"
              onClick={handleSave}
              style={{ background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)' }}
              className="px-14 py-1.5 hover:brightness-110 border border-[#22c55e] text-white font-bold text-sm rounded shadow active:scale-95 transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
