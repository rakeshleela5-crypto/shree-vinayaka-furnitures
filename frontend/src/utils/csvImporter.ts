import type { Product } from '../types/retailDaddy';

export interface ParsedCsvResult {
  headers: string[];
  rawHeaders: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Robust CSV parser that handles quotes, escaped quotes (""), commas, tabs, and semicolons
 */
export function parseCsvText(csvText: string): ParsedCsvResult {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM if present
  if (!cleanText) {
    return { headers: [], rawHeaders: [], rows: [], totalRows: 0 };
  }

  // Parse lines considering quoted multi-line fields
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rawHeaders: [], rows: [], totalRows: 0 };
  }

  // Auto-detect delimiter from the header line
  const firstLine = lines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  // Helper to split a single CSV line into cells
  const splitCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let insideQuote = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const nc = line[j + 1];

      if (c === '"') {
        if (insideQuote && nc === '"') {
          cell += '"';
          j++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        cells.push(cleanCell(cell));
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cleanCell(cell));
    return cells;
  };

  const cleanCell = (s: string) => {
    let trimmed = s.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      trimmed = trimmed.slice(1, -1).replace(/""/g, '"');
    }
    return trimmed.trim();
  };

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.every(v => v === '')) continue; // skip blank lines

    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = values[colIdx] ?? '';
    });
    // Also include raw header mappings for convenience
    rawHeaders.forEach((rh, colIdx) => {
      rowObj[rh] = values[colIdx] ?? '';
    });
    rows.push(rowObj);
  }

  return {
    headers,
    rawHeaders,
    rows,
    totalRows: rows.length
  };
}

/**
 * Universal product extractor that intelligently inspects any uploaded spreadsheet row
 * and produces a valid Product object with all necessary retail/inventory properties.
 */
