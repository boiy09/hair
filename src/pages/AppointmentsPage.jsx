import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import {
  getAppointments, addAppointment, updateAppointment, deleteAppointment,
  getCustomers, getMenus
} from '../store';
import {
  formatDate, formatDateKr, getStatusLabel, getStatusClass, getTimeSlots, today
} from '../utils';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'noshow'],
  completed: [],
  cancelled: [],
  noshow: [],
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(getAppointments());
  const [selectedDate, setSelectedDate] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const toast = useToast();
  const confirm = useConfirm();

  function refresh() { setAppointments(getAppointments()); }

  const todayAppts = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .filter(a => filterStatus === 'all' || a.status === filterStatus)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [appointments, selectedDate, filterStatus]);

  const upcomingAppts = useMemo(() => {
    const now = today();
    return appointments
      .filter(a => a.date >= now && (a.status === 'pending' || a.status === 'confirmed'))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [appointments]);

  function changeDate(delta) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  async function handleStatusChange(appt, newStatus) {
    if (newStatus === 'noshow') {
      const ok = await confirm({ title: '노쇼 처리', message: `"${appt.customerName}" 고객을 노쇼 처리하시겠어요? 노쇼 카운트가 1 올라갑니다.`, confirmLabel: '노쇼 처리', danger: true });
      if (!ok) return;
    }
    if (newStatus === 'cancelled') {
      const ok = await confirm({ title: '예약 취소', message: '예약을 취소하시겠어요?', confirmLabel: '취소 처리', danger: true });
      if (!ok) return;
    }
    updateAppointment(appt.id, { status: newStatus });
    refresh();
    toast(`${getStatusLabel(newStatus)}으로 변경되었어요`, 'success');
  }

  async function handleDelete(appt) {
    const ok = await confirm({ title: '예약 삭제', message: '이 예약을 삭제하시겠어요? 복구 불가합니다.', confirmLabel: '삭제', danger: true });
    if (!ok) return;
    deleteAppointment(appt.id);
    refresh();
    toast('예약이 삭제되었어요', 'default');
  }

  const isToday = selectedDate === today();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header
        title="예약 관리"
        rightAction={
          <button className="btn btn-gold" style={{ margin: '0 8px', minHeight: 36, padding: '8px 14px', fontSize: 14 }} onClick={() => setShowForm(true)}>
            <Plus size={16} /> 예약
          </button>
        }
      />

      {/* Date navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--surface-low)',
      }}>
        <button className="btn btn-ghost" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => changeDate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{formatDateKr(selectedDate)}</div>
          {isToday && <div style={{ fontSize: 12, color: 'var(--primary-dark)', marginTop: 2 }}>오늘</div>}
        </div>
        <button className="btn btn-ghost" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => changeDate(1)}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Status filter */}
      <div style={{ padding: '10px 16px 6px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[['all','전체'],['pending','대기'],['confirmed','확정'],['completed','완료'],['cancelled','취소'],['noshow','노쇼']].map(([val, label]) => (
          <button key={val} className={`chip ${filterStatus === val ? 'active' : ''}`}
            style={{ fontSize: 12, minHeight: 32, padding: '4px 12px', flexShrink: 0 }}
            onClick={() => setFilterStatus(val)}>{label}</button>
        ))}
      </div>

      <div className="page-content">
        <div className="section-header">
          <div className="section-title">{isToday ? '오늘' : formatDate(selectedDate)} 예약</div>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{todayAppts.length}건</span>
        </div>

        {todayAppts.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">예약이 없어요</div>
            <button className="btn btn-outline" onClick={() => setShowForm(true)}><Plus size={16} /> 예약 추가</button>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayAppts.map(appt => (
              <AppointmentItem key={appt.id} appt={appt} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {upcomingAppts.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: 8 }}>
              <div className="section-title">예정 예약</div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{upcomingAppts.length}건</span>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingAppts.slice(0, 5).map(appt => (
                <AppointmentItem key={appt.id} appt={appt} onStatusChange={handleStatusChange} onDelete={handleDelete} compact />
              ))}
              {upcomingAppts.length > 5 && (
                <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                  +{upcomingAppts.length - 5}건 더 있어요
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          initialDate={selectedDate}
          onSave={(data) => { addAppointment(data); refresh(); setShowForm(false); toast('예약이 등록되었어요!', 'success'); }}
        />
      )}
    </div>
  );
}

