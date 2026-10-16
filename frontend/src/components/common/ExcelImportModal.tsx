import React, { useState, useRef } from 'react';
import { parseCsvText, downloadSampleCsvTemplate, type ParsedCsvResult } from '../../utils/csvImporter';

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type: 'products' | 'stock' | 'purchase' | 'outstanding';
  onConfirmImport: (rows: Record<string, string>[]) => void;
  subtitle?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title = '📥 Import Data from Excel / CSV Spreadsheet',
  type,
  onConfirmImport,
  subtitle
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    const isBinaryExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const result = parseCsvText(text);
        if (result.totalRows === 0) {
          if (isBinaryExcel) {
            setErrorMessage('Notice: This .xlsx workbook file cannot be read directly as text. Please open it in Excel and select "Save As" -> "CSV (Comma delimited) (*.csv)", then upload that CSV file here for instant import.');
          } else {
            setErrorMessage('The uploaded file appears to be empty or has no readable data rows.');
          }
          setParsedData(null);
        } else {
          setParsedData(result);
        }
      } catch (err: any) {
        setErrorMessage('Failed to read and parse file: ' + (err.message || String(err)));
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file from disk.');
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = async () => {
    if (!parsedData || parsedData.rows.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await Promise.resolve(onConfirmImport(parsedData.rows));
      setIsProcessing(false);
      onClose();
    } catch (e: any) {
      console.error('Import processing error:', e);
      setIsProcessing(false);
      setErrorMessage('Error processing imported rows: ' + (e.message || String(e)));
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #22c55e'
          }}
        >
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#86efac' }}>
              {title}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {subtitle || 'Upload formatted CSV or Excel exports to batch import directly into your system.'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '3px',
              padding: '4px 10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Instructions & Template Download Bar */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '12px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#166534' }}>
                💡 Need the correct spreadsheet column layout?
              </div>
              <div style={{ fontSize: '11px', color: '#15803d' }}>
                Download our ready-to-fill sample template with Shree Vinayaka Furnitures headers.
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleCsvTemplate(type)}
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📥</span> Download Sample CSV Template
            </button>
          </div>

          {/* File Upload Box */}
          <div
            style={{
              border: '2px dashed #94a3b8',
              borderRadius: '6px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .txt, .tsv, .xlsx, .xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>📁</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
              {selectedFile ? `Selected File: ${selectedFile.name}` : 'Click here or drag-and-drop your CSV or Excel file'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Supported formats: .CSV (Comma Separated Values), .TSV, or plain text export
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid #f87171'
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f172a' }}>
                  ✓ Found <strong>{parsedData.totalRows}</strong> records across <strong>{parsedData.rawHeaders.length}</strong> columns. (Showing first 8 preview rows):
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Choose Different File
                </button>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>#</th>
                      {parsedData.rawHeaders.map((h, i) => (
                        <th key={i} style={{ padding: '6px 8px', border: '1px solid #334155', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'center' }}>
                          {rIdx + 1}
                        </td>
                        {parsedData.rawHeaders.map((rh, cIdx) => (
                          <td key={cIdx} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                            {row[rh] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parsedData || parsedData.totalRows === 0 || isProcessing}
            onClick={handleConfirm}
            style={{
              backgroundColor: !parsedData || parsedData.totalRows === 0 || isProcessing ? '#94a3b8' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: !parsedData || parsedData.totalRows === 0 || isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isProcessing ? 'Processing Import...' : `✓ Import ${parsedData ? `${parsedData.totalRows} Records` : 'Now'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
