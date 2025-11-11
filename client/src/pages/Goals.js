import React, { useState, useEffect } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal, getCurrentYearProgress } from '../utils/api';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    Yıl: new Date().getFullYear(),
    'Ciro Hedefi': '',
  });
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    loadGoals();
    loadCurrentProgress();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await getGoals();
      setGoals(response.data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setMessage({ type: 'error', text: 'Hedefler yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentProgress = async () => {
    try {
      const response = await getCurrentYearProgress();
      setCurrentProgress(response.data);
    } catch (error) {
      console.error('Error loading current progress:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      if (editingGoal) {
        await updateGoal(editingGoal.ID || editingGoal.id, formData);
        setMessage({ type: 'success', text: 'Hedef güncellendi!' });
      } else {
        await createGoal(formData);
        setMessage({ type: 'success', text: 'Hedef kaydedildi!' });
      }

      setFormData({
        Yıl: new Date().getFullYear(),
        'Ciro Hedefi': '',
      });
      setEditingGoal(null);
      await loadGoals();
      await loadCurrentProgress();
    } catch (error) {
      console.error('Error saving goal:', error);
      setMessage({ type: 'error', text: 'Hedef kaydedilirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      Yıl: goal['Yıl'],
      'Ciro Hedefi': goal['Ciro Hedefi'] || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteGoal(id);
      setMessage({ type: 'success', text: 'Hedef silindi!' });
      await loadGoals();
      await loadCurrentProgress();
    } catch (error) {
      console.error('Error deleting goal:', error);
      setMessage({ type: 'error', text: 'Hedef silinirken hata oluştu: ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      Yıl: new Date().getFullYear(),
      'Ciro Hedefi': '',
    });
    setEditingGoal(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Hedefler</h1>
      </div>

      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      {/* Current Year Progress - Gerçekleşen Ciro */}
      {currentProgress && currentProgress.goal && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#e3f2fd' }}>
          <h2 style={{ color: '#185a9d', marginBottom: '15px' }}>
            {currentProgress.currentYear} Yılı Ciro Hedefi - Gerçekleşen
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Hedef Ciro</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#185a9d' }}>
                {formatCurrency(currentProgress.targetCiro)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Gerçekleşen Ciro</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#27ae60' }}>
                {formatCurrency(currentProgress.currentCiro)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Kalan</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: currentProgress.remaining > 0 ? '#f7971e' : '#27ae60' }}>
                {formatCurrency(currentProgress.remaining)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>İlerleme</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: currentProgress.progressPercentage >= 100 ? '#27ae60' : '#185a9d' }}>
                %{currentProgress.progressPercentage.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Gerçekleşen Ciro Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
              Gerçekleşen Ciro İlerlemesi
            </div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#e0e0e0', borderRadius: '15px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, currentProgress.progressPercentage)}%`,
                  height: '100%',
                  backgroundColor: currentProgress.progressPercentage >= 100 ? '#27ae60' : '#185a9d',
                  transition: 'width 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                %{currentProgress.progressPercentage.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Potansiyel Ciro - İçeride Bekleyen Siparişler Dahil */}
      {currentProgress && currentProgress.goal && currentProgress.pendingOrdersTotal > 0 && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#fff3e0' }}>
          <h2 style={{ color: '#f7971e', marginBottom: '15px' }}>
            {currentProgress.currentYear} Yılı Ciro Hedefi - Potansiyel (İçeride Bekleyen Siparişler Dahil)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Hedef Ciro</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#185a9d' }}>
                {formatCurrency(currentProgress.targetCiro)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Gerçekleşen Ciro</div>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#27ae60' }}>
                {formatCurrency(currentProgress.currentCiro)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>İçeride Bekleyen Siparişler</div>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#f7971e' }}>
                {formatCurrency(currentProgress.pendingOrdersTotal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Toplam Potansiyel Ciro</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#8e54e9' }}>
                {formatCurrency(currentProgress.totalPotentialCiro)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Kalan (Potansiyel)</div>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: currentProgress.remainingWithPending > 0 ? '#f7971e' : '#27ae60' }}>
                {formatCurrency(currentProgress.remainingWithPending)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>Potansiyel İlerleme</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: currentProgress.totalProgressPercentage >= 100 ? '#27ae60' : '#8e54e9' }}>
                %{currentProgress.totalProgressPercentage.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Potansiyel Ciro Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
              Potansiyel Ciro İlerlemesi (Gerçekleşen + İçeride Bekleyen Siparişler)
            </div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#e0e0e0', borderRadius: '15px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, currentProgress.totalProgressPercentage)}%`,
                  height: '100%',
                  backgroundColor: currentProgress.totalProgressPercentage >= 100 ? '#27ae60' : '#8e54e9',
                  transition: 'width 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                %{currentProgress.totalProgressPercentage.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Form */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>{editingGoal ? 'Hedef Düzenle' : 'Yeni Hedef Ekle'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Yıl *</label>
              <input
                type="number"
                value={formData.Yıl}
                onChange={(e) => setFormData({ ...formData, Yıl: parseInt(e.target.value) || new Date().getFullYear() })}
                min="2020"
                max="2100"
                required
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              />
            </div>
            <div>
              <label>Ciro Hedefi (USD) *</label>
              <input
                type="number"
                step="0.01"
                value={formData['Ciro Hedefi']}
                onChange={(e) => setFormData({ ...formData, 'Ciro Hedefi': e.target.value })}
                required
                placeholder="Örn: 1000000"
                style={{ width: '100%', padding: '8px', marginTop: '8px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : editingGoal ? 'Güncelle' : 'Kaydet'}
            </button>
            {editingGoal && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                İptal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Goals List */}
      <div className="card">
        <h2>Hedefler Listesi</h2>
        {loading && goals.length === 0 ? (
          <p>Yükleniyor...</p>
        ) : goals.length === 0 ? (
          <p>Henüz hedef tanımlanmamış.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Yıl</th>
                  <th>Ciro Hedefi (USD)</th>
                  <th>Oluşturma Tarihi</th>
                  <th>Güncelleme Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal, idx) => (
                  <tr key={idx}>
                    <td>{goal['Yıl']}</td>
                    <td>{formatCurrency(parseFloat(goal['Ciro Hedefi'] || 0))}</td>
                    <td>{goal['Oluşturma Tarihi'] ? new Date(goal['Oluşturma Tarihi']).toLocaleDateString('tr-TR') : '-'}</td>
                    <td>{goal['Güncelleme Tarihi'] ? new Date(goal['Güncelleme Tarihi']).toLocaleDateString('tr-TR') : '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(goal)}
                        style={{ marginRight: '5px' }}
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(goal.ID || goal.id)}
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
  );
}

export default Goals;

