import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  getSalesTotal, 
  getSalesDateRange, 
  getSalesAnalytics, 
  getSalesSegments, 
  getSalesCustomers,
  getSalesPendingOrders
} from '../utils/api';
import { smartToNum } from '../utils/helpers';

function SalesAnalytics() {
  const [totalAmount, setTotalAmount] = useState(0);
  const [dateRange, setDateRange] = useState({ minDate: '', maxDate: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Tüm Segmentler');
  const [selectedCustomer, setSelectedCustomer] = useState('Tüm Müşteriler');
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pendingOrdersData, setPendingOrdersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    loadInitialData();
    loadPendingOrders();
  }, []);
  
  useEffect(() => {
    if (dateRange.minDate && dateRange.maxDate) {
      setStartDate(dateRange.minDate);
      setEndDate(dateRange.maxDate);
    }
  }, [dateRange]);
  
  useEffect(() => {
    if (startDate && endDate) {
      loadCustomers();
      loadAnalytics();
    }
  }, [startDate, endDate, selectedSegment, selectedCustomer]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [totalRes, dateRangeRes, segmentsRes] = await Promise.all([
        getSalesTotal(),
        getSalesDateRange(),
        getSalesSegments(),
      ]);
      setTotalAmount(totalRes.data.total || 0);
      setDateRange(dateRangeRes.data || { minDate: '', maxDate: '' });
      setSegments(segmentsRes.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const loadPendingOrders = async () => {
    try {
      const response = await getSalesPendingOrders();
      setPendingOrdersData(response.data);
    } catch (error) {
      console.error('Error loading pending orders:', error);
    }
  };
  
  const loadCustomers = async () => {
    try {
      const response = await getSalesCustomers({ startDate, endDate });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getSalesAnalytics({
        startDate,
        endDate,
        customer: selectedCustomer,
        segment: selectedSegment,
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setMessage({ type: 'error', text: 'Analitik veriler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
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
  
  return (
    <div>
      <div className="page-header">
        <h1>Satış Analitiği</h1>
      </div>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
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
          {analyticsData && (
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
              ({analyticsData.count || 0} adet fatura)
            </div>
          )}
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
      
      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Filtreler</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label>Başlangıç Tarihi:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            />
          </div>
          
          <div>
            <label>Bitiş Tarihi:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            />
          </div>
          
          {segments.length > 0 && (
            <div>
              <label>Müşteri Segmenti:</label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              >
                <option value="Tüm Segmentler">Tüm Segmentler</option>
                {segments.map((segment, idx) => (
                  <option key={idx} value={segment}>
                    {segment}
                  </option>
                ))}
                <option value="Belirtilmemiş">Belirtilmemiş</option>
              </select>
            </div>
          )}
          
          <div>
            <label>Müşteri Bazında Filtre:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            >
              <option value="Tüm Müşteriler">Tüm Müşteriler</option>
              {customers.map((customer, idx) => (
                <option key={idx} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <p>Yükleniyor...</p>
      ) : analyticsData ? (
        <>
          {/* Seçili Aralık Toplamı */}
          <div className="card" style={{ marginBottom: '20px', backgroundColor: '#fff3e0' }}>
            <h3 style={{ color: '#f7971e', marginBottom: '10px' }}>
              {startDate && endDate ? `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')} Arası Toplam: ${formatCurrency(analyticsData.total)}` : `Toplam: ${formatCurrency(analyticsData.total)}`}
            </h3>
          </div>
          
          {/* Top 5 Müşteriler */}
          {analyticsData.topCustomers && analyticsData.topCustomers.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#185a9d', marginBottom: '20px' }}>
                En Yüksek Ciroya Sahip İlk 5 Müşteri
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Müşteri Adı</th>
                        <th>Toplam Ciro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topCustomers.map((customer, idx) => (
                        <tr key={idx}>
                          <td>{customer['Müşteri Adı']}</td>
                          <td>{formatCurrency(customer['Toplam Ciro'])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                    <div style={{ width: '100%', padding: '20px' }}>
                      {analyticsData.topCustomers.map((customer, idx) => {
                        const maxValue = analyticsData.topCustomers[0]['Toplam Ciro'];
                        const percentage = (customer['Toplam Ciro'] / maxValue) * 100;
                        return (
                          <div key={idx} style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{customer['Müşteri Adı']}</span>
                              <span style={{ fontSize: '14px', color: '#666' }}>{formatCurrency(customer['Toplam Ciro'])}</span>
                            </div>
                            <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: '#219A41',
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Müşteri Bazında Ciro Yüzdeleri */}
          {analyticsData.customerPercentages && analyticsData.customerPercentages.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#185a9d', marginBottom: '20px' }}>
                Müşteri Bazında Ciro Yüzdeleri
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Müşteri Adı</th>
                        <th>Tutar (USD)</th>
                        <th>Yüzde (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.customerPercentages.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item['Müşteri Adı']}</td>
                          <td>{formatCurrency(item['Tutar_num'])}</td>
                          <td>%{item['Yüzde'].toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                    <div style={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {analyticsData.customerPercentages.slice(0, 10).map((item, idx) => {
                        const total = analyticsData.customerPercentages.reduce((sum, i) => sum + i['Tutar_num'], 0);
                        const percentage = total > 0 ? (item['Tutar_num'] / total) * 100 : 0;
                        const colors = ['#219A41', '#f7971e', '#185a9d', '#8e54e9', '#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#f39c12', '#e67e22'];
                        return (
                          <div key={idx} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                {item['Müşteri Adı']}
                              </span>
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                %{percentage.toFixed(1)}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '15px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: colors[idx % colors.length],
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detay Tablo */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#185a9d', marginBottom: '20px' }}>Fatura Detay Tablosu</h3>
            
            {analyticsData.invoices && analyticsData.invoices.length === 0 ? (
              <p>Seçilen kriterlere uygun satış kaydı bulunamadı.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Müşteri Adı</th>
                      <th>Fatura No</th>
                      <th>Fatura Tarihi</th>
                      <th>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.invoices
                      .sort((a, b) => {
                        const dateA = new Date(a['Fatura Tarihi'] || a['Tarih'] || 0);
                        const dateB = new Date(b['Fatura Tarihi'] || b['Tarih'] || 0);
                        return dateB - dateA;
                      })
                      .map((invoice, idx) => (
                        <tr key={idx}>
                          <td>{invoice['Müşteri Adı']}</td>
                          <td>{invoice['Fatura No']}</td>
                          <td>{safeFormatDate(invoice['Fatura Tarihi'] || invoice['Tarih'])}</td>
                          <td>{formatCurrency(smartToNum(invoice['Tutar']))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
      
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
            <table className="data-table">
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

export default SalesAnalytics;
