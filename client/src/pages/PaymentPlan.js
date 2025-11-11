import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { getInvoices, updateInvoice } from '../utils/api';
import { smartToNum } from '../utils/helpers';

function PaymentPlan() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Filters
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('Ödenmemiş (varsayılan)');
  
  // Update form
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [partialPayment, setPartialPayment] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, selectedCountries, selectedSalesReps, paymentStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices();
      const allInvoices = response.data || [];
      
      console.log('Total invoices loaded:', allInvoices.length);
      console.log('Sample invoice:', allInvoices[0]);
      
      // Filter invoices with Vade Tarihi
      const invoicesWithDueDate = allInvoices.filter(inv => {
        const hasVadeTarihi = inv['Vade Tarihi'] && inv['Vade Tarihi'].toString().trim() !== '';
        if (!hasVadeTarihi) {
          console.log('Invoice without Vade Tarihi:', inv['Fatura No'], inv['Müşteri Adı']);
        }
        return hasVadeTarihi;
      });
      
      console.log('Invoices with Vade Tarihi:', invoicesWithDueDate.length);
      
      // Calculate Kalan Bakiye and Kalan Gün for each invoice
      let debugCount = 0;
      const processedInvoices = invoicesWithDueDate.map(inv => {
        const tutarNum = smartToNum(inv['Tutar'] || inv['Tutar_num'] || 0);
        const odenenTutar = smartToNum(inv['Ödenen Tutar'] || 0);
        const kalanBakiye = Math.max(tutarNum - odenenTutar, 0);
        
        // Ödendi kolonunu kontrol et (True/False veya string olabilir)
        // Excel'de Doğru/Yanlış, True/False, true/false olarak gelebilir
        const odendiValue = inv['Ödendi'];
        let odendi = false;
        
        if (odendiValue === true || odendiValue === 'true' || odendiValue === 'True') {
          odendi = true;
        } else if (odendiValue === false || odendiValue === 'false' || odendiValue === 'False') {
          odendi = false;
        } else if (typeof odendiValue === 'string') {
          const upperValue = odendiValue.toUpperCase().trim();
          odendi = upperValue === 'DOĞRU' || upperValue === 'TRUE' || upperValue === '1';
        } else if (odendiValue === 1) {
          odendi = true;
        } else if (odendiValue === 0) {
          odendi = false;
        }
        
        // Debug log for first 3 invoices
        if (debugCount < 3) {
          console.log('Ödendi check:', {
            'Fatura No': inv['Fatura No'],
            'Ödendi value': odendiValue,
            'Ödendi type': typeof odendiValue,
            'Ödendi result': odendi
          });
          debugCount++;
        }
        
        const vadeTarihi = new Date(inv['Vade Tarihi']);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        vadeTarihi.setHours(0, 0, 0, 0);
        const kalanGun = differenceInDays(vadeTarihi, today);
        
        return {
          ...inv,
          Tutar_num: tutarNum,
          Ödenen_Tutar: odenenTutar,
          Kalan_Bakiye: kalanBakiye,
          Kalan_Gün: kalanGun,
          Ödendi_Boolean: odendi, // Normalized boolean value
        };
      });
      
      console.log('Processed invoices:', processedInvoices.length);
      const odendiFalseCount = processedInvoices.filter(inv => !inv.Ödendi_Boolean).length;
      console.log('Ödendi=false olanlar:', odendiFalseCount);
      console.log('Ödendi=true olanlar:', processedInvoices.length - odendiFalseCount);
      if (processedInvoices.length > 0) {
        console.log('Sample processed invoice:', {
          'Fatura No': processedInvoices[0]['Fatura No'],
          'Ödendi_Boolean': processedInvoices[0].Ödendi_Boolean,
          'Kalan_Bakiye': processedInvoices[0].Kalan_Bakiye,
          'Kalan_Gün': processedInvoices[0].Kalan_Gün
        });
      }
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setMessage({ type: 'error', text: 'Faturalar yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];
    
    console.log('Applying filters. Total invoices:', filtered.length);
    console.log('Payment status filter:', paymentStatus);
    
    // Country filter
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(inv => 
        selectedCountries.includes(inv['Ülke'])
      );
      console.log('After country filter:', filtered.length);
    }
    
    // Sales rep filter
    if (selectedSalesReps.length > 0) {
      filtered = filtered.filter(inv => 
        selectedSalesReps.includes(inv['Satış Temsilcisi'])
      );
      console.log('After sales rep filter:', filtered.length);
    }
    
    // Payment status filter - Ödendi kolonuna göre filtreleme
    // Ödendi = False (Yanlış) olanlar Tahsilat Planında gösterilir
    // Ödendi = True (Doğru) olanlar ödemiş olanlar, Tahsilat Planında gösterilmez
    const beforePaymentFilter = filtered.length;
    if (paymentStatus === 'Ödenmemiş (varsayılan)') {
      // Ödendi === false olanları göster (Yanlış olanlar)
      filtered = filtered.filter(inv => {
        const result = !inv.Ödendi_Boolean;
        if (!result) {
          console.log('Filtered out (Ödendi=true):', inv['Fatura No'], inv['Müşteri Adı'], 'Ödendi:', inv.Ödendi_Boolean, 'Original:', inv['Ödendi']);
        }
        return result;
      });
      console.log('After payment status filter (Ödenmemiş):', filtered.length, 'from', beforePaymentFilter);
    } else if (paymentStatus === 'Sadece Ödenmiş') {
      // Ödendi === true olanları göster (Doğru olanlar)
      filtered = filtered.filter(inv => inv.Ödendi_Boolean);
      console.log('After payment status filter (Ödenmiş):', filtered.length, 'from', beforePaymentFilter);
    }
    // "Hepsi" için filtreleme yok - tüm faturalar gösterilir
    
    // Sort by Kalan Gün (primary) and then Vade Tarihi (secondary)
    // Python kodunda: sort_values(["Kalan Gün","Vade Tarihi"])
    filtered.sort((a, b) => {
      // Önce Kalan Gün'e göre sırala (artan - negatif değerler önce, yani gecikmişler)
      if (a.Kalan_Gün !== b.Kalan_Gün) {
        return a.Kalan_Gün - b.Kalan_Gün;
      }
      // Kalan Gün aynıysa Vade Tarihi'ne göre sırala (artan)
      const dateA = new Date(a['Vade Tarihi']);
      const dateB = new Date(b['Vade Tarihi']);
      return dateA - dateB;
    });
    
    setFilteredInvoices(filtered);
  };

  const getSummaryMetrics = () => {
    const acik = filteredInvoices.filter(inv => inv.Kalan_Bakiye > 0.01);
    const vadesiGelmemis = acik.filter(inv => inv.Kalan_Gün > 0);
    const bugun = acik.filter(inv => inv.Kalan_Gün === 0);
    const gecikmis = acik.filter(inv => inv.Kalan_Gün < 0);
    
    return {
      vadesiGelmemis: {
        amount: vadesiGelmemis.reduce((sum, inv) => sum + inv.Kalan_Bakiye, 0),
        count: vadesiGelmemis.length,
      },
      bugun: {
        amount: bugun.reduce((sum, inv) => sum + inv.Kalan_Bakiye, 0),
        count: bugun.length,
      },
      gecikmis: {
        amount: gecikmis.reduce((sum, inv) => sum + inv.Kalan_Bakiye, 0),
        count: gecikmis.length,
      },
    };
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      setMessage({ type: 'error', text: 'Lütfen bir fatura seçiniz' });
      return;
    }

    try {
      setUpdating(true);
      
      const invoiceId = selectedInvoice.ID || selectedInvoice.id;
      const toplamTutar = selectedInvoice.Tutar_num;
      const mevcutOdenen = selectedInvoice.Ödenen_Tutar;
      const yeniOdenen = Math.max(Math.min(mevcutOdenen + partialPayment, toplamTutar), 0);
      
      let finalOdenen = yeniOdenen;
      let finalOdendi = isPaid;
      
      if (toplamTutar <= 0) {
        finalOdenen = 0;
      } else if (isPaid || finalOdenen >= Math.max(toplamTutar - 0.01, 0)) {
        finalOdenen = toplamTutar;
        finalOdendi = true;
      } else {
        finalOdendi = finalOdenen >= Math.max(toplamTutar - 0.01, 0);
      }
      
      await updateInvoice(invoiceId, {
        'Ödenen Tutar': Math.round(finalOdenen * 100) / 100,
        'Ödendi': finalOdendi,
      });
      
      setMessage({ type: 'success', text: 'Tahsilat bilgisi güncellendi!' });
      setSelectedInvoice(null);
      setPartialPayment(0);
      setIsPaid(false);
      loadInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage({ type: 'error', text: 'Hata: ' + errorMsg });
    } finally {
      setUpdating(false);
    }
  };

  const getUniqueValues = (field) => {
    return [...new Set(invoices.map(inv => inv[field]).filter(v => v && v.toString().trim() !== ''))].sort();
  };

  const summary = getSummaryMetrics();

  if (loading && invoices.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Tahsilat Planı</h1>
        </div>
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tahsilat Planı</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>Vade tarihi girilmiş kayıt bulunmuyor.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#219A41' }}>Vadeleri Gelmeyen</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {summary.vadesiGelmemis.amount.toFixed(2)} USD
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {summary.vadesiGelmemis.count} Fatura
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Bugün Vadesi</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {summary.bugun.amount.toFixed(2)} USD
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {summary.bugun.count} Fatura
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Gecikmiş Ödemeler</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {summary.gecikmis.amount.toFixed(2)} USD
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {summary.gecikmis.count} Fatura
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <h3>Filtreler</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div className="form-group">
                <label>Ülke</label>
                <select
                  multiple
                  value={selectedCountries}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedCountries(values);
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {getUniqueValues('Ülke').map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <small>Çoklu seçim için Ctrl/Cmd tuşuna basılı tutun</small>
              </div>

              <div className="form-group">
                <label>Satış Temsilcisi</label>
                <select
                  multiple
                  value={selectedSalesReps}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedSalesReps(values);
                  }}
                  style={{ minHeight: '100px' }}
                >
                  {getUniqueValues('Satış Temsilcisi').map(rep => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>
                <small>Çoklu seçim için Ctrl/Cmd tuşuna basılı tutun</small>
              </div>

              <div className="form-group">
                <label>Ödeme Durumu</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Ödenmemiş (varsayılan)">Ödenmemiş (varsayılan)</option>
                  <option value="Hepsi">Hepsi</option>
                  <option value="Sadece Ödenmiş">Sadece Ödenmiş</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="card">
            <h3>Fatura Listesi</h3>
            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <p>Filtrelere uygun fatura bulunmuyor.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Müşteri Adı</th>
                      <th>Ülke</th>
                      <th>Satış Temsilcisi</th>
                      <th>Fatura No</th>
                      <th>Fatura Tarihi</th>
                      <th>Vade Tarihi</th>
                      <th>Kalan Gün</th>
                      <th>Tutar</th>
                      <th>Ödenen Tutar</th>
                      <th>Kalan Bakiye</th>
                      <th>Ödendi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice, index) => {
                      const kalanGun = invoice.Kalan_Gün;
                      let rowStyle = {};
                      if (kalanGun < 0) {
                        rowStyle.backgroundColor = '#f8d7da';
                      } else if (kalanGun === 0) {
                        rowStyle.backgroundColor = '#fff3cd';
                      } else if (kalanGun <= 7) {
                        rowStyle.backgroundColor = '#fff9e6';
                      }
                      
                      return (
                        <tr key={invoice.ID || invoice.id || index} style={rowStyle}>
                          <td>{invoice['Müşteri Adı'] || ''}</td>
                          <td>{invoice['Ülke'] || ''}</td>
                          <td>{invoice['Satış Temsilcisi'] || ''}</td>
                          <td>{invoice['Fatura No'] || ''}</td>
                          <td>
                            {invoice['Fatura Tarihi'] 
                              ? format(new Date(invoice['Fatura Tarihi']), 'dd/MM/yyyy')
                              : ''}
                          </td>
                          <td>
                            {invoice['Vade Tarihi'] 
                              ? format(new Date(invoice['Vade Tarihi']), 'dd/MM/yyyy')
                              : ''}
                          </td>
                          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                            {kalanGun}
                          </td>
                          <td>{invoice.Tutar_num.toFixed(2)} USD</td>
                          <td>{invoice.Ödenen_Tutar.toFixed(2)} USD</td>
                          <td style={{ fontWeight: 'bold' }}>
                            {invoice.Kalan_Bakiye.toFixed(2)} USD
                          </td>
                          <td>{invoice.Ödendi_Boolean ? '✓ Doğru' : '✗ Yanlış'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Update Form */}
          <div className="card">
            <h3>Ödeme Durumu Güncelle</h3>
            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <p>Güncellenecek fatura bulunmuyor.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Kayıt Seç</label>
                  <select
                    value={selectedInvoice ? (selectedInvoice.ID || selectedInvoice.id) : ''}
                    onChange={(e) => {
                      const invoice = filteredInvoices.find(inv => 
                        (inv.ID || inv.id) === e.target.value
                      );
                      if (invoice) {
                        setSelectedInvoice(invoice);
                        setPartialPayment(0);
                        setIsPaid(invoice['Ödendi'] || false);
                      }
                    }}
                  >
                    <option value="">Seçiniz</option>
                    {filteredInvoices.map((invoice) => (
                      <option key={invoice.ID || invoice.id} value={invoice.ID || invoice.id}>
                        {invoice['Müşteri Adı']} | {invoice['Fatura No']}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInvoice && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px', marginBottom: '20px' }}>
                      <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Fatura Tutarı</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {selectedInvoice.Tutar_num.toFixed(2)} USD
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Ödenen Tutar</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {selectedInvoice.Ödenen_Tutar.toFixed(2)} USD
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Kalan Bakiye</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {selectedInvoice.Kalan_Bakiye.toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePayment}>
                      <div className="form-group">
                        <label>
                          Ara ödeme tutarı (USD)
                          <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                            Min: {(-selectedInvoice.Ödenen_Tutar).toFixed(2)} USD, 
                            Max: {selectedInvoice.Kalan_Bakiye.toFixed(2)} USD
                          </small>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={-selectedInvoice.Ödenen_Tutar}
                          max={selectedInvoice.Kalan_Bakiye}
                          value={partialPayment}
                          onChange={(e) => setPartialPayment(parseFloat(e.target.value) || 0)}
                          required
                        />
                        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                          Not: Gerekirse eksi tutar girerek önceki tahsilatı azaltabilirsiniz.
                        </small>
                      </div>

                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                          />
                          {' '}Ödendi olarak işaretle
                        </label>
                      </div>

                      <button type="submit" className="btn btn-primary" disabled={updating}>
                        {updating ? 'Güncelleniyor...' : 'Kaydet / Güncelle'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          setSelectedInvoice(null);
                          setPartialPayment(0);
                          setIsPaid(false);
                        }}
                      >
                        İptal
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentPlan;
