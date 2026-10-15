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
    alert('Prefix and Suffix Invoice Code Saved Successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      {/* 1:1 Frame 221 Window Frame */}
      <div className="relative w-[540px] bg-white border-2 border-[#1e40af] rounded shadow-2xl overflow-hidden font-sans select-none">
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
              className="px-14 py-1.5 bg-gradient-to-b from-[#16a34a] to-[#14532d] hover:from-[#22c55e] hover:to-[#166534] border border-[#22c55e] text-white font-bold text-sm rounded shadow active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
