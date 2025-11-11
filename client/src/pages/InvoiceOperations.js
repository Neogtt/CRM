import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { getCustomers, getProformas, getPendingOrders, createInvoice, updateInvoiceDates, deleteInvoice, getInvoices, getRepresentatives } from '../utils/api';

function InvoiceOperations() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form states
  const [selectedPendingOrder, setSelectedPendingOrder] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProforma, setSelectedProforma] = useState('');
  const [formData, setFormData] = useState({
    'Müşteri Adı': '',
    'Proforma No': '',
    'Fatura No': '',
    'Fatura Tarihi': format(new Date(), 'yyyy-MM-dd'),
    'Tutar': '',
    'Vade (gün)': '',
    'Vade Tarihi': '',
    'Ülke': '',
    'Satış Temsilcisi': '',
    'Ödeme Şekli': '',
    'Commercial Invoice': '',
    'Sağlık Sertifikası': '',
    'Packing List': '',
    'Konşimento': '',
    'İhracat Beyannamesi': '',
    'Fatura PDF': '',
    'Sipariş Formu': '',
    'Yük Resimleri': '',
    'EK Belgeler': '',
    'Ödenen Tutar': 0,
    'Ödendi': false,
  });
  
  // File upload states
  const [fileUploads, setFileUploads] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  
  // Edit states
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editDates, setEditDates] = useState({ 'Fatura Tarihi': '', 'Vade Tarihi': '' });
  
  // Delete states
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadPendingOrders();
    loadCustomers();
    loadInvoices();
    loadRepresentatives();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadProformasByCustomer();
    } else {
      setProformas([]);
      setSelectedProforma('');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedProforma && selectedCustomer) {
      loadProformaDetails();
      loadPreviousInvoiceDocuments();
    }
  }, [selectedProforma, selectedCustomer]);

  useEffect(() => {
    if (formData['Fatura Tarihi'] && formData['Vade (gün)']) {
      const vadeGun = parseInt(formData['Vade (gün)'] || '0');
      if (vadeGun > 0) {
        const vadeTarihi = format(addDays(new Date(formData['Fatura Tarihi']), vadeGun), 'yyyy-MM-dd');
        setFormData(prev => ({
          ...prev,
          'Vade Tarihi': vadeTarihi,
        }));
      }
    }
  }, [formData['Fatura Tarihi'], formData['Vade (gün)']]);

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      const response = await getPendingOrders();
      setPendingOrders(response.data || []);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      setMessage({ type: 'error', text: 'Bekleyen siparişler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
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

  const loadProformasByCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/proformas/customer/${encodeURIComponent(selectedCustomer)}`);
      const data = await response.json();
      setProformas(data || []);
    } catch (error) {
      console.error('Error loading proformas:', error);
      setMessage({ type: 'error', text: 'Proforma listesi yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata') });
    } finally {
      setLoading(false);
    }
  };

  const loadProformaDetails = async () => {
    if (!selectedProforma || !selectedCustomer) return;
    
    try {
      // Wait for proformas to load
      if (proformas.length === 0) {
        await loadProformasByCustomer();
        return;
      }
      
      const proforma = proformas.find(p => p['Proforma No'] === selectedProforma);
      if (proforma) {
        const customer = customers.find(c => c['Müşteri Adı'] === selectedCustomer);
        
        // Calculate Vade Tarihi
        const vadeGun = parseInt(proforma['Vade (gün)'] || '0');
        const faturaTarihi = formData['Fatura Tarihi'] || format(new Date(), 'yyyy-MM-dd');
        const vadeTarihi = vadeGun > 0 ? format(addDays(new Date(faturaTarihi), vadeGun), 'yyyy-MM-dd') : '';
        
        setFormData(prev => ({
          ...prev,
          'Müşteri Adı': selectedCustomer,
          'Proforma No': selectedProforma,
          'Tutar': proforma['Tutar'] || '',
          'Vade (gün)': proforma['Vade (gün)'] || '',
          'Vade Tarihi': vadeTarihi,
          'Ülke': customer?.['Ülke'] || '',
          'Satış Temsilcisi': customer?.['Satış Temsilcisi'] || '',
          'Ödeme Şekli': customer?.['Ödeme Şekli'] || '',
          'Sipariş Formu': proforma['Sipariş Formu'] || '',
        }));
      }
    } catch (error) {
      console.error('Error loading proforma details:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await getInvoices();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handlePendingOrderSelect = async (orderId) => {
    const order = pendingOrders.find(o => (o.ID || o.id) === orderId);
    if (order) {
      const customerName = order['Müşteri Adı'];
      const proformaNo = order['Proforma No'];
      
      // Önce müşteriyi seç
      setSelectedCustomer(customerName);
      setSelectedPendingOrder('');
      
      // Proforma listesini yükle
      try {
        setLoading(true);
        const response = await fetch(`/api/proformas/customer/${encodeURIComponent(customerName)}`);
        const proformasData = await response.json();
        const loadedProformas = proformasData || [];
        setProformas(loadedProformas);
        
        // Proforma listesi yüklendikten sonra proforma'yı seç
        if (loadedProformas.length > 0) {
          // Proforma'yı bul ve seç
          const foundProforma = loadedProformas.find(p => p['Proforma No'] === proformaNo);
          if (foundProforma) {
            setSelectedProforma(proformaNo);
            
            // Müşteri bilgilerini al
            const customer = customers.find(c => c['Müşteri Adı'] === customerName);
            
            // Vade Tarihi hesapla
            const vadeGun = parseInt(foundProforma['Vade (gün)'] || '0');
            const faturaTarihi = formData['Fatura Tarihi'] || format(new Date(), 'yyyy-MM-dd');
            const vadeTarihi = vadeGun > 0 ? format(addDays(new Date(faturaTarihi), vadeGun), 'yyyy-MM-dd') : '';
            
            // Form verilerini güncelle
            setFormData(prev => ({ 
              ...prev, 
              'Müşteri Adı': customerName, 
              'Proforma No': proformaNo,
              'Tutar': foundProforma['Tutar'] || '',
              'Vade (gün)': foundProforma['Vade (gün)'] || '',
              'Vade Tarihi': vadeTarihi,
              'Ülke': customer?.['Ülke'] || '',
              'Satış Temsilcisi': customer?.['Satış Temsilcisi'] || '',
              'Ödeme Şekli': customer?.['Ödeme Şekli'] || '',
              'Sipariş Formu': foundProforma['Sipariş Formu'] || '',
            }));
            
            setMessage({ type: 'success', text: 'Sipariş bilgileri fatura formuna aktarıldı!' });
          } else {
            setMessage({ type: 'error', text: `Proforma No "${proformaNo}" bu müşteri için bulunamadı.` });
          }
        } else {
          setMessage({ type: 'error', text: 'Bu müşteriye ait proforma bulunamadı.' });
        }
      } catch (error) {
        console.error('Error loading proformas:', error);
        setMessage({ type: 'error', text: 'Proforma listesi yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata') });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFaturaDateChange = (date) => {
    setFormData(prev => {
      const vadeGun = parseInt(prev['Vade (gün)'] || '0');
      const vadeTarihi = vadeGun > 0 ? format(addDays(new Date(date), vadeGun), 'yyyy-MM-dd') : '';
      return {
        ...prev,
        'Fatura Tarihi': date,
        'Vade Tarihi': vadeTarihi,
      };
    });
  };

  const handleFileChange = (field, file) => {
    setFileUploads(prev => ({
      ...prev,
      [field]: file,
    }));
  };

  const uploadFile = async (field, file, customerName, proformaNo) => {
    if (!file) return null;
    
    try {
      setUploadingFiles(prev => ({ ...prev, [field]: true }));
      
      const uploadFormData = new FormData();
      uploadFormData.append('pdf', file);
      uploadFormData.append('fileType', 'invoice-document');
      uploadFormData.append('documentType', field);
      uploadFormData.append('customerName', customerName);
      uploadFormData.append('proformaNo', proformaNo);
      
      const response = await fetch('/api/files/upload/invoice-document', {
        method: 'POST',
        body: uploadFormData,
      });
      
      const data = await response.json();
      if (response.ok) {
        return data.fileUrl;
      } else {
        throw new Error(data.error || 'Dosya yükleme hatası');
      }
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      setMessage({ type: 'error', text: `${field} yüklenirken hata: ${error.message}` });
      return null;
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData['Müşteri Adı'] || !formData['Proforma No'] || !formData['Fatura No'] || !formData['Tutar']) {
      setMessage({ type: 'error', text: 'Müşteri, Proforma No, Fatura No ve Tutar zorunludur!' });
      return;
    }

    try {
      setLoading(true);
      
      // Upload files
      const uploadedUrls = {};
      for (const [field, file] of Object.entries(fileUploads)) {
        if (file) {
          const url = await uploadFile(field, file, formData['Müşteri Adı'], formData['Proforma No']);
          if (url) {
            uploadedUrls[field] = url;
          }
        }
      }
      
      // Merge uploaded URLs with existing form data
      const invoiceData = {
        ...formData,
        ...uploadedUrls,
      };
      
      await createInvoice(invoiceData);
      setMessage({ type: 'success', text: 'Fatura kaydı eklendi!' });
      resetForm();
      loadPendingOrders();
      loadInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: 'Hata: ' + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      'Müşteri Adı': '',
      'Proforma No': '',
      'Fatura No': '',
      'Fatura Tarihi': format(new Date(), 'yyyy-MM-dd'),
      'Tutar': '',
      'Vade (gün)': '',
      'Vade Tarihi': '',
      'Ülke': '',
      'Satış Temsilcisi': '',
      'Ödeme Şekli': '',
      'Commercial Invoice': '',
      'Sağlık Sertifikası': '',
      'Packing List': '',
      'Konşimento': '',
      'İhracat Beyannamesi': '',
      'Fatura PDF': '',
      'Sipariş Formu': '',
      'Yük Resimleri': '',
      'EK Belgeler': '',
      'Ödenen Tutar': 0,
      'Ödendi': false,
    });
    setFileUploads({});
    setSelectedCustomer('');
    setSelectedProforma('');
  };

  const handleUpdateDates = async (e) => {
    e.preventDefault();
    if (!editingInvoice || !editDates['Fatura Tarihi']) {
      setMessage({ type: 'error', text: 'Lütfen fatura tarihini giriniz' });
      return;
    }

    try {
      setLoading(true);
      const invoiceId = editingInvoice.ID || editingInvoice.id;
      await updateInvoiceDates(invoiceId, editDates);
      setMessage({ type: 'success', text: 'Fatura tarihleri güncellendi!' });
      setEditingInvoice(null);
      setEditDates({ 'Fatura Tarihi': '', 'Vade Tarihi': '' });
      loadInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: 'Hata: ' + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInvoice || !confirmDelete) {
      setMessage({ type: 'error', text: 'Lütfen silme işlemini onaylayınız' });
      return;
    }

    try {
      setLoading(true);
      const invoiceId = deletingInvoice.ID || deletingInvoice.id;
      await deleteInvoice(invoiceId);
      setMessage({ type: 'success', text: 'Fatura kaydı silindi!' });
      setDeletingInvoice(null);
      setConfirmDelete(false);
      loadInvoices();
      loadPendingOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: 'Hata: ' + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerInfo = (customerName) => {
    return customers.find(c => c['Müşteri Adı'] === customerName) || {};
  };

  const loadPreviousInvoiceDocuments = async () => {
    if (!selectedCustomer || !selectedProforma) return;
    
    try {
      const response = await getInvoices();
      const allInvoices = response.data || [];
      
      // Find previous invoice documents for the same customer and proforma
      const previousInvoices = allInvoices.filter(inv => 
        inv['Müşteri Adı'] === selectedCustomer && 
        inv['Proforma No'] === selectedProforma
      );
      
      if (previousInvoices.length > 0) {
        // Get the most recent one
        const latestInvoice = previousInvoices[previousInvoices.length - 1];
        
        // Update form data with previous document URLs (if not already uploaded)
        setFormData(prev => {
          const updated = { ...prev };
          documentTypes.forEach(doc => {
            // Only use previous URL if current field is empty and no file is being uploaded
            if (!prev[doc.key] && !fileUploads[doc.key] && latestInvoice[doc.key]) {
              updated[doc.key] = latestInvoice[doc.key];
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Error loading previous invoice documents:', error);
    }
  };

  const documentTypes = [
    { key: 'Commercial Invoice', label: 'Commercial Invoice PDF' },
    { key: 'Sağlık Sertifikası', label: 'Sağlık Sertifikası PDF' },
    { key: 'Packing List', label: 'Packing List PDF' },
    { key: 'Konşimento', label: 'Konşimento PDF' },
    { key: 'İhracat Beyannamesi', label: 'İhracat Beyannamesi PDF' },
    { key: 'Fatura PDF', label: 'Fatura PDF' },
  ];

  if (loading && pendingOrders.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Fatura İşlemleri</h1>
        </div>
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Fatura İşlemleri</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      {/* Faturası Kesilmemiş Sevkli Siparişler */}
      <div className="card">
        <h3>Faturası Kesilmemiş Sevkli Siparişler</h3>
        {pendingOrders.length === 0 ? (
          <div className="empty-state">
            <p>Sevk edilip henüz faturası kaydedilmemiş sipariş bulunmuyor.</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Müşteri Adı</th>
                  <th>Proforma No</th>
                  <th>Termin Tarihi</th>
                  <th>Tutar</th>
                  <th>Açıklama</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order) => (
                  <tr key={order.ID || order.id}>
                    <td>{order['Müşteri Adı']}</td>
                    <td>{order['Proforma No']}</td>
                    <td>
                      {order['Termin Tarihi'] ? format(new Date(order['Termin Tarihi']), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td>{order['Tutar'] || ''}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order['Açıklama'] || ''}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => handlePendingOrderSelect(order.ID || order.id)}
                      >
                        Fatura Formuna Aktar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Kayıtlı Fatura Tarihlerini Güncelle */}
      <div className="card">
        <h3>Kayıtlı Fatura Tarihlerini Güncelle</h3>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>Güncellenebilecek kayıtlı fatura bulunmuyor.</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Güncellemek istediğiniz faturayı seçin</label>
              <select
                value={editingInvoice ? (editingInvoice.ID || editingInvoice.id) : ''}
                onChange={(e) => {
                  const invoice = invoices.find(i => (i.ID || i.id) === e.target.value);
                  if (invoice) {
                    setEditingInvoice(invoice);
                    setEditDates({
                      'Fatura Tarihi': invoice['Fatura Tarihi'] ? format(new Date(invoice['Fatura Tarihi']), 'yyyy-MM-dd') : '',
                      'Vade Tarihi': invoice['Vade Tarihi'] ? format(new Date(invoice['Vade Tarihi']), 'yyyy-MM-dd') : '',
                    });
                  }
                }}
              >
                <option value="">Seçiniz</option>
                {invoices
                  .filter(inv => inv['Fatura No'])
                  .map((invoice) => (
                    <option key={invoice.ID || invoice.id} value={invoice.ID || invoice.id}>
                      {invoice['Müşteri Adı']} - Fatura: {invoice['Fatura No']} 
                      {invoice['Proforma No'] ? ` - Proforma: ${invoice['Proforma No']}` : ''}
                      {invoice['Fatura Tarihi'] ? ` - ${format(new Date(invoice['Fatura Tarihi']), 'dd/MM/yyyy')}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {editingInvoice && (
              <form onSubmit={handleUpdateDates}>
                <div className="form-group">
                  <label>Yeni Fatura Tarihi</label>
                  <input
                    type="date"
                    value={editDates['Fatura Tarihi']}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditDates(prev => {
                        // Calculate Vade Tarihi based on Vade (gün)
                        const vadeGun = parseInt(editingInvoice['Vade (gün)'] || '0');
                        const vadeTarihi = vadeGun > 0 ? format(addDays(new Date(newDate), vadeGun), 'yyyy-MM-dd') : prev['Vade Tarihi'];
                        return {
                          'Fatura Tarihi': newDate,
                          'Vade Tarihi': vadeTarihi,
                        };
                      });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Yeni Vade Tarihi</label>
                  <input
                    type="date"
                    value={editDates['Vade Tarihi']}
                    onChange={(e) => setEditDates(prev => ({ ...prev, 'Vade Tarihi': e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Tarihleri Güncelle'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setEditingInvoice(null);
                    setEditDates({ 'Fatura Tarihi': '', 'Vade Tarihi': '' });
                  }}
                >
                  İptal
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Fatura Kaydı Sil */}
      <div className="card">
        <h3>Fatura Kaydı Sil</h3>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>Silinecek fatura kaydı bulunmuyor.</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Silmek istediğiniz faturayı seçin</label>
              <select
                value={deletingInvoice ? (deletingInvoice.ID || deletingInvoice.id) : ''}
                onChange={(e) => {
                  const invoice = invoices.find(i => (i.ID || i.id) === e.target.value);
                  setDeletingInvoice(invoice || null);
                  setConfirmDelete(false);
                }}
              >
                <option value="">Seçiniz</option>
                {invoices.map((invoice) => (
                  <option key={invoice.ID || invoice.id} value={invoice.ID || invoice.id}>
                    {invoice['Müşteri Adı']} - Fatura: {invoice['Fatura No'] || 'Numara Yok'}
                    {invoice['Proforma No'] ? ` - Proforma: ${invoice['Proforma No']}` : ''}
                    {invoice['Fatura Tarihi'] ? ` - ${format(new Date(invoice['Fatura Tarihi']), 'dd/MM/yyyy')}` : ''}
                    {invoice['Tutar'] ? ` - ${invoice['Tutar']}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {deletingInvoice && (
              <>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                    />
                    {' '}Silme işlemini onaylıyorum
                  </label>
                </div>

                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={!confirmDelete || loading}
                >
                  {loading ? 'Siliniyor...' : 'Seçili Faturayı Sil'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => {
                    setDeletingInvoice(null);
                    setConfirmDelete(false);
                  }}
                >
                  İptal
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Fatura Listesi */}
      <div className="card">
        <h3>Fatura Listesi</h3>
        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>Kayıtlı fatura bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Proforma No</th>
                  <th>Müşteri Adı</th>
                  <th>Fatura Tarihi</th>
                  <th>Vade Tarihi</th>
                  <th>Tutar</th>
                  <th>Ödenen Tutar</th>
                  <th>Kalan Bakiye</th>
                  <th>Ödendi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const tutar = parseFloat(invoice['Tutar'] || 0);
                  const odenenTutar = parseFloat(invoice['Ödenen Tutar'] || 0);
                  const kalanBakiye = tutar - odenenTutar;
                  const odendi = invoice['Ödendi'] === true || invoice['Ödendi'] === 1 || invoice['Ödendi'] === 'true';
                  
                  return (
                    <tr key={invoice.ID || invoice.id}>
                      <td>{invoice['Fatura No'] || '-'}</td>
                      <td>{invoice['Proforma No'] || '-'}</td>
                      <td>{invoice['Müşteri Adı'] || '-'}</td>
                      <td>
                        {invoice['Fatura Tarihi'] 
                          ? format(new Date(invoice['Fatura Tarihi']), 'dd/MM/yyyy')
                          : '-'}
                      </td>
                      <td>
                        {invoice['Vade Tarihi'] 
                          ? format(new Date(invoice['Vade Tarihi']), 'dd/MM/yyyy')
                          : '-'}
                      </td>
                      <td>{tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{odenenTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{kalanBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{odendi ? '✓' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fatura Ekle */}
      <div className="card">
        <h3>Fatura Ekle</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Müşteri Seç</label>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProforma('');
                setFormData(prev => ({
                  ...prev,
                  'Müşteri Adı': e.target.value,
                  'Proforma No': '',
                  'Ülke': '',
                  'Satış Temsilcisi': '',
                  'Ödeme Şekli': '',
                }));
              }}
            >
              <option value="">Seçiniz</option>
              {customers
                .filter(c => c['Müşteri Adı'])
                .map((customer) => (
                  <option key={customer.ID || customer.id} value={customer['Müşteri Adı']}>
                    {customer['Müşteri Adı']}
                  </option>
                ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="form-group">
              <label>Proforma No Seç</label>
              <select
                value={selectedProforma}
                onChange={(e) => {
                  setSelectedProforma(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    'Proforma No': e.target.value,
                  }));
                }}
                disabled={loading && proformas.length === 0}
              >
                <option value="">Seçiniz</option>
                {loading && proformas.length === 0 ? (
                  <option value="" disabled>Yükleniyor...</option>
                ) : (
                  proformas
                    .filter(p => p['Proforma No'])
                    .map((proforma) => (
                      <option key={proforma.ID || proforma.id} value={proforma['Proforma No']}>
                        {proforma['Proforma No']}
                      </option>
                    ))
                )}
              </select>
              {selectedCustomer && proformas.length === 0 && !loading && (
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Bu müşteriye ait proforma bulunamadı.
                </small>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Fatura No *</label>
            <input
              type="text"
              value={formData['Fatura No']}
              onChange={(e) => setFormData({ ...formData, 'Fatura No': e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Fatura Tarihi *</label>
            <input
              type="date"
              value={formData['Fatura Tarihi']}
              onChange={(e) => handleFaturaDateChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Fatura Tutarı (USD) *</label>
            <input
              type="text"
              value={formData['Tutar']}
              onChange={(e) => setFormData({ ...formData, 'Tutar': e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Vade (gün)</label>
            <input
              type="text"
              value={formData['Vade (gün)']}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </div>

          <div className="form-group">
            <label>Vade Tarihi</label>
            <input
              type="date"
              value={formData['Vade Tarihi']}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
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

          {/* Evrak Dosyaları */}
          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Evrak Dosyaları</h4>
          {documentTypes.map((doc) => {
            const hasPreviousFile = formData[doc.key] && !fileUploads[doc.key];
            return (
              <div key={doc.key} className="form-group">
                <label>{doc.label}</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileChange(doc.key, file);
                      setFormData(prev => ({ ...prev, [doc.key]: '' }));
                    }
                  }}
                  style={{ padding: '10px' }}
                />
                {fileUploads[doc.key] && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                    <strong>Seçilen dosya:</strong> {fileUploads[doc.key].name} 
                    ({(fileUploads[doc.key].size / 1024).toFixed(2)} KB)
                    {uploadingFiles[doc.key] && <span style={{ marginLeft: '10px', color: '#219A41' }}>Yükleniyor...</span>}
                  </div>
                )}
                {hasPreviousFile && (
                  <div style={{ marginTop: '10px', padding: '5px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                    <a 
                      href={formData[doc.key]} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: '#219A41', textDecoration: 'underline' }}
                    >
                      [Daha önce yüklenmiş {doc.label}]
                    </a>
                  </div>
                )}
                {!hasPreviousFile && !fileUploads[doc.key] && selectedCustomer && selectedProforma && (
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#b00020' }}>
                    (Daha önce yüklenmemiş)
                  </div>
                )}
                <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                  PDF dosyası yüklenirse "files/Fatura Evrakları Klasörü/{formData['Müşteri Adı'] || 'Müşteri'}/" klasörüne kaydedilir
                </small>
              </div>
            );
          })}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
            onClick={resetForm}
          >
            Temizle
          </button>
        </form>
      </div>
    </div>
  );
}

export default InvoiceOperations;
