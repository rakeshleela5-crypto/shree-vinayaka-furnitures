import type { Product } from '../../types/retailDaddy';

export type ElementType =
  | 'text'
  | 'barcode'
  | 'qrcode'
  | 'shape'
  | 'line'
  | 'spec_table'
  | 'image'
  | 'badge';

export interface SpecRow {
  label: string;
  value: string;
}

export interface LabelElement {
  id: string;
  type: ElementType;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  zIndex: number;
  rotation?: number; // 0, 90, 180, 270

  // Text properties
  content?: string;
  fontFamily?: string;
  fontSize?: number; // in pt
  fontWeight?: 'normal' | 'bold' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  wrap?: boolean;
  autoShrink?: boolean; // Shrinks font size if content exceeds bounding box
  stretch?: boolean; // Scales font size when dragging bounding box
  lineHeight?: number;

  // Barcode properties
  barcodeFormat?: 'CODE128' | 'EAN13';
  barcodeValue?: string;
  showText?: boolean;
  barcodeFontSize?: number;
  barcodeColor?: string;
  barcodeBg?: string;

  // QR Code properties
  qrValue?: string;
  qrColor?: string;
  qrBg?: string;
  qrErrorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  qrTitle?: string;

  // Shape properties (Rectangle / Box)
  shapeType?: 'rectangle' | 'circle';
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number; // in mm or px
  borderRadius?: number; // in mm

  // Line properties
  lineOrientation?: 'horizontal' | 'vertical';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineColor?: string;
  lineWidth?: number; // in mm

  // Spec Table properties
  specRows?: SpecRow[];
  headerBg?: string;
  tableBorderColor?: string;
  tableFontSize?: number;

  // Image & Badge properties
  imageUrl?: string;
  badgeId?: string;
  badgeTitle?: string;
  badgeSubtitle?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  unit: 'mm' | 'inch';
  backgroundColor: string;
  elements: LabelElement[];
  isPredefined?: boolean;
  presetKey?: '50x25' | '50x38' | '75x35' | '80x40' | '100x50' | '100x150' | 'custom';
}

export interface LabelPreset {
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
  type: 'sticker' | 'tag' | 'shelf' | 'hangtag';
}

export interface ExcelLabelRow {
  id: string;
  barcode: string;
  productName: string;
  skuCode: string;
  category: string;
  mrp: number;
  salePrice: number;
  discount: string;
  dimensions: string;
  material: string;
  finish: string;
  warranty: string;
  batchDate: string;
  copies: number;
  [key: string]: any;
}

export interface SerialGeneratorConfig {
  enabled: boolean;
  prefix: string;
  startNumber: number;
  padLength: number;
  suffix: string;
  totalLabels: number;
  currentStep: number;
}

export interface PrintEngineConfig {
  mode: 'THERMAL_ROLL' | 'A4_SHEET';
  thermalWidthMm: number;
  thermalHeightMm: number;
  a4Preset: '24_UP' | '40_UP' | '8_UP' | 'CUSTOM';
  a4Cols: number;
  a4Rows: number;
  a4MarginTopMm: number;
  a4MarginLeftMm: number;
  a4GapXMm: number;
  a4GapYMm: number;
}

export interface ProductInventorySelection {
  productId: string;
  product: Product;
  copies: number;
  selected: boolean;
}
