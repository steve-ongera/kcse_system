export default function LoadingSpinner({ size = 28, color = 'var(--clr-primary)', text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      {text && <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>{text}</span>}
    </div>
  );
}