function AppointmentItem({ appt, onStatusChange, onDelete, compact }) {
  const [expanded, setExpanded] = useState(false);
  const nextStatuses = STATUS_FLOW[appt.status] || [];

  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: '0 2px 12px rgba(26,27,31,0.06)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 50, flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{appt.time || '--:--'}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{appt.customerName || '이름 없음'}</span>
            <span className={`badge ${getStatusClass(appt.status)}`}>{getStatusLabel(appt.status)}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {(appt.menus || []).join(' · ') || '메뉴 없음'}
          </div>
          {!compact && appt.request && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>"{appt.request}"</div>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {nextStatuses.map(status => (
            <button key={status}
              className={`btn ${status === 'completed' ? 'btn-gold' : status === 'noshow' || status === 'cancelled' ? 'btn-danger' : 'btn-ghost'}`}
              style={{ fontSize: 13, minHeight: 38, padding: '0 14px' }}
              onClick={() => onStatusChange(appt, status)}>
              {getStatusLabel(status)}
            </button>
          ))}
          <button className="btn btn-danger" style={{ fontSize: 13, minHeight: 38, padding: '0 14px' }}
            onClick={() => onDelete(appt)}>삭제</button>
          {appt.expectedAmount > 0 && (
            <div style={{ width: '100%', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              예상 금액: {appt.expectedAmount?.toLocaleString()}원
            </div>
          )}
          {appt.request && (
            <div style={{ width: '100%', fontSize: 13, color: 'var(--text-secondary)' }}>요청: {appt.request}</div>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentForm({ onClose, onSave, initialDate }) {
  const customers = getCustomers();
  const menus = getMenus();
  const timeSlots = getTimeSlots();
  const [form, setForm] = useState({
    date: initialDate || today(), time: '10:00',
    customerId: '', customerName: '', customerPhone: '',
    menus: [], expectedAmount: 0, request: '', alertEnabled: true, status: 'pending',
  });

  function selectCustomer(c) {
    setForm(f => ({ ...f, customerId: c.id, customerName: c.name, customerPhone: c.phone || '' }));
  }
  function toggleMenu(menu) {
    const m = form.menus;
    if (m.includes(menu.name)) setForm(f => ({ ...f, menus: f.menus.filter(x => x !== menu.name) }));
    else setForm(f => ({ ...f, menus: [...f.menus, menu.name] }));
  }
  function handleSave() {
    if (!form.customerName.trim()) { alert('고객명을 입력해 주세요'); return; }
    if (form.menus.length === 0) { alert('시술 메뉴를 선택해 주세요'); return; }
    onSave(form);
  }

  const [customerSearch, setCustomerSearch] = useState('');
  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.name.includes(customerSearch) || (c.phone || '').includes(customerSearch)
  ).slice(0, 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">예약 등록</div>
        <div className="form-group">
          <label className="label required">고객</label>
          <input className="input" placeholder="이름 또는 연락처 검색"
            value={customerSearch || form.customerName}
            onChange={e => { setCustomerSearch(e.target.value); setForm(f => ({ ...f, customerName: e.target.value, customerId: '', customerPhone: '' })); }} />
          {customerSearch && filteredCustomers.length > 0 && (
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-sm)', marginTop: 4 }}>
              {filteredCustomers.map(c => (
                <div key={c.id} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => { selectCustomer(c); setCustomerSearch(''); }}>
                  {c.name} — {c.phone || '연락처 없음'}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label required">날짜</label>
            <input className="input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ colorScheme: 'light' }} />
          </div>
          <div className="form-group">
            <label className="label required">시간</label>
            <select className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="label required">시술 메뉴</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {menus.map(menu => (
              <button key={menu.id} className={`chip ${form.menus.includes(menu.name) ? 'active' : ''}`}
                onClick={() => toggleMenu(menu)}>{menu.name}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="label">예상 금액 (원)</label>
          <input className="input" type="number" inputMode="numeric" value={form.expectedAmount || ''} placeholder="0"
            onChange={e => setForm(f => ({ ...f, expectedAmount: Number(e.target.value) || 0 }))} />
        </div>
        <div className="form-group">
          <label className="label">고객 요청사항</label>
          <textarea className="input" placeholder="최대 200자" maxLength={200} value={form.request}
            onChange={e => setForm(f => ({ ...f, request: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 0' }}>
          <label style={{ flex: 1, fontSize: 14 }}>예약 알림 발송</label>
          <div onClick={() => setForm(f => ({ ...f, alertEnabled: !f.alertEnabled }))}
            style={{ width: 48, height: 28, borderRadius: 14, background: form.alertEnabled ? 'var(--primary)' : 'var(--surface-high)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: form.alertEnabled ? 22 : 3, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>취소</button>
          <button className="btn btn-gold btn-full" onClick={handleSave}>등록</button>
        </div>
      </div>
    </div>
  );
}
