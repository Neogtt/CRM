import React, { useState, useEffect } from 'react';
import { getCustomers, searchCustomers, deleteCustomer } from '../utils/api';
import { useNavigate } from 'react-router-dom';

function CustomerPortfolio() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: [],
    representative: [],
    status: ['Aktif'],
  });

  useEffect(() => {
    loadCustomers();
  }, []);

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

  useEffect(() => {
    loadCustomers();
  }, [searchQuery, filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (error) {
        alert('Silme hatası: ' + error.message);
      }
    }
  };

  const uniqueCountries = [...new Set(customers.map(c => c['Ülke']).filter(Boolean))].sort();
  const uniqueRepresentatives = [...new Set(customers.map(c => c['Satış Temsilcisi']).filter(Boolean))].sort();

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Müşteri Portföyü</h1>
      </div>

      <div className="card">
        <div className="search-filter">
          <div>
            <label>Arama (Ad / Telefon / E-posta / Adres)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Arama yapın..."
            />
          </div>
          <div>
            <label>Ülke Filtresi</label>
            <select
              multiple
              value={filters.country}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, country: values });
              }}
            >
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Temsilci Filtresi</label>
            <select
              multiple
              value={filters.representative}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, representative: values });
              }}
            >
              {uniqueRepresentatives.map(rep => (
                <option key={rep} value={rep}>{rep}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Durum</label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, status: values });
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/new-customer')}
          >
            Yeni Müşteri Ekle
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>Müşteri bulunamadı.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Ülke</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Satış Temsilcisi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id || index}>
                  <td>{customer['Müşteri Adı']}</td>
                  <td>{customer['Ülke']}</td>
                  <td>{customer['Telefon']}</td>
                  <td>{customer['E-posta']}</td>
                  <td>{customer['Satış Temsilcisi']}</td>
                  <td>{customer['Durum']}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                      onClick={() => navigate(`/customer-portfolio/${customer.id}`)}
                    >
                      Düzenle
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                      onClick={() => handleDelete(customer.id)}
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
    </div>
  );
}

export default CustomerPortfolio;

