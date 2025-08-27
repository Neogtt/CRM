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
        st.error(f"{sheet_name} okuma hatası: {e}")
        return pd.DataFrame()

# ======================
# VERİLERİ ÇEK
# ======================
df_proforma = load_sheet(SHEET_ID, "Proformalar")
df_evrak = load_sheet(SHEET_ID, "Evraklar")

if df_proforma.empty:
    st.warning("Google Sheets 'Proformalar' tablosu boş.")
    st.stop()

if df_evrak.empty:
    st.warning("Google Sheets 'Evraklar' tablosu boş.")
    st.stop()

# Tip dönüşümleri
df_proforma["Tutar"] = pd.to_numeric(df_proforma.get("Tutar", pd.Series()), errors="coerce").fillna(0)
df_proforma["Tarih"] = pd.to_datetime(df_proforma.get("Tarih", pd.Series()), errors="coerce")

df_evrak["Vade Tarihi"] = pd.to_datetime(df_evrak.get("Vade Tarihi", df_evrak.iloc[:,3]), errors="coerce")  
# D sütununda olduğu için: df_evrak.iloc[:,3]

# Merge (Müşteri Adı + Proforma No üzerinden)
df_merge = pd.merge(
    df_proforma,
    df_evrak[["Müşteri Adı","Proforma No","Vade Tarihi"]],
    on=["Müşteri Adı","Proforma No"],
    how="left"
)

# ======================
# ÖZET EKRAN
# ======================
st.markdown("# 📊 CRM Özet Ekran")

# === Bekleyen Proformalar ===
st.markdown("## 📝 Bekleyen Proformalar")
if "Durum" in df_merge.columns:
    bekleyen = df_merge[df_merge["Durum"] == "Beklemede"].copy()
    toplam_bekleyen = bekleyen["Tutar"].sum()
    st.markdown(f"**Toplam Bekleyen:** {toplam_bekleyen:,.2f} $")
    if not bekleyen.empty:
        bekleyen["Tarih"] = bekleyen["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            bekleyen[["Müşteri Adı", "Proforma No", "Tarih", "Tutar", "Vade Tarihi", "Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Bekleyen proforma yok.")
else:
    st.warning("'Durum' sütunu yok.")

# === Vade Takibi (Evraklar’dan) ===
st.markdown("## 💰 Vade Takibi")
if "Vade Tarihi" in df_merge.columns:
    bugun = datetime.date.today()
    df_merge["Durum_Vade"] = np.where(
        (df_merge["Vade Tarihi"].notna()) & (df_merge["Vade Tarihi"].dt.date < bugun),
        "❌ Gecikmiş",
        "✅ Beklemede"
    )
    toplam_bekleyen = df_merge[df_merge["Durum_Vade"]=="✅ Beklemede"]["Tutar"].sum()
    toplam_gecikmis = df_merge[df_merge["Durum_Vade"]=="❌ Gecikmiş"]["Tutar"].sum()
    st.markdown(f"- ✅ Beklemede: {toplam_bekleyen:,.2f} $")
    st.markdown(f"- ❌ Gecikmiş: {toplam_gecikmis:,.2f} $")
    st.dataframe(
        df_merge[["Müşteri Adı","Proforma No","Tarih","Vade Tarihi","Tutar","Durum_Vade"]],
        use_container_width=True
    )
else:
    st.warning("'Vade Tarihi' sütunu bulunamadı.")

# === ETA Takibi ===
st.markdown("## 🛳️ ETA Takibi")
if "Sevk Durumu" in df_merge.columns:
    eta_yolda = df_merge[df_merge["Sevk Durumu"] == "Sevkedildi"].copy()
    toplam_eta = eta_yolda["Tutar"].sum()
    st.markdown(f"**Toplam Yolda:** {toplam_eta:,.2f} $")
    if not eta_yolda.empty:
        eta_yolda["Tarih"] = eta_yolda["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            eta_yolda[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Vade Tarihi","Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Yolda olan sipariş yok.")
else:
    st.warning("'Sevk Durumu' sütunu bulunamadı.")

# === Son Teslim Edilenler ===
st.markdown("## ✅ Son Teslim Edilenler")
if "Sevk Durumu" in df_merge.columns:
    teslim = df_merge[df_merge["Sevk Durumu"] == "Ulaşıldı"].copy()
    if not teslim.empty:
        teslim = teslim.sort_values(by="Tarih", ascending=False).head(5)
        teslim["Tarih"] = teslim["Tarih"].dt.strftime("%d/%m/%Y")
        st.dataframe(
            teslim[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Vade Tarihi","Açıklama"]],
            use_container_width=True
        )
    else:
        st.info("Teslim edilmiş sipariş yok.")
else:
    st.warning("'Sevk Durumu' sütunu bulunamadı.")
