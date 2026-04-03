// LocalStorage-based data store for MIYONG-CHART

const KEYS = {
  customers: 'miyong_customers',
  appointments: 'miyong_appointments',
  sales: 'miyong_sales',
  menus: 'miyong_menus',
  presets: 'miyong_presets',
};

function load(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const DEFAULT_MENUS = [
  { id: 'm1', name: '커트', price: 30000 },
  { id: 'm2', name: '염색', price: 80000 },
  { id: 'm3', name: '펌', price: 100000 },
  { id: 'm4', name: '클리닉', price: 50000 },
  { id: 'm5', name: '드라이', price: 15000 },
  { id: 'm6', name: '업스타일', price: 60000 },
  { id: 'm7', name: '탈색', price: 120000 },
  { id: 'm8', name: '매직', price: 90000 },
];

const DEFAULT_PRESETS = [
  '탈색', '탈색 후 바이올렛', '7레벨 애쉬블루', '8레벨 골드', '검정 염색 (1N)',
];

// ── Menus ─────────────────────────────────────────────────────────────────────
export function getMenus() { return load(KEYS.menus) || DEFAULT_MENUS; }
export function saveMenus(menus) { save(KEYS.menus, menus); }

// ── Presets (자주 쓰는 컬러) ──────────────────────────────────────────────────
export function getPresets() { return load(KEYS.presets) || DEFAULT_PRESETS; }
export function savePresets(presets) { save(KEYS.presets, presets); }

// ── Customers ─────────────────────────────────────────────────────────────────
export function getCustomers() { return load(KEYS.customers) || []; }
export function saveCustomers(customers) { save(KEYS.customers, customers); }
export function getCustomerById(id) { return getCustomers().find(c => c.id === id); }

export function addCustomer(data) {
  const customers = getCustomers();
  const newCustomer = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    visitCount: 0, lastVisit: null, noShowCount: 0, prepaid: 0,
    complaint: false, reminderDone: false,
    ...data,
  };
  customers.unshift(newCustomer);
  saveCustomers(customers);
  return newCustomer;
}

export function updateCustomer(id, data) {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return null;
  customers[idx] = { ...customers[idx], ...data };
  saveCustomers(customers);
  return customers[idx];
}

export function deleteCustomer(id) {
  saveCustomers(getCustomers().filter(c => c.id !== id));
  saveAppointments(getAppointments().filter(a => a.customerId !== id));
  saveSales(getSales().filter(s => s.customerId !== id));
}

export function getGrade(visitCount) {
  if (visitCount >= 11) return 'VIP';
  if (visitCount >= 6) return '단골';
  if (visitCount >= 2) return '일반';
  return '신규';
}
export function getGradeClass(visitCount) {
  const g = getGrade(visitCount);
  if (g === 'VIP') return 'grade-vip';
  if (g === '단골') return 'grade-loyal';
  if (g === '일반') return 'grade-regular';
  return 'grade-new';
}
export function getGradeBadgeClass(visitCount) {
  const g = getGrade(visitCount);
  if (g === 'VIP') return 'badge-gold';
  if (g === '단골') return 'badge-green';
  if (g === '일반') return 'badge-blue';
  return 'badge-gray';
}

// 리마인드: 다음 방문 예정일 지난 고객 목록
export function getRemindCustomers() {
  const customers = getCustomers();
  const sales = getSales();
  const todayStr = new Date().toISOString().split('T')[0];
  const result = [];
  for (const c of customers) {
    if (c.reminderDone) continue;
    const cSales = sales.filter(s => s.customerId === c.id && s.nextVisit)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!cSales.length) continue;
    const nextVisit = cSales[0].nextVisit;
    const daysLeft = Math.floor((new Date(nextVisit) - new Date(todayStr)) / 86400000);
    if (daysLeft <= 3) result.push({ customer: c, nextVisit, daysLeft });
  }
  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ── Appointments ──────────────────────────────────────────────────────────────
export function getAppointments() { return load(KEYS.appointments) || []; }
export function saveAppointments(appointments) { save(KEYS.appointments, appointments); }

