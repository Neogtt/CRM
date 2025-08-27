# crm_dashboard.py
import streamlit as st
import pandas as pd
import numpy as np
import datetime
import os

# ======================
# CONFIG
# ======================
st.set_page_config(page_title="ŞEKEROĞLU CRM Özet", layout="wide")

SHEET_URL = "https://docs.google.com/spreadsheets/d/1F6CN4oHEMk6IEE40ZGixPkfnNHLYXnQ/export?format=xlsx"
LOCAL_FILE = "D:/APP/temp.xlsx"

USERS = {"Boss": "Seker12345!"}
bugun = datetime.date.today()

# ======================
# LOGIN
# ======================
if "user" not in st.session_state:
    st.session_state.user = None

def login_screen():
    st.title("ŞEKEROĞLU CRM - Özet Giriş")
    u = st.text_input("Kullanıcı Adı")
    p = st.text_input("Şifre", type="password")
    if st.button("Giriş Yap"):
        if u in USERS and p == USERS[u]:
            st.session_state.user = u
            st.rerun()
        else:
            st.error("Kullanıcı adı veya şifre hatalı.")

if not st.session_state.user:
    login_screen()
    st.stop()

# ======================
# LOAD DATA
# ======================
def load_data():
    df_proforma, df_evrak, df_eta = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    # Öncelik: Drive’daki Excel
    try:
        xl = pd.ExcelFile(SHEET_URL)
        if "Proformalar" in xl.sheet_names:
            df_proforma = xl.parse("Proformalar")
        if "Evraklar" in xl.sheet_names:
            df_evrak = xl.parse("Evraklar")
        if "ETA" in xl.sheet_names:
            df_eta = xl.parse("ETA")
    except Exception as e:
        st.warning(f"Google Drive Excel okunamadı: {e}")

    # Eğer boşsa local fallback
    if (df_proforma.empty or df_evrak.empty or df_eta.empty) and os.path.exists(LOCAL_FILE):
        xl = pd.ExcelFile(LOCAL_FILE)
        if df_proforma.empty and "Proformalar" in xl.sheet_names:
            df_proforma = xl.parse("Proformalar")
        if df_evrak.empty and "Evraklar" in xl.sheet_names:
            df_evrak = xl.parse("Evraklar")
        if df_eta.empty and "ETA" in xl.sheet_names:
            df_eta = xl.parse("ETA")

    return df_proforma, df_evrak, df_eta

df_proforma, df_evrak, df_eta = load_data()

# ======================
# ÖZET DASHBOARD
# ======================
st.title("📊 CRM Özet Dashboard")

# --- BEKLEYEN PROFORMALAR ---
st.markdown("### 📑 Bekleyen Proformalar")
if not df_proforma.empty:
    bekleyen = df_proforma[df_proforma["Durum"] == "Beklemede"].copy()
    if not bekleyen.empty:
        bekleyen["Tarih"] = pd.to_datetime(bekleyen["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y")
        toplam = pd.to_numeric(bekleyen["Tutar"], errors="coerce").sum()
        st.metric("Bekleyen Tutar", f"{toplam:,.2f} $")
        st.dataframe(bekleyen[["Müşteri Adı","Proforma No","Tarih","Tutar","Açıklama"]], use_container_width=True)
    else:
        st.info("Bekleyen proforma yok.")
else:
    st.warning("Proforma verisi bulunamadı.")

# --- VADE TAKİBİ (EVRAKLAR) ---
st.markdown("### 💰 Vade Takibi")
if not df_evrak.empty:
    df_evrak["Fatura Tarihi"] = pd.to_datetime(df_evrak.iloc[:,2], errors="coerce")  # C sütunu
    df_evrak["Vade Tarihi"]   = pd.to_datetime(df_evrak.iloc[:,3], errors="coerce")  # D sütunu
    df_evrak["Tutar"]         = pd.to_numeric(df_evrak.iloc[:,4], errors="coerce")  # E sütunu
    df_evrak["Ödendi"]        = df_evrak.iloc[:,14]  # O sütunu
    vade = df_evrak[(df_evrak["Ödendi"] != True) & (df_evrak["Vade Tarihi"].notna())].copy()

    vade["Kalan Gün"] = (vade["Vade Tarihi"].dt.date - bugun).dt.days

    def renk_vade(val):
        if pd.isna(val): return ""
        if val < 0: return "color: red; font-weight:bold;"
        if val <= 7: return "color: orange; font-weight:bold;"
        return "color: green;"

    st.dataframe(
        vade[["Müşteri Adı","Proforma No","Fatura No","Vade Tarihi","Tutar","Kalan Gün"]]
        .style.map(renk_vade, subset=["Kalan Gün"]),
        use_container_width=True
    )
else:
    st.warning("Evraklar sayfası boş.")

# --- ETA TAKİBİ ---
st.markdown("### 🛳️ ETA Takibi")
if not df_eta.empty:
    df_eta["ETA Tarihi"] = pd.to_datetime(df_eta.iloc[:,1], errors="coerce")  # B sütunu
    df_eta["Kalan Gün"]  = (df_eta["ETA Tarihi"].dt.date - bugun).dt.days

    def renk_eta(val):
        if pd.isna(val): return ""
        if val < 0: return "color: red; font-weight:bold;"
        if val <= 7: return "color: orange; font-weight:bold;"
        return "color: green;"

    df_eta["ETA Günü"] = df_eta["ETA Tarihi"].dt.strftime("%d/%m/%Y")
    st.dataframe(
        df_eta[["Müşteri Adı","Proforma No","ETA Günü","Kalan Gün","Açıklama"]]
        .style.map(renk_eta, subset=["Kalan Gün"]),
        use_container_width=True
    )
else:
    st.warning("ETA sayfası boş.")
