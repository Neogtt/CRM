import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';

function OrderOperations() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0 });
  
  // Form states
  const [selectedOrderForTermin, setSelectedOrderForTermin] = useState('');
  const [terminDate, setTerminDate] = useState('');
  
  const [selectedOrderForShip, setSelectedOrderForShip] = useState('');
  const [shipDate, setShipDate] = useState('');
  
  const [selectedOrderForRecall, setSelectedOrderForRecall] = useState('');

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setMessage({ type: 'error', text: 'Siparişler yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/orders/stats/total');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUpdateTerminDate = async (e) => {
    e.preventDefault();
    if (!selectedOrderForTermin || !terminDate) {
      setMessage({ type: 'error', text: 'Lütfen sipariş ve termin tarihi seçiniz' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${selectedOrderForTermin}/termin-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'Termin Tarihi': terminDate }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Termin tarihi kaydedildi!' });
        setSelectedOrderForTermin('');
        setTerminDate('');
        loadOrders();
        loadStats();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrderForShip) {
      setMessage({ type: 'error', text: 'Lütfen sevk edilecek siparişi seçiniz' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${selectedOrderForShip}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          'Sevk Tarihi': shipDate || format(new Date(), 'yyyy-MM-dd') 
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sipariş sevkedildi ve ETA takibine gönderildi!' });
        setSelectedOrderForShip('');
        setShipDate('');
        loadOrders();
        loadStats();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRecallOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrderForRecall) {
      setMessage({ type: 'error', text: 'Lütfen beklemeye alınacak siparişi seçiniz' });
      return;
    }

    if (!window.confirm('Bu siparişi beklemeye almak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${selectedOrderForRecall}/recall`, {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sipariş tekrar bekleyen proformalar listesine alındı!' });
        setSelectedOrderForRecall('');
        loadOrders();
        loadStats();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const getOrderDisplayName = (order) => {
    return `${order['Müşteri Adı']} - ${order['Proforma No']}`;
  };

  const calculateDaysSinceOrder = (order) => {
    if (!order['Tarih']) return null;
    try {
      const orderDate = new Date(order['Tarih']);
      const today = new Date();
      return differenceInDays(today, orderDate);
    } catch {
      return null;
    }
  };

  const calculateDaysToTermin = (order) => {
    if (!order['Termin Tarihi']) return null;
    try {
      const terminDate = new Date(order['Termin Tarihi']);
      const today = new Date();
      return differenceInDays(terminDate, today);
    } catch {
      return null;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Sipariş Operasyonları</h1>
        </div>
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Sipariş Operasyonları</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>Henüz sevk edilmeyi bekleyen sipariş yok.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="card" style={{ backgroundColor: '#e8f5e9', border: '2px solid #219A41' }}>
            <h3 style={{ color: '#219A41', marginBottom: '10px' }}>
              Tüm Siparişe Dönüşenler ({stats.count} Adet)
            </h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#219A41' }}>
              Toplam Bekleyen Sevk: {stats.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>

          {/* Orders Table */}
          <div className="card">
            <h3>Sipariş Listesi</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Tarih</th>
                  <th>Müşteri Adı</th>
                  <th>Termin Tarihi</th>
                  <th>Ülke</th>
                  <th>Satış Temsilcisi</th>
                  <th>Ödeme Şekli</th>
                  <th>Proforma No</th>
                  <th>Tutar</th>
                  <th>Açıklama</th>
                  <th>Gün Farkı</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const daysSince = calculateDaysSinceOrder(order);
                  const daysToTermin = calculateDaysToTermin(order);
                  
                  return (
                    <tr key={order.ID || order.id}>
                      <td>{index + 1}</td>
                      <td>
                        {order['Tarih'] ? format(new Date(order['Tarih']), 'dd/MM/yyyy') : ''}
                      </td>
                      <td>{order['Müşteri Adı']}</td>
                      <td>
                        {order['Termin Tarihi'] ? format(new Date(order['Termin Tarihi']), 'dd/MM/yyyy') : '-'}
                        {daysToTermin !== null && (
                          <span style={{ 
                            marginLeft: '5px', 
                            color: daysToTermin < 0 ? '#dc3545' : daysToTermin <= 7 ? '#ffc107' : '#28a745',
                            fontSize: '12px'
                          }}>
                            ({daysToTermin > 0 ? '+' : ''}{daysToTermin} gün)
                          </span>
                        )}
                      </td>
                      <td>{order['Ülke'] || ''}</td>
                      <td>{order['Satış Temsilcisi'] || ''}</td>
                      <td>{order['Ödeme Şekli'] || ''}</td>
                      <td>{order['Proforma No']}</td>
                      <td>{order['Tutar'] || ''}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order['Açıklama'] || ''}
                      </td>
                      <td>
                        {daysSince !== null && (
                          <span style={{ fontSize: '12px' }}>
                            {daysSince} gün
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PDF Links */}
          {orders.some(o => o['PDF'] || o['Sipariş Formu']) && (
            <div className="card">
              <h3>Tıklanabilir Proforma ve Sipariş Formu Linkleri</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.map((order) => {
                  const links = [];
                  if (order['PDF']) {
                    links.push(
                      <a key="pdf" href={order['PDF']} target="_blank" rel="noopener noreferrer">
                        Proforma PDF: {order['Proforma No']}
                      </a>
                    );
                  }
                  if (order['Sipariş Formu']) {
                    links.push(
                      <a key="order-form" href={order['Sipariş Formu']} target="_blank" rel="noopener noreferrer">
                        Sipariş Formu: {order['Müşteri Adı']} - {order['Proforma No']}
                      </a>
                    );
                  }
                  return links.length > 0 ? (
                    <div key={order.ID || order.id} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                      <strong>{getOrderDisplayName(order)}:</strong> {links.map((link, i) => (
                        <span key={i}>
                          {link}
                          {i < links.length - 1 && ' | '}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Update Termin Date */}
          <div className="card">
            <h3>Termin Tarihi Güncelle</h3>
            <form onSubmit={handleUpdateTerminDate}>
              <div className="form-group">
                <label>Termin Tarihi Girilecek Sipariş</label>
                <select
                  value={selectedOrderForTermin}
                  onChange={(e) => {
                    setSelectedOrderForTermin(e.target.value);
                    const order = orders.find(o => (o.ID || o.id) === e.target.value);
                    if (order && order['Termin Tarihi']) {
                      setTerminDate(format(new Date(order['Termin Tarihi']), 'yyyy-MM-dd'));
                    } else {
                      setTerminDate('');
                    }
                  }}
                  required
                >
                  <option value="">Seçiniz</option>
                  {orders.map((order) => (
                    <option key={order.ID || order.id} value={order.ID || order.id}>
                      {getOrderDisplayName(order)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Termin Tarihi</label>
                <input
                  type="date"
                  value={terminDate}
                  onChange={(e) => setTerminDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Termin Tarihini Kaydet'}
              </button>
            </form>
          </div>

          {/* Ship Order */}
          <div className="card">
            <h3>Siparişi Sevk Et (ETA İzleme Kaydına Gönder)</h3>
            <form onSubmit={handleShipOrder}>
              <div className="form-group">
                <label>Sevk Edilecek Sipariş</label>
                <select
                  value={selectedOrderForShip}
                  onChange={(e) => {
                    setSelectedOrderForShip(e.target.value);
                    setShipDate(format(new Date(), 'yyyy-MM-dd'));
                  }}
                  required
                >
                  <option value="">Seçiniz</option>
                  {orders.map((order) => (
                    <option key={order.ID || order.id} value={order.ID || order.id}>
                      {getOrderDisplayName(order)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Sevk Tarihi</label>
                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sevk ediliyor...' : 'Sevkedildi → ETA İzlemeye Ekle'}
              </button>
            </form>
          </div>

          {/* Recall Order */}
          <div className="card">
            <h3>Siparişi Beklemeye Al (Geri Çağır)</h3>
            <form onSubmit={handleRecallOrder}>
              <div className="form-group">
                <label>Beklemeye Alınacak Sipariş</label>
                <select
                  value={selectedOrderForRecall}
                  onChange={(e) => setSelectedOrderForRecall(e.target.value)}
                  required
                >
                  <option value="">Seçiniz</option>
                  {orders.map((order) => (
                    <option key={order.ID || order.id} value={order.ID || order.id}>
                      {getOrderDisplayName(order)}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-warning" disabled={loading}>
                {loading ? 'İşleniyor...' : 'Beklemeye Al / Geri Çağır'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default OrderOperations;
