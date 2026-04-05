// Utility functions

export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

export function formatDateKr(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getDaysAgo(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
  if (diff < 365) return `${Math.floor(diff / 30)}개월 전`;
  return `${Math.floor(diff / 365)}년 전`;
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `${diff}일 후`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0);
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('010') && digits.length === 11;
}

export function getChosung(str) {
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  return str.split('').map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 588)];
  }).join('');
}

export function matchesSearch(customer, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const name = customer.name || '';
  const phone = (customer.phone || '').replace(/\D/g, '');
  const qDigits = q.replace(/\D/g, '');

  // Phone last 4 digits
  if (qDigits.length >= 4 && phone.endsWith(qDigits)) return true;

  // Name match
  if (name.toLowerCase().includes(q)) return true;

  // Chosung match
  if (getChosung(name).includes(q.toUpperCase())) return true;

  // Memo search
  if ((customer.memo || '').toLowerCase().includes(q)) return true;

  // Tag search
  if ((customer.tags || []).some(t => t.toLowerCase().includes(q))) return true;

  // preferredStyle search
  if ((customer.preferredStyle || '').toLowerCase().includes(q)) return true;

  return false;
}

export function getStatusLabel(status) {
  const map = {
    pending: '대기',
    confirmed: '확정',
    completed: '완료',
    cancelled: '취소',
    noshow: '노쇼',
  };
  return map[status] || status;
}

export function getStatusClass(status) {
  const map = {
    pending: 'badge-gray',
    confirmed: 'badge-blue',
    completed: 'badge-green',
    cancelled: 'badge-gray',
    noshow: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

export function getTimeSlots() {
  const slots = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}
