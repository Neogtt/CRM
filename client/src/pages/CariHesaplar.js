import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import '../index.css';

function CariHesaplar() {
  const location = useLocation();
  const isNewRecord = location.pathname.includes('yeni-kayit');
  const isEditRecord = location.pathname.includes('eski-kayit-duzenleme');

  return (
    <div>
      <div className="page-header">
        <h1>Cari Hesaplar</h1>
      </div>

      {!isNewRecord && !isEditRecord && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link
              to="/cari-hesaplar/yeni-kayit"
              className="cari-hesap-btn cari-hesap-btn-new"
            >
              ➕ Yeni Kayıt
            </Link>

            <Link
              to="/cari-hesaplar/eski-kayit-duzenleme"
              className="cari-hesap-btn cari-hesap-btn-edit"
            >
              ✏️ Eski Kayıt Düzenleme
            </Link>
          </div>
        </div>
      )}

      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default CariHesaplar;

