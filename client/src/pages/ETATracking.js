import React, { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  getETAShippedOrders, 
  getETADeliveredOrders, 
  getETAs, 
  updateOrCreateETA, 
  markOrderAsDelivered, 
  recallShipment,
  deleteETA,
  updateProformaDeliveryDate,
  returnProformaToShipping
} from '../utils/api';

function ETATracking() {
  const [shippedOrders, setShippedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [etaRecords, setEtaRecords] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDeliveredOrder, setSelectedDeliveredOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // ETA form data
  const [etaFormData, setEtaFormData] = useState({
    'Sevk Tarihi': format(new Date(), 'yyyy-MM-dd'),
    'ETA Tarihi': format(new Date(), 'yyyy-MM-dd'),
    'Açıklama': '',
  });
  
  // Delivery date form
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Return to shipping form
  const [returnToShippingData, setReturnToShippingData] = useState({
    'ETA Tarihi': format(new Date(), 'yyyy-MM-dd'),
    'Açıklama': 'Geri alındı - tekrar yolda',
  });
  
  // Delete ETA state
  const [deleteEtaId, setDeleteEtaId] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedOrder) {
      loadETAForOrder();
    }
  }, [selectedOrder]);
  
  useEffect(() => {
    if (selectedDeliveredOrder) {
      loadDeliveryData();
    }
  }, [selectedDeliveredOrder]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [shippedRes, deliveredRes, etaRes] = await Promise.all([
        getETAShippedOrders(),
        getETADeliveredOrders(),
        getETAs(),
      ]);
      setShippedOrders(shippedRes.data || []);
      setDeliveredOrders(deliveredRes.data || []);
      setEtaRecords(etaRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const loadETAForOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const existingETA = etaRecords.find(eta => 
        eta['Müşteri Adı'] === selectedOrder['Müşteri Adı'] && 
        eta['Proforma No'] === selectedOrder['Proforma No']
      );
      
      if (existingETA) {
        setEtaFormData({
          'Sevk Tarihi': existingETA['Sevk Tarihi'] || selectedOrder['Sevk Tarihi'] || format(new Date(), 'yyyy-MM-dd'),
          'ETA Tarihi': existingETA['ETA Tarihi'] || format(new Date(), 'yyyy-MM-dd'),
          'Açıklama': existingETA['Açıklama'] || '',
        });
      } else {
        setEtaFormData({
          'Sevk Tarihi': selectedOrder['Sevk Tarihi'] || format(new Date(), 'yyyy-MM-dd'),
          'ETA Tarihi': format(new Date(), 'yyyy-MM-dd'),
          'Açıklama': '',
        });
      }
    } catch (error) {
      console.error('Error loading ETA:', error);
    }
  };
  
  const loadDeliveryData = async () => {
    if (!selectedDeliveredOrder) return;
    
    try {
      const currentDeliveryDate = selectedDeliveredOrder['Ulaşma Tarihi'] || format(new Date(), 'yyyy-MM-dd');
      setDeliveryDate(currentDeliveryDate);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    }
  };
  
  const handleSaveETA = async () => {
    if (!selectedOrder) {
      setMessage({ type: 'error', text: 'Lütfen bir sipariş seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await updateOrCreateETA({
        customerName: selectedOrder['Müşteri Adı'],
        proformaNo: selectedOrder['Proforma No'],
        'Sevk Tarihi': etaFormData['Sevk Tarihi'],
        'ETA Tarihi': etaFormData['ETA Tarihi'],
        'Açıklama': etaFormData['Açıklama'],
      });
      
      setMessage({ type: 'success', text: 'ETA kaydedildi/güncellendi!' });
      await loadData();
    } catch (error) {
      console.error('Error saving ETA:', error);
      setMessage({ type: 'error', text: 'ETA kaydedilirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkDelivered = async () => {
    if (!selectedOrder) {
      setMessage({ type: 'error', text: 'Lütfen bir sipariş seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await markOrderAsDelivered(selectedOrder['Müşteri Adı'], selectedOrder['Proforma No']);
      setMessage({ type: 'success', text: 'Sipariş \'Ulaşıldı\' olarak işaretlendi ve ETA takibinden çıkarıldı!' });
      await loadData();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error marking as delivered:', error);
      setMessage({ type: 'error', text: 'İşlem sırasında hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecallShipment = async () => {
    if (!selectedOrder) {
      setMessage({ type: 'error', text: 'Lütfen bir sipariş seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await recallShipment(selectedOrder['Müşteri Adı'], selectedOrder['Proforma No']);
      setMessage({ type: 'success', text: 'Sevkiyat geri alındı! Sipariş tekrar Sipariş Operasyonları\'na gönderildi.' });
      await loadData();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error recalling shipment:', error);
      setMessage({ type: 'error', text: 'İşlem sırasında hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateDeliveryDate = async () => {
    if (!selectedDeliveredOrder || !selectedDeliveredOrder.id) {
      setMessage({ type: 'error', text: 'Lütfen bir sipariş seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await updateProformaDeliveryDate(selectedDeliveredOrder.id, deliveryDate);
      setMessage({ type: 'success', text: 'Ulaşma Tarihi güncellendi!' });
      await loadData();
    } catch (error) {
      console.error('Error updating delivery date:', error);
      setMessage({ type: 'error', text: 'Tarih güncellenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReturnToShipping = async () => {
    if (!selectedDeliveredOrder || !selectedDeliveredOrder.id) {
      setMessage({ type: 'error', text: 'Lütfen bir sipariş seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await returnProformaToShipping(selectedDeliveredOrder.id, returnToShippingData);
      setMessage({ type: 'success', text: 'Sipariş, Ulaşanlar\'dan geri alındı ve ETA listesine taşındı (Sevkedildi).' });
      await loadData();
      setSelectedDeliveredOrder(null);
    } catch (error) {
      console.error('Error returning to shipping:', error);
      setMessage({ type: 'error', text: 'İşlem sırasında hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteETA = async () => {
    if (!deleteEtaId) {
      setMessage({ type: 'error', text: 'Lütfen silinecek kaydı seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await deleteETA(deleteEtaId);
      setMessage({ type: 'success', text: 'ETA kaydı silindi!' });
      await loadData();
      setDeleteEtaId('');
    } catch (error) {
      console.error('Error deleting ETA:', error);
      setMessage({ type: 'error', text: 'Kayıt silinirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to parse date safely
  const safeParseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle both ISO format and other formats
      if (typeof dateStr === 'string') {
        // Try parseISO first
        try {
          const parsed = parseISO(dateStr);
          if (isNaN(parsed.getTime())) return null;
          return parsed;
        } catch {
          // If parseISO fails, try new Date
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        }
      }
      // If it's already a Date object
      if (dateStr instanceof Date) {
        return isNaN(dateStr.getTime()) ? null : dateStr;
      }
      return null;
    } catch {
      return null;
    }
  };
  
  // Helper function to format date safely
  const safeFormatDate = (dateStr, formatStr = 'dd/MM/yyyy') => {
    if (!dateStr) return '';
    const date = safeParseDate(dateStr);
    if (!date) return '';
    try {
      return format(date, formatStr);
    } catch {
      return '';
    }
  };
  
  // Get unique orders for selection
  const uniqueShippedOrders = [];
  const seen = new Set();
  shippedOrders.forEach(order => {
    const key = `${order['Müşteri Adı']}|${order['Proforma No']}`;
    if (!seen.has(key) && order['Müşteri Adı'] && order['Proforma No']) {
      seen.add(key);
      uniqueShippedOrders.push(order);
    }
  });
  
  // Process ETA records for display
  const processedETARecords = etaRecords.map(eta => {
    const etaDate = safeParseDate(eta['ETA Tarihi']);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const kalanGun = etaDate ? differenceInDays(etaDate, today) : null;
    
    return {
      ...eta,
      Kalan_Gün: kalanGun,
    };
  }).sort((a, b) => {
    // Sort by ETA Tarihi, then Müşteri Adı, then Proforma No
    const dateA = safeParseDate(a['ETA Tarihi']) || new Date(0);
    const dateB = safeParseDate(b['ETA Tarihi']) || new Date(0);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    const customerA = a['Müşteri Adı'] || '';
    const customerB = b['Müşteri Adı'] || '';
    if (customerA !== customerB) {
      return customerA.localeCompare(customerB);
    }
    const proformaA = a['Proforma No'] || '';
    const proformaB = b['Proforma No'] || '';
    return proformaA.localeCompare(proformaB);
  });
  
  return (
    <div>
      <div className="page-header">
        <h1>ETA İzleme</h1>
      </div>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}
      
      {/* Sevkedilen Siparişler */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Sevkedilen Siparişler (Yolda)</h2>
        
        {uniqueShippedOrders.length === 0 ? (
          <p>Sevkedilmiş sipariş bulunmuyor.</p>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label>Sipariş Seç:</label>
              <select
                value={selectedOrder ? `${selectedOrder['Müşteri Adı']}|${selectedOrder['Proforma No']}` : ''}
                onChange={(e) => {
                  const [customer, proforma] = e.target.value.split('|');
                  const order = uniqueShippedOrders.find(o => 
                    o['Müşteri Adı'] === customer && o['Proforma No'] === proforma
                  );
                  setSelectedOrder(order);
                }}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              >
                <option value="">-- Sipariş Seçin --</option>
                {uniqueShippedOrders.map((order, idx) => (
                  <option key={idx} value={`${order['Müşteri Adı']}|${order['Proforma No']}`}>
                    {order['Müşteri Adı']} - {order['Proforma No']}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedOrder && (
              <>
                <div className="card" style={{ backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
                  <h3>ETA Düzenleme</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Sevk Tarihi:</label>
                    <input
                      type="date"
                      value={etaFormData['Sevk Tarihi']}
                      onChange={(e) => setEtaFormData({ ...etaFormData, 'Sevk Tarihi': e.target.value })}
                      style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>ETA Tarihi:</label>
                    <input
                      type="date"
                      value={etaFormData['ETA Tarihi']}
                      onChange={(e) => setEtaFormData({ ...etaFormData, 'ETA Tarihi': e.target.value })}
                      style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Açıklama:</label>
                    <textarea
                      value={etaFormData['Açıklama']}
                      onChange={(e) => setEtaFormData({ ...etaFormData, 'Açıklama': e.target.value })}
                      style={{ width: '100%', padding: '8px', marginTop: '8px', minHeight: '80px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={handleSaveETA} disabled={loading} className="btn btn-primary">
                      ETA'yı Kaydet/Güncelle
                    </button>
                    <button onClick={handleMarkDelivered} disabled={loading} className="btn btn-success">
                      Ulaştı
                    </button>
                    <button onClick={handleRecallShipment} disabled={loading} className="btn btn-warning">
                      Sevki Geri Al
                    </button>
                  </div>
                </div>
                
                <div className="card" style={{ backgroundColor: '#f0f8ff', marginBottom: '20px' }}>
                  <h4>Yükleme Fotoğrafları</h4>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Yükleme fotoğrafları özelliği yakında eklenecek.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* ETA Takip Listesi */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>ETA Takip Listesi</h2>
        
        {processedETARecords.length === 0 ? (
          <p>Henüz ETA kaydı yok.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Müşteri Adı</th>
                    <th>Proforma No</th>
                    <th>Sevk Tarihi</th>
                    <th>ETA Tarihi</th>
                    <th>Kalan Gün</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {processedETARecords.map((eta, idx) => (
                    <tr key={eta.id || eta.ID || idx}>
                      <td>{eta['Müşteri Adı']}</td>
                      <td>{eta['Proforma No']}</td>
                      <td>{safeFormatDate(eta['Sevk Tarihi'])}</td>
                      <td>{safeFormatDate(eta['ETA Tarihi'])}</td>
                      <td style={{ 
                        color: eta.Kalan_Gün !== null && eta.Kalan_Gün < 0 ? 'red' : 
                               eta.Kalan_Gün !== null && eta.Kalan_Gün === 0 ? 'orange' : 'black'
                      }}>
                        {eta.Kalan_Gün !== null ? eta.Kalan_Gün : '-'}
                      </td>
                      <td>{eta['Açıklama']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="card" style={{ backgroundColor: '#fff3cd', marginTop: '20px' }}>
              <h4>ETA Kaydı Sil</h4>
              <div style={{ marginBottom: '15px' }}>
                <label>Silinecek Kaydı Seçin:</label>
                <select
                  value={deleteEtaId}
                  onChange={(e) => setDeleteEtaId(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                >
                  <option value="">-- Kayıt Seçin --</option>
                  {processedETARecords.map((eta) => (
                    <option key={eta.id || eta.ID} value={eta.id || eta.ID}>
                      {eta['Müşteri Adı']} - {eta['Proforma No']}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleDeleteETA} disabled={loading || !deleteEtaId} className="btn btn-danger">
                KAYDI SİL
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Ulaşanlar (Teslim Edilenler) */}
      <div className="card">
        <h2>Teslim Edilen Siparişler</h2>
        
        {deliveredOrders.length === 0 ? (
          <p>Henüz ulaşan sipariş yok.</p>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label>Sipariş Seçiniz:</label>
              <select
                value={selectedDeliveredOrder ? `${selectedDeliveredOrder['Müşteri Adı']}|${selectedDeliveredOrder['Proforma No']}` : ''}
                onChange={(e) => {
                  const [customer, proforma] = e.target.value.split('|');
                  const order = deliveredOrders.find(o => 
                    o['Müşteri Adı'] === customer && o['Proforma No'] === proforma
                  );
                  setSelectedDeliveredOrder(order);
                }}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              >
                <option value="">-- Sipariş Seçin --</option>
                {deliveredOrders.map((order, idx) => (
                  <option key={idx} value={`${order['Müşteri Adı']}|${order['Proforma No']}`}>
                    {order['Müşteri Adı']} - {order['Proforma No']}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDeliveredOrder && (
              <div className="card" style={{ backgroundColor: '#f9f9f9' }}>
                <h3>Teslim Edilen Siparişlerde İşlemler</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label>Ulaşma Tarihi:</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                  />
                </div>
                <button onClick={handleUpdateDeliveryDate} disabled={loading} className="btn btn-primary" style={{ marginBottom: '20px' }}>
                  Ulaşma Tarihini Kaydet
                </button>
                
                <hr style={{ margin: '20px 0' }} />
                
                <h4>🔄 Ulaşan siparişi yeniden Yolda Olanlar (ETA) listesine al</h4>
                <div style={{ marginBottom: '15px' }}>
                  <label>Yeni ETA (opsiyonel):</label>
                  <input
                    type="date"
                    value={returnToShippingData['ETA Tarihi']}
                    onChange={(e) => setReturnToShippingData({ ...returnToShippingData, 'ETA Tarihi': e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Açıklama (opsiyonel):</label>
                  <input
                    type="text"
                    value={returnToShippingData['Açıklama']}
                    onChange={(e) => setReturnToShippingData({ ...returnToShippingData, 'Açıklama': e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                  />
                </div>
                <button onClick={handleReturnToShipping} disabled={loading} className="btn btn-warning">
                  Yola Geri Al
                </button>
              </div>
            )}
            
            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
              <h3>Ulaşan (Teslim Edilmiş) Siparişler</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Müşteri Adı</th>
                    <th>Proforma No</th>
                    <th>Proforma Tarihi</th>
                    <th>Termin Tarihi</th>
                    <th>Sevk Tarihi</th>
                    <th>Ulaşma Tarihi</th>
                    <th>Gün Farkı</th>
                    <th>Tutar</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveredOrders.map((order, idx) => {
                    const sevkDate = safeParseDate(order['Sevk Tarihi']);
                    const proformaDate = safeParseDate(order['Tarih']);
                    const gunFarki = sevkDate && proformaDate ? differenceInDays(sevkDate, proformaDate) : null;
                    
                    return (
                      <tr key={order.id || order.ID || idx}>
                        <td>{order['Müşteri Adı']}</td>
                        <td>{order['Proforma No']}</td>
                        <td>{safeFormatDate(order['Tarih'])}</td>
                        <td>{safeFormatDate(order['Termin Tarihi'])}</td>
                        <td>{safeFormatDate(order['Sevk Tarihi'])}</td>
                        <td>{safeFormatDate(order['Ulaşma Tarihi'])}</td>
                        <td>{gunFarki !== null ? gunFarki : '-'}</td>
                        <td>{order['Tutar'] ? parseFloat(order['Tutar']).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : ''}</td>
                        <td>{order['Açıklama']}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ETATracking;
