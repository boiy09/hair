import { useState, useEffect } from 'react';
import { Plus, X, Camera, Palette } from 'lucide-react';
import { getMenus, addSale, getCustomerById, getPresets } from '../store';
import { today, formatMoney } from '../utils';
import { useToast } from '../components/Toast';

const DRAFT_KEY = (customerId) => `miyong_draft_sale_${customerId || 'new'}`;

export default function SaleForm({ customerId, customerName, onClose, onSave, initial }) {
  const menus = getMenus();
  const presets = getPresets();
  const customer = customerId ? getCustomerById(customerId) : null;
  const toast = useToast();

  const draftKey = DRAFT_KEY(customerId);
  const savedDraft = (() => {
    try { return JSON.parse(localStorage.getItem(draftKey)); } catch { return null; }
  })();

  const [hasDraft] = useState(!!savedDraft && !initial);
  const [showDraftBanner, setShowDraftBanner] = useState(!!savedDraft && !initial);

  const baseForm = {
    date: today(),
    customerId: customerId || '',
    customerName: customerName || '',
    items: [],
    detail: '',
    coloring: '',
    chemical: '',
    duration: '',
    discount: 0,
    discountReason: '',
    paymentMethod: '현금',
    nextVisit: '',
    photos: [],
    specialNote: '',
  };

  const [form, setForm] = useState(
    initial
      ? { ...baseForm, ...initial }
      : (savedDraft ? { ...baseForm, ...savedDraft } : baseForm)
  );
  const [errors, setErrors] = useState({});

  // Auto-save draft on form change
  useEffect(() => {
    if (initial) return;
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  function clearDraft() {
    localStorage.removeItem(draftKey);
  }

  const subtotal = form.items.reduce((sum, i) => sum + (i.price || 0), 0);
  const total = Math.max(0, subtotal - (form.discount || 0));
  const prepaid = customer?.prepaid || 0;

  function toggleMenu(menu) {
    const exists = form.items.find(i => i.id === menu.id);
    if (exists) {
      setForm(f => ({ ...f, items: f.items.filter(i => i.id !== menu.id) }));
    } else {
      setForm(f => ({ ...f, items: [...f.items, { id: menu.id, name: menu.name, price: menu.price }] }));
    }
  }

  function updateItemPrice(id, price) {
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.id === id ? { ...i, price: Number(price) || 0 } : i),
    }));
  }

  function validate() {
    const errs = {};
    if (form.items.length === 0) errs.items = '시술 항목을 선택해 주세요';
    if (!form.paymentMethod) errs.paymentMethod = '결제 수단을 선택해 주세요';
    if (form.discount < 0) errs.discount = '0 이상이어야 합니다';
    if (total <= 0 && form.items.length > 0) errs.total = '결제 금액이 0원입니다';
    return errs;
  }

  function handlePhotos(e) {
    const files = Array.from(e.target.files);
    if (form.photos.length + files.length > 10) {
      toast('기록 1건당 최대 10장까지 등록 가능합니다', 'error');
      return;
    }
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast('10MB 이하 파일만 가능합니다', 'error');
      return;
    }

    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(results => {
      setForm(f => ({ ...f, photos: [...f.photos, ...results] }));
    });
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (form.paymentMethod === '선불금' && total > prepaid) {
      toast(`선불금 부족! 잔액: ${formatMoney(prepaid)}, 부족분: ${formatMoney(total - prepaid)}`, 'error');
      return;
    }

    if (total > 1000000) {
      if (!window.confirm(`${formatMoney(total)}이 맞나요?`)) return;
    }

    addSale({ ...form, subtotal, total, discount: form.discount || 0 });
    clearDraft();
    onSave?.();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">시술 기록 추가</div>

        {/* Draft recovery banner */}
        {showDraftBanner && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'var(--primary-container)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 13,
          }}>
            <span>📝 이전에 작성 중이던 내용을 불러왔어요</span>
            <button
              onClick={() => { setForm(baseForm); clearDraft(); setShowDraftBanner(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-dark)', fontWeight: 600, fontSize: 12 }}
            >
              초기화
            </button>
          </div>
        )}

        {customerName && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--primary-container)', borderRadius: 'var(--radius-sm)', fontSize: 14 }}>
            고객: <strong>{customerName}</strong>
          </div>
        )}

        <div className="form-group">
          <label className="label required">날짜</label>
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ colorScheme: 'light' }}
          />
        </div>

        <div className="form-group">
          <label className="label required">시술 항목</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {menus.map(menu => {
              const selected = form.items.find(i => i.id === menu.id);
              return (
                <button
                  key={menu.id}
                  className={`chip ${selected ? 'active' : ''}`}
                  onClick={() => toggleMenu(menu)}
                >
                  {menu.name}
                </button>
              );
            })}
          </div>
          {errors.items && <div className="inline-error">{errors.items}</div>}

          {form.items.length > 0 && (
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {form.items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                  <input
                    className="input"
                    type="number"
                    value={item.price}
                    onChange={e => updateItemPrice(item.id, e.target.value)}
                    inputMode="numeric"
                    style={{ width: 110, textAlign: 'right', minHeight: 36, padding: '6px 10px' }}
                  />
                  <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--text-secondary)' }}>원</span>
                </div>
              ))}
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>소계</span>
                <span style={{ fontWeight: 700 }}>{formatMoney(subtotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Coloring / 넘버링 */}
        <div className="form-group">
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Palette size={14} /> 컬러링 넘버링
          </label>
          {/* Preset chips */}
          {presets.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
              {presets.map(p => (
                <button
                  key={p}
                  className={`chip ${form.coloring === p ? 'active' : ''}`}
                  style={{ fontSize: 12, minHeight: 30, padding: '4px 12px', flexShrink: 0 }}
                  onClick={() => setForm(f => ({ ...f, coloring: f.coloring === p ? '' : p }))}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <input
            className="input"
            placeholder="예: 8레벨 애쉬블루, 탈색 후 바이올렛"
            value={form.coloring}
            onChange={e => setForm(f => ({ ...f, coloring: e.target.value }))}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="label">시술 세부 내용</label>
          <textarea
            className="input"
            placeholder="예: 7레벨 애쉬블루, 중간 허리 길이 (최대 300자)"
            value={form.detail}
            maxLength={300}
            onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="label">사용 약품·제품</label>
          <input
            className="input"
            placeholder="브랜드명 + 제품명 + 농도"
            value={form.chemical}
            onChange={e => setForm(f => ({ ...f, chemical: e.target.value }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label">소요 시간 (분)</label>
            <input
              className="input"
              type="number"
              placeholder="예: 90"
              value={form.duration}
              inputMode="numeric"
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">다음 방문 권장일</label>
            <input
              className="input"
              type="date"
              value={form.nextVisit}
              style={{ colorScheme: 'light' }}
              onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="label">할인 금액 (원)</label>
            <input
              className="input"
              type="number"
              value={form.discount || ''}
              inputMode="numeric"
              placeholder="0"
              onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="form-group">
            <label className="label">결제 수단</label>
            <select
              className="input"
              value={form.paymentMethod}
              onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
            >
              <option value="현금">현금</option>
              <option value="카드">카드</option>
              <option value="계좌이체">계좌이체</option>
              <option value="선불금">선불금 (잔액: {formatMoney(prepaid)})</option>
            </select>
            {errors.paymentMethod && <div className="inline-error">{errors.paymentMethod}</div>}
          </div>
        </div>

        {form.discount > 0 && (
          <div className="form-group">
            <label className="label">할인 사유</label>
            <input
              className="input"
              placeholder="단골 할인, 이벤트 등"
              value={form.discountReason}
              onChange={e => setForm(f => ({ ...f, discountReason: e.target.value }))}
            />
          </div>
        )}

        {/* Total */}
        {form.items.length > 0 && (
          <div style={{
            background: 'var(--primary-container)',
            borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>최종 결제액</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)' }}>{formatMoney(total)}</span>
            </div>
            {form.discount > 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                할인 {formatMoney(form.discount)} 적용
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        <div className="form-group">
          <label className="label">시술 사진 ({form.photos.length}/10)</label>
          {form.photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
              {form.photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={p} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover' }} />
                  <button
                    onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--error)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 48, borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-low)',
              border: '1.5px dashed var(--border)',
              cursor: form.photos.length >= 10 ? 'not-allowed' : 'pointer',
              opacity: form.photos.length >= 10 ? 0.5 : 1,
              color: 'var(--text-secondary)', fontSize: 14,
            }}
          >
            <Camera size={18} /> 사진 추가 (갤러리 또는 카메라)
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic"
              multiple
              style={{ display: 'none' }}
              disabled={form.photos.length >= 10}
              onChange={handlePhotos}
            />
          </label>
        </div>

        <div className="form-group">
          <label className="label">특이사항·메모</label>
          <textarea
            className="input"
            placeholder="두피 상태, 고객 반응, 다음 시술 주의사항 (최대 400자)"
            value={form.specialNote}
            maxLength={400}
            onChange={e => setForm(f => ({ ...f, specialNote: e.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-full" onClick={onClose}>취소</button>
          <button className="btn btn-gold btn-full" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}
