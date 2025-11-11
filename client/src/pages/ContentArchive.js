import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function ContentArchive() {
  const [activeTab, setActiveTab] = useState('kalite');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const tabs = [
    { id: 'kalite', name: 'Kalite' },
    { id: 'ürün-resimleri', name: 'Ürün Resimleri' },
    { id: 'medya', name: 'Medya' },
  ];
  
  useEffect(() => {
    loadFiles();
  }, [activeTab]);
  
  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content-archive/files/${activeTab}`);
      setFiles(response.data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage({ type: 'error', text: 'Dosyalar yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderType', activeTab);
      
      const response = await api.post('/content-archive/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage({ type: 'success', text: 'Dosya başarıyla yüklendi!' });
      await loadFiles();
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Dosya yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`"${filename}" dosyasını silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/content-archive/files/${activeTab}/${encodeURIComponent(filename)}`);
      setMessage({ type: 'success', text: 'Dosya başarıyla silindi!' });
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage({ type: 'error', text: 'Dosya silinirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewFile = (filename) => {
    const fileUrl = `/api/content-archive/files/${activeTab}/${encodeURIComponent(filename)}`;
    window.open(fileUrl, '_blank');
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const getFileIcon = (fileType) => {
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileType)) {
      return '🖼️';
    } else if (['.pdf'].includes(fileType)) {
      return '📄';
    } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(fileType)) {
      return '🎬';
    } else if (['.mp3', '.wav', '.ogg'].includes(fileType)) {
      return '🎵';
    } else if (['.doc', '.docx'].includes(fileType)) {
      return '📝';
    } else if (['.xls', '.xlsx'].includes(fileType)) {
      return '📊';
    } else {
      return '📎';
    }
  };
  
  const isImage = (fileType) => {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(fileType);
  };
  
  return (
    <div>
      <div className="page-header">
        <h1>İçerik Arşivi</h1>
      </div>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '20px' }}>
          Medya, ürün görselleri ve kalite evraklarına aşağıdaki sekmelerden ulaşabilirsiniz.
        </p>
        
        {/* Tabs */}
        <div style={{ borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #219A41' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  color: activeTab === tab.id ? '#219A41' : '#666',
                  transition: 'all 0.3s',
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* File Upload */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Dosya Yükle:
          </label>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ padding: '8px' }}
          />
          {uploading && <p style={{ marginTop: '10px', color: '#666' }}>Yükleniyor...</p>}
        </div>
        
        {/* Files List */}
        {loading ? (
          <p>Yükleniyor...</p>
        ) : files.length === 0 ? (
          <p>Bu klasörde dosya bulunmuyor.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {files.map((file, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleViewFile(file.name)}
              >
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '10px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isImage(file.type) ? (
                    <img
                      src={`/api/content-archive/files/${activeTab}/${encodeURIComponent(file.name)}`}
                      alt={file.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '150px',
                        objectFit: 'contain',
                        borderRadius: '5px',
                      }}
                      onError={(e) => {
                        e.target.parentElement.innerHTML = getFileIcon(file.type);
                      }}
                    />
                  ) : (
                    <span>{getFileIcon(file.type)}</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    title: file.name,
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  {formatFileSize(file.size)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  {format(new Date(file.modified), 'dd/MM/yyyy HH:mm')}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewFile(file.name);
                    }}
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1 }}
                  >
                    Görüntüle
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.name);
                    }}
                    className="btn btn-sm btn-danger"
                    style={{ flex: 1 }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* File Preview Modal */}
      {selectedFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedFile(null)}
        >
          <div
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <img
              src={`/api/content-archive/files/${activeTab}/${encodeURIComponent(selectedFile)}`}
              alt={selectedFile}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentArchive;
