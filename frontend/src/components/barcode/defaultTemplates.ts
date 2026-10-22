import type { LabelTemplate, LabelPreset } from './types';

export const LABEL_PRESETS: LabelPreset[] = [
  {
    key: '50x25',
    name: '50mm × 25mm',
    widthMm: 50,
    heightMm: 25,
    description: 'Small Accessory / Hardware & Sample Swatch Sticker',
    type: 'sticker'
  },
  {
    key: '75x35',
    name: '75mm × 35mm',
    widthMm: 75,
    heightMm: 35,
    description: 'Standard Serial / Warehouse Carton Barcode Sticker',
    type: 'sticker'
  },
  {
    key: '80x40',
    name: '80mm × 40mm',
    widthMm: 80,
    heightMm: 40,
    description: 'Medium Furniture Box & Showroom Shelf Edge Label',
    type: 'shelf'
  },
  {
    key: '100x150',
    name: '100mm × 150mm (4"×6")',
    widthMm: 100,
    heightMm: 150,
    description: 'Luxury Vertical Showroom Furniture Hang-Tag / Tent Card',
    type: 'hangtag'
  }
];

export const DEFAULT_TEMPLATES: LabelTemplate[] = [
  // 1. 100x150mm (4x6") Vertical Showroom Furniture Hang-Tag
  {
    id: 'tpl-hangtag-100x150',
    name: '⭐ 100x150mm Luxury Showroom Hang-Tag',
    widthMm: 100,
    heightMm: 150,
    unit: 'mm',
    backgroundColor: '#ffffff',
    isPredefined: true,
    presetKey: '100x150',
    elements: [
      // Top Decorative Gold Header Band
      {
        id: 'el-header-box',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 14,
        zIndex: 1,
        fillColor: '#0f172a',
        borderColor: '#0f172a',
        borderWidth: 0,
        borderRadius: 0
      },
      // Store Title
      {
        id: 'el-store-title',
        type: 'text',
        content: 'SRI VINAYAKA FURNITURES',
        x: 2,
        y: 2,
        width: 96,
        height: 6,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
        color: '#f8fafc',
        autoShrink: true
      },
      // Store Subtitle
      {
        id: 'el-store-sub',
        type: 'text',
        content: 'ESTD 1994 • PREMIUM TEAK & GODREJ INTERIO SHOWROOM',
        x: 2,
        y: 8.5,
        width: 96,
        height: 4,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6.5,
        fontWeight: '700',
        textAlign: 'center',
        color: '#cbd5e1'
      },
      // Furniture Category Pill
      {
        id: 'el-category-pill',
        type: 'shape',
        shapeType: 'rectangle',
        x: 4,
        y: 17,
        width: 92,
        height: 5.5,
        zIndex: 1,
        fillColor: '#f1f5f9',
        borderColor: '#cbd5e1',
        borderWidth: 0.5,
        borderRadius: 2
      },
      {
        id: 'el-category-text',
        type: 'text',
        content: 'COLLECTION: {{category}}',
        x: 6,
        y: 18,
        width: 88,
        height: 4,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7.5,
        fontWeight: '800',
        textAlign: 'center',
        color: '#475569'
      },
      // Product Name (Bold, Auto-Shrink, Auto-Wrap)
      {
        id: 'el-product-name',
        type: 'text',
        content: '{{product_name}}',
        x: 4,
        y: 24,
        width: 92,
        height: 12,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0f172a',
        wrap: true,
        autoShrink: true,
        lineHeight: 1.2
      },
      // SKU & Model Code
      {
        id: 'el-sku-code',
        type: 'text',
        content: 'MODEL SKU: {{sku_code}}',
        x: 4,
        y: 37,
        width: 92,
        height: 4.5,
        zIndex: 2,
        fontFamily: "monospace, 'Courier New'",
        fontSize: 8,
        fontWeight: '700',
        textAlign: 'center',
        color: '#0369a1'
      },
      // Divider Line
      {
        id: 'el-divider-1',
        type: 'line',
        x: 4,
        y: 43,
        width: 92,
        height: 0.5,
        zIndex: 2,
        lineOrientation: 'horizontal',
        lineStyle: 'solid',
        lineColor: '#e2e8f0',
        lineWidth: 0.5
      },
      // Pricing Box Container
      {
        id: 'el-price-box',
        type: 'shape',
        shapeType: 'rectangle',
        x: 4,
        y: 45,
        width: 92,
        height: 20,
        zIndex: 1,
        fillColor: '#f8fafc',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4
      },
      // MRP Struck out
      {
        id: 'el-mrp-label',
        type: 'text',
        content: 'ORIGINAL MRP:',
        x: 8,
        y: 47.5,
        width: 40,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#64748b'
      },
      {
        id: 'el-mrp-val',
        type: 'text',
        content: '{{mrp}}',
        x: 8,
        y: 51,
        width: 40,
        height: 5.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'left',
        textDecoration: 'line-through',
        color: '#94a3b8'
      },
      // Special Offer Price (Large Green)
      {
        id: 'el-offer-label',
        type: 'text',
        content: 'SPECIAL SHOWROOM PRICE:',
        x: 50,
        y: 47.5,
        width: 44,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7,
        fontWeight: '900',
        textAlign: 'right',
        color: '#059669'
      },
      {
        id: 'el-offer-val',
        type: 'text',
        content: '{{sale_price}}',
        x: 46,
        y: 51,
        width: 48,
        height: 8.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 16,
        fontWeight: '900',
        textAlign: 'right',
        color: '#047857',
        autoShrink: true
      },
      // Tax Inclusion Note
      {
        id: 'el-tax-note',
        type: 'text',
        content: '(Inclusive of 18% GST • Delivery & Installation Included)',
        x: 6,
        y: 60.5,
        width: 88,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#047857'
      },
      // Furniture Specification Table (2-Column Grid)
      {
        id: 'el-spec-table',
        type: 'spec_table',
        x: 4,
        y: 68,
        width: 92,
        height: 32,
        zIndex: 2,
        tableFontSize: 7,
        headerBg: '#f1f5f9',
        tableBorderColor: '#cbd5e1',
        specRows: [
          { label: 'Dimensions (LxWxH)', value: '{{dimensions}}' },
          { label: 'Wood / Core Material', value: '{{material}}' },
          { label: 'Surface Finish', value: '{{finish}}' },
          { label: 'Manufacturer Warranty', value: '{{warranty}}' },
          { label: 'Care Instructions', value: 'Dry Microfiber Wipe • Avoid direct rain' }
        ]
      },
      // Trust Badge
      {
        id: 'el-trust-badge',
        type: 'badge',
        badgeId: 'pure-teak',
        x: 4,
        y: 102,
        width: 92,
        height: 11,
        zIndex: 2
      },
      // QR Code for Customer Scan & AR View
      {
        id: 'el-qr-code',
        type: 'qrcode',
        x: 6,
        y: 115,
        width: 25,
        height: 25,
        zIndex: 2,
        qrValue: 'https://srivinayakafurnitures.pages.dev/?sku={{sku_code}}&scan=1'
      },
      // QR Helper Text
      {
        id: 'el-qr-text-1',
        type: 'text',
        content: '📱 SCAN TO VIEW ON MOBILE',
        x: 34,
        y: 117,
        width: 62,
        height: 4,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7.5,
        fontWeight: '900',
        textAlign: 'left',
        color: '#0f172a'
      },
      {
        id: 'el-qr-text-2',
        type: 'text',
        content: 'View customer reviews, 3D space planner, warranty card, and EMI calculations on your phone!',
        x: 34,
        y: 121.5,
        width: 62,
        height: 8,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6.5,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#475569',
        wrap: true
      },
      // 1D Barcode SVG
      {
        id: 'el-barcode-1d',
        type: 'barcode',
        barcodeFormat: 'CODE128',
        barcodeValue: '{{barcode}}',
        x: 34,
        y: 131,
        width: 62,
        height: 10,
        zIndex: 2,
        showText: true,
        barcodeFontSize: 7
      },
      // Footer Bottom Strip
      {
        id: 'el-footer-strip',
        type: 'shape',
        shapeType: 'rectangle',
        x: 0,
        y: 144,
        width: 100,
        height: 6,
        zIndex: 1,
        fillColor: '#1e293b',
        borderColor: '#1e293b',
        borderWidth: 0
      },
      {
        id: 'el-footer-text',
        type: 'text',
        content: 'Opp. KSRTC Depot, Main Road, Palakkad • Phone: 0491-2522888',
        x: 2,
        y: 145.2,
        width: 96,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6.5,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#f8fafc'
      }
    ]
  },

  // 2. 80x40mm Medium Furniture Box & Shelf Price Label
  {
    id: 'tpl-shelf-80x40',
    name: '🏷️ 80x40mm Furniture Box & Shelf Price Label',
    widthMm: 80,
    heightMm: 40,
    unit: 'mm',
    backgroundColor: '#ffffff',
    isPredefined: true,
    presetKey: '80x40',
    elements: [
      // Top Border Brand Header
      {
        id: 'el-s80-header',
        type: 'text',
        content: 'SRI VINAYAKA FURNITURES',
        x: 2,
        y: 1.5,
        width: 76,
        height: 4,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 8,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0f172a'
      },
      // Product Name
      {
        id: 'el-s80-name',
        type: 'text',
        content: '{{product_name}}',
        x: 2,
        y: 6,
        width: 76,
        height: 5.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 9.5,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0284c7',
        autoShrink: true
      },
      // QR Code on Left
      {
        id: 'el-s80-qr',
        type: 'qrcode',
        x: 3,
        y: 13,
        width: 17,
        height: 17,
        zIndex: 2,
        qrValue: 'https://srivinayakafurnitures.pages.dev/?sku={{sku_code}}&scan=1'
      },
      // Pricing Section Center & Right
      {
        id: 'el-s80-mrp',
        type: 'text',
        content: 'MRP: {{mrp}}',
        x: 22,
        y: 13,
        width: 28,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'left',
        textDecoration: 'line-through',
        color: '#64748b'
      },
      {
        id: 'el-s80-offer',
        type: 'text',
        content: '{{sale_price}}',
        x: 22,
        y: 17,
        width: 32,
        height: 6.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'left',
        color: '#047857',
        autoShrink: true
      },
      {
        id: 'el-s80-disc-pill',
        type: 'shape',
        shapeType: 'rectangle',
        x: 56,
        y: 14,
        width: 21,
        height: 5,
        zIndex: 1,
        fillColor: '#fee2e2',
        borderColor: '#dc2626',
        borderWidth: 0.5,
        borderRadius: 2
      },
      {
        id: 'el-s80-disc-txt',
        type: 'text',
        content: '{{discount}}',
        x: 56,
        y: 15,
        width: 21,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6.5,
        fontWeight: '900',
        textAlign: 'center',
        color: '#b91c1c'
      },
      // SKU & Spec
      {
        id: 'el-s80-spec',
        type: 'text',
        content: 'SKU: {{sku_code}} • {{material}}',
        x: 22,
        y: 24,
        width: 55,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6.5,
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#334155'
      },
      // 1D Barcode Bottom
      {
        id: 'el-s80-bar',
        type: 'barcode',
        barcodeFormat: 'CODE128',
        barcodeValue: '{{barcode}}',
        x: 10,
        y: 29,
        width: 60,
        height: 9,
        zIndex: 2,
        showText: true,
        barcodeFontSize: 7
      }
    ]
  },

  // 3. 75x35mm Standard Serial & Barcode Sticker
  {
    id: 'tpl-serial-75x35',
    name: '📦 75x35mm Standard Serial & Barcode Sticker',
    widthMm: 75,
    heightMm: 35,
    unit: 'mm',
    backgroundColor: '#ffffff',
    isPredefined: true,
    presetKey: '75x35',
    elements: [
      {
        id: 'el-s75-header',
        type: 'text',
        content: 'SRI VINAYAKA FURNITURES - PALAKKAD',
        x: 2,
        y: 1.5,
        width: 71,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7.5,
        fontWeight: '900',
        textAlign: 'center',
        color: '#0f172a'
      },
      {
        id: 'el-s75-name',
        type: 'text',
        content: '{{product_name}}',
        x: 2,
        y: 5.5,
        width: 71,
        height: 4.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 8.5,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0284c7',
        autoShrink: true
      },
      {
        id: 'el-s75-sku-price',
        type: 'text',
        content: 'SKU: {{sku_code}} | MRP: {{mrp}} | SALE: {{sale_price}}',
        x: 2,
        y: 10.5,
        width: 71,
        height: 3.5,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#334155'
      },
      {
        id: 'el-s75-barcode',
        type: 'barcode',
        barcodeFormat: 'CODE128',
        barcodeValue: '{{barcode}}',
        x: 6,
        y: 15,
        width: 63,
        height: 14,
        zIndex: 2,
        showText: true,
        barcodeFontSize: 7.5
      },
      {
        id: 'el-s75-footer',
        type: 'text',
        content: 'BATCH: {{batch_date}} • WARRANTY: {{warranty}}',
        x: 2,
        y: 30.5,
        width: 71,
        height: 3,
        zIndex: 2,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#64748b'
      }
    ]
  }
];

