/**
 * Retsol R220 Desktop Barcode Printer Integration Utilities
 * 
 * Specifically calibrated for Retsol R220 (203 DPI, 8 dots/mm) desktop label printer
 * installed via Seagull Scientific "Driver Wizard".
 * 
 * Supports:
 * 1. High-Precision Browser Printing via Seagull Driver (@media print with exact mm page bounds)
 * 2. Raw TSPL (TSC Printer Language) Generation for direct hardware/USB spooler printing
 * 3. File exporter for raw .PRN label jobs
 */

export interface RetsolLabelPreset {
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  description: string;
  dotsWidth: number; // 203 DPI = ~8 dots per mm
  dotsHeight: number;
}

export const RETSOL_PRESETS: RetsolLabelPreset[] = [
  {
    key: '50x25',
    name: 'Retsol 50mm × 25mm (2" × 1")',
    widthMm: 50,
    heightMm: 25,
    gapMm: 2,
    description: 'Compact Furniture Price & 1D Barcode Sticker Roll',
    dotsWidth: 400,
    dotsHeight: 200
  },
  {
    key: '50x38',
    name: 'Retsol 50mm × 38mm (2" × 1.5")',
    widthMm: 50,
    heightMm: 38,
    gapMm: 2,
    description: 'Furniture Specification, Wood Type & Warranty Label',
    dotsWidth: 400,
    dotsHeight: 304
  },
  {
    key: '75x35',
    name: 'Retsol 75mm × 35mm (3" × 1.4")',
    widthMm: 75,
    heightMm: 35,
    gapMm: 3,
    description: 'Warehouse Serial Number & Godown Stock Sticker',
    dotsWidth: 600,
    dotsHeight: 280
  },
  {
    key: '100x50',
    name: 'Retsol 100mm × 50mm (4" × 2")',
    widthMm: 100,
    heightMm: 50,
    gapMm: 3,
    description: 'Master Furniture Box & Dispatch Carton Sticker (Boxes 1 of X)',
    dotsWidth: 800,
    dotsHeight: 400
  },
  {
    key: '100x150',
    name: 'Retsol 100mm × 150mm (4" × 6")',
    widthMm: 100,
    heightMm: 150,
    gapMm: 3,
    description: 'Showroom Luxury Hang-Tag & Teakwood Certificate',
    dotsWidth: 800,
    dotsHeight: 1200
  }
];

/**
 * Generate native TSPL (TSC Printer Language) instructions for Retsol R220.
 * TSPL is the native firmware language of Retsol R220 and prints with zero driver overhead.
 */
