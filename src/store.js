// LocalStorage-based data store for MIYONG-CHART

const KEYS = {
  customers: 'miyong_customers',
  appointments: 'miyong_appointments',
  sales: 'miyong_sales',
  menus: 'miyong_menus',
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

// ─── Menus ────────────────────────────────────────────────────────────────────
export function getMenus() {
  return load(KEYS.menus) || DEFAULT_MENUS;
}

export function saveMenus(menus) {
  save(KEYS.menus, menus);
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
  // cascade delete appointments, sales
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
    status: 'pending', // pending | confirmed | completed | cancelled | noshow
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

  // If completed, update customer visitCount and lastVisit
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

  // If noshow, update customer noShowCount
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

  return newSale;
}

export function getSalesByCustomer(customerId) {
  return getSales().filter(s => s.customerId === customerId);
}

// ─── Treatments (from completed appointments + manual) ────────────────────────
export function getTreatmentsByCustomer(customerId) {
  return getSalesByCustomer(customerId);
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
