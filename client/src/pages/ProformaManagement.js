import React, { useState, useEffect } from 'react';
import { getProformas, createProforma, updateProforma, deleteProforma, getCustomers, getPendingProformas, getRepresentatives } from '../utils/api';
import { format } from 'date-fns';

const PROFORMA_STATUSES = ['Beklemede', 'İptal', 'Faturası Kesildi', 'Siparişe Dönüştü'];
const SHIPMENT_STATUSES = ['', 'Sevkedildi', 'Ulaşıldı'];

function ProformaManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [proformas, setProformas] = useState([]);
  const [pendingProformas, setPendingProformas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [convertingProforma, setConvertingProforma] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    'Müşteri Adı': '',
    'Tarih': format(new Date(), 'yyyy-MM-dd'),
    'Proforma No': '',
    'Tutar': '',
    'Vade (gün)': '',
    'Ülke': '',
    'Satış Temsilcisi': '',
    'Ödeme Şekli': '',
    'Açıklama': '',
    'Durum': 'Beklemede',
    'PDF': '',
    'Sipariş Formu': '',
    'Sevk Durumu': '',
    'Termin Tarihi': '',
    'Ulaşma Tarihi': '',
  });

  // Edit states
  const [editingProforma, setEditingProforma] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Convert to order states
  const [orderFormData, setOrderFormData] = useState({
    'Sipariş Formu': '',
  });
  
  // File upload states
  const [proformaPdfFile, setProformaPdfFile] = useState(null);
  const [proformaPdfUploading, setProformaPdfUploading] = useState(false);
  const [editProformaPdfFile, setEditProformaPdfFile] = useState(null);
  const [editProformaPdfUploading, setEditProformaPdfUploading] = useState(false);
  const [siparisFormuFile, setSiparisFormuFile] = useState(null);
  const [siparisFormuUploading, setSiparisFormuUploading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadPendingProformas();
    loadRepresentatives();
  }, []);

  useEffect(() => {
    if (selectedCustomer && selectedOperation === 'old') {
      loadProformasByCustomer();
    }
  }, [selectedCustomer, selectedOperation]);

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

  const loadPendingProformas = async () => {
    try {
      const response = await getPendingProformas();
      setPendingProformas(response.data.proformas || []);
    } catch (error) {
      console.error('Error loading pending proformas:', error);
    }
  };

  const loadProformasByCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proformas/customer/${encodeURIComponent(selectedCustomer)}`);
      const data = await response.json();
      setProformas(data || []);
    } catch (error) {
      console.error('Error loading proformas:', error);
      setMessage({ type: 'error', text: 'Proformalar yüklenirken hata oluştu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerInfo = (customerName) => {
    const customer = customers.find(c => c['Müşteri Adı'] === customerName);
    return customer || {};
  };

  const handleCustomerSelect = (customerName) => {
    setSelectedCustomer(customerName);
    setSelectedOperation(null);
    setEditingProforma(null);
    setEditFormData({});
    setConvertingProforma(null);
    setOrderFormData({ 'Sipariş Formu': '' });
    
    if (customerName) {
      const customerInfo = getCustomerInfo(customerName);
      setFormData(prev => ({
        ...prev,
        'Müşteri Adı': customerName,
        'Ülke': customerInfo['Ülke'] || '',
        'Satış Temsilcisi': customerInfo['Satış Temsilcisi'] || '',
        'Ödeme Şekli': customerInfo['Ödeme Şekli'] || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData['Proforma No'] || !formData['Proforma No'].trim()) {
      setMessage({ type: 'error', text: 'Proforma No boş olamaz!' });
      return;
    }
    if (!formData['Vade (gün)'] || !formData['Vade (gün)'].trim()) {
      setMessage({ type: 'error', text: 'Vade (gün) boş olamaz!' });
      return;
    }
    if (!formData['Müşteri Adı']) {
      setMessage({ type: 'error', text: 'Lütfen müşteri seçiniz!' });
      return;
    }

    try {
      setLoading(true);
      let pdfUrl = formData['PDF'];
      
      // Upload Proforma PDF if file is selected
      if (proformaPdfFile) {
        setProformaPdfUploading(true);
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('pdf', proformaPdfFile);
          uploadFormData.append('fileType', 'proforma');
          uploadFormData.append('customerName', formData['Müşteri Adı']);
          uploadFormData.append('proformaNo', formData['Proforma No']);
          uploadFormData.append('tarih', formData['Tarih'] || format(new Date(), 'yyyy-MM-dd'));
          
          const uploadResponse = await fetch('/api/files/upload/proforma', {
            method: 'POST',
            body: uploadFormData,
          });
          
          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            pdfUrl = uploadData.fileUrl;
            setMessage({ type: 'success', text: 'PDF yüklendi!' });
          } else {
            throw new Error(uploadData.error || 'PDF yükleme hatası');
          }
        } catch (uploadError) {
          setMessage({ type: 'error', text: 'PDF yükleme hatası: ' + uploadError.message });
          setProformaPdfUploading(false);
          setLoading(false);
          return;
        } finally {
          setProformaPdfUploading(false);
        }
      }
      
      // Create proforma with PDF URL
      await createProforma({
        ...formData,
        'PDF': pdfUrl,
      });
      
      setMessage({ type: 'success', text: 'Proforma eklendi!' });
      setFormData({
        'Müşteri Adı': selectedCustomer,
        'Tarih': format(new Date(), 'yyyy-MM-dd'),
        'Proforma No': '',
        'Tutar': '',
        'Vade (gün)': '',
        'Ülke': getCustomerInfo(selectedCustomer)['Ülke'] || '',
        'Satış Temsilcisi': getCustomerInfo(selectedCustomer)['Satış Temsilcisi'] || '',
        'Ödeme Şekli': getCustomerInfo(selectedCustomer)['Ödeme Şekli'] || '',
        'Açıklama': '',
        'Durum': 'Beklemede',
        'PDF': '',
        'Sipariş Formu': '',
        'Sevk Durumu': '',
        'Termin Tarihi': '',
        'Ulaşma Tarihi': '',
      });
      setProformaPdfFile(null);
      loadProformasByCustomer();
      loadPendingProformas();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: 'Hata: ' + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proforma) => {
    setEditingProforma(proforma);
    setEditFormData({
      ...proforma,
      'Tarih': proforma['Tarih'] ? format(new Date(proforma['Tarih']), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      'Termin Tarihi': proforma['Termin Tarihi'] ? format(new Date(proforma['Termin Tarihi']), 'yyyy-MM-dd') : '',
    });
    setConvertingProforma(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let pdfUrl = editFormData['PDF'];
      
      // Upload Proforma PDF if file is selected
      if (editProformaPdfFile) {
        setEditProformaPdfUploading(true);
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('pdf', editProformaPdfFile);
          uploadFormData.append('fileType', 'proforma');
          uploadFormData.append('customerName', editFormData['Müşteri Adı']);
          uploadFormData.append('proformaNo', editFormData['Proforma No']);
          uploadFormData.append('tarih', editFormData['Tarih'] || format(new Date(), 'yyyy-MM-dd'));
          
          const uploadResponse = await fetch('/api/files/upload/proforma', {
            method: 'POST',
            body: uploadFormData,
          });
          
          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            pdfUrl = uploadData.fileUrl;
          } else {
            throw new Error(uploadData.error || 'PDF yükleme hatası');
          }
        } catch (uploadError) {
          setMessage({ type: 'error', text: 'PDF yükleme hatası: ' + uploadError.message });
          setEditProformaPdfUploading(false);
          setLoading(false);
          return;
        } finally {
          setEditProformaPdfUploading(false);
        }
      }
      
      const proformaId = editingProforma.ID || editingProforma.id;
      await updateProforma(proformaId, {
        ...editFormData,
        'PDF': pdfUrl,
      });
      
      setMessage({ type: 'success', text: 'Proforma güncellendi!' });
      setEditingProforma(null);
      setEditFormData({});
      setEditProformaPdfFile(null);
      loadProformasByCustomer();
      loadPendingProformas();
    } catch (error) {
      setMessage({ type: 'error', text: 'Güncelleme hatası: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu proformayı silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        await deleteProforma(id);
        setMessage({ type: 'success', text: 'Proforma silindi!' });
        if (editingProforma && (editingProforma.ID === id || editingProforma.id === id)) {
          setEditingProforma(null);
          setEditFormData({});
        }
        loadProformasByCustomer();
        loadPendingProformas();
      } catch (error) {
        setMessage({ type: 'error', text: 'Silme hatası: ' + error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConvertToOrder = async (e) => {
    e.preventDefault();
    
    // Check if either file or URL is provided
    if (!siparisFormuFile && (!orderFormData['Sipariş Formu'] || !orderFormData['Sipariş Formu'].trim())) {
      setMessage({ type: 'error', text: 'Lütfen Sipariş Formu PDF dosyası yükleyin veya link girin!' });
      return;
    }

    try {
      setLoading(true);
      let siparisFormuUrl = orderFormData['Sipariş Formu'];
      
      // Upload Sipariş Formu PDF if file is selected
      if (siparisFormuFile) {
        setSiparisFormuUploading(true);
        try {
          // Debug: Log convertingProforma object
          console.log('Converting Proforma:', convertingProforma);
          console.log('Converting Proforma keys:', Object.keys(convertingProforma || {}));
          
          // Get customer name from convertingProforma - handle different possible field names
          const customerName = convertingProforma?.['Müşteri Adı'] || 
                               convertingProforma?.['Musteri Adi'] || 
                               convertingProforma?.['MüşteriAdı'] ||
                               convertingProforma?.['customerName'] ||
                               convertingProforma?.['MusteriAdi'] ||
                               '';
          
          // Get proforma number
          const proformaNo = convertingProforma?.['Proforma No'] || 
                            convertingProforma?.['ProformaNo'] || 
                            convertingProforma?.['proformaNo'] ||
                            '';
          
          console.log('Extracted customerName:', customerName);
          console.log('Extracted proformaNo:', proformaNo);
          
          if (!customerName || customerName.trim() === '') {
            console.error('Customer name is empty! ConvertingProforma:', convertingProforma);
            throw new Error('Müşteri adı bulunamadı! Lütfen proforma kaydını kontrol edin. Proforma: ' + JSON.stringify(convertingProforma));
          }
          
          const uploadFormData = new FormData();
          uploadFormData.append('pdf', siparisFormuFile);
          uploadFormData.append('fileType', 'siparis-formu');
          uploadFormData.append('customerName', customerName.trim());
          uploadFormData.append('proformaNo', proformaNo);
          
          console.log('Uploading with customerName:', customerName.trim());
          
          const uploadResponse = await fetch('/api/files/upload/siparis-formu', {
            method: 'POST',
            body: uploadFormData,
          });
          
          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            siparisFormuUrl = uploadData.fileUrl;
            setMessage({ type: 'success', text: 'Sipariş Formu PDF yüklendi!' });
          } else {
            throw new Error(uploadData.error || 'PDF yükleme hatası');
          }
        } catch (uploadError) {
          setMessage({ type: 'error', text: 'PDF yükleme hatası: ' + uploadError.message });
          setSiparisFormuUploading(false);
          setLoading(false);
          return;
        } finally {
          setSiparisFormuUploading(false);
        }
      }
      
      const proformaId = convertingProforma.ID || convertingProforma.id;
      await fetch(`/api/proformas/${proformaId}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'Sipariş Formu': siparisFormuUrl }),
      });
      
      setMessage({ type: 'success', text: 'Sipariş formu kaydedildi ve durum "Siparişe Dönüştü" olarak güncellendi!' });
      setConvertingProforma(null);
      setOrderFormData({ 'Sipariş Formu': '' });
      setSiparisFormuFile(null);
      loadProformasByCustomer();
      loadPendingProformas();
    } catch (error) {
      setMessage({ type: 'error', text: 'Dönüştürme hatası: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const pendingTotal = pendingProformas.reduce((sum, p) => {
    const amount = parseFloat(String(p['Tutar'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    return sum + amount;
  }, 0);

  const customerOptions = customers.map(c => c['Müşteri Adı']).filter(Boolean).sort();

  return (
    <div>
      <div className="page-header">
        <h1>Proforma Yönetimi</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      {/* Bekleyen Proformalar Özeti */}
      <div className="card">
        <h3>Bekleyen Proformalar</h3>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 600 }}>
            Toplam Bekleyen: {pendingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
        {pendingProformas.length === 0 ? (
          <div className="empty-state">
            <p>Beklemede proforma bulunmuyor.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Proforma No</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>Vade (gün)</th>
                <th>Sevk Durumu</th>
              </tr>
            </thead>
            <tbody>
              {pendingProformas.map((proforma) => (
                <tr key={proforma.ID || proforma.id}>
                  <td>{proforma['Müşteri Adı']}</td>
                  <td>{proforma['Proforma No']}</td>
                  <td>
                    {proforma['Tarih'] ? format(new Date(proforma['Tarih']), 'dd/MM/yyyy') : ''}
                  </td>
                  <td>{proforma['Tutar']}</td>
                  <td>{proforma['Durum']}</td>
                  <td>{proforma['Vade (gün)']}</td>
                  <td>{proforma['Sevk Durumu'] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Müşteri Seçimi */}
      <div className="card">
        <h3>Müşteri Seç</h3>
        <div className="form-group">
          <select
            value={selectedCustomer}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          >
            <option value="">Seçiniz</option>
            {customerOptions.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>
        {selectedCustomer && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px', border: '2px solid #219A41' }}>
            <strong style={{ color: '#219A41', fontSize: '16px' }}>✓ Müşteri Seçildi: {selectedCustomer}</strong>
          </div>
        )}
      </div>

      {selectedCustomer && !selectedOperation && (
        <div className="card" style={{ border: '3px solid #219A41', backgroundColor: '#f8fff9' }}>
          <h2 style={{ color: '#219A41', marginBottom: '25px' }}>Proforma İşlemi Seçin</h2>
          <p style={{ marginBottom: '20px', fontSize: '16px', color: '#555' }}>
            <strong>{selectedCustomer}</strong> müşterisi için hangi işlemi yapmak istersiniz?
          </p>
          <div style={{ display: 'flex', gap: '30px', marginTop: '30px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ 
                fontSize: '18px', 
                padding: '20px 40px',
                minWidth: '250px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onClick={() => {
                setSelectedOperation('new');
                setEditingProforma(null);
                setConvertingProforma(null);
                setMessage(null);
                // Müşteri bilgilerini form'a yükle
                const customerInfo = getCustomerInfo(selectedCustomer);
                setFormData(prev => ({
                  ...prev,
                  'Müşteri Adı': selectedCustomer,
                  'Tarih': format(new Date(), 'yyyy-MM-dd'),
                  'Proforma No': '',
                  'Tutar': '',
                  'Vade (gün)': '',
                  'Ülke': customerInfo['Ülke'] || '',
                  'Satış Temsilcisi': customerInfo['Satış Temsilcisi'] || '',
                  'Ödeme Şekli': customerInfo['Ödeme Şekli'] || '',
                  'Açıklama': '',
                  'Durum': 'Beklemede',
                  'PDF': '',
                }));
              }}
            >
              ➕ Yeni Kayıt
            </button>
            <button
              className="btn btn-secondary"
              style={{ 
                fontSize: '18px', 
                padding: '20px 40px',
                minWidth: '250px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onClick={() => {
                setSelectedOperation('old');
                setEditingProforma(null);
                setConvertingProforma(null);
                setMessage(null);
                loadProformasByCustomer();
              }}
            >
              📝 Eski Kayıt / Düzenle
            </button>
          </div>
        </div>
      )}

      {selectedCustomer && selectedOperation && (
        <div className="card" style={{ marginBottom: '10px', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Seçilen Müşteri:</strong> {selectedCustomer}
              {selectedOperation === 'new' && <span style={{ marginLeft: '20px', color: '#219A41' }}>→ Yeni Kayıt</span>}
              {selectedOperation === 'old' && <span style={{ marginLeft: '20px', color: '#3498db' }}>→ Eski Kayıt / Düzenle</span>}
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '5px 15px' }}
              onClick={() => {
                setSelectedOperation(null);
                setEditingProforma(null);
                setConvertingProforma(null);
                setMessage(null);
              }}
            >
              İşlem Seçimine Dön
            </button>
          </div>
        </div>
      )}

      {/* Yeni Kayıt */}
      {selectedCustomer && selectedOperation === 'new' && (
        <div className="card">
          <h3>Yeni Proforma Ekle</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Müşteri Adı</label>
              <input
                type="text"
                value={formData['Müşteri Adı']}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
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
              <label>Proforma No *</label>
              <input
                type="text"
                value={formData['Proforma No']}
                onChange={(e) => setFormData({ ...formData, 'Proforma No': e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Tutar (USD)</label>
              <input
                type="text"
                value={formData['Tutar']}
                onChange={(e) => setFormData({ ...formData, 'Tutar': e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Vade (gün) *</label>
              <input
                type="text"
                value={formData['Vade (gün)']}
                onChange={(e) => setFormData({ ...formData, 'Vade (gün)': e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Ülke</label>
              <input
                type="text"
                value={formData['Ülke']}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>

            <div className="form-group">
              <label>Satış Temsilcisi</label>
              <select
                value={formData['Satış Temsilcisi'] || ''}
                onChange={(e) => setFormData({ ...formData, 'Satış Temsilcisi': e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
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
              <label>Ödeme Şekli</label>
              <input
                type="text"
                value={formData['Ödeme Şekli']}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
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
                {PROFORMA_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Proforma PDF</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setProformaPdfFile(file);
                    setFormData({ ...formData, 'PDF': '' }); // Clear URL if file is selected
                  }
                }}
                style={{ padding: '10px' }}
              />
              {proformaPdfFile && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                  <strong>Seçilen dosya:</strong> {proformaPdfFile.name} ({(proformaPdfFile.size / 1024).toFixed(2)} KB)
                  {proformaPdfUploading && <span style={{ marginLeft: '10px', color: '#219A41' }}>Yükleniyor...</span>}
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '14px', color: '#6c757d' }}>veya</label>
                <input
                  type="text"
                  value={formData['PDF']}
                  onChange={(e) => {
                    setFormData({ ...formData, 'PDF': e.target.value });
                    if (e.target.value) setProformaPdfFile(null); // Clear file if URL is entered
                  }}
                  placeholder="PDF linkini buraya yapıştırın (opsiyonel)"
                  style={{ marginTop: '5px' }}
                />
              </div>
              <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                PDF dosyası yüklenirse "files/Proforma Klasörü/{formData['Müşteri Adı']}/" klasörüne kaydedilir
              </small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
              onClick={() => setSelectedOperation(null)}
            >
              İptal
            </button>
          </form>
        </div>
      )}

      {/* Eski Kayıt / Düzenle */}
      {selectedCustomer && selectedOperation === 'old' && (
        <div>
          {loading ? (
            <div className="loading">Yükleniyor...</div>
          ) : proformas.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <p>Bu müşteriye ait proforma kaydı yok.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <h3>Proformalar</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Proforma No</th>
                    <th>Tarih</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Vade (gün)</th>
                    <th>Sevk Durumu</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {proformas
                    .sort((a, b) => {
                      const dateA = new Date(a['Tarih'] || 0);
                      const dateB = new Date(b['Tarih'] || 0);
                      return dateB - dateA;
                    })
                    .map((proforma) => (
                      <tr key={proforma.ID || proforma.id}>
                        <td>{proforma['Proforma No']}</td>
                        <td>
                          {proforma['Tarih'] ? format(new Date(proforma['Tarih']), 'dd/MM/yyyy') : ''}
                        </td>
                        <td>{proforma['Tutar']}</td>
                        <td>{proforma['Durum']}</td>
                        <td>{proforma['Vade (gün)']}</td>
                        <td>{proforma['Sevk Durumu'] || ''}</td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                            onClick={() => handleEdit(proforma)}
                          >
                            Düzenle
                          </button>
                          {proforma['Durum'] !== 'Siparişe Dönüştü' && (
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                              onClick={() => {
                                setConvertingProforma(proforma);
                                setEditingProforma(null);
                                setOrderFormData({ 'Sipariş Formu': '' });
                              }}
                            >
                              Siparişe Dönüştür
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Düzenleme Formu */}
          {editingProforma && (
            <div className="card">
              <h3>Proforma Düzenle</h3>
              {editingProforma['PDF'] && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>Proforma PDF: </strong>
                  <a href={editingProforma['PDF']} target="_blank" rel="noopener noreferrer">
                    Görüntüle
                  </a>
                </div>
              )}
              <form onSubmit={handleSaveEdit}>
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
                  <label>Proforma No</label>
                  <input
                    type="text"
                    value={editFormData['Proforma No'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Proforma No': e.target.value })}
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
                  <label>Vade (gün)</label>
                  <input
                    type="text"
                    value={editFormData['Vade (gün)'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Vade (gün)': e.target.value })}
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
                    value={editFormData['Durum'] || 'Beklemede'}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Durum': e.target.value })}
                  >
                    {PROFORMA_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Termin Tarihi</label>
                  <input
                    type="date"
                    value={editFormData['Termin Tarihi'] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, 'Termin Tarihi': e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Proforma PDF</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditProformaPdfFile(file);
                        setEditFormData({ ...editFormData, 'PDF': '' }); // Clear URL if file is selected
                      }
                    }}
                    style={{ padding: '10px' }}
                  />
                  {editProformaPdfFile && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                      <strong>Seçilen dosya:</strong> {editProformaPdfFile.name} ({(editProformaPdfFile.size / 1024).toFixed(2)} KB)
                      {editProformaPdfUploading && <span style={{ marginLeft: '10px', color: '#219A41' }}>Yükleniyor...</span>}
                    </div>
                  )}
                  {editFormData['PDF'] && !editProformaPdfFile && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '14px', color: '#6c757d' }}>Mevcut PDF:</label>
                      <a href={editFormData['PDF']} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                        Görüntüle
                      </a>
                    </div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '14px', color: '#6c757d' }}>veya</label>
                    <input
                      type="text"
                      value={editFormData['PDF'] || ''}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, 'PDF': e.target.value });
                        if (e.target.value) setEditProformaPdfFile(null); // Clear file if URL is entered
                      }}
                      placeholder="PDF linkini buraya yapıştırın (opsiyonel)"
                      style={{ marginTop: '5px' }}
                    />
                  </div>
                  <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                    Yeni PDF yüklerseniz "files/Proforma Klasörü/{editFormData['Müşteri Adı']}/" klasörüne kaydedilir
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setEditingProforma(null);
                    setEditFormData({});
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ marginLeft: '10px' }}
                  onClick={() => handleDelete(editingProforma.ID || editingProforma.id)}
                >
                  Sil
                </button>
              </form>
            </div>
          )}

          {/* Siparişe Dönüştürme Formu */}
          {convertingProforma && (
            <div className="card">
              <h3>Siparişe Dönüştürme - Sipariş Formu Yükle</h3>
              <div className="alert alert-info">
                {convertingProforma['Müşteri Adı']} - {convertingProforma['Proforma No']} için sipariş formunu yükleyin.
              </div>
              <form onSubmit={handleConvertToOrder}>
                <div className="form-group">
                  <label>Sipariş Formu PDF *</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSiparisFormuFile(file);
                        setOrderFormData({ 'Sipariş Formu': '' }); // Clear URL if file is selected
                      }
                    }}
                    style={{ padding: '10px' }}
                  />
                  {siparisFormuFile && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                      <strong>Seçilen dosya:</strong> {siparisFormuFile.name} ({(siparisFormuFile.size / 1024).toFixed(2)} KB)
                      {siparisFormuUploading && <span style={{ marginLeft: '10px', color: '#219A41' }}>Yükleniyor...</span>}
                    </div>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '14px', color: '#6c757d' }}>veya</label>
                    <input
                      type="text"
                      value={orderFormData['Sipariş Formu']}
                      onChange={(e) => {
                        setOrderFormData({ 'Sipariş Formu': e.target.value });
                        if (e.target.value) setSiparisFormuFile(null); // Clear file if URL is entered
                      }}
                      placeholder="PDF linkini buraya yapıştırın (opsiyonel)"
                      style={{ marginTop: '5px' }}
                    />
                  </div>
                  <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                    PDF dosyası yüklenirse "files/Sipariş Formu Klasörü/{convertingProforma['Müşteri Adı']}/" klasörüne kaydedilir
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Dönüştürülüyor...' : 'Sipariş Formunu Kaydet ve Dönüştür'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setConvertingProforma(null);
                    setOrderFormData({ 'Sipariş Formu': '' });
                  }}
                >
                  Vazgeç
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProformaManagement;