export function extractProductFromRow(row: Record<string, string>, index: number): Product {
  const keys = Object.keys(row);

  const getField = (...fieldNames: string[]): string => {
    for (const fn of fieldNames) {
      const cleanTarget = fn.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (row[fn] !== undefined && String(row[fn]).trim() !== '') {
        return String(row[fn]).trim();
      }
      if (row[cleanTarget] !== undefined && String(row[cleanTarget]).trim() !== '') {
        return String(row[cleanTarget]).trim();
      }
      const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
      if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return '';
  };

  const name =
    getField('productname', 'name', 'itemname', 'item', 'particulars', 'description', 'title', 'product') ||
    `Imported Item ${index + 1}`;

  const barcode =
    getField('barcode', 'bar_code', 'code', 'itemcode', 'upc', 'ean') ||
    `${8901100 + ((Date.now() + index * 7) % 100000)}`;

  const pCode =
    getField('productcode', 'pcode', 'p_code', 'code', 'item_code', 'sku', 'id', 'model') ||
    `P-${100 + index + 1}`;

  const rawQty = getField(
    'newstockqty',
    'stock',
    'qty',
    'quantity',
    'openingstock',
    'currentstock',
    'balance',
    'inhand',
    'units'
  );
  const qty = parseFloat(rawQty) || 0;

  const rawPurchase = getField('purchaseprice', 'purchase', 'cost', 'purrate', 'purchaserate', 'buyprice');
  const rawRetail = getField('retailprice', 'retail', 'saleprice', 'sellingprice', 'rate', 'price');
  const rawMrp = getField('mrp', 'maximumretailprice', 'listprice');
  const rawWholesale = getField('wholesaleprice', 'wholesale', 'dealerprice');

  const purchasePrice = parseFloat(rawPurchase) || 0;
  let retailPrice = parseFloat(rawRetail) || 0;
  if (retailPrice === 0 && purchasePrice > 0) retailPrice = Math.round(purchasePrice * 1.2);
  else if (retailPrice === 0) retailPrice = 1200;

  let mrp = parseFloat(rawMrp) || 0;
  if (mrp === 0) mrp = Math.round(retailPrice * 1.15);

  let wholesalePrice = parseFloat(rawWholesale) || 0;
  if (wholesalePrice === 0 && purchasePrice > 0) wholesalePrice = Math.round(purchasePrice * 1.08);
  else if (wholesalePrice === 0) wholesalePrice = Math.round(retailPrice * 0.95);

  const category = getField('category', 'cat', 'group', 'department') || 'Living Room';
  const subCategory = getField('subcategory', 'subcat', 'type') || '';
  const salesUnit = getField('salesunit', 'unit', 'uom') || 'Pcs';
  const godown = getField('godown', 'warehouse', 'location') || 'Main Showroom';
  const rack = getField('rack', 'shelf', 'bin') || 'Floor';
  const hsn = getField('hsn', 'hsncode', 'hsn_code') || '9403';
  const size = getField('size', 'dimension', 'dim') || '';
  const colour = getField('colour', 'color') || '';

  return {
    id: `prod-imp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    pCode,
    barcode,
    name,
    purchasePrice,
    mrp,
    retailPrice,
    wholesalePrice,
    openingStock: qty,
    cessPercent: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    conv: 1,
    category,
    subCategory,
    salesUnit,
    godown,
    rack,
    hsn,
    size,
    colour
  };
}

/**
 * Generates and downloads pre-formatted sample Excel/CSV templates
 */
export function downloadSampleCsvTemplate(type: 'products' | 'stock' | 'purchase' | 'outstanding') {
  let filename = '';
  let csvContent = '';

  if (type === 'products') {
    filename = 'SVF_Product_Import_Template.csv';
    csvContent = [
      'Product Code,Name,Barcode,Purchase Price,MRP,Retail Price,Wholesale Price,Opening Stock,Category,Sub Category,Sales Unit,HSN,Godown,Rack',
      'P-101,"Godrej Interio Slimline 2-Door Steel Almirah",8901102,18500,26500,24200,22000,10,"Living Room","Steel Almirah",Pcs,94031010,"Main Showroom","A-01"',
      'P-102,"Royal Teak Wood 3-Seater Premium Sofa",8901103,24000,34999,31500,29000,5,"Living Room","Wooden Sofa",Pcs,94016100,"Block 1","B-04"',
      'P-103,"Godrej Rhino Electronic Digital Safe 30L",8901104,9800,15000,13500,12200,8,"Office Furniture","Safes",Pcs,83030000,"Block 2","S-02"'
    ].join('\r\n');
  } else if (type === 'stock') {
    filename = 'SVF_Stock_Update_Template.csv';
    csvContent = [
      'Barcode,Product Code,Product Name,New Stock Qty,Purchase Price,Retail Price,Godown,Rack',
      '8901102,P-101,"Godrej Interio Slimline 2-Door Steel Almirah",15,18500,24200,"Main Showroom","A-01"',
      '8901103,P-102,"Royal Teak Wood 3-Seater Premium Sofa",8,24000,31500,"Block 1","B-04"',
      '8901104,P-103,"Godrej Rhino Electronic Digital Safe 30L",12,9800,13500,"Block 2","S-02"'
    ].join('\r\n');
  } else if (type === 'purchase') {
    filename = 'SVF_Purchase_Inward_Import_Template.csv';
    csvContent = [
      'Barcode,Product Code,Product Name,Qty,Purchase Price,MRP,Retail Price,HSN,Tax Percent',
      '8901102,P-101,"Godrej Interio Slimline 2-Door Steel Almirah",5,18500,26500,24200,94031010,12',
      '8901103,P-102,"Royal Teak Wood 3-Seater Premium Sofa",2,24000,34999,31500,94016100,12',
      '8901104,P-103,"Godrej Rhino Electronic Digital Safe 30L",4,9800,15000,13500,83030000,18'
    ].join('\r\n');
  } else {
    filename = 'SVF_Outstanding_Import_Template.csv';
    csvContent = [
      'Customer Name,Phone,Address,City,Opening Balance,Credit Limit',
      '"Ramesh Kumar",9448123456,"Near Main Bus Stand","Tiptur",15000,50000',
      '"Suresh Furniture Works",9880123456,"B.H. Road","Tiptur",28500,100000'
    ].join('\r\n');
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import * as XLSX from 'xlsx';

/**
 * Universal CSV Exporter for any table data
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const s = String(val);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return `"${s}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal Native Excel (.xlsx) Exporter using SheetJS
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  sheetName = 'Report'
) {
  const aoa = [headers, ...rows.map(r => r.map(c => c === undefined || c === null ? '' : c))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal JSON Exporter
 */
export function exportToJson(filename: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse native binary Excel (.xlsx / .xls) workbook to structured table rows
 */
export function parseExcelFile(arrayBuffer: ArrayBuffer): ParsedCsvResult {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!jsonData || jsonData.length === 0) {
    return { headers: [], rawHeaders: [], rows: [], totalRows: 0 };
  }
  const headers = (jsonData[0] || []).map(h => String(h || '').trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0 || row.every(c => c === undefined || c === null || String(c).trim() === '')) {
      continue;
    }
    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : '';
    });
    rows.push(rowObj);
  }
  return {
    headers: headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_')),
    rawHeaders: headers,
    rows,
    totalRows: rows.length
  };
}

/**
 * Parse JSON text to structured table rows
 */
export function parseJsonFile(jsonText: string): ParsedCsvResult {
  const parsed = JSON.parse(jsonText);
  const arr = Array.isArray(parsed) ? parsed : (parsed.items || parsed.products || parsed.data || [parsed]);
  if (!arr || arr.length === 0) {
    return { headers: [], rawHeaders: [], rows: [], totalRows: 0 };
  }
  const rawHeaders = Object.keys(arr[0]);
  const rows: Record<string, string>[] = arr.map((item: any) => {
    const rowObj: Record<string, string> = {};
    rawHeaders.forEach(h => {
      rowObj[h] = item[h] !== undefined && item[h] !== null ? String(item[h]) : '';
    });
    return rowObj;
  });
  return {
    headers: rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_')),
    rawHeaders,
    rows,
    totalRows: rows.length
  };
}


