import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { getSales, getMonthlySales, getStats } from '../store';
import { formatMoney, formatDate, today } from '../utils';
import { useToast } from '../components/Toast';
import SaleForm from './SaleForm';

export default function SalesPage() {
  const [sales, setSales] = useState(getSales());
  const [tab, setTab] = useState('list'); // list | stats
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  function refresh() { setSales(getSales()); }

  function changeMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const monthlySales = useMemo(() => getMonthlySales(viewYear, viewMonth), [sales, viewYear, viewMonth]);
  const monthTotal = monthlySales.reduce((sum, s) => sum + (s.total || 0), 0);

  const todaySales = useMemo(() => sales.filter(s => s.date === today()), [sales]);
  const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

  const barData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      let m = now.getMonth() - i;
      let y = now.getFullYear();
      if (m < 0) { m += 12; y--; }
      const monthSales = getMonthlySales(y, m);
      data.push({
        label: `${m + 1}월`,
        total: monthSales.reduce((sum, s) => sum + (s.total || 0), 0),
      });
    }
    return data;
  }, [sales]);

  const maxBar = Math.max(...barData.map(d => d.total), 1);

  const menuBreakdown = useMemo(() => {
    const map = {};
    monthlySales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!map[item.name]) map[item.name] = 0;
        map[item.name] += item.price || 0;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlySales]);

  const paymentBreakdown = useMemo(() => {
    const map = {};
    monthlySales.forEach(s => {
      const m = s.paymentMethod || '현금';
      if (!map[m]) map[m] = 0;
      map[m] += s.total || 0;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlySales]);

  const stats = useMemo(() => getStats(), [sales]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header
        title="매출 관리"
        rightAction={
          <button
            className="btn btn-gold"
            style={{ margin: '0 8px', minHeight: 36, padding: '8px 14px', fontSize: 14 }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} /> 기록
          </button>
        }
      />

      {/* Tab */}
      <div style={{ display: 'flex', margin: '12px 16px 4px', background: 'var(--surface)', borderRadius: 9999, padding: 4 }}>
        {[['list', '기록'], ['stats', '통계']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              borderRadius: 9999, fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
              background: tab === key ? 'var(--card)' : 'transparent',
              color: tab === key ? 'var(--primary-dark)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {tab === 'list' ? (
          <>
            {/* Today summary */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>오늘 매출</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)', marginTop: 2 }}>
                  {formatMoney(todayTotal)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>건수</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{todaySales.length}건</div>
              </div>
            </div>

            {sales.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💰</div>
                <div className="empty-state-text">아직 매출 기록이 없어요</div>
                <button className="btn btn-gold" onClick={() => setShowForm(true)}>
                  <Plus size={16} /> 첫 매출 기록
                </button>
              </div>
            ) : (
              <div>
                {groupByDate(sales).map(({ date, items }) => (
                  <div key={date}>
                    <div style={{ padding: '10px 16px 4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatDate(date)}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--primary-dark)', fontWeight: 600 }}>
                        {formatMoney(items.reduce((sum, s) => sum + (s.total || 0), 0))}
                      </span>
                    </div>
                    <div style={{ background: 'var(--card)', margin: '0 16px 8px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                      {items.map(sale => (
                        <SaleItem key={sale.id} sale={sale} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Month selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
              <button className="btn btn-ghost" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => changeMonth(-1)}>
                <ChevronLeft size={20} />
              </button>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{viewYear}년 {MONTH_NAMES[viewMonth]}</div>
              <button className="btn btn-ghost" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => changeMonth(1)}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Month total */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>이번 달 총 매출</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-dark)' }}>{formatMoney(monthTotal)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{monthlySales.length}건</div>
            </div>

            {/* Enhanced KPI stats */}
            <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>재방문율</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)' }}>{stats.revisitRate}%</div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>고객 평균 결제</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {stats.avgSpend > 0 ? formatMoney(stats.avgSpend) : '-'}
                </div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>이달 신규 고객</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{stats.newThisMonth}명</div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>이달 재방문 고객</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{stats.returningThisMonth}명</div>
              </div>
              <div style={{ background: 'var(--error-container)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--error)', marginBottom: 4 }}>휴면 고객 (90일 미방문)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--error)' }}>{stats.dormant}명</div>
              </div>
            </div>

            {/* Bar chart (6 months) */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>월별 매출 추이</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {barData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {d.total > 0 ? `${Math.round(d.total / 10000)}만` : ''}
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${Math.max(4, (d.total / maxBar) * 90)}px`,
                      background: i === barData.length - 1 ? 'var(--primary)' : 'var(--surface-high)',
                      borderRadius: 6,
                      transition: 'height 0.3s',
                    }} />
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu breakdown */}
            {menuBreakdown.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>시술별 매출</div>
                {menuBreakdown.map(([name, amount]) => (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{name}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{formatMoney(amount)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3 }}>
                      <div style={{
                        height: '100%',
                        width: `${(amount / (menuBreakdown[0][1] || 1)) * 100}%`,
                        background: 'var(--primary)',
                        borderRadius: 3,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment breakdown */}
            {paymentBreakdown.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>결제 수단 비율</div>
                {paymentBreakdown.map(([method, amount]) => (
                  <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14 }}>{method}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{formatMoney(amount)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {monthTotal > 0 ? `${Math.round((amount / monthTotal) * 100)}%` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {monthlySales.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">이 달의 매출 기록이 없어요</div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <SaleForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            refresh();
            setShowForm(false);
            toast('매출이 기록되었어요!', 'success');
          }}
        />
      )}
    </div>
  );
}

function SaleItem({ sale }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{sale.customerName || '고객'}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          {(sale.items || []).map(i => i.name).join(' + ') || '시술'}
          {sale.coloring && ` · ${sale.coloring}`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {sale.paymentMethod || '현금'}
          {sale.discount > 0 && ` · 할인 ${(sale.discount || 0).toLocaleString()}원`}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{formatMoney(sale.total || 0)}</div>
        {sale.discount > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
            {formatMoney(sale.subtotal || 0)}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(sales) {
  const map = {};
  sales.forEach(s => {
    const d = s.date || today();
    if (!map[d]) map[d] = [];
    map[d].push(s);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}
