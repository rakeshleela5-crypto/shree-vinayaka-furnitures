import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    modulePreload: {
      polyfill: true,
      resolveDependencies(_filename, deps, { hostType }) {
        // Prevent Vite from injecting eager <link rel="modulepreload"> tags for heavy secondary studio/PDF/reports chunks into initial index.html
        if (hostType === 'html') {
          return deps.filter(dep => {
            const isHeavySecondary =
              dep.includes('barcode') ||
              dep.includes('xlsx') ||
              dep.includes('accounting') ||
              dep.includes('reports') ||
              dep.includes('purchase') ||
              dep.includes('logistics') ||
              dep.includes('projects') ||
              dep.includes('records') ||
              dep.includes('utilities');
            return !isHeavySecondary;
          });
        }
        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/xlsx/')) {
            return 'vendor-xlsx';
          }
          if (id.includes('node_modules/jsbarcode/') || id.includes('node_modules/qrcode/')) {
            return 'vendor-barcode-qr';
          }
          if (id.includes('node_modules/dexie/')) {
            return 'vendor-dexie';
          }
          if (id.includes('/src/data/')) {
            return 'data-catalog';
          }
          if (id.includes('/src/components/barcode/')) {
            return 'view-barcode-studio';
          }
          if (id.includes('/src/components/reports/')) {
            return 'view-reports';
          }
          if (id.includes('/src/components/accounting/') || id.includes('/src/components/banking/')) {
            return 'view-accounting';
          }
          if (id.includes('/src/components/delivery/') || id.includes('/src/components/inventory/')) {
            return 'view-logistics';
          }
          if (id.includes('/src/components/pos/')) {
            return 'view-pos';
          }
          if (id.includes('/src/components/projects/')) {
            return 'view-projects';
          }
          if (id.includes('/src/components/master/') || id.includes('/src/components/records/') || id.includes('/src/components/products/')) {
            return 'view-master-records';
          }
          if (id.includes('/src/components/purchases/') || id.includes('/src/components/purchase/')) {
            return 'view-purchase';
          }
        },
      },
    },
  },
})
