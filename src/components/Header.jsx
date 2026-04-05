import { ArrowLeft } from 'lucide-react';

export default function Header({ title, onBack, rightAction, subtitle }) {
  return (
    <header style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      background: 'rgba(250,249,254,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(26,27,31,0.06)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary-dark)',
          }}
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <div style={{ flex: 1, padding: onBack ? '0 4px' : '0 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {rightAction && (
        <div style={{ flexShrink: 0 }}>
          {rightAction}
        </div>
      )}
    </header>
  );
}
