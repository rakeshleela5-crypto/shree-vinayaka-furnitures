import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewBill?: () => void;
  onQuickPay?: () => void;
  onOldBills?: () => void;
  onPrint?: () => void;
  onTogglePriceMode?: () => void;
  onBillDiscount?: () => void;
  onLastSoldPrice?: () => void;
  onFocusBarcode?: () => void;
  onFocusQty?: () => void;
  onMultiPay?: () => void;
  onHoldBill?: () => void;
  onUnholdBill?: () => void;
  onEscapeModal?: () => void;
}

export function usePosShortcuts(handlers: ShortcutHandlers, active: boolean = true) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F-Keys
      if (e.key === 'F2') {
        e.preventDefault();
        handlers.onNewBill?.();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handlers.onQuickPay?.();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handlers.onOldBills?.();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handlers.onPrint?.();
      }

      // Ctrl Combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 's') {
          // Feature 13: Ctrl+S for Retail/Wholesale/Special price switch
          e.preventDefault();
          handlers.onTogglePriceMode?.();
        } else if (key === 'c') {
          // Feature 27: Ctrl+C for Total Bill Discount
          e.preventDefault();
          handlers.onBillDiscount?.();
        } else if (key === 'h') {
          // Feature 28: Ctrl+H for Customer Last Sold Price
          e.preventDefault();
          handlers.onLastSoldPrice?.();
        } else if (key === 'b') {
          e.preventDefault();
          handlers.onFocusBarcode?.();
        } else if (key === 'q') {
          e.preventDefault();
          handlers.onFocusQty?.();
        } else if (key === 'p') {
          e.preventDefault();
          handlers.onMultiPay?.();
        }
      }

      if (e.key === 'Escape') {
        handlers.onEscapeModal?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, active]);
}
