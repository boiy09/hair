import { useState } from 'react';
import { Edit2, Trash2, Plus, AlertTriangle, ChevronRight, Camera } from 'lucide-react';
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
  const [tab, setTab] = useState('history'); // history | photos
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
    const ok = await confirm({
      title: '고객 삭제',
      message: `"${customer.name}" 고객의 모든 기록이 삭제됩니다. 복구 불가합니다.`,
      confirmLabel: '삭제',
      danger: true,
    });
    if (!ok) return;
    deleteCustomer(customerId);
    toast('고객이 삭제되었어요', 'default');
    onBack();
  }

  const totalSpent = treatments.reduce((sum, t) => sum + (t.total || 0), 0);
  const upcomingAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header
        title="고객 상세"
        onBack={onBack}
        rightAction={
          <div style={{ display: 'flex', gap: 4, paddingRight: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
              onClick={() => setShowEdit(true)}
            >
              <Edit2 size={15} /> 수정
            </button>
            <button
              className="btn"
              style={{ minHeight: 36, padding: '0 12px', background: 'var(--red-dim)', color: 'var(--red)', fontSize: 13 }}
              onClick={handleDelete}
            >
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      <div className="page-content">
        {/* Profile card */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="avatar avatar-lg">{getInitials(customer.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{customer.name}</span>
                <span className={`badge ${gradeBadge}`}>{grade}</span>
                {(customer.noShowCount || 0) >= 3 && (
                  <span className="badge badge-red">노쇼 주의</span>
                )}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                {customer.phone || '연락처 없음'}
              </div>
              {customer.birthdate && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  생일 {formatDate(customer.birthdate)}
                </div>
              )}
              {customer.source && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  유입: {customer.source}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {customer.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {customer.tags.map(tag => (
                <span key={tag} className="chip active" style={{ fontSize: 12, minHeight: 28, padding: '4px 10px' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Allergy banner */}
        {customer.allergy && (
          <div style={{ margin: '0 16px 12px' }}>
            <div className="alert-banner">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>⚠ 주의사항: {customer.allergy}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{customer.visitCount || 0}</div>
            <div className="stat-label">총 방문</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{customer.noShowCount || 0}</div>
            <div className="stat-label">노쇼</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 14 }}>
              {totalSpent > 0 ? formatMoney(totalSpent).replace('원', '') : '0'}
            </div>
            <div className="stat-label">누적 결제</div>
          </div>
        </div>

        {/* Last visit & prepaid */}
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 10 }}>
          <div className="card" style={{ margin: 0, flex: 1, padding: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>마지막 방문</div>
            <div style={{ fontWeight: 600 }}>{getDaysAgo(customer.lastVisit) || '없음'}</div>
            {customer.lastVisit && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(customer.lastVisit)}</div>
            )}
          </div>
          <div className="card" style={{ margin: 0, flex: 1, padding: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>선불금 잔액</div>
            <div style={{ fontWeight: 600, color: (customer.prepaid || 0) > 0 ? 'var(--green)' : 'var(--text-primary)' }}>
              {formatMoney(customer.prepaid || 0)}
            </div>
          </div>
        </div>

        {/* Memo */}
        {customer.memo && (
          <div className="card" style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            📝 {customer.memo}
          </div>
        )}

        {/* Upcoming appointments */}
        {upcomingAppts.length > 0 && (
          <div className="card" style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 8 }}>📅 예정 예약</div>
            {upcomingAppts.map(a => (
              <div key={a.id} style={{ fontSize: 14, marginBottom: 4 }}>
                {formatDate(a.date)} {a.time} — {(a.menus || []).join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <div style={{ padding: '0 16px 12px' }}>
          <button className="btn btn-gold btn-full" onClick={() => setShowSaleForm(true)}>
            <Plus size={18} /> 시술 기록 추가
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', margin: '0 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
          {[['history', '시술 이력'], ['photos', '사진']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                borderRadius: 6, fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                background: tab === key ? 'var(--bg-card)' : 'transparent',
                color: tab === key ? 'var(--gold)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Treatment history */}
        {tab === 'history' && (
          <div style={{ marginTop: 12 }}>
            {treatments.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-state-icon">✂️</div>
                <div className="empty-state-text">시술 기록이 없어요</div>
                <button className="btn btn-outline" onClick={() => setShowSaleForm(true)}>
                  <Plus size={16} /> 첫 시술 기록
                </button>
              </div>
            ) : (
              treatments.map(t => (
                <TreatmentCard key={t.id} treatment={t} />
              ))
            )}
          </div>
        )}

        {/* Photos tab */}
        {tab === 'photos' && (
          <div style={{ padding: '12px 16px' }}>
            {treatments.filter(t => t.photos?.length > 0).length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-state-icon">📷</div>
                <div className="empty-state-text">등록된 사진이 없어요</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {treatments.flatMap(t => t.photos || []).map((photo, i) => (
                  <div key={i} style={{
                    aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    overflow: 'hidden',
                  }}>
                    <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <CustomerForm
          initial={customer}
          existingCustomers={[]}
          onClose={() => setShowEdit(false)}
          onSave={(data) => {
            updateCustomer(customerId, data);
            refresh();
            setShowEdit(false);
            toast('정보가 수정되었어요!', 'success');
          }}
        />
      )}

      {/* Sale / treatment form */}
      {showSaleForm && (
        <SaleForm
          customerId={customerId}
          customerName={customer.name}
          onClose={() => setShowSaleForm(false)}
          onSave={() => {
            refresh();
            setShowSaleForm(false);
            updateCustomer(customerId, {
              visitCount: (customer.visitCount || 0) + 1,
              lastVisit: today(),
            });
            toast('시술 기록이 추가되었어요!', 'success');
          }}
        />
      )}
    </div>
  );
}

function TreatmentCard({ treatment }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {(treatment.items || []).map(i => i.name).join(' + ') || '시술'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {formatDate(treatment.date)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
            {formatMoney(treatment.total || 0)}
          </div>
          {treatment.discount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
              {formatMoney(treatment.subtotal || 0)}
            </div>
          )}
        </div>
      </div>

      {treatment.detail && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {treatment.detail}
        </div>
      )}

      {treatment.chemical && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
          💊 {treatment.chemical}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {treatment.paymentMethod || '현금'} 결제
          {treatment.duration ? ` · ${treatment.duration}분` : ''}
        </span>
        {treatment.nextVisit && (
          <span style={{ fontSize: 12, color: 'var(--gold)' }}>
            다음 방문 권장: {formatDate(treatment.nextVisit)}
          </span>
        )}
      </div>

      {/* Photos */}
      {treatment.photos?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
          {treatment.photos.slice(0, 4).map((p, i) => (
            <img
              key={i}
              src={p}
              alt=""
              style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          ))}
          {treatment.photos.length > 4 && (
            <div style={{
              width: 64, height: 64, borderRadius: 6,
              background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--text-secondary)', flexShrink: 0,
            }}>
              +{treatment.photos.length - 4}
            </div>
          )}
        </div>
      )}

      {treatment.specialNote && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, fontStyle: 'italic' }}>
          메모: {treatment.specialNote}
        </div>
      )}
    </div>
  );
}
