// Kullanıcı tanımları ve yetkileri
const users = {
  'Export1': {
    password: 'Seker12345!',
    role: 'export',
    permissions: {
      // Fatura işlemleri ve ETA izleme hariç tüm menülere erişim
      canAccessInvoiceOperations: false,
      canAccessETATracking: false,
      canAccessAllOtherMenus: true
    }
  },
  'admin': {
    password: 'Seker12345!',
    role: 'admin',
    permissions: {
      // Tüm menülere erişim
      canAccessInvoiceOperations: true,
      canAccessETATracking: true,
      canAccessAllOtherMenus: true
    }
  },
  'Kambiyo': {
    password: 'Seker12345!',
    role: 'kambiyo',
    permissions: {
      // Sadece Fatura işlemleri ve ETA izleme
      canAccessInvoiceOperations: true,
      canAccessETATracking: true,
      canAccessAllOtherMenus: false
    }
  }
};

// Menü erişim kontrolü
function canAccessMenu(username, menuPath) {
  if (!username || !users[username]) {
    return false;
  }

  const user = users[username];
  const permissions = user.permissions;

  // Fatura işlemleri
  if (menuPath === '/invoice-operations') {
    return permissions.canAccessInvoiceOperations;
  }

  // ETA İzleme
  if (menuPath === '/eta-tracking') {
    return permissions.canAccessETATracking;
  }

  // Diğer tüm menüler
  return permissions.canAccessAllOtherMenus;
}

// Tüm erişilebilir menüleri döndür
function getAllowedMenus(username) {
  if (!username || !users[username]) {
    return [];
  }

  const allMenus = [
    { path: '/', name: 'Genel Bakış', icon: '📊' },
    { path: '/excel-import', name: 'Excel İçe Aktarma', icon: '📥' },
    { path: '/cari-hesaplar', name: 'Cari Hesaplar', icon: '🧑‍💼' },
    { path: '/interaction-log', name: 'Etkileşim Günlüğü', icon: '☎️' },
    { path: '/quote-management', name: 'Teklif Yönetimi', icon: '💰' },
    { path: '/proforma-management', name: 'Proforma Yönetimi', icon: '📄' },
    { path: '/order-operations', name: 'Sipariş Operasyonları', icon: '🚚' },
    { path: '/invoice-operations', name: 'Fatura işlemleri', icon: '📑' },
    { path: '/payment-plan', name: 'Tahsilat Planı', icon: '⏰' },
    { path: '/eta-tracking', name: 'ETA İzleme', icon: '🛳️' },
    { path: '/fair-records', name: 'Fuar Kayıtları', icon: '🎫' },
    { path: '/content-archive', name: 'İçerik Arşivi', icon: '🗂️' },
    { path: '/sales-analytics', name: 'Satış Analitiği', icon: '📈' },
    { path: '/goals', name: 'Hedefler', icon: '🎯' },
    { path: '/holiday-greetings', name: 'Özel Gün Tebrikleri', icon: '🎉' },
    { path: '/representatives', name: 'Satış Temsilcileri', icon: '👤' },
  ];

  return allMenus.filter(menu => canAccessMenu(username, menu.path));
}

module.exports = {
  users,
  canAccessMenu,
  getAllowedMenus
};

