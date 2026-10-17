import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Barcode128Props {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  text?: string;
  lineColor?: string;
  background?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Barcode128({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 36,
  displayValue = true,
  fontSize = 11,
  margin = 4,
  text,
  lineColor = '#000000',
  background = '#ffffff',
  className,
  style
}: Barcode128Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value.trim(), {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        text,
        lineColor,
        background,
        valid: (valid) => {
          if (!valid) {
            console.warn(`[Barcode128] Value "${value}" could not be encoded as ${format}`);
          }
        }
      });
    } catch (err) {
      console.error('[Barcode128] Rendering error:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, margin, text, lineColor, background]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ display: 'block', maxWidth: '100%', ...style }}
    />
  );
}
