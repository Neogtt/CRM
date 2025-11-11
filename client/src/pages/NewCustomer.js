import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomer, getCustomers, getRepresentatives } from '../utils/api';

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

function NewCustomer() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [allRepresentatives, setAllRepresentatives] = useState([]);
  const [formData, setFormData] = useState({
    'Müşteri Adı': '',
    'Ülke': '',
    'Telefon': '',
    'E-posta': '',
    'Adres': '',
    'Satış Temsilcisi': '',
    'Durum': 'Aktif',
    'Kategori': '',
    'Notlar': '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Temsilci listesini Excel'deki Temsilciler sayfasından çek
        const repsResponse = await getRepresentatives();
        const repsData = repsResponse.data || [];
        setAllRepresentatives(repsData);
      } catch (error) {
        console.error('Error loading representatives:', error);
        setMessage({ type: 'error', text: 'Temsilci listesi yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
      }
    };
    
    loadData();
  }, []);

  // Ülke seçildiğinde temsilci listesini filtrele
  const filteredRepresentatives = React.useMemo(() => {
    if (!allRepresentatives || allRepresentatives.length === 0) {
      return [];
    }
    
    if (!formData['Ülke']) {
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
        return ulkeler.includes(formData['Ülke']);
      })
      .map(rep => rep['Temsilci Adı'])
      .filter(Boolean)
      .sort();
  }, [formData['Ülke'], allRepresentatives]);

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    
    // Ülke değiştiğinde, eğer seçili temsilci yeni ülkeye ait değilse temsilciyi temizle
    if (e.target.name === 'Ülke') {
      const newCountry = e.target.value;
      if (newCountry && formData['Satış Temsilcisi']) {
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
        
        if (!filteredReps.includes(formData['Satış Temsilcisi'])) {
          newFormData['Satış Temsilcisi'] = '';
        }
      } else if (!newCountry) {
        // Ülke seçimi kaldırıldıysa temsilciyi koru
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await createCustomer(formData);
      setMessage({ type: 'success', text: 'Müşteri başarıyla oluşturuldu!' });
      setTimeout(() => {
        navigate('/cari-hesaplar/eski-kayit-duzenleme');
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Hata: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Yeni Cari Kaydı</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Müşteri Adı *</label>
            <input
              type="text"
              name="Müşteri Adı"
              value={formData['Müşteri Adı']}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Ülke</label>
            <select
              name="Ülke"
              value={formData['Ülke']}
              onChange={handleChange}
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
              name="Telefon"
              value={formData['Telefon']}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              name="E-posta"
              value={formData['E-posta']}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Adres</label>
            <textarea
              name="Adres"
              value={formData['Adres']}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Satış Temsilcisi</label>
            <select
              name="Satış Temsilcisi"
              value={formData['Satış Temsilcisi']}
              onChange={handleChange}
              disabled={filteredRepresentatives.length === 0}
            >
              <option value="">Seçiniz</option>
              {filteredRepresentatives.map((rep) => (
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
            {formData['Ülke'] && filteredRepresentatives.length === 0 && allRepresentatives.length > 0 && (
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                Bu ülke için kayıtlı temsilci bulunmamaktadır.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Durum</label>
            <select
              name="Durum"
              value={formData['Durum']}
              onChange={handleChange}
            >
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>

          <div className="form-group">
            <label>Kategori</label>
            <input
              type="text"
              name="Kategori"
              value={formData['Kategori']}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Notlar</label>
            <textarea
              name="Notlar"
              value={formData['Notlar']}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
            onClick={() => navigate('/cari-hesaplar')}
          >
            İptal
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewCustomer;

