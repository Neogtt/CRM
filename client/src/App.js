import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Overview from './pages/Overview';
import ExcelImport from './pages/ExcelImport';
import CariHesaplar from './pages/CariHesaplar';
import NewCustomer from './pages/NewCustomer';
import EskiKayitDuzenleme from './pages/EskiKayitDuzenleme';
import InteractionLog from './pages/InteractionLog';
import QuoteManagement from './pages/QuoteManagement';
import ProformaManagement from './pages/ProformaManagement';
import OrderOperations from './pages/OrderOperations';
import InvoiceOperations from './pages/InvoiceOperations';
import PaymentPlan from './pages/PaymentPlan';
import ETATracking from './pages/ETATracking';
import FairRecords from './pages/FairRecords';
import ContentArchive from './pages/ContentArchive';
import SalesAnalytics from './pages/SalesAnalytics';
import HolidayGreetings from './pages/HolidayGreetings';
import Goals from './pages/Goals';
import Representatives from './pages/Representatives';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { getCurrentUser, getAllowedMenus } from './utils/api';
import { logout } from './utils/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async () => {
    try {
      const userResponse = await getCurrentUser();
      const userData = userResponse.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      const menusResponse = await getAllowedMenus();
      setMenus(menusResponse.data || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setMenus([]);
      window.location.href = '/login';
    }
  };

  const token = localStorage.getItem('token');

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={loadUserData} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <div className="sidebar">
          <h2>EXPOCRM</h2>
          {user && (
            <div style={{ padding: '10px', marginBottom: '10px', background: '#2c3e50', borderRadius: '5px' }}>
              <p style={{ fontSize: '12px', color: '#ecf0f1', margin: '5px 0' }}>
                👤 {user.username}
              </p>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '5px',
                  marginTop: '5px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Çıkış Yap
              </button>
            </div>
          )}
          <ul className="sidebar-menu">
            {menus.map((menu) => (
              <li key={menu.path}>
                <NavLink
                  to={menu.path}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {menu.icon} {menu.name}
                </NavLink>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '30px', padding: '10px', background: '#34495e', borderRadius: '5px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>💾 Veri Depolama</h4>
            <p style={{ fontSize: '12px', color: '#ecf0f1', margin: '5px 0' }}>
              Veriler server Excel dosyasında saklanıyor:
              <br />
              <code style={{ fontSize: '11px' }}>temp/local.xlsx</code>
            </p>
          </div>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/excel-import" element={<ProtectedRoute><ExcelImport /></ProtectedRoute>} />
            <Route path="/cari-hesaplar" element={<ProtectedRoute><CariHesaplar /></ProtectedRoute>}>
              <Route path="yeni-kayit" element={<NewCustomer />} />
              <Route path="eski-kayit-duzenleme" element={<EskiKayitDuzenleme />} />
              <Route path="eski-kayit-duzenleme/:id" element={<EskiKayitDuzenleme />} />
            </Route>
            <Route path="/interaction-log" element={<ProtectedRoute><InteractionLog /></ProtectedRoute>} />
            <Route path="/quote-management" element={<ProtectedRoute><QuoteManagement /></ProtectedRoute>} />
            <Route path="/proforma-management" element={<ProtectedRoute><ProformaManagement /></ProtectedRoute>} />
            <Route path="/order-operations" element={<ProtectedRoute><OrderOperations /></ProtectedRoute>} />
            <Route path="/invoice-operations" element={<ProtectedRoute><InvoiceOperations /></ProtectedRoute>} />
            <Route path="/payment-plan" element={<ProtectedRoute><PaymentPlan /></ProtectedRoute>} />
            <Route path="/eta-tracking" element={<ProtectedRoute><ETATracking /></ProtectedRoute>} />
            <Route path="/fair-records" element={<ProtectedRoute><FairRecords /></ProtectedRoute>} />
            <Route path="/content-archive" element={<ProtectedRoute><ContentArchive /></ProtectedRoute>} />
            <Route path="/sales-analytics" element={<ProtectedRoute><SalesAnalytics /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/holiday-greetings" element={<ProtectedRoute><HolidayGreetings /></ProtectedRoute>} />
            <Route path="/representatives" element={<ProtectedRoute><Representatives /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

