import React, { useState, useEffect } from 'react';
import { getCustomers, searchCustomers, deleteCustomer, updateCustomer, getCustomer, getRepresentatives } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';

const COUNTRY_LIST = [
  'Afganistan', 'Almanya', 'Amerika Birleşik Devletleri', 'Andorra', 'Angola',
  'Arjantin', 'Arnavutluk', 'Avustralya', 'Avusturya', 'Azerbaycan',
  'Bahreyn', 'Bangladeş', 'Belçika', 'Birleşik Arap Emirlikleri', 'Birleşik Krallık',
  'Brezilya', 'Bulgaristan', 'Çekya', 'Çin', 'Danimarka',
  'Fransa', 'Güney Afrika', 'Güney Kore', 'Hindistan', 'Hollanda',
  'İspanya', 'İsrail', 'İsveç', 'İsviçre', 'İtalya',
  'Japonya', 'Kanada', 'Katar', 'Kazakistan', 'Kolombiya',
  'Meksika', 'Norveç', 'Pakistan', 'Polonya', 'Portekiz',
  'Romanya', 'Rusya', 'Singapur', 'Suudi Arabistan', 'Türkiye',
  'Ukrayna', 'Yunanistan', 'Diğer'
];

function EskiKayitDuzenleme() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customers, setCustomers] = useState([]);
  const [allRepresentatives, setAllRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: [],
    representative: [],
    status: ['Aktif'],
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadCustomers();
    loadRepresentatives();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [searchQuery, filters]);

  useEffect(() => {
    if (id) {
      loadCustomerForEdit(id);
    }
  }, [id]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await searchCustomers(searchQuery, filters);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerForEdit = async (customerId) => {
    try {
      const response = await getCustomer(customerId);
      setEditingCustomer(response.data);
      setEditFormData(response.data);
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const loadRepresentatives = async () => {
    try {
      const response = await getRepresentatives();
      setAllRepresentatives(response.data || []);
    } catch (error) {
      console.error('Error loading representatives:', error);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCustomer(customerId);
        loadCustomers();
        if (editingCustomer && editingCustomer.id === customerId) {
          setEditingCustomer(null);
          setEditFormData({});
        }
      } catch (error) {
        alert('Silme hatası: ' + error.message);
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setEditFormData(customer);
    navigate(`/cari-hesaplar/eski-kayit-duzenleme/${customer.id}`);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(editingCustomer.id, editFormData);
      setEditingCustomer(null);
      setEditFormData({});
      loadCustomers();
      navigate('/cari-hesaplar/eski-kayit-duzenleme');
      alert('Müşteri başarıyla güncellendi!');
    } catch (error) {
      alert('Güncelleme hatası: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setEditFormData({});
    navigate('/cari-hesaplar/eski-kayit-duzenleme');
  };

  const uniqueCountries = [...new Set(customers.map(c => c['Ülke']).filter(Boolean))].sort();
  
  // Ülke seçildiğinde temsilci listesini filtrele (düzenleme modu için)
  const filteredRepresentativesForEdit = React.useMemo(() => {
    if (!allRepresentatives || allRepresentatives.length === 0) {
      return [];
    }
    
    if (!editFormData['Ülke']) {
      // Ülke seçilmediyse tüm temsilcileri göster
      return allRepresentatives.map(rep => rep['Temsilci Adı']).filter(Boolean).sort();
    }
    
    // Ülke seçildiyse, o ülkeye ait temsilcileri filtrele
    return allRepresentatives
      .filter(rep => {
        const ulkeler = rep['Ülkeler'] 
          ? (typeof rep['Ülkeler'] === 'string' 
              ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u)
              : Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : [])
          : [];
        return ulkeler.includes(editFormData['Ülke']);
      })
      .map(rep => rep['Temsilci Adı'])
      .filter(Boolean)
      .sort();
  }, [editFormData['Ülke'], allRepresentatives]);
  
  // Filtreleme için tüm temsilcileri göster
  const allRepresentativeNames = allRepresentatives.map(rep => rep['Temsilci Adı']).filter(Boolean).sort();

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  // Düzenleme modu
  if (editingCustomer) {
    return (
      <div className="page-container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#219A41', fontWeight: 'bold', marginBottom: '5px', fontSize: '28px' }}>Cari Hesaplar</h1>
          <h2 style={{ marginTop: '0', marginBottom: '0', fontSize: '20px', fontWeight: '600', color: '#333' }}>Müşteri Düzenle</h2>
        </div>

        <div className="card" style={{ padding: '30px' }}>
          <form onSubmit={handleSaveEdit} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            <div className="form-group">
              <label>Müşteri Adı *</label>
              <input
                type="text"
                value={editFormData['Müşteri Adı'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Müşteri Adı': e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Ülke</label>
              <select
                value={editFormData['Ülke'] || ''}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  const newEditFormData = { ...editFormData, 'Ülke': newCountry };
                  
                  // Ülke değiştiğinde, eğer seçili temsilci yeni ülkeye ait değilse temsilciyi temizle
                  if (newCountry && editFormData['Satış Temsilcisi']) {
                    const filteredReps = allRepresentatives
                      .filter(rep => {
                        const ulkeler = rep['Ülkeler'] 
                          ? (typeof rep['Ülkeler'] === 'string' 
                              ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u)
                              : Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : [])
                          : [];
                        return ulkeler.includes(newCountry);
                      })
                      .map(rep => rep['Temsilci Adı']);
                    
                    if (!filteredReps.includes(editFormData['Satış Temsilcisi'])) {
                      newEditFormData['Satış Temsilcisi'] = '';
                    }
                  }
                  
                  setEditFormData(newEditFormData);
                }}
              >
                <option value="">Seçiniz</option>
                {COUNTRY_LIST.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Telefon</label>
              <input
                type="tel"
                value={editFormData['Telefon'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Telefon': e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                value={editFormData['E-posta'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'E-posta': e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Adres</label>
              <textarea
                value={editFormData['Adres'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Adres': e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>Satış Temsilcisi</label>
              <select
                value={editFormData['Satış Temsilcisi'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Satış Temsilcisi': e.target.value })}
                disabled={filteredRepresentativesForEdit.length === 0}
              >
                <option value="">Seçiniz</option>
                {filteredRepresentativesForEdit.map((rep) => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))}
              </select>
              {allRepresentatives.length === 0 && (
                <small style={{ color: '#ff6b6b', display: 'block', marginTop: '5px' }}>
                  Temsilci listesi yükleniyor veya kayıtlı temsilci bulunmamaktadır.
                </small>
              )}
              {editFormData['Ülke'] && filteredRepresentativesForEdit.length === 0 && allRepresentatives.length > 0 && (
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Bu ülke için kayıtlı temsilci bulunmamaktadır.
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Durum</label>
              <select
                value={editFormData['Durum'] || 'Aktif'}
                onChange={(e) => setEditFormData({ ...editFormData, 'Durum': e.target.value })}
              >
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>

            <div className="form-group">
              <label>Kategori</label>
              <input
                type="text"
                value={editFormData['Kategori'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Kategori': e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notlar</label>
              <textarea
                value={editFormData['Notlar'] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, 'Notlar': e.target.value })}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#219A41',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7e34'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#219A41'}
              >
                Kaydet
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  border: '1px solid #6c757d',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Liste görünümü
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#219A41', fontWeight: 'bold', marginBottom: '5px', fontSize: '28px' }}>Cari Hesaplar</h1>
        <h2 style={{ marginTop: '0', marginBottom: '0', fontSize: '20px', fontWeight: '600', color: '#333' }}>Eski Kayıt Düzenleme</h2>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: '600' }}>Filtreler</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Arama (Ad / Telefon / E-posta / Adres)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Arama yapın..."
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Ülke Filtresi</label>
            <select
              multiple
              value={filters.country}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, country: values });
              }}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                minHeight: '100px',
                fontSize: '14px'
              }}
            >
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Çoklu seçim için Ctrl (Mac: Cmd) tuşuna basılı tutun
            </small>
          </div>
          
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Temsilci Filtresi</label>
            <select
              multiple
              value={filters.representative}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, representative: values });
              }}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                minHeight: '100px',
                fontSize: '14px'
              }}
            >
              {allRepresentativeNames.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Çoklu seçim için Ctrl (Mac: Cmd) tuşuna basılı tutun
            </small>
          </div>
          
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Durum</label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, status: values });
              }}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                minHeight: '100px',
                fontSize: '14px'
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Çoklu seçim için Ctrl (Mac: Cmd) tuşuna basılı tutun
            </small>
          </div>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: '600' }}>Müşteri Listesi</h3>
          {customers.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px'
            }}>
              <p style={{ margin: '0', fontSize: '16px' }}>Müşteri bulunamadı.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>Müşteri Adı</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>Ülke</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>Telefon</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>E-posta</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>Satış Temsilcisi</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>Durum</th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      fontWeight: '600',
                      color: '#333'
                    }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr 
                      key={customer.id || index}
                      style={{ 
                        borderBottom: '1px solid #dee2e6',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px', color: '#219A41', fontWeight: '500' }}>
                        {customer['Müşteri Adı']}
                      </td>
                      <td style={{ padding: '12px' }}>{customer['Ülke'] || '-'}</td>
                      <td style={{ padding: '12px' }}>{customer['Telefon'] || '-'}</td>
                      <td style={{ padding: '12px' }}>{customer['E-posta'] || '-'}</td>
                      <td style={{ padding: '12px' }}>{customer['Satış Temsilcisi'] || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: customer['Durum'] === 'Aktif' ? '#d4edda' : '#f8d7da',
                          color: customer['Durum'] === 'Aktif' ? '#155724' : '#721c24'
                        }}>
                          {customer['Durum'] || 'Aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ 
                            marginRight: '8px', 
                            fontSize: '13px', 
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #6c757d',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                          onClick={() => handleEdit(customer)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ 
                            fontSize: '13px', 
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #dc3545',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                          onClick={() => handleDelete(customer.id)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EskiKayitDuzenleme;

