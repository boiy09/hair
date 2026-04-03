import { useState } from 'react';
import { Plus, X, Download, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { getMenus, saveMenus, getCustomers, getSales, getAppointments } from '../store';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';

export default function SettingsPage() {
  const [menus, setMenus] = useState(getMenus());
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  function addMenu() {
    if (!newMenuName.trim()) { toast('메뉴명을 입력해 주세요', 'error'); return; }
    const price = Number(newMenuPrice) || 0;
    const newMenu = { id: Date.now().toString(), name: newMenuName.trim(), price };
    const updated = [...menus, newMenu];
    setMenus(updated);
    saveMenus(updated);
    setNewMenuName('');
    setNewMenuPrice('');
    toast('메뉴가 추가되었어요!', 'success');
  }

  function deleteMenu(id) {
    const updated = menus.filter(m => m.id !== id);
    setMenus(updated);
    saveMenus(updated);
    toast('메뉴가 삭제되었어요', 'default');
  }

  function updateMenuPrice(id, price) {
    const updated = menus.map(m => m.id === id ? { ...m, price: Number(price) || 0 } : m);
    setMenus(updated);
    saveMenus(updated);
  }

  function exportCSV() {
    const customers = getCustomers();
    const sales = getSales();
    const rows = [
      ['고객명', '연락처', '등급', '방문횟수', '노쇼수', '마지막방문', '누적결제액'],
      ...customers.map(c => [
        c.name, c.phone, `${c.visitCount >= 11 ? 'VIP' : c.visitCount >= 6 ? '단골' : c.visitCount >= 2 ? '일반' : '신규'}`,
        c.visitCount, c.noShowCount, c.lastVisit || '-',
        sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + (s.total || 0), 0),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miyong_chart_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV 파일이 다운로드되었어요', 'success');
  }

  async function clearAllData() {
    const ok = await confirm({
      title: '전체 데이터 삭제',
      message: '모든 고객, 예약, 매출 데이터가 삭제됩니다. 복구 불가합니다. 정말 삭제하시겠어요?',
      confirmLabel: '전체 삭제',
      danger: true,
    });
    if (!ok) return;
    localStorage.clear();
    window.location.reload();
  }

  const customers = getCustomers();
  const sales = getSales();
  const appointments = getAppointments();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="설정" />

      <div className="page-content">
        {/* App info */}
        <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
          <div style={{ fontSize: 40 }}>✂️</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>MIYONG-CHART</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>미용차트 v1.0</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            1인 미용사를 위한 고객 관리 시스템
          </div>
        </div>

        {/* Data summary */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">전체 고객</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-label">전체 예약</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{sales.length}</div>
            <div className="stat-label">매출 기록</div>
          </div>
        </div>

        {/* Menu management */}
        <div className="section-header">
          <div className="section-title">시술 메뉴 관리</div>
        </div>

        <div className="card">
          {menus.map(menu => (
            <div key={menu.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, fontSize: 15 }}>{menu.name}</div>
              <input
                className="input"
                type="number"
                value={menu.price}
                inputMode="numeric"
                style={{ width: 100, textAlign: 'right', minHeight: 40, padding: '6px 10px' }}
                onChange={e => updateMenuPrice(menu.id, e.target.value)}
              />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>원</span>
              <button
                onClick={() => deleteMenu(menu.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
          ))}

          <div className="divider" />

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              style={{ flex: 2 }}
              placeholder="메뉴 이름"
              value={newMenuName}
              onChange={e => setNewMenuName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMenu()}
            />
            <input
              className="input"
              style={{ flex: 1 }}
              type="number"
              inputMode="numeric"
              placeholder="가격"
              value={newMenuPrice}
              onChange={e => setNewMenuPrice(e.target.value)}
            />
            <button className="btn btn-gold" style={{ flexShrink: 0, minHeight: 48 }} onClick={addMenu}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Data management */}
        <div className="section-header">
          <div className="section-title">데이터 관리</div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-ghost btn-full" onClick={exportCSV} style={{ justifyContent: 'flex-start' }}>
            <Download size={18} /> CSV로 내보내기
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 4 }}>
            고객 정보를 엑셀에서 열 수 있는 CSV 파일로 다운로드합니다
          </div>
        </div>

        {/* Security info */}
        <div className="section-header">
          <div className="section-title">보안 안내</div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['🔐', '데이터는 이 기기에 로컬 저장됩니다'],
            ['🛡', '개인정보처리방침을 준수합니다'],
            ['💾', 'CSV 내보내기로 주기적 백업을 권장합니다'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
              <span>{icon}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="section-header">
          <div className="section-title" style={{ color: 'var(--red)' }}>위험 구역</div>
        </div>

        <div className="card">
          <button className="btn btn-danger btn-full" onClick={clearAllData}>
            <Trash2 size={18} /> 전체 데이터 삭제
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
            모든 고객, 예약, 매출 데이터가 영구 삭제됩니다
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
