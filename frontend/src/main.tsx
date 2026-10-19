import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modernModals.css'
import './styles/utilityColors.css'
import App from './App.tsx'

// 1. Vite preload chunk-load error listener for Cloudflare Pages zero-downtime deploys
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (stale deployment chunk). Auto-reloading latest build...', event);
  const reloadKey = 'svf_chunk_reload_ts';
  const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
  const now = Date.now();
  if (now - lastReload > 10000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

// 2. Global React Chunk-Load Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChunkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Exception caught by Global Error Boundary:', error, errorInfo);
    const msg = error?.message || '';
    const isChunkFailure =
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('Importing a module script failed');

    if (isChunkFailure) {
      const reloadKey = 'svf_react_chunk_reload_ts';
      const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
      const now = Date.now();
      if (now - lastReload > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('Reloading application due to chunk loading failure...');
        window.location.reload();
      }
    }
  }

  handleManualRefresh = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
            maxWidth: '520px',
            background: '#1e293b',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#38bdf8' }}>
              Showroom Terminal Build Updated
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
              A newer version of Sri Vinayaka Furnitures ERP has been deployed. Click below to load the latest release without losing local pending drafts.
            </p>
            <button
              onClick={this.handleManualRefresh}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
            >
              Reload Latest Terminal Build
            </button>
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
