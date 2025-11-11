import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getOverview, getPendingQuotes, getPendingProformas, getShippedOrders, getDeliveredOrders, getSalesTotal, getSalesPendingOrders, getInvoices, getExcelStatus, downloadExcelTemplate, downloadExcelFile } from '../utils/api';
import { smartToNum } from '../utils/helpers';

function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [pendingProformas, setPendingProformas] = useState([]);
  const [shipped, setShipped] = useState([]);
  const [delivered, setDelivered] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingOrdersData, setPendingOrdersData] = useState(null);
  const [dueDateInvoices, setDueDateInvoices] = useState({
    overdue: [],
    dueToday: [],
    dueIn3Days: [],
  });
  const [excelStatus, setExcelStatus] = useState(null);
  const [showInitialSetup, setShowInitialSetup] = useState(false);

  useEffect(() => {
    loadData();
    checkExcelStatus();
  }, []);

  const checkExcelStatus = async () => {
    try {
      const response = await getExcelStatus();
      setExcelStatus(response.data || {
        exists: false,
        hasData: false,
        customersCount: 0,
        quotesCount: 0,
        proformasCount: 0,
        invoicesCount: 0,
        representativesCount: 0,
        goalsCount: 0,
        interactionsCount: 0,
        fairsCount: 0
      });
      // Show initial setup message if no data exists
      if (response.data && !response.data.hasData) {
        setShowInitialSetup(true);
      }
    } catch (error) {
      console.error('Error checking Excel status:', error);
      // Set default values on error
      setExcelStatus({
        exists: false,
        hasData: false,
        customersCount: 0,
        quotesCount: 0,
        proformasCount: 0,
        invoicesCount: 0,
        representativesCount: 0,
        goalsCount: 0,
        interactionsCount: 0,
        fairsCount: 0
      });
    }
  };

  const handleDownloadTemplate = async (withDemo = false) => {
    try {
      const response = await downloadExcelTemplate(withDemo);
      // Create download link
      const url = `/api/excel/template?demo=${withDemo}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Template indirme hatası: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const url = '/api/excel/download';
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Excel indirme hatası: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Refresh Excel status after loading data
      await checkExcelStatus();
      const [statsRes, quotesRes, proformasRes, shippedRes, deliveredRes, totalRes, pendingOrdersRes, invoicesRes] = await Promise.all([
        getOverview(),
        getPendingQuotes(),
        getPendingProformas(),
        getShippedOrders(),
        getDeliveredOrders(),
        getSalesTotal(),
        getSalesPendingOrders(),
        getInvoices(),
      ]);

      setStats(statsRes.data || {
        pendingQuotes: { count: 0, total: 0 },
        pendingProformas: { count: 0, total: 0 },
        shipped: { count: 0 },
        invoices: { count: 0, total: 0 }
      });
      setPendingQuotes(quotesRes.data?.quotes || []);
      setPendingProformas(proformasRes.data?.proformas || []);
      setShipped(shippedRes.data || []);
      setDelivered(deliveredRes.data || []);
      setTotalAmount(totalRes.data?.total || 0);
      setPendingOrdersData(pendingOrdersRes.data || { total: 0, count: 0, orders: [] });
      
      // Process invoices by due date
      processDueDateInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Error loading overview data:', error);
      // Set default values on error
      setStats({
        pendingQuotes: { count: 0, total: 0 },
        pendingProformas: { count: 0, total: 0 },
        shipped: { count: 0 },
        invoices: { count: 0, total: 0 }
      });
      setPendingQuotes([]);
      setPendingProformas([]);
      setShipped([]);
      setDelivered([]);
      setTotalAmount(0);
      setPendingOrdersData({ total: 0, count: 0, orders: [] });
      setDueDateInvoices({
        overdue: [],
        dueToday: [],
        dueIn3Days: [],
      });
    } finally {
      setLoading(false);
    }
  };
  
  const processDueDateInvoices = (invoices) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue = [];
    const dueToday = [];
    const dueIn3Days = [];
    
    invoices.forEach(inv => {
      // Only process invoices with due date and not paid
      const vadeTarihi = inv['Vade Tarihi'];
      if (!vadeTarihi) return;
      
      // Check if paid
      const odendiValue = inv['Ödendi'];
      let odendi = false;
      if (odendiValue === true || odendiValue === 'true' || odendiValue === 'True') {
        odendi = true;
      } else if (typeof odendiValue === 'string') {
        const upperValue = odendiValue.toUpperCase().trim();
        odendi = upperValue === 'DOĞRU' || upperValue === 'TRUE' || upperValue === '1';
      } else if (odendiValue === 1) {
        odendi = true;
      }
      
      if (odendi) return; // Skip paid invoices
      
      try {
        const vadeDate = new Date(vadeTarihi);
        vadeDate.setHours(0, 0, 0, 0);
        
        const daysDiff = differenceInDays(vadeDate, today);
        
        // Calculate remaining balance
        const tutarNum = smartToNum(inv['Tutar'] || inv['Tutar_num'] || 0);
        const odenenTutar = smartToNum(inv['Ödenen Tutar'] || 0);
        const kalanBakiye = Math.max(tutarNum - odenenTutar, 0);
        
        const invoiceWithBalance = {
          ...inv,
          Kalan_Bakiye: kalanBakiye,
          Kalan_Gün: daysDiff,
        };
        
        if (daysDiff < 0) {
          // Overdue
          overdue.push(invoiceWithBalance);
        } else if (daysDiff === 0) {
          // Due today
          dueToday.push(invoiceWithBalance);
        } else if (daysDiff > 0 && daysDiff <= 3) {
          // Due in 3 days or less (but not today)
          dueIn3Days.push(invoiceWithBalance);
        }
      } catch (error) {
        console.error('Error processing invoice due date:', error, inv);
      }
    });
    
    // Sort by due date (overdue first, then by days remaining)
    overdue.sort((a, b) => a.Kalan_Gün - b.Kalan_Gün);
    dueToday.sort((a, b) => {
      const dateA = new Date(a['Vade Tarihi']);
      const dateB = new Date(b['Vade Tarihi']);
      return dateA - dateB;
    });
    dueIn3Days.sort((a, b) => a.Kalan_Gün - b.Kalan_Gün);
    
    setDueDateInvoices({
      overdue,
      dueToday,
      dueIn3Days,
    });
  };
  
  // Helper function to format date safely
  const safeFormatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      if (typeof dateStr === 'string') {
        const date = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return format(date, 'dd/MM/yyyy');
      }
      if (dateStr instanceof Date) {
        if (isNaN(dateStr.getTime())) return '';
        return format(dateStr, 'dd/MM/yyyy');
      }
      return '';
    } catch {
      return '';
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Calculate progress percentage based on termin date
  const calculateProgress = (orderDate, terminDate) => {
    if (!orderDate || !terminDate) return { percentage: 0, isOverdue: false };
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const order = new Date(orderDate);
      order.setHours(0, 0, 0, 0);
      
      const termin = new Date(terminDate);
      termin.setHours(0, 0, 0, 0);
      
      // If termin date is in the past, it's overdue
      if (today > termin) {
        return { percentage: 100, isOverdue: true };
      }
      
      // Calculate total duration
      const totalDays = Math.max(1, Math.ceil((termin - order) / (1000 * 60 * 60 * 24)));
      
      // Calculate days passed
      const daysPassed = Math.max(0, Math.ceil((today - order) / (1000 * 60 * 60 * 24)));
      
      // Calculate percentage (0-100)
      const percentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
      
      return { percentage, isOverdue: false, daysRemaining: Math.max(0, Math.ceil((termin - today) / (1000 * 60 * 60 * 24))) };
    } catch (error) {
      return { percentage: 0, isOverdue: false };
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>EXPO CRM - Genel Bakış</h1>
      </div>

      {/* Initial Setup Alert */}
      {showInitialSetup && excelStatus && !excelStatus.hasData && (
        <div className="card" style={{ 
          backgroundColor: '#fff3cd', 
          border: '2px solid #ffc107',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>
            🚀 İlk Kurulum - Excel Verisi Gerekli
          </h3>
          <p style={{ marginBottom: '15px', color: '#856404' }}>
            Program ilk kez çalıştırılıyor. Devam etmek için Excel dosyanızı import etmeniz gerekiyor.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleDownloadTemplate(true)}
              style={{ backgroundColor: '#219A41', borderColor: '#219A41' }}
            >
              📥 Demo Veri ile Template İndir
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleDownloadTemplate(false)}
            >
              📥 Boş Template İndir
            </button>
            <button
              className="btn btn-success"
              onClick={() => window.location.href = '/excel-import'}
              style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
            >
              📤 Excel Import Yap
            </button>
          </div>
          <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#856404' }}>
            <strong>Not:</strong> Template'i indirip doldurduktan sonra "Excel Import" sayfasından yükleyebilirsiniz.
          </p>
        </div>
      )}

      {/* Excel File Status */}
      {excelStatus && (
        <div className="card" style={{ 
          backgroundColor: excelStatus.hasData ? '#d4edda' : '#f8d7da',
          marginBottom: '20px',
          border: `2px solid ${excelStatus.hasData ? '#28a745' : '#dc3545'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ 
                color: excelStatus.hasData ? '#155724' : '#721c24',
                marginBottom: '10px'
              }}>
                Excel Dosyası Durumu
              </h3>
              <div style={{ color: excelStatus.hasData ? '#155724' : '#721c24' }}>
                <p><strong>Müşteriler:</strong> {excelStatus.customersCount ?? 0}</p>
                <p><strong>Teklifler:</strong> {excelStatus.quotesCount ?? 0}</p>
                <p><strong>Proformalar:</strong> {excelStatus.proformasCount ?? 0}</p>
                <p><strong>Faturalar:</strong> {excelStatus.invoicesCount ?? 0}</p>
                {excelStatus.representativesCount !== undefined && (
                  <p><strong>Temsilciler:</strong> {excelStatus.representativesCount}</p>
                )}
                {excelStatus.goalsCount !== undefined && (
                  <p><strong>Hedefler:</strong> {excelStatus.goalsCount}</p>
                )}
                {excelStatus.interactionsCount !== undefined && (
                  <p><strong>Etkileşimler:</strong> {excelStatus.interactionsCount}</p>
                )}
                {excelStatus.fairsCount !== undefined && (
                  <p><strong>Fuar Kayıtları:</strong> {excelStatus.fairsCount}</p>
                )}
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={handleDownloadExcel}
                style={{ marginRight: '10px' }}
              >
                📥 Excel İndir
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.location.href = '/excel-import'}
              >
                📤 Excel Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplam Fatura Tutarı ve İçeride Bekleyen Siparişler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ backgroundColor: '#e3f2fd' }}>
          <h2 style={{ color: '#185a9d', marginBottom: '10px', fontSize: '1.2em' }}>
            Toplam Fatura Tutarı
          </h2>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#185a9d' }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>
        
        {pendingOrdersData && (
          <div className="card" style={{ backgroundColor: '#fff3e0' }}>
            <h2 style={{ color: '#f7971e', marginBottom: '10px', fontSize: '1.2em' }}>
              İçeride Bekleyen Siparişler
            </h2>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f7971e' }}>
              {formatCurrency(pendingOrdersData.total || 0)}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
              ({pendingOrdersData.count || 0} sipariş)
            </div>
          </div>
        )}
      </div>

      {/* Vade Durumları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Vadesi Geçmiş */}
        <div className="card" style={{ backgroundColor: '#ffebee', border: '2px solid #e74c3c' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '10px', fontSize: '1.2em' }}>
            Vadesi Geçmiş
          </h2>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e74c3c', marginBottom: '5px' }}>
            {dueDateInvoices.overdue.length} Fatura
          </div>
          <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#c0392b' }}>
            {formatCurrency(dueDateInvoices.overdue.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}
          </div>
        </div>

        {/* Bugün Vadesi Dolan */}
        <div className="card" style={{ backgroundColor: '#fff3e0', border: '2px solid #f39c12' }}>
          <h2 style={{ color: '#f39c12', marginBottom: '10px', fontSize: '1.2em' }}>
            Bugün Vadesi Dolan
          </h2>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f39c12', marginBottom: '5px' }}>
            {dueDateInvoices.dueToday.length} Fatura
          </div>
          <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#e67e22' }}>
            {formatCurrency(dueDateInvoices.dueToday.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}
          </div>
        </div>

        {/* Vadesine 3 Gün ve Daha Az Kalmış */}
        <div className="card" style={{ backgroundColor: '#fff9c4', border: '2px solid #f1c40f' }}>
          <h2 style={{ color: '#f1c40f', marginBottom: '10px', fontSize: '1.2em' }}>
            Vadesine 3 Gün ve Daha Az Kalmış
          </h2>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f1c40f', marginBottom: '5px' }}>
            {dueDateInvoices.dueIn3Days.length} Fatura
          </div>
          <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#d4ac0d' }}>
            {formatCurrency(dueDateInvoices.dueIn3Days.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}
          </div>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Bekleyen Teklifler</h4>
            <div className="value">{stats.pendingQuotes?.count || 0}</div>
            <div style={{ marginTop: '10px', color: '#6c757d' }}>
              Toplam: {(stats.pendingQuotes?.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })}
            </div>
          </div>
          <div className="stat-card">
            <h4>Bekleyen Proformalar</h4>
            <div className="value">{stats.pendingProformas?.count || 0}</div>
            <div style={{ marginTop: '10px', color: '#6c757d' }}>
              Toplam: {(stats.pendingProformas?.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'USD' })}
            </div>
          </div>
          <div className="stat-card">
            <h4>Yolda Olan Siparişler</h4>
            <div className="value">{stats.shipped?.count || 0}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Bekleyen Teklifler</h3>
        {pendingQuotes.length === 0 ? (
          <div className="empty-state">
            <p>Bekleyen teklif yok.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Tarih</th>
                <th>Teklif No</th>
                <th>Tutar</th>
                <th>Ürün/Hizmet</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {pendingQuotes.map((quote, index) => (
                <tr key={index}>
                  <td>{quote['Müşteri Adı']}</td>
                  <td>{quote['Tarih']}</td>
                  <td>{quote['Teklif No']}</td>
                  <td>{quote['Tutar']}</td>
                  <td>{quote['Ürün/Hizmet']}</td>
                  <td>{quote['Açıklama']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Bekleyen Proformalar</h3>
        {pendingProformas.length === 0 ? (
          <div className="empty-state">
            <p>Bekleyen proforma yok.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Proforma No</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Vade (gün)</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {pendingProformas.map((proforma, index) => (
                <tr key={index}>
                  <td>{proforma['Müşteri Adı']}</td>
                  <td>{proforma['Proforma No']}</td>
                  <td>{proforma['Tarih']}</td>
                  <td>{proforma['Tutar']}</td>
                  <td>{proforma['Vade (gün)']}</td>
                  <td>{proforma['Açıklama']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Son Teslim Edilen 5 Sipariş</h3>
        {delivered.length === 0 ? (
          <div className="empty-state">
            <p>Teslim edilen sipariş yok.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Ülke</th>
                <th>Proforma No</th>
                <th>Sevk Tarihi</th>
                <th>Ulaşma Tarihi</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {delivered.map((order, index) => (
                <tr key={index}>
                  <td>{order['Müşteri Adı']}</td>
                  <td>{order['Ülke']}</td>
                  <td>{order['Proforma No']}</td>
                  <td>{order['Sevk Tarihi']}</td>
                  <td>{order['Ulaşma Tarihi']}</td>
                  <td>{order['Tutar']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vade Durumları Detay Tabloları */}
      {/* Vadesi Geçmiş Faturalar */}
      {dueDateInvoices.overdue.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', border: '2px solid #e74c3c' }}>
          <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>
            Vadesi Geçmiş Faturalar ({dueDateInvoices.overdue.length} Adet)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Müşteri Adı</th>
                  <th>Vade Tarihi</th>
                  <th>Kalan Gün</th>
                  <th>Kalan Bakiye</th>
                  <th>Toplam Tutar</th>
                  <th>Ödenen Tutar</th>
                </tr>
              </thead>
              <tbody>
                {dueDateInvoices.overdue.map((inv, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffebee' : '#fff' }}>
                    <td>{inv['Fatura No'] || '-'}</td>
                    <td>{inv['Müşteri Adı'] || '-'}</td>
                    <td>{safeFormatDate(inv['Vade Tarihi'])}</td>
                    <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      {Math.abs(inv.Kalan_Gün)} gün geçti
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                      {formatCurrency(inv.Kalan_Bakiye || 0)}
                    </td>
                    <td>{formatCurrency(smartToNum(inv['Tutar'] || 0))}</td>
                    <td>{formatCurrency(smartToNum(inv['Ödenen Tutar'] || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e74c3c', color: 'white' }}>
                  <td colSpan="4">TOPLAM</td>
                  <td>{formatCurrency(dueDateInvoices.overdue.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.overdue.reduce((sum, inv) => sum + smartToNum(inv['Tutar'] || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.overdue.reduce((sum, inv) => sum + smartToNum(inv['Ödenen Tutar'] || 0), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Bugün Vadesi Dolan Faturalar */}
      {dueDateInvoices.dueToday.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', border: '2px solid #f39c12' }}>
          <h3 style={{ color: '#f39c12', marginBottom: '15px' }}>
            Bugün Vadesi Dolan Faturalar ({dueDateInvoices.dueToday.length} Adet)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Müşteri Adı</th>
                  <th>Vade Tarihi</th>
                  <th>Kalan Bakiye</th>
                  <th>Toplam Tutar</th>
                  <th>Ödenen Tutar</th>
                </tr>
              </thead>
              <tbody>
                {dueDateInvoices.dueToday.map((inv, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff3e0' : '#fff' }}>
                    <td>{inv['Fatura No'] || '-'}</td>
                    <td>{inv['Müşteri Adı'] || '-'}</td>
                    <td style={{ fontWeight: 'bold', color: '#f39c12' }}>
                      {safeFormatDate(inv['Vade Tarihi'])} (BUGÜN)
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#f39c12' }}>
                      {formatCurrency(inv.Kalan_Bakiye || 0)}
                    </td>
                    <td>{formatCurrency(smartToNum(inv['Tutar'] || 0))}</td>
                    <td>{formatCurrency(smartToNum(inv['Ödenen Tutar'] || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f39c12', color: 'white' }}>
                  <td colSpan="3">TOPLAM</td>
                  <td>{formatCurrency(dueDateInvoices.dueToday.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.dueToday.reduce((sum, inv) => sum + smartToNum(inv['Tutar'] || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.dueToday.reduce((sum, inv) => sum + smartToNum(inv['Ödenen Tutar'] || 0), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Vadesine 3 Gün ve Daha Az Kalmış Faturalar */}
      {dueDateInvoices.dueIn3Days.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', border: '2px solid #f1c40f' }}>
          <h3 style={{ color: '#f1c40f', marginBottom: '15px' }}>
            Vadesine 3 Gün ve Daha Az Kalmış Faturalar ({dueDateInvoices.dueIn3Days.length} Adet)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Müşteri Adı</th>
                  <th>Vade Tarihi</th>
                  <th>Kalan Gün</th>
                  <th>Kalan Bakiye</th>
                  <th>Toplam Tutar</th>
                  <th>Ödenen Tutar</th>
                </tr>
              </thead>
              <tbody>
                {dueDateInvoices.dueIn3Days.map((inv, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff9c4' : '#fff' }}>
                    <td>{inv['Fatura No'] || '-'}</td>
                    <td>{inv['Müşteri Adı'] || '-'}</td>
                    <td>{safeFormatDate(inv['Vade Tarihi'])}</td>
                    <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                      {inv.Kalan_Gün} gün kaldı
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                      {formatCurrency(inv.Kalan_Bakiye || 0)}
                    </td>
                    <td>{formatCurrency(smartToNum(inv['Tutar'] || 0))}</td>
                    <td>{formatCurrency(smartToNum(inv['Ödenen Tutar'] || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1c40f', color: '#333' }}>
                  <td colSpan="4">TOPLAM</td>
                  <td>{formatCurrency(dueDateInvoices.dueIn3Days.reduce((sum, inv) => sum + (inv.Kalan_Bakiye || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.dueIn3Days.reduce((sum, inv) => sum + smartToNum(inv['Tutar'] || 0), 0))}</td>
                  <td>{formatCurrency(dueDateInvoices.dueIn3Days.reduce((sum, inv) => sum + smartToNum(inv['Ödenen Tutar'] || 0), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* İçeride Bekleyen Siparişler Dökümü */}
      {pendingOrdersData && pendingOrdersData.orders && pendingOrdersData.orders.length > 0 && (
        <div className="card">
          <h3 style={{ color: '#f7971e', marginBottom: '20px' }}>
            İçeride Bekleyen Siparişler Dökümü
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '1.1em', fontWeight: 'bold', color: '#f7971e' }}>
            Toplam: {formatCurrency(pendingOrdersData.total)} ({pendingOrdersData.count} sipariş)
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Müşteri Adı</th>
                  <th>Proforma No</th>
                  <th>Tarih</th>
                  <th>Termin Tarihi</th>
                  <th>Tutar</th>
                  <th>Sevk Durumu</th>
                  <th>Açıklama</th>
                  <th>İlerleme</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrdersData.orders.map((order, idx) => {
                  const progress = calculateProgress(order['Tarih'], order['Termin Tarihi']);
                  return (
                    <tr key={idx}>
                      <td>{order['Müşteri Adı']}</td>
                      <td>{order['Proforma No']}</td>
                      <td>{safeFormatDate(order['Tarih'])}</td>
                      <td>{safeFormatDate(order['Termin Tarihi'])}</td>
                      <td>{formatCurrency(smartToNum(order['Tutar']))}</td>
                      <td>{order['Sevk Durumu'] || '-'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order['Açıklama'] || '-'}
                      </td>
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ 
                              width: '100%', 
                              height: '24px', 
                              backgroundColor: '#e0e0e0', 
                              borderRadius: '12px', 
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <div
                                style={{
                                  width: `${progress.percentage}%`,
                                  height: '100%',
                                  backgroundColor: progress.isOverdue ? '#e74c3c' : '#27ae60',
                                  transition: 'width 0.3s, background-color 0.3s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  minWidth: progress.percentage > 10 ? 'auto' : '0',
                                }}
                              >
                                {progress.percentage > 10 && !progress.isOverdue && `${progress.percentage}%`}
                                {progress.isOverdue && 'Süresi Geçti'}
                              </div>
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            color: progress.isOverdue ? '#e74c3c' : '#27ae60',
                            minWidth: '60px',
                            textAlign: 'right'
                          }}>
                            {progress.isOverdue ? (
                              <span style={{ color: '#e74c3c' }}>100%</span>
                            ) : (
                              <span style={{ color: '#27ae60' }}>{progress.percentage}%</span>
                            )}
                          </div>
                        </div>
                        {progress.daysRemaining !== undefined && !progress.isOverdue && (
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                            {progress.daysRemaining} gün kaldı
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;