export function addAppointment(data) {
  const appointments = getAppointments();
  const newAppt = { id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'pending', ...data };
  appointments.unshift(newAppt);
  saveAppointments(appointments);
  return newAppt;
}

export function updateAppointment(id, data) {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return null;
  appointments[idx] = { ...appointments[idx], ...data };
  saveAppointments(appointments);
  if (data.status === 'completed') {
    const appt = appointments[idx];
    const customer = getCustomerById(appt.customerId);
    if (customer) updateCustomer(appt.customerId, { visitCount: customer.visitCount + 1, lastVisit: appt.date });
  }
  if (data.status === 'noshow') {
    const appt = appointments[idx];
    const customer = getCustomerById(appt.customerId);
    if (customer) updateCustomer(appt.customerId, { noShowCount: customer.noShowCount + 1 });
  }
  return appointments[idx];
}

export function deleteAppointment(id) { saveAppointments(getAppointments().filter(a => a.id !== id)); }
export function getAppointmentsByCustomer(customerId) { return getAppointments().filter(a => a.customerId === customerId); }

// ── Sales ─────────────────────────────────────────────────────────────────────
export function getSales() { return load(KEYS.sales) || []; }
export function saveSales(sales) { save(KEYS.sales, sales); }

export function addSale(data) {
  const sales = getSales();
  const subtotal = (data.items || []).reduce((sum, item) => sum + item.price, 0);
  const discount = data.discount || 0;
  const total = subtotal - discount;
  const newSale = { id: Date.now().toString(), createdAt: new Date().toISOString(), date: data.date || new Date().toISOString().split('T')[0], subtotal, total, ...data };
  sales.unshift(newSale);
  saveSales(sales);
  if (data.paymentMethod === '선불금') {
    const customer = getCustomerById(data.customerId);
    if (customer) updateCustomer(data.customerId, { prepaid: Math.max(0, (customer.prepaid || 0) - total) });
  }
  // 새 시술 → 리마인드 초기화
  if (data.customerId) updateCustomer(data.customerId, { reminderDone: false });
  return newSale;
}

export function getSalesByCustomer(customerId) { return getSales().filter(s => s.customerId === customerId); }
export function getTreatmentsByCustomer(customerId) { return getSalesByCustomer(customerId); }

// ── Statistics ────────────────────────────────────────────────────────────────
export function getMonthlySales(year, month) {
  return getSales().filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; });
}
export function getDailySales(dateStr) { return getSales().filter(s => s.date === dateStr); }

export function getStats() {
  const customers = getCustomers();
  const sales = getSales();
  const todayStr = new Date().toISOString().split('T')[0];

  // 재방문율
  const returning = customers.filter(c => (c.visitCount || 0) >= 2).length;
  const revisitRate = customers.length > 0 ? Math.round((returning / customers.length) * 100) : 0;

  // 객단가 (avg spend per visiting customer)
  const totalRevenue = sales.reduce((s, x) => s + (x.total || 0), 0);
  const visitingCustomers = customers.filter(c => (c.visitCount || 0) > 0).length;
  const avgSpend = visitingCustomers > 0 ? Math.round(totalRevenue / visitingCustomers) : 0;

  // 이번 달 신규 vs 기존
  const now = new Date();
  const thisMonthSales = getMonthlySales(now.getFullYear(), now.getMonth());
  const thisMonthCustomerIds = [...new Set(thisMonthSales.map(s => s.customerId).filter(Boolean))];
  const newThisMonth = thisMonthCustomerIds.filter(id => {
    const c = customers.find(x => x.id === id);
    return c && new Date(c.createdAt).getMonth() === now.getMonth() && new Date(c.createdAt).getFullYear() === now.getFullYear();
  }).length;
  const returningThisMonth = thisMonthCustomerIds.length - newThisMonth;

  // 휴면 고객 (90일 이상 미방문, 방문 이력 있음)
  const dormant = customers.filter(c => {
    if (!c.lastVisit || (c.visitCount || 0) === 0) return false;
    const days = Math.floor((new Date() - new Date(c.lastVisit)) / 86400000);
    return days >= 90;
  }).length;

  return { revisitRate, avgSpend, newThisMonth, returningThisMonth, dormant, totalCustomers: customers.length };
}
