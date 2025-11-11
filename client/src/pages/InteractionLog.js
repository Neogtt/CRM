import React, { useState, useEffect } from 'react';
import { getInteractions, createInteraction, updateInteraction, deleteInteraction, searchInteractions, getCustomers, getRepresentatives } from '../utils/api';
import { format } from 'date-fns';

const INTERACTION_TYPES = ['Arama', 'Görüşme', 'Ziyaret'];

function InteractionLog() {
  const [selectedTab, setSelectedTab] = useState('new');
  const [interactions, setInteractions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    'Müşteri Adı': '',
    'Tarih': format(new Date(), 'yyyy-MM-dd'),
    'Tip': 'Arama',
    'Açıklama': '',
    'Satış Temsilcisi': '',
  });

  // Filter states
  const [filters, setFilters] = useState({
    customer: '(Hepsi)',
    types: [],
    searchText: '',
  });

  // Date range states
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Edit states
  const [editingInteraction, setEditingInteraction] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadCustomers();
    loadRepresentatives();
  }, []);

  useEffect(() => {
    if (selectedTab === 'old' || selectedTab === 'dateRange') {
      loadInteractions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, filters.customer, filters.types, filters.searchText, dateRange.startDate, dateRange.endDate]);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadRepresentatives = async () => {
    try {
      const response = await getRepresentatives();
      setRepresentatives(response.data || []);
    } catch (error) {
      console.error('Error loading representatives:', error);
    }
  };

  const loadInteractions = async () => {
    try {
      setLoading(true);
      const searchParams = {};
      
      if (selectedTab === 'old') {
        if (filters.customer && filters.customer !== '(Hepsi)') {
          searchParams.customer = filters.customer;
        }
        if (filters.types && filters.types.length > 0) {
          searchParams.types = filters.types;
        }
        if (filters.searchText) {
          searchParams.searchText = filters.searchText;
        }
      } else if (selectedTab === 'dateRange') {
        searchParams.startDate = dateRange.startDate;
        searchParams.endDate = dateRange.endDate;
      }

      const response = await searchInteractions(searchParams);
      setInteractions(response.data || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
      setMessage({ type: 'error', text: 'Kayıtlar yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData['Müşteri Adı']) {
      setMessage({ type: 'error', text: 'Lütfen bir müşteri seçiniz.' });
      return;
    }

    try {
      setLoading(true);
      await createInteraction(formData);
      setMessage({ type: 'success', text: 'Kayıt eklendi!' });
      setFormData({
        'Müşteri Adı': '',
        'Tarih': format(new Date(), 'yyyy-MM-dd'),
        'Tip': 'Arama',
        'Açıklama': '',
        'Satış Temsilcisi': '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (interaction) => {
    setEditingInteraction(interaction);
    setEditFormData({
      ...interaction,
      'Tarih': interaction['Tarih'] ? format(new Date(interaction['Tarih']), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateInteraction(editingInteraction.ID || editingInteraction.id, editFormData);
      setMessage({ type: 'success', text: 'Kayıt güncellendi!' });
      setEditingInteraction(null);
      setEditFormData({});
      loadInteractions();
    } catch (error) {
      setMessage({ type: 'error', text: 'Güncelleme hatası: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await deleteInteraction(id);
        setMessage({ type: 'success', text: 'Kayıt silindi!' });
        if (editingInteraction && (editingInteraction.ID === id || editingInteraction.id === id)) {
          setEditingInteraction(null);
          setEditFormData({});
        }
        loadInteractions();
      } catch (error) {
        setMessage({ type: 'error', text: 'Silme hatası: ' + error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    if (interactions.length === 0) {
      alert('İndirilecek kayıt yok.');
      return;
    }

    const headers = ['Müşteri Adı', 'Tarih', 'Tip', 'Satış Temsilcisi', 'Açıklama'];
    const rows = interactions.map(i => [
      i['Müşteri Adı'] || '',
      i['Tarih'] ? format(new Date(i['Tarih']), 'dd/MM/yyyy') : '',
      i['Tip'] || '',
      i['Satış Temsilcisi'] || '',
      i['Açıklama'] || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gorusme_kayitlari_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const customerOptions = ['(Hepsi)', ...customers.map(c => c['Müşteri Adı']).filter(Boolean).sort()];
  const uniqueCustomers = [...new Set(interactions.map(i => i['Müşteri Adı']).filter(Boolean))].sort();

  return (
    <div>
      <div className="page-header">
        <h1>Etkileşim Günlüğü</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => {
              setSelectedTab('new');
              setMessage(null);
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: selectedTab === 'new' ? '#219A41' : 'transparent',
              color: selectedTab === 'new' ? 'white' : '#333',
              cursor: 'pointer',
              borderBottom: selectedTab === 'new' ? '3px solid #219A41' : 'none',
            }}
          >
            Yeni Kayıt
          </button>
          <button
            onClick={() => {
              setSelectedTab('old');
              setMessage(null);
              loadInteractions();
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: selectedTab === 'old' ? '#219A41' : 'transparent',
              color: selectedTab === 'old' ? 'white' : '#333',
              cursor: 'pointer',
              borderBottom: selectedTab === 'old' ? '3px solid #219A41' : 'none',
            }}
          >
            Eski Kayıt
          </button>
          <button
            onClick={() => {
              setSelectedTab('dateRange');
              setMessage(null);
              loadInteractions();
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: selectedTab === 'dateRange' ? '#219A41' : 'transparent',
              color: selectedTab === 'dateRange' ? 'white' : '#333',
              cursor: 'pointer',
              borderBottom: selectedTab === 'dateRange' ? '3px solid #219A41' : 'none',
            }}
          >
            Tarih Aralığı ile Kayıtlar
          </button>
        </div>
      </div>

      {/* Yeni Kayıt */}
      {selectedTab === 'new' && (
        <div className="card">
          <h3>Yeni Kayıt</h3>
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
              <label>Tip</label>
              <select
                value={formData['Tip']}
                onChange={(e) => setFormData({ ...formData, 'Tip': e.target.value })}
              >
                {INTERACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Satış Temsilcisi</label>
              <select
                value={formData['Satış Temsilcisi'] || ''}
                onChange={(e) => setFormData({ ...formData, 'Satış Temsilcisi': e.target.value })}
                disabled={!representatives || representatives.length === 0}
              >
                <option value="">Seçiniz</option>
                {representatives && representatives.length > 0 ? (
                  representatives.map((rep) => (
                    <option key={rep.id || rep['Temsilci Adı']} value={rep['Temsilci Adı']}>
                      {rep['Temsilci Adı']}
                    </option>
                  ))
                ) : null}
              </select>
              {(!representatives || representatives.length === 0) && (
                <small style={{ color: '#ff6b6b', display: 'block', marginTop: '5px' }}>
                  Temsilci listesi yükleniyor veya kayıtlı temsilci bulunmamaktadır.
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={formData['Açıklama']}
                onChange={(e) => setFormData({ ...formData, 'Açıklama': e.target.value })}
                rows="4"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </div>
      )}

      {/* Eski Kayıt */}
      {selectedTab === 'old' && (
        <div>
          <div className="card">
            <h3>Filtreler</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              marginTop: '15px'
            }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Müşteri Filtresi</label>
                <select
                  value={filters.customer}
                  onChange={(e) => {
                    setFilters({ ...filters, customer: e.target.value });
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  {customerOptions.map((customer) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Tip Filtresi</label>
                <select
                  multiple
                  value={filters.types}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters({ ...filters, types: values });
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    marginTop: '5px',
                    minHeight: '100px',
                    fontSize: '14px'
                  }}
                >
                  {INTERACTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                  Çoklu seçim için Ctrl (Mac: Cmd) tuşuna basılı tutun
                </small>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Ara (Açıklama)</label>
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                  placeholder="Arama yapın..."
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Kayıtlar ({interactions.length})</h3>
              {interactions.length > 0 && (
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  CSV İndir
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading">Yükleniyor...</div>
            ) : interactions.length === 0 ? (
              <div className="empty-state">
                <p>Seçilen filtrelere uygun kayıt bulunamadı.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Müşteri Adı</th>
                    <th>Tarih</th>
                    <th>Tip</th>
                    <th>Satış Temsilcisi</th>
                    <th>Açıklama</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.map((interaction) => (
                    <tr key={interaction.ID || interaction.id}>
                      <td>{interaction['Müşteri Adı']}</td>
                      <td>
                        {interaction['Tarih']
                          ? format(new Date(interaction['Tarih']), 'dd/MM/yyyy')
                          : ''}
                      </td>
                      <td>{interaction['Tip']}</td>
                      <td>{interaction['Satış Temsilcisi'] || '-'}</td>
                      <td>{interaction['Açıklama']}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleEdit(interaction)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                          onClick={() => handleDelete(interaction.ID || interaction.id)}
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
          {editingInteraction && (
            <div className="card">
              <h3>Kayıt Düzenle</h3>
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
                  <label>Tip</label>
                  <select
                    value={editFormData['Tip'] || 'Arama'}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Tip': e.target.value })}
                  >
                    {INTERACTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Satış Temsilcisi</label>
                  <select
                    value={editFormData['Satış Temsilcisi'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Satış Temsilcisi': e.target.value })}
                    disabled={!representatives || representatives.length === 0}
                  >
                    <option value="">Seçiniz</option>
                    {representatives && representatives.length > 0 ? (
                      representatives.map((rep) => (
                        <option key={rep.id || rep['Temsilci Adı']} value={rep['Temsilci Adı']}>
                          {rep['Temsilci Adı']}
                        </option>
                      ))
                    ) : null}
                  </select>
                  {(!representatives || representatives.length === 0) && (
                    <small style={{ color: '#ff6b6b', display: 'block', marginTop: '5px' }}>
                      Temsilci listesi yükleniyor veya kayıtlı temsilci bulunmamaktadır.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea
                    value={editFormData['Açıklama'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Açıklama': e.target.value })}
                    rows="4"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setEditingInteraction(null);
                    setEditFormData({});
                  }}
                >
                  İptal
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tarih Aralığı ile Kayıtlar */}
      {selectedTab === 'dateRange' && (
        <div>
          <div className="card">
            <h3>Tarih Aralığı</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              marginTop: '15px'
            }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Kayıtlar ({interactions.length})</h3>
              {interactions.length > 0 && (
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  CSV İndir
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading">Yükleniyor...</div>
            ) : interactions.length === 0 ? (
              <div className="empty-state">
                <p>Bu tarihler arasında kayıt yok.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Müşteri Adı</th>
                    <th>Tarih</th>
                    <th>Tip</th>
                    <th>Satış Temsilcisi</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.map((interaction) => (
                    <tr key={interaction.ID || interaction.id}>
                      <td>{interaction['Müşteri Adı']}</td>
                      <td>
                        {interaction['Tarih']
                          ? format(new Date(interaction['Tarih']), 'dd/MM/yyyy')
                          : ''}
                      </td>
                      <td>{interaction['Tip']}</td>
                      <td>{interaction['Satış Temsilcisi'] || '-'}</td>
                      <td>{interaction['Açıklama']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractionLog;
