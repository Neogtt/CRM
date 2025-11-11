import React, { useState, useEffect } from 'react';
import { getQuotes, createQuote, updateQuote, deleteQuote, getCustomers, getPendingQuotes } from '../utils/api';
import { format } from 'date-fns';

const QUOTE_STATUSES = ['Açık', 'Beklemede', 'Sonuçlandı'];

function QuoteManagement() {
  const [selectedView, setSelectedView] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [autoQuoteNo, setAutoQuoteNo] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    'Müşteri Adı': '',
    'Tarih': format(new Date(), 'yyyy-MM-dd'),
    'Teklif No': '',
    'Tutar': '',
    'Ürün/Hizmet': '',
    'Açıklama': '',
    'Durum': 'Açık',
    'PDF': '',
  });

  // Filter states
  const [filters, setFilters] = useState({
    customer: '(Hepsi)',
    statuses: [],
    startDate: '',
    endDate: '',
    searchText: '',
  });

  // Edit states
  const [editingQuote, setEditingQuote] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadCustomers();
    loadPendingQuotes();
    loadAutoQuoteNo();
  }, []);

  useEffect(() => {
    if (selectedView === 'old') {
      loadQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView, filters.customer, filters.statuses, filters.startDate, filters.endDate, filters.searchText]);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadPendingQuotes = async () => {
    try {
      const response = await getPendingQuotes();
      setPendingQuotes(response.data.quotes || []);
    } catch (error) {
      console.error('Error loading pending quotes:', error);
    }
  };

  const loadAutoQuoteNo = async () => {
    try {
      const response = await fetch('/api/quotes/auto/quote-no');
      const data = await response.json();
      setAutoQuoteNo(data.quoteNo || 'TKF-0001');
      setFormData(prev => ({ ...prev, 'Teklif No': data.quoteNo || 'TKF-0001' }));
    } catch (error) {
      console.error('Error loading auto quote no:', error);
      setAutoQuoteNo('TKF-0001');
    }
  };

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const searchParams = {};
      
      if (filters.customer && filters.customer !== '(Hepsi)') {
        searchParams.customer = filters.customer;
      }
      if (filters.statuses && filters.statuses.length > 0) {
        searchParams.statuses = filters.statuses;
      }
      if (filters.startDate && filters.endDate) {
        searchParams.startDate = filters.startDate;
        searchParams.endDate = filters.endDate;
      }
      if (filters.searchText) {
        searchParams.searchText = filters.searchText;
      }

      const response = await fetch('/api/quotes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setMessage({ type: 'error', text: 'Teklifler yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData['Teklif No'] || !formData['Teklif No'].trim()) {
      setMessage({ type: 'error', text: 'Teklif No boş olamaz!' });
      return;
    }
    if (!formData['Müşteri Adı']) {
      setMessage({ type: 'error', text: 'Lütfen müşteri seçiniz!' });
      return;
    }

    try {
      setLoading(true);
      await createQuote(formData);
      setMessage({ type: 'success', text: 'Teklif eklendi!' });
      setFormData({
        'Müşteri Adı': '',
        'Tarih': format(new Date(), 'yyyy-MM-dd'),
        'Teklif No': '',
        'Tutar': '',
        'Ürün/Hizmet': '',
        'Açıklama': '',
        'Durum': 'Açık',
        'PDF': '',
      });
      loadAutoQuoteNo();
      loadPendingQuotes();
      setSelectedView(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quote) => {
    setEditingQuote(quote);
    setEditFormData({
      ...quote,
      'Tarih': quote['Tarih'] ? format(new Date(quote['Tarih']), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const quoteId = editingQuote.ID || editingQuote.id;
      await updateQuote(quoteId, editFormData);
      setMessage({ type: 'success', text: 'Teklif güncellendi!' });
      setEditingQuote(null);
      setEditFormData({});
      loadQuotes();
      loadPendingQuotes();
    } catch (error) {
      setMessage({ type: 'error', text: 'Güncelleme hatası: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await deleteQuote(id);
        setMessage({ type: 'success', text: 'Teklif silindi!' });
        if (editingQuote && (editingQuote.ID === id || editingQuote.id === id)) {
          setEditingQuote(null);
          setEditFormData({});
        }
        loadQuotes();
        loadPendingQuotes();
      } catch (error) {
        setMessage({ type: 'error', text: 'Silme hatası: ' + error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    if (quotes.length === 0) {
      alert('İndirilecek teklif yok.');
      return;
    }

    const headers = ['Müşteri Adı', 'Tarih', 'Teklif No', 'Tutar', 'Durum', 'Ürün/Hizmet', 'Açıklama'];
    const rows = quotes.map(q => [
      q['Müşteri Adı'] || '',
      q['Tarih'] ? format(new Date(q['Tarih']), 'dd/MM/yyyy') : '',
      q['Teklif No'] || '',
      q['Tutar'] || '',
      q['Durum'] || '',
      q['Ürün/Hizmet'] || '',
      q['Açıklama'] || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teklifler_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotal = () => {
    return quotes.reduce((sum, q) => {
      const amount = parseFloat(String(q['Tutar'] || '0').replace(/[^0-9.-]/g, '')) || 0;
      return sum + amount;
    }, 0);
  };

  const pendingTotal = pendingQuotes.reduce((sum, q) => {
    const amount = parseFloat(String(q['Tutar'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    return sum + amount;
  }, 0);

  const customerOptions = ['(Hepsi)', ...customers.map(c => c['Müşteri Adı']).filter(Boolean).sort()];
  const uniqueCustomers = [...new Set(quotes.map(q => q['Müşteri Adı']).filter(Boolean))].sort();

  // Initialize date range when switching to old view
  useEffect(() => {
    if (selectedView === 'old' && !filters.startDate && !filters.endDate) {
      // Set default date range (last 30 days to today)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      setFilters(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }));
    }
  }, [selectedView]);

  return (
    <div>
      <div className="page-header">
        <h1>Teklif Yönetimi</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      {/* Açık Teklifler Özeti */}
      <div className="card">
        <h3>Açık Pozisyondaki Teklifler</h3>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '1.05em', color: '#11998e', fontWeight: 'bold' }}>
            Toplam: {pendingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD | 
            Toplam Açık Teklif: {pendingQuotes.length} adet
          </div>
        </div>
        {pendingQuotes.length === 0 ? (
          <div className="empty-state">
            <p>Açık teklif bulunmuyor.</p>
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
              {pendingQuotes.map((quote) => (
                <tr key={quote.ID || quote.id}>
                  <td>{quote['Müşteri Adı']}</td>
                  <td>
                    {quote['Tarih'] ? format(new Date(quote['Tarih']), 'dd/MM/yyyy') : ''}
                  </td>
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

      {/* İşlem Seçimi */}
      <div className="card">
        <h3>Lütfen bir işlem seçin</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedView('new');
              setMessage(null);
              loadAutoQuoteNo();
            }}
          >
            Yeni Teklif
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedView('old');
              setMessage(null);
              loadQuotes();
            }}
          >
            Eski Teklifler / Düzenle
          </button>
        </div>
      </div>

      {/* Yeni Teklif */}
      {selectedView === 'new' && (
        <div className="card">
          <h3>Yeni Teklif Ekle</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Müşteri Seç *</label>
              <select
                value={formData['Müşteri Adı']}
                onChange={(e) => setFormData({ ...formData, 'Müşteri Adı': e.target.value })}
                required
              >
                <option value="">Seçiniz</option>
                {customers.map((customer) => (
                  <option key={customer.id || customer['Müşteri Adı']} value={customer['Müşteri Adı']}>
                    {customer['Müşteri Adı']}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tarih</label>
              <input
                type="date"
                value={formData['Tarih']}
                onChange={(e) => setFormData({ ...formData, 'Tarih': e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Teklif No *</label>
              <input
                type="text"
                value={formData['Teklif No']}
                onChange={(e) => setFormData({ ...formData, 'Teklif No': e.target.value })}
                placeholder={autoQuoteNo}
                required
              />
            </div>

            <div className="form-group">
              <label>Tutar (USD)</label>
              <input
                type="text"
                value={formData['Tutar']}
                onChange={(e) => setFormData({ ...formData, 'Tutar': e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Ürün/Hizmet</label>
              <input
                type="text"
                value={formData['Ürün/Hizmet']}
                onChange={(e) => setFormData({ ...formData, 'Ürün/Hizmet': e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={formData['Açıklama']}
                onChange={(e) => setFormData({ ...formData, 'Açıklama': e.target.value })}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Durum</label>
              <select
                value={formData['Durum']}
                onChange={(e) => setFormData({ ...formData, 'Durum': e.target.value })}
              >
                {QUOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>PDF Link (Google Drive)</label>
              <input
                type="text"
                value={formData['PDF']}
                onChange={(e) => setFormData({ ...formData, 'PDF': e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
              />
              <small style={{ color: '#6c757d' }}>PDF dosyasını Google Drive'a yükleyip linkini buraya yapıştırın</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
              onClick={() => setSelectedView(null)}
            >
              İptal
            </button>
          </form>
        </div>
      )}

      {/* Eski Teklifler */}
      {selectedView === 'old' && (
        <div>
          <div className="card">
            <h3>Filtreler</h3>
            <div className="search-filter">
              <div>
                <label>Müşteri</label>
                <select
                  value={filters.customer}
                  onChange={(e) => {
                    setFilters({ ...filters, customer: e.target.value });
                  }}
                >
                  {customerOptions.map((customer) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Durum</label>
                <select
                  multiple
                  value={filters.statuses}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters({ ...filters, statuses: values });
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {QUOTE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label>Ara (ürün/açıklama/teklif no)</label>
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                  placeholder="Arama yapın..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3>Teklifler ({quotes.length})</h3>
                <div style={{ fontWeight: 600, marginTop: '10px' }}>
                  Filtreli Toplam: {calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              </div>
              {quotes.length > 0 && (
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  CSV İndir
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading">Yükleniyor...</div>
            ) : quotes.length === 0 ? (
              <div className="empty-state">
                <p>Filtrelere göre teklif bulunamadı.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Müşteri Adı</th>
                    <th>Tarih</th>
                    <th>Teklif No</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Ürün/Hizmet</th>
                    <th>Açıklama</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.ID || quote.id}>
                      <td>{quote['Müşteri Adı']}</td>
                      <td>
                        {quote['Tarih'] ? format(new Date(quote['Tarih']), 'dd/MM/yyyy') : ''}
                      </td>
                      <td>{quote['Teklif No']}</td>
                      <td>{quote['Tutar']}</td>
                      <td>{quote['Durum']}</td>
                      <td>{quote['Ürün/Hizmet']}</td>
                      <td>{quote['Açıklama']}</td>
                      <td>
                        {quote['PDF'] && (
                          <a href={quote['PDF']} target="_blank" rel="noopener noreferrer" style={{ marginRight: '5px' }}>
                            PDF
                          </a>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleEdit(quote)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleDelete(quote.ID || quote.id)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Düzenleme Formu */}
          {editingQuote && (
            <div className="card">
              <h3>Teklif Düzenle</h3>
              {editingQuote['PDF'] && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>Mevcut PDF: </strong>
                  <a href={editingQuote['PDF']} target="_blank" rel="noopener noreferrer">
                    Görüntüle
                  </a>
                </div>
              )}
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label>Müşteri</label>
                  <select
                    value={editFormData['Müşteri Adı'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Müşteri Adı': e.target.value })}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {customers.map((customer) => (
                      <option key={customer.id || customer['Müşteri Adı']} value={customer['Müşteri Adı']}>
                        {customer['Müşteri Adı']}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tarih</label>
                  <input
                    type="date"
                    value={editFormData['Tarih']}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Tarih': e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teklif No</label>
                  <input
                    type="text"
                    value={editFormData['Teklif No'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Teklif No': e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tutar (USD)</label>
                  <input
                    type="text"
                    value={editFormData['Tutar'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Tutar': e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Ürün/Hizmet</label>
                  <input
                    type="text"
                    value={editFormData['Ürün/Hizmet'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Ürün/Hizmet': e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea
                    value={editFormData['Açıklama'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Açıklama': e.target.value })}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Durum</label>
                  <select
                    value={editFormData['Durum'] || 'Açık'}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Durum': e.target.value })}
                  >
                    {QUOTE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>PDF Link (Google Drive)</label>
                  <input
                    type="text"
                    value={editFormData['PDF'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'PDF': e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <small style={{ color: '#6c757d' }}>PDF dosyasını Google Drive'a yükleyip linkini buraya yapıştırın</small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setEditingQuote(null);
                    setEditFormData({});
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ marginLeft: '10px' }}
                  onClick={() => handleDelete(editingQuote.ID || editingQuote.id)}
                >
                  Sil
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuoteManagement;
