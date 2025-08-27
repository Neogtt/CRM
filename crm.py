# crm_summary.py
import streamlit as st
import pandas as pd
import numpy as np
import datetime

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ===========================
# ==== GENEL AYARLAR
# ===========================
st.set_page_config(page_title="ŞEKEROĞLU İHRACAT - Özet Ekran", layout="wide")

SHEET_ID = "1IF6CN4oHEMk6IEE40ZGixPkfnNHLYXnQ"   # Senin Sheet ID
PROFORMA_SHEET = "Proformalar"
EVRAK_SHEET    = "Evraklar"

# ===========================
# ==== TEK KULLANICI GİRİŞİ
# ===========================
USERS = {"Boss": "Seker12345!"}
if "user" not in st.session_state: st.session_state.user = None

def login_screen():
    st.title("ŞEKEROĞLU CRM - Özet")
    u = st.text_input("Kullanıcı Adı")
    p = st.text_input("Şifre", type="password")
    if st.button("Giriş Yap"):
        if u in USERS and p == USERS[u]:
            st.session_state.user = u
            st.success("Giriş başarılı!")
            st.rerun()
        else:
            st.error("Kullanıcı adı veya şifre hatalı.")

if not st.session_state.user:
    login_screen()
    st.stop()

if st.sidebar.button("Çıkış Yap"):
    st.session_state.user = None
    st.rerun()

# ===========================
# ==== GOOGLE SHEETS BAĞLANTI
# ===========================
@st.cache_resource
def build_sheets():
    creds = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)

sheets_svc = build_sheets()

def read_sheet(sheet_name):
    try:
        result = sheets_svc.spreadsheets().values().get(
            spreadsheetId=SHEET_ID,
            range=f"{sheet_name}!A:ZZ"
        ).execute()
        values = result.get("values", [])
        if not values: return pd.DataFrame()
        header, rows = values[0], values[1:]
        return pd.DataFrame(rows, columns=header)
    except Exception as e:
        st.error(f"{sheet_name} okunamadı: {e}")
        return pd.DataFrame()

# ===========================
# ==== VERİLERİ ÇEK
# ===========================
df_proforma = read_sheet(PROFORMA_SHEET)
df_evrak    = read_sheet(EVRAK_SHEET)

# Sayısal alanları temizle
for col in ["Tutar", "Vade (gün)"]:
    if col in df_proforma.columns:
        df_proforma[col] = pd.to_numeric(df_proforma[col], errors="coerce")

if "Tutar" in df_evrak.columns:
    df_evrak["Tutar"] = pd.to_numeric(df_evrak["Tutar"], errors="coerce")

# ===========================
# ==== ÖZET GÖSTERİM
# ===========================
st.header("📊 ŞEKEROĞLU İHRACAT - Özet Ekran")

# === ETA Takibi ===
st.markdown("#### 🛳️ ETA Takibi")
eta_yolda = df_proforma[df_proforma.get("Sevk Durumu", "") == "Sevkedildi"].copy()
toplam_eta = pd.to_numeric(eta_yolda.get("Tutar", []), errors="coerce").sum()
st.markdown(f"<div style='font-size:1.1em;color:#c471f5;font-weight:bold;'>Toplam: {toplam_eta:,.2f} $</div>", unsafe_allow_html=True)

if eta_yolda.empty:
    st.info("Yolda olan (sevk edilmiş) sipariş yok.")
else:
    eta_yolda["Tarih"] = pd.to_datetime(eta_yolda["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y").fillna("")
    st.dataframe(eta_yolda[["Müşteri Adı", "Ülke", "Proforma No", "Tarih", "Tutar", "Vade (gün)", "Açıklama"]], use_container_width=True)

# === Son Teslim Edilenler ===
st.markdown("#### ✅ Son Teslim Edilenler")
if "Sevk Durumu" in df_proforma.columns:
    teslim = df_proforma[df_proforma["Sevk Durumu"] == "Ulaşıldı"].copy()
    if not teslim.empty:
        teslim = teslim.sort_values(by="Tarih", ascending=False).head(5)
        teslim["Tarih"] = pd.to_datetime(teslim["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y").fillna("")
        st.dataframe(teslim[["Müşteri Adı", "Ülke", "Proforma No", "Tarih", "Tutar", "Vade (gün)", "Açıklama"]], use_container_width=True)
    else:
        st.info("Teslim edilmiş sipariş yok.")

# === Vade Takibi (Evraklar) ===
st.markdown("#### 💰 Vade Takibi")
if not df_evrak.empty and "Vade Tarihi" in df_evrak.columns:
    df_evrak["Vade Tarihi"] = pd.to_datetime(df_evrak["Vade Tarihi"], errors="coerce")
    bugun = pd.to_datetime(datetime.date.today())

    df_evrak["Durum_Vade"] = np.where(
        (df_evrak["Vade Tarihi"].notna()) & (df_evrak["Vade Tarihi"] < bugun),
        "❌ Gecikmiş",
        "✅ Beklemede"
    )

    toplam_bekleyen = df_evrak[df_evrak["Durum_Vade"] == "✅ Beklemede"]["Tutar"].sum()
    toplam_geciken  = df_evrak[df_evrak["Durum_Vade"] == "❌ Gecikmiş"]["Tutar"].sum()

    st.markdown(f"<div style='font-size:1.1em;color:#2196f3;font-weight:bold;'>Beklemede: {toplam_bekleyen:,.2f} $</div>", unsafe_allow_html=True)
    st.markdown(f"<div style='font-size:1.1em;color:#e53935;font-weight:bold;'>Gecikmiş: {toplam_geciken:,.2f} $</div>", unsafe_allow_html=True)

    st.dataframe(df_evrak[["Müşteri Adı", "Proforma No", "Fatura No", "Vade Tarihi", "Tutar", "Durum_Vade"]], use_container_width=True)
else:
    st.info("Evraklar tablosunda Vade Tarihi bilgisi yok.")

st.markdown("<hr>", unsafe_allow_html=True)
st.info("Detaylar için CRM ana uygulamasına geçebilirsiniz.")
