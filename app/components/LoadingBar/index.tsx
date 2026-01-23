export default function LoadingBar({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <div
      style={{
        // position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        background: '#e5e7eb',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          background: '#3b82f6',
          animation: 'loading-bar 1.5s infinite',
          transformOrigin: 'left',
        }}
      />
      <style>
        {`
          @keyframes loading-bar {
            0% { transform: scaleX(0); }
            25% { transform: scaleX(0.5); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); }
          }
        `}
      </style>
    </div>
  );
}
