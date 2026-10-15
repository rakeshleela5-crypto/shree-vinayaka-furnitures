import { useMemo } from 'react';
import type { CartItem, Customer, TaxType } from '../types/pos';

export const STORE_STATE = 'Karnataka';

export function calculateLineItem(
  qty: number,
  rate: number,
  _mrp: number,
  discountType: 'PERCENT' | 'FLAT',
  discountValue: number,
  taxRate: number,
  customerState: string,
  taxType: TaxType
): {
  discountAmt: number;
  taxableAmt: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmt: number;
  sgstAmt: number;
  igstAmt: number;
  total: number;
} {
  const gross = Number((qty * rate).toFixed(2));
  
  let discountAmt = 0;
  if (discountType === 'PERCENT') {
    discountAmt = Number(((gross * discountValue) / 100).toFixed(2));
  } else {
    discountAmt = Number(Math.min(gross, discountValue).toFixed(2));
  }
  
  const taxableAmt = Number(Math.max(0, gross - discountAmt).toFixed(2));
  
  if (taxType === 'NON_GST') {
    return {
      discountAmt,
      taxableAmt,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cgstAmt: 0,
      sgstAmt: 0,
      igstAmt: 0,
      total: taxableAmt
    };
  }

  const isInterState = customerState && customerState.trim().toLowerCase() !== STORE_STATE.toLowerCase();
  
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmt = 0;
  let sgstAmt = 0;
  let igstAmt = 0;

  if (taxType === 'COMPOSITION') {
    // Flat 1% tax (0.5% CGST + 0.5% SGST)
    cgstRate = 0.5;
    sgstRate = 0.5;
    cgstAmt = Number(((taxableAmt * cgstRate) / 100).toFixed(2));
    sgstAmt = Number(((taxableAmt * sgstRate) / 100).toFixed(2));
  } else if (isInterState) {
    igstRate = taxRate;
    igstAmt = Number(((taxableAmt * igstRate) / 100).toFixed(2));
  } else {
    cgstRate = Number((taxRate / 2).toFixed(2));
    sgstRate = Number((taxRate / 2).toFixed(2));
    cgstAmt = Number(((taxableAmt * cgstRate) / 100).toFixed(2));
    sgstAmt = Number(((taxableAmt * sgstRate) / 100).toFixed(2));
  }

  const totalTax = cgstAmt + sgstAmt + igstAmt;
  const total = Number((taxableAmt + totalTax).toFixed(2));

  return {
    discountAmt,
    taxableAmt,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmt,
    sgstAmt,
    igstAmt,
    total
  };
}

export function usePosCalculations(
  items: CartItem[],
  customer: Customer,
  taxType: TaxType,
  billDiscount: number = 0,
  billSundry: { name: string; amount: number } = { name: '', amount: 0 }
) {
  return useMemo(() => {
    const itemsCount = items.length;
    const totalQty = Number(items.reduce((sum, item) => sum + item.qty, 0).toFixed(3));
    const billMrp = Number(items.reduce((sum, item) => sum + item.mrp * item.qty, 0).toFixed(2));
    const itemDiscountTotal = Number(items.reduce((sum, item) => sum + item.discountAmt, 0).toFixed(2));
    const taxableTotal = Number(items.reduce((sum, item) => sum + item.taxableAmt, 0).toFixed(2));
    const cgstTotal = Number(items.reduce((sum, item) => sum + item.cgstAmt, 0).toFixed(2));
    const sgstTotal = Number(items.reduce((sum, item) => sum + item.sgstAmt, 0).toFixed(2));
    const igstTotal = Number(items.reduce((sum, item) => sum + item.igstAmt, 0).toFixed(2));
    const taxTotal = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));

    const subTotal = Number((taxableTotal + taxTotal).toFixed(2));
    const sundryAmt = Number((billSundry.amount || 0).toFixed(2));
    const discountAmt = Number((billDiscount || 0).toFixed(2));

    const rawGrandTotal = Number((subTotal + sundryAmt - discountAmt).toFixed(2));
    const netPay = Math.round(rawGrandTotal);
    const roundOff = Number((netPay - rawGrandTotal).toFixed(2));
    const savings = Number(Math.max(0, billMrp - netPay).toFixed(2));

    return {
      itemsCount,
      totalQty,
      billMrp,
      itemDiscountTotal,
      billDiscount: discountAmt,
      billSundry: { name: billSundry.name, amount: sundryAmt },
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      subTotal,
      rawGrandTotal,
      roundOff,
      netPay,
      savings
    };
  }, [items, customer.state, taxType, billDiscount, billSundry]);
}
