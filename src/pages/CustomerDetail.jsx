import { useState } from 'react';
import { Edit2, Trash2, Plus, AlertTriangle, Palette } from 'lucide-react';
import Header from '../components/Header';
import {
  getCustomerById, updateCustomer, deleteCustomer,
  getTreatmentsByCustomer, getAppointmentsByCustomer,
  getGrade, getGradeBadgeClass, addSale, getMenus
} from '../store';
import { formatPhone, formatDate, getDaysAgo, getInitials, formatMoney, today } from '../utils';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';
import { CustomerForm } from './CustomersPage';
import SaleForm from './SaleForm';

export default function CustomerDetail({ customerId, onBack, onRefresh }) {
  const [customer, setCustomer] = useState(getCustomerById(customerId));
  const [treatments, setTreatments] = useState(getTreatmentsByCustomer(customerId));
  const [appointments, setAppointments] = useState(getAppointmentsByCustomer(customerId));
  const [showEdit, setShowEdit] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  if (!customer) return null;

  const grade = getGrade(customer.visitCount || 0);
  const gradeBadge = getGradeBadgeClass(customer.visitCount || 0);

  function refresh() {
    setCustomer(getCustomerById(customerId));
    setTreatments(getTreatmentsByCustomer(customerId));
    setAppointments(getAppointmentsByCustomer(customerId));
  }

  async function handleDelete() {
    const ok = await confirm({ title: '고객 삭제', message: `"${customer.name}" 고객의 모든 기록이 삭제됩니다. 복구 불가합니다.`, confirmLabel: '삭제', danger: true });
    if (!ok) return;
    deleteCustomer(customerId);
    toast('고객이 삭제되었어요', 'default');
    onBack();
  }

  const totalSpent = treatments.reduce((sum, t) => sum + (t.total || 0), 0);
  const upcomingAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const lastColoring = treatments.find(t => t.coloring)?.coloring;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="고객 카드" onBack={onBack} rightAction={
        <div style={{ display: 'flex', gap: 4, paddingRight: 8 }}>
          <button className="btn btn-ghost" style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }} onClick={() => setShowEdit(true)}>
            <Edit2 size={15} /> 수정
          </button>
          <button className="btn btn-danger" style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }} onClick={handleDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      } />

      <div className="page-content">

        {/* ── 고객 카드 헤더 ── */}
        <div style={{ margin: '12px 16px 0', background: 'var(--card)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 16px rgba(26,27,31,0.07)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="avatar avatar-lg">{getInitials(customer.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{customer.name}</span>
                <span className={`badge ${gradeBadge}`}>{grade}</span>
                {(customer.noShowCount || 0) >= 3 && <span className="badge badge-red">노쇼 주의</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
                {customer.phone || '연락처 없음'}
              </div>
              {customer.birthdate && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>생일 {formatDate(customer.birthdate)}{customer.gender ? ` · ${customer.gender}` : ''}</div>}
              {customer.source && <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>유입: {customer.source}</div>}
            </div>
          </div>

          {/* 최근 컬러 빠른 확인 */}
          {lastColoring && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--tertiary-container)', borderRadius: 'var(--radius-sm)' }}>
              <Palette size={16} style={{ color: 'var(--on-tertiary-container)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--on-tertiary-container)', fontWeight: 600, opacity: 0.7 }}>최근 컬러</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-tertiary-container)' }}>{lastColoring}</div>
              </div>
            </div>
          )}

          {customer.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {customer.tags.map(tag => <span key={tag} className="chip active" style={{ fontSize: 12, minHeight: 28, padding: '4px 10px' }}>{tag}</span>)}
            </div>
          )}
        </div>

        {/* 알레르기 */}
        {customer.allergy && (
          <div style={{ margin: '10px 16px 0' }}>
            <div className="alert-banner">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>⚠ 주의사항: {customer.allergy}</span>
            </div>
          </div>
        )}

        {/* ── 요약 통계 ── */}
        <div className="stats-row" style={{ paddingTop: 12 }}>
          <div className="stat-card"><div className="stat-value">{customer.visitCount || 0}</div><div className="stat-label">총 방문</div></div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 14 }}>{totalSpent > 0 ? `${Math.round(totalSpent / 10000)}만` : '0'}</div>
            <div className="stat-label">누적 결제</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 13, color: customer.noShowCount >= 1 ? 'var(--error)' : 'var(--primary-dark)' }}>{customer.noShowCount || 0}</div>
            <div className="stat-label">노쇼</div>
          </div>
        </div>

        {/* 마지막 방문 / 선불금 */}
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 12px' }}>
          <div className="card" style={{ margin: 0, flex: 1, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>마지막 방문</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{getDaysAgo(customer.lastVisit) || '없음'}</div>
            {customer.lastVisit && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(customer.lastVisit)}</div>}
          </div>
          <div className="card" style={{ margin: 0, flex: 1, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>선불금 잔액</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: (customer.prepaid || 0) > 0 ? 'var(--green)' : 'var(--text)' }}>{formatMoney(customer.prepaid || 0)}</div>
          </div>
        </div>

        {customer.memo && (
          <div className="card" style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>📝 {customer.memo}</div>
        )}

        {upcomingAppts.length > 0 && (
          <div className="card" style={{ background: 'var(--primary-container)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 8 }}>📅 예정 예약</div>
            {upcomingAppts.map(a => (
              <div key={a.id} style={{ fontSize: 14, marginBottom: 4, color: 'var(--primary-dark)' }}>
                {formatDate(a.date)} {a.time} — {(a.menus || []).join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* ── 시술 기록 추가 버튼 ── */}
        <div style={{ padding: '0 16px 16px' }}>
          <button className="btn btn-gold btn-full" onClick={() => setShowSaleForm(true)}>
            <Plus size={18} /> 시술 기록 추가
          </button>
        </div>

        {/* ── 시술 이력 (고객 카드 스타일) ── */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            시술 이력 {treatments.length > 0 ? `(${treatments.length}회)` : ''}
          </div>

          {treatments.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">✂️</div>
              <div className="empty-state-text">아직 시술 기록이 없어요</div>
              <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setShowSaleForm(true)}><Plus size={16} /> 첫 시술 기록</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* 타임라인 선 */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--surface-high)', borderRadius: 1 }} />

              {treatments.map((t, idx) => (
                <TreatmentCard key={t.id} treatment={t} isFirst={idx === 0} />
              ))}
            </div>
          )}
        </div>

        {/* 사진 */}
        {treatments.some(t => t.photos?.length > 0) && (
          <div style={{ padding: '8px 16px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>사진</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {treatments.flatMap(t => t.photos || []).map((photo, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-high)' }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      {showEdit && (
        <CustomerForm initial={customer} existingCustomers={[]} onClose={() => setShowEdit(false)}
          onSave={(data) => { updateCustomer(customerId, data); refresh(); setShowEdit(false); toast('정보가 수정되었어요!', 'success'); }} />
      )}

      {showSaleForm && (
        <SaleForm customerId={customerId} customerName={customer.name}
          onClose={() => setShowSaleForm(false)}
          onSave={() => {
            refresh(); setShowSaleForm(false);
            updateCustomer(customerId, { visitCount: (customer.visitCount || 0) + 1, lastVisit: today() });
            toast('시술 기록이 추가되었어요!', 'success');
          }} />
      )}
    </div>
  );
}

function TreatmentCard({ treatment, isFirst }) {
  const [expanded, setExpanded] = useState(isFirst);

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      {/* 타임라인 도트 */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', zIndex: 1,
          background: isFirst ? 'var(--primary)' : 'var(--surface-high)',
          border: `2px solid ${isFirst ? 'var(--primary-dark)' : 'var(--surface-high)'}`,
          boxShadow: isFirst ? '0 0 0 3px rgba(255,199,0,0.25)' : 'none',
          marginTop: 10,
        }} />
      </div>

      {/* 카드 */}
      <div style={{ flex: 1, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: '0 2px 12px rgba(26,27,31,0.06)', overflow: 'hidden' }}>
        {/* 카드 헤더 — 날짜 + 금액 */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 3 }}>{formatDate(treatment.date)}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              {(treatment.items || []).map(i => i.name).join(' · ') || '시술'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary-dark)' }}>{formatMoney(treatment.total || 0)}</div>
            {treatment.discount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatMoney(treatment.subtotal || 0)}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{treatment.paymentMethod || '현금'}</div>
          </div>
        </div>

        {/* 넘버링 — 항상 보임 (있을 때만) */}
        {treatment.coloring && (
          <div style={{ margin: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--tertiary-container)', borderRadius: 'var(--radius-sm)' }}>
            <Palette size={14} style={{ color: 'var(--on-tertiary-container)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--on-tertiary-container)', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>넘버링 / 컬러</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-tertiary-container)' }}>{treatment.coloring}</div>
            </div>
          </div>
        )}

        {/* 상세 내용 (펼침) */}
        {expanded && (
          <div style={{ padding: '0 16px 14px', borderTop: treatment.coloring ? 'none' : '1px solid var(--outline)' }}>
            {treatment.detail && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{treatment.detail}</div>
            )}
            {treatment.chemical && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                💊 {treatment.chemical}
              </div>
            )}
            {treatment.duration && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>⏱ {treatment.duration}분 소요</div>
            )}
            {treatment.nextVisit && (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-dark)', background: 'var(--primary-container)', padding: '6px 10px', borderRadius: 8, display: 'inline-block', marginBottom: 8 }}>
                📆 다음 방문 권장: {formatDate(treatment.nextVisit)}
              </div>
            )}
            {treatment.specialNote && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 6 }}>
                메모: {treatment.specialNote}
              </div>
            )}
            {treatment.photos?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
                {treatment.photos.slice(0, 5).map((p, i) => (
                  <img key={i} src={p} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ))}
                {treatment.photos.length > 5 && (
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    +{treatment.photos.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
