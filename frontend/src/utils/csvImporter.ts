/**
 * Shree Vinayaka Furnitures ERP - Universal CSV/Excel Importer & Parser
 */

export interface ParsedCsvResult {
  headers: string[];
  rawHeaders: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Robust CSV parser that handles quotes, escaped quotes (""), and commas
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
      } else if (c === ',' && !insideQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
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

/**
 * Universal CSV Exporter for any table data
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
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

