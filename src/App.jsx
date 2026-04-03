import { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/Confirm';
import BottomTab from './components/BottomTab';
import CustomersPage from './pages/CustomersPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SalesPage from './pages/SalesPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [tab, setTab] = useState('customers');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const pages = {
    customers: <CustomersPage />,
    appointments: <AppointmentsPage />,
    sales: <SalesPage />,
    settings: <SettingsPage />,
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        {!isOnline && (
          <div className="offline-banner">
            오프라인 모드 — 데이터는 임시 저장됩니다
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', height: isOnline ? '100%' : 'calc(100% - 36px)' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {pages[tab]}
          </div>
          <BottomTab active={tab} onChange={setTab} />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
