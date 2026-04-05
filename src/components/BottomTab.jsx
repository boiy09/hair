import { Users, Calendar, BarChart2, Settings } from 'lucide-react';

const TABS = [
  { id: 'customers', label: '고객', icon: Users },
  { id: 'appointments', label: '예약', icon: Calendar },
  { id: 'sales', label: '매출', icon: BarChart2 },
  { id: 'settings', label: '설정', icon: Settings },
];

export default function BottomTab({ active, onChange }) {
  return (
    <nav style={{
      height: 'var(--tab-height)',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -1px 0 rgba(26,27,31,0.07)',
      display: 'flex',
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 768,
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--primary-dark)' : 'var(--text-tertiary)',
              transition: 'color 0.15s',
              minHeight: 48,
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
