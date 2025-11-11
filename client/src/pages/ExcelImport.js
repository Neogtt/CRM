import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanupRepresentatives } from '../utils/api';

function ExcelImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importOptions, setImportOptions] = useState({
    mergeMode: 'append', // 'append' veya 'replace'
    sheets: {
      customers: true,
      quotes: true,
      proformas: true,
      invoices: true,
      orders: true,
      eta: true,
      fairs: true,
      interactions: true,
      paymentPlans: true,
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)' });
        setFile(null);
      }
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Excel\'deki hardcoded temsilci isimlerini (EFE YILDIRIM, FERHAT ŞEKEROĞLU, HÜSEYİN POLAT, KEMAL İLKER ÇELİKKALKAN) temizlemek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const response = await cleanupRepresentatives();
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Hardcoded temsilci isimleri temizlendi. Sayfa yenileniyor...' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'info', text: response.data.message || 'Temizlenecek isim bulunamadı.' });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setMessage({ type: 'error', text: 'Hata: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Lütfen bir Excel dosyası seçin' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Changed from 'excel' to 'file' to match multer
    formData.append('mergeMode', importOptions.mergeMode);
    formData.append('sheets', JSON.stringify(importOptions.sheets));

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData,
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // JSON değilse, text olarak oku
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Sunucudan beklenmeyen yanıt alındı. Lütfen konsolu kontrol edin.');
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'Excel dosyası başarıyla içe aktarıldı! Sayfa yenileniyor...' });
        setImportResults(data);
        // Redirect to overview after successful import
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'İçe aktarma hatası' });
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: 'Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu. Lütfen backend servisinin çalıştığından emin olun.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Excel İçe Aktarma</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h3>Excel Dosyası Seç</h3>
        <div className="form-group">
          <label>Excel Dosyası (.xlsx veya .xls)</label>
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
            style={{ padding: '10px' }}
          />
          {file && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
              <strong>Seçilen dosya:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Birleştirme Modu</label>
          <select
            value={importOptions.mergeMode}
            onChange={(e) => setImportOptions({ ...importOptions, mergeMode: e.target.value })}
          >
            <option value="append">Mevcut verilere ekle (Append)</option>
            <option value="replace">Mevcut verileri değiştir (Replace)</option>
          </select>
          <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
            Append: Yeni kayıtlar mevcut kayıtlara eklenecek
            <br />
            Replace: Mevcut veriler silinip yeni veriler yüklenecek
          </small>
        </div>

        <div className="form-group">
          <label>İçe Aktarılacak Sayfalar</label>
          <small style={{ color: '#6c757d', display: 'block', marginBottom: '10px' }}>
            Excel dosyanızda "Sayfa1", "Kayıtlar", "Evraklar", "FuarMusteri" gibi sayfa isimleri varsa, bunlar otomatik olarak eşleştirilecektir.
          </small>
          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.customers}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, customers: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Müşteriler (Sayfa1)
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.quotes}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, quotes: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Teklifler
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.proformas}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, proformas: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Proformalar
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.invoices}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, invoices: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Faturalar (Evraklar)
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.orders}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, orders: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Siparişler
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.eta}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, eta: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              ETA
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.fairs}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, fairs: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Fuar Kayıtları (FuarMusteri)
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.interactions}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, interactions: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Etkileşim Günlüğü (Kayıtlar)
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={importOptions.sheets.paymentPlans}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  sheets: { ...importOptions.sheets, paymentPlans: e.target.checked }
                })}
                style={{ marginRight: '8px' }}
              />
              Tahsilat Planı
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={loading || !file}
            style={{ fontSize: '16px', padding: '12px 30px' }}
          >
            {loading ? 'İçe Aktarılıyor...' : '📥 Excel\'i İçe Aktar'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleCleanup}
            disabled={loading}
            style={{ 
              fontSize: '16px', 
              padding: '12px 30px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none'
            }}
          >
            🗑️ Hardcoded Temsilci İsimlerini Temizle
          </button>
        </div>

        {importResults && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4>İçe Aktarma Sonuçları</h4>
            <table className="table" style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Sayfa</th>
                  <th>İçe Aktarılan Kayıt</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(importResults.results || {}).map(([sheet, result]) => (
                  <tr key={sheet}>
                    <td>{sheet}</td>
                    <td>{result.count || 0}</td>
                    <td>
                      {result.success ? (
                        <span style={{ color: '#219A41' }}>✓ Başarılı</span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>✗ Hata</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>💡 Kullanım Talimatları</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Excel dosyanızın sayfa isimleri aşağıdaki gibi olabilir (otomatik eşleştirilir):
            <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
              <li><strong>Müşteriler</strong> veya <strong>Sayfa1</strong> → Müşteriler</li>
              <li><strong>Teklifler</strong> → Teklifler</li>
              <li><strong>Proformalar</strong> → Proformalar</li>
              <li><strong>Faturalar</strong> veya <strong>Evraklar</strong> → Faturalar</li>
              <li><strong>Siparişler</strong> → Siparişler</li>
              <li><strong>ETA</strong> → ETA</li>
              <li><strong>Fuar Kayıtları</strong> veya <strong>FuarMusteri</strong> → Fuar Kayıtları</li>
              <li><strong>Etkileşim Günlüğü</strong> veya <strong>Kayıtlar</strong> → Etkileşim Günlüğü</li>
              <li><strong>Tahsilat Planı</strong> → Tahsilat Planı</li>
            </ul>
          </li>
          <li>Hangi sayfaları içe aktarmak istediğinizi seçin</li>
          <li>Birleştirme modunu seçin (Append veya Replace)</li>
          <li>Excel dosyasını seçin ve "İçe Aktar" butonuna tıklayın</li>
        </ol>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffc107' }}>
          <strong>⚠️ Uyarı:</strong> Replace modunda mevcut veriler silinecek ve yeni veriler yüklenecektir. 
          Lütfen önemli verilerinizin yedeğini aldığınızdan emin olun.
        </div>
      </div>
    </div>
  );
}

export default ExcelImport;

