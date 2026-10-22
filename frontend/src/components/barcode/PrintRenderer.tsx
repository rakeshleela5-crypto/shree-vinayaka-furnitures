import { useEffect, useState } from 'react';
import type { LabelTemplate, PrintEngineConfig } from './types';
import { resolveElementText } from './defaultTemplates';
import { TRUST_BADGES, renderBadgeSvg } from './badges';
import { Barcode128 } from '../common/Barcode128';
import QRCode from 'qrcode';

interface PrintRendererProps {
  template: LabelTemplate;
  labelsToPrint: Array<{ data: Record<string, any>; copies: number }>;
  config: PrintEngineConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: () => void;
}

export function PrintRenderer({
  template,
  labelsToPrint,
  config,
  isOpen,
  onClose,
  onConfirmPrint
}: PrintRendererProps) {
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);

  // Flatten copies
  const flatLabels: Array<Record<string, any>> = [];
  labelsToPrint.forEach(item => {
    const count = item.copies || 1;
    for (let i = 0; i < count; i++) {
      flatLabels.push(item.data);
    }
  });

  // Pre-generate QR codes for all distinct values
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const generateAllQrs = async () => {
      const qrElements = template.elements.filter(el => el.type === 'qrcode');
      const cache: Record<string, string> = {};

      for (const item of flatLabels) {
        for (const el of qrElements) {
          const rawVal = el.qrValue || 'https://srivinayakafurnitures.pages.dev/?sku={{sku_code}}&scan=1';
          const resolved = resolveElementText(rawVal, item);
          const key = `${el.id}-${resolved}`;
          if (!cache[key]) {
            try {
              const url = await QRCode.toDataURL(resolved, {
                errorCorrectionLevel: (el.qrErrorCorrectionLevel as any) || 'M',
                margin: 1,
                color: {
                  dark: el.qrColor || '#000000',
                  light: el.qrBg || '#ffffff'
                }
              });
              cache[key] = url;
            } catch (err) {
              console.warn('QR cache error:', err);
            }
          }
        }
      }

      if (active) {
        setQrCache(cache);
        setIsReady(true);
      }
    };

    generateAllQrs();
    return () => { active = false; };
  }, [isOpen, template.elements, labelsToPrint]);

  // Inject dynamic print CSS into head when printing
  const executeBrowserPrint = () => {
    const styleId = 'svf-exact-print-css';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    if (config.mode === 'THERMAL_ROLL') {
      styleEl.innerHTML = `
        @media print {
          @page {
            size: ${template.widthMm}mm ${template.heightMm}mm;
            margin: 0mm !important;
          }
          body * {
            visibility: hidden;
          }
          #svf-print-root, #svf-print-root * {
            visibility: visible;
          }
          #svf-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${template.widthMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .svf-thermal-page {
            width: ${template.widthMm}mm !important;
            height: ${template.heightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        }
      `;
    } else {
      // A4 Multi-Sticker Sheet Mode
      styleEl.innerHTML = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          body * {
            visibility: hidden;
          }
          #svf-print-root, #svf-print-root * {
            visibility: visible;
          }
          #svf-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: ${config.a4MarginTopMm || 10}mm ${config.a4MarginLeftMm || 10}mm !important;
            background: transparent !important;
            box-sizing: border-box !important;
          }
          .svf-a4-grid {
            display: grid !important;
            grid-template-columns: repeat(${config.a4Cols || 3}, ${template.widthMm}mm) !important;
            gap: ${config.a4GapYMm || 2}mm ${config.a4GapXMm || 2}mm !important;
            justify-content: start !important;
            align-content: start !important;
          }
          .svf-thermal-page {
            width: ${template.widthMm}mm !important;
            height: ${template.heightMm}mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `;
    }

    setTimeout(() => {
      window.print();
      onConfirmPrint();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 99995, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="rd-modal-content"
        style={{
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ background: '#0f172a', padding: '12px 20px', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🖨️</span>
              <span>EXACT-SIZE THERMAL ROLL & A4 PRINT ENGINE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Printing <strong style={{ color: '#4ade80' }}>{flatLabels.length} Total Labels</strong> ({template.widthMm}mm × {template.heightMm}mm) • Mode: <strong>{config.mode === 'THERMAL_ROLL' ? 'Direct Thermal Roll' : 'A4 Multi-Sticker Sheet'}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Print Configuration Controls */}
        <div style={{ background: '#f8fafc', padding: '10px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginRight: '6px' }}>Print Mode:</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '3px 8px',
              borderRadius: '3px',
              background: config.mode === 'THERMAL_ROLL' ? '#dcfce7' : '#e0f2fe',
              color: config.mode === 'THERMAL_ROLL' ? '#15803d' : '#0369a1'
            }}>
              {config.mode === 'THERMAL_ROLL' ? '⚡ Continuous Thermal Roll' : '📄 A4 Multi-Up Sticker Grid'}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Printer Target: <strong>TSC / Zebra / TVS / Honeywell / Standard A4</strong>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
            ✓ Zero margin @page injection active
          </div>
        </div>

        {/* Live Scrollable Preview Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#334155', display: 'flex', justifyContent: 'center' }}>
          <div
            id="svf-print-root"
            className={config.mode === 'A4_SHEET' ? 'svf-a4-grid' : ''}
            style={{
              display: config.mode === 'A4_SHEET' ? 'grid' : 'flex',
              flexDirection: config.mode === 'A4_SHEET' ? undefined : 'column',
              gridTemplateColumns: config.mode === 'A4_SHEET' ? `repeat(${config.a4Cols || 3}, ${template.widthMm}mm)` : undefined,
              gap: config.mode === 'A4_SHEET' ? `${config.a4GapYMm || 2}mm ${config.a4GapXMm || 2}mm` : '15px',
              alignItems: 'center'
            }}
          >
            {flatLabels.map((item, idx) => (
              <div
                key={idx}
                className="svf-thermal-page"
                style={{
                  width: `${template.widthMm}mm`,
                  height: `${template.heightMm}mm`,
                  position: 'relative',
                  background: template.backgroundColor || '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}
              >
                {template.elements.map(el => {
                  const resolvedText = resolveElementText(el.content || '', item);
                  const qrKey = `${el.id}-${resolveElementText(el.qrValue || '', item)}`;

                  return (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: `${el.x}mm`,
                        top: `${el.y}mm`,
                        width: `${el.width}mm`,
                        height: `${el.height}mm`,
                        zIndex: el.zIndex || 1,
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Text */}
                      {el.type === 'text' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: el.textAlign === 'center' ? 'center' : (el.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                            fontFamily: el.fontFamily || "'Segoe UI', Roboto, sans-serif",
                            fontSize: `${(el.fontSize || 10) * 0.3527}mm`,
                            fontWeight: el.fontWeight || 'normal',
                            fontStyle: el.fontStyle || 'normal',
                            textDecoration: el.textDecoration || 'none',
                            color: el.color || '#000000',
                            backgroundColor: el.backgroundColor || 'transparent',
                            textAlign: el.textAlign || 'left',
                            whiteSpace: el.wrap ? 'normal' : 'nowrap',
                            wordBreak: el.wrap ? 'break-word' : 'normal',
                            lineHeight: el.lineHeight || 1.15
                          }}
                        >
                          {resolvedText}
                        </div>
                      )}

                      {/* Barcode */}
                      {el.type === 'barcode' && (() => {
                        const codeVal = resolveElementText(el.barcodeValue || '{{barcode}}', item);
                        return (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Barcode128
                              value={codeVal || '1000101'}
                              format={el.barcodeFormat || 'CODE128'}
                              width={1.1}
                              height={el.height * 2.8}
                              displayValue={el.showText !== false}
                              fontSize={(el.barcodeFontSize || 8) * 1.1}
                              margin={0}
                              lineColor={el.barcodeColor || '#000000'}
                              background={el.barcodeBg || '#ffffff'}
                            />
                          </div>
                        );
                      })()}

                      {/* QR Code */}
                      {el.type === 'qrcode' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {qrCache[qrKey] && (
                            <img
                              src={qrCache[qrKey]}
                              alt="QR"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          )}
                        </div>
                      )}

                      {/* Shapes */}
                      {el.type === 'shape' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: el.fillColor || 'transparent',
                            border: `${el.borderWidth || 0.5}mm solid ${el.borderColor || '#cbd5e1'}`,
                            borderRadius: `${el.borderRadius || 0}mm`,
                            boxSizing: 'border-box'
                          }}
                        />
                      )}

                      {/* Lines */}
                      {el.type === 'line' && (
                        <div
                          style={{
                            width: el.lineOrientation === 'vertical' ? `${el.lineWidth || 0.5}mm` : '100%',
                            height: el.lineOrientation === 'vertical' ? '100%' : `${el.lineWidth || 0.5}mm`,
                            backgroundColor: el.lineColor || '#cbd5e1'
                          }}
                        />
                      )}

                      {/* Spec Table */}
                      {el.type === 'spec_table' && (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            border: `0.3mm solid ${el.tableBorderColor || '#cbd5e1'}`,
                            borderRadius: '1mm',
                            overflow: 'hidden',
                            fontSize: `${(el.tableFontSize || 7) * 0.3527}mm`,
                            fontFamily: "'Segoe UI', Roboto, sans-serif",
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <div
                            style={{
                              background: el.headerBg || '#f1f5f9',
                              padding: '0.4mm 1mm',
                              fontWeight: '900',
                              borderBottom: `0.3mm solid ${el.tableBorderColor || '#cbd5e1'}`,
                              color: '#1e293b',
                              textAlign: 'center'
                            }}
                          >
                            FURNITURE SPECIFICATIONS
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {(el.specRows || []).map((row, rIdx) => {
                              const resolvedVal = resolveElementText(row.value, item);
                              return (
                                <div
                                  key={rIdx}
                                  style={{
                                    display: 'flex',
                                    flex: 1,
                                    borderBottom: rIdx < (el.specRows?.length || 0) - 1 ? `0.2mm solid ${el.tableBorderColor || '#e2e8f0'}` : 'none',
                                    background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa'
                                  }}
                                >
                                  <div style={{ width: '42%', padding: '0.3mm 1mm', fontWeight: 'bold', color: '#475569', borderRight: `0.2mm solid ${el.tableBorderColor || '#e2e8f0'}` }}>
                                    {row.label}
                                  </div>
                                  <div style={{ width: '58%', padding: '0.3mm 1mm', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    {resolvedVal}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      {el.type === 'badge' && (() => {
                        const badgeDef = TRUST_BADGES.find(b => b.id === el.badgeId) || TRUST_BADGES[0];
                        return (
                          <div
                            style={{ width: '100%', height: '100%' }}
                            dangerouslySetInnerHTML={{
                              __html: renderBadgeSvg(badgeDef, el.width * 3.78, el.height * 3.78)
                            }}
                          />
                        );
                      })()}

                      {/* Image */}
                      {el.type === 'image' && el.imageUrl && (
                        <img
                          src={el.imageUrl}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#f8fafc', padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            💡 Tip: In the browser print dialog, set Margins to <strong>"None"</strong> and Destination to your <strong>Thermal Barcode Printer</strong>.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={executeBrowserPrint}
              disabled={!isReady}
              style={{
                padding: '8px 24px',
                fontSize: '12px',
                fontWeight: '900',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: isReady ? 'pointer' : 'wait',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ Send to Printer ({flatLabels.length} Stickers)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
