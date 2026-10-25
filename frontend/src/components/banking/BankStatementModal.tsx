import React from 'react';
import type { BankStatementEntry, BankAccountRecord } from '../../types/retailDaddy';
import { ShowroomBankingHubModal } from './ShowroomBankingHubModal';

export interface BankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankStatements?: BankStatementEntry[];
  bankAccounts?: BankAccountRecord[];
  onReconciledCallback?: () => void;
}

/**
 * BankStatementModal (Legacy Bank Synchronization & UTR Reconciliation Engine)
 * has been retired and consolidated into the Unified Banking Hub (ShowroomBankingHubModal).
 * This adapter redirects seamlessly into the 'ledger' tab (Live Ledger Stream & UTR Reconciliation).
 */
export const BankStatementModal: React.FC<BankStatementModalProps> = (props) => {
  return (
    <ShowroomBankingHubModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      initialTab="ledger"
      accounts={props.bankAccounts || []}
    />
  );
};

export default BankStatementModal;
