import React, { useState, useEffect } from 'react';
import {
  getRepresentatives,
  createRepresentative,
  updateRepresentative,
  deleteRepresentative,
  getRepresentativeRegions,
  getRepresentativeCountries
} from '../utils/api';
import './Representatives.css';

function Representatives() {
  const [representatives, setRepresentatives] = useState([]);
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepresentative, setSelectedRepresentative] = useState('Yeni Temsilci');
  const [formData, setFormData] = useState({
    'Temsilci Adı': '',
    'Bölgeler': [],
    'Ülkeler': [],
    'Notlar': ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRepresentative !== 'Yeni Temsilci') {
      const rep = representatives.find(r => r['Temsilci Adı'] === selectedRepresentative);
      if (rep) {
        setFormData({
          'Temsilci Adı': rep['Temsilci Adı'] || '',
          'Bölgeler': Array.isArray(rep['Bölgeler']) ? rep['Bölgeler'] : (rep['Bölgeler'] ? rep['Bölgeler'].split(',').map(b => b.trim()).filter(b => b) : []),
          'Ülkeler': Array.isArray(rep['Ülkeler']) ? rep['Ülkeler'] : (rep['Ülkeler'] ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u) : []),
          'Notlar': rep['Notlar'] || ''
        });
      }
    } else {
      setFormData({
        'Temsilci Adı': '',
        'Bölgeler': [],
        'Ülkeler': [],
        'Notlar': ''
      });
    }
    setErrors({});
    setSuccessMessage('');
  }, [selectedRepresentative, representatives]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repsRes, regionsRes, countriesRes] = await Promise.all([
        getRepresentatives(),
        getRepresentativeRegions(),
        getRepresentativeCountries()
      ]);
      setRepresentatives(repsRes.data || []);
      setRegions(regionsRes.data || []);
      setCountries(countriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Veri yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData['Temsilci Adı'] || !formData['Temsilci Adı'].trim()) {
      newErrors['Temsilci Adı'] = 'Temsilci adı gereklidir';
    }
    
    if (!formData['Bölgeler'] || formData['Bölgeler'].length === 0) {
      newErrors['Bölgeler'] = 'En az bir bölge seçilmelidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const repData = {
        'Temsilci Adı': formData['Temsilci Adı'].trim(),
        'Bölgeler': formData['Bölgeler'],
        'Ülkeler': formData['Ülkeler'],
        'Notlar': formData['Notlar'].trim()
      };
      
      if (selectedRepresentative === 'Yeni Temsilci') {
        await createRepresentative(repData);
        setSuccessMessage('Temsilci başarıyla eklendi.');
      } else {
        const rep = representatives.find(r => r['Temsilci Adı'] === selectedRepresentative);
        if (rep) {
          await updateRepresentative(rep.id, repData);
          setSuccessMessage('Temsilci bilgileri güncellendi.');
        }
      }
      
      await loadData();
      setSelectedRepresentative(repData['Temsilci Adı']);
    } catch (error) {
      console.error('Error saving representative:', error);
      alert('Kayıt sırasında hata oluştu: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteRepresentative(deleteConfirm.id);
      setSuccessMessage('Temsilci başarıyla silindi.');
      setDeleteConfirm(null);
      setSelectedRepresentative('Yeni Temsilci');
      await loadData();
    } catch (error) {
      console.error('Error deleting representative:', error);
      alert('Silme işlemi sırasında hata oluştu: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const representativeOptions = ['Yeni Temsilci', ...representatives.map(r => r['Temsilci Adı']).filter(Boolean).sort()];

  if (loading && representatives.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 style={{ color: '#219A41', fontWeight: 'bold', marginBottom: '10px' }}>Satış Temsilcileri</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Yeni temsilci ekleyerek veya mevcut kaydı güncelleyerek tüm modüllerde kullanılacak listeyi buradan yönetebilirsiniz.
      </p>

      {successMessage && (
        <div className="success-message" style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          {successMessage}
        </div>
      )}

      <div className="representatives-form-container">
        <div className="form-section">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div>
              <label>Temsilci Seçin:</label>
              <select
                value={selectedRepresentative}
                onChange={(e) => setSelectedRepresentative(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                {representativeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              {selectedRepresentative !== 'Yeni Temsilci' && (
                <button
                  onClick={() => {
                    const rep = representatives.find(r => r['Temsilci Adı'] === selectedRepresentative);
                    if (rep) {
                      setDeleteConfirm(rep);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '24px'
                  }}
                >
                  Temsilciyi Sil
                </button>
              )}
            </div>
          </div>

          {deleteConfirm && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>{deleteConfirm['Temsilci Adı']}</strong> temsilcisini silmek istediğinizden emin misiniz?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Evet, Sil
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                Temsilci Adı <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={formData['Temsilci Adı']}
                onChange={(e) => handleInputChange('Temsilci Adı', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: errors['Temsilci Adı'] ? '1px solid red' : '1px solid #ddd'
                }}
                placeholder="Temsilci adını girin"
              />
              {errors['Temsilci Adı'] && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                  {errors['Temsilci Adı']}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Sorumlu Bölgeler <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                multiple
                value={formData['Bölgeler']}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange('Bölgeler', selected);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: errors['Bölgeler'] ? '1px solid red' : '1px solid #ddd',
                  minHeight: '100px'
                }}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
                Bir veya birden fazla bölge seçmek için Ctrl (Windows) veya Cmd (Mac) tuşuna basılı tutun.
              </small>
              {errors['Bölgeler'] && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                  {errors['Bölgeler']}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Sorumlu Ülkeler
              </label>
              <select
                multiple
                value={formData['Ülkeler']}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange('Ülkeler', selected);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  minHeight: '100px'
                }}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
                Temsilcinin aktif olarak takip ettiği ülkeleri seçin. Boş bırakılabilir.
              </small>
            </div>

            <div className="form-group">
              <label>Notlar</label>
              <textarea
                value={formData['Notlar']}
                onChange={(e) => handleInputChange('Notlar', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="İletişim bilgileri veya ek açıklamalar için opsiyonel alan"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#219A41',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Kaydediliyor...' : selectedRepresentative === 'Yeni Temsilci' ? 'Temsilciyi Kaydet' : 'Temsilciyi Güncelle'}
            </button>
          </form>
        </div>

        <div className="representatives-list-section">
          <h3 style={{ marginBottom: '15px' }}>Kayıtlı Temsilciler</h3>
          {representatives.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Henüz temsilci kaydı bulunmuyor.
            </div>
          ) : (
            <div className="representatives-table-container">
              <table className="representatives-table">
                <thead>
                  <tr>
                    <th>Temsilci Adı</th>
                    <th>Bölgeler</th>
                    <th>Ülkeler</th>
                    <th>Notlar</th>
                  </tr>
                </thead>
                <tbody>
                  {representatives
                    .filter(r => r['Temsilci Adı'] && r['Temsilci Adı'].trim())
                    .sort((a, b) => (a['Temsilci Adı'] || '').localeCompare(b['Temsilci Adı'] || ''))
                    .map((rep, index) => (
                      <tr
                        key={rep.id || index}
                        onClick={() => setSelectedRepresentative(rep['Temsilci Adı'])}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedRepresentative === rep['Temsilci Adı'] ? '#e8f5e9' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedRepresentative !== rep['Temsilci Adı']) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedRepresentative !== rep['Temsilci Adı']) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td>{rep['Temsilci Adı']}</td>
                        <td>
                          {Array.isArray(rep['Bölgeler'])
                            ? rep['Bölgeler'].join(', ')
                            : (rep['Bölgeler'] || '').split(',').map(b => b.trim()).filter(b => b).join(', ')}
                        </td>
                        <td>
                          {Array.isArray(rep['Ülkeler'])
                            ? rep['Ülkeler'].join(', ')
                            : (rep['Ülkeler'] || '').split(',').map(u => u.trim()).filter(u => u).join(', ') || '-'}
                        </td>
                        <td>{rep['Notlar'] || '-'}</td>
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

export default Representatives;