export function resolveElementText(templateText: string, product: Record<string, any>): string {
  if (!templateText) return '';

  const rawSalePrice = typeof product.salePriceRaw === 'number'
    ? product.salePriceRaw
    : (typeof product.salePrice === 'number'
      ? product.salePrice
      : (typeof product.retailPrice === 'number'
        ? product.retailPrice
        : (parseFloat(String(product.salePrice || product.retailPrice || '0').replace(/[^0-9.]/g, '')) || 0)));

  const rawMrp = typeof product.mrpRaw === 'number'
    ? product.mrpRaw
    : (typeof product.mrp === 'number'
      ? product.mrp
      : (parseFloat(String(product.mrp || '0').replace(/[^0-9.]/g, '')) || 0));

  const sku = String(product.skuCode || product.pCode || product.sku_code || product.code || 'SVF-001');
  const barcode = String(product.barcode || product.skuCode || product.pCode || '1000101');
  const hsn = String(product.hsnCode || product.hsn || '9403');
  const brand = String(product.brand || 'Godrej Interio');
  const storeName = String(product.companyName || product.storeName || 'Shree Vinayaka Furnitures');
  const upiId = String(product.upiId || 'shreevinayaka@icici');
  const stock = String(product.openingStock ?? product.stock ?? product.qty ?? 0);
  const qrCodeVal = String(product.qrCode || barcode);

  return templateText
    .replace(/\{\{sale_price_raw\}\}/gi, rawSalePrice.toFixed(2))
    .replace(/\{\{sale_price_num\}\}/gi, String(rawSalePrice))
    .replace(/\{\{price_num\}\}/gi, String(rawSalePrice))
    .replace(/\{\{mrp_raw\}\}/gi, rawMrp.toFixed(2))
    .replace(/\{\{mrp_num\}\}/gi, String(rawMrp))
    .replace(/\{\{product_name\}\}/gi, String(product.productName || product.name || 'Premium Teakwood Furniture'))
    .replace(/\{\{sku_code\}\}/gi, sku)
    .replace(/\{\{p_code\}\}/gi, sku)
    .replace(/\{\{pcode\}\}/gi, sku)
    .replace(/\{\{item_code\}\}/gi, sku)
    .replace(/\{\{category\}\}/gi, String(product.category || 'Living & Showroom Furniture'))
    .replace(/\{\{mrp\}\}/gi, typeof product.mrp === 'number' ? `₹${product.mrp.toLocaleString('en-IN')}` : String(product.mrp || '₹0.00'))
    .replace(/\{\{sale_price\}\}/gi, typeof product.salePrice === 'number' ? `₹${product.salePrice.toLocaleString('en-IN')}` : (typeof product.retailPrice === 'number' ? `₹${product.retailPrice.toLocaleString('en-IN')}` : String(product.salePrice || '₹0.00')))
    .replace(/\{\{retail_price\}\}/gi, typeof product.retailPrice === 'number' ? `₹${product.retailPrice.toLocaleString('en-IN')}` : String(product.retailPrice || '₹0.00'))
    .replace(/\{\{price\}\}/gi, typeof product.salePrice === 'number' ? `₹${product.salePrice.toLocaleString('en-IN')}` : String(product.salePrice || '₹0.00'))
    .replace(/\{\{discount\}\}/gi, String(product.discount || 'Special Offer'))
    .replace(/\{\{dimensions\}\}/gi, String(product.dimensions || product.size || '78"L x 36"W x 34"H'))
    .replace(/\{\{size\}\}/gi, String(product.size || product.dimensions || 'Standard'))
    .replace(/\{\{material\}\}/gi, String(product.material || product.colour || 'Solid Nilambur Teakwood'))
    .replace(/\{\{colour\}\}/gi, String(product.colour || product.material || 'Standard'))
    .replace(/\{\{color\}\}/gi, String(product.colour || product.material || 'Standard'))
    .replace(/\{\{finish\}\}/gi, String(product.finish || 'Walnut Matt Melamine Polish'))
    .replace(/\{\{warranty\}\}/gi, String(product.warranty || '10 Years Warranty'))
    .replace(/\{\{batch_date\}\}/gi, String(product.batchDate || product.mfgDate || 'OCT 2026'))
    .replace(/\{\{mfg_date\}\}/gi, String(product.mfgDate || product.batchDate || 'OCT 2026'))
    .replace(/\{\{barcode\}\}/gi, barcode)
    .replace(/\{\{barcode_value\}\}/gi, barcode)
    .replace(/\{\{hsn\}\}/gi, hsn)
    .replace(/\{\{hsn_code\}\}/gi, hsn)
    .replace(/\{\{brand\}\}/gi, brand)
    .replace(/\{\{store_name\}\}/gi, storeName)
    .replace(/\{\{company_name\}\}/gi, storeName)
    .replace(/\{\{upi_id\}\}/gi, upiId)
    .replace(/\{\{stock\}\}/gi, stock)
    .replace(/\{\{opening_stock\}\}/gi, stock)
    .replace(/\{\{qty\}\}/gi, stock)
    .replace(/\{\{qr_code\}\}/gi, qrCodeVal)
    .replace(/\{\{qrcode\}\}/gi, qrCodeVal);
}
