
interface ModuleLoadingSkeletonProps {
  moduleName?: string;
  isModal?: boolean;
}

export function ModuleLoadingSkeleton({ moduleName = 'ERP Module', isModal = false }: ModuleLoadingSkeletonProps) {
  if (isModal) {
    return (
      <div
        role="dialog"
        aria-busy="true"
        aria-label={`Loading ${moduleName}`}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 17, 32, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        <div
          style={{
            width: '440px',
            maxWidth: '92vw',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '28px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#f8fafc'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(217, 119, 6, 0.25)',
              borderTop: '3px solid #d97706',
              borderRadius: '50%',
              animation: 'skSpin 0.75s linear infinite',
              marginBottom: '16px'
            }}
          />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px 0' }}>
            Loading {moduleName}...
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Streaming optimized async component from Cloudflare edge cache
          </p>
          <style>{`
            @keyframes skSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-busy="true"
      aria-label={`Loading ${moduleName}`}
      style={{
        flex: 1,
        minHeight: '450px',
        background: '#0b1120',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        margin: '12px',
        borderRadius: '10px',
        border: '1px solid #1e293b'
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          border: '3.5px solid rgba(217, 119, 6, 0.2)',
          borderTop: '3.5px solid #d97706',
          borderRadius: '50%',
          animation: 'skSpin 0.75s linear infinite',
          marginBottom: '16px'
        }}
      />
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', letterSpacing: '0.015em' }}>
        Loading {moduleName}...
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
        Shree Vinayaka Furnitures ERP &bull; Dynamic Chunk Hydration
      </div>
      <style>{`
        @keyframes skSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
