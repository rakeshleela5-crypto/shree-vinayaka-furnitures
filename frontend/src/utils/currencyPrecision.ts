/**
 * frontend/src/utils/currencyPrecision.ts
 * Integer-Paise Precision Engine and Safe Numeric Fallbacks for Sri Vinayaka Furnitures ERP.
 * Eliminates floating-point drift (e.g. 0.1 + 0.2 = 0.30000000000000004).
 */

/**
 * Safely parses any value to finite float. Never returns NaN, Infinity, or negative if nonNegative=true.
 */
export function safeNum(val: unknown, fallback = 0, nonNegative = false): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (!Number.isFinite(num)) return fallback;
  if (nonNegative && num < 0) return 0;
  return num;
}

/**
 * Converts standard Rupee float to integer Paise.
 * e.g. 1499.99 -> 149999
 */
export function toPaise(rupees: number | string | undefined | null): number {
  const safe = safeNum(rupees, 0, false);
  return Math.round(safe * 100);
}

/**
 * Converts integer Paise back to standard Rupee float rounded to 2 decimal places.
 * e.g. 149999 -> 1499.99
 */
export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Formats Rupee amount with Indian numbering format (Lakhs, Crores).
 * e.g. 1250000 -> ₹12,50,000.00
 */
export function formatINR(val: number | string | undefined | null): string {
  const safe = safeNum(val, 0, false);
  return '₹' + safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Exact Tax-Inclusive and Tax-Exclusive GST calculation in integer Paise.
 */
export function calculateGstBreakdown(
  grossOrTaxableAmount: number,
  gstRate: number,
  isTaxInclusive: boolean,
  isInterState: boolean
): {
  taxableAmount: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
} {
  const safeRate = Math.max(0, safeNum(gstRate, 18, true));
  const rateMultiplier = safeRate / 100;

  if (isTaxInclusive) {
    const grossPaise = toPaise(grossOrTaxableAmount);
    // Taxable = Gross / (1 + Rate)
    const taxablePaise = Math.round(grossPaise / (1 + rateMultiplier));
    const totalGstPaise = grossPaise - taxablePaise;

    if (isInterState) {
      return {
        taxableAmount: fromPaise(taxablePaise),
        totalGst: fromPaise(totalGstPaise),
        cgst: 0,
        sgst: 0,
        igst: fromPaise(totalGstPaise),
        grandTotal: fromPaise(grossPaise)
      };
    } else {
      // 50/50 CGST/SGST split with 1-paisa reconciliation
      const cgstPaise = Math.floor(totalGstPaise / 2);
      const sgstPaise = totalGstPaise - cgstPaise;
      return {
        taxableAmount: fromPaise(taxablePaise),
        totalGst: fromPaise(totalGstPaise),
        cgst: fromPaise(cgstPaise),
        sgst: fromPaise(sgstPaise),
        igst: 0,
        grandTotal: fromPaise(grossPaise)
      };
    }
  } else {
    const taxablePaise = toPaise(grossOrTaxableAmount);
    const totalGstPaise = Math.round(taxablePaise * rateMultiplier);
    const grandTotalPaise = taxablePaise + totalGstPaise;

    if (isInterState) {
      return {
        taxableAmount: fromPaise(taxablePaise),
        totalGst: fromPaise(totalGstPaise),
        cgst: 0,
        sgst: 0,
        igst: fromPaise(totalGstPaise),
        grandTotal: fromPaise(grandTotalPaise)
      };
    } else {
      const cgstPaise = Math.floor(totalGstPaise / 2);
      const sgstPaise = totalGstPaise - cgstPaise;
      return {
        taxableAmount: fromPaise(taxablePaise),
        totalGst: fromPaise(totalGstPaise),
        cgst: fromPaise(cgstPaise),
        sgst: fromPaise(sgstPaise),
        igst: 0,
        grandTotal: fromPaise(grandTotalPaise)
      };
    }
  }
}

/**
 * Converts Indian Rupee number into English words (Lakhs and Crores system).
 */
export function numberToWordsINR(amount: number): string {
  const safe = Math.max(0, safeNum(amount, 0, true));
  const integerPart = Math.floor(safe);
  const paisePart = Math.round((safe - integerPart) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += ones[hundred] + ' Hundred';
    if (rest > 0) {
      if (res) res += ' and ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  if (integerPart === 0 && paisePart === 0) return 'Zero Rupees Only';

  let remaining = integerPart;
  const parts: string[] = [];

  // Crores
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    parts.push(convertThreeDigits(crore) + ' Crore');
    remaining %= 10000000;
  }

  // Lakhs
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    parts.push(convertTwoDigits(lakh) + ' Lakh');
    remaining %= 100000;
  }

  // Thousands
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    parts.push(convertTwoDigits(thousand) + ' Thousand');
    remaining %= 1000;
  }

  // Hundreds & Units
  if (remaining > 0) {
    parts.push(convertThreeDigits(remaining));
  }

  let words = parts.join(' ') + ' Rupees';
  if (paisePart > 0) {
    words += ' and ' + convertTwoDigits(paisePart) + ' Paise';
  }
  return words + ' Only';
}
