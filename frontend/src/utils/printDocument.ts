/**
 * Isolated Document Printing Engine for Shree Vinayaka Furnitures
 * 
 * Bypasses modal overlays, position:fixed backdrops, and CSS transform/overflow containing blocks.
 * Copies the exact rendered bill/quotation HTML into a dedicated hidden iframe with full styles
 * and triggers crystal-clear browser printing (or Save as PDF) without any blank white screens.
 */

export interface PrintDocumentOptions {
  title?: string;
  autoCloseTimeoutMs?: number;
}

export function printDocumentElement(
  target: string | HTMLElement,
  options: PrintDocumentOptions = {}
): void {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  const title = options.title || 'Shree Vinayaka Furnitures - Document';

  if (!element) {
    console.warn(`[printDocumentElement] Target element "${target}" not found. Falling back to window.print()`);
    window.print();
    return;
  }

  // Remove any previous print iframes if lingering
  const existing = document.getElementById('svf-isolated-print-iframe');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'svf-isolated-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.warn('[printDocumentElement] Could not access iframe document. Falling back to window.print()');
    window.print();
    return;
  }

  // Collect all stylesheets and inline styles from the parent document
  let stylesHtml = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    stylesHtml += node.outerHTML;
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${stylesHtml}
        <style>
          @page {
            size: auto;
            margin: 6mm 6mm 6mm 6mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 11px !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          #print-root {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            visibility: visible !important;
            position: static !important;
            transform: none !important;
            box-shadow: none !important;
          }
          #print-root * {
            visibility: visible !important;
          }
          .no-print, header, nav, button, .rd-desktop-ribbon {
            display: none !important;
          }
          /* Ensure table borders and zebra striping print crisply */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Allow brief tick for fonts/barcodes to render before opening print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('[printDocumentElement] iframe.contentWindow.print error:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, options.autoCloseTimeoutMs || 5000);
    }
  }, 300);
}