export function generateRetsolTspl(
  product: Record<string, any>,
  presetKey: string = '50x25',
  copies: number = 1
): string {
  const preset = RETSOL_PRESETS.find(p => p.key === presetKey) || RETSOL_PRESETS[0];
  const storeName = 'SHREE VINAYAKA FURNITURES';
  const name = String(product.name || product.productName || 'TEAKWOOD FURNITURE').toUpperCase().slice(0, 32);
  const sku = String(product.sku_code || product.pCode || product.skuCode || 'SVF-001').toUpperCase();
  const barcode = String(product.barcode || sku);
  
  const rawSale = typeof product.retailPrice === 'number'
    ? product.retailPrice
    : (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.retailPrice || product.salePrice || '0').replace(/[^0-9.]/g, '')) || 0);
  
  const rawMrp = typeof product.mrp === 'number'
    ? product.mrp
    : parseFloat(String(product.mrp || '0').replace(/[^0-9.]/g, '')) || 0;

  const material = String(product.material || product.colour || 'Solid Teak Wood').slice(0, 24);
  const dimensions = String(product.dimensions || product.size || '').slice(0, 24);
  const warranty = String(product.warranty || '10Y Warranty').slice(0, 16);

  const lines: string[] = [];
  lines.push(`SIZE ${preset.widthMm} mm, ${preset.heightMm} mm`);
  lines.push(`GAP ${preset.gapMm} mm, 0 mm`);
  lines.push(`SPEED 4`); // 4 inches/sec
  lines.push(`DENSITY 9`); // Optimal darkness for crisp 203 DPI barcodes
  lines.push(`DIRECTION 1`);
  lines.push(`REFERENCE 0,0`);
  lines.push(`CLS`);

  if (preset.key === '50x25') {
    // 50x25mm (400x200 dots)
    lines.push(`TEXT 20,12,"1",0,1,1,"${storeName.slice(0, 25)}"`);
    lines.push(`TEXT 20,38,"2",0,1,1,"${name.slice(0, 22)}"`);
    // Code 128: BARCODE X, Y, "128", height, human_readable(1=yes), rotation, narrow, wide, "data"
    lines.push(`BARCODE 20,72,"128",52,1,0,2,2,"${barcode}"`);
    lines.push(`TEXT 20,158,"1",0,1,1,"MRP: Rs. ${rawMrp.toLocaleString('en-IN')}"`);
    lines.push(`TEXT 210,152,"2",0,1,1,"OFFER: Rs. ${rawSale.toLocaleString('en-IN')}"`);
  } else if (preset.key === '50x38') {
    // 50x38mm (400x304 dots)
    lines.push(`TEXT 20,15,"1",0,1,1,"${storeName}"`);
    lines.push(`TEXT 20,45,"2",0,1,1,"${name.slice(0, 22)}"`);
    lines.push(`TEXT 20,80,"1",0,1,1,"SKU: ${sku}"`);
    if (material) lines.push(`TEXT 20,105,"1",0,1,1,"WOOD: ${material}"`);
    if (dimensions) lines.push(`TEXT 20,130,"1",0,1,1,"DIM: ${dimensions}"`);
    lines.push(`BARCODE 20,165,"128",60,1,0,2,2,"${barcode}"`);
    lines.push(`TEXT 20,255,"1",0,1,1,"MRP: Rs. ${rawMrp.toLocaleString('en-IN')}"`);
    lines.push(`TEXT 200,248,"3",0,1,1,"Rs. ${rawSale.toLocaleString('en-IN')}"`);
    if (warranty) lines.push(`TEXT 20,282,"1",0,1,1,"${warranty}"`);
  } else if (preset.key === '100x50') {
    // 100x50mm (800x400 dots) - Master Furniture Carton
    lines.push(`TEXT 40,20,"3",0,1,1,"${storeName}"`);
    lines.push(`TEXT 40,65,"3",0,1,1,"ITEM: ${name}"`);
    lines.push(`TEXT 40,110,"2",0,1,1,"MODEL SKU: ${sku}   |   HSN: ${product.hsn || '9403'}"`);
    lines.push(`TEXT 40,145,"2",0,1,1,"SPECS: ${material}   |   ${dimensions}"`);
    lines.push(`BARCODE 40,190,"128",100,1,0,3,3,"${barcode}"`);
    lines.push(`TEXT 40,325,"3",0,1,1,"SPECIAL PRICE: Rs. ${rawSale.toLocaleString('en-IN')}"`);
    lines.push(`TEXT 40,365,"2",0,1,1,"BOX: 1 OF 1   |   GODOWN: ${product.godown || 'MAIN SHOWROOM'}"`);
  } else {
    // Generic fallback
    lines.push(`TEXT 30,20,"2",0,1,1,"${storeName}"`);
    lines.push(`TEXT 30,60,"2",0,1,1,"${name}"`);
    lines.push(`BARCODE 30,110,"128",70,1,0,2,2,"${barcode}"`);
    lines.push(`TEXT 30,210,"2",0,1,1,"PRICE: Rs. ${rawSale.toLocaleString('en-IN')}"`);
  }

  lines.push(`PRINT ${Math.max(1, copies)},1`);
  return lines.join('\r\n') + '\r\n';
}

/**
 * Trigger immediate download of raw TSPL file (.prn) for USB/Raw print spooling
 */
export function downloadTsplFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.prn') ? filename : `${filename}.prn`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Configure @media print stylesheet for Seagull Driver and trigger browser print dialog
 */
export function printViaSeagullDriver(printElementId: string, widthMm: number, heightMm: number) {
  const styleId = 'svf-retsol-seagull-print-css';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page {
        size: ${widthMm}mm ${heightMm}mm;
        margin: 0mm !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden !important;
      }
      #${printElementId}, #${printElementId} * {
        visibility: visible !important;
      }
      #${printElementId} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
    }
  `;

  setTimeout(() => {
    window.print();
  }, 100);
}
