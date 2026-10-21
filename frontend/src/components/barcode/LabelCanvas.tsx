import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { LabelElement, LabelTemplate } from './types';
import { resolveElementText } from './defaultTemplates';
import { TRUST_BADGES, renderBadgeSvg } from './badges';
import { Barcode128 } from '../common/Barcode128';
import QRCode from 'qrcode';

interface LabelCanvasProps {
  template: LabelTemplate;
  activeProductData: Record<string, any>;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: LabelElement) => void;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  snapGrid: boolean;
  gridSizeMm: number;
  showGridLines: boolean;
  onCanvasDoubleClick?: () => void;
}

// Convert 1mm to screen pixels at 96 DPI: 1 inch = 25.4mm = 96px => 1mm = 3.779527559px
const MM_TO_PX = 3.779527559;

export function LabelCanvas({
  template,
  activeProductData,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  zoom,
  setZoom,
  snapGrid,
  gridSizeMm = 1,
  showGridLines = true
}: LabelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging & Resizing State
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [initialResizeState, setInitialResizeState] = useState<{
    element: LabelElement;
    startX: number;
    startY: number;
  } | null>(null);

  // Cache for generated QR code data URLs
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  // Helper: Snap value to grid in mm
  const snapVal = useCallback((val: number): number => {
    if (!snapGrid) return Number(val.toFixed(2));
    const step = gridSizeMm || 1;
    return Number((Math.round(val / step) * step).toFixed(2));
  }, [snapGrid, gridSizeMm]);

  // Keyboard navigation & spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse wheel zoom (25% to 400%)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || isSpacePressed) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prev) => Math.min(4.0, Math.max(0.25, Number((prev + delta).toFixed(2)))));
    }
  };

  // Generate QR Code data URLs when elements or product data changes
  useEffect(() => {
    let active = true;
    const generateQrs = async () => {
      const qrElements = template.elements.filter(el => el.type === 'qrcode');
      const updates: Record<string, string> = {};

      for (const el of qrElements) {
        const rawVal = el.qrValue || 'https://srivinayakafurnitures.pages.dev/?sku={{sku_code}}&scan=1';
        const resolved = resolveElementText(rawVal, activeProductData);
        try {
          const url = await QRCode.toDataURL(resolved, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
              dark: el.qrColor || '#000000',
              light: el.qrBg || '#ffffff'
            }
          });
          updates[el.id] = url;
        } catch (err) {
          console.warn('QR render error:', err);
        }
      }

      if (active) {
        setQrCache(prev => ({ ...prev, ...updates }));
      }
    };

    generateQrs();
    return () => { active = false; };
  }, [template.elements, activeProductData]);

  // Dragging element start
  const handleElementMouseDown = (e: React.MouseEvent, element: LabelElement) => {
    e.stopPropagation();
    if (isSpacePressed || e.button === 1) return; // Ignore if panning

    onSelectElement(element.id);
    setDraggingElementId(element.id);

    // Calculate click offset in mm
    const canvasRect = containerRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseXOnCanvasMm = (e.clientX - canvasRect.left - panOffset.x) / (MM_TO_PX * zoom);
    const mouseYOnCanvasMm = (e.clientY - canvasRect.top - panOffset.y) / (MM_TO_PX * zoom);

    setDragOffset({
      x: mouseXOnCanvasMm - element.x,
      y: mouseYOnCanvasMm - element.y
    });
  };

  // Resize handle mouse down
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string, element: LabelElement) => {
    e.stopPropagation();
    setResizingHandle(handle);
    setInitialResizeState({
      element: { ...element },
      startX: e.clientX,
      startY: e.clientY
    });
  };

  // Global mouse move for drag & resize
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y
      });
      return;
    }

    const canvasRect = containerRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Moving element
    if (draggingElementId) {
      const el = template.elements.find(x => x.id === draggingElementId);
      if (!el) return;

      const mouseXOnCanvasMm = (e.clientX - canvasRect.left - panOffset.x) / (MM_TO_PX * zoom);
      const mouseYOnCanvasMm = (e.clientY - canvasRect.top - panOffset.y) / (MM_TO_PX * zoom);

      const rawNewX = mouseXOnCanvasMm - dragOffset.x;
      const rawNewY = mouseYOnCanvasMm - dragOffset.y;

      const newX = Math.max(0, Math.min(template.widthMm - el.width, snapVal(rawNewX)));
      const newY = Math.max(0, Math.min(template.heightMm - el.height, snapVal(rawNewY)));

      if (newX !== el.x || newY !== el.y) {
        onUpdateElement({ ...el, x: newX, y: newY });
      }
      return;
    }

    // Resizing element
    if (resizingHandle && initialResizeState) {
      const { element: orig, startX, startY } = initialResizeState;
      const deltaXMm = (e.clientX - startX) / (MM_TO_PX * zoom);
      const deltaYMm = (e.clientY - startY) / (MM_TO_PX * zoom);

      let newX = orig.x;
      let newY = orig.y;
      let newW = orig.width;
      let newH = orig.height;

      if (resizingHandle.includes('e')) {
        newW = Math.max(5, snapVal(orig.width + deltaXMm));
      }
      if (resizingHandle.includes('w')) {
        const potentialW = snapVal(orig.width - deltaXMm);
        if (potentialW >= 5) {
          newW = potentialW;
          newX = snapVal(orig.x + deltaXMm);
        }
      }
      if (resizingHandle.includes('s')) {
        newH = Math.max(4, snapVal(orig.height + deltaYMm));
      }
      if (resizingHandle.includes('n')) {
        const potentialH = snapVal(orig.height - deltaYMm);
        if (potentialH >= 4) {
          newH = potentialH;
          newY = snapVal(orig.y + deltaYMm);
        }
      }

      // If text element has stretch enabled, calculate scaled font size
      let newFontSize = orig.fontSize;
      if (orig.type === 'text' && orig.stretch && orig.height > 0) {
        const scaleFactor = newH / orig.height;
        newFontSize = Math.max(5, Math.min(72, Math.round((orig.fontSize || 10) * scaleFactor)));
      }

      onUpdateElement({
        ...orig,
        x: newX,
        y: newY,
        width: newW,
        height: newH,
        fontSize: newFontSize
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingElementId(null);
    setResizingHandle(null);
    setInitialResizeState(null);
  };

  const handleCanvasContainerMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1 || e.target === containerRef.current) {
      setIsPanning(true);
      setStartPanPos({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      if (e.target === containerRef.current) {
        onSelectElement(null);
      }
    }
  };

  // Dimensions in screen pixels
  const canvasWidthPx = template.widthMm * MM_TO_PX * zoom;
  const canvasHeightPx = template.heightMm * MM_TO_PX * zoom;

  // Selected element object
  const selectedElement = useMemo(() => {
    return template.elements.find(el => el.id === selectedElementId) || null;
  }, [template.elements, selectedElementId]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0f172a',
        cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Millimeter Rulers (Top & Left) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 20,
          right: 0,
          height: '20px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          overflow: 'hidden',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <svg width="100%" height="20">
          {Array.from({ length: Math.ceil(template.widthMm / 5) + 1 }).map((_, idx) => {
            const mm = idx * 5;
            const px = panOffset.x + mm * MM_TO_PX * zoom;
            const isTen = mm % 10 === 0;
            return (
              <g key={`r-x-${mm}`}>
                <line
                  x1={px}
                  y1={isTen ? 6 : 12}
                  x2={px}
                  y2={20}
                  stroke={isTen ? '#94a3b8' : '#475569'}
                  strokeWidth={1}
                />
                {isTen && (
                  <text
                    x={px + 2}
                    y={10}
                    fontSize={8}
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 0,
          bottom: 0,
          width: '20px',
          background: '#1e293b',
          borderRight: '1px solid #334155',
          overflow: 'hidden',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <svg width="20" height="100%">
          {Array.from({ length: Math.ceil(template.heightMm / 5) + 1 }).map((_, idx) => {
            const mm = idx * 5;
            const py = panOffset.y + mm * MM_TO_PX * zoom;
            const isTen = mm % 10 === 0;
            return (
              <g key={`r-y-${mm}`}>
                <line
                  x1={isTen ? 6 : 12}
                  y1={py}
                  x2={20}
                  y2={py}
                  stroke={isTen ? '#94a3b8' : '#475569'}
                  strokeWidth={1}
                />
                {isTen && (
                  <text
                    x={2}
                    y={py + 8}
                    fontSize={7.5}
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {mm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top-Left Ruler Origin Square */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          background: '#0f172a',
          borderRight: '1px solid #334155',
          borderBottom: '1px solid #334155',
          zIndex: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: '#64748b',
          fontWeight: 'bold'
        }}
      >
        mm
      </div>

      {/* Canvas Sheet (The Physical Sticker/Tag) */}
      <div
        style={{
          position: 'absolute',
          left: `${panOffset.x}px`,
          top: `${panOffset.y}px`,
          width: `${canvasWidthPx}px`,
          height: `${canvasHeightPx}px`,
          background: template.backgroundColor || '#ffffff',
          boxShadow: '0 20px 45px rgba(0,0,0,0.6), 0 0 0 1px #475569',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        {/* Optional Snap Grid Dots / Lines */}
        {showGridLines && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
              backgroundSize: `${(gridSizeMm || 2) * MM_TO_PX * zoom}px ${(gridSizeMm || 2) * MM_TO_PX * zoom}px`,
              opacity: 0.25
            }}
          />
        )}

        {/* Render Each Label Element */}
        {template.elements.map(el => {
          const isSelected = el.id === selectedElementId;
          const elXPx = el.x * MM_TO_PX * zoom;
          const elYPx = el.y * MM_TO_PX * zoom;
          const elWPx = el.width * MM_TO_PX * zoom;
          const elHPx = el.height * MM_TO_PX * zoom;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              style={{
                position: 'absolute',
                left: `${elXPx}px`,
                top: `${elYPx}px`,
                width: `${elWPx}px`,
                height: `${elHPx}px`,
                zIndex: el.zIndex || 1,
                cursor: isSpacePressed ? 'grab' : 'move',
                outline: isSelected ? '2px solid #0284c7' : 'none',
                boxSizing: 'border-box'
              }}
            >
              {/* Element Render Body */}
              <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                {/* 1. TEXT ELEMENT */}
                {el.type === 'text' && (() => {
                  const resolved = resolveElementText(el.content || '', activeProductData);
                  const effectiveFontSizePx = (el.fontSize || 10) * 1.333 * zoom;
                  return (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: el.textAlign === 'center' ? 'center' : (el.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                        fontFamily: el.fontFamily || "'Segoe UI', Roboto, sans-serif",
                        fontSize: `${effectiveFontSizePx}px`,
                        fontWeight: el.fontWeight || 'normal',
                        fontStyle: el.fontStyle || 'normal',
                        textDecoration: el.textDecoration || 'none',
                        color: el.color || '#000000',
                        backgroundColor: el.backgroundColor || 'transparent',
                        textAlign: el.textAlign || 'left',
                        whiteSpace: el.wrap ? 'normal' : 'nowrap',
                        wordBreak: el.wrap ? 'break-word' : 'normal',
                        lineHeight: el.lineHeight || 1.15,
                        padding: '1px 2px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {resolved}
                    </div>
                  );
                })()}

                {/* 2. 1D BARCODE ELEMENT */}
                {el.type === 'barcode' && (() => {
                  const resolvedCode = resolveElementText(el.barcodeValue || '{{barcode}}', activeProductData);
                  return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Barcode128
                        value={resolvedCode || '1000101'}
                        format={el.barcodeFormat || 'CODE128'}
                        width={Math.max(0.7, 1.2 * zoom)}
                        height={Math.max(12, el.height * MM_TO_PX * zoom * 0.7)}
                        displayValue={el.showText !== false}
                        fontSize={Math.max(7, (el.barcodeFontSize || 8) * zoom)}
                        margin={0}
                        lineColor={el.barcodeColor || '#000000'}
                        background={el.barcodeBg || '#ffffff'}
                      />
                    </div>
                  );
                })()}

                {/* 3. 2D QR CODE ELEMENT */}
                {el.type === 'qrcode' && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {qrCache[el.id] ? (
                      <img
                        src={qrCache[el.id]}
                        alt="QR Code"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ fontSize: '10px', color: '#64748b' }}>QR Loading...</div>
                    )}
                  </div>
                )}

                {/* 4. RECTANGLE / SHAPE */}
                {el.type === 'shape' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.fillColor || 'transparent',
                      border: `${(el.borderWidth || 1) * zoom}px solid ${el.borderColor || '#cbd5e1'}`,
                      borderRadius: `${(el.borderRadius || 0) * MM_TO_PX * zoom}px`,
                      boxSizing: 'border-box'
                    }}
                  />
                )}

                {/* 5. DIVIDER LINE */}
                {el.type === 'line' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: el.lineOrientation === 'vertical' ? `${(el.lineWidth || 1) * zoom}px` : '100%',
                        height: el.lineOrientation === 'vertical' ? '100%' : `${(el.lineWidth || 1) * zoom}px`,
                        backgroundColor: el.lineColor || '#cbd5e1',
                        borderStyle: el.lineStyle || 'solid'
                      }}
                    />
                  </div>
                )}

                {/* 6. FURNITURE SPECIFICATION TABLE WIDGET */}
                {el.type === 'spec_table' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: `1px solid ${el.tableBorderColor || '#cbd5e1'}`,
                      borderRadius: '3px',
                      overflow: 'hidden',
                      fontSize: `${(el.tableFontSize || 7) * 1.333 * zoom}px`,
                      fontFamily: "'Segoe UI', Roboto, sans-serif",
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      style={{
                        background: el.headerBg || '#f1f5f9',
                        padding: '2px 4px',
                        fontWeight: '900',
                        fontSize: `${((el.tableFontSize || 7) + 0.5) * 1.333 * zoom}px`,
                        borderBottom: `1px solid ${el.tableBorderColor || '#cbd5e1'}`,
                        color: '#1e293b',
                        textAlign: 'center'
                      }}
                    >
                      FURNITURE SPECIFICATIONS
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {(el.specRows || []).map((row, rIdx) => {
                        const resolvedVal = resolveElementText(row.value, activeProductData);
                        return (
                          <div
                            key={rIdx}
                            style={{
                              display: 'flex',
                              flex: 1,
                              borderBottom: rIdx < (el.specRows?.length || 0) - 1 ? `1px solid ${el.tableBorderColor || '#e2e8f0'}` : 'none',
                              background: rIdx % 2 === 0 ? '#ffffff' : '#fafafa'
                            }}
                          >
                            <div
                              style={{
                                width: '42%',
                                padding: '1px 4px',
                                fontWeight: '700',
                                color: '#475569',
                                borderRight: `1px solid ${el.tableBorderColor || '#e2e8f0'}`,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {row.label}
                            </div>
                            <div
                              style={{
                                width: '58%',
                                padding: '1px 4px',
                                fontWeight: '600',
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {resolvedVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. TRUST BADGE */}
                {el.type === 'badge' && (() => {
                  const badgeDef = TRUST_BADGES.find(b => b.id === el.badgeId) || TRUST_BADGES[0];
                  return (
                    <div
                      style={{ width: '100%', height: '100%' }}
                      dangerouslySetInnerHTML={{
                        __html: renderBadgeSvg(badgeDef, elWPx, elHPx)
                      }}
                    />
                  );
                })()}

                {/* 8. UPLOADED STORE LOGO / IMAGE */}
                {el.type === 'image' && el.imageUrl && (
                  <img
                    src={el.imageUrl}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>

              {/* 8 Resize Handles when selected */}
              {isSelected && (
                <>
                  {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => {
                    const handlePositions: Record<string, React.CSSProperties> = {
                      nw: { top: -4, left: -4, cursor: 'nwse-resize' },
                      n: { top: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' },
                      ne: { top: -4, right: -4, cursor: 'nesw-resize' },
                      e: { top: '50%', right: -4, marginTop: -4, cursor: 'ew-resize' },
                      se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
                      s: { bottom: -4, left: '50%', marginLeft: -4, cursor: 'ns-resize' },
                      sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
                      w: { top: '50%', left: -4, marginTop: -4, cursor: 'ew-resize' }
                    };

                    return (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeHandleMouseDown(e, handle, el)}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          background: '#0284c7',
                          border: '1.5px solid #ffffff',
                          borderRadius: '1px',
                          zIndex: 999,
                          ...handlePositions[handle]
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Element Floating Dimension Chip */}
      {selectedElement && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 28,
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#f8fafc',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 100,
            border: '1px solid #334155',
            display: 'flex',
            gap: '8px'
          }}
        >
          <span>X: {selectedElement.x}mm</span>
          <span>Y: {selectedElement.y}mm</span>
          <span>W: {selectedElement.width}mm</span>
          <span>H: {selectedElement.height}mm</span>
          <span style={{ color: '#38bdf8' }}>[{selectedElement.type.toUpperCase()}]</span>
        </div>
      )}
    </div>
  );
}
