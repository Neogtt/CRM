import React, { useState, useEffect } from 'react';
import { 
  getHolidayGreetingEmails, 
  getHolidayTemplateNames, 
  getHolidayTemplateLanguages, 
  getCountryLanguageMap,
  getHolidayTemplate,
  sendBulkEmail
} from '../utils/api';

function HolidayGreetings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [emailsData, setEmailsData] = useState(null);
  const [templateNames, setTemplateNames] = useState([]);
  const [countryLanguageMap, setCountryLanguageMap] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateLanguages();
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate && selectedLanguage) {
      loadTemplateContent();
    }
  }, [selectedTemplate, selectedLanguage]);

  useEffect(() => {
    // When countries change, update filtered emails but preserve selections if possible
    if (emailsData && emailsData.emailCountryMap) {
      const newFilteredEmails = Object.keys(emailsData.emailCountryMap).filter(email => {
        const countries = emailsData.emailCountryMap[email];
        if (!selectedCountries.length) return true;
        return countries.some(country => selectedCountries.includes(country));
      });
      
      // Keep only selected emails that are still in filtered list
      setSelectedEmails(prevSelected => prevSelected.filter(email => newFilteredEmails.includes(email)));
    }
  }, [selectedCountries, emailsData]);

  // Helper function to get derived languages from countries
  const getDerivedLanguagesFromCountries = (countries, availableLangs) => {
    if (!countryLanguageMap || !countries.length || !availableLangs.length) return [];
    
    const languages = new Set();
    countries.forEach(country => {
      const lang = countryLanguageMap.COUNTRY_LANGUAGE_MAP[country];
      if (lang && availableLangs.includes(lang)) {
        languages.add(lang);
      }
    });
    
    return Array.from(languages);
  };

  // Helper function to get derived languages from selected countries and available languages
  const getDerivedLanguages = () => {
    if (!countryLanguageMap || !selectedCountries.length || !availableLanguages.length) return [];
    return getDerivedLanguagesFromCountries(selectedCountries, availableLanguages);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [emailsRes, templatesRes, countryLangRes] = await Promise.all([
        getHolidayGreetingEmails(),
        getHolidayTemplateNames(),
        getCountryLanguageMap(),
      ]);
      setEmailsData(emailsRes.data);
      setTemplateNames(templatesRes.data || []);
      setCountryLanguageMap(countryLangRes.data);
      
      // Set all countries as default selection
      if (emailsRes.data && emailsRes.data.allCountries) {
        setSelectedCountries(emailsRes.data.allCountries);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateLanguages = async () => {
    try {
      const response = await getHolidayTemplateLanguages(selectedTemplate);
      const languages = response.data || [];
      setAvailableLanguages(languages);
      
      // Auto-select language based on selected countries
      if (languages.length > 0 && selectedCountries.length > 0 && countryLanguageMap) {
        const derivedLanguages = getDerivedLanguagesFromCountries(selectedCountries, languages);
        if (derivedLanguages.length === 1) {
          setSelectedLanguage(derivedLanguages[0]);
        } else if (derivedLanguages.length > 0) {
          // Prefer first derived language
          setSelectedLanguage(derivedLanguages[0]);
        } else {
          setSelectedLanguage(languages[0]);
        }
      } else if (languages.length > 0) {
        setSelectedLanguage(languages[0]);
      }
    } catch (error) {
      console.error('Error loading template languages:', error);
    }
  };

  const loadTemplateContent = async () => {
    try {
      const response = await getHolidayTemplate(selectedTemplate, selectedLanguage);
      if (response.data) {
        setEmailSubject(response.data.subject || '');
        setEmailBody(response.data.body || '');
      }
    } catch (error) {
      console.error('Error loading template content:', error);
    }
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEmails.length) {
      setMessage({ type: 'error', text: 'Lütfen en az bir e-posta adresi seçiniz.' });
      return;
    }
    
    if (!emailSubject.trim()) {
      setMessage({ type: 'error', text: 'Lütfen e-posta konusu giriniz.' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Prepare attachments if image is selected
      const attachments = [];
      if (imageFile) {
        // Convert file to base64 for sending
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        
        attachments.push({
          filename: imageFile.name,
          content: base64.split(',')[1],
          encoding: 'base64',
          cid: 'holiday-image',
        });
      }
      
      // Add image to body if provided
      let body = emailBody;
      if (imageFile && previewImage) {
        body = `<img src="cid:holiday-image" alt="Holiday Greeting" style="max-width: 100%; height: auto;" /><br><br>${body}`;
      }
      
      const response = await sendBulkEmail({
        recipients: selectedEmails,
        subject: emailSubject,
        body: body,
        attachments: attachments,
        isHTML: true,
      });
      
      const successCount = response.data.filter(r => r.success).length;
      const failCount = response.data.length - successCount;
      
      if (failCount === 0) {
        setMessage({ type: 'success', text: `${successCount} e-posta başarıyla gönderildi.` });
      } else {
        setMessage({ type: 'warning', text: `${successCount} e-posta gönderildi, ${failCount} e-posta gönderilemedi.` });
      }
      
      // Reset form
      setImageFile(null);
      setPreviewImage(null);
    } catch (error) {
      console.error('Error sending emails:', error);
      setMessage({ type: 'error', text: 'E-postalar gönderilirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emailsData ? Object.keys(emailsData.emailCountryMap || {}).filter(email => {
    const countries = emailsData.emailCountryMap[email];
    if (!selectedCountries.length) return true;
    return countries.some(country => selectedCountries.includes(country));
  }) : [];

  const handleSelectAllEmails = () => {
    if (!filteredEmails.length) return;
    
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails([...filteredEmails]);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Özel Gün Tebrikleri</h1>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <p>Seçilmiş kişilere bayram ve yeni yıl tebrik e-postaları gönderebilirsiniz.</p>
      </div>

      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      {loading && !emailsData && (
        <div className="card">
          <p>Yükleniyor...</p>
        </div>
      )}

      {emailsData && (
        <>
          {/* Email Statistics */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>E-posta İstatistikleri</h3>
            <p>Toplam benzersiz e-posta: <strong>{emailsData.totalEmails || 0}</strong></p>
            <p>Seçilen e-posta sayısı: <strong>{filteredEmails.length}</strong></p>
          </div>

          {/* Country Filter */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>Ülke Filtresi</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
              Sadece seçilen ülkelerle ilişkili e-posta adresleri listelenir.
            </p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
              {emailsData.allCountries && emailsData.allCountries.length > 0 ? (
                <>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={selectedCountries.length === emailsData.allCountries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCountries(emailsData.allCountries);
                        } else {
                          setSelectedCountries([]);
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <strong>Tümünü Seç / Tümünü Kaldır</strong>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {emailsData.allCountries.map(country => (
                      <label key={country} style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCountries([...selectedCountries, country]);
                            } else {
                              setSelectedCountries(selectedCountries.filter(c => c !== country));
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {country}
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p>Ülke bilgisi bulunamadı.</p>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>Şablon Seçimi</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Şablon</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setSelectedLanguage('');
                    setEmailSubject('');
                    setEmailBody('');
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                >
                  <option value="">(Şablon seçiniz)</option>
                  {templateNames.map(template => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && availableLanguages.length > 0 && (
                <div>
                  <label>Dil</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {countryLanguageMap?.LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {getDerivedLanguages().length > 0 && (
                    <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                      Seçilen ülkelere göre dil otomatik olarak {countryLanguageMap?.LANGUAGE_LABELS[getDerivedLanguages()[0]] || getDerivedLanguages()[0]} olarak belirlendi.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>E-posta İçeriği</h3>
            <div style={{ marginBottom: '20px' }}>
              <label>E-posta Konusu</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="E-posta konusu"
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>HTML Gövde</label>
              <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
                İsterseniz metni Türkçe/İngilizce olarak düzenleyebilirsiniz.
              </p>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="E-posta gövdesi (HTML)"
                rows={10}
                style={{ width: '100%', padding: '8px', marginTop: '8px', fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Görsel Ekle (isteğe bağlı)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              />
              {previewImage && (
                <div style={{ marginTop: '10px' }}>
                  <img src={previewImage} alt="Preview" style={{ maxWidth: '300px', height: 'auto', border: '1px solid #ddd', borderRadius: '5px' }} />
                </div>
              )}
            </div>
          </div>

          {/* Email Preview */}
          {filteredEmails.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>E-posta Adresleri Önizleme</h3>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSelectAllEmails}
                    style={{ marginRight: '10px' }}
                  >
                    {selectedEmails.length === filteredEmails.length && filteredEmails.length > 0 ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                  </button>
                  <span style={{ fontSize: '0.9em', color: '#666' }}>
                    Seçilen adres sayısı: <strong>{selectedEmails.length}</strong> / {filteredEmails.length}
                  </span>
                </div>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                <table className="data-table" style={{ fontSize: '0.9em' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                          onChange={handleSelectAllEmails}
                        />
                      </th>
                      <th>E-posta</th>
                      <th>Ülkeler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map(email => (
                      <tr key={email}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(email)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmails([...selectedEmails, email]);
                              } else {
                                setSelectedEmails(selectedEmails.filter(e => e !== email));
                              }
                            }}
                          />
                        </td>
                        <td>{email}</td>
                        <td>{emailsData.emailCountryMap[email] ? emailsData.emailCountryMap[email].join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  <strong>Aktif ülke filtresi:</strong> {selectedCountries.length > 0 ? selectedCountries.join(', ') : 'Tüm ülkeler'}<br />
                  <strong>Seçilen adres sayısı:</strong> {selectedEmails.length}<br />
                  <strong>Not:</strong> Gönderimlerde varsayılan HTML imzası otomatik olarak eklenecektir.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSendEmail}
                disabled={loading || !selectedEmails.length || !emailSubject.trim()}
              >
                {loading ? 'Gönderiliyor...' : 'Toplu Maili Gönder'}
              </button>
            </div>
          </div>
        </>
      )}

      {emailsData && (!emailsData.allEmails || emailsData.allEmails.length === 0) && (
        <div className="card">
          <p>Gönderim yapabileceğiniz e-posta adresi bulunamadı.</p>
        </div>
      )}
    </div>
  );
}

export default HolidayGreetings;
