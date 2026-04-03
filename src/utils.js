export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

export function formatDateKr(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const weekdays = ['일','월','화','수','목','금','토'];
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function getDaysAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff/7)}주 전`;
  if (diff < 365) return `${Math.floor(diff/30)}개월 전`;
  return `${Math.floor(diff/365)}년 전`;
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `${diff}일 후`;
}

export function getInitials(name) { return name ? name.charAt(0) : '?'; }
export function today() { return new Date().toISOString().split('T')[0]; }
export function validatePhone(phone) {
  const d = phone.replace(/\D/g,'');
  return d.startsWith('010') && d.length === 11;
}

export function getChosung(str) {
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  return str.split('').map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code/588)];
  }).join('');
}

// #1 검색 고도화 — 이름/전화/초성/메모/태그 통합 검색
export function matchesSearch(customer, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const name = customer.name || '';
  const phone = (customer.phone || '').replace(/\D/g,'');
  const memo = (customer.memo || '').toLowerCase();
  const tags = (customer.tags || []).join(' ').toLowerCase();
  const preferredStyle = (customer.preferredStyle || '').toLowerCase();
  const qDigits = q.replace(/\D/g,'');

  if (qDigits.length >= 4 && phone.endsWith(qDigits)) return true;
  if (name.toLowerCase().includes(q)) return true;
  if (getChosung(name).includes(q.toUpperCase())) return true;
  if (memo.includes(q)) return true;
  if (tags.includes(q)) return true;
  if (preferredStyle.includes(q)) return true;
  return false;
}

export function getStatusLabel(status) {
  return { pending:'대기', confirmed:'확정', completed:'완료', cancelled:'취소', noshow:'노쇼' }[status] || status;
}
export function getStatusClass(status) {
  return { pending:'badge-gray', confirmed:'badge-blue', completed:'badge-green', cancelled:'badge-gray', noshow:'badge-red' }[status] || 'badge-gray';
}
export function getTimeSlots() {
  const slots = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
}
