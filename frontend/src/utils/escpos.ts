/**
 * ESC/POS Hardware Thermal Printer Command Generator & Direct Silent Printing Bridge
 * Supports 80mm (48-column) and 58mm (32-column) standard POS receipt printers
 * (EPSON, TVS, Star, Citizen, NGX, POS-58/80)
 */

export interface EscPosBillItem {
  name: string;
  qty: number;
  rate: number;
  total: number;
  taxPercent?: number;
  hsn?: string;
  barcode?: string;
}

export interface EscPosBillData {
  invoiceNo: string;
  date: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  items: EscPosBillItem[];
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  roundOff?: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode?: string;
  salesmanName?: string;
}

// ESC/POS Command Byte Constants
const ESC = 0x1b;
const GS = 0x1d;

export class EscPosBuilder {
  private buffer: number[] = [];
  private cols: number;

  constructor(paperWidth: 58 | 80 = 80) {
    this.cols = paperWidth === 80 ? 48 : 32;
    this.init();
  }

  // ESC @ - Initialize printer
  init(): this {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  // ESC a n - Alignment (0: Left, 1: Center, 2: Right)
  align(mode: 'left' | 'center' | 'right'): this {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0;
    this.buffer.push(ESC, 0x61, n);
    return this;
  }

  // ESC E n - Bold text
  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  // ESC ! n - Font sizing (0: normal, 16: double height, 32: double width, 48: double both)
  size(doubleWidth: boolean, doubleHeight: boolean): this {
    let n = 0;
    if (doubleHeight) n |= 0x10;
    if (doubleWidth) n |= 0x20;
    this.buffer.push(ESC, 0x21, n);
    return this;
  }

  // Text encoder with CRLF
  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str + '\n');
    return this;
  }

  // Two-column row: Left aligned text, Right aligned text
  row(left: string, right: string): this {
    const maxLeftLen = this.cols - right.length - 1;
    const truncatedLeft = left.length > maxLeftLen ? left.substring(0, maxLeftLen) : left;
    const spacesNeeded = Math.max(1, this.cols - truncatedLeft.length - right.length);
    this.line(truncatedLeft + ' '.repeat(spacesNeeded) + right);
    return this;
  }

  // Horizontal divider rule
  divider(char: string = '-'): this {
    this.line(char.repeat(this.cols));
    return this;
  }

  feed(lines: number = 2): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // GS V 66 3 - Feed 3 lines & Partial cut paper
  cut(): this {
    this.buffer.push(GS, 0x56, 66, 3);
    return this;
  }

  // ESC p 0 25 250 - Kick Cash Drawer (Pin 2)
  openCashDrawer(): this {
    this.buffer.push(ESC, 0x70, 0, 25, 250);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Build complete raw ESC/POS byte receipt for Shree Vinayaka Furnitures
 */
export function generateEscPosReceipt(
  bill: EscPosBillData,
  companyInfo?: { name?: string; address?: string; phone?: string; gstin?: string },
  paperWidth: 58 | 80 = 80
): Uint8Array {
  const b = new EscPosBuilder(paperWidth);
  const storeName = companyInfo?.name || 'SHREE VINAYAKA FURNITURES';
  const phone = companyInfo?.phone || '+91 98470 12345';
  const gstin = companyInfo?.gstin || '32AABCS1429B1Z8';

  // Header
  b.align('center')
    .size(true, true)
    .bold(true)
    .line(storeName)
    .size(false, false)
    .bold(false)
    .line('NH Bypass Road, Kozhikode, Kerala - 673004')
    .line(`Ph: ${phone} | GSTIN: ${gstin}`)
    .line('State: Kerala (Code: 32)')
    .bold(true)
    .line('** TAX INVOICE **')
    .bold(false)
    .divider('=');

  // Invoice & Customer Details
  b.align('left')
    .row(`Inv: ${bill.invoiceNo}`, `Date: ${bill.date}`)
    .row(`Cust: ${bill.customerName || 'Cash Customer'}`, `Mob: ${bill.customerPhone || 'N/A'}`);

  if (bill.customerGstin) {
    b.line(`Cust GSTIN: ${bill.customerGstin}`);
  }
  if (bill.salesmanName) {
    b.line(`Sales Rep: ${bill.salesmanName}`);
  }
  b.divider('-');

  // Item List Header
  if (paperWidth === 80) {
    b.bold(true)
      .line('Item Description         Qty   Rate    GST%    Amount')
      .bold(false)
      .divider('-');

    for (const item of bill.items) {
      b.line(item.name.substring(0, 48));
      const qtyStr = item.qty.toFixed(1).replace(/\.0$/, '') + ' Pcs';
      const rateStr = '₹' + item.rate.toFixed(2);
      const gstStr = (item.taxPercent || 18) + '%';
      const totStr = '₹' + item.total.toFixed(2);
      b.row(`  ${qtyStr} @ ${rateStr} (${gstStr})`, totStr);
    }
  } else {
    // 58mm compact layout
    b.bold(true)
      .line('Item              Qty   Amount')
      .bold(false)
      .divider('-');

    for (const item of bill.items) {
      b.line(item.name.substring(0, 32));
      const qtyStr = `${item.qty} x ₹${item.rate.toFixed(0)}`;
      const totStr = `₹${item.total.toFixed(2)}`;
      b.row(`  ${qtyStr}`, totStr);
    }
  }

  b.divider('-');

  // Financial Totals
  b.align('left')
    .row('Sub Total (Taxable):', `Rs. ${bill.subTotal.toFixed(2)}`)
    .row('CGST Total (9%):', `Rs. ${bill.cgstTotal.toFixed(2)}`)
    .row('SGST Total (9%):', `Rs. ${bill.sgstTotal.toFixed(2)}`);

  if (bill.roundOff && Math.abs(bill.roundOff) > 0.01) {
    b.row('Round Off:', `Rs. ${bill.roundOff.toFixed(2)}`);
  }

  b.bold(true)
    .size(true, false)
    .row('GRAND TOTAL:', `Rs. ${bill.grandTotal.toFixed(2)}`)
    .size(false, false)
    .bold(false)
    .divider('-')
    .row(`Paid (${bill.paymentMode || 'Cash'}):`, `Rs. ${bill.paidAmount.toFixed(2)}`);

  if (bill.balanceDue > 0) {
    b.bold(true).row('BALANCE DUE (On Delivery):', `Rs. ${bill.balanceDue.toFixed(2)}`).bold(false);
  }

  b.divider('=');

  // Footer & Cut
  b.align('center')
    .line('1-Year Warranty Against Wood Boring Beetles')
    .line('Natural teak grains & colors are hardwood traits')
    .line('Disputes subject to Kozhikode Jurisdiction')
    .bold(true)
    .line('*** Thank you for your visit! ***')
    .bold(false)
    .feed(2)
    .cut();

  // If cash sale, pulse cash drawer
  if (bill.paymentMode?.toLowerCase().includes('cash')) {
    b.openCashDrawer();
  }

  return b.build();
}

/**
 * Direct Silent ESC/POS Printer Dispatch via Web Serial API
 * Bypasses sluggish browser window.print() dialog completely!
 */
export async function printDirectThermal(
  bill: EscPosBillData,
  companyInfo?: { name?: string; address?: string; phone?: string; gstin?: string },
  paperWidth: 58 | 80 = 80
): Promise<{ success: boolean; message: string }> {
  try {
    const bytes = generateEscPosReceipt(bill, companyInfo, paperWidth);

    // 1. Try Web Serial API (Chrome / Edge / Opera on Windows POS PCs)
    if ('serial' in navigator) {
      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        await port.close();
        return { success: true, message: 'Receipt printed directly via Web Serial port!' };
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          return { success: false, message: 'Serial port selection was cancelled.' };
        }
        console.warn('Web Serial failed, falling back to download/browser print:', err);
      }
    }

    // 2. Fallback: Generate downloadable .prn raw file for thermal spooler
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${bill.invoiceNo}.prn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'ESC/POS raw print command sent to thermal spooler file (Receipt_' + bill.invoiceNo + '.prn)'
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to print thermal receipt' };
  }
}
