import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modernModals.css'
import './styles/utilityColors.css'
import App from './App.tsx'

// 1. Pure Cloud Zero-Downtime Startup: Purge any old service worker and cache storage immediately
if (typeof window !== 'undefined') {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => {
          r.unregister().catch(() => {});
        });
      }).catch(() => {});
    }
    if (typeof caches !== 'undefined') {
      caches.keys().then(keys => {
        keys.forEach(k => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Cache purge skipped:', e);
  }
}

// 2. Vite preload chunk-load error listener for Cloudflare Pages zero-downtime deploys
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (stale deployment chunk). Executing cache-busting reload...', event);
  const reloadKey = 'svf_chunk_reload_ts';
  const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
  const now = Date.now();
  if (now - lastReload > 12000) {
    const doReload = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('svf_v', String(now));
      window.location.replace(url.toString());
    };

    if (typeof caches !== 'undefined') {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).finally(doReload);
    } else {
      doReload();
    }
  }
});

// 3. Global React Chunk-Load & Application Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  isChunkFailure: boolean;
}

class ChunkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, isChunkFailure: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const msg = (error?.message || '').toLowerCase();
    const isChunk =
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading chunk') ||
      msg.includes('importing a module script failed') ||
      msg.includes('error loading dynamically imported');

    return { hasError: true, error, isChunkFailure: isChunk };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Exception caught by Global Error Boundary:', error, errorInfo);
    const msg = (error?.message || '').toLowerCase();
    const isChunk =
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading chunk') ||
      msg.includes('importing a module script failed');

    if (isChunk) {
      const reloadKey = 'svf_react_chunk_reload_ts';
      const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
      const now = Date.now();
      if (now - lastReload > 12000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('Auto-reloading application due to chunk loading mismatch...');
        this.handleCleanReload();
      }
    }
  }

  handleCleanReload = async () => {
    try {
      sessionStorage.clear();
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch (e) {
      console.warn('Error during cache cleanup:', e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('svf_v', String(Date.now()));
    window.location.replace(url.toString());
  };

  handleResetAppState = async () => {
    try {
      // Clear app state keys in localStorage
      const keysToClear = Object.keys(localStorage).filter(
        k => k.startsWith('svf_') || k.startsWith('rd_') || k.startsWith('gi_')
      );
      keysToClear.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch {}
    const url = new URL(window.location.href);
    url.search = '';
    window.location.replace(url.toString());
  };

  render() {
    if (this.state.hasError) {
      const isChunk = this.state.isChunkFailure;
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#1e293b',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {isChunk ? '🔄' : '⚠️'}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: isChunk ? '#38bdf8' : '#f87171' }}>
              {isChunk ? 'Showroom Terminal Build Updated' : 'Showroom Terminal Recovery'}
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.5' }}>
              {isChunk
                ? 'A newer version of Sri Vinayaka Furnitures ERP has been deployed. Click below to load the latest release with verified cloud assets.'
                : 'An unexpected application state was encountered. You can reload the terminal or reset local caches to restore full operation.'}
            </p>

            {this.state.error?.message && (
              <div style={{
                backgroundColor: '#0b1329',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '20px',
                maxHeight: '100px',
                overflowY: 'auto',
                border: '1px solid #7f1d1d'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleCleanReload}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
              >
                🔄 Reload Latest Terminal Build
              </button>

              <button
                type="button"
                onClick={this.handleResetAppState}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              >
                🧹 Purge Cache & Clean Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <App />
    </ChunkErrorBoundary>
  </StrictMode>,
)
