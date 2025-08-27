# crm_summary.py
import streamlit as st
import pandas as pd
import numpy as np
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ======================
# GENEL AYARLAR
# ======================
st.set_page_config(page_title="CRM Özet Ekran", layout="wide")
SHEET_ID = "1A_gL11UL6JFAoZrMrg92K8bAegeCn_KzwUyU8AWzE_0"
SHEET_NAME = "Proformalar"

# ======================
# GOOGLE SHEETS SERVİS
# ======================
@st.cache_resource
def build_sheets():
    creds = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)

sheets_svc = build_sheets()

def load_sheet(sheet_id: str, sheet_name: str) -> pd.DataFrame:
    try:
        result = sheets_svc.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range=f"{sheet_name}!A:ZZ"
        ).execute()
        values = result.get("values", [])
        if not values:
            return pd.DataFrame()
        header, rows = values[0], values[1:]
        df = pd.DataFrame(rows, columns=header)
        return df
    except Exception as e:
        st.error(f"Google Sheets okuma hatası: {e}")
        return pd.DataFrame()

# ======================
# VERİ YÜKLEME
# ======================
df_proforma = load_sheet(SHEET_ID, SHEET_NAME)

if df_proforma.empty:
    st.warning("Google Sheets 'Proformalar' tablosu boş veya erişilemedi.")
    st.stop()

# Tutarları numeric yap
if "Tutar" in df_proforma.columns:
    df_proforma["Tutar"] = pd.to_numeric(df_proforma["Tutar"], errors="coerce")
else:
    df_proforma["Tutar"] = 0.0

# Tarih sütununu datetime çevir
if "Tarih" in df_proforma.columns:
    df_proforma["Tarih"] = pd.to_datetime(df_proforma["Tarih"], errors="coerce")

# ======================
# ÖZET EKRAN
# ======================
st.markdown("# 📊 CRM Özet Ekran")

# === Bekleyen Proformalar ===
st.markdown("## 📝 Bekleyen Proformalar")
if "Durum" in df_proforma.columns:
    bekleyen = df_proforma[df_proforma["Durum"] == "Beklemede"].copy()
    toplam_bekleyen = pd.to_numeric(bekleyen["Tutar"], errors="coerce").sum()
    st.markdown(f"**Toplam Bekleyen:** {toplam_bekleyen:,.2f} $")
    if not bekleyen.empty:
        bekleyen["Tarih"] = bekleyen["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            bekleyen[["Müşteri Adı", "Proforma No", "Tarih", "Tutar", "Vade (gün)", "Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Bekleyen proforma yok.")
else:
    st.warning("'Durum' sütunu bulunamadı.")

# === Vade Takibi ===
st.markdown("## 💰 Vade Takibi")
if "Vade (gün)" in df_proforma.columns and "Tarih" in df_proforma.columns:
    df_vade = df_proforma.copy()
    df_vade["Vade Tarihi"] = df_vade["Tarih"] + pd.to_timedelta(
        pd.to_numeric(df_vade["Vade (gün)"], errors="coerce").fillna(0), unit="D"
    )
    bugun = datetime.date.today()
    df_vade["Durum_Vade"] = np.where(
        (df_vade["Vade Tarihi"].notna()) & (df_vade["Vade Tarihi"].dt.date < bugun),
        "❌ Gecikmiş",
        "✅ Beklemede"
    )
    toplam_bekleyen = pd.to_numeric(df_vade[df_vade["Durum_Vade"]=="✅ Beklemede"]["Tutar"], errors="coerce").sum()
    toplam_gecikmis = pd.to_numeric(df_vade[df_vade["Durum_Vade"]=="❌ Gecikmiş"]["Tutar"], errors="coerce").sum()
    st.markdown(f"- ✅ Beklemede: {toplam_bekleyen:,.2f} $")
    st.markdown(f"- ❌ Gecikmiş: {toplam_gecikmis:,.2f} $")
    st.dataframe(
        df_vade[["Müşteri Adı","Proforma No","Tarih","Vade Tarihi","Tutar","Durum_Vade"]],
        use_container_width=True
    )
else:
    st.warning("'Vade (gün)' veya 'Tarih' sütunu bulunamadı.")

# === ETA Takibi ===
st.markdown("## 🛳️ ETA Takibi")
if "Sevk Durumu" in df_proforma.columns:
    eta_yolda = df_proforma[df_proforma["Sevk Durumu"] == "Sevkedildi"].copy()
    toplam_eta = pd.to_numeric(eta_yolda["Tutar"], errors="coerce").sum()
    st.markdown(f"**Toplam Yolda:** {toplam_eta:,.2f} $")
    if not eta_yolda.empty:
        eta_yolda["Tarih"] = eta_yolda["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            eta_yolda[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Vade (gün)","Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Yolda olan sipariş yok.")
else:
    st.warning("'Sevk Durumu' sütunu bulunamadı.")

# === Son Teslim Edilenler ===
st.markdown("## ✅ Son Teslim Edilenler")
if "Sevk Durumu" in df_proforma.columns:
    teslim = df_proforma[df_proforma["Sevk Durumu"] == "Ulaşıldı"].copy()
    if not teslim.empty:
        teslim = teslim.sort_values(by="Tarih", ascending=False).head(5)
        teslim["Tarih"] = teslim["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            teslim[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Vade (gün)","Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Teslim edilmiş sipariş yok.")
else:
    st.warning("'Sevk Durumu' sütunu bulunamadı.")
