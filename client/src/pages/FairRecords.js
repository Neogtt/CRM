import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { getFairs, getFair, createFair, updateFair, deleteFair, getCustomers, getRepresentatives } from '../utils/api';

function FairRecords() {
  const [fairs, setFairs] = useState([]);
  const [uniqueFairs, setUniqueFairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [selectedFair, setSelectedFair] = useState('');
  const [newFairName, setNewFairName] = useState('');
  const [operation, setOperation] = useState('Yeni Kayıt'); // 'Yeni Kayıt' or 'Eski Kayıt'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingFair, setEditingFair] = useState(null);
  const [deletingFairId, setDeletingFairId] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    'Fuar Adı': '',
    'Müşteri Adı': '',
    'Ülke': '',
    'Telefon': '',
    'E-mail': '',
    'Satış Temsilcisi': '',
    'Açıklamalar': '',
    'Görüşme Kalitesi': 3,
    'Tarih': format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Get unique countries from customers
  const countries = [...new Set(customers.map(c => c['Ülke']).filter(Boolean))].sort();
  
  // Ülke seçildiğinde temsilci listesini filtrele
  const filteredSalesReps = React.useMemo(() => {
    if (!representatives || representatives.length === 0) {
      return [];
    }
    
    if (!formData['Ülke']) {
      // Ülke seçilmediyse tüm temsilcileri göster
      return representatives.map(rep => rep['Temsilci Adı']).filter(Boolean).sort();
    }
    
    // Ülke seçildiyse, o ülkeye ait temsilcileri filtrele
    return representatives
      .filter(rep => {
        const ulkeler = rep['Ülkeler'] 
          ? (typeof rep['Ülkeler'] === 'string' 
              ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u)
              : Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : [])
          : [];
        return ulkeler.includes(formData['Ülke']);
      })
      .map(rep => rep['Temsilci Adı'])
      .filter(Boolean)
      .sort();
  }, [formData['Ülke'], representatives]);
  
  useEffect(() => {
    loadData();
    loadCustomers();
    loadRepresentatives();
  }, []);
  
  useEffect(() => {
    if (fairs.length > 0) {
      const unique = [...new Set(fairs.map(f => f['Fuar Adı']).filter(Boolean))].sort();
      setUniqueFairs(unique);
    }
  }, [fairs]);
  
  useEffect(() => {
    if (selectedFair && operation === 'Yeni Kayıt') {
      setFormData(prev => ({ ...prev, 'Fuar Adı': selectedFair }));
    }
  }, [selectedFair, operation]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getFairs();
      setFairs(response.data || []);
    } catch (error) {
      console.error('Error loading fairs:', error);
      setMessage({ type: 'error', text: 'Fuar kayıtları yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const handleAddFair = () => {
    if (!newFairName.trim()) {
      setMessage({ type: 'error', text: 'Fuar adı boş olamaz.' });
      return;
    }
    
    if (uniqueFairs.includes(newFairName.trim())) {
      setMessage({ type: 'info', text: 'Bu fuar zaten mevcut.' });
      setSelectedFair(newFairName.trim());
      return;
    }
    
    setSelectedFair(newFairName.trim());
    setNewFairName('');
    setMessage({ type: 'success', text: `Fuar eklendi: ${newFairName.trim()}` });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData['Fuar Adı'] || !formData['Fuar Adı'].trim()) {
      setMessage({ type: 'error', text: 'Lütfen bir fuar seçin veya ekleyin.' });
      return;
    }
    
    if (!formData['Müşteri Adı'] || !formData['Müşteri Adı'].trim()) {
      setMessage({ type: 'error', text: 'Müşteri adı gerekli.' });
      return;
    }
    
    try {
      setLoading(true);
      await createFair(formData);
      setMessage({ type: 'success', text: 'Fuar müşterisi eklendi!' });
      setFormData({
        'Fuar Adı': selectedFair,
        'Müşteri Adı': '',
        'Ülke': '',
        'Telefon': '',
        'E-mail': '',
        'Satış Temsilcisi': '',
        'Açıklamalar': '',
        'Görüşme Kalitesi': 3,
        'Tarih': format(new Date(), 'yyyy-MM-dd'),
      });
      await loadData();
    } catch (error) {
      console.error('Error creating fair:', error);
      setMessage({ type: 'error', text: 'Kayıt oluşturulurken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (fair) => {
    setEditingFair(fair);
    setFormData({
      'Fuar Adı': fair['Fuar Adı'] || '',
      'Müşteri Adı': fair['Müşteri Adı'] || '',
      'Ülke': fair['Ülke'] || '',
      'Telefon': fair['Telefon'] || '',
      'E-mail': fair['E-mail'] || fair['E-posta'] || '',
      'Satış Temsilcisi': fair['Satış Temsilcisi'] || '',
      'Açıklamalar': fair['Açıklamalar'] || '',
      'Görüşme Kalitesi': fair['Görüşme Kalitesi'] || 3,
      'Tarih': fair['Tarih'] ? (fair['Tarih'].includes('T') ? fair['Tarih'].split('T')[0] : fair['Tarih']) : format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedFair(fair['Fuar Adı'] || '');
    setOperation('Eski Kayıt');
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!editingFair) return;
    
    try {
      setLoading(true);
      await updateFair(editingFair.id || editingFair.ID, formData);
      setMessage({ type: 'success', text: 'Fuar kaydı güncellendi!' });
      setEditingFair(null);
      await loadData();
    } catch (error) {
      console.error('Error updating fair:', error);
      setMessage({ type: 'error', text: 'Kayıt güncellenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!deletingFairId) {
      setMessage({ type: 'error', text: 'Lütfen silinecek kaydı seçin.' });
      return;
    }
    
    try {
      setLoading(true);
      await deleteFair(deletingFairId);
      setMessage({ type: 'success', text: 'Fuar kaydı silindi!' });
      setDeletingFairId('');
      await loadData();
    } catch (error) {
      console.error('Error deleting fair:', error);
      setMessage({ type: 'error', text: 'Kayıt silinirken hata oluştu: ' + (error.response?.data?.error || error.message) });
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
  
  // Filter fairs by selected fair
  const filteredFairs = selectedFair 
    ? fairs.filter(f => f['Fuar Adı'] === selectedFair)
    : [];
  
  return (
    <div>
      <div className="page-header">
        <h1>Fuar Kayıtları</h1>
      </div>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '20px' }}>
          Fuarlarda müşteri görüşmelerinizi hızlıca buraya ekleyin. Yeni kayıt oluşturun, mevcutları düzenleyin.
        </p>
        
        {/* Fuar Seçimi */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2', minWidth: '200px' }}>
            <label>Fuar Seçiniz:</label>
            <select
              value={selectedFair}
              onChange={(e) => setSelectedFair(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            >
              <option value="">— Fuar Seçiniz —</option>
              {uniqueFairs.map((fair, idx) => (
                <option key={idx} value={fair}>
                  {fair}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label>Yeni Fuar Adı (opsiyonel):</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <input
                type="text"
                value={newFairName}
                onChange={(e) => setNewFairName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFair()}
                style={{ flex: '1', padding: '8px' }}
                placeholder="Fuar adı girin"
              />
              <button onClick={handleAddFair} className="btn btn-primary">
                Fuar Ekle
              </button>
            </div>
          </div>
        </div>
        
        {/* İşlem Seçimi */}
        <div style={{ marginBottom: '20px' }}>
          <label>İşlem Seçiniz:</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label>
              <input
                type="radio"
                value="Yeni Kayıt"
                checked={operation === 'Yeni Kayıt'}
                onChange={(e) => {
                  setOperation(e.target.value);
                  setEditingFair(null);
                  setFormData({
                    'Fuar Adı': selectedFair,
                    'Müşteri Adı': '',
                    'Ülke': '',
                    'Telefon': '',
                    'E-mail': '',
                    'Satış Temsilcisi': '',
                    'Açıklamalar': '',
                    'Görüşme Kalitesi': 3,
                    'Tarih': format(new Date(), 'yyyy-MM-dd'),
                  });
                }}
                style={{ marginRight: '8px' }}
              />
              Yeni Kayıt
            </label>
            <label>
              <input
                type="radio"
                value="Eski Kayıt"
                checked={operation === 'Eski Kayıt'}
                onChange={(e) => {
                  setOperation(e.target.value);
                  setEditingFair(null);
                }}
                style={{ marginRight: '8px' }}
              />
              Eski Kayıt
            </label>
          </div>
        </div>
      </div>
      
      {/* Yeni Kayıt Formu */}
      {operation === 'Yeni Kayıt' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Yeni Fuar Müşteri Kaydı</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Fuar Adı *</label>
                <input
                  type="text"
                  value={formData['Fuar Adı']}
                  onChange={(e) => setFormData({ ...formData, 'Fuar Adı': e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
              </div>
              
              <div>
                <label>Müşteri Adı *</label>
                <input
                  type="text"
                  value={formData['Müşteri Adı']}
                  onChange={(e) => setFormData({ ...formData, 'Müşteri Adı': e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
              </div>
              
              <div>
                <label>Ülke</label>
                <select
                  value={formData['Ülke']}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    const newFormData = { ...formData, 'Ülke': newCountry };
                    
                    // Ülke değiştiğinde, eğer seçili temsilci yeni ülkeye ait değilse temsilciyi temizle
                    if (newCountry && formData['Satış Temsilcisi']) {
                      const filteredReps = representatives
                        .filter(rep => {
                          const ulkeler = rep['Ülkeler'] 
                            ? (typeof rep['Ülkeler'] === 'string' 
                                ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u)
                                : Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : [])
                            : [];
                          return ulkeler.includes(newCountry);
                        })
                        .map(rep => rep['Temsilci Adı']);
                      
                      if (!filteredReps.includes(formData['Satış Temsilcisi'])) {
                        newFormData['Satış Temsilcisi'] = '';
                      }
                    }
                    
                    setFormData(newFormData);
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                >
                  <option value="">— Ülke Seçin —</option>
                  {countries.map((country, idx) => (
                    <option key={idx} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label>Telefon</label>
                <input
                  type="text"
                  value={formData['Telefon']}
                  onChange={(e) => setFormData({ ...formData, 'Telefon': e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
              </div>
              
              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  value={formData['E-mail']}
                  onChange={(e) => setFormData({ ...formData, 'E-mail': e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
              </div>
              
              <div>
                <label>Satış Temsilcisi</label>
                <select
                  value={formData['Satış Temsilcisi']}
                  onChange={(e) => setFormData({ ...formData, 'Satış Temsilcisi': e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                >
                  <option value="">— Satış Temsilcisi Seçin —</option>
                  {filteredSalesReps.map((rep, idx) => (
                    <option key={idx} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
                {formData['Ülke'] && filteredSalesReps.length === 0 && (
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    Bu ülke için kayıtlı temsilci bulunmamaktadır.
                  </small>
                )}
              </div>
              
              <div>
                <label>Görüşme Kalitesi (1=Kötü, 5=Çok İyi)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData['Görüşme Kalitesi']}
                  onChange={(e) => setFormData({ ...formData, 'Görüşme Kalitesi': parseInt(e.target.value) })}
                  style={{ width: '100%', marginTop: '8px' }}
                />
                <div style={{ textAlign: 'center', marginTop: '5px' }}>
                  {formData['Görüşme Kalitesi']}
                </div>
              </div>
              
              <div>
                <label>Tarih</label>
                <input
                  type="date"
                  value={formData['Tarih']}
                  onChange={(e) => setFormData({ ...formData, 'Tarih': e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
              </div>
            </div>
            
            <div>
              <label>Açıklamalar</label>
              <textarea
                value={formData['Açıklamalar']}
                onChange={(e) => setFormData({ ...formData, 'Açıklamalar': e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '8px', minHeight: '100px' }}
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '20px' }}>
              Kaydet
            </button>
          </form>
        </div>
      )}
      
      {/* Eski Kayıt Listesi */}
      {operation === 'Eski Kayıt' && (
        <div className="card">
          {!selectedFair ? (
            <p>Önce bir fuar seçin.</p>
          ) : (
            <>
              <h2>{selectedFair} – Kayıtlar</h2>
              
              {editingFair ? (
                <div className="card" style={{ backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
                  <h3>Kaydı Düzenle</h3>
                  <form onSubmit={handleUpdate}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label>Fuar Adı *</label>
                        <input
                          type="text"
                          value={formData['Fuar Adı']}
                          onChange={(e) => setFormData({ ...formData, 'Fuar Adı': e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        />
                      </div>
                      
                      <div>
                        <label>Müşteri Adı *</label>
                        <input
                          type="text"
                          value={formData['Müşteri Adı']}
                          onChange={(e) => setFormData({ ...formData, 'Müşteri Adı': e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        />
                      </div>
                      
                      <div>
                        <label>Ülke</label>
                        <select
                          value={formData['Ülke']}
                          onChange={(e) => {
                            const newCountry = e.target.value;
                            const newFormData = { ...formData, 'Ülke': newCountry };
                            
                            // Ülke değiştiğinde, eğer seçili temsilci yeni ülkeye ait değilse temsilciyi temizle
                            if (newCountry && formData['Satış Temsilcisi']) {
                              const filteredReps = representatives
                                .filter(rep => {
                                  const ulkeler = rep['Ülkeler'] 
                                    ? (typeof rep['Ülkeler'] === 'string' 
                                        ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u)
                                        : Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : [])
                                    : [];
                                  return ulkeler.includes(newCountry);
                                })
                                .map(rep => rep['Temsilci Adı']);
                              
                              if (!filteredReps.includes(formData['Satış Temsilcisi'])) {
                                newFormData['Satış Temsilcisi'] = '';
                              }
                            }
                            
                            setFormData(newFormData);
                          }}
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        >
                          <option value="">— Ülke Seçin —</option>
                          {countries.map((country, idx) => (
                            <option key={idx} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label>Telefon</label>
                        <input
                          type="text"
                          value={formData['Telefon']}
                          onChange={(e) => setFormData({ ...formData, 'Telefon': e.target.value })}
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        />
                      </div>
                      
                      <div>
                        <label>E-mail</label>
                        <input
                          type="email"
                          value={formData['E-mail']}
                          onChange={(e) => setFormData({ ...formData, 'E-mail': e.target.value })}
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        />
                      </div>
                      
                      <div>
                        <label>Satış Temsilcisi</label>
                        <select
                          value={formData['Satış Temsilcisi']}
                          onChange={(e) => setFormData({ ...formData, 'Satış Temsilcisi': e.target.value })}
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        >
                          <option value="">— Satış Temsilcisi Seçin —</option>
                          {filteredSalesReps.map((rep, idx) => (
                            <option key={idx} value={rep}>
                              {rep}
                            </option>
                          ))}
                        </select>
                        {formData['Ülke'] && filteredSalesReps.length === 0 && (
                          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                            Bu ülke için kayıtlı temsilci bulunmamaktadır.
                          </small>
                        )}
                      </div>
                      
                      <div>
                        <label>Görüşme Kalitesi (1=Kötü, 5=Çok İyi)</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData['Görüşme Kalitesi']}
                          onChange={(e) => setFormData({ ...formData, 'Görüşme Kalitesi': parseInt(e.target.value) })}
                          style={{ width: '100%', marginTop: '8px' }}
                        />
                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                          {formData['Görüşme Kalitesi']}
                        </div>
                      </div>
                      
                      <div>
                        <label>Tarih</label>
                        <input
                          type="date"
                          value={formData['Tarih']}
                          onChange={(e) => setFormData({ ...formData, 'Tarih': e.target.value })}
                          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label>Açıklamalar</label>
                      <textarea
                        value={formData['Açıklamalar']}
                        onChange={(e) => setFormData({ ...formData, 'Açıklamalar': e.target.value })}
                        style={{ width: '100%', padding: '8px', marginTop: '8px', minHeight: '100px' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button type="submit" disabled={loading} className="btn btn-primary">
                        Güncelle
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFair(null);
                          setFormData({
                            'Fuar Adı': selectedFair,
                            'Müşteri Adı': '',
                            'Ülke': '',
                            'Telefon': '',
                            'E-mail': '',
                            'Satış Temsilcisi': '',
                            'Açıklamalar': '',
                            'Görüşme Kalitesi': 3,
                            'Tarih': format(new Date(), 'yyyy-MM-dd'),
                          });
                        }}
                        className="btn btn-secondary"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
              
              {filteredFairs.length === 0 ? (
                <p>Bu fuara ait kayıt bulunmuyor.</p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Müşteri Adı</th>
                          <th>Ülke</th>
                          <th>Telefon</th>
                          <th>E-mail</th>
                          <th>Satış Temsilcisi</th>
                          <th>Görüşme Kalitesi</th>
                          <th>Tarih</th>
                          <th>Açıklamalar</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFairs.map((fair, idx) => (
                          <tr key={fair.id || fair.ID || idx}>
                            <td>{fair['Müşteri Adı']}</td>
                            <td>{fair['Ülke']}</td>
                            <td>{fair['Telefon']}</td>
                            <td>{fair['E-mail'] || fair['E-posta']}</td>
                            <td>{fair['Satış Temsilcisi']}</td>
                            <td>{fair['Görüşme Kalitesi'] || '-'}</td>
                            <td>{safeFormatDate(fair['Tarih'])}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fair['Açıklamalar']}
                            </td>
                            <td>
                              <button
                                onClick={() => handleEdit(fair)}
                                className="btn btn-sm btn-primary"
                                style={{ marginRight: '5px' }}
                              >
                                Düzenle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="card" style={{ backgroundColor: '#fff3cd', marginTop: '20px' }}>
                    <h4>Fuar Kaydı Sil</h4>
                    <div style={{ marginBottom: '15px' }}>
                      <label>Silinecek Kaydı Seçin:</label>
                      <select
                        value={deletingFairId}
                        onChange={(e) => setDeletingFairId(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                      >
                        <option value="">— Kayıt Seçin —</option>
                        {filteredFairs.map((fair) => (
                          <option key={fair.id || fair.ID} value={fair.id || fair.ID}>
                            {fair['Müşteri Adı']} - {fair['Fuar Adı']}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleDelete} disabled={loading || !deletingFairId} className="btn btn-danger">
                      KAYDI SİL
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default FairRecords;
