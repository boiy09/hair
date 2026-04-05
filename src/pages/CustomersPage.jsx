import { useState, useMemo } from 'react';
import { Plus, Search, X, SlidersHorizontal, ChevronRight, Bell, Phone } from 'lucide-react';
import Header from '../components/Header';
import {
  getCustomers, addCustomer, updateCustomer, deleteCustomer,
  getGrade, getGradeBadgeClass, getCustomerById, getRemindCustomers,
} from '../store';
import {
  formatPhone, formatDate, getDaysAgo, getDaysUntil, getInitials,
  matchesSearch, validatePhone, today,
} from '../utils';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/Confirm';
import CustomerDetail from './CustomerDetail';

const FILTER_OPTIONS = {
  visitCount: [
    { label: '전체', value: 'all' },
    { label: '1회', value: '1' },
    { label: '2~5회', value: '2-5' },
    { label: '6~10회', value: '6-10' },
    { label: '11회+', value: '11+' },
  ],
  lastVisit: [
    { label: '전체', value: 'all' },
    { label: '1주 이내', value: '7' },
    { label: '1개월 이내', value: '30' },
    { label: '3개월 이내', value: '90' },
    { label: '3개월 초과', value: '90+' },
  ],
  grade: [
    { label: '전체', value: 'all' },
    { label: '신규', value: '신규' },
    { label: '일반', value: '일반' },
    { label: '단골', value: '단골' },
    { label: 'VIP', value: 'VIP' },
  ],
  noShow: [
    { label: '전체', value: 'all' },
    { label: '없음', value: '0' },
    { label: '1~2회', value: '1-2' },
    { label: '3회+', value: '3+' },
  ],
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState(getCustomers());
  const [remindList, setRemindList] = useState(getRemindCustomers());
  const [mainTab, setMainTab] = useState('all'); // 'all' | 'remind'
  const [query, setQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ visitCount: 'all', lastVisit: 'all', grade: 'all', noShow: 'all', sort: 'lastVisit' });
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  function refresh() {
    setCustomers(getCustomers());
    setRemindList(getRemindCustomers());
  }

  function markReminderDone(customerId) {
    updateCustomer(customerId, { reminderDone: true });
    refresh();
    toast('연락 완료로 표시했어요', 'success');
  }

  const filtered = useMemo(() => {
    let list = customers.filter(c => matchesSearch(c, query));
    const now = new Date();

    if (filter.visitCount !== 'all') {
      list = list.filter(c => {
        const v = c.visitCount || 0;
        if (filter.visitCount === '1') return v === 1;
        if (filter.visitCount === '2-5') return v >= 2 && v <= 5;
        if (filter.visitCount === '6-10') return v >= 6 && v <= 10;
        if (filter.visitCount === '11+') return v >= 11;
        return true;
      });
    }

    if (filter.lastVisit !== 'all') {
      list = list.filter(c => {
        if (!c.lastVisit) return filter.lastVisit === '90+';
        const days = (now - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24);
        if (filter.lastVisit === '7') return days <= 7;
        if (filter.lastVisit === '30') return days <= 30;
        if (filter.lastVisit === '90') return days <= 90;
        if (filter.lastVisit === '90+') return days > 90;
        return true;
      });
    }

    if (filter.grade !== 'all') {
      list = list.filter(c => getGrade(c.visitCount || 0) === filter.grade);
    }

    if (filter.noShow !== 'all') {
      list = list.filter(c => {
        const n = c.noShowCount || 0;
        if (filter.noShow === '0') return n === 0;
        if (filter.noShow === '1-2') return n >= 1 && n <= 2;
        if (filter.noShow === '3+') return n >= 3;
        return true;
      });
    }

    list = [...list].sort((a, b) => {
      if (filter.sort === 'name') return (a.name || '').localeCompare(b.name || '', 'ko');
      if (filter.sort === 'visitCount') return (b.visitCount || 0) - (a.visitCount || 0);
      if (filter.sort === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit) - new Date(a.lastVisit);
    });

    return list;
  }, [customers, query, filter]);

  if (selectedId) {
    return (
      <CustomerDetail
        customerId={selectedId}
        onBack={() => { setSelectedId(null); refresh(); }}
        onRefresh={refresh}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header
        title="고객 관리"
        subtitle={`총 ${customers.length}명`}
        rightAction={
          <button
            className="btn btn-gold"
            style={{ margin: '0 8px', minHeight: 36, padding: '8px 14px', fontSize: 14 }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} /> 등록
          </button>
        }
      />

      {/* Main tab: 전체 고객 | 리마인드 */}
      <div style={{ display: 'flex', margin: '10px 16px 0', background: 'var(--surface)', borderRadius: 9999, padding: 4 }}>
        {[
          ['all', '전체 고객'],
          ['remind', `리마인드${remindList.length > 0 ? ` (${remindList.length})` : ''}`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            style={{
              flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
              borderRadius: 9999, fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
              background: mainTab === key ? 'var(--card)' : 'transparent',
              color: mainTab === key ? 'var(--primary-dark)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              boxShadow: mainTab === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {key === 'remind' && remindList.length > 0 && (
              <Bell size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Remind tab */}
      {mainTab === 'remind' ? (
        <div className="page-content" style={{ paddingTop: 12 }}>
          {remindList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <div className="empty-state-text">재방문 알림이 필요한 고객이 없어요</div>
            </div>
          ) : (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {remindList.map(c => {
                const daysLabel = getDaysUntil(c._nextVisit);
                const isOverdue = c._daysLeft < 0;
                return (
                  <div
                    key={c.id}
                    className="card"
                    style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div className="avatar" onClick={() => setSelectedId(c.id)} style={{ cursor: 'pointer' }}>
                      {getInitials(c.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => setSelectedId(c.id)} role="button">
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {c.phone || '연락처 없음'}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        <span style={{
                          background: isOverdue ? 'var(--error-container)' : 'var(--primary-container)',
                          color: isOverdue ? 'var(--error)' : 'var(--primary-dark)',
                          padding: '2px 8px', borderRadius: 9999, fontWeight: 600,
                        }}>
                          {isOverdue ? '⚠ ' : '📅 '}{daysLabel}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
                          권장일 {formatDate(c._nextVisit)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ minHeight: 36, padding: '0 12px', fontSize: 12, flexShrink: 0 }}
                      onClick={() => markReminderDone(c.id)}
                    >
                      <Phone size={14} /> 연락 완료
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div style={{ padding: '10px 16px 4px', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="input"
                style={{ paddingLeft: 40, minHeight: 44 }}
                placeholder="이름, 연락처, 메모, 태그 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className={`btn ${showFilter ? 'btn-gold' : 'btn-ghost'}`}
              style={{ minHeight: 44, padding: '0 14px' }}
              onClick={() => setShowFilter(!showFilter)}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div style={{ padding: '8px 16px 4px', background: 'var(--surface-low)' }}>
              {[
                ['방문 횟수', 'visitCount'],
                ['마지막 방문', 'lastVisit'],
                ['등급', 'grade'],
                ['노쇼', 'noShow'],
              ].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {FILTER_OPTIONS[key].map(opt => (
                      <button
                        key={opt.value}
                        className={`chip ${filter[key] === opt.value ? 'active' : ''}`}
                        style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }}
                        onClick={() => setFilter(f => ({ ...f, [key]: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>정렬</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['lastVisit', '최근 방문'], ['name', '이름순'], ['visitCount', '방문 횟수'], ['createdAt', '등록일']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`chip ${filter.sort === val ? 'active' : ''}`}
                      style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }}
                      onClick={() => setFilter(f => ({ ...f, sort: val }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer list */}
          <div className="page-content" style={{ paddingTop: 8 }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-text">
                  {query ? `"${query}" 검색 결과 없음` : '아직 등록된 고객이 없어요'}
                </div>
                {!query && (
                  <button className="btn btn-gold" onClick={() => setShowForm(true)}>
                    <Plus size={16} /> 첫 고객 등록
                  </button>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--card)', margin: '0 16px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                {filtered.map(c => (
                  <CustomerListItem
                    key={c.id}
                    customer={c}
                    onClick={() => setSelectedId(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              position: 'fixed',
              bottom: 'calc(var(--tab-height) + 16px)',
              right: 20,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
              boxShadow: '0 4px 20px rgba(255,199,0,0.4)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 40,
            }}
          >
            <Plus size={24} color="var(--on-primary-container)" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Add customer modal */}
      {showForm && (
        <CustomerForm
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            addCustomer(data);
            refresh();
            setShowForm(false);
            toast('고객이 등록되었어요!', 'success');
          }}
          existingCustomers={customers}
        />
      )}
    </div>
  );
}

function CustomerListItem({ customer, onClick }) {
  const grade = getGrade(customer.visitCount || 0);
  const badgeClass = getGradeBadgeClass(customer.visitCount || 0);
  const now = new Date();
  const isDormant = customer.lastVisit &&
    (now - new Date(customer.lastVisit)) / (1000 * 60 * 60 * 24) >= 90;

  return (
    <div className="list-item" onClick={onClick}>
      <div className="avatar">
        {getInitials(customer.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{customer.name}</span>
          <span className={`badge ${badgeClass}`}>{grade}</span>
          {(customer.noShowCount || 0) >= 3 && (
            <span className="badge badge-red">노쇼 주의</span>
          )}
          {isDormant && (
            <span className="badge badge-gray">휴면</span>
          )}
          {customer.complaint && (
            <span className="badge badge-peach">컴플레인</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          {customer.phone || '연락처 없음'} · 방문 {customer.visitCount || 0}회
        </div>
        {customer.preferredStyle && (
          <div style={{ fontSize: 12, color: 'var(--on-tertiary-container)', marginTop: 2 }}>
            ✂ {customer.preferredStyle}
          </div>
        )}
        {customer.allergy && (
          <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 2 }}>
            ⚠ {customer.allergy}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {getDaysAgo(customer.lastVisit) || '방문 기록 없음'}
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', marginTop: 4 }} />
      </div>
    </div>
  );
}

function CustomerForm({ onClose, onSave, existingCustomers, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    birthdate: initial?.birthdate || '',
    gender: initial?.gender || '',
    source: initial?.source || '',
    allergy: initial?.allergy || '',
    memo: initial?.memo || '',
    tags: initial?.tags || [],
    preferredStyle: initial?.preferredStyle || '',
    complaint: initial?.complaint || false,
    blacklist: initial?.blacklist || false,
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const toast = useToast();

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = '이름을 입력해 주세요';
    if (form.name.length > 20) errs.name = '최대 20자까지 입력 가능합니다';
    if (/[^a-zA-Z가-힣0-9\s]/.test(form.name)) errs.name = '한글·영문·숫자만 입력 가능합니다';
    if (form.phone && !validatePhone(form.phone)) errs.phone = '010으로 시작하는 11자리를 입력해 주세요';
    if (form.birthdate && new Date(form.birthdate) > new Date()) errs.birthdate = '오늘 이전 날짜를 입력해 주세요';
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (form.phone) {
      const dup = existingCustomers?.find(c =>
        c.phone === form.phone && c.id !== initial?.id
      );
      if (dup) {
        if (!window.confirm(`"${dup.name}"님으로 등록된 번호입니다. 계속 저장할까요?`)) return;
      }
    }

    onSave(form);
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.length >= 5) {
      toast('태그는 최대 5개까지 등록 가능합니다', 'error');
      return;
    }
    if (!form.tags.includes(t)) {
      setField('tags', [...form.tags, t]);
    }
    setTagInput('');
  }

  function removeTag(tag) {
    setField('tags', form.tags.filter(t => t !== tag));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{initial ? '고객 정보 수정' : '새 고객 등록'}</div>

        <div className="form-group">
          <label className="label required">이름</label>
          <input
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="최대 20자"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            maxLength={20}
          />
          {errors.name && <div className="inline-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="label">연락처</label>
          <input
            className={`input ${errors.phone ? 'input-error' : ''}`}
            placeholder="010-0000-0000"
            value={form.phone}
            inputMode="tel"
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              let formatted = digits;
              if (digits.length > 7) formatted = `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
              else if (digits.length > 3) formatted = `${digits.slice(0,3)}-${digits.slice(3)}`;
              setField('phone', formatted);
            }}
          />
          {errors.phone && <div className="inline-error">{errors.phone}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label">생년월일</label>
            <input
              className={`input ${errors.birthdate ? 'input-error' : ''}`}
              type="date"
              value={form.birthdate}
              max={today()}
              onChange={e => setField('birthdate', e.target.value)}
              style={{ colorScheme: 'light' }}
            />
            {errors.birthdate && <div className="inline-error">{errors.birthdate}</div>}
          </div>

          <div className="form-group">
            <label className="label">성별</label>
            <select className="input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
              <option value="">선택 안 함</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label">선호 스타일</label>
          <input
            className="input"
            placeholder="예: 7레벨 애쉬블루, 자연스러운 웨이브"
            value={form.preferredStyle}
            onChange={e => setField('preferredStyle', e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="label">유입 경로</label>
          <select className="input" value={form.source} onChange={e => setField('source', e.target.value)}>
            <option value="">선택</option>
            <option value="지인 소개">지인 소개</option>
            <option value="SNS">SNS</option>
            <option value="인터넷 검색">인터넷 검색</option>
            <option value="직접 방문">직접 방문</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">알레르기·주의사항</label>
          <textarea
            className="input"
            placeholder="고객 카드 상단에 항상 표시됩니다 (최대 200자)"
            value={form.allergy}
            maxLength={200}
            onChange={e => setField('allergy', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">내부 메모 (비공개)</label>
          <textarea
            className="input"
            placeholder="최대 500자"
            value={form.memo}
            maxLength={500}
            onChange={e => setField('memo', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">태그 (최대 5개)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="태그 입력 후 추가"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
            />
            <button
              className="btn btn-ghost"
              style={{ minHeight: 48, padding: '0 16px' }}
              onClick={addTag}
              disabled={form.tags.length >= 5}
            >
              추가
            </button>
          </div>
          {form.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.tags.map(tag => (
                <span key={tag} className="chip active" onClick={() => removeTag(tag)}>
                  {tag} <X size={12} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Complaint toggle */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="label" style={{ margin: 0 }}>컴플레인 고객</label>
          <button
            type="button"
            onClick={() => setField('complaint', !form.complaint)}
            style={{
              width: 48, height: 28, borderRadius: 9999, border: 'none', cursor: 'pointer',
              background: form.complaint ? 'var(--secondary)' : 'var(--surface-high)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: form.complaint ? 22 : 3,
              width: 22, height: 22, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>취소</button>
          <button className="btn btn-gold btn-full" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}

export { CustomerForm };
