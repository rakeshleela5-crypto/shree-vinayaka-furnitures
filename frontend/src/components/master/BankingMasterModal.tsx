import React from 'react';
import type { BankRecord, BranchRecord, BankAccountRecord } from '../../types/retailDaddy';
import { ShowroomBankingHubModal } from '../banking/ShowroomBankingHubModal';

export interface BankingMasterModalProps {
  isOpen: boolean;
  banks: BankRecord[];
  branches: BranchRecord[];
  accounts: BankAccountRecord[];
  onSaveBank: (bank: BankRecord) => void;
  onDeleteBank: (id: string) => void;
  onSaveBranch: (branch: BranchRecord) => void;
  onDeleteBranch: (id: string) => void;
  onSaveAccount: (account: BankAccountRecord) => void;
  onDeleteAccount: (id: string) => void;
  onClose: () => void;
}

/**
 * BankingMasterModal is now unified inside ShowroomBankingHubModal.
 * This component acts as a seamless adapter opening directly into the 'accounts' tab.
 */
export const BankingMasterModal: React.FC<BankingMasterModalProps> = (props) => {
  return <ShowroomBankingHubModal {...props} initialTab="accounts" />;
};
