// LocalStorage-based data store for MIYONG-CHART

const KEYS = {
  customers: 'miyong_customers',
  appointments: 'miyong_appointments',
  sales: 'miyong_sales',
  menus: 'miyong_menus',
  presets: 'miyong_presets',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Default menus ───────────────────────────────────────────────────────────
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
  '탈색',
  '탈색 후 바이올렛',
  '7레벨 애쉬블루',
  '8레벨 골드',
  '검정 염색 (1N)',
];

// ─── Menus ────────────────────────────────────────────────────────────────────
export function getMenus() {
  return load(KEYS.menus) || DEFAULT_MENUS;
}

export function saveMenus(menus) {
  save(KEYS.menus, menus);
}

// ─── Coloring presets ─────────────────────────────────────────────────────────
export function getPresets() {
  return load(KEYS.presets) || DEFAULT_PRESETS;
}

export function savePresets(presets) {
  save(KEYS.presets, presets);
}

// ─── Customers ───────────────────────────────────────────────────────────────
export function getCustomers() {
  return load(KEYS.customers) || [];
}

export function saveCustomers(customers) {
  save(KEYS.customers, customers);
}

export function getCustomerById(id) {
  return getCustomers().find(c => c.id === id);
}

export function addCustomer(data) {
  const customers = getCustomers();
  const newCustomer = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    visitCount: 0,
    lastVisit: null,
    noShowCount: 0,
    prepaid: 0,
    complaint: false,
    reminderDone: false,
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
  const customers = getCustomers().filter(c => c.id !== id);
  saveCustomers(customers);
  const appointments = getAppointments().filter(a => a.customerId !== id);
  saveAppointments(appointments);
  const sales = getSales().filter(s => s.customerId !== id);
  saveSales(sales);
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

// ─── Appointments ─────────────────────────────────────────────────────────────
export function getAppointments() {
  return load(KEYS.appointments) || [];
}

export function saveAppointments(appointments) {
  save(KEYS.appointments, appointments);
}

export function addAppointment(data) {
  const appointments = getAppointments();
  const newAppt = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...data,
  };
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
    if (customer) {
      updateCustomer(appt.customerId, {
        visitCount: customer.visitCount + 1,
        lastVisit: appt.date,
      });
    }
  }

  if (data.status === 'noshow') {
    const appt = appointments[idx];
    const customer = getCustomerById(appt.customerId);
    if (customer) {
      updateCustomer(appt.customerId, {
        noShowCount: customer.noShowCount + 1,
      });
    }
  }

  return appointments[idx];
}

export function deleteAppointment(id) {
  const appointments = getAppointments().filter(a => a.id !== id);
  saveAppointments(appointments);
}

export function getAppointmentsByCustomer(customerId) {
  return getAppointments().filter(a => a.customerId === customerId);
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export function getSales() {
  return load(KEYS.sales) || [];
}

export function saveSales(sales) {
  save(KEYS.sales, sales);
}

export function addSale(data) {
  const sales = getSales();
  const subtotal = (data.items || []).reduce((sum, item) => sum + item.price, 0);
  const discount = data.discount || 0;
  const total = subtotal - discount;
  const newSale = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    date: data.date || new Date().toISOString().split('T')[0],
    subtotal,
    total,
    ...data,
  };
  sales.unshift(newSale);
  saveSales(sales);

  // Update prepaid if payment method is prepaid
  if (data.paymentMethod === '선불금') {
    const customer = getCustomerById(data.customerId);
    if (customer) {
      updateCustomer(data.customerId, {
        prepaid: Math.max(0, (customer.prepaid || 0) - total),
      });
    }
  }

  // Reset reminderDone so the next visit reminder reactivates
  if (data.customerId) {
    updateCustomer(data.customerId, { reminderDone: false });
  }

  return newSale;
}

export function getSalesByCustomer(customerId) {
  return getSales().filter(s => s.customerId === customerId);
}

// ─── Treatments (alias for sales by customer) ─────────────────────────────────
export function getTreatmentsByCustomer(customerId) {
  return getSalesByCustomer(customerId);
}

// ─── Remind: customers whose nextVisit is due ─────────────────────────────────
export function getRemindCustomers() {
  const customers = getCustomers();
  const sales = getSales();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const result = [];
  customers.forEach(c => {
    if (c.reminderDone) return;
    // Find the most recent sale with a nextVisit date
    const customerSales = sales
      .filter(s => s.customerId === c.id && s.nextVisit)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (customerSales.length === 0) return;
    const nextVisit = new Date(customerSales[0].nextVisit);
    nextVisit.setHours(0, 0, 0, 0);
    if (nextVisit <= in3Days) {
      const daysLeft = Math.round((nextVisit - today) / (1000 * 60 * 60 * 24));
      result.push({ ...c, _nextVisit: customerSales[0].nextVisit, _daysLeft: daysLeft });
    }
  });

  return result.sort((a, b) => a._daysLeft - b._daysLeft);
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export function getMonthlySales(year, month) {
  const sales = getSales();
  return sales.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getDailySales(dateStr) {
  return getSales().filter(s => s.date === dateStr);
}

export function getStats() {
  const customers = getCustomers();
  const sales = getSales();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // Revisit rate: % of customers with visitCount >= 2
  const revisitRate = customers.length > 0
    ? Math.round((customers.filter(c => (c.visitCount || 0) >= 2).length / customers.length) * 100)
    : 0;

  // Average spend per visiting customer
  const visitingCustomers = customers.filter(c => (c.visitCount || 0) >= 1);
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const avgSpend = visitingCustomers.length > 0
    ? Math.round(totalRevenue / visitingCustomers.length)
    : 0;

  // This month: new vs returning
  const monthSales = getMonthlySales(thisYear, thisMonth);
  const monthCustomerIds = [...new Set(monthSales.map(s => s.customerId).filter(Boolean))];
  let newThisMonth = 0;
  let returningThisMonth = 0;
  monthCustomerIds.forEach(id => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    // Check if their first sale was this month
    const customerSales = sales
      .filter(s => s.customerId === id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstSale = customerSales[0];
    if (firstSale) {
      const d = new Date(firstSale.date);
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
        newThisMonth++;
      } else {
        returningThisMonth++;
      }
    }
  });

  // Dormant: customers whose lastVisit was 90+ days ago
  const dormant = customers.filter(c => {
    if (!c.lastVisit) return false;
    const days = (now - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24);
    return days >= 90;
  }).length;

  return { revisitRate, avgSpend, newThisMonth, returningThisMonth, dormant, totalCustomers: customers.length };
}
