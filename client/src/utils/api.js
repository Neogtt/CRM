import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatası durumunda logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Customers
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const searchCustomers = (query, filters) => api.post('/customers/search', { query, filters });
export const syncCustomers = () => api.post('/customers/sync');

// Quotes
export const getQuotes = () => api.get('/quotes');
export const getQuote = (id) => api.get(`/quotes/${id}`);
export const createQuote = (data) => api.post('/quotes', data);
export const updateQuote = (id, data) => api.put(`/quotes/${id}`, data);
export const deleteQuote = (id) => api.delete(`/quotes/${id}`);
export const getPendingQuotes = () => api.get('/quotes/pending/all');
export const getAutoQuoteNo = () => api.get('/quotes/auto/quote-no');
export const searchQuotes = (filters) => api.post('/quotes/search', filters);

// Proformas
export const getProformas = () => api.get('/proformas');
export const getProforma = (id) => api.get(`/proformas/${id}`);
export const getProformasByCustomer = (customerName) => api.get(`/proformas/customer/${encodeURIComponent(customerName)}`);
export const createProforma = (data) => api.post('/proformas', data);
export const updateProforma = (id, data) => api.put(`/proformas/${id}`, data);
export const deleteProforma = (id) => api.delete(`/proformas/${id}`);
export const getPendingProformas = () => api.get('/proformas/pending/all');
export const getShipmentPending = () => api.get('/proformas/shipment/pending');
export const getShippedOrders = () => api.get('/proformas/shipment/shipped');
export const getDeliveredOrders = () => api.get('/proformas/shipment/delivered');
export const convertProformaToOrder = (id, orderFormData) => api.post(`/proformas/${id}/convert-to-order`, orderFormData);

// Orders
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderTerminDate = (id, terminDate) => api.put(`/orders/${id}/termin-date`, { 'Termin Tarihi': terminDate });
export const shipOrder = (id, shipDate) => api.post(`/orders/${id}/ship`, { 'Sevk Tarihi': shipDate });
export const recallOrder = (id) => api.post(`/orders/${id}/recall`);
export const getOrderStats = () => api.get('/orders/stats/total');
export const updateProformaDeliveryDate = (id, deliveryDate) => api.put(`/proformas/${id}/update-delivery-date`, { 'Ulaşma Tarihi': deliveryDate });
export const returnProformaToShipping = (id, etaData) => api.post(`/proformas/${id}/return-to-shipping`, etaData);

// Invoices
export const getInvoices = () => api.get('/invoices');
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const getPendingOrders = () => api.get('/invoices/pending-orders');
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
export const updateInvoiceDates = (id, dates) => api.put(`/invoices/${id}/dates`, dates);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
export const getInvoicesByDateRange = (startDate, endDate) => api.post('/invoices/date-range', { startDate, endDate });
export const getInvoiceStats = () => api.get('/invoices/stats/total');

// ETA
export const getETAs = () => api.get('/eta');
export const getETAByProforma = (proformaNo) => api.get(`/eta/proforma/${proformaNo}`);
export const getETAShippedOrders = () => api.get('/eta/shipped-orders');
export const getETADeliveredOrders = () => api.get('/eta/delivered');
export const createETA = (data) => api.post('/eta', data);
export const updateETA = (id, data) => api.put(`/eta/${id}`, data);
export const updateOrCreateETA = (data) => api.post('/eta/update-or-create', data);
export const deleteETA = (id) => api.delete(`/eta/${id}`);
export const getETATracking = () => api.get('/eta/tracking/all');
export const markOrderAsDelivered = (customerName, proformaNo) => api.post('/eta/mark-delivered', { customerName, proformaNo });
export const recallShipment = (customerName, proformaNo) => api.post('/eta/recall-shipment', { customerName, proformaNo });

// Fairs
export const getFairs = () => api.get('/fairs');
export const getFair = (id) => api.get(`/fairs/${id}`);
export const getFairsByFairName = (fairName) => api.get(`/fairs/by-fair/${encodeURIComponent(fairName)}`);
export const getUniqueFairs = () => api.get('/fairs/unique-fairs');
export const createFair = (data) => api.post('/fairs', data);
export const updateFair = (id, data) => api.put(`/fairs/${id}`, data);
export const deleteFair = (id) => api.delete(`/fairs/${id}`);

// Analytics
export const getOverview = () => api.get('/analytics/overview');
export const getSalesAnalytics = (filters) => api.post('/analytics/sales', filters);
export const getSalesTotal = () => api.get('/analytics/sales/total');
export const getSalesDateRange = () => api.get('/analytics/sales/date-range');
export const getSalesSegments = () => api.get('/analytics/sales/segments');
export const getSalesCustomers = (dateRange) => api.post('/analytics/sales/customers', dateRange);
export const getSalesPendingOrders = () => api.get('/analytics/sales/pending-orders');

// Email
export const sendEmail = (data) => api.post('/email/send', data);
export const sendBulkEmail = (data) => api.post('/email/send-bulk', data);
export const getHolidayTemplate = (holidayName, language) => api.get(`/email/templates/holiday/${holidayName}?language=${language}`);
export const getFairTemplate = (language) => api.get(`/email/templates/fair?language=${language}`);
export const extractEmails = (emailString) => api.post('/email/extract-emails', { emailString });

// Interactions
export const getInteractions = () => api.get('/interactions');
export const getInteraction = (id) => api.get(`/interactions/${id}`);
export const createInteraction = (data) => api.post('/interactions', data);
export const updateInteraction = (id, data) => api.put(`/interactions/${id}`, data);
export const deleteInteraction = (id) => api.delete(`/interactions/${id}`);
export const searchInteractions = (filters) => api.post('/interactions/search', filters);

// Goals
export const getGoals = () => api.get('/goals');
export const getGoal = (id) => api.get(`/goals/${id}`);
export const getGoalByYear = (year) => api.get(`/goals/year/${year}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const getCurrentYearProgress = () => api.get('/goals/current/progress');

// Holiday Greetings
export const getHolidayGreetingEmails = () => api.get('/holiday-greetings/emails');
export const getHolidayTemplateNames = () => api.get('/holiday-greetings/templates');
export const getHolidayTemplateLanguages = (holidayName) => api.get(`/holiday-greetings/templates/${encodeURIComponent(holidayName)}/languages`);
export const getCountryLanguageMap = () => api.get('/holiday-greetings/country-language-map');

// Excel Operations
export const getExcelStatus = () => api.get('/excel/status');
export const downloadExcelTemplate = (withDemo = false) => {
  const url = `/api/excel/template?demo=${withDemo}`;
  window.open(url, '_blank');
  return Promise.resolve({ data: { success: true } });
};
export const downloadExcelFile = () => {
  const url = '/api/excel/download';
  window.open(url, '_blank');
  return Promise.resolve({ data: { success: true } });
};

// Representatives
export const getRepresentatives = () => api.get('/representatives');
export const getRepresentative = (id) => api.get(`/representatives/${id}`);
export const createRepresentative = (data) => api.post('/representatives', data);
export const updateRepresentative = (id, data) => api.put(`/representatives/${id}`, data);
export const deleteRepresentative = (id) => api.delete(`/representatives/${id}`);
export const getRepresentativeRegions = () => api.get('/representatives/options/regions');
export const getRepresentativeCountries = () => api.get('/representatives/options/countries');

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const logout = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');

// Menus
export const getAllowedMenus = () => api.get('/menus/allowed');

// Cleanup
export const cleanupRepresentatives = () => api.post('/cleanup/cleanup-representatives');

export default api;

