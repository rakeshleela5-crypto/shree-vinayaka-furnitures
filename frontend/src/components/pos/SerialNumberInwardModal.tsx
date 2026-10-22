import React from 'react';
import { SerialNoEntryModal } from '../purchase/SerialNoEntryModal';

export interface SerialNumberInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  existingSerials?: string[];
  onSaveSerials: (serials: string[]) => void;
}

/**
 * Unified Serial / IMEI Number Inward & Tracking Modal
 * Reuses the rich table & barcode generator from SerialNoEntryModal
 */
export const SerialNumberInwardModal: React.FC<SerialNumberInwardModalProps> = (props) => {
  return <SerialNoEntryModal {...props} />;
};

export { SerialNoEntryModal };
